// INTERNAL: deliberately not exported from src/index.ts.
import React, { useEffect, useRef, useState } from 'react';
import { getActiveElementInTree, isEventInside } from './shadowDom';
import { useLatestRef } from './useLatestRef';

/** What `useHoverDismiss` gives the component that shows a menu on hover. */
export interface HoverDismiss {
  /** Whether Escape has put the menu away. Leave the hover class off while it's set. */
  dismissed: boolean;
  /**
   * Whether the hover (or, with `withFocus`, focus inside the root) is what
   * shows the menu right now: enabled, not put away, `applies`, and the root
   * matching `:hover` or `:focus-within` when it's called, the state the
   * stylesheet draws from.
   */
  shown: () => boolean;
  /** Puts the menu away until neither the pointer nor focus keeps it. */
  dismiss: () => void;
  /** Call from the root's `onPointerLeave`. */
  onPointerLeave: () => void;
  /**
   * Call from the root's `onPointerEnter` when focus shows the menu too: the
   * pointer coming back is a new hover, and brings the menu back.
   */
  onPointerEnter: () => void;
  /**
   * Call from the root's `onFocus` when focus shows the menu too: focus
   * moving onto something in the root brings the menu back, the way the
   * stylesheet shows it. Focus coming back with the window doesn't.
   */
  onFocus: () => void;
  /** Call from the root's `onBlur` when focus shows the menu too. */
  onBlur: (e: React.FocusEvent) => void;
}

/** The options `useHoverDismiss` takes. */
export interface HoverDismissOptions {
  /** Whether the menu shows on hover at all, Bulma's `is-hoverable`. */
  enabled: boolean;
  /** Whether it also shows while focus is inside the root. */
  withFocus?: boolean;
  /**
   * Whether the stylesheet shows it that way right now, read when a key
   * arrives. Bulma's navbar does only on a desktop-wide window. Always, when
   * left out.
   */
  applies?: () => boolean;
}

/** Whether `applies` says the stylesheet shows the menu on hover right now. */
const appliesFrom = (ref: { readonly current: (() => boolean) | undefined }) =>
  !ref.current || ref.current();

/**
 * Lets Escape put away a menu a stylesheet shows while the pointer is over
 * its root (Bulma's `is-hoverable`), without moving the pointer, as WCAG
 * 1.4.13 asks of content shown on hover. With `withFocus`, the stylesheet also
 * shows the menu while focus is inside the root (Bulma's navbar does, through
 * `:focus-within`), so the menu stays away until the pointer has left and
 * focus has too, or until the pointer comes back or focus moves onto
 * something in the root, which show it again. A window losing focus and
 * getting it back, focus still on the element it had, keeps it away.
 *
 * An Escape with focus outside the root, on the page or in a field
 * elsewhere, puts the menu away here and goes on to what has focus, as a
 * tooltip's does. An Escape inside the root is the component's to handle:
 * it calls `shown()` and `dismiss()`. An IME's Escape cancels its
 * composition and nothing more.
 *
 * @function useHoverDismiss
 * @param rootRef - The element the hover rule matches.
 * @param options - See `HoverDismissOptions`.
 * @returns The state and handlers above.
 */
export function useHoverDismiss(
  rootRef: React.RefObject<HTMLElement | null>,
  { enabled, withFocus = false, applies }: HoverDismissOptions
): HoverDismiss {
  const [dismissed, setDismissed] = useState(false);
  // Read when a key arrives, like `:hover`, so the listener stays put while
  // an inline `applies` changes identity on every render.
  const appliesRef = useLatestRef(applies);
  // Set when the window loses focus with focus still in the root, so focus
  // coming back with it isn't taken for a new focus.
  const windowBlurRef = useRef(false);

  useEffect(() => {
    if (!enabled || dismissed) return undefined;
    const doc = (rootRef.current as HTMLElement).ownerDocument;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' &&
        !e.isComposing &&
        e.keyCode !== 229 &&
        !isEventInside(e, rootRef.current) &&
        (rootRef.current as HTMLElement).matches(':hover') &&
        appliesFrom(appliesRef)
      ) {
        setDismissed(true);
      }
    };
    doc.addEventListener('keydown', handleKeyDown);
    return () => doc.removeEventListener('keydown', handleKeyDown);
  }, [enabled, dismissed, rootRef, appliesRef]);

  const focusInside = () =>
    withFocus && (rootRef.current as HTMLElement).matches(':focus-within');
  const bringBack = () => {
    if (dismissed && !focusInside()) setDismissed(false);
  };

  return {
    dismissed,
    shown: () =>
      enabled &&
      !dismissed &&
      ((rootRef.current as HTMLElement).matches(':hover') || focusInside()) &&
      appliesFrom(appliesRef),
    dismiss: () => {
      windowBlurRef.current = false;
      setDismissed(true);
    },
    onPointerLeave: bringBack,
    onPointerEnter: () => {
      if (dismissed) setDismissed(false);
    },
    onFocus: () => {
      const fromWindow = windowBlurRef.current;
      windowBlurRef.current = false;
      if (dismissed && !fromWindow) setDismissed(false);
    },
    onBlur: e => {
      windowBlurRef.current = false;
      if (!dismissed) return;
      const root = rootRef.current as HTMLElement;
      const to = e.relatedTarget as Node | null;
      // The window lost focus, and focus is still where it was.
      if (!to && root.contains(getActiveElementInTree(root))) {
        windowBlurRef.current = true;
        return;
      }
      if (!root.contains(to) && !root.matches(':hover')) setDismissed(false);
    },
  };
}
