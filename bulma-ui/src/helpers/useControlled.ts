// INTERNAL: deliberately not exported from src/index.ts.
import { useState } from 'react';

/**
 * A value the caller holds, or one this hook holds when the caller doesn't:
 * the `x` / `defaultX` pair of a component's props. The caller holds it
 * whenever `controlled` isn't `undefined`, so `null` is a held value. The
 * setter changes only the value held here, so a held one changes when the
 * caller passes the new value, and it reports nothing: the component calls
 * its own `onXChange`.
 *
 * @function useControlled
 * @param controlled - The caller's value, or `undefined` to hold one here.
 * @param initial - The value held here to begin with.
 * @returns The current value, and the setter for the one held here.
 */
export function useControlled<T>(controlled: T | undefined, initial: T) {
  const [own, setOwn] = useState(initial);
  const isControlled = controlled !== undefined;
  const set = (next: T) => {
    if (!isControlled) setOwn(next);
  };
  return [isControlled ? controlled : own, set] as const;
}
