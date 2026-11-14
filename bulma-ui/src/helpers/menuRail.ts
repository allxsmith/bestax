// INTERNAL: deliberately not exported from src/index.ts.
import { createContext } from 'react';
import type React from 'react';

/**
 * What a column that collapses to an icon rail, `AppFrame.Nav rail`, tells
 * the `Menu` inside it. The frame owns the tooltip, so a Menu used anywhere
 * else doesn't bring one in.
 */
export interface MenuRail {
  /**
   * Whether the column is collapsed to its icons now, from the breakpoint
   * up. A section's button then widens the column rather than toggling a
   * list the rail hides.
   */
  collapsed: boolean;
  /**
   * Whether the column is set to collapse but the frame hasn't read the width
   * yet, so it doesn't know whether that makes it a rail or leaves a drawer,
   * as on the server and in the render that hydrates. A section's button says
   * nothing about its state then.
   */
  pending: boolean;
  /** The nav, where focus goes when nothing in the menu can take it. */
  nav: () => HTMLElement | null;
  /** Widens the column again. */
  expand: () => void;
  /**
   * Wraps an item's link, or a section's button, in the tooltip that shows
   * its label while the column is collapsed. It's there whenever the column
   * has a rail, so collapsing never remounts a link that has focus.
   */
  wrap: (
    trigger: React.ReactElement,
    label: React.ReactNode
  ) => React.ReactElement;
}

/** The rail a Menu sits in, or `null` outside one. */
export const MenuRailContext = createContext<MenuRail | null>(null);
