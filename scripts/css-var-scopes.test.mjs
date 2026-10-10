/**
 * Hold every claim about where a Bulma CSS variable can be set to Bulma's
 * compiled stylesheet.
 *
 * A custom property inherits only as a fallback: an element that declares a
 * variable itself uses its own value, whatever `:root`, a `Theme` or any
 * other ancestor sets. So "can I set this from above?" has one answer per
 * variable, and the stylesheet gives it. Two surfaces answered it from
 * somewhere else and got it wrong (#1021):
 *
 * - The API pages. `scss-vars.mjs` read the body of Bulma's `@mixin delete`
 *   as a global home, so Delete's page said its variables could be
 *   overridden "anywhere above the component". Bulma declares them on
 *   `.delete` itself, and a wrapper setting `--bulma-delete-dimensions` still
 *   draws the stock 20px button.
 * - `Theme`. It accepted those keys, and every other variable Bulma declares
 *   on a component's own element, as if writing them on its wrapper or at
 *   `:root` did something.
 *
 * HOW A VARIABLE IS JUDGED, from `lib/compiled-css-vars.mjs`: a value set on
 * an ancestor reaches the plain component when Bulma declares the variable on
 * a variables host (`:root`, a theme scope), or when nothing declares it on
 * the component in its plain state, so only a modifier class or a state does
 * and the unmodified element inherits. It does not reach when the plain
 * component declares its own value. "Plain" means a selector with no `is-`,
 * `has-` or `are-` class, no pseudo-class and no attribute test, outside any
 * `@media` or `@container`. Those rules were checked against headless
 * Chromium for the cases pinned in the first block below, which is what
 * makes the stylesheet a stand-in for the browser here.
 *
 * The API-page half reads the rows each page is rendered from
 * (`cssVarRows`), which `check:conformance` already holds the committed
 * pages to, and checks every row the page presents as global against the
 * stylesheet, and every other Bulma row the other way. The renderer half
 * checks that a row whose scope differs from the page's lead is always
 * marked, because a missing marker states the lead's scope for that row.
 */
import { readFile } from 'node:fs/promises';
import { relative, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  bulmaCss,
  customPropertyDeclarations,
  isHostSelector,
  isPlainSelector,
  reachesFromAncestor,
  variableHomes,
} from './lib/compiled-css-vars.mjs';
import { themeVars } from './lib/theme-vars.mjs';
import { mdFiles } from './lib/api-catalog.mjs';
import { frontmatterTitle, readRegions } from './lib/api-page.mjs';
import { extractComponent } from './lib/props-extract.mjs';
import {
  CSS_VAR_SCOPE_ORDER,
  cssVarRows,
  cssVarScopeGaps,
  cssVarScopeText,
  renderCssVarRows,
} from './gen-api-docs.mjs';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const API_DIR = join(REPO, 'docs', 'docs', 'api');

const homes = variableHomes(bulmaCss());
const reaches = name => reachesFromAncestor(homes.get(name));

// --- the rule, pinned to what the browser does ------------------------------

describe('reading the compiled stylesheet', () => {
  it('matches what headless Chromium showed for each kind of home', () => {
    // A wrapper setting each of these was rendered over the real bulma.css:
    // the delete button and the box kept Bulma's values, while the skeleton,
    // the column, the input and the grid cell took the wrapper's.
    assert.equal(
      reaches('--bulma-delete-dimensions'),
      false,
      'mixin on .delete'
    );
    assert.equal(reaches('--bulma-box-radius'), false, 'declared on .box');
    assert.equal(reaches('--bulma-skeleton-radius'), true, 'declared on :root');
    assert.equal(reaches('--bulma-column-gap'), true, ':root, and modifiers');
    assert.equal(reaches('--bulma-control-height'), true, 'declared on :root');
    assert.equal(
      reaches('--bulma-grid-cell-column-start'),
      true,
      'declared only on .cell.is-col-start-* modifiers'
    );
  });

  it('lets a host declaration win over a component that also declares it', () => {
    // `--bulma-block-spacing` is on `:root` and again on `.field`: a value set
    // above reaches every block but a field, which is "global" for Theme.
    const home = homes.get('--bulma-block-spacing');
    assert.deepEqual(home, { onHost: true, onPlain: true });
    assert.equal(reachesFromAncestor(home), true);
  });

  it('treats a variable the stylesheet never declares as inherited', () => {
    assert.equal(reachesFromAncestor(undefined), true);
  });

  it('reads declarations past comments, strings and at-rules', () => {
    const css = `
/* .x { --c: 1; } */
:root { --a: "}"; --b: 1 }
@layer base { .card { --card: 1; } }
@media (min-width: 1px) { .box { --box: 1; } }
.tag.is-small, .tag:hover { --tag: 1; }
.unterminated { --s: "x
`;
    const decls = customPropertyDeclarations(css);
    assert.deepEqual(
      decls.map(d => [d.name, d.selectors.join(' | '), d.conditional]),
      [
        ['--a', ':root', false],
        ['--b', ':root', false],
        ['--card', '.card', false],
        ['--box', '.box', true],
        ['--tag', '.tag.is-small | .tag:hover', false],
      ]
    );
    const h = variableHomes(css);
    assert.deepEqual(h.get('--card'), { onHost: false, onPlain: true });
    assert.deepEqual(h.get('--box'), { onHost: false, onPlain: false });
    assert.deepEqual(h.get('--tag'), { onHost: false, onPlain: false });
    // A declaration outside any rule has no selector to judge.
    assert.deepEqual(customPropertyDeclarations('--stray: 1;'), []);
  });

  it('knows the variables hosts and the plain selectors', () => {
    for (const host of [
      ':root',
      'html',
      ':where(html)',
      '[data-theme=dark]',
      '.theme-light',
    ]) {
      assert.ok(isHostSelector(host), host);
    }
    assert.ok(!isHostSelector('.delete'));
    assert.ok(isPlainSelector('.fixed-grid > .grid'));
    for (const modified of [
      '.delete.is-small',
      '.buttons.are-small',
      '.columns.has-gap',
      '.tag:hover',
      'input[type=text]',
    ]) {
      assert.ok(!isPlainSelector(modified), modified);
    }
  });
});

// --- the API pages ----------------------------------------------------------

/** Every component page with a CSS & Sass Variables region, and its rows. */
async function pageRows() {
  const out = [];
  for (const file of await mdFiles(API_DIR)) {
    const src = await readFile(file, 'utf8');
    const title = frontmatterTitle(src);
    if (!title || !readRegions(src, file).has('cssvars')) continue;
    const rel = relative(API_DIR, file).split('\\').join('/');
    const info = extractComponent(title, {
      depth: rel.split('/').length - 1,
    });
    out.push({
      page: `docs/docs/api/${rel}`,
      rootClass: info.rootClass,
      rows: await cssVarRows(info),
    });
  }
  return out;
}

describe('API pages say where each Bulma variable can be set', () => {
  let pages;
  before(async () => {
    pages = await pageRows();
  });

  it('call a variable global only when Bulma declares it on :root', () => {
    let checked = 0;
    const wrong = [];
    for (const { page, rows } of pages) {
      for (const row of rows.filter(r => r.scope === 'global')) {
        checked++;
        if (row.pkg !== 'bulma') {
          wrong.push(
            `${page}: ${row.cssVar} comes from this repo's own SCSS, which ` +
              'this check has no compiled copy of. Extend it to read the ' +
              'built extras before calling one of those global.'
          );
        } else if (!homes.get(row.cssVar)?.onHost) {
          wrong.push(
            `${page}: ${row.cssVar} is presented as global (settable from ` +
              "any ancestor), but Bulma's compiled CSS declares it only on " +
              'component selectors, so a value set above never reaches it.'
          );
        }
      }
    }
    assert.ok(checked > 0, 'no page has a global row, so nothing was checked');
    assert.deepEqual(wrong, []);
  });

  it('say an ancestor loses only where Bulma declares the variable on the component', () => {
    let checked = 0;
    const wrong = [];
    for (const { page, rows } of pages) {
      for (const row of rows) {
        if (row.scope === 'global' || row.pkg !== 'bulma') continue;
        checked++;
        if (!homes.get(row.cssVar)?.onPlain) {
          wrong.push(
            `${page}: ${row.cssVar} is presented as declared on the ` +
              `component (${row.scope}), but Bulma's compiled CSS does not ` +
              'declare it on the plain component, so an ancestor value does ' +
              'reach it.'
          );
        }
      }
    }
    assert.ok(checked > 0, 'no page has a component-scoped Bulma row');
    assert.deepEqual(wrong, []);
  });

  it("say root and mixin variables are on the component's own class", () => {
    // Stricter than the check above, which accepts any plain declaration:
    // a `root` or `mixin` row tells the reader the component's own element
    // declares it, so the compiled CSS has to declare it on that class,
    // unconditionally. A mixin claimed by name alone (a size mixin, which
    // only lands on modifiers) would fail here.
    const ownClass = new Map();
    for (const { name, selectors, conditional } of customPropertyDeclarations(
      bulmaCss()
    )) {
      if (conditional) continue;
      if (!ownClass.has(name)) ownClass.set(name, new Set());
      for (const selector of selectors) ownClass.get(name).add(selector);
    }
    let checked = 0;
    const wrong = [];
    for (const { page, rootClass, rows } of pages) {
      for (const row of rows) {
        if (row.pkg !== 'bulma') continue;
        if (row.scope !== 'root' && row.scope !== 'mixin') continue;
        checked++;
        if (!ownClass.get(row.cssVar)?.has(`.${rootClass}`)) {
          wrong.push(
            `${page}: ${row.cssVar} is presented as declared on ` +
              `\`.${rootClass}\` (${row.scope}), but Bulma's compiled CSS ` +
              'never declares it on that class by itself.'
          );
        }
      }
    }
    assert.ok(checked > 0, 'no page has a root or mixin Bulma row');
    assert.deepEqual(wrong, []);
  });

  it("give Delete's mixin-declared variables their own scope", () => {
    const rows = pages.find(p => p.page.endsWith('/delete.md'))?.rows ?? [];
    assert.ok(rows.length > 0, 'Delete has no CSS variable rows');
    assert.ok(rows.every(r => r.scope === 'mixin'));
    const dimensions = rows.find(r => r.cssVar === '--bulma-delete-dimensions');
    assert.deepEqual(dimensions?.modifiers, [
      '.delete.is-small',
      '.delete.is-medium',
      '.delete.is-large',
    ]);
  });
});

// --- the renderer -----------------------------------------------------------

describe('a CSS variable table', () => {
  const info = { name: 'Thing', rootClass: 'thing' };
  const text = cssVarScopeText(info, [], 'theme.md');
  // Every scope the generator has a lead for, so a scope added there is
  // covered here without anyone remembering to list it.
  const SCOPES = Object.keys(text.leads);
  const row = (scope, n) => ({
    scope,
    cssVar: `--bulma-thing-${n}`,
    sassVar: null,
    value: '1px',
  });
  const cell = (out, n) =>
    out.split('\n').find(l => l.includes(`\`--bulma-thing-${n}\``)) ?? '';

  it('gives every scope a lead, a marker, a note and a place in the order', () => {
    assert.deepEqual(cssVarScopeGaps(text, SCOPES), []);
    assert.deepEqual(cssVarScopeGaps(text, CSS_VAR_SCOPE_ORDER), []);
    assert.deepEqual([...CSS_VAR_SCOPE_ORDER].sort(), [...SCOPES].sort());
    const markers = Object.values(text.markers);
    assert.equal(new Set(markers).size, markers.length, 'a marker is shared');
  });

  it('reports a scope that has only a lead', () => {
    const leadOnly = {
      ...text,
      leads: { ...text.leads, extra: 'Extra lead.' },
    };
    assert.deepEqual(cssVarScopeGaps(leadOnly, ['extra', 'root']), [
      'extra (no marker, no note, no place in the order)',
    ]);
    // Inherited names are not wording.
    assert.deepEqual(cssVarScopeGaps(text, ['constructor']), [
      'constructor (no lead, no marker, no note, no place in the order)',
    ]);
  });

  it('marks every row whose scope differs from the lead', () => {
    for (const a of SCOPES) {
      for (const b of SCOPES) {
        if (a === b) continue;
        const out = renderCssVarRows(
          info,
          [row(a, 'a'), row(b, 'b')],
          'theme.md'
        );
        const lead = CSS_VAR_SCOPE_ORDER.find(s => s === a || s === b);
        const other = lead === a ? b : a;
        const [leadRow, otherRow] = lead === a ? ['a', 'b'] : ['b', 'a'];
        assert.ok(out.includes(text.leads[lead]), `${a}+${b}: lead`);
        assert.ok(
          cell(out, otherRow).includes(`\` ${text.markers[other]}`),
          `${a}+${b}: the ${other} row is unmarked:\n${out}`
        );
        assert.ok(
          !Object.values(text.markers).some(m =>
            cell(out, leadRow).includes(`\` ${m}`)
          ),
          `${a}+${b}: the ${lead} row is marked:\n${out}`
        );
        assert.ok(out.includes(text.notes[other]), `${a}+${b}: note`);
        assert.doesNotMatch(out, /undefined/);
      }
    }
  });

  it('renders every row with its wording whichever scope leads', () => {
    // The order only picks the lead. Each rotation puts a different scope
    // first, and every other row must still carry its own marker and note,
    // which is what failed silently for `root` before it had any.
    const rows = SCOPES.map(s => row(s, s));
    for (let i = 0; i < CSS_VAR_SCOPE_ORDER.length; i++) {
      const order = [
        ...CSS_VAR_SCOPE_ORDER.slice(i),
        ...CSS_VAR_SCOPE_ORDER.slice(0, i),
      ];
      const out = renderCssVarRows(info, rows, 'theme.md', { order });
      assert.ok(out.includes(text.leads[order[0]]), order.join(','));
      for (const s of order.slice(1)) {
        assert.ok(cell(out, s).includes(`\` ${text.markers[s]}`), s);
        assert.ok(out.includes(text.notes[s]), s);
      }
      assert.doesNotMatch(out, /undefined/);
    }
  });

  it('refuses a scope it cannot word, or an order that leaves one out', () => {
    assert.throws(
      () => renderCssVarRows(info, [row('somewhere', 'a')], 'theme.md'),
      /incomplete wording for CSS-variable scope\(s\): somewhere \(no lead, no marker, no note, no place in the order\)/
    );
    assert.throws(
      () =>
        renderCssVarRows(info, [row('root', 'a'), row('mixin', 'b')], 'x', {
          order: ['root', 'global'],
        }),
      /mixin \(no place in the order\)/
    );
  });

  it('tells a reader to set mixin-declared variables on the element', () => {
    const out = renderCssVarRows(
      { name: 'Delete', rootClass: 'delete' },
      [{ ...row('mixin', 'a'), modifiers: ['.delete.is-small'] }],
      'theme.md'
    );
    assert.match(out, /on the `\.delete` element itself/);
    assert.match(out, /never reaches them/);
    assert.match(out, /again on `\.delete\.is-small`/);
    assert.doesNotMatch(out, /anywhere above/);
  });

  it('names the modifiers in a list and leaves them out when there are none', () => {
    const many = renderCssVarRows(
      info,
      [{ ...row('mixin', 'a'), modifiers: ['.thing.is-a', '.thing.is-b'] }],
      'theme.md'
    );
    assert.match(many, /`\.thing\.is-a` and `\.thing\.is-b`/);
    const none = renderCssVarRows(
      { name: 'Thing' },
      [row('mixin', 'a')],
      'theme.md'
    );
    assert.match(
      none,
      /on the `Thing` element itself, through a mixin its rule includes\. /
    );
  });

  it('renders nothing for a component with no rows', () => {
    assert.equal(renderCssVarRows(info, [], 'theme.md'), null);
  });
});

// --- Theme ------------------------------------------------------------------

describe("Theme's two variable lists", () => {
  const { global, component } = themeVars();

  it('keep a key in only one of them', () => {
    const both = global.filter(k => component.includes(k));
    assert.deepEqual(both, []);
  });

  it('hold only variables a value set on an ancestor reaches, in bulmaGlobalVars', () => {
    assert.deepEqual(
      global.filter(k => !reaches(k)),
      [],
      'Bulma declares these on the component itself, so Theme cannot set ' +
        'them: move them to bulmaComponentVars in Theme.tsx.'
    );
  });

  it('hold only variables Bulma declares on the component, in bulmaComponentVars', () => {
    assert.deepEqual(
      component.filter(k => reaches(k)),
      [],
      'A value set on an ancestor reaches these, so Theme can set them: ' +
        'move them to bulmaGlobalVars in Theme.tsx.'
    );
  });

  it('are read from the source, or the read fails', () => {
    assert.throws(() => themeVars('const nothing = 1;'), /bulmaGlobalVars/);
    const tuples =
      "\nconst bulmaGlobalVars = [\n  '--bulma-a',\n] as const;" +
      "\nconst bulmaComponentVars = [\n  '--bulma-b',\n] as const;";
    assert.throws(() => themeVars(tuples), /no longer builds `bulmaCssVars`/);
    const empty =
      '\nconst bulmaGlobalVars = [\n  // nothing\n] as const;' +
      "\nconst bulmaComponentVars = [\n  '--bulma-b',\n] as const;";
    assert.throws(() => themeVars(empty), /read as empty/);
    const whole = `${tuples}\nconst bulmaCssVars = [...bulmaGlobalVars, ...bulmaComponentVars] as const;`;
    assert.deepEqual(themeVars(whole).all, ['--bulma-a', '--bulma-b']);
  });

  it('reads every key, however a line is written, or fails', () => {
    const spread =
      'const bulmaCssVars = [...bulmaGlobalVars, ...bulmaComponentVars] as const;';
    const source = (global, component = "  '--bulma-z',") =>
      `\nconst bulmaGlobalVars = [\n${global}\n] as const;` +
      `\nconst bulmaComponentVars = [\n${component}\n] as const;\n${spread}`;
    // A trailing comment, a block comment, a double-quoted key and a last
    // key with no comma all still count. A per-line read dropped the first
    // and the last without a word.
    assert.deepEqual(
      themeVars(
        source(
          [
            "  '--bulma-a', // only used by the wrapper",
            '  /* a section */ "--bulma-b",',
            "  '--bulma-c'",
          ].join('\n')
        )
      ).global,
      ['--bulma-a', '--bulma-b', '--bulma-c']
    );
    // An entry that is not one quoted key is refused rather than skipped.
    assert.throws(
      () => themeVars(source("  '--bulma-a',\n  ...others,")),
      /could not read `\.\.\.others` in the `bulmaGlobalVars` tuple/
    );
    assert.throws(
      () => themeVars(source("  '--bulma-a', '--bulma-b' as string,")),
      /could not read `'--bulma-b' as string`/
    );
  });
});
