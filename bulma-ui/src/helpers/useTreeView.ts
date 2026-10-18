// INTERNAL: deliberately not exported from src/index.ts.
import { useCallback, useReducer, useRef, useState } from 'react';
import type React from 'react';
import type { TreeViewSelectionMode } from '../components/TreeView';
import { useClientLayoutEffect } from './useClientLayoutEffect';
import { getActiveElementInTree } from './shadowDom';
import { typeaheadMatch, typeaheadText, useTypeahead } from './typeahead';

/** What an item tells the tree about itself when it registers. */
export interface TreeViewItemRecord {
  /** The value of the item it's in, or `null` at the top. */
  parent: string | null;
  disabled: boolean;
  /** It has children, or `hasChildren` says it will. */
  isParent: boolean;
}

/** An item as a key or a click on it sees it. */
export interface TreeViewItemInfo extends TreeViewItemRecord {
  value: string;
  open: boolean;
}

/** A box's state: checked, unchecked or mixed. */
export type TreeViewCheckState = boolean | 'mixed';

/**
 * What an item shows of the selection: `selected` in a `single` tree,
 * `checked` in a `checkbox` tree, and neither with `none`.
 */
export interface TreeViewItemState {
  selected?: boolean;
  checked?: TreeViewCheckState;
}

type Action = 'open' | 'select' | 'check';

/**
 * What Enter, Space and a click on the row do in each mode, from the tables
 * in #1096. `open` opens or closes a parent and does nothing on a leaf. A
 * click on the chevron only ever opens or closes.
 */
const MODES: Record<
  TreeViewSelectionMode,
  { enter: Action[]; space: Action[]; click: Action[] }
> = {
  none: { enter: ['open'], space: ['open'], click: ['open'] },
  single: { enter: ['select'], space: ['select'], click: ['select', 'open'] },
  checkbox: { enter: ['open'], space: ['check'], click: ['check'] },
};

/** Left and Right, swapped for a right-to-left page. */
const MIRRORED: Record<string, string> = {
  ArrowLeft: 'ArrowRight',
  ArrowRight: 'ArrowLeft',
};

/** An IME is composing, so the key belongs to it (`keyCode` 229 is Safari's word for it). */
const isComposing = (event: React.KeyboardEvent): boolean =>
  event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229;

/** The items a tree knows, and their elements while they're on the page. */
interface Registry {
  records: Map<string, TreeViewItemRecord>;
  // By value, for an item whose ref lets go, which hands over no element.
  elements: Map<string, HTMLLIElement>;
  // Weak, so an element that leaves the page needn't be forgotten by hand.
  values: WeakMap<Element, string>;
}

/** The registry's items on the page, in document order. */
const shownIn = (tree: Element, { values }: Registry): HTMLElement[] =>
  Array.from(tree.querySelectorAll<HTMLElement>('[role="treeitem"]')).filter(
    element => values.has(element)
  );

/** The item an item on the page sits in: its group's `<li>`, or none at the top. */
function parentItemOf(element: Element): HTMLElement | null {
  const group = element.parentElement!;
  return group.getAttribute('role') === 'group' ? group.parentElement : null;
}

/** The values of the items an item on the page is in, from the top. */
function pathOf(element: Element, { values }: Registry): string[] {
  const path: string[] = [];
  for (let at = parentItemOf(element); at; at = parentItemOf(at)) {
    path.unshift(values.get(at)!);
  }
  return path;
}

/**
 * Every known item's check state, by the rules in #1096:
 *
 * - a disabled item is checked only when its own value is listed;
 * - an enabled item with no enabled items anywhere under it is checked when
 *   it, or any item above it, is listed;
 * - any other enabled item follows the items of that second kind in its
 *   branch: checked when they all are, unchecked when none is, mixed between.
 *
 * Also returns the items of the second kind, which are what a toggle sets.
 */
function readChecks(
  records: Map<string, TreeViewItemRecord>,
  listed: Set<string>
): { states: Map<string, TreeViewCheckState>; ends: string[] } {
  const kids = new Map<string | null, string[]>();
  records.forEach(({ parent }, value) => {
    kids.set(parent, [...(kids.get(parent) ?? []), value]);
  });
  const states = new Map<string, TreeViewCheckState>();
  const ends: string[] = [];
  // How many enabled ends the branch holds, and how many are checked.
  const visit = (value: string, above: boolean): [number, number] => {
    const marked = above || listed.has(value);
    let total = 0;
    let on = 0;
    for (const kid of kids.get(value) ?? []) {
      const [t, o] = visit(kid, marked);
      total += t;
      on += o;
    }
    if (records.get(value)!.disabled) {
      states.set(value, listed.has(value));
      return [total, on];
    }
    if (total === 0) {
      states.set(value, marked);
      ends.push(value);
      return [1, marked ? 1 : 0];
    }
    states.set(value, on === total ? true : on > 0 && 'mixed');
    return [total, on];
  };
  for (const top of kids.get(null) ?? []) visit(top, false);
  return { states, ends };
}

/**
 * The list a toggle of `value` leaves: it and every enabled item under it
 * take the opposite of its state (a mixed one checks), and the rest is read
 * back by the rules. That's every item that shows checked, parents
 * included, plus any listed value no item has.
 */
function toggledList(
  records: Map<string, TreeViewItemRecord>,
  list: string[],
  value: string
): string[] {
  const { states, ends } = readChecks(records, new Set(list));
  const to = states.get(value) !== true;
  // An end was reached from the top, so everything above it is known.
  const under = (end: string) => {
    for (let at: string | null = end; at !== null;) {
      if (at === value) return true;
      at = records.get(at)!.parent;
    }
    return false;
  };
  const seed = new Set(
    ends.filter(end => (under(end) ? to : states.get(end) === true))
  );
  records.forEach(({ disabled }, item) => {
    if (disabled && states.get(item) === true) seed.add(item);
  });
  const after = readChecks(records, seed).states;
  return [
    ...Array.from(after)
      .filter(([, state]) => state === true)
      .map(([item]) => item),
    ...list.filter(item => !records.has(item)),
  ];
}

/** A value the caller holds, or one this hook holds when the caller doesn't. */
function useControlled<T>(controlled: T | undefined, initial: T) {
  const [own, setOwn] = useState(initial);
  const isControlled = controlled !== undefined;
  const set = (next: T) => {
    if (!isControlled) setOwn(next);
  };
  return [isControlled ? controlled : own, set] as const;
}

/** Options for `useTreeView`: the TreeView's own props. */
export interface TreeViewOptions {
  mode: TreeViewSelectionMode;
  selected?: string | null;
  defaultSelected: string | null;
  onSelectedChange?: (value: string) => void;
  checked?: string[];
  defaultChecked: string[];
  onCheckedChange?: (checked: string[]) => void;
  expanded?: string[];
  defaultExpanded: string[];
  onExpandedChange?: (expanded: string[]) => void;
}

/** What `useTreeView` hands the root and its items. */
export interface TreeViewEngine {
  /** For the `<ul role="tree">`. */
  treeRef: React.MutableRefObject<HTMLUListElement | null>;
  /**
   * Whether a closed item still renders its children, drawing nothing, so a
   * check knows everything under it. Only a checkbox tree needs to.
   */
  rendersClosed: boolean;
  /** The item that holds `tabIndex={0}`. */
  tabStop: string | null;
  isOpen: (value: string) => boolean;
  /**
   * What the item shows of the selection. `path` is the values of the items
   * above it, which decide its box until the items have registered, as on
   * the server.
   */
  stateOf: (
    value: string,
    path: string[],
    disabled: boolean
  ) => TreeViewItemState;
  /** Records an item from its layout effect. Returns the function that forgets it. */
  register: (value: string, record: TreeViewItemRecord) => () => void;
  /** For each item's `<li>` ref: records it, and notices focus leaving with it. */
  setElement: (value: string, element: HTMLLIElement | null) => void;
  /** Focus arrived on the item's own `<li>`. */
  onFocus: (value: string, element: HTMLLIElement) => void;
  /** Focus left the item's own `<li>`. */
  onBlur: () => void;
  /** A key on the item's `<li>`, after its own `onKeyDown`. */
  onKeyDown: (
    event: React.KeyboardEvent<HTMLLIElement>,
    item: TreeViewItemInfo
  ) => void;
  /**
   * A click on the item's row, or with `onToggle` on its chevron. Focus and
   * the tab stop move to the item.
   */
  onClick: (
    element: HTMLLIElement,
    item: TreeViewItemInfo,
    onToggle: boolean
  ) => void;
}

/**
 * The open state, the selection, the keys, the tab stop and the registry of
 * a TreeView (#1096). Focus moves for real, with a roving tabindex, rather
 * than through `aria-activedescendant`.
 *
 * Every item registers its value, its parent and whether it's disabled from
 * a layout effect. In a checkbox tree a closed item's children still render
 * and register while drawing nothing, so the registry knows every item and a
 * check reaches all of them. The keys read the items on the page, in
 * document order, each time they need them.
 *
 * @function useTreeView
 * @param options - The TreeView's props.
 * @returns The state and handlers the root and its items wire up.
 */
export function useTreeView(options: TreeViewOptions): TreeViewEngine {
  // An own key only, so a name every object inherits, like `toString`, is a
  // mode the tree doesn't know too.
  const mode = Object.prototype.hasOwnProperty.call(MODES, options.mode)
    ? options.mode
    : 'none';
  const actions = MODES[mode];

  const [expanded, setExpanded] = useControlled(
    options.expanded,
    options.defaultExpanded
  );
  const [selection, setSelection] = useControlled(
    options.selected,
    options.defaultSelected
  );
  const [checkedList, setChecked] = useControlled(
    options.checked,
    options.defaultChecked
  );
  // Each is read in its own mode only.
  const selected = mode === 'single' ? selection : null;
  const listed = new Set(mode === 'checkbox' ? checkedList : []);

  const treeRef = useRef<HTMLUListElement | null>(null);
  const registryRef = useRef<Registry>({
    records: new Map(),
    elements: new Map(),
    values: new WeakMap(),
  });
  // Items register from their own effects, so they ask for a render to be read.
  const [, refresh] = useReducer((n: number) => n + 1, 0);
  const typeahead = useTypeahead();

  // The item with focus, and where the stop rests while focus is elsewhere:
  // `undefined` until the tree has mounted. With the values above it, for
  // when it goes away.
  const [focused, setFocused] = useState<string | null>(null);
  const [resting, setResting] = useState<string | null | undefined>();
  const restingPathRef = useRef<string[]>([]);
  // The values above an item that left the page with focus in it.
  const lostRef = useRef<string[] | null>(null);

  const { records } = registryRef.current;
  const checks =
    mode === 'checkbox'
      ? // eslint-disable-next-line react-hooks/refs -- read in render on purpose: items write the registry from their layout effects and then ask for this render with `refresh`
        readChecks(records, listed).states
      : undefined;
  const tabStop = focused ?? (resting === undefined ? selected : resting);

  const isOpen = (value: string) => expanded.includes(value);

  const stateOf = (
    value: string,
    path: string[],
    disabled: boolean
  ): TreeViewItemState => {
    if (mode === 'single') {
      return disabled ? {} : { selected: value === selected };
    }
    if (checks) {
      // Until the items register, a value stands for its branch, and a
      // parent can't know it's mixed.
      const fromList =
        listed.has(value) || (!disabled && path.some(v => listed.has(v)));
      return { checked: checks.get(value) ?? fromList };
    }
    return {};
  };

  const changeOpen = (next: string[]) => {
    setExpanded(next);
    options.onExpandedChange?.(next);
  };

  const run: Record<Action, (item: TreeViewItemInfo) => void> = {
    open: ({ value, isParent, open }) => {
      if (isParent) {
        changeOpen(
          open ? expanded.filter(v => v !== value) : [...expanded, value]
        );
      }
    },
    select: ({ value }) => {
      if (value === selected) return;
      setSelection(value);
      options.onSelectedChange?.(value);
    },
    check: ({ value }) => {
      const next = toggledList(records, checkedList, value);
      setChecked(next);
      options.onCheckedChange?.(next);
    },
  };

  /** Disabled items are never selected, checked, opened or closed. */
  const act = (item: TreeViewItemInfo, list: Action[]) => {
    if (!item.disabled) list.forEach(action => run[action](item));
  };

  // After every render, put the stop where it belongs. While focus is in
  // the tree it's the focused item. Otherwise it's the selected item, or the
  // first checked one on the page, and failing that it stays where it was.
  // An item that goes away hands it to its nearest ancestor on the page, or
  // to the first item, and focus goes with it if it had focus.
  useClientLayoutEffect(() => {
    const tree = treeRef.current!;
    const registry = registryRef.current;
    // Each item's element is read off the page with its value, rather than
    // out of `elements`, which holds one element per value: two items
    // sharing a value, which they shouldn't, can leave it without one the
    // page still has.
    const shown = shownIn(tree, registry);
    const onPage = shown.map(element => registry.values.get(element)!);
    const elementOf = (value: string) => shown[onPage.indexOf(value)];
    const isShown = (value: string | null | undefined): value is string =>
      value != null && onPage.includes(value);
    const heir = (path: string[]) =>
      [...path].reverse().find(isShown) ?? onPage[0] ?? null;

    const lost = lostRef.current;
    lostRef.current = null;
    if (lost && !tree.contains(getActiveElementInTree(tree))) {
      const to = heir(lost);
      if (to) elementOf(to).focus();
      return;
    }
    if (focused !== null && !isShown(focused)) setFocused(null);

    const preferred = onPage.find(
      value => value === selected || checks?.get(value) === true
    );
    const next =
      preferred ?? (isShown(resting) ? resting : heir(restingPathRef.current));
    if (next !== resting) {
      setResting(next);
      restingPathRef.current = next ? pathOf(elementOf(next), registry) : [];
    }
  });

  const register = useCallback((value: string, record: TreeViewItemRecord) => {
    const { records: known } = registryRef.current;
    known.set(value, record);
    refresh();
    return () => {
      if (known.get(value) !== record) return;
      known.delete(value);
      refresh();
    };
  }, []);

  const setElement = useCallback(
    (value: string, element: HTMLLIElement | null) => {
      const registry = registryRef.current;
      if (element) {
        registry.elements.set(value, element);
        registry.values.set(element, value);
        return;
      }
      const gone = registry.elements.get(value);
      if (!gone) return;
      // The ref lets go before the element leaves the page, so it can still
      // say whether focus was in it, and where it sat.
      if (!lostRef.current && gone.contains(getActiveElementInTree(gone))) {
        lostRef.current = [...pathOf(gone, registry), value];
      }
      registry.elements.delete(value);
    },
    []
  );

  const onFocus = (value: string, element: HTMLLIElement) => {
    setFocused(value);
    setResting(value);
    restingPathRef.current = pathOf(element, registryRef.current);
  };

  const onBlur = () => setFocused(null);

  const onKeyDown = (
    event: React.KeyboardEvent<HTMLLIElement>,
    item: TreeViewItemInfo
  ) => {
    const element = event.currentTarget;
    // A key on an item inside this one bubbles here too, and is its own.
    if (
      event.target !== element ||
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      isComposing(event)
    ) {
      return;
    }
    const registry = registryRef.current;
    const items = shownIn(treeRef.current!, registry);
    const at = items.indexOf(element);
    const rtl = getComputedStyle(element).direction === 'rtl';
    const key = (rtl && MIRRORED[event.key]) || event.key;

    switch (key) {
      case 'ArrowDown':
        items[at + 1]?.focus();
        break;
      case 'ArrowUp':
        items[at - 1]?.focus();
        break;
      case 'Home':
        items[0].focus();
        break;
      case 'End':
        items[items.length - 1].focus();
        break;
      case 'ArrowRight': {
        const next = items[at + 1];
        if (!item.open) act(item, ['open']);
        else if (next && parentItemOf(next) === element) next.focus();
        break;
      }
      case 'ArrowLeft':
        if (item.open && !item.disabled) act(item, ['open']);
        else parentItemOf(element)?.focus();
        break;
      // A held key acts once.
      case 'Enter':
        if (!event.repeat) act(item, actions.enter);
        break;
      case ' ':
        if (!event.repeat) act(item, actions.space);
        break;
      case '*': {
        const closed: string[] = [];
        registry.records.forEach((record, value) => {
          if (
            record.parent === item.parent &&
            record.isParent &&
            !record.disabled &&
            !expanded.includes(value)
          ) {
            closed.push(value);
          }
        });
        if (closed.length) changeOpen([...expanded, ...closed]);
        break;
      }
      default:
        // Type-ahead takes a printable character. Anything else, Escape and
        // Tab included, is left to whatever is around the tree.
        if (event.key.length !== 1) return;
        typeaheadMatch(items, typeahead.type(event.key), at, el =>
          typeaheadText(el.firstElementChild!)
        )?.focus();
    }
    event.preventDefault();
  };

  const onClick = (
    element: HTMLLIElement,
    item: TreeViewItemInfo,
    onToggle: boolean
  ) => {
    element.focus();
    act(item, onToggle ? ['open'] : actions.click);
  };

  return {
    treeRef,
    rendersClosed: mode === 'checkbox',
    tabStop,
    isOpen,
    stateOf,
    register,
    setElement,
    onFocus,
    onBlur,
    onKeyDown,
    onClick,
  };
}
