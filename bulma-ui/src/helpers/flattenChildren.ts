// INTERNAL: deliberately not exported from src/index.ts.
import React from 'react';

/**
 * A component's children as a flat list, with each Fragment opened up
 * (recursively) so the items inside one count one by one rather than as the
 * Fragment. `Children.toArray` already drops `null`, `undefined` and
 * booleans and flattens arrays, but it keeps a Fragment whole, so an empty
 * one would still count as an item and two items in one would count as one.
 *
 * `Children.toArray` keys restart at ".0" inside each Fragment, so the items
 * in one are re-keyed with the Fragment's own key as a prefix. Otherwise an
 * item in a Fragment and a sibling outside it could share a key.
 *
 * Text and numbers pass through as they are, so a caller that wants only
 * elements filters with `React.isValidElement`.
 */
export function flattenChildren(
  children: React.ReactNode,
  keyPrefix = ''
): React.ReactNode[] {
  return React.Children.toArray(children).flatMap(child => {
    if (!React.isValidElement(child)) return [child];
    if (child.type === React.Fragment) {
      return flattenChildren(
        (child.props as { children?: React.ReactNode }).children,
        keyPrefix + child.key
      );
    }
    return [
      keyPrefix
        ? React.cloneElement(child, { key: keyPrefix + child.key })
        : child,
    ];
  });
}
