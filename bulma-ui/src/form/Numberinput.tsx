import React, { forwardRef, useState, useCallback, useRef } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

export type NumberinputSize = 'small' | 'medium' | 'large';
export type NumberinputColor =
  | 'primary'
  | 'link'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';
export type NumberinputControlsPosition = 'left' | 'right' | 'both';

/**
 * Props for the Numberinput component.
 *
 * @property {number} [value] - Controlled value.
 * @property {number} [defaultValue] - Default value for uncontrolled usage.
 * @property {number} [min] - Minimum allowed value.
 * @property {number} [max] - Maximum allowed value.
 * @property {number} [step] - Step increment. Default: 1.
 * @property {NumberinputSize} [size] - Size variant.
 * @property {NumberinputColor} [color] - Color variant for buttons.
 * @property {NumberinputControlsPosition} [controlsPosition] - Position of +/- buttons.
 * @property {boolean} [controlsRounded] - Use rounded buttons.
 * @property {boolean} [disabled] - Whether the input is disabled.
 * @property {boolean} [editable] - Whether the input can be typed in. Default: true.
 * @property {(value: number) => void} [onChange] - Callback when value changes.
 */
export interface NumberinputProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'color' | 'size' | 'onChange' | 'value' | 'defaultValue' | 'type'
    >,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor' | 'size'> {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  size?: NumberinputSize;
  color?: NumberinputColor;
  controlsPosition?: NumberinputControlsPosition;
  controlsRounded?: boolean;
  editable?: boolean;
  onChange?: (value: number) => void;
}

/**
 * Numberinput component for numeric input with increment/decrement buttons.
 *
 * Provides +/- buttons for easy value adjustment, with keyboard support
 * and optional direct text input. Works in controlled or uncontrolled modes.
 *
 * @function
 * @param {NumberinputProps} props - Props for the Numberinput component.
 * @param {React.Ref<HTMLInputElement>} ref - Forwarded ref to the input element.
 * @returns {JSX.Element} The rendered number input component.
 *
 * @example
 * // Basic number input
 * <Numberinput defaultValue={5} />
 *
 * @example
 * // With min/max constraints
 * <Numberinput min={0} max={100} step={5} defaultValue={50} />
 *
 * @example
 * // Controlled with custom styling
 * const [quantity, setQuantity] = useState(1);
 * <Numberinput
 *   value={quantity}
 *   onChange={setQuantity}
 *   min={1}
 *   max={10}
 *   color="primary"
 * />
 */
export const Numberinput = forwardRef<HTMLInputElement, NumberinputProps>(
  (
    {
      value: controlledValue,
      defaultValue = 0,
      min,
      max,
      step = 1,
      size,
      color,
      controlsPosition = 'both',
      controlsRounded = false,
      disabled = false,
      editable = true,
      onChange,
      className,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const [internalValue, setInternalValue] = useState(defaultValue);
    const inputRef = useRef<HTMLInputElement>(null);

    // Determine if controlled
    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : internalValue;

    // Clamp value to min/max
    const clampValue = useCallback(
      (val: number): number => {
        let clamped = val;
        if (min !== undefined && clamped < min) clamped = min;
        if (max !== undefined && clamped > max) clamped = max;
        return clamped;
      },
      [min, max]
    );

    // Update value
    const updateValue = useCallback(
      (newValue: number) => {
        const clampedValue = clampValue(newValue);
        if (!isControlled) {
          setInternalValue(clampedValue);
        }
        onChange?.(clampedValue);
      },
      [isControlled, clampValue, onChange]
    );

    // Handle increment
    const handleIncrement = useCallback(() => {
      updateValue(currentValue + step);
    }, [currentValue, step, updateValue]);

    // Handle decrement
    const handleDecrement = useCallback(() => {
      updateValue(currentValue - step);
    }, [currentValue, step, updateValue]);

    // Handle input change
    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value);
        if (!isNaN(newValue)) {
          updateValue(newValue);
        }
      },
      [updateValue]
    );

    // Handle keyboard
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          handleIncrement();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          handleDecrement();
        }
      },
      [handleIncrement, handleDecrement]
    );

    // Check if at limits
    const isAtMin = min !== undefined && currentValue <= min;
    const isAtMax = max !== undefined && currentValue >= max;

    // Generate classes
    const numberinputClasses = usePrefixedClassNames('numberinput', {
      [`is-${size}`]: size,
      [`controls-${controlsPosition}`]: controlsPosition,
      'is-disabled': disabled,
    });

    const buttonClasses = classNames('button', {
      [`is-${size}`]: size,
      [`is-${color}`]: color,
      'is-rounded': controlsRounded,
    });

    const inputClasses = classNames('input', {
      [`is-${size}`]: size,
    });

    const combinedClasses = classNames(
      numberinputClasses,
      bulmaHelperClasses,
      className
    );

    // Use combined ref
    const combinedRef = (node: HTMLInputElement | null) => {
      (inputRef as React.MutableRefObject<HTMLInputElement | null>).current =
        node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      }
    };

    const decrementButton = (
      <button
        type="button"
        className={buttonClasses}
        onClick={handleDecrement}
        disabled={disabled || isAtMin}
        tabIndex={-1}
        aria-label="Decrease value"
      >
        <span className="icon is-small">
          <span aria-hidden="true">−</span>
        </span>
      </button>
    );

    const incrementButton = (
      <button
        type="button"
        className={buttonClasses}
        onClick={handleIncrement}
        disabled={disabled || isAtMax}
        tabIndex={-1}
        aria-label="Increase value"
      >
        <span className="icon is-small">
          <span aria-hidden="true">+</span>
        </span>
      </button>
    );

    return (
      <div className={combinedClasses}>
        {(controlsPosition === 'left' || controlsPosition === 'both') && (
          <div className="control">{decrementButton}</div>
        )}
        <div className="control is-expanded">
          <input
            ref={combinedRef}
            type="number"
            className={inputClasses}
            value={currentValue}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            readOnly={!editable}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            aria-valuenow={currentValue}
            aria-valuemin={min}
            aria-valuemax={max}
            {...rest}
          />
        </div>
        {(controlsPosition === 'right' || controlsPosition === 'both') && (
          <div className="control">{incrementButton}</div>
        )}
      </div>
    );
  }
);

Numberinput.displayName = 'Numberinput';

export default Numberinput;
