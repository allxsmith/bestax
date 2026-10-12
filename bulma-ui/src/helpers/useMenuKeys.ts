// INTERNAL: deliberately not exported from src/index.ts.
import { useCallback, useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { getActiveElementInTree } from './shadowDom';

/**
 * Every menu-item role, so an item a caller gives `menuitemcheckbox` or
 * `menuitemradio` (a filter or sort menu) stays reachable.
 */
export const MENU_ITEM_SELECTOR =
  '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';

/**
 * Whether a menu item can be reached and activated: it isn't disabled, as a
 * native control or through `aria-disabled="true"`.
 */
export function isEnabledMenuItem(item: Element): boolean {
  return (
    !item.hasAttribute('disabled') &&
    item.getAttribute('aria-disabled') !== 'true'
  );
}

/** The items in `menu` the keys reach, in document order. */
export function enabledMenuItems(menu: Element): HTMLElement[] {
  return Array.from(
    menu.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR)
  ).filter(isEnabledMenuItem);
}

/** How long typed characters keep adding up to one search, in milliseconds. */
export const TYPEAHEAD_TIMEOUT = 500;

/**
 * Whether the browser activates `item` on this key by itself: a `<button>`
 * answers Enter and Space, and a link with an `href` answers Enter.
 */
function activatesItself(item: HTMLElement, key: string): boolean {
  if (item.tagName === 'BUTTON') return true;
  return key === 'Enter' && item.tagName === 'A' && item.hasAttribute('href');
}

/**
 * The text typing finds an item by: what it says, without what's hidden from
 * assistive technology, such as an icon whose glyph is a ligature's name.
 */
function label(item: Element): string {
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
  read(item);
  return text.trim().toLowerCase();
}

/**
 * The item typing `search` moves to, or none. A single character looks from
 * the item after the focused one, so typing the same letter again cycles
 * through the items that start with it, and so does a run of one letter
 * ("dd"). A longer search looks from the focused item, so typing more of
 * its own text keeps it.
 */
function typeaheadMatch(
  items: HTMLElement[],
  search: string,
  current: number
): HTMLElement | undefined {
  const repeated = Array.from(search).every(char => char === search[0]);
  const wanted = repeated ? search[0] : search;
  const start = current < 0 ? 0 : current + (wanted.length === 1 ? 1 : 0);
  for (let i = 0; i < items.length; i += 1) {
    const item = items[(start + i) % items.length];
    if (label(item).startsWith(wanted)) return item;
  }
  return undefined;
}

/**
 * Moves through and activates the items of a `role="menu"` element from the
 * keyboard. Put the handler it returns on that element's `onKeyDown`. It
 * reads the items from the element each time, so items that come and go are
 * found, and it renders nothing.
 *
 * - Down and Up move to the next and previous enabled item, wrapping, and
 *   Home and End go to the first and last. From no item, Down goes to the
 *   first and Up to the last.
 * - Enter and Space activate the focused item. A `<button>`, and a link with
 *   an `href` for Enter, get the browser's own click, and anything else gets
 *   one from here, so its `onClick` runs either way. A key held down
 *   activates it once. A key handler on the item that called
 *   `preventDefault()` has claimed the key, and nothing else runs it.
 * - A printable character moves to the next enabled item whose text starts
 *   with what has been typed. Characters typed within `TYPEAHEAD_TIMEOUT` of
 *   each other add up to one search.
 *
 * Items are `MENU_ITEM_SELECTOR` matches, and disabled ones are skipped by
 * all of the above. Escape and Tab are left to the menu's owner, since what
 * closing means is up to it, and so is any other key.
 *
 * @function useMenuKeys
 * @returns The `keydown` handler for the menu element.
 */
export function useMenuKeys(): (event: KeyboardEvent<HTMLElement>) => void {
  const typedRef = useRef<{
    text: string;
    timer?: ReturnType<typeof setTimeout>;
  }>({ text: '' });

  useEffect(() => {
    const typed = typedRef.current;
    return () => clearTimeout(typed.timer);
  }, []);

  return useCallback((event: KeyboardEvent<HTMLElement>) => {
    const menu = event.currentTarget;
    const items = enabledMenuItems(menu);
    if (!items.length) return;
    const current = items.indexOf(getActiveElementInTree(menu) as HTMLElement);
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        items[current >= 0 ? (current + 1) % items.length : 0].focus();
        return;
      case 'ArrowUp':
        event.preventDefault();
        items[
          current >= 0
            ? (current - 1 + items.length) % items.length
            : items.length - 1
        ].focus();
        return;
      case 'Home':
        event.preventDefault();
        items[0].focus();
        return;
      case 'End':
        event.preventDefault();
        items[items.length - 1].focus();
        return;
      case 'Enter':
      case ' ': {
        if (current < 0 || event.defaultPrevented) return;
        const item = items[current];
        if (activatesItself(item, event.key)) {
          // The browser clicks on Enter's keydown, and a held key sends one
          // per auto-repeat. Space clicks on keyup, once however long it's
          // held.
          if (event.repeat && event.key === 'Enter') event.preventDefault();
          return;
        }
        // Space would scroll the page, and a held key repeats.
        event.preventDefault();
        if (!event.repeat) item.click();
        return;
      }
      default:
        break;
    }

    if (
      event.key.length !== 1 ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.defaultPrevented
    ) {
      return;
    }
    event.preventDefault();
    const typed = typedRef.current;
    typed.text += event.key.toLowerCase();
    clearTimeout(typed.timer);
    typed.timer = setTimeout(() => {
      typed.text = '';
    }, TYPEAHEAD_TIMEOUT);
    typeaheadMatch(items, typed.text, current)?.focus();
  }, []);
}
