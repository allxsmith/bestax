/**
 * `SIZE_UNIONS` decides which group and message sizes survive a migration,
 * and it is a hand copy of unions bulma-ui keeps in module-local constants.
 * Too narrow, and the codemod leaves a TODO on a size that would have worked;
 * too wide, and it passes through one the user's project cannot compile.
 *
 * bulma-ui exports the unions as types, so no runtime diff can check them.
 * This generates one type assertion per row and hands it to `tsc` against the
 * built library, the way `as-unions.test.ts` does for `as`. Beside them, each
 * source library's own documented sizes, vendored since neither library is
 * ever installed here, must be assignable to the same types, so a size those
 * libraries offer never meets a TODO.
 */

import { SIZE_UNIONS } from '../src/sources/_shared/size-unions.js';
import { resolveMapping as resolveRbc } from '../src/sources/react-bulma-components/mapping.js';
import { resolveMapping as resolveRbx } from '../src/sources/rbx/mapping.js';
import type { ComponentMapping } from '../src/types.js';
import { typecheckTsx } from './support/typecheck-tsx.js';

/** Each row's union as bulma-ui exports it. */
const BESTAX_TYPES: Record<keyof typeof SIZE_UNIONS, string> = {
  Buttons: 'ButtonsSize',
  Tags: 'TagsSize',
  Message: 'MessageSize',
};

/**
 * The sizes each source documents for the components that carry over, and
 * the bestax type each must fit. react-bulma-components v4: the `oneOf` in
 * `ButtonGroup.propTypes` and `Message.propTypes`. rbx v2: the `sizes` in
 * `BUTTON_GROUP_DEFAULTS`, `TAG_GROUP_DEFAULTS`, `MESSAGE_DEFAULTS` and
 * `HERO_DEFAULTS`. rbx's Hero passes every size through with no allowlist,
 * which is only safe while its five stay bestax's.
 */
const SOURCE_SIZES: Array<[name: string, type: string, sizes: string[]]> = [
  ['rbcButtonGroup', 'ButtonsSize', ['small', 'medium', 'large']],
  ['rbcMessage', 'MessageSize', ['small', 'medium', 'large']],
  ['rbxButtonGroup', 'ButtonsSize', ['small', 'medium', 'large']],
  ['rbxTagGroup', 'TagsSize', ['medium', 'large']],
  ['rbxMessage', 'MessageSize', ['small', 'medium', 'large']],
  [
    'rbxHero',
    'HeroSize',
    ['small', 'medium', 'large', 'fullheight', 'fullheight-with-navbar'],
  ],
];

const quote = (values: readonly string[]) =>
  values.map(v => `'${v}'`).join(' | ');

function buildSource(): string {
  const rows = Object.entries(SIZE_UNIONS).map(
    ([target, values]) =>
      `type _${target} = Assert<Exact<${quote(values)}, ${BESTAX_TYPES[target as keyof typeof SIZE_UNIONS]}>>; // ${target}`
  );
  const sources = SOURCE_SIZES.map(
    ([name, type, sizes]) =>
      `export const ${name}: ${type}[] = [${sizes.map(s => `'${s}'`).join(', ')}];`
  );
  const types = [...new Set([...Object.values(BESTAX_TYPES), 'HeroSize'])];
  return [
    `import type { ${types.sort().join(', ')} } from '@allxsmith/bestax-bulma';`,
    '',
    'type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;',
    'type Assert<T extends true> = T;',
    '',
    ...rows,
    '',
    ...sources,
    '',
  ].join('\n');
}

/** Quote the generated line beside each diagnostic, so a failure names its row. */
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

describe('SIZE_UNIONS matches the size each bestax component declares', () => {
  it('asserts every row against the library, in both directions', () => {
    const source = buildSource();
    const { status, diagnostics } = typecheckTsx(source, 'size-unions');
    expect({ status, diagnostics: annotate(diagnostics, source) }).toEqual({
      status: 0,
      diagnostics: '',
    });
  });

  it('covers the three targets a group or message size carries onto', () => {
    // A row removed by accident would leave the assertion above passing
    // while a mapping lost its allowlist, so pin the set itself.
    expect(Object.keys(SIZE_UNIONS).sort()).toEqual([
      'Buttons',
      'Message',
      'Tags',
    ]);
  });

  it.each<[string, ComponentMapping | undefined]>([
    ['react-bulma-components Button.Group', resolveRbc(['Button', 'Group'])],
    ['react-bulma-components Message', resolveRbc(['Message'])],
    ['rbx Button.Group', resolveRbx(['Button', 'Group'])],
    ['rbx Tag.Group', resolveRbx(['Tag', 'Group'])],
    ['rbx Message', resolveRbx(['Message'])],
  ])('%s passes size through its target row', (_name, mapping) => {
    const target = mapping?.target as keyof typeof SIZE_UNIONS;
    expect(Object.keys(SIZE_UNIONS)).toContain(target);
    expect(mapping?.props?.size?.allowed).toBe(SIZE_UNIONS[target]);
  });
});
