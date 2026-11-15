/**
 * Keeps a base `display` that a source wrote beside a per-viewport one.
 *
 * bestax leaves the base `display`'s class out once any per-viewport display
 * prop is set (`useVisibilityClasses` in bestax-bulma), so a source that
 * flattened `isDisplay={['inline-block', 'flex-desktop']}` or
 * `display="flex" mobile={{ display: 'block' }}` into `display` plus
 * `display<Viewport>` lost the base value: the source rendered
 * `is-inline-block is-flex-desktop`, and bestax only `is-flex-desktop`.
 *
 * So the base value stays the class it stood for, merged into `className`, as
 * the bulma-classes source keeps one. The flex container props render only
 * beside a flex `display` prop, so when the base value was the flex display
 * and no per-viewport one is, they go into `className` the same way.
 *
 * It reads only bestax's own display values, which the sources write from
 * their own (a value bestax doesn't take keeps the TODO its source gave it),
 * and a dynamic base value has its source's TODO already. Where a
 * per-viewport display, the `className` or a container prop it would move is
 * dynamic, or a spread could carry a `className` of its own, it changes
 * nothing and leaves a TODO.
 */

import type { ASTPath } from 'jscodeshift';
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

/** bestax's display values, and the class each writes. */
const DISPLAY_CLASSES: Record<string, string> = {
  block: 'is-block',
  flex: 'is-flex',
  inline: 'is-inline',
  'inline-block': 'is-inline-block',
  'inline-flex': 'is-inline-flex',
  grid: 'is-grid',
  none: 'is-hidden',
};

/** The flex container props, and the class each value writes. */
const FLEX_CONTAINER_CLASSES: Record<string, string> = {
  flexDirection: 'is-flex-direction-',
  flexWrap: 'is-flex-wrap-',
  justifyContent: 'is-justify-content-',
  alignContent: 'is-align-content-',
  alignItems: 'is-align-items-',
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
  const base = literalValueOf(display);
  if (base.kind !== 'string' || !(base.value in DISPLAY_CLASSES)) return;

  const todo = (message: string) =>
    addTodo(
      ctx,
      path,
      'prop:display',
      `bestax leaves \`display\` out beside a per-viewport display prop; ${message}`
    );

  const values = perViewport.map(attr => literalValueOf(attr));
  if (values.some(value => value.kind !== 'string')) {
    todo(
      `a per-viewport display is dynamic, so put the \`${DISPLAY_CLASSES[base.value]}\` class in \`className\` by hand where you need it`
    );
    return;
  }

  const classes = [DISPLAY_CLASSES[base.value]];
  const moved = [display];
  const flexBeside = values.some(
    value => value.kind === 'string' && isFlex(value.value)
  );
  if (isFlex(base.value) && !flexBeside) {
    for (const [name, prefix] of Object.entries(FLEX_CONTAINER_CLASSES)) {
      const attr = findAttr(element, name);
      if (!attr) continue;
      const value = literalValueOf(attr);
      if (value.kind !== 'string') {
        todo(
          `\`display="${base.value}"\` would move into \`className\`, and \`${name}\` with it, but \`${name}\` is dynamic; move both by hand`
        );
        return;
      }
      classes.push(`${prefix}${value.value}`);
      moved.push(attr);
    }
  }

  const { j } = ctx;
  const className = findAttr(element, 'className');
  if (className) {
    const value = literalValueOf(className);
    if (value.kind !== 'string') {
      const names = moved.map(attr => `\`${attr.name.name}\``).join(', ');
      todo(
        `add \`${classes.join(' ')}\` to the dynamic \`className\` and remove ${names} by hand`
      );
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
    const attributes = element.openingElement.attributes;
    if (attributes.some((attr: any) => attr.type === 'JSXSpreadAttribute')) {
      const names = moved.map(attr => `\`${attr.name.name}\``).join(', ');
      todo(
        `a spread may carry a \`className\`, so add \`${classes.join(' ')}\` to it and remove ${names} by hand`
      );
      return;
    }
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
