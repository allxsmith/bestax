import { createContext } from 'react';
import type { AffixPosition } from './Affix';
import type { TooltipPosition } from './Tooltip';

/**
 * What `FloatButtons` and `FloatButton.SpeedDial` hand the float buttons
 * inside them, which they place, so those take no corner of their own.
 *
 * This module is internal. `index.ts` re-exports `FloatButton` and
 * `FloatButtons` whole, so the context lives here, where neither re-export
 * reaches it.
 */
export interface FloatButtonPlacement {
  /** The corner the buttons sit in. */
  position: AffixPosition;
  /** The side each button's tooltip opens on. */
  tooltipPosition: TooltipPosition;
  /** Inside a speed dial's menu, where each button is one of its items. */
  inMenu: boolean;
  /**
   * The `showLabels` of the FloatButtons or speed dial around the buttons:
   * each prints its name, unless its own `showLabel` says otherwise.
   */
  showLabels: boolean;
}

/** `null` outside `FloatButtons` and a speed dial's menu. */
export const FloatButtonContext = createContext<FloatButtonPlacement | null>(
  null
);

/**
 * The side a float button's tooltip opens on: away from its corner's edge
 * when the buttons around it run up or down, and away from the top or bottom
 * edge when they run sideways, so it never covers the next button.
 */
export function tooltipSide(
  position: AffixPosition,
  sideways = false
): TooltipPosition {
  if (sideways) return position.startsWith('top') ? 'bottom' : 'top';
  return position.endsWith('right') ? 'left' : 'right';
}
