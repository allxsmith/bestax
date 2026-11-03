// INTERNAL: deliberately not exported from src/index.ts. The columns of a
// Cascader: which are open, which item each has selected, and the keys that
// move between them.

import { useRef, useState } from 'react';
import type React from 'react';
import type { TreeItemData } from '../form/TreeSelect';
import { childNodes, isParentNode, type TreeNodeEntry } from './treeData';
import { useClientLayoutEffect } from './useClientLayoutEffect';
import { useControlled } from './useControlled';

/** One column: the items under the node that opened it, and the one selected. */
export interface CascaderColumn {
  /** The node whose items these are, or `null` for the first column. */
  parent: TreeItemData | null;
  items: TreeItemData[];
  /** The selected item's value: the one on the path, where focus last was. */
  selected: string | null;
}

/** Options for `useCascaderColumns`: the Cascader's props. */
export interface CascaderColumnsOptions {
  data: TreeItemData[];
  index: Map<string, TreeNodeEntry>;
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
  /** Opens the columns along a value's path and selects it, as the panel opens. */
  reveal: (value: string | null) => void;
  /**
   * Focus arrived on an item, which selection follows: it ends the path in
   * its column, and any column further along closes.
   */
  select: (column: number, value: string) => void;
  /** Opens a parent's column and moves focus to its first enabled item. */
  open: (column: number, node: TreeItemData) => void;
  /** Right and Left, swapped on a right-to-left page, for a column's listbox. */
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>, column: number) => void;
}

/** A column's listbox, by its place among them. */
const listboxAt = (container: HTMLElement | null, column: number) =>
  container?.querySelectorAll<HTMLElement>('[role="listbox"]')[column];

/** The item that holds a listbox's tab stop. */
const tabStopIn = (listbox: HTMLElement | undefined) =>
  listbox?.querySelector<HTMLElement>('[role="option"][tabindex="0"]');

/**
 * The open path and the selection of a Cascader's columns. `expanded` holds
 * the values of the items whose columns are open, one per column, so the
 * first column shows `data` and each next one the items of the node before
 * it. The last column's selected item, whose column isn't open, is held
 * apart. Focus moves for real: the keys and clicks move it, and the
 * selection follows it.
 *
 * @function useCascaderColumns
 * @param options - The Cascader's data and its `expanded` props.
 * @returns The columns, and what the columns' items and keys call.
 */
export function useCascaderColumns(
  options: CascaderColumnsOptions
): CascaderColumnsEngine {
  const { data, index, onExpandedChange } = options;
  const [expanded, setExpanded] = useControlled(
    options.expanded,
    options.defaultExpanded
  );
  // The selected item in the last column, which opens nothing.
  const [tail, setTail] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // The column focus moves into once it has rendered.
  const focusIntoRef = useRef<number | null>(null);

  const changeExpanded = (next: string[]) => {
    setExpanded(next);
    onExpandedChange?.(next);
  };

  // Each open item opens the next column, as long as it's an enabled parent
  // in the column before; the path stops at the first one that isn't.
  const columns: CascaderColumn[] = [];
  let parent: TreeItemData | null = null;
  let items = data;
  for (let at = 0; ; at++) {
    const value = at < expanded.length ? expanded[at] : tail;
    const node = items.find(item => item.value === value);
    columns.push({ parent, items, selected: node ? node.value : null });
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

  const reveal = (value: string | null) => {
    const path = (value !== null && index.get(value)?.path) || null;
    if (path && path.join('\0') !== expanded.join('\0')) changeExpanded(path);
    setTail(path ? value : null);
  };

  const select = (column: number, value: string) => {
    if (columns[column].selected === value) return;
    if (expanded.length > column) changeExpanded(expanded.slice(0, column));
    setTail(value);
  };

  // Focus goes into a column at its tab stop: its selected item, or the
  // first enabled one in a column that just opened. A column with nothing to
  // pick yet, only a loading row, leaves focus where it was.
  const focusInto = (column: number) =>
    listboxAt(containerRef.current, column)
      ?.querySelector<HTMLElement>(
        '[role="option"][tabindex="0"]:not([aria-disabled="true"])'
      )
      ?.focus();

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
    column: number
  ) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (event.key === forward) {
      event.preventDefault();
      const value = columns[column].selected;
      const node = columns[column].items.find(item => item.value === value);
      if (node) open(column, node);
    } else if (event.key === back) {
      event.preventDefault();
      if (column > 0) {
        tabStopIn(listboxAt(containerRef.current, column - 1))?.focus();
      }
    }
  };

  return { columns, containerRef, reveal, select, open, onKeyDown };
}
