// INTERNAL: deliberately not exported from src/index.ts.
import { useCallback, useEffect, useRef } from 'react';
import type React from 'react';
import type { RefObject } from 'react';
import { useLatestRef } from './useLatestRef';
import {
  getActiveElementInTree,
  getDeepestActiveElement,
  isEventInside,
} from './shadowDom';

/**
 * Calls `onOutside` for each `type` event outside `ref`'s element while
 * `active`, unless `ignore` says to leave it alone. An event counts as inside
 * in two ways: on the element's own path in the DOM, and anywhere in a React
 * tree the returned handler is put on, in the capture phase. React's tree
 * includes content portaled out of it, which the DOM path doesn't, and React
 * has seen an event there by the time the document hears it.
 *
 * The listener is on the element's own document, an iframe's when the tree
 * renders into one, and reads the latest `onOutside` and `ignore`, and the
 * element, as an event arrives, so it stays put while they change.
 */
function useOutsideEvent<E extends Event>(
  ref: RefObject<Element | null>,
  active: boolean,
  type: 'pointerdown' | 'focusin',
  onOutside: (event: E) => void,
  ignore?: (event: E) => boolean
): (event: React.SyntheticEvent) => void {
  // The last event of `type` React saw inside, until the document hears it.
  const insideRef = useRef<Event | null>(null);
  const onOutsideRef = useLatestRef(onOutside);
  const ignoreRef = useLatestRef(ignore);

  useEffect(() => {
    const element = ref.current;
    if (!active || !element) return undefined;
    const handle = (e: Event) => {
      const inside = e === insideRef.current;
      insideRef.current = null;
      if (inside || isEventInside(e, ref.current)) return;
      if (ignoreRef.current?.(e as E)) return;
      onOutsideRef.current(e as E);
    };
    const doc = element.ownerDocument;
    doc.addEventListener(type, handle);
    return () => doc.removeEventListener(type, handle);
  }, [ref, active, type, onOutsideRef, ignoreRef]);

  return useCallback((event: React.SyntheticEvent) => {
    insideRef.current = event.nativeEvent;
  }, []);
}

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
  return useOutsideEvent(ref, active, 'pointerdown', onOutsidePress);
}

/**
 * Calls `onOutsideFocus` when focus lands on something outside `ref`'s
 * element while `active`, as a menu closes when Tab moves past it. Focus
 * counts as inside the way a press does for `useOutsidePress`: on the
 * element's own path, or anywhere in a React tree the returned handler is put
 * on, as `onFocusCapture`, so content portaled out of it is inside.
 *
 * It hears focus arriving rather than leaving, so focus going nowhere (a
 * window losing focus, a press on something that can't take focus) changes
 * nothing, and the next thing focused outside, from wherever, does. It also
 * leaves alone a focus that's back inside by the time the document hears it,
 * as when a focus trap sends it back, and the focus the window gives back to
 * what had it when the window lost focus.
 *
 * @function useOutsideFocus
 * @param ref - Ref to the element focus inside of doesn't count.
 * @param active - Whether to listen.
 * @param onOutsideFocus - Called each time focus lands outside.
 * @returns The `onFocusCapture` handler that marks focus in its tree as
 * inside.
 */
export function useOutsideFocus(
  ref: RefObject<Element | null>,
  active: boolean,
  onOutsideFocus: (event: FocusEvent) => void
): (event: React.FocusEvent) => void {
  // What had focus when the window lost it, which gets it back with the
  // window, from no element.
  const beforeBlurRef = useRef<Element | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!active || !element) return undefined;
    const doc = element.ownerDocument;
    const win = doc.defaultView as Window;
    const handleBlur = () => {
      beforeBlurRef.current = getDeepestActiveElement(doc);
    };
    win.addEventListener('blur', handleBlur);
    return () => {
      win.removeEventListener('blur', handleBlur);
      beforeBlurRef.current = null;
    };
  }, [ref, active]);

  return useOutsideEvent(ref, active, 'focusin', onOutsideFocus, e => {
    const returning =
      e.composedPath()[0] === beforeBlurRef.current && !e.relatedTarget;
    beforeBlurRef.current = null;
    // Gone already, in the commit that moved focus: nothing to close.
    const element = ref.current;
    if (!element) return true;
    return returning || element.contains(getActiveElementInTree(element));
  });
}
