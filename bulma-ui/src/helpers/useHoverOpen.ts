// INTERNAL: deliberately not exported from src/index.ts.
import { useCallback, useMemo, useRef } from 'react';
import type { FocusEvent, PointerEvent, RefObject } from 'react';
import { useClientLayoutEffect } from './useClientLayoutEffect';
import { getDeepestActiveElement, isEventInside } from './shadowDom';

/**
 * Options for `useHoverOpen`.
 */
export interface UseHoverOpenOptions {
  /** Whether the floating element is open now, controlled or not. */
  open: boolean;
  /**
   * Asks for the floating element to open or close: when a delay runs out,
   * and at once on Escape. It isn't asked for the state it is already in,
   * except that an Escape between asking to open and the open showing takes
   * the ask back by asking to close.
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
  /**
   * Whether a tap on the trigger opens it at once, with the next tap closing
   * it. Without it, a touch pointer never opens it. While a tap holds it
   * open, no hover timer closes it, and a press outside the trigger and the
   * floating element does, as Escape does. The trigger's own tap action
   * still runs.
   * @defaultValue false
   */
  openOnTap?: boolean;
}

/**
 * Pointer and focus handlers for the element that holds the trigger. The
 * floating element has to be inside it in React's tree, in place or through
 * a portal, since React's events reach it from there either way, and it
 * should hold nothing else: focus inside it that isn't on the trigger counts
 * as focus in the floating element.
 */
export interface HoverOpenHandlers {
  onPointerEnter: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave: (event: PointerEvent<HTMLElement>) => void;
  onFocus: (event: FocusEvent<HTMLElement>) => void;
  onBlur: (event: FocusEvent<HTMLElement>) => void;
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
}

/**
 * Runs the caller's own handler on the element that holds the trigger, then
 * the hook's, so neither replaces the other.
 */
export function chain<E>(
  own: ((event: E) => void) | undefined,
  ours: (event: E) => void
): (event: E) => void {
  return event => {
    own?.(event);
    ours(event);
  };
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

/** Whether `node` is `container` or inside it, when there are both. */
const within = (container: Node | null, node: Node | null): boolean =>
  Boolean(container && node && container.contains(node));

/** A hook that wants Escape: its floating element is open, or an open is on its way. */
interface EscapeEntry {
  /** When its floating element opened, counted across the page, or 0 while it is closed. */
  openedAt: number;
  trigger: () => HTMLElement | null;
  floating: () => HTMLElement | null;
  /** Takes back an open that is on its way: waiting on its delay, or asked for and not showing yet. */
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
 * Escape takes back every open that is on its way, so nothing appears right
 * after it, and closes one open floating element, chosen by these rules in
 * turn:
 *
 * 1. One that focus is in, on its trigger or inside it, when there is one.
 * 2. The innermost: one whose floating element holds no other's trigger.
 *    That follows nesting whether either one is portaled, since an inner
 *    trigger sits in the outer floating element either way.
 * 3. The one that opened last.
 *
 * The keypress belongs to whatever has focus. When that is one of the open
 * floating elements or their triggers, or nothing, the listener stops it in
 * the capture phase, before anything around (a Popover, a Modal) sees it.
 * When focus is anywhere else, such as a combobox or a dialog of its own,
 * the floating element still closes, since hover put it there without
 * focus, and the key goes on to that owner.
 *
 * @returns What to call when the hook stops wanting Escape.
 */
function wantEscape(doc: Document, entry: EscapeEntry): () => void {
  let listener = escapeListeners.get(doc);
  if (!listener) {
    const entries = new Set<EscapeEntry>();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const open: EscapeEntry[] = [];
      // A copy, since taking an open back can take its hook out of the set.
      for (const each of [...entries]) {
        if (each.openedAt) open.push(each);
        else each.cancel();
      }
      const focused = getDeepestActiveElement(doc);
      const holding = open.filter(
        each =>
          within(each.trigger(), focused) || within(each.floating(), focused)
      );
      const pool = holding.length > 0 ? holding : open;
      let top: EscapeEntry | undefined;
      for (const each of pool) {
        const holdsAnother = pool.some(
          other => other !== each && within(each.floating(), other.trigger())
        );
        if (!holdsAnother && (!top || each.openedAt > top.openedAt)) {
          top = each;
        }
      }
      if (!top) return;
      if (holding.length > 0 || !focused || focused === doc.body) {
        event.preventDefault();
        event.stopPropagation();
      }
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
  /**
   * An open was asked for and isn't showing yet: no commit has answered it,
   * and the event that asked isn't over.
   */
  asked: boolean;
  /** Focus is on its way back to the trigger, which isn't focus arriving. */
  restoring: boolean;
  timer?: ReturnType<typeof setTimeout>;
  /** Ends an ask to open that no commit answered, once the event that made it is over. */
  askTimer?: ReturnType<typeof setTimeout>;
  /** Takes this hook out of the ones that want Escape, while it is in. */
  releaseEscape?: () => void;
  /**
   * The document of the tap that opened it, or asked to: a press outside in
   * that document closes it while it is open.
   */
  tappedIn?: Document;
  /** The last press React brought to the holder: on the trigger or in the floating element's tree. */
  pressedInside?: Event;
  /** Takes the listener for a press outside off its document, while it is on. */
  stopPress?: () => void;
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
 * - Focus in the floating element holds it open however it got there,
 *   including focus in content it portals elsewhere, such as a nested card.
 *   Whether a click focuses what it lands on is up to the browser: Safari
 *   and Firefox on macOS don't focus a button on click, so there a clicked
 *   button doesn't hold it once the pointer leaves.
 * - Once the pointer and focus have both left, it asks to close after
 *   `closeDelay`, and either coming back before then keeps it open. Nothing
 *   else closes it on a timer.
 * - Escape closes it at once, wherever focus is, and stops there when focus
 *   is in it, on its trigger or nowhere, so a `Popover` or `Modal` around it
 *   keeps its own. With focus somewhere else, the key goes on after closing
 *   it. Inside another one, the inner one closes first. Escape before it
 *   opens takes the opening back and goes on its way. One key listener per
 *   document serves every hook on it, there only while one of them is open
 *   or on its way to open.
 * - With `openOnTap`, a tap on the trigger opens it at once and the next tap
 *   on the trigger closes it. While a tap holds it open, a press outside the
 *   trigger and the floating element closes it, from a listener on the
 *   document that is there only then. Taps never count as hover, and mouse
 *   and pen work the same with it or without.
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
  const stateRef = useRef<HoverOpenState>({
    pointerIn: false,
    focusIn: false,
    focusInFloating: false,
    held: false,
    opening: false,
    asked: false,
    restoring: false,
  });

  // In the hooks that want Escape from the moment an open is on its way until
  // the floating element closes, and out otherwise. Stamped with the order it
  // opened in.
  const listenForEscape = useCallback(function listen() {
    const s = stateRef.current;
    const entry = entryRef.current;
    const { open, triggerRef } = latestRef.current;
    if (!open) entry.openedAt = 0;
    else if (!entry.openedAt) {
      openings += 1;
      entry.openedAt = openings;
    }
    const wanted = open || s.opening || s.asked;
    if (wanted === Boolean(s.releaseEscape)) return;
    if (s.releaseEscape) {
      s.releaseEscape();
      s.releaseEscape = undefined;
      return;
    }
    const doc = triggerRef.current?.ownerDocument ?? document;
    s.releaseEscape = wantEscape(doc, entry);
  }, []);

  const entryRef = useRef<EscapeEntry>({
    openedAt: 0,
    trigger: () => latestRef.current.triggerRef.current,
    floating: () => latestRef.current.floatingRef.current,
    // Only ever called while an open is on its way, so it is one or the
    // other: still waiting on its delay, or asked for already.
    cancel: () => {
      const s = stateRef.current;
      clearTimeout(s.timer);
      // An ask already made is taken back by asking the other way.
      if (s.asked) latestRef.current.onOpenChange(false);
      s.opening = false;
      s.asked = false;
      listenForEscape();
    },
    close: () => {
      clearTimeout(stateRef.current.timer);
      latestRef.current.onOpenChange(false);
    },
  });

  // Asks to open or to close. Escape can take an ask to open back until it is
  // answered: by the commit that follows it, or, when the caller keeps it
  // closed without rendering at all, once the event that asked is over, by
  // which time React has rendered any answer the caller set.
  const ask = useCallback(
    (next: boolean) => {
      const s = stateRef.current;
      s.asked = next;
      latestRef.current.onOpenChange(next);
      listenForEscape();
      if (!next) return;
      clearTimeout(s.askTimer);
      s.askTimer = setTimeout(() => {
        // Still closed: the caller turned it down.
        if (latestRef.current.open) return;
        s.asked = false;
        s.tappedIn = undefined;
        listenForEscape();
      });
    },
    [listenForEscape]
  );

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
            if (latestRef.current.open !== held) ask(held);
            else listenForEscape();
          },
          held ? openDelay : closeDelay
        );
      }
    }
    listenForEscape();
  }, [listenForEscape, ask]);

  // While a tap holds the floating element open, a press outside the trigger
  // and the floating element closes it. Set up again each time it opens or
  // closes.
  const listenForPress = useCallback(() => {
    const s = stateRef.current;
    s.stopPress?.();
    s.stopPress = undefined;
    const doc = latestRef.current.open ? s.tappedIn : undefined;
    if (!doc) return;
    const handlePointerDown = (event: Event) => {
      // Inside is a press React brought to the holder, which covers content
      // the floating element portals elsewhere, or one whose path runs
      // through the trigger or the floating element, which covers a press
      // that something inside stopped before React got it to the holder.
      const { triggerRef, floatingRef } = latestRef.current;
      if (
        event === s.pressedInside ||
        isEventInside(event, triggerRef.current) ||
        isEventInside(event, floatingRef.current)
      ) {
        return;
      }
      latestRef.current.onOpenChange(false);
    };
    doc.addEventListener('pointerdown', handlePointerDown);
    s.stopPress = () =>
      doc.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  useClientLayoutEffect(() => {
    latestRef.current = options;
    // The commit after an ask to open answers it, open or still closed. A
    // tap that asked and still finds it closed was turned down.
    const s = stateRef.current;
    if (s.asked) {
      s.asked = false;
      if (!options.open) s.tappedIn = undefined;
      listenForEscape();
    }
  });

  useClientLayoutEffect(() => {
    const s = stateRef.current;
    return () => {
      clearTimeout(s.timer);
      clearTimeout(s.askTimer);
      s.opening = false;
      s.asked = false;
      s.releaseEscape?.();
      s.releaseEscape = undefined;
      s.stopPress?.();
      s.stopPress = undefined;
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
      s.tappedIn = undefined;
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
    listenForPress();
  }, [open, settle, listenForPress]);

  return useMemo<HoverOpenHandlers>(() => {
    const inTrigger = (node: EventTarget | null) =>
      within(latestRef.current.triggerRef.current, node as Node | null);
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
        // React brings focus here from the trigger and from the floating
        // element's whole tree, portals included, so focus not in the
        // trigger is in the floating element, wherever its DOM is.
        s.focusInFloating = !inTrigger(event.target);
        if (s.restoring) return;
        // Any focus in the floating element holds it. On the trigger, only
        // keyboard focus does, so a click there opens nothing.
        s.focusIn = s.focusInFloating || isKeyboardFocus(event.target);
        settle();
      },
      onBlur: event => {
        const s = stateRef.current;
        const next = event.relatedTarget as Node | null;
        // Where focus goes next, as far as the DOM can say. Focus going into
        // content the floating element portals elsewhere reads as leaving,
        // and the focus event that follows straight after brings it back.
        s.focusInFloating = within(latestRef.current.floatingRef.current, next);
        // Moving between the trigger and the floating element isn't leaving.
        if (s.focusInFloating || within(event.currentTarget, next)) return;
        s.focusIn = false;
        settle();
      },
      onPointerDown: event => {
        stateRef.current.pressedInside = event.nativeEvent;
      },
      onPointerUp: event => {
        const now = latestRef.current;
        // With openOnTap, a tap on the trigger opens it at once, and the
        // next one closes it. A tap anywhere else does nothing here.
        if (
          !now.openOnTap ||
          event.pointerType !== 'touch' ||
          !inTrigger(event.target)
        ) {
          return;
        }
        stateRef.current.tappedIn = now.open
          ? undefined
          : (event.target as Element).ownerDocument;
        ask(!now.open);
      },
    };
  }, [settle, ask]);
}
