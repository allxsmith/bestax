import type React from 'react';

/**
 * Exactly what `<a>` adds over the attributes every element has: `href`,
 * `target`, `download`, `hrefLang`, `ping`, `referrerPolicy`, `media`, `type`.
 *
 * Subtracted from React's own types rather than listed. Listing them is how
 * `Level.Item` came to reject `download` at `as="a"` — its list said `href`,
 * `target`, `rel` and stopped (#641). A list gains an entry when someone
 * notices; a subtraction gains it when React does.
 *
 * NOT `rel`: React declares it on `HTMLAttributes`, for every element, so the
 * subtraction removes it. A component that withholds `rel` from a non-anchor is
 * making a compatibility choice rather than stating a fact about anchors, and
 * says so where it makes it.
 */
export type AnchorOnlyAttributes = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  keyof React.HTMLAttributes<HTMLAnchorElement>
>;

/**
 * The runtime mirror of `AnchorOnlyAttributes`, keyed so the two cannot drift.
 *
 * `Record<keyof …, true>` is what links them: the day React adds an anchor
 * attribute, every component deriving its props from `as` accepts it and this
 * object stops compiling until it is named here. A plain array beside a derived
 * type drifts in the one direction that matters — the type accepts the new
 * attribute and the filter lets it leak onto a `<div>`.
 */
export const ANCHOR_ONLY_ATTRS: Record<keyof AnchorOnlyAttributes, true> = {
  href: true,
  target: true,
  download: true,
  hrefLang: true,
  ping: true,
  referrerPolicy: true,
  media: true,
  type: true,
};

/**
 * `props` without the keys named in `strip`.
 *
 * The SET is per component and deliberately not shared, because the right
 * answer differs and the differences are principled. `Dropdown.Item` keeps
 * `type`, since its `as` includes `'button'` where `type` is valid. `Level.Item`
 * adds `rel`, which it has always withheld. `Menu.Item` strips `href` alone,
 * because its own props never declared the rest. What IS shared is the derived
 * source of truth above and this function; each caller states its delta and why.
 */
export function omitAttrs<T extends object>(
  props: T,
  strip: Record<string, true>
): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!(key in strip)) out[key] = value;
  }
  return out as T;
}
