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

/**
 * Whether the last input on a document was a key, which makes the focus that
 * follows it keyboard focus.
 */
interface InputModality {
  keyboard: boolean;
  /** How many mounted hooks read it. Its listeners go with the last one. */
  users: number;
  stop: () => void;
}

/**
 * One tracker per document, shared by every hook on it, so a page holding
 * many hover cards has one pair of listeners for this rather than a pair per
 * card. Nothing listens until a hook mounts.
 */
const modalities = new Map<Document, InputModality>();

/**
 * Reads `doc`'s input modality for one hook, starting the tracker when it is
 * the first. A key counts unless it is pressed with Alt, Control or Meta,
 * which makes it a shortcut, and a press counts as the pointer. Nothing
 * pressed yet counts as a key.
 *
 * @returns The tracker, and what to call when the hook unmounts.
 */
function watchModality(doc: Document): {
  modality: InputModality;
  release: () => void;
} {
  let modality = modalities.get(doc);
  if (!modality) {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey && !event.ctrlKey && !event.metaKey) {
        created.keyboard = true;
      }
    };
    const handlePointerDown = () => {
      created.keyboard = false;
    };
    const created: InputModality = {
      keyboard: true,
      users: 0,
      stop: () => {
        doc.removeEventListener('keydown', handleKeyDown, true);
        doc.removeEventListener('pointerdown', handlePointerDown, true);
        modalities.delete(doc);
      },
    };
    doc.addEventListener('keydown', handleKeyDown, true);
    doc.addEventListener('pointerdown', handlePointerDown, true);
    modalities.set(doc, created);
    modality = created;
  }
  const watched = modality;
  watched.users += 1;
  return {
    modality: watched,
    release: () => {
      watched.users -= 1;
      if (watched.users === 0) watched.stop();
    },
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
  /** The input modality of the trigger's document, while mounted. */
  modality?: InputModality;
  /** Takes the Escape listener off its document, while it is on. */
  stopEscape?: () => void;
}

/**
 * Decides when a floating element that opens on hover or keyboard focus asks
 * to open and to close. It renders nothing, and leaves roles, ARIA and
 * placement to the component that calls it.
 *
 * - The pointer entering, or keyboard focus arriving on the trigger, asks to
 *   open after `openDelay`. A touch pointer doesn't count. Neither does focus
 *   that a press brings to the trigger: focus counts when the last input was
 *   a key, the way `:focus-visible` decides.
 * - Focus in the floating element holds it open however it got there, so a
 *   control clicked inside it stays put when the pointer moves away.
 * - Once the pointer and focus have both left, it asks to close after
 *   `closeDelay`, and either coming back before then keeps it open. Nothing
 *   else closes it on a timer.
 * - Escape while it is open asks to close at once, wherever focus is. The
 *   key listener sits in the document's capture phase, and only while it is
 *   open or about to open. An Escape that closes it stops there, so a
 *   `Popover` or `Modal` around it keeps its own. Escape before it opens
 *   cancels the opening and goes on its way.
 * - Once it closes, for any reason, whatever was holding it open has to
 *   leave and come back to open it again.
 * - When the floating element closes with focus inside it, focus goes back
 *   to the trigger, unless the same update put it somewhere else. Handing it
 *   back doesn't count as focus arriving.
 *
 * Telling keyboard focus from a press needs the last input on the page, so
 * every hook on a document shares one pair of listeners for it while any of
 * them is mounted. Nothing it scheduled runs after the component unmounts.
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

  // The Escape listener is on the trigger's document while the floating
  // element is open or an open is waiting, and off otherwise.
  const listenForEscape = useCallback(function listen() {
    const s = stateRef.current;
    const wanted = latestRef.current.open || s.opening;
    if (wanted === Boolean(s.stopEscape)) return;
    if (s.stopEscape) {
      s.stopEscape();
      s.stopEscape = undefined;
      return;
    }
    const doc = latestRef.current.triggerRef.current?.ownerDocument ?? document;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      clearTimeout(s.timer);
      s.opening = false;
      const { open, onOpenChange } = latestRef.current;
      if (open) {
        // The capture phase runs before anything around the floating element
        // (a Popover, a Modal) sees the key, and stopping it there keeps them
        // open.
        event.preventDefault();
        event.stopPropagation();
        onOpenChange(false);
      }
      listen();
    };
    doc.addEventListener('keydown', handleKeyDown, true);
    s.stopEscape = () =>
      doc.removeEventListener('keydown', handleKeyDown, true);
  }, []);

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
    const doc = latestRef.current.triggerRef.current?.ownerDocument ?? document;
    const { modality, release } = watchModality(doc);
    s.modality = modality;
    return () => {
      release();
      clearTimeout(s.timer);
      s.opening = false;
      s.stopEscape?.();
      s.stopEscape = undefined;
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
      onPointerLeave: () => {
        stateRef.current.pointerIn = false;
        settle();
      },
      onFocus: event => {
        const s = stateRef.current;
        s.focusInFloating = inFloating(event.target);
        if (s.restoring) return;
        // Any focus in the floating element holds it. On the trigger, only
        // keyboard focus does, so a click there opens nothing.
        s.focusIn = s.focusInFloating || (s.modality as InputModality).keyboard;
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
