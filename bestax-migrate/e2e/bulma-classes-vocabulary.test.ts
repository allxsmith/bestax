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
  validColorShades,
  validColors,
} from '@allxsmith/bestax-bulma/constants';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  HELPER_TOKENS,
  LEGACY_09,
  REMOVED_IN_V1,
  ROOTS,
  passthroughReason,
} from '../src/sources/bulma-classes/class-map.js';
import {
  bulmaStylesheet,
  stylesheetClasses,
} from './support/bulma-stylesheet.js';

const modifiers = new Set(
  Object.values(ROOTS).flatMap(entry => Object.keys(entry.modifiers ?? {}))
);

describe("the table accounts for Bulma's stylesheet", () => {
  const classes = stylesheetClasses(bulmaStylesheet());

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

  // bestax renders `has-text-{color}-{shade}` for every color and shade its
  // props take, and Bulma has a rule for some of them: each of those
  // converts, as that color and that shade, or as the color of that name
  // (`grey` and `light` render `has-text-grey-light`, which `grey-light` is).
  it('converts every shade class it has that one color and one shade render', () => {
    const rendered = validColors.flatMap(color =>
      validColorShades.flatMap(shade =>
        (
          [
            ['has-text', 'colorShade'],
            ['has-background', 'backgroundColorShade'],
          ] as const
        ).map(([prefix, prop]) => ({
          token: `${prefix}-${color}-${shade}`,
          color,
          also: { prop, value: shade },
        }))
      )
    );
    const shades = rendered.filter(({ token }) => classes.has(token));
    expect(shades.length).toBeGreaterThan(400);
    expect(
      shades
        .filter(({ token, color, also }) => {
          const helper = HELPER_TOKENS.get(token);
          const asShade =
            helper?.write.value === color &&
            JSON.stringify(helper.also) === JSON.stringify(also);
          const asColor =
            helper?.also === undefined &&
            helper?.write.value === `${color}-${also.value}`;
          return !asShade && !asColor;
        })
        .map(({ token }) => token)
    ).toEqual([]);
  });

  it('has none of the classes it lists as removed, and flags only those', () => {
    expect(REMOVED_IN_V1.filter(token => classes.has(token))).toEqual([]);
    expect(
      Object.keys(LEGACY_09).filter(token => !REMOVED_IN_V1.includes(token))
    ).toEqual([]);
  });

  // `lookup_bulma_classes` calls a class missing from the MCP index's list one
  // Bulma 1 has no rule for, ahead of its passthrough group, so a class read
  // here and missing there would be misreported. The two read one walk, and
  // this holds the Bulma each reads to the same one.
  it('is the vocabulary the MCP index ships', () => {
    const index = JSON.parse(
      fs.readFileSync(
        path.join(
          path.dirname(fileURLToPath(import.meta.url)),
          '..',
          '..',
          'bestax-mcp',
          'data',
          'bulma-classes.json'
        ),
        'utf8'
      )
    );
    expect(index.vocabulary).toEqual(
      [...classes].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    );
  });
});
