/**
 * The mapping table asserts that bloomer's helper values pass through to
 * bestax unchanged — `hasTextAlign="centered"`, `isDisplay="flex"`,
 * `isHidden="tablet-only"`. That assertion is invisible to every other check
 * on this package: the fixtures use a handful of values, the corpus only
 * parses, and the e2e typecheck only sees what its fixture happens to write.
 *
 * So this diffs bloomer's own type unions (and the Bulma 0.6 colour names it
 * documented) against bestax's `valid*` constants directly. If a future
 * bestax release drops or renames a value, the pass-through mappings become
 * silently wrong and this is what catches it.
 *
 * bloomer's unions are vendored rather than read from disk: bloomer is never
 * installed in this repository, and the values are frozen at its final
 * release.
 */

import {
  validAlignments,
  validColors,
  validDisplays,
  validViewports,
} from '@allxsmith/bestax-bulma';
import { COLUMN_SIZE_MAP, MAPPING, UNIVERSAL_PROPS } from '../mapping.js';
import { VIEWPORT_SUFFIX } from '../../_shared/viewports.js';

/** bloomer 0.6.5 `src/bulma.tsx` — the `Bulma` namespace, verbatim. */
const BLOOMER = {
  textAlignments: ['left', 'right', 'centered'],
  displays: ['flex', 'block', 'inline', 'inline-block', 'inline-flex'],
  platforms: ['mobile', 'tablet', 'touch', 'desktop', 'widescreen'],
  platformsOnly: ['tablet-only', 'desktop-only'],
  // Bulma 0.6's `$colors` map plus `link`, which its docs use as a colour.
  colors: [
    'white',
    'black',
    'light',
    'dark',
    'primary',
    'link',
    'info',
    'success',
    'warning',
    'danger',
  ],
  // Bulma 0.6's `$shades` map — `has-text-*` accepted every one of these.
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
} as const;

/** The two shades bestax has no counterpart for — mapping.ts TODOs both. */
const KNOWN_UNSUPPORTED_SHADES = ['white-ter', 'white-bis'];

describe('bloomer helper values that the mapping passes through unchanged', () => {
  it('every bloomer text alignment exists in bestax', () => {
    const missing = BLOOMER.textAlignments.filter(
      v => !(validAlignments as readonly string[]).includes(v)
    );
    expect(missing).toEqual([]);
  });

  it('every bloomer display exists in bestax', () => {
    const missing = BLOOMER.displays.filter(
      v => !(validDisplays as readonly string[]).includes(v)
    );
    expect(missing).toEqual([]);
  });

  it('every bloomer platform, including the -only ones, is a bestax viewport', () => {
    const all = [...BLOOMER.platforms, ...BLOOMER.platformsOnly];
    const missing = all.filter(
      v => !(validViewports as readonly string[]).includes(v)
    );
    expect(missing).toEqual([]);
    // …and the suffix table the flattener writes props from covers them.
    expect(all.filter(v => !(v in VIEWPORT_SUFFIX))).toEqual([]);
  });

  it("the shared viewport table is exactly bestax's validViewports", () => {
    expect(Object.keys(VIEWPORT_SUFFIX).sort()).toEqual(
      [...(validViewports as readonly string[])].sort()
    );
  });

  it('every Bulma 0.6 colour exists in bestax', () => {
    const missing = BLOOMER.colors.filter(
      v => !(validColors as readonly string[]).includes(v)
    );
    expect(missing).toEqual([]);
  });

  it('only the two known shades are unsupported', () => {
    // If this list grows, mapping.ts's SHADE_TODO must grow with it —
    // otherwise an unsupported shade passes through as a silent type error.
    const missing = BLOOMER.shades.filter(
      v => !(validColors as readonly string[]).includes(v)
    );
    expect(missing.sort()).toEqual([...KNOWN_UNSUPPORTED_SHADES].sort());
    const todo = UNIVERSAL_PROPS.hasTextColor.valueTodo ?? {};
    expect(Object.keys(todo).sort()).toEqual(
      [...KNOWN_UNSUPPORTED_SHADES].sort()
    );
  });

  it("names every colour outside Message's six-colour union", () => {
    const todo = MAPPING.Message.props?.isColor?.valueTodo ?? {};
    const semantic = [
      'primary',
      'link',
      'info',
      'success',
      'warning',
      'danger',
    ];
    const outside = BLOOMER.colors.filter(c => !semantic.includes(c));
    expect(Object.keys(todo).sort()).toEqual([...outside].sort());
  });

  it('maps every bloomer column fraction and width word', () => {
    expect(Object.keys(COLUMN_SIZE_MAP).sort()).toEqual(
      ['1/2', '1/3', '1/4', '2/3', '3/4', 'full'].sort()
    );
  });
});
