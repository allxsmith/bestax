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
export const ANCHOR_ONLY_ATTRS: Readonly<
  Record<keyof AnchorOnlyAttributes, true>
> = {
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
 * answer differs and the differences are principled: how open the component's
 * `as` is, and which of these attributes its own tags legitimately take. What
 * IS shared is the derived source of truth above and this function. Each caller
 * declares its delta next to the set it passes, which is the only place that
 * stays true when a component's `as` changes.
 */
export function omitAttrs<T extends object, K extends string>(
  props: T,
  strip: Readonly<Record<K, true>>
): Omit<T, K> {
  const out: Record<string | symbol, unknown> = {};
  // `Reflect.ownKeys`, not `Object.entries`: the latter drops symbol-keyed props.
  // React enumerates props with `for...in`, which never reports a symbol, so
  // nothing renders differently either way. It is not the same change for all
  // three callers: Menu filtered by rest-destructure and kept them already,
  // while Dropdown and Level filtered through `Object.entries` and did not, so
  // this restores one and widens two. Symbols are the only shape where those
  // two disagreed, and keeping them is the side a spread is on.
  for (const key of Reflect.ownKeys(props)) {
    // Enumerability, for the same reason in the other direction: `Reflect.ownKeys`
    // also reports NON-enumerable own props, which every filter this replaced left
    // behind. Copying one out would both add a prop the old code dropped and make
    // it enumerable on the way, so widening the key source must not widen this.
    if (!Object.prototype.propertyIsEnumerable.call(props, key)) continue;
    const value = (props as Record<string | symbol, unknown>)[key];
    // `hasOwnProperty`, not `key in strip`: `in` walks the prototype chain, so a
    // prop named `toString`, `valueOf`, `constructor` or `hasOwnProperty` was
    // stripped although no caller named it — and anything written to
    // `Object.prototype` would start deleting props that share its keys.
    if (
      typeof key === 'symbol' ||
      !Object.prototype.hasOwnProperty.call(strip, key)
    ) {
      // `defineProperty`, not `out[key] = value`: assignment consults the
      // prototype chain for a setter, and `__proto__` has one. A prop named
      // `__proto__` would be swallowed by it — dropped from the result AND
      // replacing the result's prototype with its value. A spread and a rest
      // destructure both DEFINE, which is what makes them immune, so this has
      // to define too.
      Object.defineProperty(out, key, {
        value,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
  }
  return out as Omit<T, K>;
}
