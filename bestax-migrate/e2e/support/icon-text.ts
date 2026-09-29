/**
 * The children of an element whose target builds its icons from props
 * (`.icon-text`), as the planner reads them, and each icon's props as the
 * transform writes them, for the tests that render or typecheck what it
 * builds.
 */

import {
  plan,
  type BuiltIcon,
  type ChildFacts,
} from '../../src/sources/bulma-classes/plan.js';

export type Attributes = Record<string, string | true>;

/**
 * Glyphs as written: each Font Awesome style, the classes that modify one,
 * and Material Design Icons.
 */
export const GLYPHS: string[][] = [
  ['fas', 'fa-home'],
  ['far', 'fa-bell'],
  ['fab', 'fa-github'],
  ['fal', 'fa-bell'],
  ['fad', 'fa-bell'],
  ['fat', 'fa-bell'],
  ['fa', 'fa-home'],
  ['fa-solid', 'fa-house'],
  ['fa-regular', 'fa-bell'],
  ['fas', 'fa-home', 'fa-lg'],
  ['fa-lg', 'fas', 'fa-spinner', 'fa-spin', 'fa-fw'],
  ['fas', 'fa-home', 'my-glyph'],
  ['mdi', 'mdi-home'],
  ['mdi', 'mdi-home', 'mdi-24px', 'mdi-spin'],
];

/**
 * A `.icon` holding a bare `<i>` with the `glyph` classes, planned on its
 * own as the transform plans it before the element around it. It carries
 * an `aria-label` unless `attributes` says otherwise, since `Icon` writes
 * one.
 */
export function iconChild(
  glyph: string[],
  tokens: string[] = [],
  attributes: Attributes = { 'aria-label': 'x' }
): ChildFacts {
  const inner: ChildFacts = {
    tag: 'i',
    tokens: glyph,
    attributes: new Map(),
    hasSpread: false,
    isEmpty: true,
  };
  const given = new Map(Object.entries(attributes));
  const becomes = plan({
    tag: 'span',
    tokens: ['icon', ...tokens],
    attributes: given,
    hasSpread: false,
    hasRef: false,
    hasChildren: true,
    soleChild: inner,
  }).conversion;
  return {
    tag: 'span',
    tokens: ['icon', ...tokens],
    attributes: given,
    hasSpread: false,
    isEmpty: false,
    ...(becomes && { becomes }),
    soleChild: inner,
  };
}

/** A bare `<span>` holding one static text. */
export function textChild(text = 'x'): ChildFacts {
  return {
    tag: 'span',
    attributes: new Map(),
    hasSpread: false,
    isEmpty: false,
    text,
  };
}

/**
 * One built icon's props, as the transform writes them: its props, what
 * stays of its classes, then its `.icon`'s attributes, with `aria-label`
 * as `ariaLabel`.
 */
export function iconProps(
  built: BuiltIcon,
  child: ChildFacts
): Record<string, unknown> {
  const number = (name: string, value: unknown) =>
    built.numbers.includes(name) ? Number(value) : value;
  return {
    ...Object.fromEntries(
      built.props.map(([name, value]) => [name, number(name, value)])
    ),
    ...(built.className !== null && { className: built.className }),
    ...Object.fromEntries(
      [...child.attributes]
        .filter(([name]) => !built.drop.includes(name))
        .map(([name, value]) => [
          name === 'aria-label' ? 'ariaLabel' : name,
          number(name, value),
        ])
    ),
  };
}
