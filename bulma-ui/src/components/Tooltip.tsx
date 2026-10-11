import React, { useState, useRef, useLayoutEffect } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { chain, useHoverOpen } from '../helpers/useHoverOpen';

/** Screen positions for the tooltip. */
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto';
/** Color variants for the tooltip. */
export type TooltipColor =
  | 'primary'
  | 'link'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'dark'
  | 'light';
/** Size variants for the tooltip. */
export type TooltipSize = 'small' | 'medium' | 'large';

/**
 * Props for the Tooltip component.
 * @extraProp {React.ReactNode} [children] - The element that triggers the tooltip.
 * @extraProp {string} [className] - Additional CSS classes.
 */
export interface TooltipProps
  extends
    Omit<React.HTMLAttributes<HTMLSpanElement>, 'color' | 'content'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** The tooltip text content. */
  label?: string;
  /** Rich tooltip content (alternative to `label`). */
  content?: React.ReactNode;
  /** Position of the tooltip. Default: 'top'. */
  position?: TooltipPosition;
  /** Color variant for the tooltip. */
  color?: TooltipColor;
  /** Size of the tooltip. */
  size?: TooltipSize;
  /**
   * Force tooltip to be always visible. Hover, focus and Escape leave it
   * shown, so Escape goes on to whatever has focus, or to a `Modal` or
   * `Popover` around it.
   */
  active?: boolean;
  /** Allow tooltip to wrap to multiple lines. */
  multiline?: boolean;
  /** Enable fade animation. Default: true. */
  animated?: boolean;
  /** Use square corners instead of rounded. */
  square?: boolean;
  /** Show dashed underline on trigger. */
  dashed?: boolean;
  /**
   * How long the pointer or keyboard focus waits on the trigger before the
   * tooltip shows, in milliseconds.
   */
  delay?: number;
  /**
   * How long the tooltip stays after the pointer and focus have left the
   * trigger and the tooltip, in milliseconds. The pointer can move from the
   * trigger onto a shown tooltip without one.
   */
  closeDelay?: number;
  /** Additional classes for the tooltip element. */
  tooltipClassName?: string;
}

/**
 * The `Tooltip` component displays helpful information when users hover over or focus on an element.
 *
 * Hovering the trigger or giving it keyboard focus shows it. Touch doesn't,
 * and neither does focus a click or a tap brings, so tapping the trigger just
 * does what the trigger does. The pointer can move onto a shown tooltip.
 * Escape hides it wherever focus is, without moving the pointer or focus,
 * and it stays hidden until one of them leaves the trigger and comes back.
 * The keypress stops there when focus is on the trigger or nowhere, and
 * otherwise goes on to whatever has focus.
 *
 * @function
 * @param {TooltipProps} props - Props for the Tooltip component.
 * @returns {JSX.Element} The rendered tooltip wrapper.
 *
 * @example
 * // Basic tooltip
 * <Tooltip label="This is helpful info">
 *   <button>Hover me</button>
 * </Tooltip>
 *
 * @example
 * // Positioned tooltip with color
 * <Tooltip label="Delete item" position="right" color="danger">
 *   <Icon icon="fas fa-trash" />
 * </Tooltip>
 *
 * @example
 * // Multiline tooltip
 * <Tooltip label="This is a longer tooltip that wraps to multiple lines" multiline>
 *   <span>?</span>
 * </Tooltip>
 */
export const Tooltip: React.FC<TooltipProps> = ({
  label,
  content,
  position = 'top',
  color,
  size,
  active: alwaysActive,
  multiline = false,
  animated = true,
  square = false,
  dashed = false,
  delay = 0,
  closeDelay = 0,
  children,
  className,
  tooltipClassName,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const { onPointerEnter, onPointerLeave, onFocus, onBlur, ...attrs } = rest;
  const [isVisible, setIsVisible] = useState(false);
  const [resolvedPosition, setResolvedPosition] = useState<
    Exclude<TooltipPosition, 'auto'>
  >(position === 'auto' ? 'top' : position);
  const [contentStyle, setContentStyle] = useState<React.CSSProperties>({});
  const wrapperRef = useRef<HTMLSpanElement | null>(null);
  const contentRef = useRef<HTMLSpanElement | null>(null);

  const hover = useHoverOpen({
    open: isVisible,
    // `active` shows it whatever the pointer and focus do, so the hook's asks
    // to open are turned down, and with nothing open Escape goes on its way.
    // An ask to close can come while it's already hidden, which is no change.
    onOpenChange: open => setIsVisible(open && !alwaysActive),
    openDelay: delay,
    closeDelay,
    // The wrapper stands in for the trigger. It holds only the children and
    // the tooltip, and nothing in the tooltip takes focus, so focus anywhere
    // in it is focus on the trigger, and Escape there is the tooltip's.
    triggerRef: wrapperRef,
    floatingRef: contentRef,
  });

  // Auto-placement and overflow correction
  useLayoutEffect(() => {
    const isAuto = position === 'auto';

    if (!isAuto) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- layout measurement effect resolves placement
      setResolvedPosition(position);
    }

    const showing = isVisible || alwaysActive;
    if (!showing) {
      setContentStyle({});
      return;
    }

    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    const wrapperRect = wrapper.getBoundingClientRect();
    const margin = 40;
    const edgePadding = 8; // minimum distance from viewport edge

    // Step 1: determine position (auto mode only)
    if (isAuto) {
      const spaceTop = wrapperRect.top;
      const spaceBottom = window.innerHeight - wrapperRect.bottom;

      if (spaceTop >= margin) {
        setResolvedPosition('top');
      } else if (spaceBottom >= margin) {
        setResolvedPosition('bottom');
      } else if (window.innerWidth - wrapperRect.right >= wrapperRect.left) {
        setResolvedPosition('right');
      } else {
        setResolvedPosition('left');
      }
    }

    // Step 2: measure tooltip content and correct overflow.
    // Use requestAnimationFrame so the resolved position class is applied first.
    requestAnimationFrame(() => {
      const contentEl = contentRef.current;
      if (!contentEl) return;

      const contentRect = contentEl.getBoundingClientRect();
      const style: React.CSSProperties = {};

      // For top/bottom positions, tooltip is centered horizontally via CSS
      // (left: 50%; transform: translateX(-50%)).
      // Check if it overflows left or right and apply a corrective shift.
      const pos = isAuto ? undefined : position; // read from state won't be updated yet in auto
      const effectivePos = pos || 'top'; // fallback, actual is set by state
      const isVertical =
        effectivePos === 'top' ||
        effectivePos === 'bottom' ||
        resolvedPosition === 'top' ||
        resolvedPosition === 'bottom';

      if (isVertical) {
        if (contentRect.left < edgePadding) {
          // Overflows left — shift right
          const shift = edgePadding - contentRect.left;
          style.left = `calc(50% + ${shift}px)`;
          (style as Record<string, string>)['--tooltip-arrow-offset'] =
            `${-shift}px`;
        } else if (contentRect.right > window.innerWidth - edgePadding) {
          // Overflows right — shift left
          const shift = contentRect.right - (window.innerWidth - edgePadding);
          style.left = `calc(50% - ${shift}px)`;
          (style as Record<string, string>)['--tooltip-arrow-offset'] =
            `${shift}px`;
        }
      } else {
        // For left/right positions, tooltip is centered vertically via CSS
        // (top: 50%; transform: translateY(-50%)).
        if (contentRect.top < edgePadding) {
          const shift = edgePadding - contentRect.top;
          style.top = `calc(50% + ${shift}px)`;
          (style as Record<string, string>)['--tooltip-arrow-offset'] =
            `${-shift}px`;
        } else if (contentRect.bottom > window.innerHeight - edgePadding) {
          const shift = contentRect.bottom - (window.innerHeight - edgePadding);
          style.top = `calc(50% - ${shift}px)`;
          (style as Record<string, string>)['--tooltip-arrow-offset'] =
            `${shift}px`;
        }
      }

      setContentStyle(style);
    });
  }, [position, resolvedPosition, isVisible, alwaysActive, label, content]);

  // Generate Bulma classes
  const tooltipClasses = usePrefixedClassNames('tooltip', {
    'is-active': alwaysActive || isVisible,
    [`is-${resolvedPosition}`]: resolvedPosition,
    [`is-${color}`]: color,
    [`is-${size}`]: size,
    'is-multiline': multiline,
    'is-animated': animated,
    'is-square': square,
    'is-dashed': dashed,
  });

  const combinedClasses = classNames(
    tooltipClasses,
    bulmaHelperClasses,
    className
  );
  const combinedTooltipClasses = usePrefixedClassNames(
    'tooltip-content',
    tooltipClassName
  );

  return (
    // The tooltip is inside the wrapper, so the pointer on it is still on the
    // wrapper, and the stylesheet bridges the gap between them.
    <span
      ref={wrapperRef}
      className={combinedClasses}
      onPointerEnter={chain(onPointerEnter, hover.onPointerEnter)}
      onPointerLeave={chain(onPointerLeave, hover.onPointerLeave)}
      onFocus={chain(onFocus, hover.onFocus)}
      onBlur={chain(onBlur, hover.onBlur)}
      {...(label ? { 'data-tooltip': label } : {})}
      {...attrs}
    >
      {children}
      <span
        ref={contentRef}
        className={combinedTooltipClasses}
        role="tooltip"
        aria-hidden={!isVisible && !alwaysActive}
        style={Object.keys(contentStyle).length > 0 ? contentStyle : undefined}
      >
        {content || label}
      </span>
    </span>
  );
};

export default Tooltip;
