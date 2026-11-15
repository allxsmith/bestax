/**
 * `NO_TEXT_COLOR` decides which targets get a TODO for react-bulma-components'
 * and rbx's `textColor` rather than keeping it, and it is a hand copy of
 * which bestax components declare `textColor`. A target it misses keeps a prop
 * the component ignores or passes to the DOM; a stale entry flags a prop that
 * works.
 *
 * bulma-ui declares `textColor` on each component's props type, so no runtime
 * diff can check it. This generates one type assertion per target the two
 * sources name and hands them to `tsc` against the built library.
 */

import { NO_TEXT_COLOR } from '../src/sources/_shared/text-color-props.js';
import { SOURCE_TARGETS } from './support/source-targets.js';
import { annotate, typecheckTsx } from './support/typecheck-tsx.js';

function buildSource(): string {
  return [
    "import type { ComponentProps } from 'react';",
    "import * as B from '@allxsmith/bestax-bulma';",
    '',
    '// Whether a props type takes textColor. A key declared `?: never` is one the component',
    '// refuses, and a props type that came out as `any` gets a name no row expects.',
    "type Takes<T> = 0 extends 1 & T ? 'untyped' : 'textColor' extends keyof T ? ([Exclude<T['textColor' & keyof T], undefined>] extends [never] ? false : true) : false;",
    'type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;',
    'type Assert<T extends true> = T;',
    '',
    ...SOURCE_TARGETS.map(
      (target, i) =>
        `type _${i} = Assert<Exact<Takes<ComponentProps<typeof B.${target}>>, ${!NO_TEXT_COLOR.has(target)}>>; // ${target}`
    ),
    '',
  ].join('\n');
}

describe('NO_TEXT_COLOR matches the targets whose props have no textColor', () => {
  it('asserts every target the two sources name against the library', () => {
    const source = buildSource();
    const { status, diagnostics } = typecheckTsx(source, 'text-color-props');
    expect({ status, diagnostics: annotate(diagnostics, source) }).toEqual({
      status: 0,
      diagnostics: '',
    });
  });

  it('lists no target neither source names', () => {
    expect([...NO_TEXT_COLOR].filter(t => !SOURCE_TARGETS.includes(t))).toEqual(
      []
    );
  });
});
