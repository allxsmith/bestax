// INTERNAL: deliberately not exported from src/index.ts. The columns of a
// Cascader: which are open, which item in each is on the open path, and the
// keys that move between them.

import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import type { TreeItemData } from '../form/TreeSelect';
import { childNodes, isParentNode, type TreeNodeEntry } from './treeData';
import { useClientLayoutEffect } from './useClientLayoutEffect';
import { useControlled } from './useControlled';
import { useLatestRef } from './useLatestRef';

/** One column: the items under the node that opened it, and the one on the open path. */
export interface CascaderColumn {
  /** The node whose items these are, or `null` for the first column. */
  parent: TreeItemData | null;
  items: TreeItemData[];
  /**
   * The item on the open path in this column, where focus last was, or
   * `null`. It isn't the picked one: that's the Cascader's value.
   */
  current: string | null;
}

/** Options for `useCascaderColumns`: the Cascader's props and state. */
export interface CascaderColumnsOptions {
  data: TreeItemData[];
  index: Map<string, TreeNodeEntry>;
  /** Whether the panel is open. Opening it opens the picked node's path. */
  open: boolean;
  /** The picked node's value. */
  value: string | null;
  expanded?: string[];
  defaultExpanded: string[];
  onExpandedChange?: (expanded: string[]) => void;
}

/** What `useCascaderColumns` hands the Cascader. */
export interface CascaderColumnsEngine {
  /** The open columns, the first always among them. */
  columns: CascaderColumn[];
  /** For the element the columns sit in, which focus moving between them reads. */
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  /**
   * Opens the columns along a value's path and makes it current, from an
   * event: the panel opening on a click or a key, or a pick from the search.
   * It's reported at once, so a held `expanded` can follow in the same render.
   */
  reveal: (value: string | null) => void;
  /**
   * Focus arrived on an item, and the open path follows it: the item ends
   * the path in its column, and any column further along closes.
   */
  moveTo: (column: number, value: string) => void;
  /** Opens a parent's column and moves focus into it. */
  open: (column: number, node: TreeItemData) => void;
  /**
   * Right and Left, swapped on a right-to-left page, on the focused row of a
   * column: its item, or `null` for a load's row. Right opens that item and
   * nothing else.
   */
  onKeyDown: (
    event: React.KeyboardEvent<HTMLElement>,
    column: number,
    node: TreeItemData | null
  ) => void;
}

const samePath = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, at) => value === b[at]);

/** A column's listbox, by its place among them. */
const listboxAt = (container: HTMLElement | null, column: number) =>
  container?.querySelectorAll<HTMLElement>('[role="listbox"]')[column];

/** The item that holds a listbox's tab stop. */
const tabStopIn = (listbox: HTMLElement | undefined) =>
  listbox?.querySelector<HTMLElement>('[role="option"][tabindex="0"]');

/**
 * The open path of a Cascader's columns. `expanded` holds the values of the
 * items whose columns are open, one per column, so the first column shows
 * `data` and each next one the items of the node before it. The last
 * column's current item, whose column isn't open, is held apart. Focus moves
 * for real: the keys and clicks move it, and the open path follows it.
 *
 * @function useCascaderColumns
 * @param options - The Cascader's data, whether it's open, its value and its `expanded` props.
 * @returns The columns, and what the columns' items and keys call.
 */
export function useCascaderColumns(
  options: CascaderColumnsOptions
): CascaderColumnsEngine {
  const { data, index, open: isOpen, value } = options;
  const [expanded, setExpanded] = useControlled(
    options.expanded,
    options.defaultExpanded
  );
  const onExpandedChangeRef = useLatestRef(options.onExpandedChange);
  // The current item in the last column, which opens nothing.
  const [tail, setTail] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // The column focus moves into once it has rendered.
  const focusIntoRef = useRef<number | null>(null);

  const changeExpanded = (next: string[]) => {
    setExpanded(next);
    onExpandedChangeRef.current?.(next);
  };

  // Opens the columns along a value's path and makes it current. `report`
  // is handed the path when it changes.
  const revealPath = (
    target: string | null,
    report: (path: string[]) => void
  ) => {
    const path = target === null ? undefined : index.get(target)?.path;
    setTail(path ? target : null);
    if (path && !samePath(path, expanded)) {
      setExpanded(path);
      report(path);
    }
  };

  // Opening the panel opens the picked node's path. A click or a key does
  // it through `reveal`, which reports it at once. `defaultOpen` and a held
  // `open` have no event, so it's done in the render that opens the panel,
  // where the panel's first focus finds the picked node, and reported once
  // that render is on the page.
  const [wasOpen, setWasOpen] = useState(false);
  const [toReport, setToReport] = useState<string[] | null>(null);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) revealPath(value, path => setToReport([...path]));
  }
  const reportedRef = useRef<string[] | null>(null);
  useEffect(() => {
    if (!toReport || reportedRef.current === toReport) return;
    reportedRef.current = toReport;
    onExpandedChangeRef.current?.(toReport);
  }, [toReport, onExpandedChangeRef]);

  // Each open item opens the next column, as long as it's an enabled parent
  // in the column before; the path stops at the first one that isn't.
  const columns: CascaderColumn[] = [];
  let parent: TreeItemData | null = null;
  let items = data;
  for (let at = 0; ; at++) {
    const step = at < expanded.length ? expanded[at] : tail;
    const node = items.find(item => item.value === step);
    columns.push({ parent, items, current: node ? node.value : null });
    if (
      at >= expanded.length ||
      !node ||
      node.disabled ||
      !isParentNode(node)
    ) {
      break;
    }
    parent = node;
    items = childNodes(node);
  }

  const reveal = (next: string | null) => {
    // The panel is open now, so the render doesn't reveal it again.
    setWasOpen(true);
    revealPath(next, path => onExpandedChangeRef.current?.(path));
  };

  const moveTo = (column: number, next: string) => {
    if (columns[column].current === next) return;
    if (expanded.length > column) changeExpanded(expanded.slice(0, column));
    setTail(next);
  };

  // Focus goes into a column at its tab stop, disabled or not, since the
  // keys reach disabled items: its current item, or the first enabled one
  // in a column that just opened. A column still loading, with no items
  // yet, leaves focus where it was.
  const focusInto = (column: number) => {
    const target = columns[column];
    if (!target || (target.parent?.isLoading && !target.items.length)) return;
    tabStopIn(listboxAt(containerRef.current, column))?.focus();
  };

  const open = (column: number, node: TreeItemData) => {
    if (node.disabled || !isParentNode(node)) return;
    if (expanded[column] === node.value) {
      focusInto(column + 1);
      return;
    }
    changeExpanded([...expanded.slice(0, column), node.value]);
    setTail(null);
    focusIntoRef.current = column + 1;
  };

  // A column that just opened takes focus once it's on the page.
  useClientLayoutEffect(() => {
    const column = focusIntoRef.current;
    if (column === null) return;
    focusIntoRef.current = null;
    focusInto(column);
  });

  const onKeyDown = (
    event: React.KeyboardEvent<HTMLElement>,
    column: number,
    node: TreeItemData | null
  ) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (event.key === forward) {
      event.preventDefault();
      if (node) open(column, node);
    } else if (event.key === back) {
      event.preventDefault();
      if (column > 0) {
        tabStopIn(listboxAt(containerRef.current, column - 1))?.focus();
      }
    }
  };

  return { columns, containerRef, reveal, moveTo, open, onKeyDown };
}
