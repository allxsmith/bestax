/**
 * Read an icon's glyph, the `<i>` inside a `.icon`, as the props bestax
 * `Icon` builds it from. Pure and exact: a glyph reads only when `Icon`,
 * given those props, renders that `<i>` with exactly its classes and nothing
 * else. `library` is always written, so a `ConfigProvider` with another
 * `iconLibrary` can't change what renders.
 */

import type { ChildFacts } from './plan.js';

export interface Glyph {
  library: 'fa' | 'mdi';
  name: string;
  /** Font Awesome's style, when it isn't `Icon`'s default `fas`. */
  variant?: string;
  /** The glyph's other classes, which `Icon` renders after its own. */
  features?: string[];
}

/**
 * Font Awesome's style classes. `Icon` renders its `variant` through this
 * table when it's a key (`regular` as `far`), and as written otherwise, so
 * the short forms read as the name `Icon` knows them by and the rest
 * (`fa`, `fa-solid`) as themselves. `fas` is its default.
 */
const FA_STYLES: Readonly<Record<string, string | undefined>> = {
  fas: undefined,
  far: 'regular',
  fab: 'brands',
  fal: 'light',
  fad: 'duotone',
  fat: 'thin',
  fa: 'fa',
  'fa-solid': 'fa-solid',
  'fa-regular': 'fa-regular',
  'fa-brands': 'fa-brands',
  'fa-light': 'fa-light',
  'fa-thin': 'fa-thin',
  'fa-duotone': 'fa-duotone',
};

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
    const variant = FA_STYLES[style];
    return {
      library: 'fa',
      name: named.name,
      ...(variant && { variant }),
      ...(named.features.length > 0 && { features: named.features }),
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
