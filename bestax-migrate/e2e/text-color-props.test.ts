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
 *
 * `TEXT_COLOR_VIA_COLOR` picks the ones whose `color` carries the text color
 * instead, which types can't show: Hero's `color` has the helper's type and
 * renders its own `is-<color>` modifier. So each one is rendered with
 * `color` and must come out with `has-text-<color>`.
 */

import {
  HELPER_COLORS,
  NO_TEXT_COLOR,
  TEXT_COLOR_VIA_COLOR,
} from '../src/sources/_shared/text-color-props.js';
import { renderElement } from './support/render-module.js';
import { SOURCE_TARGETS } from './support/source-targets.js';
import { annotate, typecheckTsx } from './support/typecheck-tsx.js';

/**
 * Targets whose `color` renders only `has-text-<color>` at runtime but which
 * the codemod leaves out, each for the reason given. Breadcrumb and Tags
 * leave `color` out of their props type, which the tsc pass checks.
 */
const COLOR_LEFT_OUT: Record<string, string> = {
  Breadcrumb: 'its props type leaves color out',
  Tags: 'its props type leaves color out',
  Divider:
    'its props leave out the helper color, and only the HTML color attribute they inherit reaches it',
};
const COLOR_REFUSED = ['Breadcrumb', 'Tags'];

function buildSource(): string {
  return [
    "import type { ComponentProps } from 'react';",
    "import * as B from '@allxsmith/bestax-bulma';",
    '',
    '// Whether a props type takes textColor. A key declared `?: never` is one the component',
    '// refuses, and a props type that came out as `any` gets a name no row expects.',
    "type Takes<T, K extends string = 'textColor'> = 0 extends 1 & T ? 'untyped' : K extends keyof T ? ([Exclude<T[K & keyof T], undefined>] extends [never] ? false : true) : false;",
    'type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;',
    'type Assert<T extends true> = T;',
    '',
    ...SOURCE_TARGETS.map(
      (target, i) =>
        `type _${i} = Assert<Exact<Takes<ComponentProps<typeof B.${target}>>, ${!NO_TEXT_COLOR.has(target)}>>; // ${target}`
    ),
    '',
    '// The targets textColor becomes color on take every value the rename writes,',
    "// and the ones whose color renders the text but isn't typed refuse it.",
    `type Written = ${HELPER_COLORS.map(v => `'${v}'`).join(' | ')};`,
    'type ColorOf<T> = T extends { color?: infer C } ? NonNullable<C> : never;',
    ...[...TEXT_COLOR_VIA_COLOR].map(
      (target, i) =>
        `type _color${i} = Assert<[Written] extends [ColorOf<ComponentProps<typeof B.${target}>>] ? true : false>; // ${target}`
    ),
    ...COLOR_REFUSED.map(
      (target, i) =>
        `type _untyped${i} = Assert<Exact<Takes<ComponentProps<typeof B.${target}>, 'color'>, false>>; // ${target}`
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

/**
 * Which element of a target's markup carries the class, counted from the
 * root: the root unless listed. `Menu.Item` renders its link inside an `<li>`,
 * and puts it on the link, where react-bulma-components' and rbx's menu
 * items put their `textColor` too.
 */
const CLASS_ON: Record<string, number> = { 'Menu.Item': 1 };

/** The classes on the nth element (0 the root) of some static markup. */
function classesOf(html: string, nth: number): string[] {
  const tags = [...html.matchAll(/<[a-z][^>]*>/g)].map(m => m[0]);
  const at = /class="([^"]*)"/.exec(tags[nth] ?? '');
  return at ? at[1].split(' ') : [];
}

describe('TEXT_COLOR_VIA_COLOR names targets whose color sets the text', () => {
  it.each([...TEXT_COLOR_VIA_COLOR])(
    '%s renders color as has-text, not as a modifier',
    target => {
      expect(NO_TEXT_COLOR.has(target)).toBe(true);
      const html = renderElement(target, { color: 'primary' }, 'x');
      expect(classesOf(html, CLASS_ON[target] ?? 0)).toContain(
        'has-text-primary'
      );
      expect(html).not.toContain('is-primary');
    }
  );

  it.each([...NO_TEXT_COLOR].filter(t => !TEXT_COLOR_VIA_COLOR.has(t)))(
    '%s, left out, has no color that renders only the text, or one its type refuses',
    target => {
      let html: string;
      try {
        html = renderElement(target, { color: 'primary' }, 'x');
      } catch {
        // A void element takes no children.
        html = renderElement(target, { color: 'primary' });
      }
      const onlyText =
        classesOf(html, CLASS_ON[target] ?? 0).includes('has-text-primary') &&
        !html.includes('is-primary');
      expect(onlyText).toBe(Object.hasOwn(COLOR_LEFT_OUT, target));
    }
  );

  it('would catch a component whose color is its own modifier', () => {
    // Hero's color has the helper's type, which is why the rows are rendered.
    const html = renderElement('Hero', { color: 'primary' }, 'x');
    expect(html).toContain('is-primary');
    expect(html).not.toContain('has-text-primary');
  });
});
