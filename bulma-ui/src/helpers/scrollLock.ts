import { useEffect } from 'react';

// Ref-counted across every caller (e.g. a Dialog rendering its own Modal)
// so overlapping/nested locks don't fight over which one restores `overflow`.
// Every overlay that locks body scroll — Modal, Dialog, Sidebar, Loading —
// goes through here; a component setting `document.body.style.overflow`
// itself would clear a lock another overlay still needs.
let lockCount = 0;
let originalOverflow = '';

/**
 * Locks (and ref-counted-ly unlocks) `document.body` scrolling while `active`
 * is true. Safe to call from multiple components at once — the body scroll
 * is only restored once every active caller has released its lock.
 *
 * @function useScrollLock
 * @param active - Whether this caller wants the body scroll locked.
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return undefined;

    lockCount++;
    if (lockCount === 1) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    return () => {
      lockCount--;
      if (lockCount === 0) {
        document.body.style.overflow = originalOverflow;
      }
    };
  }, [active]);
}
