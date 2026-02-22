import React, { forwardRef, useState, useCallback } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

export type RateSize = 'small' | 'medium' | 'large';

/**
 * Props for individual rate icons.
 */
export interface RateIconProps {
  /** The index of this icon (0-based) */
  index: number;
  /** Whether this icon is currently active (filled) */
  isActive: boolean;
  /** Whether this icon is currently hovered */
  isHovered: boolean;
  /** The current value */
  value: number;
}

/**
 * Props for the Rate component.
 *
 * @property {number} [value] - Controlled value (0 to max).
 * @property {number} [defaultValue] - Default value for uncontrolled usage.
 * @property {number} [max] - Maximum rating value. Default: 5.
 * @property {RateSize} [size] - Size variant.
 * @property {boolean} [disabled] - Whether the rating is disabled.
 * @property {boolean} [showScore] - Show the numeric score next to stars.
 * @property {boolean} [showText] - Show custom text based on value.
 * @property {string[]} [texts] - Array of text labels for each rating value.
 * @property {(value: number) => void} [onChange] - Callback when rating changes.
 * @property {(props: RateIconProps) => React.ReactNode} [customIcon] - Custom icon renderer.
 * @property {string} [spaced] - Add spacing between icons.
 * @property {boolean} [rtl] - Right-to-left direction.
 */
export interface RateProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'color'>,
    Omit<BulmaClassesProps, 'size'> {
  value?: number;
  defaultValue?: number;
  max?: number;
  size?: RateSize;
  disabled?: boolean;
  showScore?: boolean;
  showText?: boolean;
  texts?: string[];
  onChange?: (value: number) => void;
  customIcon?: (props: RateIconProps) => React.ReactNode;
  spaced?: boolean;
  rtl?: boolean;
}

/**
 * Default star icon component.
 */
const StarIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={filled ? 0 : 2}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
    />
  </svg>
);

/**
 * Rate component for star/icon-based ratings.
 *
 * Provides an interactive rating system with customizable icons,
 * sizes, and display options. Works in controlled or uncontrolled modes.
 *
 * @function
 * @param {RateProps} props - Props for the Rate component.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the container element.
 * @returns {JSX.Element} The rendered rating component.
 *
 * @example
 * // Basic 5-star rating
 * <Rate defaultValue={3} />
 *
 * @example
 * // With score display
 * <Rate defaultValue={4} showScore />
 *
 * @example
 * // With custom texts
 * <Rate
 *   defaultValue={3}
 *   showText
 *   texts={['Poor', 'Fair', 'Average', 'Good', 'Excellent']}
 * />
 *
 * @example
 * // Controlled with custom max
 * const [rating, setRating] = useState(0);
 * <Rate value={rating} onChange={setRating} max={10} />
 */
export const Rate = forwardRef<HTMLDivElement, RateProps>(
  (
    {
      value: controlledValue,
      defaultValue = 0,
      max = 5,
      size,
      disabled = false,
      showScore = false,
      showText = false,
      texts,
      onChange,
      customIcon,
      spaced = false,
      rtl = false,
      className,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const [internalValue, setInternalValue] = useState(defaultValue);
    const [hoverValue, setHoverValue] = useState<number | null>(null);

    // Determine if controlled
    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : internalValue;
    const displayValue = hoverValue !== null ? hoverValue : currentValue;

    // Update value
    const updateValue = useCallback(
      (newValue: number) => {
        if (disabled) return;

        // Allow clicking same value to deselect (set to 0)
        const finalValue = newValue === currentValue ? 0 : newValue;

        if (!isControlled) {
          setInternalValue(finalValue);
        }
        onChange?.(finalValue);
      },
      [isControlled, currentValue, disabled, onChange]
    );

    // Handle mouse enter on icon
    const handleMouseEnter = useCallback(
      (index: number) => {
        if (disabled) return;
        setHoverValue(index + 1);
      },
      [disabled]
    );

    // Handle mouse leave
    const handleMouseLeave = useCallback(() => {
      setHoverValue(null);
    }, []);

    // Handle keyboard
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (disabled) return;

        let newValue = currentValue;

        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          newValue = Math.min(currentValue + 1, max);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault();
          newValue = Math.max(currentValue - 1, 0);
        } else if (e.key === 'Home') {
          e.preventDefault();
          newValue = 0;
        } else if (e.key === 'End') {
          e.preventDefault();
          newValue = max;
        }

        if (newValue !== currentValue) {
          if (!isControlled) {
            setInternalValue(newValue);
          }
          onChange?.(newValue);
        }
      },
      [currentValue, max, disabled, isControlled, onChange]
    );

    // Get text for current value
    const getText = () => {
      if (!showText || !texts) return null;
      const index = Math.round(displayValue) - 1;
      return texts[index] || null;
    };

    // Generate classes
    const rateClasses = usePrefixedClassNames('rate', {
      [`is-${size}`]: size,
      'is-disabled': disabled,
      'is-spaced': spaced,
      'is-rtl': rtl,
    });

    const combinedClasses = classNames(
      rateClasses,
      bulmaHelperClasses,
      className
    );

    // Render icons
    const renderIcons = () => {
      const icons = [];

      for (let i = 0; i < max; i++) {
        const iconIndex = rtl ? max - 1 - i : i;
        const isActive = iconIndex < displayValue;
        const isHovered = hoverValue !== null && iconIndex < hoverValue;

        const iconProps: RateIconProps = {
          index: iconIndex,
          isActive,
          isHovered,
          value: displayValue,
        };

        const icon = customIcon ? (
          customIcon(iconProps)
        ) : (
          <StarIcon filled={isActive} />
        );

        icons.push(
          <span
            key={iconIndex}
            className={classNames('rate-item', {
              'is-active': isActive,
              'is-hovered': isHovered,
            })}
            onClick={() => updateValue(iconIndex + 1)}
            onMouseEnter={() => handleMouseEnter(iconIndex)}
            onMouseLeave={handleMouseLeave}
            role="radio"
            aria-checked={currentValue === iconIndex + 1}
            aria-label={`${iconIndex + 1} star${iconIndex === 0 ? '' : 's'}`}
            tabIndex={-1}
          >
            {icon}
          </span>
        );
      }

      return icons;
    };

    const text = getText();

    return (
      <div
        ref={ref}
        className={combinedClasses}
        role="radiogroup"
        aria-label="Rating"
        aria-valuenow={currentValue}
        aria-valuemin={0}
        aria-valuemax={max}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        {...rest}
      >
        <div className="rate-items">{renderIcons()}</div>
        {showScore && <span className="rate-score">{currentValue}</span>}
        {text && <span className="rate-text">{text}</span>}
      </div>
    );
  }
);

Rate.displayName = 'Rate';

export default Rate;
