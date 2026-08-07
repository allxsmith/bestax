import React, { forwardRef, useState, useCallback, useRef } from 'react';
import type { JSX } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useInsideField } from './FormContext';
import { Field } from './Field';
import { FormFieldProps } from './fieldProps';
import { useAutoLabelId } from './useAutoLabelId';

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
  'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';

/** Position of the increment/decrement control buttons. */
export type NumberinputControlsPosition = 'left' | 'right' | 'both';

/** Visual variant for the Numberinput controls. */
export type NumberinputVariant = 'plusminus' | 'stepper';

/**
 * Props for the Numberinput component.
 * @extraProp {string} [className] - Additional CSS classes.
 * @extraProp {React.Ref<HTMLElement>} [ref] - Ref forwarded to the input element.
 */
export interface NumberinputProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'color' | 'size' | 'onChange' | 'value' | 'defaultValue' | 'type'
    >,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor' | 'size'>,
    FormFieldProps {
  /** Field label. Automatically associated with the number input via `htmlFor` — uses your `id` when provided, otherwise a generated one. Not wired when no Field wrapper is rendered (inside a `Field`, or plusminus `bare`). */
  label?: React.ReactNode;
  /** Props for the label element. An explicit `htmlFor` here overrides the automatic association. */
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement> & {
    [key: string]: unknown;
  };
  /** Controlled value. */
  value?: number;
  /** Default value for uncontrolled usage. */
  defaultValue?: number;
  /** Minimum allowed value. */
  min?: number;
  /** Maximum allowed value. */
  max?: number;
  /** Step increment (default: 1). */
  step?: number;
  /** Size variant. */
  size?: NumberinputSize;
  /** Color variant for buttons. */
  color?: NumberinputColor;
  /** Color of the input field itself. */
  inputColor?: NumberinputInputColor;
  /** Position of +/- buttons. */
  controlsPosition?: NumberinputControlsPosition;
  /** Use rounded buttons. */
  controlsRounded?: boolean;
  /** Uses compact button spacing. */
  compact?: boolean;
  /** Removes button borders and background. */
  bare?: boolean;
  /** Style variant for the control buttons. */
  variant?: NumberinputVariant;
  /** Whether the input is disabled. */
  disabled?: boolean;
  /** Whether the input can be typed in. */
  editable?: boolean;
  /** Shows a loading state. */
  isLoading?: boolean;
  /** Enables exponential step increments when holding buttons. */
  exponential?: boolean;
  /** Callback when value changes. */
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
 * The `Numberinput` component provides a number input with increment/decrement buttons.
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

    // The plusminus bare branch renders no Field and no label at all.
    const { controlId, fieldLabelProps } = useAutoLabelId({
      label,
      id: props.id,
      labelProps,
      rendersLabel: !insideField && (isStepper || !effectiveBare),
    });

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
          id={controlId}
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
            labelProps={fieldLabelProps}
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
          labelProps={fieldLabelProps}
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
