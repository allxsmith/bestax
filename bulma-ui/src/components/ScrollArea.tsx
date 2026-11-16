import React, { forwardRef, useEffect } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import {
  useScrollRegion,
  SCROLL_REGION_EDGES,
  type ScrollRegionEdge,
  type ScrollRegionOrientation,
} from '../helpers/useScrollRegion';
import { warnOnce } from '../helpers/devWarnings';

/** Which way the content scrolls. */
export type ScrollAreaOrientation = ScrollRegionOrientation;

/** When the scrollbars show. */
export type ScrollAreaScrollbars = 'auto' | 'hover' | 'always';

/** An edge of the content: the block's top and bottom, the line's start and end. */
export type ScrollAreaEdge = ScrollRegionEdge;

/**
 * Props for the ScrollArea component.
 *
 * @helperProps The helper props go on the outer `<div>`, the `.scroll-area`
 * frame, with `className` and `style`. The `ref`, the name, `onScroll` and
 * the other attributes go on the `<div>` inside it, the viewport that
 * scrolls.
 *
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the viewport, the element that scrolls, for `scrollTo` and the like.
 * @extraProp {string} [aria-label] - Names the region, such as "Release notes". It needs a name, so pass this or `aria-labelledby`, and a development build warns when it has neither. The name is rendered with the region's role, while the content overflows, since ARIA doesn't allow naming a plain `div`.
 * @extraProp {string} [aria-labelledby] - The id of a visible heading that names the region, in place of `aria-label`.
 * @extraProp {React.UIEventHandler<HTMLDivElement>} [onScroll] - Called as the viewport scrolls.
 */
export interface ScrollAreaProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'role' | 'tabIndex'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes for the outer frame. */
  className?: string | undefined;
  /** Inline styles for the outer frame. */
  style?: React.CSSProperties | undefined;
  /** What scrolls. */
  children?: React.ReactNode;
  /**
   * The area's height. A number is pixels, and a string is any CSS length
   * (`"20rem"`, `"50vh"`, `"100%"`).
   */
  height?: number | string | undefined;
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

    // The name goes to the hook, which renders it with the role: ARIA
    // prohibits naming a plain div.
    const {
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      ...viewportRest
    } = rest;
    const { props: regionProps, measured } = useScrollRegion<HTMLDivElement>({
      orientation,
      ref,
      onEdgeReach,
      onScroll,
      onFocus,
      onBlur,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
    });
    const edgeAttributes: Record<string, string> = {};
    if (measured) {
      for (const edge of SCROLL_REGION_EDGES) {
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
          className={viewportClass}
          style={viewportStyle}
          {...viewportRest}
          {...edgeAttributes}
          {...regionProps}
        >
          {children}
        </div>
      </div>
    );
  }
);

ScrollArea.displayName = 'ScrollArea';

export default ScrollArea;
