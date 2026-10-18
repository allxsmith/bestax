// INTERNAL: deliberately not exported from src/index.ts.
import { useEffect, useMemo, useRef } from 'react';

/** How long typed characters keep adding up to one search, in milliseconds. */
export const TYPEAHEAD_TIMEOUT = 500;

/**
 * The text typing finds an element by: what it says, without what's hidden
 * from assistive technology, such as an icon whose glyph is a ligature's name.
 */
export function typeaheadText(element: Element): string {
  let text = '';
  const read = (node: Node) => {
    node.childNodes.forEach(child => {
      if (child.nodeType === 3) text += child.textContent;
      else if (
        child.nodeType === 1 &&
        (child as Element).getAttribute('aria-hidden') !== 'true'
      ) {
        read(child);
      }
    });
  };
  read(element);
  return text.trim().toLowerCase();
}

/**
 * The item typing `search` moves to, or none. A single character looks from
 * the item after the focused one, so typing the same letter again cycles
 * through the items that start with it, and so does a run of one letter
 * ("dd"). A longer search looks from the focused item, so typing more of
 * its own text keeps it.
 *
 * @param items - The items typing can reach, in the order they're shown.
 * @param search - What's been typed, lowercased.
 * @param current - The focused item's index in `items`, or -1 for none.
 * @param textOf - The text an item is found by. By default it's the item's
 * own, read by `typeaheadText`.
 */
export function typeaheadMatch<T extends Element>(
  items: T[],
  search: string,
  current: number,
  textOf: (item: T) => string = typeaheadText
): T | undefined {
  const repeated = Array.from(search).every(char => char === search[0]);
  const wanted = repeated ? search[0] : search;
  const start = current < 0 ? 0 : current + (wanted.length === 1 ? 1 : 0);
  for (let i = 0; i < items.length; i += 1) {
    const item = items[(start + i) % items.length];
    if (textOf(item).startsWith(wanted)) return item;
  }
  return undefined;
}

/** What `useTypeahead` returns. */
export interface Typeahead {
  /**
   * Adds a typed character to the search and returns the whole search,
   * lowercased. Characters typed within `TYPEAHEAD_TIMEOUT` of each other
   * add up, and after that the next one starts a new search.
   */
  type: (char: string) => string;
  /** Forgets what has been typed, so the next character starts a new search. */
  reset: () => void;
}

/**
 * Keeps what has been typed for a type-ahead search, and forgets it once
 * `TYPEAHEAD_TIMEOUT` passes with nothing typed. Pair it with
 * `typeaheadMatch` to find the item the search names.
 *
 * @function useTypeahead
 * @returns A way to add a character to the search, and a way to forget it.
 */
export function useTypeahead(): Typeahead {
  const typedRef = useRef<{
    text: string;
    timer?: ReturnType<typeof setTimeout>;
  }>({ text: '' });

  useEffect(() => {
    const typed = typedRef.current;
    return () => clearTimeout(typed.timer);
  }, []);

  return useMemo<Typeahead>(() => {
    const reset = () => {
      const typed = typedRef.current;
      clearTimeout(typed.timer);
      typed.text = '';
    };
    const type = (char: string) => {
      const typed = typedRef.current;
      typed.text += char.toLowerCase();
      clearTimeout(typed.timer);
      typed.timer = setTimeout(reset, TYPEAHEAD_TIMEOUT);
      return typed.text;
    };
    return { type, reset };
  }, []);
}
