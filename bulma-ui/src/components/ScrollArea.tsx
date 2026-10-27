import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { useClientLayoutEffect } from '../helpers/useClientLayoutEffect';
import { useLatestRef } from '../helpers/useLatestRef';
import { warnOnce } from '../helpers/devWarnings';

/** Which way the content scrolls. */
export type ScrollAreaOrientation = 'vertical' | 'horizontal' | 'both';

/** When the scrollbars show. */
export type ScrollAreaScrollbars = 'auto' | 'hover' | 'always';

/** An edge of the content: the block's top and bottom, the line's start and end. */
export type ScrollAreaEdge = 'top' | 'bottom' | 'start' | 'end';

const EDGES: readonly ScrollAreaEdge[] = ['top', 'bottom', 'start', 'end'];

// Layout can land a fraction of a pixel short of an edge, so anything closer
// than this counts as there.
const SLACK = 1;

/**
 * Props for the ScrollArea component.
 *
 * @helperProps The helper props go on the outer `<div>`, the `.scroll-area`
 * frame, with `className` and `style`. The `ref`, the name, `onScroll` and
 * the other attributes go on the `<div>` inside it, the viewport that
 * scrolls.
 *
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the viewport, the element that scrolls, for `scrollTo` and the like.
 * @extraProp {string} [aria-label] - Names the region, such as "Release notes". It needs a name, so pass this or `aria-labelledby`, and a development build warns when it has neither.
 * @extraProp {string} [aria-labelledby] - The id of a visible heading that names the region, in place of `aria-label`.
 * @extraProp {React.UIEventHandler<HTMLDivElement>} [onScroll] - Called as the viewport scrolls.
 */
export interface ScrollAreaProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'role' | 'tabIndex'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes for the outer frame. */
  className?: string;
  /** Inline styles for the outer frame. */
  style?: React.CSSProperties;
  /** What scrolls. */
  children?: React.ReactNode;
  /**
   * The area's height. A number is pixels, and a string is any CSS length
   * (`"20rem"`, `"50vh"`, `"100%"`).
   */
  height?: number | string;
  /**
   * The height it grows to with its content, then scrolls past. A number is
   * pixels. Use it in place of `height` for an area that's only as tall as
   * it needs to be.
   */
  maxHeight?: number | string;
  /**
   * Which way it scrolls. `vertical` and `horizontal` clip the other axis,
   * and `both` scrolls whichever overflows.
   */
  orientation?: ScrollAreaOrientation;
  /**
   * When the scrollbars show. `auto`: whenever the content overflows, the
   * way the system shows them. `hover`: colorless until the pointer is over
   * the area or focus is in it, which hides that the area scrolls until
   * then, so keep it for places where the layout makes that plain.
   * `always`: on every axis it scrolls, even when the content fits. Where the
   * system draws its bars over the content (macOS by default, phones and
   * tablets), they still show only while you scroll, and in forced colors
   * they always show.
   */
  showScrollbars?: ScrollAreaScrollbars;
  /**
   * Keeps room for the vertical scrollbar whether or not it shows, so the
   * content doesn't shift when it starts to overflow. It does nothing where
   * the system draws its bars over the content.
   */
  hasStableGutter?: boolean;
  /**
   * Fades the content out toward each edge that has more past it, without
   * fading the scrollbar. It's off in forced colors and when the user asks
   * for more contrast.
   */
  hasFade?: boolean;
  /**
   * Called with the edge when scrolling reaches it, once each time it
   * arrives, such as to load older messages at the top. It isn't called for
   * the edge the area starts at, or when the content changes size.
   */
  onEdgeReach?: (edge: ScrollAreaEdge) => void;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/** What a measurement of the viewport found. */
interface Measured {
  /** Overflows on an axis it scrolls. */
  overflowing: boolean;
  /** Each edge that has more content past it. */
  edges: Record<ScrollAreaEdge, boolean>;
  /** The vertical scrollbar's width, and the horizontal one's height. */
  barInline: number;
  barBlock: number;
}

const sameMeasure = (a: Measured | null, b: Measured): boolean =>
  !!a &&
  a.overflowing === b.overflowing &&
  a.barInline === b.barInline &&
  a.barBlock === b.barBlock &&
  EDGES.every(edge => a.edges[edge] === b.edges[edge]);

/**
 * The `ScrollArea` component renders a box whose content scrolls inside it, on the browser's own scrollbars in Bulma's colors.
 *
 * The bars are the system's, made thin and colored from Bulma's tokens, so
 * they follow dark mode and keep the system's own settings. While the
 * content overflows, the viewport is a region you can tab to and scroll by
 * keyboard, Safari included, named by `aria-label` or `aria-labelledby`.
 * While it fits, it's a plain box. Setting the bars' colors turns off any
 * `::-webkit-scrollbar` styles inside it.
 *
 * @function
 * @param {ScrollAreaProps} props - Props for the ScrollArea component.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the viewport.
 * @returns {JSX.Element} The rendered scroll area.
 *
 * @example
 * <ScrollArea height={240} aria-label="Release notes">
 *   <Content>…</Content>
 * </ScrollArea>
 *
 * @example
 * <ScrollArea maxHeight="20rem" aria-label="Messages" hasFade>
 *   …
 * </ScrollArea>
 */
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  (
    {
      className,
      style,
      textColor,
      bgColor,
      height,
      maxHeight,
      orientation = 'both',
      showScrollbars = 'auto',
      hasStableGutter,
      hasFade,
      onEdgeReach,
      onScroll,
      onFocus,
      onBlur,
      children,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor,
      backgroundColor: bgColor,
      ...props,
    });

    const frameClass = usePrefixedClassNames('scroll-area', {
      'is-vertical': orientation === 'vertical',
      'is-horizontal': orientation === 'horizontal',
      'has-hover-scrollbars': showScrollbars === 'hover',
      'has-visible-scrollbars': showScrollbars === 'always',
      'has-stable-gutter': !!hasStableGutter,
      'has-fade': !!hasFade,
    });
    const viewportClass = usePrefixedClassNames('scroll-area-viewport');

    const named = Boolean(rest['aria-label'] || rest['aria-labelledby']);
    useEffect(() => {
      if (!named) {
        warnOnce(
          'ScrollArea:unnamed',
          '[bestax-bulma] <ScrollArea> has no accessible name. Pass ' +
            'aria-label or aria-labelledby, so a screen reader can say what ' +
            'took focus when the area overflows.'
        );
      }
    }, [named]);

    const viewportRef = useRef<HTMLDivElement | null>(null);
    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        viewportRef.current = node;
        if (typeof ref === 'function') return ref(node);
        if (ref) ref.current = node;
      },
      [ref]
    );

    // Nothing is known about the overflow until the client measures it, so
    // the server renders a plain scroller and hydrates as one.
    const [measured, setMeasured] = useState<Measured | null>(null);
    const [focused, setFocused] = useState(false);
    // The last measurement, read by the scroll handler to see which edges
    // it just reached, and the direction and bar sizes, which only change
    // with layout, so a scroll doesn't read computed styles.
    const lastRef = useRef<Measured | null>(null);
    const layoutRef = useRef({ rtl: false, barInline: 0, barBlock: 0 });
    const onEdgeReachRef = useLatestRef(onEdgeReach);

    const measure = useCallback(
      (fromScroll: boolean) => {
        const el = viewportRef.current;
        /* istanbul ignore next: measuring only runs while it's mounted */
        if (!el) return;
        const scrollsY = orientation !== 'horizontal';
        const scrollsX = orientation !== 'vertical';
        const maxTop = el.scrollHeight - el.clientHeight;
        const maxLeft = el.scrollWidth - el.clientWidth;
        const overflowY = scrollsY && maxTop > SLACK;
        const overflowX = scrollsX && maxLeft > SLACK;
        // Right to left, scrollLeft runs from 0 at the start to negative.
        const fromStart = layoutRef.current.rtl
          ? -el.scrollLeft
          : el.scrollLeft;
        const next: Measured = {
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
    // before paint, and again whenever the viewport or anything in it
    // changes size, or the children change.
    useClientLayoutEffect(() => {
      const el = viewportRef.current;
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
      // A child added or taken away changes what's observed, and may change
      // the overflow before any size it has is reported.
      const mutations =
        typeof MutationObserver === 'undefined'
          ? null
          : new MutationObserver(() => {
              observeAll();
              relayout();
            });
      mutations?.observe(el, { childList: true });
      return () => {
        resizes.disconnect();
        mutations?.disconnect();
      };
    }, [measure]);

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
      onScroll?.(event);
      measure(true);
    };
    const handleFocus = (event: React.FocusEvent<HTMLDivElement>) => {
      onFocus?.(event);
      if (event.target === event.currentTarget) setFocused(true);
    };
    const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
      onBlur?.(event);
      if (event.target === event.currentTarget) setFocused(false);
    };

    // A tab stop while it overflows. Taking tabIndex off the focused element
    // would drop focus to the page, so a viewport that stops overflowing
    // keeps it until focus leaves.
    const isRegion = !!measured?.overflowing || focused;
    const edgeAttributes: Record<string, string> = {};
    if (measured) {
      for (const edge of EDGES) {
        if (measured.edges[edge]) edgeAttributes[`data-overflow-${edge}`] = '';
      }
    }
    const viewportStyle = measured
      ? ({
          '--scroll-area-bar-inline-size': `${measured.barInline}px`,
          '--scroll-area-bar-block-size': `${measured.barBlock}px`,
        } as React.CSSProperties)
      : undefined;

    return (
      <div
        className={classNames(frameClass, bulmaHelperClasses, className)}
        style={
          height !== undefined || maxHeight !== undefined
            ? {
                ...style,
                // Only what's given, so `maxHeight` alone keeps a height
                // the style sets.
                ...(height !== undefined && { height }),
                ...(maxHeight !== undefined && { maxHeight }),
              }
            : style
        }
      >
        <div
          ref={setRefs}
          className={viewportClass}
          style={viewportStyle}
          {...rest}
          {...edgeAttributes}
          role={isRegion ? 'region' : undefined}
          tabIndex={isRegion ? 0 : undefined}
          onScroll={handleScroll}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          {children}
        </div>
      </div>
    );
  }
);

ScrollArea.displayName = 'ScrollArea';

export default ScrollArea;
