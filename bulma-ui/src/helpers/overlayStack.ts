// INTERNAL: deliberately not exported from src/index.ts.
import { useCallback, useEffect, useRef } from 'react';
import { useLatestRef } from './useLatestRef';

/** An open overlay's place in the stack. */
interface OpenOverlay {
  /**
   * Whether it shuts off the page under it, as a Modal does, so it holds Tab
   * rather than leaving it to an overlay under it. A Sidebar without an
   * overlay doesn't.
   */
  modal: boolean;
}

/**
 * The open overlays that take part, in the order they opened. Only the last
 * one answers Escape, so one keypress closes one layer, and only the last
 * modal one holds Tab. It's touched in effects and key handlers, never while
 * rendering, so a server render leaves it alone.
 */
const openOverlays: OpenOverlay[] = [];

/**
 * Whether a modal overlay is open anywhere in the stack. One that isn't modal
 * and opens while one is leaves focus where it is, since the modal one keeps
 * Tab and a Tab from the new one's controls would only go back to it.
 *
 * @function isModalOverlayOpen
 * @returns Whether any open overlay in the stack is modal.
 */
export const isModalOverlayOpen = (): boolean =>
  openOverlays.some(overlay => overlay.modal);

/**
 * Holds this overlay's place in the stack of open overlays while `inStack`
 * is true, from the effect after it opens until the one after it closes.
 * Opening again puts it back on top.
 *
 * Returns a check for whether nothing in the stack sits above this overlay,
 * to call when a key arrives. For an overlay in the stack, that's whether it
 * is the topmost one. For one that isn't, such as a Toast, it's whether no
 * overlay is open at all. Asked about `'modal'` overlays, it counts only the
 * modal ones, which is the check for Tab: a modal overlay keeps holding Tab
 * with one that isn't modal open over it, while that one takes Escape.
 *
 * @function useOverlayStack
 * @param inStack - Whether this overlay is open and takes part.
 * @param modal - Whether this overlay is modal, which it is unless it says
 * otherwise: a Sidebar passes whether it has an overlay. It can change while
 * the overlay is open, and its place stays where it is.
 * @returns A check for whether nothing in the stack, or no modal overlay, is
 * above this overlay.
 */
export function useOverlayStack(
  inStack: boolean,
  modal = true
): (among?: 'modal') => boolean {
  const tokenRef = useRef<OpenOverlay>({ modal });

  useEffect(() => {
    tokenRef.current.modal = modal;
  }, [modal]);

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

  return useCallback((among?: 'modal') => {
    // Everything above this overlay, or the whole stack for one not in it.
    const above = openOverlays.slice(
      openOverlays.indexOf(tokenRef.current) + 1
    );
    return !above.some(overlay => among !== 'modal' || overlay.modal);
  }, []);
}

/**
 * Calls `onEscape` for an Escape while `active` and the overlay is the
 * topmost one, as `isTopmost` (from `useOverlayStack`) says, and marks the key
 * used with `preventDefault()`, so nothing under it acts on it too.
 *
 * It listens on `window`, so everything inside the overlay has had the key
 * first, and an Escape something there used, such as a popup closing, is
 * left to it. The listener stays put while `onEscape` changes identity, as an
 * inline one does on every render of the parent: it reads the latest one as
 * the key arrives.
 *
 * @function useOverlayEscape
 * @param active - Whether the overlay is open and closes on Escape.
 * @param isTopmost - The overlay's check from `useOverlayStack`.
 * @param onEscape - What closing it does.
 */
export function useOverlayEscape(
  active: boolean,
  isTopmost: () => boolean,
  onEscape: () => void
): void {
  const onEscapeRef = useLatestRef(onEscape);

  useEffect(() => {
    if (!active) return undefined;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || !isTopmost()) return;
      e.preventDefault();
      onEscapeRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, isTopmost, onEscapeRef]);
}
