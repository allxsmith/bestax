import React, { forwardRef, useState, useCallback, useRef } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useInsideField } from './FormContext';
import { Field } from './Field';
import { FormFieldProps } from './fieldProps';

/** Valid sizes for the Numberinput component. */
export type NumberinputSize = 'small' | 'medium' | 'large';

/** Valid colors for the Numberinput wrapper and control buttons. */
export type NumberinputColor =
  | 'primary'
  | 'link'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'light'
  | 'dark';

/** Valid colors for the Numberinput inner input element. */
export type NumberinputInputColor =
  | 'primary'
  | 'link'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

/** Position of the increment/decrement control buttons. */
export type NumberinputControlsPosition = 'left' | 'right' | 'both';

/** Visual variant for the Numberinput controls. */
export type NumberinputVariant = 'plusminus' | 'stepper';

/**
 * Props for the Numberinput component.
 *
 * @property {number} [value] - Controlled numeric value.
 * @property {number} [defaultValue] - Initial value for uncontrolled mode.
 * @property {number} [min] - Minimum allowed value.
 * @property {number} [max] - Maximum allowed value.
 * @property {number} [step] - Step increment (default: 1).
 * @property {NumberinputSize} [size] - Size of the input and buttons.
 * @property {NumberinputColor} [color] - Color for the control buttons.
 * @property {NumberinputInputColor} [inputColor] - Color for the inner input element.
 * @property {NumberinputControlsPosition} [controlsPosition] - Position of increment/decrement buttons (default: 'both').
 * @property {boolean} [controlsRounded] - Whether the control buttons are rounded.
 * @property {boolean} [compact] - Whether to use compact (addons) layout.
 * @property {boolean} [bare] - Bare mode: no outer .field wrapper, for composing inside a parent Field.
 * @property {NumberinputVariant} [variant] - Control variant: 'plusminus' (default) or 'stepper'.
 * @property {boolean} [disabled] - Whether the input is disabled.
 * @property {boolean} [editable] - Whether the user can type directly into the input (default: true).
 * @property {boolean} [isLoading] - Whether to show a loading spinner on the input.
 * @property {boolean} [exponential] - Whether the step grows with the value magnitude.
 * @property {(value: number) => void} [onChange] - Callback when the value changes.
 * @see {@link https://buefy.org/documentation/numberinput | Buefy Numberinput documentation}
 */
export interface NumberinputProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'color' | 'size' | 'onChange' | 'value' | 'defaultValue' | 'type'
    >,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor' | 'size'>,
    FormFieldProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  size?: NumberinputSize;
  color?: NumberinputColor;
  inputColor?: NumberinputInputColor;
  controlsPosition?: NumberinputControlsPosition;
  controlsRounded?: boolean;
  compact?: boolean;
  bare?: boolean;
  variant?: NumberinputVariant;
  disabled?: boolean;
  editable?: boolean;
  isLoading?: boolean;
  exponential?: boolean;
  onChange?: (value: number) => void;
}

const ArrowDropUp = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M7 14.5l5-5 5 5" />
  </svg>
);

const ArrowDropDown = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M7 9.5l5 5 5-5" />
  </svg>
);

/**
 * Bulma-styled numeric input with increment/decrement controls.
 *
 * Supports plus/minus buttons or a compact stepper variant,
 * with configurable min/max, step, and exponential stepping.
 *
 * @function
 * @param {NumberinputProps} props - Props for the Numberinput component.
 * @returns {JSX.Element} The rendered numeric input element.
 *
 * @example
 * // Basic number input
 * <Numberinput defaultValue={5} min={0} max={100} />
 *
 * @example
 * // Stepper variant with color
 * <Numberinput variant="stepper" color="primary" step={10} />
 */
export const Numberinput = forwardRef<HTMLInputElement, NumberinputProps>(
  (
    {
      // Field props
      label,
      labelSize,
      labelProps,
      horizontal,
      message,
      messageColor,
      fieldClassName,
      value: controlledValue,
      defaultValue,
      min,
      max,
      step = 1,
      size,
      color,
      inputColor,
      controlsPosition = 'both',
      controlsRounded = false,
      compact = false,
      bare,
      variant = 'plusminus',
      disabled = false,
      editable = true,
      isLoading = false,
      exponential = false,
      onChange,
      className,
      ...props
    },
    ref
  ) => {
    const insideField = useInsideField();
    const effectiveBare = bare ?? insideField;
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const [internalValue, setInternalValue] = useState<number | undefined>(
      defaultValue
    );
    const inputRef = useRef<HTMLInputElement>(null);

    // Determine if controlled
    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : internalValue;

    // Layout mode
    const isStepper = variant === 'stepper';
    const isAddons = compact || isStepper;
    const effectiveControlsPosition = isStepper ? 'right' : controlsPosition;

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

    // Exponential step: step grows with value magnitude
    const getEffectiveStep = useCallback(() => {
      if (!exponential) return step;
      return step * Math.max(1, Math.floor(Math.abs(currentValue ?? 0)));
    }, [exponential, step, currentValue]);

    // Handle increment
    const handleIncrement = useCallback(() => {
      updateValue((currentValue ?? 0) + getEffectiveStep());
    }, [currentValue, getEffectiveStep, updateValue]);

    // Handle decrement
    const handleDecrement = useCallback(() => {
      updateValue((currentValue ?? 0) - getEffectiveStep());
    }, [currentValue, getEffectiveStep, updateValue]);

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
    const isAtMin =
      min !== undefined && currentValue !== undefined && currentValue <= min;
    const isAtMax =
      max !== undefined && currentValue !== undefined && currentValue >= max;

    // Generate classes
    const fieldClasses = usePrefixedClassNames('field', {
      'is-grouped': !isAddons,
      'has-addons': isAddons,
    });

    const numberinputClasses = usePrefixedClassNames('numberinput', {
      'is-compact': isAddons,
      'is-stepper': isStepper,
      [`is-${size}`]: !!size,
      'is-disabled': disabled,
      [`controls-${effectiveControlsPosition}`]:
        effectiveControlsPosition !== 'both',
    });

    const controlClasses = usePrefixedClassNames('control');
    const expandedControlClasses = usePrefixedClassNames('control', {
      'is-expanded': true,
      'is-loading': isLoading,
    });

    const buttonClasses = usePrefixedClassNames('button', {
      [`is-${size}`]: !!size,
      [`is-${color}`]: !!color,
      'is-rounded': controlsRounded,
    });

    const inputClasses = usePrefixedClassNames('input', {
      [`is-${size}`]: !!size,
      [`is-${inputColor}`]: !!inputColor,
    });

    const iconClasses = usePrefixedClassNames('icon', 'is-small');
    const stepperClasses = usePrefixedClassNames('numberinput-stepper');
    const stepperButtonClasses = usePrefixedClassNames(
      'numberinput-stepper-button'
    );

    const combinedClasses = classNames(
      fieldClasses,
      numberinputClasses,
      bulmaHelperClasses,
      className
    );

    const helpClass = usePrefixedClassNames('help', {
      [`is-${messageColor}`]: !!messageColor,
    });
    const messageEl = message ? <p className={helpClass}>{message}</p> : null;

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

    // Shared input element
    const inputControl = (
      <div className={expandedControlClasses}>
        <input
          ref={combinedRef}
          type="number"
          className={inputClasses}
          value={currentValue ?? ''}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          readOnly={!editable}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          aria-valuenow={currentValue ?? undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          {...rest}
        />
      </div>
    );

    // Stepper variant
    if (isStepper) {
      const stepperElement = (
        <div className={combinedClasses}>
          {inputControl}
          <div className={controlClasses}>
            <div className={stepperClasses}>
              <button
                type="button"
                className={stepperButtonClasses}
                onClick={handleIncrement}
                disabled={disabled || isAtMax}
                tabIndex={-1}
                aria-label="Increase value"
              >
                <ArrowDropUp />
              </button>
              <button
                type="button"
                className={stepperButtonClasses}
                onClick={handleDecrement}
                disabled={disabled || isAtMin}
                tabIndex={-1}
                aria-label="Decrease value"
              >
                <ArrowDropDown />
              </button>
            </div>
          </div>
        </div>
      );

      if (!insideField) {
        return (
          <Field
            label={label}
            labelSize={labelSize}
            labelProps={labelProps}
            horizontal={horizontal}
            className={fieldClassName}
          >
            {stepperElement}
            {messageEl}
          </Field>
        );
      }

      return (
        <>
          {stepperElement}
          {messageEl}
        </>
      );
    }

    // Plusminus buttons
    const decrementButton = (
      <button
        type="button"
        className={buttonClasses}
        onClick={handleDecrement}
        disabled={disabled || isAtMin}
        tabIndex={-1}
        aria-label="Decrease value"
      >
        <span className={iconClasses}>
          <span aria-hidden="true">&minus;</span>
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
        <span className={iconClasses}>
          <span aria-hidden="true">+</span>
        </span>
      </button>
    );

    const decrementControl = (
      <div className={controlClasses}>{decrementButton}</div>
    );
    const incrementControl = (
      <div className={controlClasses}>{incrementButton}</div>
    );

    // Bare mode: no outer .field wrapper, for composing inside a parent Field
    if (effectiveBare) {
      const bareClasses = classNames(
        numberinputClasses,
        bulmaHelperClasses,
        className
      );

      if (effectiveControlsPosition === 'left') {
        return (
          <div className={bareClasses} style={{ display: 'contents' }}>
            {decrementControl}
            {incrementControl}
            {inputControl}
          </div>
        );
      }

      if (effectiveControlsPosition === 'right') {
        return (
          <div className={bareClasses} style={{ display: 'contents' }}>
            {inputControl}
            {decrementControl}
            {incrementControl}
          </div>
        );
      }

      return (
        <div className={bareClasses} style={{ display: 'contents' }}>
          {decrementControl}
          {inputControl}
          {incrementControl}
        </div>
      );
    }

    // Controls left: [−] [+] [input]
    let numberinputElement: JSX.Element;
    if (effectiveControlsPosition === 'left') {
      numberinputElement = (
        <div className={combinedClasses}>
          {decrementControl}
          {incrementControl}
          {inputControl}
        </div>
      );
    } else if (effectiveControlsPosition === 'right') {
      // Controls right: [input] [−] [+]
      numberinputElement = (
        <div className={combinedClasses}>
          {inputControl}
          {decrementControl}
          {incrementControl}
        </div>
      );
    } else {
      // Both sides (default): [−] [input] [+]
      numberinputElement = (
        <div className={combinedClasses}>
          {decrementControl}
          {inputControl}
          {incrementControl}
        </div>
      );
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
          {numberinputElement}
          {messageEl}
        </Field>
      );
    }

    return (
      <>
        {numberinputElement}
        {messageEl}
      </>
    );
  }
);

Numberinput.displayName = 'Numberinput';

export default Numberinput;
