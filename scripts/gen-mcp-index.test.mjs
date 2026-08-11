/**
 * Guards on the MCP index generator.
 *
 * This index is what an agent reads INSTEAD of the source, so its failure modes
 * are quiet and downstream: a leaked backtick becomes literal backticks in
 * generated JSX, a missing component becomes a component the agent reinvents by
 * hand, and non-determinism turns the CI staleness gate into noise everyone
 * learns to re-run. None of those show up in a diff review of the generator —
 * the code reads fine either way — so the assertions here are written around
 * the consequence.
 *
 * Runs the real extraction (no fixtures): the contract worth testing is the one
 * against the actual library, and the TypeScript Program it needs is built once
 * and cached.
 *
 * `.mjs` and `node --test` rather than jest: these are root-level scripts with
 * no package of their own, matching how docs/scripts is covered.
 */
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from './gen-mcp-index.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

let catalog;
let components;
let skills;

before(async () => {
  ({ catalog, components, skills } = await build());
});

test('the catalog pins the library version it was generated from', async () => {
  const pkg = JSON.parse(
    await readFile(join(REPO, 'bulma-ui', 'package.json'), 'utf8')
  );
  assert.equal(catalog.generatedFrom.package, '@allxsmith/bestax-bulma');
  assert.equal(catalog.generatedFrom.version, pkg.version);
  assert.equal(typeof catalog.schemaVersion, 'number');
});

test('every exported component reaches the index', () => {
  // The completeness guard in main() fails the build on this; assert it here
  // too so the reason is visible without reading a process exit code.
  assert.ok(components.size >= 80, `only ${components.size} components`);
  for (const name of ['Button', 'Navbar', 'Field', 'Columns', 'Hero']) {
    assert.ok(components.has(name), `${name} missing from the index`);
  }
  assert.equal(catalog.components.length, components.size);
});

test('no markdown escaping leaks into props', () => {
  // The whole reason props-extract grew a structured mode.
  for (const [name, record] of components) {
    for (const part of record.parts) {
      for (const p of [...part.props, ...part.extraProps]) {
        assert.ok(
          !p.type.includes('`') && !p.type.includes(']('),
          `${name}.${part.path}.${p.name} type is escaped: ${p.type}`
        );
      }
      if (part.catchAll) {
        assert.ok(
          !part.catchAll.includes('`'),
          `${name} catch-all is escaped: ${part.catchAll}`
        );
      }
    }
  }
});

test('compound families keep every dot-path, including table-less subs', () => {
  const navbar = components.get('Navbar');
  const paths = navbar.parts.map(p => p.path);
  assert.ok(paths.includes('Navbar'), 'root part missing');
  assert.ok(paths.includes('Navbar.Brand'));
  // `Navbar.Divider` types its props inline rather than via a `*Props`
  // interface. It has no table, but dropping it would hide the sub-component.
  const divider = navbar.parts.find(p => p.path === 'Navbar.Divider');
  assert.ok(divider, 'Navbar.Divider missing');
  assert.deepEqual(divider.props, []);
  assert.ok(divider.summary.length > 0, 'sub-components keep their summary');

  // A sub re-exported standalone names its own export, so the server can point
  // at that component instead of restating 25 rows.
  const thead = components
    .get('Table')
    .parts.find(p => p.path === 'Table.Thead');
  assert.equal(thead.component, 'Thead');
});

test('helper pages ship as prose, not as an empty props table', () => {
  // Four of the six helpers/ pages use `## API` with a signature block and have
  // no props interface at all — an empty table would read as "no props".
  const hook = components.get('useBulmaClasses');
  assert.equal(hook.kind, 'helper');
  assert.deepEqual(hook.parts, []);
  assert.ok(hook.doc.length > 1000, 'helper doc body is missing');
  assert.ok(!hook.doc.startsWith('---'), 'frontmatter must be stripped');
});

test('usage examples are harvested with their headings', () => {
  const button = components.get('Button');
  assert.ok(button.examples.length > 10, 'Button examples missing');
  for (const ex of button.examples) {
    assert.ok(ex.title, 'example has no heading');
    assert.ok(ex.code.trim(), 'example has no code');
    assert.ok(!ex.code.includes('```'), 'fence markers leaked into the code');
  }
  const total = [...components.values()].reduce(
    (n, c) => n + c.examples.length,
    0
  );
  assert.ok(total > 500, `only ${total} examples across the library`);
});

test('CSS variables are indexed back to their component', () => {
  const button = components.get('Button');
  assert.ok(button.cssVars.length > 0);
  const row = button.cssVars.find(v => v.css === '--bulma-button-h');
  assert.ok(row, '--bulma-button-h missing');
  assert.equal(catalog.cssVarIndex['--bulma-button-h'], 'Button');
  for (const v of button.cssVars) {
    assert.match(v.css, /^--/);
    assert.ok(['component', 'global'].includes(v.scope));
  }
});

test('related components resolve to real component names', () => {
  // Resolved through the target page's frontmatter, not the link text, so a
  // pluralised or lower-cased link still yields something the server can look up.
  const button = components.get('Button');
  assert.ok(button.related.includes('Buttons'));
  for (const [name, record] of components) {
    for (const rel of record.related) {
      assert.ok(
        components.has(rel),
        `${name} links to "${rel}", which is not in the index`
      );
    }
  }
});

test('the skills roster is read from the directory, not a hardcoded list', () => {
  assert.ok(skills.skills.length >= 7, 'skills missing');
  const names = skills.skills.map(s => s.name);
  assert.ok(names.includes('bestax-theming'));
  assert.deepEqual([...names].sort(), names, 'skills are not sorted');
  for (const s of skills.skills) {
    assert.ok(
      s.description.length > 40,
      `${s.name} has no trigger description`
    );
    assert.equal(s.promptName, s.name.replace(/^bestax-/, ''));
    assert.ok(Array.isArray(s.references));
  }
  const theming = skills.skills.find(s => s.name === 'bestax-theming');
  assert.ok(theming.references.some(r => r.id === 'css-variables'));
});

test('output is deterministic and code-point sorted', () => {
  const names = catalog.components.map(c => c.name);
  assert.deepEqual(
    [...names].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    names
  );
  const cssKeys = Object.keys(catalog.cssVarIndex);
  assert.deepEqual(
    [...cssKeys].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    cssKeys
  );
  for (const cat of catalog.categories) {
    assert.deepEqual(
      [...cat.components].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
      cat.components,
      `${cat.id} members are not sorted`
    );
  }
});
