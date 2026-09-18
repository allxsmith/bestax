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
  validColorShades,
  validColors,
  validCursors,
  validDisplays,
  validFlexDirections,
  validFlexGrowShrink,
  validFlexWraps,
  validFloats,
  validFontFamilies,
  validInteractions,
  validJustifyContents,
  validOverflows,
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
 * Where a prop name means something else ENTIRELY on some element, the safe
 * direction is not available and the table has to be told: see
 * `NOT_A_HELPER_PROP` below.
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
 * For the text family that needs no new data, only a cross-prop check, and
 * `scripts/color-tuple-css.test.mjs` asserts the partition that makes it
 * possible. For the background family it needs a little more: `bgColor` takes
 * `validSchemeColors` as well, which sit outside that partition, so
 * `<Block bgColor="scheme-main" backgroundColorShade="15" />` is the same
 * false negative and is not covered by it.
 *
 * Left open either way, because a rule reading two attributes at once is a
 * different shape from the rest of this table and wants its own dogfooding
 * rather than riding along.
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
  ['interaction', validInteractions],
  ['cursor', validCursors],
  ['radius', validRadii],
  ['shadow', validShadows],
  ['responsive', validResponsives],
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
 * Props whose only value REMOVES the thing the prop names, and what to call
 * that thing in a message.
 *
 * `radius` and `shadow` read like switches for "give this a radius" and "give
 * this a shadow", and their one value does the reverse: `radiusless`,
 * `shadowless`. The generic shorthand remedy, "give it a value:
 * `shadowless`", therefore tells an author who wrote `<Box shadow />` to do
 * the opposite of what they meant, on an element whose shadow is on by
 * default. The report is right either way; only the remedy needed separating.
 *
 * The rule pairs this with a `valid.length === 1` check rather than trusting
 * it alone, so "its only value" cannot become false by a value being added to
 * one of those tuples.
 */
export const REMOVES_ONLY: ReadonlyMap<string, string> = new Map([
  ['radius', 'border radius'],
  ['shadow', 'shadow'],
]);

/**
 * Elements on which one of the names above is NOT a helper prop, so the table
 * must not be applied to it.
 *
 * `Theme` mints a prop for every Bulma CSS variable, and `--bulma-radius`
 * collides with the `radius` helper. On `Theme` the variable wins at runtime
 * while the declared type stays the helper union, so the two disagree and the
 * rule cannot say anything true about the pair (#694). Both readings:
 * `<Theme radius="6px" />` does not typecheck and does set the variable, so
 * reporting it is a false positive in the JS and JSX projects this rule is
 * for; `<Theme radius="radiusless" />` typechecks and renders
 * `style="--bulma-radius: radiusless"`, so the value the rule would call
 * correct is the one that does nothing. Silence is the only honest answer
 * until #694 picks a meaning.
 *
 * `--bulma-shadow` would collide the same way and is filtered out of that map
 * for exactly this reason, which is why `shadow` is a helper prop on `Theme`
 * and needs no entry here. That filter is the precedent #694 would follow.
 *
 * This is the one-way invariant above being held rather than abandoned:
 * silence on a wrong value is the direction to be wrong in, and a report on a
 * right one is not. Declared rather than derived, and held to the library by
 * `scripts/helper-prop-collisions.test.mjs`, which recomputes the collision
 * from the library's own variable list and fails if this map and the real one
 * disagree. Same shape as `SIBLING_RUNTIME_DEPS` in check-conformance.mjs,
 * and for the same reason: a declaration no test can falsify becomes a
 * fiction.
 */
export const NOT_A_HELPER_PROP: ReadonlyMap<
  string,
  ReadonlySet<string>
> = new Map([['Theme', new Set(['radius'])]]);

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
