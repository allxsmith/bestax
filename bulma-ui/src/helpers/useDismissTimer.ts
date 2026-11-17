// INTERNAL: deliberately not exported from src/index.ts.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getActiveElementInTree } from './shadowDom';
import { useLatestRef } from './useLatestRef';
import { useClientLayoutEffect } from './useClientLayoutEffect';

/**
 * How often, in milliseconds, `useDismissTimer` checks that focus is still
 * inside while it waits. Exported for tests.
 */
export const focusCheckInterval = 250;

/** The focus handler `useDismissTimer` returns, for the element it times. */
export interface DismissTimerHandlers {
  /** Notes that focus came in, and which element has it. */
  onFocus: (event: React.FocusEvent<HTMLElement>) => void;
}

/**
 * Calls `onDismiss` once `duration` milliseconds pass, for something that
 * closes itself, such as a notification, and waits while focus is inside it,
 * so what someone is using doesn't go away under them. Once focus leaves, the
 * whole `duration` starts over.
 *
 * The returned `onFocus` goes on the element that closes. React's focus
 * events bubble through portals, so focus in a popup that something inside
 * renders elsewhere counts as inside.
 *
 * Focus leaving isn't read from a blur. A browser removing a focused element
 * fires none, and the one it fires when the window or tab loses focus leaves
 * focus where it was. So while focus is inside, the hook checks every
 * `focusCheckInterval` that focus is still in the element, or still on the
 * element in a portal it last went to, and the countdown starts over once
 * it isn't.
 *
 * Focus can also come in with no focus event React hears, as when it's
 * moved during a commit, or a control inside stops its focus event. Given
 * `root`, the hook listens for focus coming into that element in the page as
 * well, which those don't escape.
 *
 * @function useDismissTimer
 * @param onDismiss - Called when the time is up. The latest one is called.
 * @param duration - Milliseconds to wait, or `null` for no timer, as while
 *   the pointer pauses it or it stays until dismissed.
 * @param root - Returns the element that closes, when there is one to read.
 * @returns The focus handler for the element that closes.
 */
export function useDismissTimer(
  onDismiss: () => void,
  duration: number | null,
  root?: () => Element | null
): DismissTimerHandlers {
  const [hasFocus, setHasFocus] = useState(false);
  // The element the handler is on, and the one focus last went to, which a
  // portal can put outside it. Cleared once focus is found gone, so a removed
  // element isn't held.
  const focusRef = useRef<{ root: Element; focused: Element } | null>(null);
  const onDismissRef = useLatestRef(onDismiss);
  const rootRef = useLatestRef(root);

  useEffect(() => {
    if (duration === null) return undefined;

    if (hasFocus) {
      const check = setInterval(() => {
        // Empty when an earlier check already found focus gone and the
        // render that stops this one hasn't happened yet.
        const held = focusRef.current;
        if (
          held &&
          (held.root.contains(getActiveElementInTree(held.root)) ||
            getActiveElementInTree(held.focused) === held.focused)
        ) {
          return;
        }
        focusRef.current = null;
        setHasFocus(false);
      }, focusCheckInterval);
      return () => clearInterval(check);
    }

    const timer = setTimeout(() => onDismissRef.current(), duration);
    return () => clearTimeout(timer);
  }, [duration, hasFocus, onDismissRef]);

  const noteFocus = useCallback((into: Element, focused: Element) => {
    focusRef.current = { root: into, focused };
    setHasFocus(true);
  }, []);

  // The element's own `focusin`, beside React's handler, for the focus React
  // doesn't report. React's handler still covers a portal, whose focus
  // doesn't reach the element in the page. A layout effect, which runs in the
  // commit that mounts the element, so focus already inside it by then, as
  // `autoFocus` puts it, counts too.
  useClientLayoutEffect(() => {
    const el = rootRef.current?.();
    if (!el) return undefined;
    const active = getActiveElementInTree(el);
    if (el.contains(active)) noteFocus(el, active!);
    const handleFocusIn = (event: Event) =>
      noteFocus(el, event.target as Element);
    el.addEventListener('focusin', handleFocusIn);
    return () => el.removeEventListener('focusin', handleFocusIn);
  }, [rootRef, noteFocus]);

  const onFocus = useCallback(
    (event: React.FocusEvent<HTMLElement>) =>
      noteFocus(event.currentTarget, event.target),
    [noteFocus]
  );

  return { onFocus };
}
