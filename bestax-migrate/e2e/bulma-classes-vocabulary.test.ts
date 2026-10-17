/**
 * The bulma-classes table accounts for Bulma's whole vocabulary, the way the
 * library sources' mapping-coverage tests walk a vendored export list. The
 * list here is the class names in Bulma v1's own stylesheet, read from the
 * copy bestax-bulma depends on, so a Bulma release that adds a class fails
 * this until the table says what it is.
 *
 * Both directions: every class in the stylesheet is a root, a modifier, a
 * helper or a named passthrough; and every class the table names is one the
 * stylesheet has (or a Bulma 0.9 class it knows was removed).
 */

import {
  HELPER_TOKENS,
  LEGACY_09,
  ROOTS,
  passthroughReason,
} from '../src/sources/bulma-classes/class-map.js';
import {
  bulmaStylesheet,
  stylesheetRules,
} from './support/bulma-stylesheet.js';

/** Class names used in the stylesheet's selectors. */
function stylesheetClasses(): Set<string> {
  const classes = new Set<string>();
  // Only selectors are read, so declaration bodies (which hold URLs like
  // `.svg`) never reach the match.
  for (const { selector } of stylesheetRules(bulmaStylesheet())) {
    const bare = selector
      .replace(/\[[^\]]*\]/g, '')
      .replace(/"[^"]*"|'[^']*'/g, '');
    // A name can carry an escaped character (`.is-gap-0\.5`), which the
    // class itself spells plainly.
    for (const match of bare.matchAll(/\.(-?[_a-zA-Z](?:[\w-]|\\.)*)/g)) {
      classes.add(match[1].replace(/\\(.)/g, '$1'));
    }
  }
  return classes;
}

const modifiers = new Set(
  Object.values(ROOTS).flatMap(entry => Object.keys(entry.modifiers ?? {}))
);

describe("the table accounts for Bulma's stylesheet", () => {
  const classes = stylesheetClasses();

  it('reads a stylesheet worth the name', () => {
    expect(classes.has('button')).toBe(true);
    expect(classes.has('has-text-centered')).toBe(true);
    expect(classes.size).toBeGreaterThan(1000);
  });

  it('classifies every class the stylesheet has', () => {
    const unclassified = [...classes].filter(
      token =>
        !ROOTS[token] &&
        !modifiers.has(token) &&
        !HELPER_TOKENS.has(token) &&
        !passthroughReason(token)
    );
    expect(unclassified).toEqual([]);
  });

  it('names no class the stylesheet lacks', () => {
    const named = [
      ...Object.keys(ROOTS),
      ...modifiers,
      ...HELPER_TOKENS.keys(),
    ];
    expect(
      named.filter(token => !classes.has(token) && !LEGACY_09[token])
    ).toEqual([]);
  });
});
