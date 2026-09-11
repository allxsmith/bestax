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

import { AS_UNIONS } from '../src/sources/_shared/polymorphic.js';
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
