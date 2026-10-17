// INTERNAL: deliberately not exported from src/index.ts.
import { useRef } from 'react';
import { useClientLayoutEffect } from './useClientLayoutEffect';

/**
 * A ref holding the value from the latest commit, for a listener that is
 * added once and calls whatever callback it was given most recently.
 *
 * A listener whose effect lists a callback prop is taken off and added again
 * each time that callback changes, and an inline one changes on every render
 * of its parent. React can render between two listeners for the same
 * keypress, and the browser runs neither a listener taken off mid-event nor
 * one added mid-event, so that keypress never reaches it (#1088). Reading the
 * callback from here keeps the listener where it is.
 *
 * It's updated before paint on each commit, so a listener reads the props of
 * the render that's on screen.
 *
 * @function useLatestRef
 * @param value - The value to keep current, usually a callback prop.
 * @returns A ref whose `current` is `value` as of the latest commit.
 */
export function useLatestRef<T>(value: T): { readonly current: T } {
  const ref = useRef(value);
  useClientLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
