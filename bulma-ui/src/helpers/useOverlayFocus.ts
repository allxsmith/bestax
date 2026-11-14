// INTERNAL: deliberately not exported from src/index.ts.
import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { useClientLayoutEffect } from './useClientLayoutEffect';
import { useLatestRef } from './useLatestRef';
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
  /**
   * Asked as the overlay closes, while it still holds focus: `false` leaves
   * focus where it is, for a close that shouldn't send it back, such as one
   * whose overlay stays on the page as something else.
   */
  restore?: () => boolean;
}

/**
 * Moves focus into an overlay as it opens, to the first stop Tab wraps to
 * inside `ref`'s element or the element itself, and hands it back to
 * whatever had it as it closes, as `Modal` does. Focus goes back only while
 * the overlay still holds it, or it's been dropped to `<body>`: closing one
 * under another overlay mustn't pull focus out of the one on top, and focus
 * moved out to the page stays there. The opener is found wherever it sits,
 * inside a shadow root too, in the overlay's own document, an iframe's when
 * it renders into one. It's read in a layout effect as the overlay opens, so
 * before the commit's passive effects, such as one that makes the page
 * inert. Content inside the overlay with a layout effect of its own, or an
 * `autoFocus`, can still move focus first, and then there's no opener to go
 * back to: focus is never handed back into the overlay that's closing.
 *
 * @function useOverlayFocus
 * @param ref - Ref to the overlay's element.
 * @param open - Whether the overlay is open.
 * @param options - Whether it's modal, what remounts it, and whether a
 * close hands focus back.
 */
export function useOverlayFocus(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  { modal, remountKey, restore }: OverlayFocusOptions
): void {
  const openerRef = useRef<HTMLElement | null>(null);
  const restoreRef = useLatestRef(restore);

  // The element that had focus, wherever it sits: a portaled overlay renders
  // under `document.body` while its opener can be inside a shadow root.
  useClientLayoutEffect(() => {
    if (!open) return;
    const element = ref.current;
    /* istanbul ignore if: as below, the ref is set while the overlay is open */
    if (!element) return;
    // Focus already inside, where an `autoFocus` in the overlay puts it, has
    // no opener to go back to.
    openerRef.current = element.contains(getActiveElementInTree(element))
      ? null
      : (getDeepestActiveElement(element.ownerDocument) as HTMLElement | null);
  }, [open, ref]);

  useEffect(() => {
    if (!open) return undefined;
    const element = ref.current;
    /* istanbul ignore if: the overlay renders whenever it's open, so its ref is set before this runs */
    if (!element) return undefined;

    if (modal || !isModalOverlayOpen()) {
      focusTabStop(element);
    }

    return () => {
      // A removed subtree leaves focus on <body>, which still counts as held.
      const active = getActiveElementInTree(element);
      const held =
        active === element.ownerDocument.body || element.contains(active);
      // Asked now rather than as it opened: it's about this close.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (held && (restoreRef.current?.() ?? true)) {
        openerRef.current?.focus();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `modal` is read as the overlay opens, on purpose
  }, [open, remountKey, ref, restoreRef]);
}
