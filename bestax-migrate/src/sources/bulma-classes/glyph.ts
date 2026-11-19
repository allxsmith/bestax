/**
 * Read an icon's glyph, the `<i>` inside a `.icon`, as the props bestax
 * `Icon` builds it from, spelled the way the bestax-icons skill writes them.
 * Pure: a glyph reads only when `Icon`, given those props, renders that `<i>`
 * with exactly its classes and nothing else, but for one exception on
 * purpose. Font Awesome 6's long name for a style (`fa-brands`) is written as
 * the skill's `variant` (`brands`), which `Icon` renders as the short name
 * (`fab`), the same style in 6 and 7 (`longStyle` says so). `library` is left
 * out for Font Awesome, `Icon`'s default, as the skill writes it: like every
 * conversion, this assumes no `ConfigProvider` sets another default (its
 * `iconLibrary` here, as its `classPrefix` would for any component).
 */

import type { ChildFacts } from './plan.js';

export interface Glyph {
  library: 'fa' | 'mdi';
  name: string;
  /** Font Awesome's style, when it isn't `Icon`'s default `fas`. */
  variant?: string;
  /** The glyph's other classes, which `Icon` renders after its own. */
  features?: string[];
  /**
   * The long name of Font Awesome's style the `<i>` was written with
   * (`fa-brands`), when `variant` is the skill's name for it, which `Icon`
   * renders as the short one (`fab`): a way a conversion's markup differs
   * on purpose. The render tests compare it with the short name restated.
   */
  longStyle?: string;
}

/**
 * Font Awesome's style classes, as the `variant` the bestax-icons skill
 * writes for each. `Icon` renders its `variant` through a table of the
 * skill's names (`regular` as `far`), and as written otherwise, so `fa`, Font
 * Awesome 4's, reads as itself: 4 styles nothing else, and 5 and later read
 * it as solid. `fas` is `Icon`'s default.
 */
const FA_STYLES: Readonly<Record<string, string | undefined>> = {
  fas: undefined,
  far: 'regular',
  fab: 'brands',
  fal: 'light',
  fad: 'duotone',
  fat: 'thin',
  fa: 'fa',
  'fa-solid': undefined,
  'fa-regular': 'regular',
  'fa-brands': 'brands',
  'fa-light': 'light',
  'fa-thin': 'thin',
  'fa-duotone': 'duotone',
};

/**
 * Font Awesome 6's long names for its styles, which `Icon` writes as the
 * short ones (`fab`) once read as the skill's `variant`. Font Awesome 6
 * styles an `<i>` the same either way, and 7 does too, but that its short
 * names also set the classic family: so beside `fa-sharp`, which sets
 * another, the long name is kept as written. 5 and older have no long
 * names.
 */
const LONG_STYLES = new Set([
  'fa-solid',
  'fa-regular',
  'fa-brands',
  'fa-light',
  'fa-thin',
  'fa-duotone',
]);

/** Font Awesome's classes that modify a glyph rather than name one. */
const FA_MODIFIERS = new Set([
  'fa-2xs',
  'fa-xs',
  'fa-sm',
  'fa-lg',
  'fa-xl',
  'fa-2xl',
  ...Array.from({ length: 10 }, (_, index) => `fa-${index + 1}x`),
  'fa-fw',
  'fa-width-auto',
  'fa-border',
  'fa-inverse',
  'fa-li',
  'fa-ul',
  'fa-pull-left',
  'fa-pull-right',
  'fa-pull-start',
  'fa-pull-end',
  'fa-spin',
  'fa-pulse',
  'fa-spin-pulse',
  'fa-spin-reverse',
  'fa-beat',
  'fa-beat-fade',
  'fa-bounce',
  'fa-fade',
  'fa-flip',
  'fa-shake',
  'fa-rotate-90',
  'fa-rotate-180',
  'fa-rotate-270',
  'fa-rotate-by',
  'fa-flip-horizontal',
  'fa-flip-vertical',
  'fa-flip-both',
  'fa-stack-1x',
  'fa-stack-2x',
  'fa-swap-opacity',
  'fa-sharp',
  'fa-classic',
]);

/** The class Font Awesome's script puts on each `<svg>` it draws. */
const DRAWN = 'svg-inline--fa';

/** Material Design Icons' classes that modify a glyph rather than name one. */
const MDI_MODIFIERS = new Set([
  'mdi-18px',
  'mdi-24px',
  'mdi-36px',
  'mdi-48px',
  'mdi-dark',
  'mdi-light',
  'mdi-inactive',
  ...[45, 90, 135, 180, 225, 270, 315].map(angle => `mdi-rotate-${angle}`),
  'mdi-flip-h',
  'mdi-flip-v',
  'mdi-spin',
]);

/**
 * The props `Icon` renders this glyph from, or undefined when it can't: the
 * glyph must be a bare, empty `<i>` whose classes name one Font Awesome or
 * Material Design Icons glyph.
 */
export function readGlyph(glyph: ChildFacts | undefined): Glyph | undefined {
  if (
    glyph?.tag !== 'i' ||
    !glyph.tokens ||
    glyph.attributes.size > 0 ||
    glyph.hasSpread ||
    !glyph.isEmpty
  ) {
    return undefined;
  }
  const tokens = glyph.tokens;
  const styles = tokens.filter(token => Object.hasOwn(FA_STYLES, token));
  const mdi = tokens.includes('mdi');
  if (styles.length === 1 && !mdi) {
    const [style] = styles;
    const named = nameIn(tokens, 'fa-', FA_MODIFIERS, style);
    if (!named) return undefined;
    // Beside another family, the long name stays as written (`LONG_STYLES`).
    const long = LONG_STYLES.has(style) && !tokens.includes('fa-sharp');
    const variant = long || !LONG_STYLES.has(style) ? FA_STYLES[style] : style;
    return {
      library: 'fa',
      name: named.name,
      ...(variant && { variant }),
      ...(named.features.length > 0 && { features: named.features }),
      ...(long && { longStyle: style }),
    };
  }
  if (mdi && styles.length === 0) {
    const named = nameIn(tokens, 'mdi-', MDI_MODIFIERS, 'mdi');
    if (!named) return undefined;
    return {
      library: 'mdi',
      name: named.name,
      ...(named.features.length > 0 && { features: named.features }),
    };
  }
  return undefined;
}

/**
 * The glyph of Font Awesome's own markup, `<i class="fas fa-home"
 * aria-hidden="true">`: an `<i>` that carries that attribute and nothing
 * else, and that `readGlyph` reads once it's set aside. Undefined for any
 * other `<i>`, one that `readGlyph` reads as it is included.
 */
export function readHiddenGlyph(
  glyph: ChildFacts | undefined
): Glyph | undefined {
  const hidden = glyph?.attributes.get('aria-hidden');
  if (glyph?.attributes.size !== 1 || (hidden !== 'true' && hidden !== true)) {
    return undefined;
  }
  return readGlyph({ ...glyph, attributes: new Map() });
}

/**
 * A glyph as the props `Icon` is given, in the order they're written: no
 * `library` for Font Awesome, `Icon`'s default, and one feature as a string,
 * more than one as a list.
 */
export function glyphProps(
  glyph: Glyph
): Array<[name: string, value: string | readonly string[]]> {
  const { features } = glyph;
  return [
    ...(glyph.library === 'fa'
      ? []
      : [['library', glyph.library] as [string, string]]),
    ['name', glyph.name],
    ...(glyph.variant ? [['variant', glyph.variant] as [string, string]] : []),
    ...(features
      ? [
          ['features', features.length === 1 ? features[0] : features] as [
            string,
            string | readonly string[],
          ],
        ]
      : []),
  ];
}

/**
 * The glyph Font Awesome's script drew an `<svg class="svg-inline--fa">` for,
 * as the props `Icon` renders the `<i>` it was drawn from: the name from its
 * `data-icon` (else its one class naming a glyph), the style from its
 * `data-prefix`, and its other classes but the width one the script adds.
 * The script is Font Awesome 5's or later, which reads the `fa` prefix as
 * solid, so that one is `Icon`'s default here. For advice only: `Icon`
 * renders that `<i>`, never the `<svg>`.
 */
export function readDrawnGlyph(svg: ChildFacts | undefined): Glyph | undefined {
  if (svg?.tag !== 'svg' || !svg.tokens?.includes(DRAWN)) return undefined;
  const tokens = svg.tokens.filter(
    token => token !== DRAWN && !/^fa-w-\d+$/.test(token)
  );
  const prefix = svg.attributes.get('data-prefix');
  const style =
    typeof prefix === 'string' && Object.hasOwn(FA_STYLES, prefix)
      ? prefix
      : 'fas';
  const icon = svg.attributes.get('data-icon');
  const named =
    typeof icon === 'string' && /^[a-z0-9-]+$/.test(icon)
      ? {
          name: icon,
          features: tokens.filter(token => token !== `fa-${icon}`),
        }
      : nameIn(tokens, 'fa-', FA_MODIFIERS, style);
  if (!named) return undefined;
  const variant = style === 'fa' ? undefined : FA_STYLES[style];
  return {
    library: 'fa',
    name: named.name,
    ...(variant && { variant }),
    ...(named.features.length > 0 && { features: named.features }),
  };
}

/**
 * The one class among `tokens` that names a glyph (`fa-home`), without its
 * prefix, and the rest but `base`, as features. Undefined unless exactly one
 * does, and its name doesn't start with the prefix again, which `Icon` would
 * strip.
 */
function nameIn(
  tokens: readonly string[],
  prefix: string,
  modifiers: ReadonlySet<string>,
  base: string
): { name: string; features: string[] } | undefined {
  const rest = tokens.filter(token => token !== base);
  const names = rest.filter(
    token =>
      token.startsWith(prefix) &&
      token.length > prefix.length &&
      !modifiers.has(token)
  );
  if (names.length !== 1) return undefined;
  const name = names[0].slice(prefix.length);
  if (name.startsWith(prefix)) return undefined;
  return { name, features: rest.filter(token => token !== names[0]) };
}
