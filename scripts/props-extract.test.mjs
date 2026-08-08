/**
 * Guards on `extractComponent`'s two rendering modes.
 *
 * The extractor grew up serving one consumer — the markdown API pages — so it
 * bakes presentation into its output: backticked type members, page-relative
 * links for the shared value unions, and a `**Deprecated.**` prefix folded into
 * the description. `markdown: false` exists for the MCP index, which is JSON
 * and can carry those as fields instead.
 *
 * The failure mode worth guarding is silent: markdown mode drifting. Nothing in
 * a diff review distinguishes "the flag threaded correctly" from "the flag
 * changed the default path too" — `pnpm gen:api-docs:check` catches it in CI,
 * but only after a full 87-page regeneration. These assertions pin the contract
 * directly, both directions.
 *
 * `.mjs` and `node --test` rather than jest: these are root-level scripts with
 * no package of their own, matching how docs/scripts is covered.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractComponent } from './lib/props-extract.mjs';

// One Program construction dominates this file's runtime (~3 s), and
// extractComponent caches it — so extract each fixture once, up front.
const row = (component, name, opts) =>
  extractComponent(component, opts).tables[0].rows.find(r => r.name === name);

test('markdown mode is the default and still renders code spans', () => {
  const color = row('Button', 'color');
  assert.match(color.type, /^`'primary'`/);
  assert.ok(color.type.includes('` | `'), 'members joined by raw pipes');
  // Explicitly passing the default must be indistinguishable from omitting it.
  assert.equal(row('Button', 'color', { markdown: true }).type, color.type);
});

test('structured mode drops code spans from types', () => {
  const color = row('Button', 'color', { markdown: false });
  assert.ok(!color.type.includes('`'), `unescaped type, got ${color.type}`);
  assert.equal(color.type.split(' | ')[0], "'primary'");
});

test('a TYPE_DISPLAY union becomes a label plus a structured valuesRef', () => {
  // `(typeof validColors)[number]` is 19 members — unreadable inlined, so both
  // modes substitute. Markdown can link to the page; JSON cannot.
  const md = row('Columns', 'textColor');
  const structured = row('Columns', 'textColor', { markdown: false });

  assert.ok(md.type.includes('](../helpers/valid-values.md)'));
  assert.equal(md.valuesRef, undefined, 'markdown rows carry no extra fields');

  assert.ok(!structured.type.includes(']('), 'no markdown link survives');
  assert.ok(structured.type.startsWith('Bulma color'));
  assert.equal(structured.valuesRef, 'helpers/valid-values');
});

test('@deprecated moves from the description into its own fields', () => {
  const md = row('Tabs', 'color');
  const structured = row('Tabs', 'color', { markdown: false });

  assert.ok(md.description.startsWith('**Deprecated.** '));

  assert.equal(structured.deprecated, true);
  assert.ok(!structured.description.includes('**Deprecated.**'));
  assert.ok(structured.deprecationNote.length > 0);
  // The description keeps only what the prop actually does.
  assert.ok(md.description.endsWith(structured.description));
});

test('a prop with no @deprecated tag reports it as absent, not missing', () => {
  const isLight = row('Button', 'isLight', { markdown: false });
  assert.equal(isLight.deprecated, false);
  assert.equal(isLight.deprecationNote, null);
  assert.equal(isLight.valuesRef, null);
});

test('the catch-all row loses its code spans in structured mode', () => {
  const md = extractComponent('Button').tables[0].catchAll;
  const structured = extractComponent('Button', { markdown: false }).tables[0]
    .catchAll;

  assert.equal(
    md.text,
    'All standard `<button>` attributes and Bulma helper props'
  );
  assert.equal(
    structured.text,
    'All standard <button> attributes and Bulma helper props'
  );
  assert.equal(structured.helpers, md.helpers);
});

test('defaults, inheritance and compound sub-paths are mode-independent', () => {
  // The flag is presentation-only: it must not change which props are found,
  // which table they land in, or what their defaults resolve to.
  for (const name of ['Button', 'Navbar', 'Table']) {
    const md = extractComponent(name);
    const structured = extractComponent(name, { markdown: false });

    assert.deepEqual(
      structured.tables.map(t => t.path),
      md.tables.map(t => t.path),
      `${name} sub-paths differ`
    );
    for (const [i, table] of md.tables.entries()) {
      assert.deepEqual(
        structured.tables[i].rows.map(r => [r.name, r.default, r.inherited]),
        table.rows.map(r => [r.name, r.default, r.inherited]),
        `${name} ${table.path} rows differ`
      );
    }
    assert.equal(structured.rootClass, md.rootClass);
  }
});

test('structured mode leaks no markdown into any documented component', () => {
  // The whole point of the mode. A single escaped cell anywhere reaches an
  // agent as literal backticks in a type it is about to write into source.
  for (const name of ['Avatar', 'Slider', 'Columns', 'Grid', 'DateInput']) {
    for (const table of extractComponent(name, { markdown: false }).tables) {
      for (const r of [...table.rows, ...table.extraProps]) {
        assert.ok(
          !r.type.includes('`') && !r.type.includes(']('),
          `${name}.${r.name} type is escaped: ${r.type}`
        );
      }
    }
  }
});
