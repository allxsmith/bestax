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
  HTML_INTRINSICS,
  HREF_TABLE,
  LINK_ATTR_TABLE,
  declaresAs,
} from '../src/sources/_shared/polymorphic.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { typecheckTsx } from './support/typecheck-tsx.js';
import { sourceNames } from '../src/sources/registry.js';

const packageRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

const TARGETS = Object.keys(AS_UNIONS).sort();

/** `Level.Item` is reached through the `Level` its mapping target names. */
const importRoots = [...new Set(TARGETS.map(t => t.split('.')[0]))].sort();

/**
 * The targets whose props FOLLOW `as` while `as` itself stays narrowed --
 * bulma-ui's constrained polymorphic components (#663).
 *
 * Reading their `as` as a type does not work. Such a component is a pair of
 * call signatures, generic first and a non-generic derivation overload second,
 * and `infer` takes the LAST -- which pins `as` to the default element. `AsOf`
 * reports `'a'` for `Dropdown.Item`, which also renders a `<div>` and a
 * `<button>`, so an `Exact` row against the union fails while nothing has
 * drifted.
 *
 * So these assert by USE, the same way the href tables below do: every member
 * of the row must compile, and every HTML intrinsic outside it must not. That
 * is the stronger check of the two -- `Exact` reads one declaration, this one
 * puts every tag through the component's own call signature.
 */
const AS_BY_USE = new Set(['Dropdown.Item']);

function buildSource(): string {
  const rows: string[] = [];
  for (const [i, target] of TARGETS.entries()) {
    if (AS_BY_USE.has(target)) {
      const union = AS_UNIONS[target];
      for (const value of union) {
        rows.push(
          `export const y${i}_${value} = <${target} as="${value}">{'x'}</${target}>; // ${target}: as="${value}"`
        );
      }
      for (const tag of HTML_INTRINSICS) {
        if (union.includes(tag)) continue;
        rows.push(`// @ts-expect-error ${target} does not render a <${tag}>`);
        rows.push(
          `export const n${i}_${tag} = <${target} as="${tag}">{'x'}</${target}>;`
        );
      }
      continue;
    }
    const union = AS_UNIONS[target].map(v => `'${v}'`).join(' | ');
    rows.push(
      `type _${i} = Assert<Exact<${union}, AsOf<typeof ${target}>>>; // ${target}`
    );
  }
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
      'Dropdown.Item': 'a',
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

describe('link attributes match what the library accepts', () => {
  it("holds every href-capable target to its anchor's whole surface", () => {
    // The premise that let the per-target table go (#672): every href-capable
    // target either follows `as` or carries the anchor's attributes outright,
    // so the element decides for all of them. If one ever narrows, the rule
    // would silently keep an attribute the component rejects -- so the premise
    // is asserted rather than assumed, for every target rather than for the
    // ones that had no row.
    const rows: string[] = [];
    const roots = new Set<string>();
    for (const target of Object.keys(HREF_TABLE)) {
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
 * Every bestax target the sources can produce.
 *
 * `target:` lines only, plus the handful a `special` names inline -- reading
 * every capitalised dotted string out of `specials.ts` also collects the
 * SOURCE libraries' own names (`Form.Help`, `Field.Label`), which bestax does
 * not export. `Pagination.Next` and `Pagination.Previous` are the ones that
 * matter here: no mapping names them, and the first version of `HREF_OK`
 * missed both for exactly that reason.
 */
const SPECIAL_ONLY_TARGETS = ['Pagination.Next', 'Pagination.Previous'];

/** Where each source spells its targets as `target: '…'` lines. */
const TARGET_FILES: Record<string, string[]> = {
  bloomer: ['mapping.ts', 'specials.ts'],
  rbx: ['mapping.ts', 'specials.ts'],
  'react-bulma-components': ['mapping.ts', 'specials.ts'],
  'bulma-classes': ['class-map.ts'],
};

function reachableTargets(): string[] {
  const dir = path.join(packageRoot, 'src', 'sources');
  const found = new Set<string>(SPECIAL_ONLY_TARGETS);
  for (const [source, files] of Object.entries(TARGET_FILES)) {
    for (const file of files) {
      const text = fs.readFileSync(path.join(dir, source, file), 'utf8');
      for (const m of text.matchAll(/target: '([A-Z][\w.]*)'/g))
        found.add(m[1]);
    }
  }
  return [...found].filter(t => !UNPROBEABLE.includes(t)).sort();
}

/** Whether the target renders an `<a>` when told to: `AS_ANY`, or a union with it. */
function acceptsAsAnchor(target: string): boolean {
  const union = AS_UNIONS[target];
  return union ? union.includes('a') : AS_ANY_TARGETS.includes(target);
}

describe('HREF_OK names every reachable target that takes an href', () => {
  it('reads targets from every registered source', () => {
    expect(Object.keys(TARGET_FILES).sort()).toEqual(sourceNames().sort());
  });

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
        // "at any `as`" is the claim, so the anchor form has to be checked
        // wherever the target has one; asserting the bare form alone leaves
        // `as="a"` unchecked. NOTE no reachable target currently sits in this
        // state -- `Dropdown.Item` was the one, until #663 gave it an `href` --
        // so this branch is a rule kept against the next such target, not
        // coverage this file has today.
        if (acceptsAsAnchor(target)) {
          rows.push(`// @ts-expect-error ${target} takes no href at as="a"`);
          rows.push(
            `export const m${i} = <${target} as="a" href="#">{'x'}</${target}>;`
          );
        }
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
