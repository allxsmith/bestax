// INTERNAL: deliberately not exported from src/index.ts.
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { FocusEvent, PointerEvent, RefObject } from 'react';
import { useClientLayoutEffect } from './useClientLayoutEffect';

/**
 * Options for `useHoverOpen`.
 */
export interface UseHoverOpenOptions {
  /** Whether the floating element is open now, controlled or not. */
  open: boolean;
  /**
   * Asks for the floating element to open or close: when a delay runs out,
   * and at once on Escape. It isn't asked for the state it is already in.
   */
  onOpenChange: (open: boolean) => void;
  /** How long hover or keyboard focus waits before asking to open, in milliseconds. */
  openDelay: number;
  /**
   * How long it waits once the pointer and keyboard focus have both left
   * before asking to close, in milliseconds. Coming back in that time keeps
   * it open, which is how the pointer crosses a gap to the floating element.
   */
  closeDelay: number;
  /**
   * The element that opens it. The key and press listeners go on its
   * document, an iframe's when it renders into one, and focus left in the
   * floating element comes back here when the floating element closes.
   */
  triggerRef: RefObject<HTMLElement | null>;
  /** The floating element, while it is open. */
  floatingRef: RefObject<HTMLElement | null>;
}

/**
 * Pointer and focus handlers for the element that holds the trigger. The
 * floating element has to be inside it in React's tree, in place or through
 * a portal, since React's events reach it from there either way.
 */
export interface HoverOpenHandlers {
  onPointerEnter: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave: (event: PointerEvent<HTMLElement>) => void;
  onFocus: (event: FocusEvent<HTMLElement>) => void;
  onBlur: (event: FocusEvent<HTMLElement>) => void;
}

interface HoverOpenState {
  /** The pointer, other than a touch, is over the trigger or the floating element. */
  pointerIn: boolean;
  /** Keyboard focus is in the trigger or the floating element. */
  keyboardIn: boolean;
  /** Focus, however it got there, is in the floating element. */
  focusInFloating: boolean;
  /** The last input was a key, so focus arriving now is keyboard focus. */
  keyboard: boolean;
  /** Whether the pointer or keyboard focus was holding it open when last settled. */
  held: boolean;
  /** Focus is on its way back to the trigger, which isn't focus arriving. */
  restoring: boolean;
  timer?: ReturnType<typeof setTimeout>;
}

/**
 * Decides when a floating element that opens on hover or keyboard focus asks
 * to open and to close. It renders nothing, and leaves roles, ARIA and
 * placement to the component that calls it.
 *
 * - The pointer entering, or keyboard focus arriving, asks to open after
 *   `openDelay`. A touch pointer doesn't count. Neither does focus that a
 *   press brings: focus counts when the last input was a key, the way
 *   `:focus-visible` decides, and a key pressed with Alt, Control or Meta
 *   doesn't count as one.
 * - Once the pointer and keyboard focus have both left, it asks to close
 *   after `closeDelay`, and either coming back before then keeps it open.
 *   Nothing else closes it on a timer.
 * - Escape while it is open asks to close at once, wherever focus is. The
 *   key listener sits in the document's capture phase and stops the
 *   keypress there, so a `Popover` or `Modal` around it keeps its own
 *   Escape. Escape before it opens cancels the opening and goes on its way.
 *   Either way, a pointer or focus still inside doesn't open it again: they
 *   have to leave and come back, as they do after it closes for any reason.
 * - When the floating element closes with focus inside it, focus goes back
 *   to the trigger, unless the same update put it somewhere else. Handing it
 *   back doesn't count as focus arriving.
 *
 * Nothing it scheduled runs after the component unmounts.
 *
 * @function useHoverOpen
 * @param options - The open state, how to ask for another, the delays, and the two elements.
 * @returns Handlers for the element that holds the trigger.
 */
export function useHoverOpen(options: UseHoverOpenOptions): HoverOpenHandlers {
  const latestRef = useRef(options);
  useClientLayoutEffect(() => {
    latestRef.current = options;
  });
  const stateRef = useRef<HoverOpenState>({
    pointerIn: false,
    keyboardIn: false,
    focusInFloating: false,
    keyboard: true,
    held: false,
    restoring: false,
  });

  // Asks for what the pointer and keyboard focus call for, after its delay,
  // when that changed since the last time and isn't the state already.
  const settle = useCallback(() => {
    const s = stateRef.current;
    const held = s.pointerIn || s.keyboardIn;
    if (held === s.held) return;
    s.held = held;
    clearTimeout(s.timer);
    const { open, openDelay, closeDelay } = latestRef.current;
    if (held === open) return;
    s.timer = setTimeout(
      () => {
        const now = latestRef.current;
        if (now.open !== held) now.onOpenChange(held);
      },
      held ? openDelay : closeDelay
    );
  }, []);

  useEffect(() => {
    const s = stateRef.current;
    const doc = latestRef.current.triggerRef.current?.ownerDocument ?? document;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey && !event.ctrlKey && !event.metaKey) s.keyboard = true;
      if (event.key !== 'Escape') return;
      clearTimeout(s.timer);
      const { open, onOpenChange } = latestRef.current;
      if (!open) return;
      // The capture phase runs before anything around the floating element
      // (a Popover, a Modal) sees the key, and stopping it there keeps them
      // open.
      event.preventDefault();
      event.stopPropagation();
      onOpenChange(false);
    };
    const handlePointerDown = () => {
      s.keyboard = false;
    };
    doc.addEventListener('keydown', handleKeyDown, true);
    doc.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      doc.removeEventListener('keydown', handleKeyDown, true);
      doc.removeEventListener('pointerdown', handlePointerDown, true);
      clearTimeout(s.timer);
    };
  }, []);

  const { open } = options;
  // Before paint, so a pointer or a key arriving next finds this settled.
  useClientLayoutEffect(() => {
    if (open) return;
    const s = stateRef.current;
    // The floating element left from under the pointer, if it was there, and
    // no leave event says so.
    s.pointerIn = false;
    if (s.focusInFloating) {
      s.focusInFloating = false;
      const trigger = latestRef.current.triggerRef.current;
      // Focus that went down with the floating element sits on <body>. Focus
      // somewhere else was put there by the same update, so it stays.
      if (
        trigger &&
        trigger.ownerDocument.activeElement === trigger.ownerDocument.body
      ) {
        s.restoring = true;
        trigger.focus();
        s.restoring = false;
      }
    }
    settle();
  }, [open, settle]);

  return useMemo<HoverOpenHandlers>(() => {
    const inFloating = (node: EventTarget | null) =>
      Boolean(
        latestRef.current.floatingRef.current?.contains(node as Node | null)
      );
    return {
      onPointerEnter: event => {
        if (event.pointerType === 'touch') return;
        stateRef.current.pointerIn = true;
        settle();
      },
      onPointerLeave: () => {
        stateRef.current.pointerIn = false;
        settle();
      },
      onFocus: event => {
        const s = stateRef.current;
        s.focusInFloating = inFloating(event.target);
        if (s.restoring || !s.keyboard) return;
        s.keyboardIn = true;
        settle();
      },
      onBlur: event => {
        const s = stateRef.current;
        const next = event.relatedTarget;
        s.focusInFloating = inFloating(next);
        // Moving between the trigger and the floating element isn't leaving.
        if (
          s.focusInFloating ||
          event.currentTarget.contains(next as Node | null)
        ) {
          return;
        }
        s.keyboardIn = false;
        settle();
      },
    };
  }, [settle]);
}
