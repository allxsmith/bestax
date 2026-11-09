import { useEffect } from 'react';

// Ref-counted across every caller (e.g. a Dialog rendering its own Modal)
// so overlapping/nested locks don't fight over which one restores the page.
// Every overlay that locks the page (Modal, Dialog, Sidebar, Loading,
// AppFrame's drawer) goes through here; a component setting these styles
// itself would clear a lock another overlay still needs.
let lockCount = 0;
let unlock: (() => void) | null = null;

/**
 * Locks the page's scrolling and pads it by the room the scrollbar took, so
 * its content stays put as the scrollbar goes. It locks `<html>` rather than
 * `<body>`: the viewport takes `<body>`'s overflow only while `<html>`'s is
 * `visible`, and Bulma's isn't. The side to pad is measured rather than read
 * from the text direction, since an engine can keep the page's scrollbar on
 * the right under right-to-left text. With an overlay scrollbar, or a gutter
 * `scrollbar-gutter` keeps, nothing moves and nothing is padded. An element
 * fixed to the window is placed against the viewport, not `<html>`, so the
 * padding doesn't reach it.
 *
 * @returns A function that puts back the styles it changed.
 */
function lockPage(): () => void {
  const root = document.documentElement;
  const { overflow, paddingLeft, paddingRight } = root.style;

  const before = root.getBoundingClientRect();
  root.style.overflow = 'hidden';
  const after = root.getBoundingClientRect();

  const left = before.left - after.left;
  const right = after.right - before.right;
  if (left > 0 || right > 0) {
    // The computed padding is in pixels, whatever unit set it.
    const style = getComputedStyle(root);
    const add = (padding: string, room: number) =>
      `${(parseFloat(padding) || 0) + room}px`;
    if (left > 0) root.style.paddingLeft = add(style.paddingLeft, left);
    if (right > 0) root.style.paddingRight = add(style.paddingRight, right);
  }

  return () => {
    root.style.overflow = overflow;
    root.style.paddingLeft = paddingLeft;
    root.style.paddingRight = paddingRight;
  };
}

/**
 * Locks (and ref-counted-ly unlocks) the page's scrolling while `active` is
 * true. Safe to call from multiple components at once: the page is only
 * given back once every active caller has released its lock.
 *
 * @function useScrollLock
 * @param active - Whether this caller wants the page's scrolling locked.
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return undefined;

    lockCount++;
    if (lockCount === 1) {
      unlock = lockPage();
    }

    return () => {
      lockCount--;
      if (lockCount === 0) {
        unlock?.();
        unlock = null;
      }
    };
  }, [active]);
}
