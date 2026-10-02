// INTERNAL: deliberately not exported from src/index.ts.
import { useEffect, useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { PickerPosition } from '../form/_pickerInternals/pickerTypes';

/** A corner of the anchor the panel opens from, once `auto` is resolved. */
export type AnchoredCorner = Exclude<PickerPosition, 'auto'>;

/**
 * Where the panel goes: the corner it opens from and, when it is fixed to
 * the viewport, its coordinates there.
 */
export interface AnchoredPosition {
  position: AnchoredCorner;
  top?: number;
  left?: number;
}

/**
 * Options for `useAnchoredPosition`.
 */
export interface UseAnchoredPositionOptions {
  /** Whether the panel is on the page. Nothing is measured while it is not. */
  active: boolean;
  /** The corner asked for, or `auto` to pick one that keeps the panel in the viewport. */
  position: PickerPosition;
  /**
   * Whether the panel is fixed to the viewport (it was portaled away from the
   * anchor), which needs coordinates. Otherwise the panel's CSS places it
   * against the anchor from the corner alone.
   */
  fixed: boolean;
  /**
   * The gap between the anchor and the panel, in pixels. Applied to the fixed
   * coordinates and to the room `auto` asks for below the anchor.
   * @defaultValue 4
   */
  offset?: number;
}

// A server render runs neither, and React 18 warns about a layout effect
// there, so the server is handed the plain one.
const useClientLayoutEffect =
  typeof document === 'undefined' ? useEffect : useLayoutEffect;

/**
 * The corner that keeps a panel of this size in the viewport, preferring
 * below the anchor and lined up with its left edge.
 */
function resolveAuto(
  rect: DOMRect,
  panelWidth: number,
  panelHeight: number,
  offset: number
): AnchoredCorner {
  const fitsBelow = rect.bottom + panelHeight + offset <= window.innerHeight;
  const fitsRight = rect.left + panelWidth <= window.innerWidth;
  if (fitsBelow) return fitsRight ? 'bottom-left' : 'bottom-right';
  return fitsRight ? 'top-left' : 'top-right';
}

/**
 * Places a floating panel against its anchor: resolves `auto` to a corner
 * and, for a panel fixed to the viewport, works out its coordinates. It
 * measures again on window resize and on any scroll, so a fixed panel
 * follows its anchor.
 *
 * Measuring happens in a layout effect, so the panel is placed before it
 * paints. It needs both elements on the page while `active` is on, and
 * keeps the last placement when either is missing.
 *
 * @function useAnchoredPosition
 * @param anchorRef - The element the panel opens from.
 * @param panelRef - The floating panel.
 * @param options - Whether to measure, the corner asked for, and how the panel is placed.
 * @returns The corner the panel opens from, with coordinates when it is fixed.
 */
export function useAnchoredPosition(
  anchorRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  { active, position, fixed, offset = 4 }: UseAnchoredPositionOptions
): AnchoredPosition {
  const [resolved, setResolved] = useState<AnchoredPosition>({
    position: position === 'auto' ? 'bottom-left' : position,
  });

  useClientLayoutEffect(() => {
    if (!active) return undefined;
    const update = () => {
      const anchor = anchorRef.current;
      const panel = panelRef.current;
      if (!anchor || !panel) return;
      const rect = anchor.getBoundingClientRect();
      const { width, height } = panel.getBoundingClientRect();
      const corner =
        position === 'auto'
          ? resolveAuto(rect, width, height, offset)
          : position;
      if (!fixed) {
        setResolved({ position: corner });
        return;
      }
      setResolved({
        position: corner,
        top: corner.startsWith('bottom')
          ? rect.bottom + offset
          : rect.top - height - offset,
        left: corner.endsWith('left') ? rect.left : rect.right - width,
      });
    };
    update();
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('scroll', update, { passive: true, capture: true });
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, { capture: true });
    };
  }, [active, anchorRef, panelRef, position, fixed, offset]);

  return resolved;
}
