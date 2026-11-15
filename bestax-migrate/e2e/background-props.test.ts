/**
 * `BACKGROUND_PROPS` decides what react-bulma-components' and rbx's
 * `backgroundColor` becomes on each target, and it is a hand copy of which
 * bestax components declare `bgColor`, `backgroundColor` or neither. A target
 * it misses gets `bgColor`, which a component without it ignores or passes to
 * the DOM; a stale row turns a working prop into a class.
 *
 * bulma-ui declares those props on each component's props type, so no runtime
 * diff can check them. This generates one type assertion per target the two
 * sources name, the way `size-unions.test.ts` does for sizes, and hands them
 * to `tsc` against the built library.
 */

import { BACKGROUND_PROPS } from '../src/sources/_shared/background-props.js';
import { MAPPING as RBC } from '../src/sources/react-bulma-components/mapping.js';
import { MAPPING as RBX } from '../src/sources/rbx/mapping.js';
import type { ComponentMapping } from '../src/types.js';
import { typecheckTsx } from './support/typecheck-tsx.js';

/** Every `target` a mapping table names, its subcomponents' included. */
function targetsOf(table: Record<string, ComponentMapping>): string[] {
  const found: string[] = [];
  const walk = (entry: ComponentMapping) => {
    if (entry.target) found.push(entry.target);
    for (const sub of Object.values(entry.subs ?? {})) walk(sub);
  };
  Object.values(table).forEach(walk);
  return found;
}

/**
 * Targets a structural handler picks that no mapping entry names as its
 * own: the `align` and side props' parts, the navbar dropdown's, the
 * pagination arrows rbx's links can become, and the headings.
 */
const SPECIAL_TARGETS = [
  'Level.Item',
  'Level.Left',
  'Level.Right',
  'Media.Content',
  'Media.Left',
  'Media.Right',
  'MediaContent',
  'MediaLeft',
  'MediaRight',
  'Navbar.Dropdown',
  'Navbar.DropdownMenu',
  'Navbar.End',
  'Navbar.Start',
  'Pagination.Next',
  'Pagination.Previous',
  'SubTitle',
  'Title',
];

const TARGETS = [
  ...new Set([
    ...targetsOf(RBC),
    ...targetsOf(RBX),
    ...SPECIAL_TARGETS,
    ...Object.keys(BACKGROUND_PROPS),
  ]),
].sort();

const expected = (target: string) =>
  Object.hasOwn(BACKGROUND_PROPS, target)
    ? JSON.stringify(BACKGROUND_PROPS[target])
    : "'bgColor'";

function buildSource(): string {
  return [
    "import type { ComponentProps } from 'react';",
    "import * as B from '@allxsmith/bestax-bulma';",
    '',
    '// The prop that renders a background color on a component, as its props type declares it.',
    '// A props type that came out as `any` has every key, so it gets a name no row expects.',
    "// A key declared `?: never` is one the component refuses, so it doesn't count.",
    'type Takes<T, K extends string> = K extends keyof T ? ([Exclude<T[K], undefined>] extends [never] ? false : true) : false;',
    "type Background<T> = 0 extends 1 & T ? 'untyped' : Takes<T, 'bgColor'> extends true ? 'bgColor' : Takes<T, 'backgroundColor'> extends true ? 'backgroundColor' : null;",
    'type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;',
    'type Assert<T extends true> = T;',
    '',
    ...TARGETS.map(
      (target, i) =>
        `type _${i} = Assert<Exact<Background<ComponentProps<typeof B.${target}>>, ${expected(target)}>>; // ${target}`
    ),
    '',
  ].join('\n');
}

/** Quote the generated line beside each diagnostic, so a failure names its target. */
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

describe('BACKGROUND_PROPS matches the background prop each bestax target declares', () => {
  it('asserts every target the two sources name against the library', () => {
    const source = buildSource();
    const { status, diagnostics } = typecheckTsx(source, 'background-props');
    expect({ status, diagnostics: annotate(diagnostics, source) }).toEqual({
      status: 0,
      diagnostics: '',
    });
  });

  it('keeps no row for a target neither source names', () => {
    const named = new Set([
      ...targetsOf(RBC),
      ...targetsOf(RBX),
      ...SPECIAL_TARGETS,
    ]);
    expect(Object.keys(BACKGROUND_PROPS).filter(t => !named.has(t))).toEqual(
      []
    );
  });
});
