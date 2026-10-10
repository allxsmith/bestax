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
  cssVarRows,
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
    out.push({ page: `docs/docs/api/${rel}`, rows: await cssVarRows(info) });
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
  const SCOPES = ['root', 'global', 'mixin', 'element', 'compound'];
  const info = { name: 'Thing', rootClass: 'thing' };
  const row = (scope, n) => ({
    scope,
    cssVar: `--bulma-thing-${n}`,
    sassVar: null,
    value: '1px',
  });

  const MARKERS = Object.values(cssVarScopeText(info, [], 'x').markers);

  it('marks every row whose scope differs from the lead', () => {
    for (const a of SCOPES) {
      for (const b of SCOPES) {
        if (a === b) continue;
        const out = renderCssVarRows(
          info,
          [row(a, 'a'), row(b, 'b')],
          'theme.md'
        );
        const lines = out.split('\n');
        const cell = n =>
          lines.find(l => l.includes(`\`--bulma-thing-${n}\``)) ?? '';
        // Exactly one of the two rows is the lead's; the other is marked.
        const marked = [cell('a'), cell('b')].filter(l =>
          MARKERS.some(m => l.includes(`\` ${m}`))
        );
        assert.equal(marked.length, 1, `${a} with ${b}:\n${out}`);
      }
    }
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

  it('refuses a scope it has no wording for', () => {
    assert.throws(
      () => renderCssVarRows(info, [row('somewhere', 'a')], 'theme.md'),
      /no wording for CSS-variable scope\(s\) somewhere/
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
});
