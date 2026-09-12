/**
 * `AS_UNIONS` decides which `as` values survive a migration, and it is a hand
 * written copy of unions that live in bulma-ui. A copy that drifts is worse
 * than no table at all: too narrow, and the codemod TODOs an `as` that would
 * have worked; too wide, and it emits output the user's project cannot
 * compile — which is the defect that #662 was.
 *
 * bulma-ui exports these as types, not as runtime constants, so no runtime
 * diff can check them. This generates one type assertion per row and hands it
 * to `tsc` against the built library, which makes drift in either direction a
 * failure here rather than in someone's project.
 */

import {
  AS_ANY_TARGETS,
  AS_UNIONS,
  HREF_TABLE,
  LINK_ATTR_TABLE,
  declaresAs,
} from '../src/sources/_shared/polymorphic.js';
import { typecheckTsx } from './support/typecheck-tsx.js';

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
    rows.push(
      `export const a${i} = <${target} as="span">{'x'}</${target}>; // ${target}: any`
    );
  }
  return [
    `import { ${[...roots].sort().join(', ')} } from '@allxsmith/bestax-bulma';`,
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
const SAMPLE: Record<string, string> = {
  target: '="_blank"',
  download: '',
  hrefLang: '="en"',
  ping: '="/p"',
  referrerPolicy: '="no-referrer"',
};

function buildLinkAttrSource(): string {
  const rows: string[] = [];
  for (const [attr, elements] of Object.entries(LINK_ATTR_TABLE)) {
    const value = SAMPLE[attr] ?? '="x"';
    for (const el of elements) {
      rows.push(
        `export const y${rows.length} = <${el} ${attr}${value} />; // ${attr} on ${el}`
      );
    }
    // `<span>` is in no row, so every attribute must be rejected on it.
    rows.push(`// @ts-expect-error ${attr} is not valid on a <span>`);
    rows.push(`export const n${rows.length} = <span ${attr}${value} />;`);
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

  it('leaves `rel` out, because it is valid on every element', () => {
    expect(Object.keys(LINK_ATTR_TABLE)).not.toContain('rel');
  });
});
