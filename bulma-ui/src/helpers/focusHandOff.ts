// INTERNAL: deliberately not exported from src/index.ts.
import { useEffect, useRef } from 'react';
import { getActiveElementInTree } from './shadowDom';
import { moveFocusOut } from './moveFocusOut';
import { useLatestRef } from './useLatestRef';

/**
 * Where focus last was outside a set of things that close themselves, such
 * as a container's notifications, for handing it back when one closes. It
 * follows focus anywhere on the page, so it's where focus came from when it
 * went into one of them, and it's cleared when focus goes to the page
 * itself, so a click on the page's background leaves nothing to go back to.
 *
 * @function useFocusOrigin
 * @param isInside - Says whether an element is in one of them. The latest
 *   one is called.
 * @returns A ref to where focus last was outside them.
 */
export function useFocusOrigin(isInside: (target: Node) => boolean): {
  readonly current: HTMLElement | null;
} {
  const originRef = useRef<HTMLElement | null>(null);
  const isInsideRef = useLatestRef(isInside);
  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.composedPath()[0] as HTMLElement;
      if (!isInsideRef.current(target)) originRef.current = target;
    };
    const handleFocusOut = (event: FocusEvent) => {
      const target = event.composedPath()[0] as HTMLElement;
      if (!event.relatedTarget && !isInsideRef.current(target)) {
        originRef.current = null;
      }
    };
    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('focusout', handleFocusOut, true);
    return () => {
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('focusout', handleFocusOut, true);
    };
  }, [isInsideRef]);
  return originRef;
}

/** What `passFocusOn` needs to know about a stack and the one leaving it. */
export interface PassFocusOnOptions {
  /** The id of the one leaving. */
  id: string;
  /** Its element, still on the page. */
  closing: Element;
  /**
   * The ids showing now, from the store, read once focus is found inside
   * `closing`. One still showing is moving rather than closing, as one does
   * to another stack, and focus is left alone.
   */
  showing: () => readonly { id: string }[];
  /** Each one's element on the page, by id, read once focus is found inside. */
  elements: () => Iterable<readonly [string, Element]>;
  /**
   * Returns what in another one's element takes focus, or `null` for one
   * with nothing that does.
   */
  pick: (el: Element) => HTMLElement | null;
  /** Where focus was before it went into the stack. */
  origin: HTMLElement | null;
}

/**
 * Moves focus out of one of a stack of things that close themselves, such as
 * notifications, as it closes holding focus. Without this, the browser drops
 * focus to the page once it's removed, and the next Tab starts from wherever
 * it resumes, the end of the page for a portaled stack.
 *
 * Focus goes to what `pick` finds in the next one in the stack that stays, or
 * else the one before, nearest first, and otherwise to `origin`, where it was
 * before it went into the stack, while that's still on the page. When what
 * `pick` found can't take focus, it goes to `origin` instead. One arriving in
 * the same render isn't on the page yet to take it.
 *
 * Call it in the commit that removes the element, while it's still on the
 * page. React hears no focus event for a move made then, so what focus lands
 * in hears it only through a listener of its own.
 *
 * @param options - The stack and the one leaving it.
 */
export function passFocusOn({
  id,
  closing,
  showing,
  elements,
  pick,
  origin,
}: PassFocusOnOptions): void {
  if (!closing.contains(getActiveElementInTree(closing))) return;
  const showingIds = new Set(showing().map(item => item.id));
  if (showingIds.has(id)) return;
  const staying = new Set<Element>();
  for (const [otherId, el] of elements()) {
    if (showingIds.has(otherId)) staying.add(el);
  }
  const nearest = (
    from: Element | null,
    step: (el: Element) => Element | null
  ) => {
    for (let el = from; el; el = step(el)) {
      const found = staying.has(el) ? pick(el) : null;
      if (found) return found;
    }
    return null;
  };
  const next =
    nearest(closing.nextElementSibling, el => el.nextElementSibling) ??
    nearest(closing.previousElementSibling, el => el.previousElementSibling);
  if (next) moveFocusOut([closing], next, null);
  // Only while focus is still inside, so when `next` didn't take it.
  moveFocusOut([closing], origin, null);
}
