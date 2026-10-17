// INTERNAL: deliberately not exported from src/index.ts.
import { useCallback, useEffect, useRef } from 'react';

/**
 * The open overlays that take part, in the order they opened. Only the last
 * one answers Escape, so one keypress closes one layer. It's touched in
 * effects and key handlers, never while rendering, so a server render leaves
 * it alone.
 */
const openOverlays: object[] = [];

/**
 * Holds this overlay's place in the stack of open overlays while `inStack`
 * is true, from the effect after it opens until the one after it closes.
 * Opening again puts it back on top.
 *
 * Returns a check for whether nothing in the stack sits above this overlay,
 * to call when a key arrives. For an overlay in the stack, that's whether it
 * is the topmost one. For one that isn't, such as a Toast, it's whether no
 * overlay is open at all.
 *
 * @function useOverlayStack
 * @param inStack - Whether this overlay is open and takes part.
 * @returns A check for whether nothing in the stack is above this overlay.
 */
export function useOverlayStack(inStack: boolean): () => boolean {
  const tokenRef = useRef<object>({});

  useEffect(() => {
    if (!inStack) return undefined;
    const token = tokenRef.current;
    openOverlays.push(token);
    // Takes out this effect's own push. Should it ever be gone already, the
    // stack is left as it is: splicing at -1 would take the topmost overlay
    // instead.
    return () => {
      const index = openOverlays.indexOf(token);
      if (index !== -1) openOverlays.splice(index, 1);
    };
  }, [inStack]);

  return useCallback(() => {
    const top = openOverlays[openOverlays.length - 1];
    return top === undefined || top === tokenRef.current;
  }, []);
}
