/**
 * `IS_LIGHT_TARGETS` names the bestax components a literal
 * `colorVariant="light"` becomes `isLight` on. It is a hand list, so this
 * holds each one to taking `isLight` in the library's own types, the way
 * `size-unions.test.ts` holds its rows: a target that stopped taking it would
 * hand users output that doesn't compile.
 */

import { IS_LIGHT_TARGETS } from '../src/sources/react-bulma-components/mapping.js';
import { typecheckTsx } from './support/typecheck-tsx.js';

it('gives isLight only to targets whose props take it', () => {
  const source = [
    "import type { ComponentProps } from 'react';",
    "import * as B from '@allxsmith/bestax-bulma';",
    '',
    ...IS_LIGHT_TARGETS.map(
      (target, i) =>
        `export const _${i}: NonNullable<ComponentProps<typeof B.${target}>['isLight']> = true; // ${target}`
    ),
    '',
  ].join('\n');
  expect(typecheckTsx(source, 'is-light-targets')).toEqual({
    status: 0,
    diagnostics: '',
  });
});
