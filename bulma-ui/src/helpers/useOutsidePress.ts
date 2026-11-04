// INTERNAL: deliberately not exported from src/index.ts.
import { useCallback, useEffect, useRef } from 'react';
import type React from 'react';
import type { RefObject } from 'react';
import { useLatestRef } from './useLatestRef';
import { isEventInside } from './shadowDom';

/**
 * Calls `onOutsidePress` for a `pointerdown` outside `ref`'s element while
 * `active`, as a Popover closes on one.
 *
 * A press counts as inside in two ways: on the element's own path in the DOM,
 * and anywhere in a React tree the returned handler is put on, as
 * `onPointerDownCapture`. React's tree includes content portaled out of it,
 * which the DOM path doesn't, and React has seen a press there by the time
 * the document hears it.
 *
 * The listener is on the element's own document, an iframe's when the tree
 * renders into one, and reads the latest `onOutsidePress` as a press
 * arrives, so it stays put while the callback changes identity.
 *
 * @function useOutsidePress
 * @param ref - Ref to the element a press inside of doesn't count.
 * @param active - Whether to listen.
 * @param onOutsidePress - Called with each press outside.
 * @returns The `onPointerDownCapture` handler that marks a press in its tree
 * as inside.
 */
export function useOutsidePress(
  ref: RefObject<Element | null>,
  active: boolean,
  onOutsidePress: (event: PointerEvent) => void
): (event: React.PointerEvent) => void {
  // The last pointerdown React saw inside.
  const insidePressRef = useRef<Event | null>(null);
  const onOutsidePressRef = useLatestRef(onOutsidePress);

  useEffect(() => {
    const element = ref.current;
    if (!active || !element) return undefined;
    const handlePointerDown = (e: PointerEvent) => {
      if (e === insidePressRef.current || isEventInside(e, ref.current)) {
        return;
      }
      onOutsidePressRef.current(e);
    };
    const doc = element.ownerDocument;
    doc.addEventListener('pointerdown', handlePointerDown);
    return () => doc.removeEventListener('pointerdown', handlePointerDown);
  }, [ref, active, onOutsidePressRef]);

  return useCallback((event: React.PointerEvent) => {
    insidePressRef.current = event.nativeEvent;
  }, []);
}
