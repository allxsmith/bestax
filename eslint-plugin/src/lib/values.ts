/**
 * The prop → allowed-values table, built from the library's own exported
 * tuples rather than a copy of them.
 *
 * This import is why the package depends on `@allxsmith/bestax-bulma` at
 * runtime: the rule then validates against the tuples belonging to the
 * version the consumer actually installed, so it cannot drift. The
 * `/constants` subpath carries the tuples with no React and no component
 * code, so linting does not load the library proper.
 */
import {
  validAlignContents,
  validAlignItems,
  validAlignSelfs,
  validAlignments,
  validColorShades,
  validColors,
  validDisplays,
  validFlexDirections,
  validFlexGrowShrink,
  validFlexWraps,
  validFontFamilies,
  validJustifyContents,
  validSchemeColors,
  validSizes,
  validTextSizes,
  validTextTransforms,
  validTextWeights,
  validViewports,
  validVisibilities,
} from '@allxsmith/bestax-bulma/constants';

const SPACING_PROPS = [
  'm',
  'mt',
  'mr',
  'mb',
  'ml',
  'mx',
  'my',
  'p',
  'pt',
  'pr',
  'pb',
  'pl',
  'px',
  'py',
] as const;

/** The five bands `textSize`/`textAlign` are suffixed with. */
const TEXT_BANDS = [
  'Mobile',
  'Tablet',
  'Desktop',
  'Widescreen',
  'Fullhd',
] as const;

/** The nine bands `display`/`visibility` are suffixed with. */
const LAYOUT_BANDS = [
  'Mobile',
  'Tablet',
  'TabletOnly',
  'Touch',
  'Desktop',
  'DesktopOnly',
  'Widescreen',
  'WidescreenOnly',
  'Fullhd',
] as const;

const family = (
  base: string,
  bands: readonly string[],
  values: readonly string[]
): [string, readonly string[]][] => [
  [base, values],
  ...bands.map(b => [`${base}${b}`, values] as [string, readonly string[]]),
];

/**
 * Every helper prop whose accepted values are knowable from a tuple.
 *
 * `color` is deliberately absent: components redeclare it with their own
 * unions (`Button` adds `ghost` and `text`), so checking it against
 * `validColors` would report correct code. The `color` mistake that IS worth
 * reporting — using it as a surface on a component where it means text — is
 * `no-color-as-surface`.
 *
 * KEYED BY PROP, NOT BY ELEMENT, and that is a real limitation rather than a
 * simplification. A few components widen `bgColor` with the scheme colours
 * (`Box`, `Card`, `Container`, `Hero`, `Section`, `Footer`) and the rest do
 * not, so `<Block bgColor="scheme-main-bis" />` renders nothing and this table
 * accepts it. Every such gap points the same way — silence on a wrong value,
 * never a report on a right one — which is the direction to be wrong in, and
 * TypeScript catches this particular one. Closing it properly means a
 * per-element table, which the MCP index already extracts; that is a change
 * with its own dogfooding, not a tweak here. The hand-written `color`
 * exclusion above is the same limitation showing through.
 */
export const HELPER_VALUES: ReadonlyMap<string, readonly string[]> = new Map([
  ...SPACING_PROPS.map(p => [p, validSizes] as [string, readonly string[]]),
  ...family('textSize', TEXT_BANDS, validTextSizes),
  ...family('textAlign', TEXT_BANDS, validAlignments),
  // `none` is accepted alongside the display tuple; see BulmaDisplayProps.
  ...family('display', LAYOUT_BANDS, [...validDisplays, 'none']),
  ...family('visibility', LAYOUT_BANDS, validVisibilities),
  ['textTransform', validTextTransforms],
  ['textWeight', validTextWeights],
  ['fontFamily', validFontFamilies],
  ['flexDirection', validFlexDirections],
  ['flexWrap', validFlexWraps],
  ['justifyContent', validJustifyContents],
  ['alignContent', validAlignContents],
  ['alignItems', validAlignItems],
  ['alignSelf', validAlignSelfs],
  ['flexGrow', validFlexGrowShrink],
  ['flexShrink', validFlexGrowShrink],
  ['viewport', validViewports],
  ['colorShade', validColorShades],
  ['backgroundColorShade', validColorShades],
  // The colour props take the tuple plus the two CSS-wide keywords that
  // useColorClasses spreads in explicitly.
  ['textColor', [...validColors, 'inherit', 'current']],
  ['bgColor', [...validColors, ...validSchemeColors, 'inherit', 'current']],
  [
    'backgroundColor',
    [...validColors, ...validSchemeColors, 'inherit', 'current'],
  ],
]);

/** Props that emit a class only when a flex `display` is also set. */
export const FLEX_CONTAINER_PROPS: readonly string[] = [
  'flexDirection',
  'flexWrap',
  'justifyContent',
  'alignContent',
  'alignItems',
];

/** Every `display*` prop name, in declaration order. */
export const DISPLAY_PROPS: readonly string[] = [
  'display',
  ...LAYOUT_BANDS.map(b => `display${b}`),
];

/** `display` values that turn on a flex container. */
export const FLEX_DISPLAYS: readonly string[] = ['flex', 'inline-flex'];
