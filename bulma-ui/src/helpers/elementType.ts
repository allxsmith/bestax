// INTERNAL: deliberately not exported from src/index.ts.
import React from 'react';

/** A lazy type as React reads one. These fields are React's, not public. */
interface LazyType {
  $$typeof: symbol;
  _payload: unknown;
  _init: (payload: unknown) => unknown;
}

/**
 * Whether `type` is a lazy type, which `React.lazy` returns. The symbol is
 * looked up here rather than when the module loads, which must do nothing.
 */
const isLazy = (type: unknown): type is LazyType =>
  typeof type === 'object' &&
  type !== null &&
  (type as LazyType).$$typeof === Symbol.for('react.lazy') &&
  typeof (type as LazyType)._init === 'function';

/**
 * The component an element renders, read through a lazy type.
 *
 * A client component written in a React Server Component reaches the client
 * as a client reference, whose element type is lazy rather than the
 * component's own function, so `child.type === Part` is never true there
 * (#1500). This resolves a lazy type the way React does when it renders one:
 * a module that has loaded gives its component, one still loading throws, so
 * the caller suspends at the boundary the element itself would have, and one
 * that failed throws its error. A lazy type without those fields comes back
 * as it is, so a part goes unrecognized, which is what happened before.
 */
export function elementType(element: React.ReactElement): unknown {
  let type: unknown = element.type;
  while (isLazy(type)) type = type._init(type._payload);
  return type;
}

/**
 * Whether `node` is an element of one of `types`, including one written in a
 * Server Component. A parent tells its parts apart with this, never by
 * comparing `child.type`.
 */
export function isElementOf<P = unknown>(
  node: React.ReactNode,
  ...types: readonly unknown[]
): node is React.ReactElement<P> {
  return React.isValidElement(node) && types.includes(elementType(node));
}
