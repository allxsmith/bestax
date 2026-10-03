/**
 * The prop → allowed-values table, built from the library's own exported
 * tuples rather than a copy of them.
 *
 * This import is why the package depends on `@allxsmith/bestax-bulma` at
 * runtime: the rule validates against the library's own tuples rather than a
 * copy of them. The `/constants` subpath carries those tuples with no React
 * and no component code, so linting does not load the library proper.
 *
 * Be precise about the version it reads, because an earlier draft of this
 * comment overclaimed it: the tuples come from the copy THIS PACKAGE resolves,
 * which an ordinary deduped install makes the app's, but a major-version split
 * does not. See eslint-plugin/CLAUDE.md, which also records why the dependency
 * is a runtime one and must stay that way.
 */
import {
  validAlignContents,
  validAlignItems,
  validAlignSelfs,
  validAlignments,
  validAspectRatios,
  validAxisOverflows,
  validColorShades,
  validColors,
  validCursors,
  validDisplays,
  validFlexDirections,
  validFlexGrowShrink,
  validFlexWraps,
  validFloats,
  validFontFamilies,
  validGaps,
  validInteractions,
  validJustifyContents,
  validOverflows,
  validPositions,
  validRadii,
  validResponsives,
  validSchemeColors,
  validShadows,
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
 * and the rest do not, so `<Block bgColor="scheme-main-bis" />` renders
 * nothing and this table accepts it. That gap points the safe way: silence on
 * a wrong value, never a report on a right one, and TypeScript catches this
 * particular one anyway. Closing it properly means a per-element table, which
 * the MCP index already extracts; that is a change with its own dogfooding,
 * not a tweak here. The hand-written `color` exclusion above is the same
 * limitation showing through.
 *
 * Where a value outside a prop's tuple still does something on some element,
 * the ordinary message would say something false about it and the rule has
 * to be told: see `DEPRECATED_VARIABLE_ROUTE` below.
 *
 * KEYED BY PROP also means each prop is judged ALONE, and the shade props are
 * where that shows. `<Box textColor="white-bis" colorShade="15" />` passes
 * both entries and renders `has-text-white-bis-15`, which the stylesheet does
 * not carry, and `bgColor` with `backgroundColorShade` is the same shape:
 * only the colours with a live component modifier take a shade, in either
 * family, which is the same set `UNSTYLED_MODIFIER_COLORS` is the complement
 * of. Pre-existing for the greys and the black pair, widened by two when the
 * white shades were added, and a false negative either way.
 *
 * A cross-prop check would close most of it off the partition
 * `scripts/color-tuple-css.test.mjs` asserts, but not all: `inherit` and
 * `current` are accepted by the same props, are live unshaded, and have no
 * shaded class either, and they are not in `validColors` for that partition
 * to cover. So the rule would need those two named as well.
 *
 * The scheme colours are NOT another case of it: they emit no class at all,
 * arriving as an inline `background-color` instead, with the shade documented
 * as ignored, and only a few components widen `bgColor` to accept them in the
 * first place.
 *
 * Left open because a rule reading two attributes at once is a different
 * shape from the rest of this table, and wants its own dogfooding rather than
 * riding along.
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
  ['float', validFloats],
  ['overflow', validOverflows],
  ['overflowX', validAxisOverflows],
  ['overflowY', validAxisOverflows],
  ['interaction', validInteractions],
  ['cursor', validCursors],
  ['radius', validRadii],
  ['shadow', validShadows],
  ['responsive', validResponsives],
  ['pos', validPositions],
  ['aspectRatio', validAspectRatios],
  // `gapless` is a boolean and stays out, like the other switches. The steps
  // are also accepted as numbers; see NUMERIC_STEPS.
  ['gap', validGaps],
  ['columnGap', validGaps],
  ['rowGap', validGaps],
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

/**
 * Props that take their steps as numbers as well as strings, so `gap={2}`
 * renders `is-gap-2` where `m={2}` renders nothing.
 *
 * The gap props are the case: `Grid` took its gaps as numbers before they
 * were shared helper props, and every gap prop still does. A number is
 * judged against the tuple read as strings, so `gap={1.5}` is accepted and
 * `gap={9}` is not. On `Columns` the tuple is its own whole steps, from
 * ELEMENT_VALUES, so `<Columns gap={1.5} />` is reported.
 */
export const NUMERIC_STEPS: ReadonlySet<string> = new Set([
  'gap',
  'columnGap',
  'rowGap',
]);

/**
 * Props whose only value REMOVES the thing the prop names, and what to call
 * that thing in a message.
 *
 * `shadow` reads like a switch for "give this a shadow", and its one value
 * does the reverse: `shadowless`. The generic shorthand remedy, "give it a
 * value: `shadowless`", therefore tells an author who wrote `<Box shadow />`
 * to do the opposite of what they meant, on an element whose shadow is on by
 * default. The report is right either way; only the remedy needed separating.
 *
 * `radius` left this map when it took Bulma's radius sizes, so `<Box radius />`
 * now gets the ordinary remedy, whose list includes values that add one.
 *
 * The rule pairs this with a `valid.length === 1` check rather than trusting
 * it alone, so "its only value" cannot become false by a value being added to
 * a prop's tuple.
 */
export const REMOVES_ONLY: ReadonlyMap<string, string> = new Map([
  ['shadow', 'shadow'],
]);

/**
 * Helper props that, on one element, still set a CSS variable when given a
 * string outside their tuple: a deprecated route the library keeps so code
 * written against its old behaviour keeps rendering. Keyed by element, then by
 * prop, to the variable the value lands in.
 *
 * `Theme` mints a prop for every Bulma CSS variable, and `--bulma-radius`
 * collided with the `radius` helper: until #694 that prop set the variable
 * whatever its type said. It is the helper now, as everywhere else, but a
 * string that is not a helper value still reaches `--bulma-radius`, with a
 * development warning pointing at `bulmaVars`. So `<Theme radius="6px" />` is
 * worth reporting, and the ordinary message, which says nothing renders, would
 * be false about it. The rule reports these with a message that says what
 * really happens and names the supported spelling, except for a near miss of
 * a valid value, which gets the usual suggestion with the same correction.
 *
 * Only a string takes that route. A number or `true` goes to the helper on
 * `Theme` as well, so the ordinary messages about those stay true.
 *
 * `columnGap` is the same story one release later: `--bulma-column-gap` minted
 * it as a variable prop, untyped but working, until the gap helpers became
 * shared helper props. A string that is not a gap step still sets the
 * variable on `Theme`, so `<Theme columnGap="1rem" />` gets the same report.
 *
 * `--bulma-shadow` would have collided the same way and was kept out of
 * Theme's variable map from the start, so `shadow` needs no entry.
 *
 * Declared rather than derived, and held to the library by
 * `scripts/helper-prop-collisions.test.mjs`, which reads Theme's source and
 * fails if a helper name is still taken as a variable prop or if this map and
 * the routes Theme really has disagree. Same shape as `SIBLING_RUNTIME_DEPS`
 * in check-conformance.mjs, and for the same reason: a declaration no test can
 * falsify becomes a fiction.
 */
export const DEPRECATED_VARIABLE_ROUTE: ReadonlyMap<
  string,
  ReadonlyMap<string, string>
> = new Map([
  [
    'Theme',
    new Map([
      ['radius', '--bulma-radius'],
      ['columnGap', '--bulma-column-gap'],
    ]),
  ],
]);

/**
 * Props an element declares itself with narrower values than the helper prop
 * of the same name. Keyed by element, then by prop, to the values the element
 * renders, and read before `HELPER_VALUES`.
 *
 * `Columns` declares its own `gap`, the columns gutter, which renders
 * `is-<n>` and comes in whole steps only. Judged against `validGaps`, a half
 * step there passed although it renders nothing, and a report listed the
 * half steps as valid. The whole steps are read off the library's tuple
 * rather than copied.
 */
export const ELEMENT_VALUES: ReadonlyMap<
  string,
  ReadonlyMap<string, readonly string[]>
> = new Map([
  [
    'Columns',
    new Map([['gap', validGaps.filter(step => !step.includes('.'))]]),
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
