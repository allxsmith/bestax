// INTERNAL: deliberately not exported from src/index.ts. Walking the nodes a
// TreeSelect takes as `data`, so a picker can name, check and search a tree
// while it isn't on the page.

import type {
  TreeItemData,
  TreeSelectCheckedStrategy,
} from '../form/TreeSelect';
import { readChecks, type TreeViewItemRecord } from './useTreeView';

/** A node, and the values of the nodes above it, from the top. */
export interface TreeNodeEntry {
  node: TreeItemData;
  path: string[];
}

/**
 * Every node by its value, in the order the tree reads from top to bottom.
 * Values are meant to be unique, and the first node with a value wins.
 */
export function indexTree(data: TreeItemData[]): Map<string, TreeNodeEntry> {
  const index = new Map<string, TreeNodeEntry>();
  const walk = (nodes: TreeItemData[], path: string[]) => {
    for (const node of nodes) {
      if (!index.has(node.value)) index.set(node.value, { node, path });
      if (node.children) walk(node.children, [...path, node.value]);
    }
  };
  walk(data, []);
  return index;
}

/** What a node is called: its `label`, or its `value` when that's empty. */
export const nodeLabel = (node: TreeItemData): string =>
  node.label || node.value;

/** The nodes under a node, none when it has no `children`. */
export const childNodes = (node: TreeItemData): TreeItemData[] =>
  node.children ?? [];

/** Whether a node is a parent: it has children, or `hasChildren` says it will. */
export const isParentNode = (node: TreeItemData): boolean =>
  childNodes(node).length > 0 || !!node.hasChildren;

/**
 * The records TreeView's check rules read, built from the nodes rather than
 * from the items on the page, so the checked list can be worked out while
 * the tree isn't there.
 */
export function checkRecords(
  index: Map<string, TreeNodeEntry>
): Map<string, TreeViewItemRecord> {
  const records = new Map<string, TreeViewItemRecord>();
  index.forEach(({ node, path }, value) =>
    records.set(value, {
      parent: path[path.length - 1] ?? null,
      disabled: !!node.disabled,
      isParent: isParentNode(node),
    })
  );
  return records;
}

/**
 * The checked list a `checkedStrategy` reports for the items `listed` checks
 * by TreeView's rules, in the tree's order. `all` is every checked item;
 * `child` the checked items with no enabled item under them; `parent` the
 * checked items whose parent isn't. A disabled item is checked by its own
 * value only, so a checked one is in every list. Values no node has are
 * kept, at the end. Passed back in, each list checks the same items.
 */
export function checkedByStrategy(
  records: Map<string, TreeViewItemRecord>,
  listed: string[],
  strategy: TreeSelectCheckedStrategy
): string[] {
  const { states, ends } = readChecks(records, new Set(listed));
  const isEnd = new Set(ends);
  const on = (value: string | null) =>
    value !== null && states.get(value) === true;
  const kept: string[] = [];
  records.forEach(({ parent, disabled }, value) => {
    if (!on(value)) return;
    if (
      strategy === 'all' ||
      disabled ||
      (strategy === 'child' ? isEnd.has(value) : !on(parent))
    ) {
      kept.push(value);
    }
  });
  const unknown = new Set(listed.filter(value => !records.has(value)));
  return [...kept, ...unknown];
}

/** What a search leaves of a tree. */
export interface TreeSearch {
  /** The values of the nodes it hides. */
  hidden: Set<string>;
  /** The values of the nodes with a match under them, which open. */
  open: string[];
  /** Whether anything matched. */
  found: boolean;
}

/**
 * What a search shows of a tree: the nodes that match, the nodes above them,
 * so the results stay a tree, and the nodes under them, so a matching branch
 * can still be opened.
 */
export function searchTree(
  data: TreeItemData[],
  matches: (node: TreeItemData) => boolean
): TreeSearch {
  const hidden = new Set<string>();
  const open: string[] = [];
  // Whether the nodes, or any node under them, match.
  const walk = (nodes: TreeItemData[], underMatch: boolean): boolean => {
    let found = false;
    for (const node of nodes) {
      const self = matches(node);
      const below = walk(childNodes(node), underMatch || self);
      if (below) open.push(node.value);
      if (!underMatch && !self && !below) hidden.add(node.value);
      found = found || self || below;
    }
    return found;
  };
  return { hidden, open, found: walk(data, false) };
}
