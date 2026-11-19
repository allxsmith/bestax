// INTERNAL: deliberately not exported from src/index.ts.
import { useMemo } from 'react';
import type { KeyboardEvent } from 'react';
import { getActiveElementInTree } from './shadowDom';
import { spaceJoinMatch, typeaheadMatch, useTypeahead } from './typeahead';

export { TYPEAHEAD_TIMEOUT } from './typeahead';

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

/** Whether `node` is one of `menu`'s items, enabled or not. */
const isItemOf = (
  menu: Element,
  node: Element | null,
  selector: string
): boolean => Boolean(node && menu.contains(node) && node.matches(selector));

/** The items in `menu` the keys reach, in document order. */
export function enabledMenuItems(menu: Element): HTMLElement[] {
  return Array.from(
    menu.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR)
  ).filter(isEnabledMenuItem);
}

/**
 * Whether the browser activates `item` on this key by itself: a `<button>`
 * answers Enter and Space, and a link with an `href` answers Enter.
 */
function activatesItself(item: HTMLElement, key: string): boolean {
  if (item.tagName === 'BUTTON') return true;
  return key === 'Enter' && item.tagName === 'A' && item.hasAttribute('href');
}

/** Options for `useMenuKeys`. */
export interface MenuKeysOptions {
  /**
   * The axis the items run along. `'vertical'` moves with Down and Up.
   * `'horizontal'` moves with Right and Left, read in the menu's writing
   * direction when the key arrives, so in right-to-left text Left moves on
   * to the next item and Right back. A horizontal menu should carry
   * `aria-orientation="horizontal"`, which the hook doesn't set.
   * @defaultValue 'vertical'
   */
  orientation?: 'vertical' | 'horizontal';
  /**
   * Swaps the axis's two arrows, for items that run the other way on the
   * screen from where they start: up from the element that opened them, or
   * toward the start of the line. Home and End still go to the first and
   * last items in the DOM.
   * @defaultValue false
   */
  reverse?: boolean;
  /**
   * Reads a horizontal menu's arrows as they point on the screen: Right
   * moves on and Left back, in right-to-left text too, for items laid out by
   * the screen rather than by the writing direction. Vertical arrows are
   * physical anyway.
   * @defaultValue false
   */
  physical?: boolean;
  /**
   * What the items are, as a selector, such as `[role="option"]` for a
   * listbox.
   * @defaultValue MENU_ITEM_SELECTOR
   */
  itemSelector?: string;
  /**
   * Disabled items stay reachable by the arrows, Home, End and type-ahead,
   * as a listbox's and a tree's are, so a screen reader finds them. Enter
   * and Space never activate one.
   * @defaultValue false
   */
  disabledReachable?: boolean;
  /**
   * Space joins a type-ahead search under way when an item starts with what
   * has been typed and a space, so "new y" reaches "New York". Otherwise it
   * activates the focused item, as it does without this. An arrow, Home or
   * End ends the search, so a Space after one acts on the item it reached.
   * @defaultValue false
   */
  spaceJoinsSearch?: boolean;
}

/**
 * Which way an arrow key moves through the items: `1` to the next, `-1` to
 * the previous, or `0` for any other key. A horizontal menu reads its
 * writing direction now rather than when it rendered, as `Splitter` and
 * `useTreeView` do, so it follows a `dir` set anywhere above it, unless it's
 * `physical`.
 */
function arrowStep(
  key: string,
  menu: HTMLElement,
  orientation: 'vertical' | 'horizontal',
  reverse: boolean,
  physical: boolean
): 1 | -1 | 0 {
  const horizontal = orientation === 'horizontal';
  const [next, previous] = horizontal
    ? ['ArrowRight', 'ArrowLeft']
    : ['ArrowDown', 'ArrowUp'];
  if (key !== next && key !== previous) return 0;
  const rtl =
    horizontal && !physical && getComputedStyle(menu).direction === 'rtl';
  // Each of the three swaps the pair once.
  return ((key === next) !== rtl) !== reverse ? 1 : -1;
}

/** What `useMenuKeys` returns. */
export interface MenuKeys {
  /** The `keydown` handler for the `role="menu"` element. */
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  /**
   * Forgets what has been typed, so the next character starts a new search.
   * Call it when the menu opens, so a search typed just before it last
   * closed doesn't carry over.
   */
  reset: () => void;
}

/**
 * Moves through and activates the items of a `role="menu"` element from the
 * keyboard. Put the `onKeyDown` it returns on that element. It reads the
 * items from the element each time, so items that come and go are found,
 * and it renders nothing.
 *
 * It acts only while focus is on the menu element itself or on one of its
 * items, so anything else focusable inside the menu, such as a filter
 * field, keeps its own keys.
 *
 * - Down and Up move to the next and previous enabled item, wrapping, and
 *   Home and End go to the first and last. From no item, Down goes to the
 *   first and Up to the last. From an item that turned disabled while it had
 *   focus, they go on from where it sits, and so does typing. `options`
 *   turns the axis sideways, swaps its arrows, or reads them as they point
 *   on the screen, and the other axis's arrows are left alone.
 * - Enter and Space activate the focused item, Space unless
 *   `spaceJoinsSearch` has it join a search. A `<button>`, and a link with
 *   an `href` for Enter, get the browser's own click, and anything else gets
 *   one from here, so its `onClick` runs either way. A key held down
 *   activates it once. A key handler on the item that called
 *   `preventDefault()` has claimed the key, and nothing else runs it.
 * - A printable character moves to the next enabled item whose text starts
 *   with what has been typed. Characters typed within `TYPEAHEAD_TIMEOUT` of
 *   each other add up to one search, until `reset` starts a new one.
 *
 * Items are `MENU_ITEM_SELECTOR` matches, and disabled ones are skipped by
 * all of the above. Escape and Tab are left to the menu's owner, since what
 * closing means is up to it, and so is any other key. `options` makes the
 * items another selector's matches, such as a listbox's options, can keep
 * disabled items reachable, and can let Space join a search under way.
 *
 * @function useMenuKeys
 * @param options - The axis the items run along, whether its arrows are
 * swapped, another kind of item, whether disabled ones are reached, and
 * whether Space joins a search. Without it, Down and Up move, as in a menu
 * that drops down.
 * @returns The `keydown` handler for the menu element, and a way to forget
 * what has been typed.
 */
export function useMenuKeys(options: MenuKeysOptions = {}): MenuKeys {
  const {
    orientation = 'vertical',
    reverse = false,
    physical = false,
    itemSelector = MENU_ITEM_SELECTOR,
    disabledReachable = false,
    spaceJoinsSearch = false,
  } = options;
  const typeahead = useTypeahead();

  return useMemo<MenuKeys>(() => {
    const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
      const menu = event.currentTarget;
      const focused = getActiveElementInTree(menu);
      if (focused !== menu && !isItemOf(menu, focused, itemSelector)) return;
      const all = Array.from(menu.querySelectorAll<HTMLElement>(itemSelector));
      const items = disabledReachable ? all : all.filter(isEnabledMenuItem);
      if (!items.length) return;
      const current = items.indexOf(focused as HTMLElement);
      // An item that turned disabled while it had focus, and kept it, isn't
      // one of the items any more. It's still an item, so the keys go on
      // from where it sits: `next` is the first item after it, wrapping, and
      // the one before that is the item before it. From the menu itself,
      // Down goes to the first.
      const stranded = current < 0 && focused !== menu;
      let next = current + 1;
      if (stranded) {
        const after = items.findIndex(
          item =>
            (focused as Node).compareDocumentPosition(item) &
            Node.DOCUMENT_POSITION_FOLLOWING
        );
        next = Math.max(after, 0);
      }
      const step = arrowStep(event.key, menu, orientation, reverse, physical);
      // A key that moves focus ends a search Space could join, so a Space
      // after it acts on the item it reached.
      if (
        spaceJoinsSearch &&
        (step !== 0 || event.key === 'Home' || event.key === 'End')
      ) {
        typeahead.reset();
      }
      if (step === 1) {
        event.preventDefault();
        items[next % items.length].focus();
        return;
      }
      if (step === -1) {
        event.preventDefault();
        const previous = (current >= 0 ? current : next) - 1;
        items[(previous + items.length) % items.length].focus();
        return;
      }
      switch (event.key) {
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
          // Typed as a character, below, when the search can take it.
          if (
            event.key === ' ' &&
            spaceJoinsSearch &&
            spaceJoinMatch(items, typeahead.typed(), current)
          ) {
            break;
          }
          const item = items[current];
          // A disabled item the arrows reach does nothing, and Space doesn't
          // scroll the page.
          if (!isEnabledMenuItem(item)) {
            event.preventDefault();
            return;
          }
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
      // From a stranded item, the search starts at the item after it, as it
      // does from an item that's still one of them.
      const order = stranded
        ? [...items.slice(next), ...items.slice(0, next)]
        : items;
      typeaheadMatch(order, typeahead.type(event.key), current)?.focus();
    };
    return { onKeyDown, reset: typeahead.reset };
  }, [
    typeahead,
    orientation,
    reverse,
    physical,
    itemSelector,
    disabledReachable,
    spaceJoinsSearch,
  ]);
}
