/**
 * Bulma's responsive viewports and the suffix bestax puts on its per-viewport
 * helper props (`displayTabletOnly`, `visibilityTouch`, …).
 *
 * bestax's `validViewports` carries all nine, and the `display*` and
 * `visibility*` families declare a prop for every one of them. The
 * typography families (`textSize*`, `textAlign*`) declare only the five
 * non-`only`, non-`touch` viewports — a source that flattens those must
 * consult `TYPOGRAPHY_VIEWPORTS` rather than this table.
 *
 * Source-agnostic: keyed by Bulma's own suffixes, which every source library
 * spells the same way.
 */

export const VIEWPORT_SUFFIX: Record<string, string> = {
  mobile: 'Mobile',
  tablet: 'Tablet',
  'tablet-only': 'TabletOnly',
  touch: 'Touch',
  desktop: 'Desktop',
  'desktop-only': 'DesktopOnly',
  widescreen: 'Widescreen',
  'widescreen-only': 'WidescreenOnly',
  fullhd: 'Fullhd',
};

/** The viewports bestax's `textSize*` / `textAlign*` props exist for. */
export const TYPOGRAPHY_VIEWPORTS = [
  'mobile',
  'tablet',
  'desktop',
  'widescreen',
  'fullhd',
] as const;
