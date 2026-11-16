// INTERNAL: deliberately not exported from src/index.ts.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getActiveElementInTree } from './shadowDom';
import { useLatestRef } from './useLatestRef';

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
 * @function useDismissTimer
 * @param onDismiss - Called when the time is up. The latest one is called.
 * @param duration - Milliseconds to wait, or `null` for no timer, as while
 *   the pointer pauses it or it stays until dismissed.
 * @returns The focus handler for the element that closes.
 */
export function useDismissTimer(
  onDismiss: () => void,
  duration: number | null
): DismissTimerHandlers {
  const [hasFocus, setHasFocus] = useState(false);
  // The element the handler is on, and the one focus last went to, which a
  // portal can put outside it. Cleared while focus is out, so a removed
  // element isn't held.
  const focusRef = useRef<{ root: Element; focused: Element } | null>(null);
  const onDismissRef = useLatestRef(onDismiss);

  useEffect(() => {
    if (duration === null) return undefined;

    if (hasFocus) {
      const check = setInterval(() => {
        const { root, focused } = focusRef.current!;
        if (root.contains(getActiveElementInTree(root))) return;
        if (getActiveElementInTree(focused) === focused) return;
        setHasFocus(false);
      }, focusCheckInterval);
      return () => clearInterval(check);
    }

    focusRef.current = null;
    const timer = setTimeout(() => onDismissRef.current(), duration);
    return () => clearTimeout(timer);
  }, [duration, hasFocus, onDismissRef]);

  const onFocus = useCallback((event: React.FocusEvent<HTMLElement>) => {
    focusRef.current = { root: event.currentTarget, focused: event.target };
    setHasFocus(true);
  }, []);

  return { onFocus };
}
