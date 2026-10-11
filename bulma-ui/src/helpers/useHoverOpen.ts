// INTERNAL: deliberately not exported from src/index.ts.
import { useCallback, useMemo, useRef } from 'react';
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
   * How long it waits once the pointer and focus have both left before
   * asking to close, in milliseconds. Coming back in that time keeps it open,
   * which is how the pointer crosses a gap to the floating element.
   */
  closeDelay: number;
  /**
   * The element that opens it, which has to take focus itself. The Escape
   * listener goes on its document, an iframe's when it renders into one, and
   * focus left in the floating element comes back here when the floating
   * element closes.
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

/**
 * Whether focus that just arrived on `el` is keyboard focus, as the browser
 * decides it for `:focus-visible`: focus from a key or from the browser's
 * own controls is, focus a press brings isn't, and focus a script moves
 * follows whichever came last. A browser that can't match the selector
 * throws, and then every focus counts, so keyboard users can still open it.
 */
function isKeyboardFocus(el: Element): boolean {
  try {
    return el.matches(':focus-visible');
  } catch {
    return true;
  }
}

/** A hook that wants Escape: its floating element is open, or an open is waiting on its delay. */
interface EscapeEntry {
  /** When its floating element opened, counted across the page, or 0 while it is closed. */
  openedAt: number;
  /** Cancels an open that is waiting on its delay. */
  cancel: () => void;
  /** Asks to close. */
  close: () => void;
}

/**
 * Per document, the hooks that want Escape and the one listener they share
 * while there are any, so a card inside another card doesn't add a second
 * listener that closes both on one keypress.
 */
const escapeListeners = new Map<
  Document,
  { entries: Set<EscapeEntry>; stop: () => void }
>();

/** Counts openings across the page, so the most recent one is known. */
let openings = 0;

/**
 * Adds `entry` to the hooks that want Escape on `doc`, starting the shared
 * listener when it is the first.
 *
 * Escape cancels every open that is waiting, so nothing appears right after
 * it, and closes the floating element that opened last, the innermost of a
 * nested pair. It stops the keypress only then, in the capture phase, before
 * anything around the floating element (a Popover, a Modal) sees it. With
 * nothing open it goes on its way.
 *
 * @returns What to call when the hook stops wanting Escape.
 */
function wantEscape(doc: Document, entry: EscapeEntry): () => void {
  let listener = escapeListeners.get(doc);
  if (!listener) {
    const entries = new Set<EscapeEntry>();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      let top: EscapeEntry | undefined;
      // A copy, since cancelling an open takes its hook out of the set.
      for (const each of [...entries]) {
        if (each.openedAt > (top?.openedAt ?? 0)) top = each;
        each.cancel();
      }
      if (!top) return;
      event.preventDefault();
      event.stopPropagation();
      top.close();
    };
    doc.addEventListener('keydown', handleKeyDown, true);
    listener = {
      entries,
      stop: () => {
        doc.removeEventListener('keydown', handleKeyDown, true);
        escapeListeners.delete(doc);
      },
    };
    escapeListeners.set(doc, listener);
  }
  const shared = listener;
  shared.entries.add(entry);
  return () => {
    shared.entries.delete(entry);
    if (shared.entries.size === 0) shared.stop();
  };
}

interface HoverOpenState {
  /** The pointer, other than a touch, is over the trigger or the floating element. */
  pointerIn: boolean;
  /** Focus holds it open: any focus in the floating element, or keyboard focus on the trigger. */
  focusIn: boolean;
  /** Focus, however it got there, is in the floating element. */
  focusInFloating: boolean;
  /** Whether the pointer or focus was holding it open when last settled. */
  held: boolean;
  /** An open is waiting on its delay. */
  opening: boolean;
  /** Focus is on its way back to the trigger, which isn't focus arriving. */
  restoring: boolean;
  timer?: ReturnType<typeof setTimeout>;
  /** Takes this hook out of the ones that want Escape, while it is in. */
  releaseEscape?: () => void;
}

/**
 * Decides when a floating element that opens on hover or keyboard focus asks
 * to open and to close. It renders nothing, and leaves roles, ARIA and
 * placement to the component that calls it.
 *
 * - The pointer entering, or keyboard focus arriving on the trigger, asks to
 *   open after `openDelay`. A touch pointer doesn't count. Neither does focus
 *   that a press brings to the trigger: it counts when the browser shows it
 *   as `:focus-visible`.
 * - Focus in the floating element holds it open however it got there, so a
 *   control clicked inside it stays put when the pointer moves away.
 * - Once the pointer and focus have both left, it asks to close after
 *   `closeDelay`, and either coming back before then keeps it open. Nothing
 *   else closes it on a timer.
 * - Escape while it is open asks to close at once, wherever focus is, and
 *   stops there, so a `Popover` or `Modal` around it keeps its own. Inside
 *   another one, the inner one closes first. Escape before it opens cancels
 *   the opening and goes on its way. One key listener per document serves
 *   every hook on it, there only while one of them is open or about to open.
 * - Once it closes, for any reason, whatever was holding it open has to
 *   leave and come back to open it again.
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
    focusIn: false,
    focusInFloating: false,
    held: false,
    opening: false,
    restoring: false,
  });

  // In the hooks that want Escape while the floating element is open or an
  // open is waiting, and out otherwise. Stamped with the order it opened in.
  const listenForEscape = useCallback(function listen() {
    const s = stateRef.current;
    const { open, triggerRef } = latestRef.current;
    if (!open) entryRef.current.openedAt = 0;
    else if (!entryRef.current.openedAt) {
      openings += 1;
      entryRef.current.openedAt = openings;
    }
    const wanted = open || s.opening;
    if (wanted === Boolean(s.releaseEscape)) return;
    if (s.releaseEscape) {
      s.releaseEscape();
      s.releaseEscape = undefined;
      return;
    }
    const doc = triggerRef.current?.ownerDocument ?? document;
    s.releaseEscape = wantEscape(doc, entryRef.current);
  }, []);

  const entryRef = useRef<EscapeEntry>({
    openedAt: 0,
    cancel: () => {
      const s = stateRef.current;
      if (!s.opening) return;
      clearTimeout(s.timer);
      s.opening = false;
      listenForEscape();
    },
    close: () => {
      clearTimeout(stateRef.current.timer);
      latestRef.current.onOpenChange(false);
    },
  });

  // Asks for what the pointer and focus call for, after its delay, when that
  // changed since the last time and isn't the state already.
  const settle = useCallback(() => {
    const s = stateRef.current;
    const held = s.pointerIn || s.focusIn;
    if (held !== s.held) {
      s.held = held;
      clearTimeout(s.timer);
      const { open, openDelay, closeDelay } = latestRef.current;
      s.opening = held && !open;
      if (held !== open) {
        s.timer = setTimeout(
          () => {
            s.opening = false;
            const now = latestRef.current;
            if (now.open !== held) now.onOpenChange(held);
            listenForEscape();
          },
          held ? openDelay : closeDelay
        );
      }
    }
    listenForEscape();
  }, [listenForEscape]);

  useClientLayoutEffect(() => {
    const s = stateRef.current;
    return () => {
      clearTimeout(s.timer);
      s.opening = false;
      s.releaseEscape?.();
      s.releaseEscape = undefined;
    };
  }, []);

  const { open } = options;
  // Before paint, so a pointer or a key arriving next finds this settled.
  useClientLayoutEffect(() => {
    const s = stateRef.current;
    if (!open) {
      // The floating element left from under the pointer, if it was there,
      // and no leave event says so. Focus resting on the trigger has done
      // its job too, so neither opens it again until it comes back.
      s.pointerIn = false;
      s.focusIn = false;
      if (s.focusInFloating) {
        s.focusInFloating = false;
        const trigger = latestRef.current.triggerRef.current;
        // Focus that went down with the floating element sits on <body>.
        // Focus somewhere else was put there by the same update, so it stays.
        if (
          trigger &&
          trigger.ownerDocument.activeElement === trigger.ownerDocument.body
        ) {
          s.restoring = true;
          trigger.focus();
          s.restoring = false;
        }
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
      onPointerLeave: event => {
        // A touch pointer never set pointerIn, so its leave has nothing to
        // clear, and on a device with a mouse too it would close a card the
        // mouse is still holding open.
        if (event.pointerType === 'touch') return;
        stateRef.current.pointerIn = false;
        settle();
      },
      onFocus: event => {
        const s = stateRef.current;
        s.focusInFloating = inFloating(event.target);
        if (s.restoring) return;
        // Any focus in the floating element holds it. On the trigger, only
        // keyboard focus does, so a click there opens nothing.
        s.focusIn = s.focusInFloating || isKeyboardFocus(event.target);
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
        s.focusIn = false;
        settle();
      },
    };
  }, [settle]);
}
