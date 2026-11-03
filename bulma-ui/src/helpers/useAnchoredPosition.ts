// INTERNAL: deliberately not exported from src/index.ts.
import { useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { PickerPosition } from '../form/_pickerInternals/pickerTypes';
import { useClientLayoutEffect } from './useClientLayoutEffect';

/** A corner of the anchor the panel opens from, once `auto` is resolved. */
export type AnchoredCorner = Exclude<PickerPosition, 'auto'>;

/**
 * A side of the anchor the panel sits on, centered along it. Asked for,
 * `left` and `right` are the start and the end of the line, so they swap
 * under right-to-left text, the way Steps' `labelPosition` reads them.
 */
export type AnchoredSide = 'top' | 'bottom' | 'left' | 'right';

/**
 * Where the panel goes: the corner it opens from or the side it sits on and,
 * when it is fixed to the viewport, its coordinates there.
 */
export interface AnchoredPosition {
  /**
   * The corner, or the side the panel ended up on. A side is the one on the
   * screen, after the swap under right-to-left text and any flip, so a
   * stylesheet can put the gap on the side facing the anchor.
   */
  position: AnchoredCorner | AnchoredSide;
  top?: number;
  left?: number;
  /**
   * With `matchWidth`, the anchor's width, which a fixed panel takes as its
   * `min-width`.
   */
  minWidth?: number;
}

/**
 * Options for `useAnchoredPosition`.
 */
export interface UseAnchoredPositionOptions {
  /** Whether the panel is on the page. Nothing is measured while it is not. */
  active: boolean;
  /**
   * The corner asked for, `auto` to pick one that keeps the panel in the
   * viewport, or a side. A side centers the panel along that side of the
   * anchor, flips it to the opposite side when it doesn't fit there and does
   * on the other, and keeps a fixed panel inside the viewport. `left` and
   * `right` are read against the anchor's writing direction.
   */
  position: PickerPosition | AnchoredSide;
  /**
   * Whether the panel is fixed to the viewport (it was portaled away from the
   * anchor), which needs coordinates. Otherwise the panel's CSS places it
   * against the anchor from the corner alone.
   */
  fixed: boolean;
  /**
   * The gap between the anchor and the panel, in pixels, that the hook puts
   * there itself: added to the fixed coordinates and to the room `auto` asks
   * for below the anchor. Popover and the pickers' popover pass `0` and take
   * their gap from a margin in their stylesheet, read through `styledGap`, so
   * a theme's offset moves the panel and `auto` alike. A new panel should do
   * the same rather than rely on this default, which no stylesheet sees.
   * @defaultValue 4
   */
  offset?: number;
  /**
   * Reads the gap the panel's own stylesheet puts between it and the anchor,
   * in pixels, each time the panel is measured. `auto` leaves room for it as
   * well; the coordinates don't include it, because the stylesheet applies it.
   */
  styledGap?: (panel: HTMLElement) => number;
  /**
   * Whether the panel is at least as wide as the anchor, as a list under its
   * field is. A panel in place gets that from its stylesheet. A fixed one
   * can't, so its placement carries the anchor's width as `minWidth` for the
   * panel to set, and its coordinates and `auto` already allow for it.
   * @defaultValue false
   */
  matchWidth?: boolean;
  /**
   * Measures again after each render of the component holding the hook, for
   * a panel whose content changes while it's open, as a filtered list's
   * does. A fixed panel above its anchor is placed from its height, and
   * `auto` reads the height too, so a measurement taken when it opened goes
   * stale as the content changes.
   * @defaultValue false
   */
  followContent?: boolean;
}

/**
 * A `styledGap` for a panel whose stylesheet puts the gap in a margin on the
 * side facing the anchor, negative on a portaled panel above it or to its
 * left, so the largest magnitude is the gap. In pixels.
 */
export function marginGap(panel: HTMLElement): number {
  const { marginTop, marginBottom, marginLeft, marginRight } =
    getComputedStyle(panel);
  return Math.max(
    ...[marginTop, marginBottom, marginLeft, marginRight].map(
      margin => Math.abs(parseFloat(margin)) || 0
    )
  );
}

const oppositeSide: Record<AnchoredSide, AnchoredSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

const isSide = (position: string): position is AnchoredSide =>
  position in oppositeSide;

/** `value` moved into `[0, max]`, or `0` when `max` is below it. */
const clampTo = (value: number, max: number): number =>
  Math.max(0, Math.min(value, max));

/**
 * Places a panel on a side of the anchor. The side asked for is turned into
 * the one on the screen, then flipped when the panel doesn't fit there and
 * does on the other. A fixed panel is centered along the side and moved into
 * the viewport, with `styledGap` counted as the margin its stylesheet puts on
 * the side facing the anchor, which the coordinates leave out. The viewport
 * is the root element's client area, which a fixed box resolves against, so
 * a classic scrollbar doesn't hide the panel's edge.
 */
function placeOnSide(
  asked: AnchoredSide,
  anchor: HTMLElement,
  rect: DOMRect,
  size: { width: number; height: number },
  fixed: boolean,
  offset: number,
  styled: number
): AnchoredPosition {
  const rtl = getComputedStyle(anchor).direction === 'rtl';
  const onScreen =
    rtl && (asked === 'left' || asked === 'right')
      ? oppositeSide[asked]
      : asked;
  const { clientWidth, clientHeight } = anchor.ownerDocument.documentElement;
  const { width, height } = size;
  const gap = offset + styled;
  const room: Record<AnchoredSide, number> = {
    top: rect.top - gap - height,
    bottom: clientHeight - rect.bottom - gap - height,
    left: rect.left - gap - width,
    right: clientWidth - rect.right - gap - width,
  };
  const side =
    room[onScreen] < 0 && room[oppositeSide[onScreen]] >= 0
      ? oppositeSide[onScreen]
      : onScreen;
  if (!fixed) return { position: side };

  // Where the panel's box lands once the stylesheet's margin moves it,
  // kept in the viewport, then given back as coordinates without that margin.
  const vertical = side === 'top' || side === 'bottom';
  const top = vertical
    ? side === 'bottom'
      ? rect.bottom + gap
      : rect.top - gap - height
    : rect.top + (rect.height - height) / 2;
  const left = vertical
    ? rect.left + (rect.width - width) / 2
    : side === 'right'
      ? rect.right + gap
      : rect.left - gap - width;
  const shift = side === 'bottom' || side === 'right' ? styled : -styled;
  return {
    position: side,
    top: clampTo(top, clientHeight - height) - (vertical ? shift : 0),
    left: clampTo(left, clientWidth - width) - (vertical ? 0 : shift),
  };
}

/**
 * The corner that keeps a panel of this size in the viewport, preferring
 * below the anchor and lined up with its left edge.
 */
function resolveAuto(
  view: Window,
  rect: DOMRect,
  panelWidth: number,
  panelHeight: number,
  gap: number
): AnchoredCorner {
  const fitsBelow = rect.bottom + panelHeight + gap <= view.innerHeight;
  const fitsRight = rect.left + panelWidth <= view.innerWidth;
  if (fitsBelow) return fitsRight ? 'bottom-left' : 'bottom-right';
  return fitsRight ? 'top-left' : 'top-right';
}

const samePosition = (a: AnchoredPosition, b: AnchoredPosition): boolean =>
  a.position === b.position &&
  a.top === b.top &&
  a.left === b.left &&
  a.minWidth === b.minWidth;

/**
 * Places a floating panel against its anchor: resolves `auto` to a corner,
 * or a side to the one that fits, and, for a panel fixed to the viewport,
 * works out its coordinates. It
 * measures again on resize and on any scroll of the anchor's window (an
 * iframe's, when the anchor renders into one), so a fixed panel follows its
 * anchor, and with `followContent` after each render too. A measurement that
 * changes nothing doesn't render again.
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
  {
    active,
    position,
    fixed,
    offset = 4,
    styledGap,
    matchWidth = false,
    followContent = false,
  }: UseAnchoredPositionOptions
): AnchoredPosition {
  const [resolved, setResolved] = useState<AnchoredPosition>({
    position: position === 'auto' ? 'bottom-left' : position,
  });
  // The measurement while the panel is active, for `followContent` to run
  // again after a render.
  const updateRef = useRef<(() => void) | null>(null);

  useClientLayoutEffect(() => {
    if (!active) return undefined;
    const view =
      (anchorRef.current ?? panelRef.current)?.ownerDocument.defaultView ??
      window;
    const update = () => {
      const anchor = anchorRef.current;
      const panel = panelRef.current;
      if (!anchor || !panel) return;
      const rect = anchor.getBoundingClientRect();
      const measured = panel.getBoundingClientRect();
      // The width the panel has once it's at least as wide as the anchor.
      const width = matchWidth
        ? Math.max(measured.width, rect.width)
        : measured.width;
      const { height } = measured;
      if (isSide(position)) {
        const next = placeOnSide(
          position,
          anchor,
          rect,
          { width, height },
          fixed,
          offset,
          styledGap?.(panel) ?? 0
        );
        setResolved(prev => (samePosition(prev, next) ? prev : next));
        return;
      }
      const corner =
        position === 'auto'
          ? resolveAuto(
              view,
              rect,
              width,
              height,
              offset + (styledGap?.(panel) ?? 0)
            )
          : position;
      const next: AnchoredPosition = fixed
        ? {
            position: corner,
            top: corner.startsWith('bottom')
              ? rect.bottom + offset
              : rect.top - height - offset,
            left: corner.endsWith('left') ? rect.left : rect.right - width,
            ...(matchWidth ? { minWidth: rect.width } : {}),
          }
        : { position: corner };
      setResolved(prev => (samePosition(prev, next) ? prev : next));
    };
    updateRef.current = update;
    update();
    view.addEventListener('resize', update, { passive: true });
    view.addEventListener('scroll', update, { passive: true, capture: true });
    return () => {
      updateRef.current = null;
      view.removeEventListener('resize', update);
      view.removeEventListener('scroll', update, { capture: true });
    };
  }, [
    active,
    anchorRef,
    panelRef,
    position,
    fixed,
    offset,
    styledGap,
    matchWidth,
  ]);

  // After every render, on purpose: the panel's content is what changed.
  useClientLayoutEffect(() => {
    if (followContent) updateRef.current?.();
  });

  return resolved;
}
