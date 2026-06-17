import React, { forwardRef, useState, useCallback } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { Icon } from '../elements/Icon';
import { useIconLibrary } from '../helpers/Config';
import { useInsideField, useInsideControl } from './FormContext';
import { Field } from './Field';
import { Control } from './Control';
import { FormFieldProps } from './fieldProps';

/** Available size modifiers for the Rate component. */
export type RateSize = 'small' | 'medium' | 'large';
type IconLibrary = 'fa' | 'mdi' | 'ion' | 'material-icons' | 'material-symbols';
type BulmaColor =
  | 'primary'
  | 'link'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

/**
 * Props for individual rate icons.
 *
 * @property {number} index - The index of this icon (0-based).
 * @property {boolean} isActive - Whether this icon is currently active (filled).
 * @property {boolean} isHovered - Whether this icon is currently hovered.
 * @property {number} value - The current value.
 * @property {number} fillPercent - Fill percentage for partial icons (0-100). Used with precision < 1.
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
  /** Fill percentage for partial icons (0-100). Used with precision < 1. */
  fillPercent: number;
}

/**
 * Props for the Rate component.
 *
 * @property {number} [value] - Controlled rating value.
 * @property {number} [defaultValue] - Initial value for uncontrolled mode. Default: 0.
 * @property {number} [max] - Maximum number of icons. Default: 5.
 * @property {RateSize} [size] - Size modifier for the component.
 * @property {boolean} [disabled] - Whether the rating is disabled.
 * @property {boolean} [showScore] - Display the numeric score next to icons.
 * @property {boolean} [showText] - Display text label for the current value.
 * @property {string[]} [texts] - Text labels per rating level (used with showText).
 * @property {(value: number) => void} [onChange] - Callback when the rating changes.
 * @property {(props: RateIconProps) => React.ReactNode} [customIcon] - Custom icon render function.
 * @property {boolean} [spaced] - Add spacing between icons.
 * @property {boolean} [rtl] - Render icons in right-to-left order.
 * @property {string} [iconName] - Font icon name (e.g., 'star'). When set, renders Icon instead of default SVG.
 * @property {IconLibrary} [iconLibrary] - Icon library to use (defaults to ConfigProvider value or 'fa').
 * @property {string} [iconVariant] - Icon style variant (e.g., 'solid', 'outlined').
 * @property {string|string[]} [iconFeatures] - Additional icon modifiers.
 * @property {BulmaColor} [color] - Bulma color for active icons.
 * @property {number} [precision] - Granularity: 1 for whole stars, 0.5 for half, 0.25 for quarter. Default: 1.
 * @property {string} [customText] - Text displayed after score (e.g., "(128 reviews)").
 * @property {string} [name] - Form field name. When provided, a hidden input is rendered so the rating value is submitted with the surrounding form.
 * @property {string} [form] - The id of the form this hidden input belongs to (for use outside the form element).
 */
export interface RateProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'color'>,
    Omit<BulmaClassesProps, 'size'>,
    FormFieldProps {
  name?: string;
  form?: string;
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
  /** Font icon name (e.g., 'star'). When set, renders <Icon> instead of default SVG. */
  iconName?: string;
  /** Icon library to use (defaults to ConfigProvider value or 'fa'). */
  iconLibrary?: IconLibrary;
  /** Icon style variant (e.g., 'solid', 'outlined'). */
  iconVariant?: string;
  /** Additional icon modifiers. */
  iconFeatures?: string | string[];
  /** Bulma color for active icons. */
  color?: BulmaColor;
  /** Granularity: 1 for whole stars, 0.5 for half, 0.25 for quarter. */
  precision?: number;
  /** Text displayed after score (e.g., "(128 reviews)"). */
  customText?: string;
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

/** Snap a value to the nearest precision step. */
function snapToPrecision(val: number, precision: number): number {
  return Math.round(val / precision) * precision;
}

/** Get fill percentage for a given icon index based on current value. */
function getFillPercent(iconIndex: number, value: number): number {
  if (value >= iconIndex + 1) return 100;
  if (value <= iconIndex) return 0;
  return Math.round((value - iconIndex) * 100);
}

/**
 * Rate component for star/icon-based ratings.
 *
 * Provides an interactive rating system with customizable icons,
 * sizes, and display options. Works in controlled or uncontrolled modes.
 * Supports icon libraries, Bulma color variants, and fractional precision.
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
 * // With color and precision
 * <Rate defaultValue={3.5} color="warning" precision={0.5} showScore />
 *
 * @example
 * // With Font Awesome icons
 * <Rate iconName="star" iconLibrary="fa" iconVariant="solid" />
 */
export const Rate = forwardRef<HTMLDivElement, RateProps>(
  (
    {
      label,
      labelSize,
      labelProps,
      horizontal,
      message,
      messageColor,
      fieldClassName,
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
      iconName,
      iconLibrary: iconLibraryProp,
      iconVariant,
      iconFeatures,
      color,
      precision = 1,
      customText,
      name,
      form,
      className,
      ...props
    },
    ref
  ) => {
    const insideField = useInsideField();
    const insideControl = useInsideControl();
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const [internalValue, setInternalValue] = useState(defaultValue);
    const [hoverValue, setHoverValue] = useState<number | null>(null);

    const defaultIconLibrary = useIconLibrary();
    const resolvedLibrary = iconLibraryProp || defaultIconLibrary || 'fa';

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

    // Handle click with precision support
    const handleClick = useCallback(
      (iconIndex: number, e: React.MouseEvent<HTMLSpanElement>) => {
        if (disabled) return;

        if (precision < 1) {
          const rect = e.currentTarget.getBoundingClientRect();
          let relativeX = (e.clientX - rect.left) / rect.width;
          if (rtl) relativeX = 1 - relativeX;
          const rawValue = iconIndex + relativeX;
          const snapped = snapToPrecision(rawValue, precision);
          const clamped = Math.max(precision, Math.min(snapped, max));
          updateValue(clamped);
        } else {
          updateValue(iconIndex + 1);
        }
      },
      [disabled, precision, rtl, max, updateValue]
    );

    // Handle mouse enter on icon
    const handleMouseEnter = useCallback(
      (iconIndex: number) => {
        if (disabled) return;
        setHoverValue(iconIndex + 1);
      },
      [disabled]
    );

    // Handle mouse move with precision support
    const handleMouseMove = useCallback(
      (iconIndex: number, e: React.MouseEvent<HTMLSpanElement>) => {
        if (disabled || precision >= 1) return;
        const rect = e.currentTarget.getBoundingClientRect();
        let relativeX = (e.clientX - rect.left) / rect.width;
        if (rtl) relativeX = 1 - relativeX;
        const rawValue = iconIndex + relativeX;
        const snapped = snapToPrecision(rawValue, precision);
        const clamped = Math.max(precision, Math.min(snapped, max));
        setHoverValue(clamped);
      },
      [disabled, precision, rtl, max]
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
        const step = precision < 1 ? precision : 1;

        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          newValue = Math.min(currentValue + step, max);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault();
          newValue = Math.max(currentValue - step, 0);
        } else if (e.key === 'Home') {
          e.preventDefault();
          newValue = 0;
        } else if (e.key === 'End') {
          e.preventDefault();
          newValue = max;
        }

        // Round to avoid floating point issues
        newValue = Math.round(newValue * 1000) / 1000;

        if (newValue !== currentValue) {
          if (!isControlled) {
            setInternalValue(newValue);
          }
          onChange?.(newValue);
        }
      },
      [currentValue, max, precision, disabled, isControlled, onChange]
    );

    // Get text for current value
    const getText = () => {
      if (!showText || !texts) return null;
      const wholeIndex = Math.ceil(displayValue) - 1;
      const baseText = texts[wholeIndex] || null;
      if (!baseText) return null;
      // For fractional hover values with precision < 1, append "+"
      if (precision < 1 && hoverValue !== null && hoverValue % 1 !== 0) {
        return `${baseText}+`;
      }
      return baseText;
    };

    // Format score display
    const getScoreDisplay = () => {
      if (precision < 1 && currentValue % 1 !== 0) {
        return currentValue.toFixed(1);
      }
      return currentValue;
    };

    // Generate classes
    const rateClasses = usePrefixedClassNames('rate', {
      [`is-${size}`]: size,
      'is-disabled': disabled,
      'is-spaced': spaced,
      'is-rtl': rtl,
      [`is-${color}`]: color,
    });

    const combinedClasses = classNames(
      rateClasses,
      bulmaHelperClasses,
      className
    );

    // Render a single icon based on priority: customIcon > iconName > default SVG
    const renderIcon = (
      iconIndex: number,
      isActive: boolean,
      fillPercent: number
    ) => {
      const iconProps: RateIconProps = {
        index: iconIndex,
        isActive,
        isHovered: hoverValue !== null && iconIndex < hoverValue,
        value: displayValue,
        fillPercent,
      };

      if (customIcon) {
        return customIcon(iconProps);
      }

      if (iconName) {
        return (
          <Icon
            name={iconName}
            library={resolvedLibrary}
            variant={iconVariant}
            features={iconFeatures}
          />
        );
      }

      return <StarIcon filled={isActive} />;
    };

    // Render partial icon with layered approach
    const renderPartialIcon = (iconIndex: number, fillPercent: number) => {
      if (customIcon) {
        // For custom icons, pass fillPercent and let consumer handle it
        const iconProps: RateIconProps = {
          index: iconIndex,
          isActive: fillPercent > 0,
          isHovered: hoverValue !== null && iconIndex < (hoverValue ?? 0),
          value: displayValue,
          fillPercent,
        };
        return customIcon(iconProps);
      }

      if (iconName) {
        return (
          <span
            className="rate-icon-partial"
            style={
              {
                '--rate-fill-percent': `${fillPercent}%`,
              } as React.CSSProperties
            }
          >
            <span className="rate-icon-bg">
              <Icon
                name={iconName}
                library={resolvedLibrary}
                variant={iconVariant}
                features={iconFeatures}
              />
            </span>
            <span className="rate-icon-fg">
              <Icon
                name={iconName}
                library={resolvedLibrary}
                variant={iconVariant}
                features={iconFeatures}
              />
            </span>
          </span>
        );
      }

      // Default SVG with clipPath for partial fill
      const clipId = `rate-clip-${iconIndex}`;
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <defs>
            <clipPath id={clipId}>
              <rect
                x="0"
                y="0"
                width={`${(fillPercent / 100) * 24}`}
                height="24"
              />
            </clipPath>
          </defs>
          {/* Background: empty star */}
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
          {/* Foreground: filled portion */}
          <path
            clipPath={`url(#${clipId})`}
            fill="currentColor"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      );
    };

    // Render icons
    const renderIcons = () => {
      const icons = [];

      for (let i = 0; i < max; i++) {
        const iconIndex = rtl ? max - 1 - i : i;
        const fillPercent = getFillPercent(iconIndex, displayValue);
        const isActive = fillPercent === 100;
        const isHovered = hoverValue !== null && iconIndex < hoverValue;
        const isPartial = fillPercent > 0 && fillPercent < 100;

        const icon = isPartial
          ? renderPartialIcon(iconIndex, fillPercent)
          : renderIcon(iconIndex, isActive, fillPercent);

        icons.push(
          <span
            key={iconIndex}
            className={classNames('rate-item', {
              'is-active': isActive,
              'is-hovered': isHovered,
            })}
            onClick={e => handleClick(iconIndex, e)}
            onMouseEnter={() => handleMouseEnter(iconIndex)}
            onMouseMove={e => handleMouseMove(iconIndex, e)}
            onMouseLeave={handleMouseLeave}
            role="radio"
            aria-checked={
              currentValue === iconIndex + 1 ||
              (precision < 1 &&
                currentValue > iconIndex &&
                currentValue <= iconIndex + 1)
            }
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
    const ariaValueText =
      precision < 1 && currentValue % 1 !== 0
        ? `${currentValue.toFixed(1)} out of ${max} stars`
        : undefined;

    const helpClass = usePrefixedClassNames('help', {
      [`is-${messageColor}`]: !!messageColor,
    });
    const messageEl = message ? <p className={helpClass}>{message}</p> : null;

    const rateElement = (
      <div
        ref={ref}
        className={combinedClasses}
        role="radiogroup"
        aria-label="Rating"
        aria-valuenow={currentValue}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuetext={ariaValueText}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        {...rest}
      >
        <div className="rate-items">{renderIcons()}</div>
        {showScore && <span className="rate-score">{getScoreDisplay()}</span>}
        {text && <span className="rate-text">{text}</span>}
        {customText && <span className="rate-custom-text">{customText}</span>}
        {name && (
          <input type="hidden" name={name} value={currentValue} form={form} />
        )}
      </div>
    );

    let content = rateElement;

    if (!insideControl) {
      content = <Control>{content}</Control>;
    }

    if (!insideField) {
      return (
        <Field
          label={label}
          labelSize={labelSize}
          labelProps={labelProps}
          horizontal={horizontal}
          className={fieldClassName}
        >
          {content}
          {messageEl}
        </Field>
      );
    }

    return (
      <>
        {content}
        {messageEl}
      </>
    );
  }
);

Rate.displayName = 'Rate';

export default Rate;
