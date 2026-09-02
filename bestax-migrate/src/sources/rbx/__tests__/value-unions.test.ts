/**
 * The mapping table asserts that most rbx helper values pass through to
 * bestax unchanged — `textAlign="centered"`, `display="flex"`,
 * `textWeight="semibold"` and so on are the same string on both sides. That
 * assertion is invisible to every other check on this package: the fixtures
 * only use a handful of values, the corpus only parses, and the e2e
 * typecheck only sees the values its fixture happens to write.
 *
 * So this diffs rbx's own DEFAULTS against bestax's `valid*` constants
 * directly. If a future bestax release drops or renames a value, the
 * pass-through mappings become silently wrong and this is what catches it.
 *
 * rbx's table is vendored rather than read from disk: rbx is never installed
 * in this repository, and the values are frozen at its final release.
 */

import {
  validAlignments,
  validColors,
  validDisplays,
  validTextSizes,
  validTextTransforms,
  validTextWeights,
} from '@allxsmith/bestax-bulma';

/** rbx v2.2.0 `src/base/helpers/variables.ts` — DEFAULTS, verbatim. */
const RBX = {
  colors: [
    'primary',
    'success',
    'info',
    'warning',
    'danger',
    'light',
    'dark',
    'white',
    'black',
    'link',
  ],
  shades: [
    'black-bis',
    'black-ter',
    'grey-darker',
    'grey-dark',
    'grey',
    'grey-light',
    'grey-lighter',
    'white-ter',
    'white-bis',
  ],
  textAlignments: ['centered', 'justified', 'left', 'right'],
  textSizes: [1, 2, 3, 4, 5, 6, 7],
  textTransforms: ['capitalized', 'lowercase', 'uppercase'],
  textWeights: ['light', 'medium', 'normal', 'semibold', 'bold'],
  displays: ['block', 'flex', 'inline', 'inline-block', 'inline-flex'],
} as const;

/** The two rbx shades bestax has no counterpart for — mapping.ts TODOs both. */
const KNOWN_UNSUPPORTED_SHADES = ['white-ter', 'white-bis'];

describe('rbx helper values that the mapping passes through unchanged', () => {
  it.each([
    ['textAlign', RBX.textAlignments, validAlignments as readonly string[]],
    [
      'textTransform',
      RBX.textTransforms,
      validTextTransforms as readonly string[],
    ],
    ['textWeight', RBX.textWeights, validTextWeights as readonly string[]],
    ['display', RBX.displays, validDisplays as readonly string[]],
    ['color', RBX.colors, validColors as readonly string[]],
  ])(
    'every rbx %s value exists in bestax',
    (_name, rbxValues, bestaxValues) => {
      const missing = rbxValues.filter(v => !bestaxValues.includes(String(v)));
      expect(missing).toEqual([]);
    }
  );

  it('every rbx textSize maps to the string bestax expects', () => {
    // rbx types these as numbers; the mapping stringifies them.
    const missing = RBX.textSizes
      .map(String)
      .filter(v => !(validTextSizes as readonly string[]).includes(v));
    expect(missing).toEqual([]);
  });

  it('only the two known shades are unsupported', () => {
    // If this list grows, mapping.ts's SHADE_TODO must grow with it —
    // otherwise an unsupported shade passes through as a silent type error.
    const missing = RBX.shades.filter(
      v => !(validColors as readonly string[]).includes(v)
    );
    expect(missing.sort()).toEqual([...KNOWN_UNSUPPORTED_SHADES].sort());
  });
});
