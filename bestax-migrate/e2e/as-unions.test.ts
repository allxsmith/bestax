/**
 * `AS_UNIONS` decides which `as` values survive a migration, and it is a hand
 * written copy of unions that live in bulma-ui. A copy that drifts is worse
 * than no table at all: too narrow, and the codemod TODOs an `as` that would
 * have worked; too wide, and it emits output the user's project cannot
 * compile — which is the defect that #662 was.
 *
 * These run against the React types installed here, which are React 19's.
 * bulma-ui's peer range is `^18 || ^19`, so a row that differs between the
 * two majors is only half-checked by anything in this file -- `<style href>`
 * is the one known case, and it is excluded from the table for that reason.
 *
 * bulma-ui exports these as types, not as runtime constants, so no runtime
 * diff can check them. This generates one type assertion per row and hands it
 * to `tsc` against the built library, which makes drift in either direction a
 * failure here rather than in someone's project.
 */

import {
  AS_ANY_TARGETS,
  AS_UNIONS,
  HREF_ELEMENTS,
  HREF_TABLE,
  LINK_ATTR_TABLE,
  TARGET_LINK_ATTR_TABLE,
  declaresAs,
} from '../src/sources/_shared/polymorphic.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { typecheckTsx } from './support/typecheck-tsx.js';

const packageRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

const TARGETS = Object.keys(AS_UNIONS).sort();

/** `Level.Item` is reached through the `Level` its mapping target names. */
const importRoots = [...new Set(TARGETS.map(t => t.split('.')[0]))].sort();

function buildSource(): string {
  const rows = TARGETS.map((target, i) => {
    const union = AS_UNIONS[target].map(v => `'${v}'`).join(' | ');
    return `type _${i} = Assert<Exact<${union}, AsOf<typeof ${target}>>>; // ${target}`;
  });
  return [
    "import type { JSXElementConstructor } from 'react';",
    `import { ${importRoots.join(', ')} } from '@allxsmith/bestax-bulma';`,
    '',
    // Reach `as` through the props rather than `ComponentProps<C>['as']`:
    // several of these components type their props as a UNION of shapes, and
    // the `infer` distributes over it where an index access cannot.
    'type AsOf<C> = C extends JSXElementConstructor<infer P>',
    '  ? P extends { as?: infer A } ? NonNullable<A> : never',
    '  : never;',
    'type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;',
    'type Assert<T extends true> = T;',
    '',
    ...rows,
    '',
    'export {};',
  ].join('\n');
}

/**
 * tsc reports a row by line number, and a bare "Type 'false' does not satisfy
 * the constraint 'true'" says nothing about which component drifted. Quote
 * the generated line beside each diagnostic so the failure names the target.
 */
function annotate(diagnostics: string, source: string): string {
  const lines = source.split('\n');
  return diagnostics
    .split('\n')
    .map(line => {
      const at = /check\.tsx\((\d+),/.exec(line);
      const row = at && lines[Number(at[1]) - 1];
      return row ? `${line}\n    ↳ ${row.trim()}` : line;
    })
    .join('\n');
}

describe('AS_UNIONS matches the `as` each bestax component declares', () => {
  it('asserts every row against the library, in both directions', () => {
    const source = buildSource();
    const { status, diagnostics } = typecheckTsx(source, 'as-unions');
    expect({ status, diagnostics: annotate(diagnostics, source) }).toEqual({
      status: 0,
      diagnostics: '',
    });
  });

  it('covers every component the mappings can hand a narrowed `as`', () => {
    // A row removed by accident would make the assertion above pass while
    // the transform stopped guarding that component, so pin the set itself.
    expect(TARGETS).toEqual([
      'Control',
      'Dropdown.Item',
      'Footer',
      'Image',
      'Level.Item',
      'Media',
      'Media.Left',
      'SubTitle',
      'Title',
    ]);
  });
});

/**
 * `HREF_TABLE` and `AS_ANY_TARGETS` are the other two hand-written mirrors of
 * bulma-ui's types, and the more dangerous ones: they say what the codemod may
 * KEEP, so a row that is wrong in either direction ships output that does not
 * compile, or deletes an attribute that did.
 *
 * A type assertion cannot express "this element accepts this attribute", so
 * these assert by USE -- each row becomes the JSX it licenses, and tsc accepts
 * or rejects it exactly as a migrated project would.
 */
function buildHrefSource(): string {
  const rows: string[] = [];
  const roots = new Set<string>();
  for (const [target, defaultEl] of Object.entries(HREF_TABLE)) {
    roots.add(target.split('.')[0]);
    const i = rows.length;
    // Only where the component declares an `as` at all -- `Pagination.Link`
    // and `Panel.Block` are anchors outright and take no such prop.
    if (declaresAs(target)) {
      rows.push(
        `export const h${i} = <${target} as="a" href="#">{'x'}</${target}>; // ${target}: as="a"`
      );
    }
    if (defaultEl === 'a') {
      rows.push(
        `export const b${i} = <${target} href="#">{'x'}</${target}>; // ${target}: bare`
      );
    }
  }
  for (const target of AS_ANY_TARGETS) {
    roots.add(target.split('.')[0]);
    const i = rows.length;
    // A custom component with a required prop of its own. `as="span"` alone
    // proved nothing: a component narrowed to a union containing `span` would
    // pass it while `AS_ANY` went on preserving tags it cannot render.
    rows.push(
      `export const a${i} = <${target} as={Custom} mustPass="y">{'x'}</${target}>; // ${target}: any`
    );
    rows.push(
      `export const s${i} = <${target} as="span">{'x'}</${target}>; // ${target}: intrinsic`
    );
  }
  return [
    `import { ${[...roots].sort().join(', ')} } from '@allxsmith/bestax-bulma';`,
    '',
    'const Custom = (p: { mustPass: string; children?: unknown }) => <>{p.children}</>;',
    '',
    ...rows,
    '',
  ].join('\n');
}

describe('the href and `as` tables match what the library accepts', () => {
  it('licenses exactly the shapes the tables claim', () => {
    const source = buildHrefSource();
    const { status, diagnostics } = typecheckTsx(source, 'href-table');
    expect({ status, diagnostics: annotate(diagnostics, source) }).toEqual({
      status: 0,
      diagnostics: '',
    });
  });

  it('pins the set of href-capable targets, and what each renders', () => {
    // The table says where an `href` may stay; everything absent from it loses
    // the attribute. A row added by accident is how #662 shipped, and a row
    // missed is how `Pagination.Next` did — it is reached through a `special`
    // rather than a `target:` line, so reading the mappings does not find it.
    // The typecheck above cannot pin the default element: `Level.Item`
    // declares `href` at every `as`, so the bare form compiles even though it
    // renders a <div> and drops the attribute. That row is held here and by
    // the comment on the table, which cites the line in bulma-ui.
    expect(HREF_TABLE).toEqual({
      Button: 'button',
      'Level.Item': 'div',
      'Menu.Item': 'a',
      'Navbar.Item': 'a',
      'Navbar.Link': 'a',
      'Pagination.Link': 'a',
      'Pagination.Next': 'a',
      'Pagination.Previous': 'a',
      'Panel.Block': 'a',
    });
  });

  it('pins the targets whose `as` takes any element', () => {
    expect(AS_ANY_TARGETS).toEqual([
      'Button',
      'Menu.Item',
      'Navbar.Item',
      'Navbar.Link',
    ]);
  });
});

/**
 * `LINK_ATTR_TABLE` decides which attributes survive beside a changed element,
 * and it was wrong in three of its six rows when written by hand: `rel` is on
 * `HTMLAttributes` and so valid everywhere, `hrefLang` reaches `<area>`, and
 * `ping` does not. Each row is asserted by use, in both directions -- valid on
 * every element it lists, rejected on one it does not.
 */
/**
 * The elements the link-attribute rows are checked against, written out
 * rather than read off the table they are checking. Every element any row
 * names has to be here, plus a few that no row does.
 */
const LINK_ATTR_UNIVERSE = [
  'a',
  'area',
  'audio',
  'base',
  'blockquote',
  'button',
  'div',
  'embed',
  'form',
  'iframe',
  'img',
  'input',
  'li',
  'link',
  'menu',
  'meta',
  'object',
  'ol',
  'p',
  'script',
  'source',
  'span',
  'style',
  'table',
  'td',
  'th',
  'track',
  'video',
] as const;

/**
 * A valid value per attribute. Held to the table below, so an attribute added
 * to `LINK_ATTR_TABLE` without one here fails rather than being skipped --
 * `media` was added to the table and these tests would have gone on passing
 * without ever checking it.
 */
const SAMPLE: Record<string, string> = {
  target: '="_blank"',
  download: '',
  hrefLang: '="en"',
  ping: '="/p"',
  referrerPolicy: '="no-referrer"',
  media: '="print"',
};

function buildLinkAttrSource(): string {
  const rows: string[] = [];
  // Independent of the table on purpose. Deriving the universe from
  // `LINK_ATTR_TABLE` meant a row and its own negative set moved together:
  // delete `script` from `referrerPolicy` and `script` left the universe too,
  // so nothing asserted it. This list is written out, so removing an element
  // from a row leaves an assertion behind that then fails.
  const universe = [...LINK_ATTR_UNIVERSE];
  for (const [attr, elements] of Object.entries(LINK_ATTR_TABLE)) {
    const value = SAMPLE[attr] ?? '="x"';
    for (const el of elements) {
      rows.push(
        `export const y${rows.length} = <${el} ${attr}${value} />; // ${attr} on ${el}`
      );
    }
    for (const el of universe.filter(e => !elements.includes(e))) {
      rows.push(`// @ts-expect-error ${attr} is not valid on a <${el}>`);
      rows.push(`export const n${rows.length} = <${el} ${attr}${value} />;`);
    }
  }
  return rows.join('\n') + '\n';
}

describe('the link-attribute table matches what React types', () => {
  it('licenses each row, and rejects the attribute off it', () => {
    const source = buildLinkAttrSource();
    const { status, diagnostics } = typecheckTsx(source, 'link-attrs');
    expect({ status, diagnostics: annotate(diagnostics, source) }).toEqual({
      status: 0,
      diagnostics: '',
    });
  });

  it('checks every element the table names', () => {
    // The universe is hand-written so it cannot move with the rows; this is
    // what stops a new row naming an element the negative side never sees.
    const named = new Set(Object.values(LINK_ATTR_TABLE).flat());
    expect(
      [...named].filter(e => !LINK_ATTR_UNIVERSE.includes(e as never))
    ).toEqual([]);
  });

  it('has a sample value for every attribute in the table', () => {
    // Otherwise a new row is silently skipped by every test above.
    expect(
      Object.keys(LINK_ATTR_TABLE).filter(a => SAMPLE[a] === undefined)
    ).toEqual([]);
  });
  it('leaves `rel` out, because it is valid on every element', () => {
    expect(Object.keys(LINK_ATTR_TABLE)).not.toContain('rel');
  });
});

describe('the per-target link-attribute exception matches the library', () => {
  it('needs a row for no target but the one it has', () => {
    // The premise behind a single-row table: every other href-capable target
    // either follows `as` or extends `AnchorHTMLAttributes`, so the element
    // decides and no row is needed. If one of them ever narrows, the rule
    // silently keeps an attribute the component rejects -- so the premise is
    // asserted rather than assumed.
    const rows: string[] = [];
    const roots = new Set<string>();
    for (const target of Object.keys(HREF_TABLE)) {
      if (TARGET_LINK_ATTR_TABLE[target]) continue;
      roots.add(target.split('.')[0]);
      const as = declaresAs(target) ? 'as="a" ' : '';
      for (const attr of Object.keys(LINK_ATTR_TABLE)) {
        rows.push(
          `export const p${rows.length} = <${target} ${as}${attr}${SAMPLE[attr]}>{'x'}</${target}>; // ${target} ${attr}`
        );
      }
    }
    const source =
      `import { ${[...roots].sort().join(', ')} } from '@allxsmith/bestax-bulma';\n\n` +
      rows.join('\n') +
      '\n';
    const { status, diagnostics } = typecheckTsx(source, 'no-extra-rows');
    expect({ status, diagnostics: annotate(diagnostics, source) }).toEqual({
      status: 0,
      diagnostics: '',
    });
  });

  it('holds `Level.Item` to exactly the link attributes it declares', () => {
    // Most href-capable targets either follow `as` or extend
    // `AnchorHTMLAttributes`; this one enumerates, and the rule has a row for
    // it. Asserted by use, both ways.
    const rows: string[] = [
      "import { Level } from '@allxsmith/bestax-bulma';",
      '',
      `export const ok = <Level.Item as="a" href="#" target="_blank">{'x'}</Level.Item>;`,
    ];
    for (const attr of Object.keys(LINK_ATTR_TABLE)) {
      if (TARGET_LINK_ATTR_TABLE['Level.Item'].includes(attr)) continue;
      rows.push(`// @ts-expect-error Level.Item declares no ${attr}`);
      rows.push(
        `export const n_${attr} = <Level.Item as="a" ${attr}${SAMPLE[attr]}>{'x'}</Level.Item>;`
      );
    }
    const source = rows.join('\n') + '\n';
    const { status, diagnostics } = typecheckTsx(source, 'target-link-attrs');
    expect({ status, diagnostics: annotate(diagnostics, source) }).toEqual({
      status: 0,
      diagnostics: '',
    });
  });
});

describe('the href-bearing intrinsics match what React types', () => {
  it('accepts an href on each, and rejects it off them', () => {
    // The fifth hand-written table in this file's subject, added last and
    // pinned last. Every other one here was wrong at least once before a
    // test held it to the library, so this one does not get to be the
    // exception. Same universe as the link attributes, for the same reason:
    // written out, not read off the table under test.
    const rows: string[] = [];
    for (const el of LINK_ATTR_UNIVERSE) {
      // `<style href>` is React 19 only, and the table is deliberately the
      // 18/19 common denominator, so the negative assertion cannot be made
      // here: it would be unused against the React 19 types installed.
      if (el === 'style') continue;
      if (HREF_ELEMENTS.includes(el)) {
        rows.push(`export const h_${el} = <${el} href="#" />;`);
      } else {
        rows.push(`// @ts-expect-error ${el} takes no href`);
        rows.push(`export const n_${el} = <${el} href="#" />;`);
      }
    }
    const source = rows.join('\n') + '\n';
    const { status, diagnostics } = typecheckTsx(source, 'href-elements');
    expect({ status, diagnostics: annotate(diagnostics, source) }).toEqual({
      status: 0,
      diagnostics: '',
    });
  });
});

/**
 * The HTML half of `JSX.IntrinsicElements`, as of `@types/react` 19.
 *
 * Written out because the structural test for it does not work --
 * `JSX.IntrinsicElements[E]` is a `DetailedHTMLProps` wrapper, so
 * `extends HTMLAttributes` does not separate HTML from SVG. Regenerate by
 * reading the keys between `interface IntrinsicElements {` and the `// SVG`
 * comment in `@types/react/index.d.ts`.
 *
 * The point of listing it is that it is complete and chosen independently of
 * the tables below. The earlier universe was a dozen elements picked by hand,
 * which could not see a row missing an element the universe also lacked --
 * `media` on `<meta>` sat there unnoticed for exactly that reason.
 *
 * SVG is excluded on purpose: `SVGAttributes` declares `href`, `media` and
 * `target`, so every SVG tag would join these rows, and no source here can
 * produce one.
 */
const HTML_INTRINSICS =
  `a abbr address area article aside audio b base bdi bdo big
blockquote body br button canvas caption center cite code col colgroup data datalist dd del
details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6
head header hgroup hr html i iframe img input ins kbd keygen label legend li link main map mark
menu menuitem meta meter nav noindex noscript object ol optgroup option output p param picture
pre progress q rp rt ruby s samp script search section select slot small source span strong
style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul
var video wbr webview`
    .split(/\s+/)
    .filter(Boolean);

describe('every row is exactly what React declares, over all of HTML', () => {
  it('matches each link-attribute row against the full intrinsic set', () => {
    const html = HTML_INTRINSICS.map(e => `'${e}'`).join(' | ');
    const rows = Object.entries(LINK_ATTR_TABLE).map(
      ([attr, els]) =>
        `type _${attr} = Assert<Exact<HtmlWith<'${attr}'>, ${els
          .map(e => `'${e}'`)
          .join(' | ')}>>; // ${attr}`
    );
    // `href` carries the one deliberate divergence: `<style href>` is React 19
    // only and the table is the 18/19 common denominator, so it is added back
    // here rather than to the table.
    rows.push(
      `type _href = Assert<Exact<HtmlWith<'href'>, ${[...HREF_ELEMENTS, 'style']
        .map(e => `'${e}'`)
        .join(' | ')}>>; // href`
    );
    const source = [
      "import type { JSX } from 'react';",
      `type Html = ${html};`,
      'type ElementsWith<K extends string> = {',
      '  [E in keyof JSX.IntrinsicElements]-?: K extends keyof JSX.IntrinsicElements[E] ? E : never;',
      '}[keyof JSX.IntrinsicElements];',
      'type HtmlWith<K extends string> = Extract<ElementsWith<K>, Html>;',
      'type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;',
      'type Assert<T extends true> = T;',
      '',
      ...rows,
      'export {};',
      '',
    ].join('\n');
    const { status, diagnostics } = typecheckTsx(source, 'html-complete');
    expect({ status, diagnostics: annotate(diagnostics, source) }).toEqual({
      status: 0,
      diagnostics: '',
    });
  });
});

/**
 * Targets whose bare probe cannot be built: they need props this test does
 * not know, or reject children. Named rather than filtered silently, because
 * a target that quietly stopped being probed is the same blindness the
 * universe had.
 */
const UNPROBEABLE = ['Dropdown', 'Dropdown.Divider', 'Tabs.Tab'];

/**
 * Every bestax target the three sources can produce.
 *
 * `target:` lines only, plus the handful a `special` names inline -- reading
 * every capitalised dotted string out of `specials.ts` also collects the
 * SOURCE libraries' own names (`Form.Help`, `Field.Label`), which bestax does
 * not export. `Pagination.Next` and `Pagination.Previous` are the ones that
 * matter here: no mapping names them, and the first version of `HREF_OK`
 * missed both for exactly that reason.
 */
const SPECIAL_ONLY_TARGETS = ['Pagination.Next', 'Pagination.Previous'];

function reachableTargets(): string[] {
  const dir = path.join(packageRoot, 'src', 'sources');
  const found = new Set<string>(SPECIAL_ONLY_TARGETS);
  for (const source of ['bloomer', 'rbx', 'react-bulma-components']) {
    for (const file of ['mapping.ts', 'specials.ts']) {
      const text = fs.readFileSync(path.join(dir, source, file), 'utf8');
      for (const m of text.matchAll(/target: '([A-Z][\w.]*)'/g))
        found.add(m[1]);
    }
  }
  return [...found].filter(t => !UNPROBEABLE.includes(t)).sort();
}

describe('HREF_OK names every reachable target that takes an href', () => {
  it('and no others', () => {
    // The one claim in this file nothing held. A deep review refuted a
    // missing row by hand once; a missing row deletes a working link and a
    // spurious one ships a dead attribute, so it is asserted here instead.
    const targets = reachableTargets();
    const roots = [...new Set(targets.map(t => t.split('.')[0]))].sort();
    const rows: string[] = [];
    for (const target of targets) {
      const i = rows.length;
      const mode = HREF_TABLE[target];
      if (mode === 'a') {
        rows.push(
          `export const y${i} = <${target} href="#">{'x'}</${target}>;`
        );
      } else if (mode) {
        // Not an anchor by default, so its `as="a"` form is the one asserted.
        // The bare form is NOT asserted to fail: `Level.Item` declares `href`
        // at every `as` and drops it at runtime, which is the whole reason
        // this table holds the rendered element rather than the declared type.
        rows.push(
          `export const y${i} = <${target} as="a" href="#">{'x'}</${target}>;`
        );
      } else {
        rows.push(`// @ts-expect-error ${target} takes no href at any as`);
        rows.push(
          `export const n${i} = <${target} href="#">{'x'}</${target}>;`
        );
      }
    }
    const source = [
      `import { ${roots.join(', ')} } from '@allxsmith/bestax-bulma';`,
      '',
      ...rows,
      '',
    ].join('\n');
    const { status, diagnostics } = typecheckTsx(source, 'href-ok-complete');
    expect({ status, diagnostics: annotate(diagnostics, source) }).toEqual({
      status: 0,
      diagnostics: '',
    });
  });
});
