import { createContext } from 'react';

/**
 * What a `Collapses` group hands the item it wraps: whether that item is open,
 * and how to ask the group for a change.
 *
 * This module is internal. `index.ts` re-exports `Collapse` and `Collapses`
 * whole, so the context lives here, where neither re-export reaches it.
 */
export interface CollapsesItemContextValue {
  /** Whether the group has this item open. */
  open: boolean;
  /** Asks the group to open (`true`) or close (`false`) this item. */
  setOpen: (open: boolean) => void;
}

/**
 * `null` outside a group. A `Collapse` also resets it to `null` for its own
 * subtree, so a Collapse nested in an item's content keeps its own state
 * instead of answering to its ancestor's slot in the group.
 */
export const CollapsesItemContext =
  createContext<CollapsesItemContextValue | null>(null);
