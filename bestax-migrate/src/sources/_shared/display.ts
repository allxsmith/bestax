/**
 * Keeps a base `display` that a source wrote beside a per-viewport one.
 *
 * bestax leaves the base `display`'s class out once any per-viewport display
 * prop is set (`useVisibilityClasses` in bestax-bulma, which #1748 proposes to
 * change in the next major), so a source that flattened
 * `isDisplay={['inline-block', 'flex-desktop']}` or
 * `display="flex" mobile={{ display: 'block' }}` into `display` plus
 * `display<Viewport>` lost the base value: the source rendered
 * `is-inline-block is-flex-desktop`, and bestax only `is-flex-desktop`.
 *
 * So the base value stays the class it stood for, in `className`, as the
 * bulma-classes source keeps one. The flex container props render only beside
 * a flex `display` prop, so when the base value was the flex display and no
 * per-viewport one is, they go into `className` the same way. A value bestax
 * doesn't take is left where it was, as the source left it: the lists are the
 * class map's, which its value-union test holds to bestax-bulma's constants.
 *
 * Where a per-viewport display, the base value, the `className` or a
 * container prop it would move is dynamic, or a spread could replace one of
 * them or the `className`, it changes nothing and leaves a TODO naming what to
 * move.
 */

import type { ASTPath } from 'jscodeshift';
import {
  ALIGN_CONTENTS,
  ALIGN_ITEMS,
  DISPLAYS,
  FLEX_DIRECTIONS,
  FLEX_WRAPS,
  JUSTIFY_CONTENTS,
} from '../bulma-classes/class-map.js';
import {
  addTodo,
  findAttr,
  jsxStringValue,
  literalValueOf,
  makeAttr,
  removeAttr,
  type TransformContext,
} from './jsx-utils.js';
import { VIEWPORT_SUFFIX } from './viewports.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** bestax's per-viewport display props. */
const VIEWPORT_DISPLAYS = Object.values(VIEWPORT_SUFFIX).map(
  suffix => `display${suffix}`
);

/** The class a bestax display value writes, or none for a value it doesn't take. */
const displayClass = (value: string): string | undefined =>
  value === 'none'
    ? 'is-hidden'
    : (DISPLAYS as readonly string[]).includes(value)
      ? `is-${value}`
      : undefined;

/** The flex container props: the class prefix, and the values bestax takes. */
const FLEX_CONTAINER: Record<string, [string, readonly string[]]> = {
  flexDirection: ['is-flex-direction-', FLEX_DIRECTIONS],
  flexWrap: ['is-flex-wrap-', FLEX_WRAPS],
  justifyContent: ['is-justify-content-', JUSTIFY_CONTENTS],
  alignContent: ['is-align-content-', ALIGN_CONTENTS],
  alignItems: ['is-align-items-', ALIGN_ITEMS],
};

const isFlex = (value: string) => value === 'flex' || value === 'inline-flex';

export function keepBaseDisplay(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any
): void {
  const display = findAttr(element, 'display');
  if (!display) return;
  const perViewport = VIEWPORT_DISPLAYS.map(name =>
    findAttr(element, name)
  ).filter(Boolean);
  if (!perViewport.length) return;

  const todo = (message: string) =>
    addTodo(
      ctx,
      path,
      'prop:display-base',
      `bestax leaves \`display\` out beside a per-viewport display prop; ${message}`
    );

  const base = literalValueOf(display);
  if (base.kind !== 'string') {
    todo('put the class it stands for in `className` by hand');
    return;
  }
  const baseClass = displayClass(base.value);
  if (!baseClass) return;

  // The container props that go with a flex base: every one written, since
  // bestax drops all of them once no `display` prop is flex.
  const values = perViewport.map(attr => literalValueOf(attr));
  const flexBeside = values.some(
    value => value.kind === 'string' && isFlex(value.value)
  );
  const container =
    isFlex(base.value) && !flexBeside
      ? Object.keys(FLEX_CONTAINER)
          .map(name => findAttr(element, name))
          .filter(Boolean)
      : [];
  const moving = [display, ...container];
  const names = moving.map(attr => `\`${attr.name.name}\``).join(', ');
  const refuse = (why: string) =>
    todo(`${why}, so move ${names} into \`className\` as classes by hand`);

  if (values.some(value => value.kind !== 'string')) {
    refuse('a per-viewport display is dynamic');
    return;
  }
  const classes = [baseClass];
  const moved = [display];
  for (const attr of container) {
    const value = literalValueOf(attr);
    if (value.kind !== 'string') {
      refuse(`\`${attr.name.name}\` is dynamic`);
      return;
    }
    const [prefix, allowed] = FLEX_CONTAINER[attr.name.name];
    // bestax ignored a value it doesn't take, and the typecheck still flags it.
    if (!allowed.includes(value.value)) continue;
    classes.push(`${prefix}${value.value}`);
    moved.push(attr);
  }

  const { j } = ctx;
  const attributes = element.openingElement.attributes;
  const className = findAttr(element, 'className');
  // A spread after any prop this reads could replace it, and with no
  // `className` any spread could bring one the new class would override.
  const read = [display, ...perViewport, ...container, className].filter(
    Boolean
  );
  const first = Math.min(...read.map(attr => attributes.indexOf(attr)));
  if (
    attributes.some(
      (attr: any, i: number) =>
        attr.type === 'JSXSpreadAttribute' && (!className || i > first)
    )
  ) {
    refuse('a spread could replace them or the `className`');
    return;
  }
  if (className) {
    const value = literalValueOf(className);
    if (value.kind !== 'string') {
      refuse('the `className` is dynamic');
      return;
    }
    const written = value.value.split(/\s+/).filter(Boolean);
    const merged = [
      ...classes.filter(cls => !written.includes(cls)),
      ...written,
    ];
    className.value = jsxStringValue(j, merged.join(' '));
    for (const attr of moved) removeAttr(element, attr);
  } else {
    // In the place of `display`.
    attributes[attributes.indexOf(display)] = makeAttr(
      j,
      'className',
      classes.join(' ')
    );
    for (const attr of moved.slice(1)) removeAttr(element, attr);
  }
  ctx.dirty = true;
}
