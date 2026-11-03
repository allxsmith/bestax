// INTERNAL: deliberately not exported from src/index.ts.
import { useEffect } from 'react';
import type { RefObject } from 'react';
import { isModalOverlayOpen } from './overlayStack';
import { focusTabStop } from './useFocusTrap';
import { getActiveElementInTree, getDeepestActiveElement } from './shadowDom';

/** Options for `useOverlayFocus`. */
export interface OverlayFocusOptions {
  /**
   * Whether the overlay is modal. One that isn't, opened while a modal
   * overlay is open under it, leaves focus where it is: that overlay keeps
   * Tab, so a Tab from this one's controls would only go back to it. It's
   * read as the overlay opens, so a change while it's open moves nothing.
   */
  modal: boolean;
  /**
   * A value that remounts the overlay's nodes while it's open when it
   * changes, such as a new portal target. Focus is handed back from the old
   * nodes and moved into the new ones.
   */
  remountKey?: unknown;
}

/**
 * Moves focus into an overlay as it opens, to the first stop Tab wraps to
 * inside `ref`'s element or the element itself, and hands it back to
 * whatever had it as it closes, as `Modal` does. Focus goes back only while
 * the overlay still holds it, or it's been dropped to `<body>`: closing one
 * under another overlay mustn't pull focus out of the one on top, and focus
 * moved out to the page stays there. The opener is found wherever it sits,
 * inside a shadow root too.
 *
 * @function useOverlayFocus
 * @param ref - Ref to the overlay's element.
 * @param open - Whether the overlay is open.
 * @param options - Whether it's modal, and what remounts it.
 */
export function useOverlayFocus(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  { modal, remountKey }: OverlayFocusOptions
): void {
  useEffect(() => {
    if (!open) return undefined;
    const element = ref.current;
    /* istanbul ignore if: the overlay renders whenever it's open, so its ref is set before this runs */
    if (!element) return undefined;

    // The element that had focus, wherever it sits: a portaled overlay
    // renders under `document.body` while its opener can be inside a shadow
    // root.
    const opener = getDeepestActiveElement() as HTMLElement | null;
    if (modal || !isModalOverlayOpen()) {
      focusTabStop(element);
    }

    return () => {
      // A removed subtree leaves focus on <body>, which still counts as held.
      const active = getActiveElementInTree(element);
      if (active === document.body || element.contains(active)) {
        opener?.focus();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `modal` is read as the overlay opens, on purpose
  }, [open, remountKey, ref]);
}
