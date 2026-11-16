// INTERNAL: deliberately not exported from src/index.ts.
import React, { useCallback, useRef, useState } from 'react';
import { useClientLayoutEffect } from './useClientLayoutEffect';
import { useLatestRef } from './useLatestRef';

/** Which way the element scrolls: the axis it measures for overflow. */
export type ScrollRegionOrientation = 'vertical' | 'horizontal' | 'both';

/** An edge of the content: the block's top and bottom, the line's start and end. */
export type ScrollRegionEdge = 'top' | 'bottom' | 'start' | 'end';

const EDGES: readonly ScrollRegionEdge[] = ['top', 'bottom', 'start', 'end'];

// Layout can land a fraction of a pixel short of an edge, so anything closer
// than this counts as there.
const SLACK = 1;

/** What a measurement of the element that scrolls found. */
export interface ScrollMeasure {
  /** Overflows on an axis it scrolls. */
  overflowing: boolean;
  /** Each edge that has more content past it. */
  edges: Record<ScrollRegionEdge, boolean>;
  /** The vertical scrollbar's width, and the horizontal one's height. */
  barInline: number;
  barBlock: number;
}

const sameMeasure = (a: ScrollMeasure | null, b: ScrollMeasure): boolean =>
  !!a &&
  a.overflowing === b.overflowing &&
  a.barInline === b.barInline &&
  a.barBlock === b.barBlock &&
  EDGES.every(edge => a.edges[edge] === b.edges[edge]);

/**
 * Hands a node to the hook's own ref and to the caller's, and passes on what
 * a callback ref of the caller's returns.
 */
function setRefs<T>(
  node: T | null,
  own: React.MutableRefObject<T | null>,
  theirs: React.ForwardedRef<T> | undefined
) {
  own.current = node;
  if (typeof theirs === 'function') return theirs(node);
  if (theirs) theirs.current = node;
}

export interface UseScrollRegionOptions<T extends HTMLElement> {
  /** The axes the element scrolls, which are the ones it measures. */
  orientation: ScrollRegionOrientation;
  /** A ref of the caller's own, such as a forwarded one, set to the element too. */
  ref?: React.ForwardedRef<T> | undefined;
  /** Called with the edge when scrolling reaches it, once each time it arrives. */
  onEdgeReach?: ((edge: ScrollRegionEdge) => void) | undefined;
  /** Called before the hook's own scroll handler. */
  onScroll?: React.UIEventHandler<T> | undefined;
  /** Called before the hook's own focus handler. */
  onFocus?: React.FocusEventHandler<T> | undefined;
  /** Called before the hook's own blur handler. */
  onBlur?: React.FocusEventHandler<T> | undefined;
}

export interface ScrollRegion<T extends HTMLElement> {
  /** The ref to put on the element that scrolls. */
  ref: (node: T | null) => void;
  /** The latest measurement, `null` until the client has measured. */
  measured: ScrollMeasure | null;
  /**
   * Whether the element is a region you can tab to: while it overflows, and
   * while it holds focus after it stops, so focus isn't dropped to the page.
   */
  isRegion: boolean;
  /** Handlers to put on the element, which call the caller's own first. */
  onScroll: React.UIEventHandler<T>;
  onFocus: React.FocusEventHandler<T>;
  onBlur: React.FocusEventHandler<T>;
}

/**
 * Measures an element that scrolls, on the client, and says whether it's a
 * region you can tab to. `ScrollArea`'s viewport and a responsive `Table`'s
 * container share it.
 *
 * It measures before paint, and again whenever the element or anything in it
 * changes size, the children change, or the element scrolls. Nothing is known
 * until the client measures, so the server renders a plain scroller and
 * hydrates as one. The caller renders the role, the name and `tabIndex={0}`
 * while `isRegion` is true.
 *
 * @function useScrollRegion
 * @param options - The axes it scrolls, a ref and handlers of the caller's own.
 * @returns The ref and handlers to put on the element, and what it found.
 */
export function useScrollRegion<T extends HTMLElement>({
  orientation,
  ref,
  onEdgeReach,
  onScroll,
  onFocus,
  onBlur,
}: UseScrollRegionOptions<T>): ScrollRegion<T> {
  const elementRef = useRef<T | null>(null);
  const setRef = useCallback(
    (node: T | null) => setRefs(node, elementRef, ref),
    [ref]
  );

  const [measured, setMeasured] = useState<ScrollMeasure | null>(null);
  const [focused, setFocused] = useState(false);
  // The last measurement, read by the scroll handler to see which edges
  // it just reached, and the direction and bar sizes, which only change
  // with layout, so a scroll doesn't read computed styles.
  const lastRef = useRef<ScrollMeasure | null>(null);
  const layoutRef = useRef({ rtl: false, barInline: 0, barBlock: 0 });
  const onEdgeReachRef = useLatestRef(onEdgeReach);

  const measure = useCallback(
    (fromScroll: boolean) => {
      const el = elementRef.current;
      /* istanbul ignore next: measuring only runs while it's mounted */
      if (!el) return;
      const scrollsY = orientation !== 'horizontal';
      const scrollsX = orientation !== 'vertical';
      const maxTop = el.scrollHeight - el.clientHeight;
      const maxLeft = el.scrollWidth - el.clientWidth;
      const overflowY = scrollsY && maxTop > SLACK;
      const overflowX = scrollsX && maxLeft > SLACK;
      // Right to left, scrollLeft runs from 0 at the start to negative.
      const fromStart = layoutRef.current.rtl ? -el.scrollLeft : el.scrollLeft;
      const next: ScrollMeasure = {
        overflowing: overflowY || overflowX,
        edges: {
          top: overflowY && el.scrollTop > SLACK,
          bottom: overflowY && maxTop - el.scrollTop > SLACK,
          start: overflowX && fromStart > SLACK,
          end: overflowX && maxLeft - fromStart > SLACK,
        },
        barInline: layoutRef.current.barInline,
        barBlock: layoutRef.current.barBlock,
      };
      const last = lastRef.current;
      lastRef.current = next;
      if (fromScroll && last) {
        for (const edge of EDGES) {
          if (last.edges[edge] && !next.edges[edge]) {
            onEdgeReachRef.current?.(edge);
          }
        }
      }
      setMeasured(prev => (sameMeasure(prev, next) ? prev : next));
    },
    [orientation, onEdgeReachRef]
  );

  // Layout: the direction and the bars' sizes, then the overflow. It runs
  // before paint, and again whenever the element or anything in it changes
  // size, or the children change.
  useClientLayoutEffect(() => {
    const el = elementRef.current;
    /* istanbul ignore next: the effect only runs once it's mounted */
    if (!el) return;
    const relayout = () => {
      const cs = getComputedStyle(el);
      const px = (value: string) => parseFloat(value) || 0;
      layoutRef.current = {
        rtl: cs.direction === 'rtl',
        barInline: Math.max(
          0,
          el.offsetWidth -
            el.clientWidth -
            px(cs.borderLeftWidth) -
            px(cs.borderRightWidth)
        ),
        barBlock: Math.max(
          0,
          el.offsetHeight -
            el.clientHeight -
            px(cs.borderTopWidth) -
            px(cs.borderBottomWidth)
        ),
      };
      measure(false);
    };
    relayout();
    if (typeof ResizeObserver === 'undefined') return;
    const resizes = new ResizeObserver(relayout);
    const observeAll = () => {
      resizes.disconnect();
      resizes.observe(el);
      for (const child of Array.from(el.children)) resizes.observe(child);
    };
    observeAll();
    // Content that changes can overflow before any size is reported: a
    // child added or taken away, or text React rewrites in place, which
    // resizes no element when the element's height is fixed, and inline
    // children, which a ResizeObserver doesn't report at all.
    const mutations =
      typeof MutationObserver === 'undefined'
        ? null
        : new MutationObserver(records => {
            if (
              records.some(
                record => record.target === el && record.type === 'childList'
              )
            ) {
              observeAll();
            }
            relayout();
          });
    mutations?.observe(el, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    return () => {
      resizes.disconnect();
      mutations?.disconnect();
    };
  }, [measure]);

  const handleScroll = (event: React.UIEvent<T>) => {
    onScroll?.(event);
    measure(true);
  };
  const handleFocus = (event: React.FocusEvent<T>) => {
    onFocus?.(event);
    if (event.target === event.currentTarget) setFocused(true);
  };
  const handleBlur = (event: React.FocusEvent<T>) => {
    onBlur?.(event);
    if (event.target === event.currentTarget) setFocused(false);
  };

  return {
    ref: setRef,
    measured,
    // A tab stop while it overflows. Taking tabIndex off the focused element
    // would drop focus to the page, so one that stops overflowing keeps it
    // until focus leaves.
    isRegion: !!measured?.overflowing || focused,
    onScroll: handleScroll,
    onFocus: handleFocus,
    onBlur: handleBlur,
  };
}
