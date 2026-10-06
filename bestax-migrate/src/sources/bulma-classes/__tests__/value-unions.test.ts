/**
 * The value lists `class-map.ts` builds helper classes from are copies of
 * bestax-bulma's own tuples (the table is data-only, so it cannot import
 * them). Diffing them here keeps a bestax value addition from going unmapped.
 */

import {
  validAlignContents,
  validAlignItems,
  validAlignSelfs,
  validAlignments,
  validAspectRatios,
  validAxisOverflows,
  validColors,
  validDisplays,
  validFlexDirections,
  validFlexGrowShrink,
  validFlexWraps,
  validFontFamilies,
  validGaps,
  validJustifyContents,
  validPositions,
  validRadii,
  validSizes,
  validTextSizes,
  validTextTransforms,
  validTextWeights,
  validViewports,
} from '@allxsmith/bestax-bulma/constants';
import {
  ALIGN_CONTENTS,
  ALIGN_ITEMS,
  ALIGN_SELFS,
  ALIGNMENTS,
  ASPECT_RATIOS,
  AXIS_OVERFLOWS,
  COLORS,
  DISPLAYS,
  FLEX_DIRECTIONS,
  FLEX_GROW_SHRINK,
  FLEX_WRAPS,
  FONT_FAMILIES,
  GAPS,
  JUSTIFY_CONTENTS,
  POSITIONS,
  RADII,
  SIZES,
  TEXT_SIZES,
  TEXT_TRANSFORMS,
  TEXT_WEIGHTS,
  VIEWPORTS,
} from '../class-map.js';

describe.each([
  ['COLORS', COLORS, validColors],
  ['SIZES', SIZES, validSizes],
  ['TEXT_SIZES', TEXT_SIZES, validTextSizes],
  ['ALIGNMENTS', ALIGNMENTS, validAlignments],
  ['TEXT_TRANSFORMS', TEXT_TRANSFORMS, validTextTransforms],
  ['TEXT_WEIGHTS', TEXT_WEIGHTS, validTextWeights],
  ['FONT_FAMILIES', FONT_FAMILIES, validFontFamilies],
  ['DISPLAYS', DISPLAYS, validDisplays],
  ['FLEX_DIRECTIONS', FLEX_DIRECTIONS, validFlexDirections],
  ['FLEX_WRAPS', FLEX_WRAPS, validFlexWraps],
  ['JUSTIFY_CONTENTS', JUSTIFY_CONTENTS, validJustifyContents],
  ['ALIGN_CONTENTS', ALIGN_CONTENTS, validAlignContents],
  ['ALIGN_ITEMS', ALIGN_ITEMS, validAlignItems],
  ['ALIGN_SELFS', ALIGN_SELFS, validAlignSelfs],
  ['FLEX_GROW_SHRINK', FLEX_GROW_SHRINK, validFlexGrowShrink],
  ['VIEWPORTS', VIEWPORTS, validViewports],
  ['GAPS', GAPS, validGaps],
  ['POSITIONS', POSITIONS, validPositions],
  ['AXIS_OVERFLOWS', AXIS_OVERFLOWS, validAxisOverflows],
  ['RADII', RADII, validRadii],
  ['ASPECT_RATIOS', ASPECT_RATIOS, validAspectRatios],
] as Array<[string, readonly string[], readonly string[]]>)(
  '%s',
  (_name, ours, bestax) => {
    it("matches bestax-bulma's tuple", () => {
      expect([...ours].sort()).toEqual([...bestax].sort());
    });
  }
);
