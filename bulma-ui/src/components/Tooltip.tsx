import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto';
export type TooltipColor =
  | 'primary'
  | 'link'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'dark'
  | 'light';
export type TooltipSize = 'small' | 'medium' | 'large';

/**
 * Props for the Tooltip component.
 *
 * @property {string} label - The tooltip text content.
 * @property {TooltipPosition} [position] - Position of the tooltip. Default: 'top'.
 * @property {TooltipColor} [color] - Color variant for the tooltip.
 * @property {TooltipSize} [size] - Size variant for the tooltip ('small', 'medium', 'large').
 * @property {boolean} [active] - Force tooltip to be always visible.
 * @property {boolean} [multiline] - Allow tooltip to wrap to multiple lines.
 * @property {boolean} [animated] - Enable fade animation. Default: true.
 * @property {boolean} [square] - Use square corners instead of rounded.
 * @property {boolean} [dashed] - Show dashed underline on trigger.
 * @property {number} [delay] - Delay before showing tooltip (ms).
 * @property {React.ReactNode} [children] - The element that triggers the tooltip.
 * @property {string} [className] - Additional CSS classes.
 * @property {string} [tooltipClassName] - Additional classes for the tooltip element.
 */
export interface TooltipProps
  extends
    Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  label: string;
  position?: TooltipPosition;
  color?: TooltipColor;
  size?: TooltipSize;
  active?: boolean;
  multiline?: boolean;
  animated?: boolean;
  square?: boolean;
  dashed?: boolean;
  delay?: number;
  tooltipClassName?: string;
}

/**
 * Tooltip component for displaying helpful information on hover.
 *
 * Shows a small popup with text when the user hovers over or focuses
 * on the wrapped element. Supports multiple positions and color variants.
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
  position = 'top',
  color,
  size,
  active: alwaysActive,
  multiline = false,
  animated = true,
  square = false,
  dashed = false,
  delay = 0,
  children,
  className,
  tooltipClassName,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [resolvedPosition, setResolvedPosition] = useState<Exclude<TooltipPosition, 'auto'>>(
    position === 'auto' ? 'top' : position
  );
  const [contentStyle, setContentStyle] = useState<React.CSSProperties>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLSpanElement | null>(null);
  const contentRef = useRef<HTMLSpanElement | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle delayed visibility
  useEffect(() => {
    if (isHovering) {
      if (delay > 0) {
        timeoutRef.current = setTimeout(() => {
          setIsVisible(true);
        }, delay);
      } else {
        setIsVisible(true);
      }
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsVisible(false);
    }
  }, [isHovering, delay]);

  // Auto-placement and overflow correction
  useLayoutEffect(() => {
    const isAuto = position === 'auto';

    if (!isAuto) {
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
      const isVertical = effectivePos === 'top' || effectivePos === 'bottom' ||
        resolvedPosition === 'top' || resolvedPosition === 'bottom';

      if (isVertical) {
        if (contentRect.left < edgePadding) {
          // Overflows left — shift right
          const shift = edgePadding - contentRect.left;
          style.left = `calc(50% + ${shift}px)`;
        } else if (contentRect.right > window.innerWidth - edgePadding) {
          // Overflows right — shift left
          const shift = contentRect.right - (window.innerWidth - edgePadding);
          style.left = `calc(50% - ${shift}px)`;
        }
      } else {
        // For left/right positions, tooltip is centered vertically via CSS
        // (top: 50%; transform: translateY(-50%)).
        if (contentRect.top < edgePadding) {
          const shift = edgePadding - contentRect.top;
          style.top = `calc(50% + ${shift}px)`;
        } else if (contentRect.bottom > window.innerHeight - edgePadding) {
          const shift = contentRect.bottom - (window.innerHeight - edgePadding);
          style.top = `calc(50% - ${shift}px)`;
        }
      }

      setContentStyle(style);
    });
  }, [position, resolvedPosition, isVisible, alwaysActive, label]);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  const handleFocus = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsHovering(false);
  }, []);

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
    <span
      ref={wrapperRef}
      className={combinedClasses}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      data-tooltip={label}
      {...rest}
    >
      {children}
      <span
        ref={contentRef}
        className={combinedTooltipClasses}
        role="tooltip"
        aria-hidden={!isVisible && !alwaysActive}
        style={Object.keys(contentStyle).length > 0 ? contentStyle : undefined}
      >
        {label}
      </span>
    </span>
  );
};

export default Tooltip;
