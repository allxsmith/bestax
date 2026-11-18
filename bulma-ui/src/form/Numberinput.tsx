import React, { forwardRef, useState, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import type { JSX } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import {
  useFieldsetDisabled,
  useInsideField,
  useInsideControl,
} from './FormContext';
import { Field } from './Field';
import { FormFieldProps } from './fieldProps';
import { useAutoLabelId } from './useAutoLabelId';
import { useFieldMessage } from './useFieldMessage';

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

/** The buttons' names, in your app's language. */
export interface NumberinputLabels {
  /**
   * Names the button that raises the value. An empty string counts as none.
   * @defaultValue 'Increase value'
   */
  increase?: string;
  /**
   * Names the button that lowers the value. An empty string counts as none.
   * @defaultValue 'Decrease value'
   */
  decrease?: string;
}

/**
 * Props for the Numberinput component.
 * @helperProps Helper props go on the outer `.numberinput` `<div>`, with
 * `className`. The other attributes go on the `<input>`.
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
  /** Field label. Automatically associated with the number input via `htmlFor` — uses your `id` when provided, otherwise a generated one. Dropped inside an outer `Field`, whose own label associates instead when that `Field` generates a target id (not `grouped`/`hasAddons`, no explicit `labelProps.htmlFor`) and you set no `id` here. Not rendered either by a plusminus `bare` Numberinput outside a `Field`. */
  label?: React.ReactNode;
  /** Props for the label element. An explicit `htmlFor` here overrides the automatic association (no id is generated then). */
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement> & {
    [key: string]: unknown;
  };
  /** Controlled value. */
  value?: number | undefined;
  /** Default value for uncontrolled usage. */
  defaultValue?: number | undefined;
  /** Minimum allowed value. */
  min?: number | undefined;
  /** Maximum allowed value. */
  max?: number | undefined;
  /** Step increment (default: 1). */
  step?: number | undefined;
  /** Size variant. */
  size?: NumberinputSize | undefined;
  /** Color variant for buttons. */
  color?: NumberinputColor | undefined;
  /** Color of the input field itself. */
  inputColor?: NumberinputInputColor;
  /** Position of +/- buttons. */
  controlsPosition?: NumberinputControlsPosition;
  /** Use rounded buttons. */
  controlsRounded?: boolean;
  /** Uses compact button spacing. */
  compact?: boolean;
  /**
   * Renders the plusminus controls without a `.field` row of their own, so
   * they join the row of a `Field` with `hasAddons` or `grouped` they sit
   * in. On by default inside a `Field`, unless a `Control` is anywhere above
   * it: a `Control` stacks its children, so there the controls keep their
   * own row. Bare plusminus controls render no `message`, so put help text
   * after that row yourself.
   * @defaultValue auto
   */
  bare?: boolean;
  /** Style variant for the control buttons. */
  variant?: NumberinputVariant;
  /** The buttons' names, in your app's language, in both variants. */
  labels?: NumberinputLabels;
  /** Whether the input is disabled. */
  disabled?: boolean | undefined;
  /**
   * Whether the input can be typed in. With `false` the input is `readOnly`,
   * so nothing can be typed or pasted, but the arrow keys and the buttons
   * still change the value, and a screen reader announces the field as
   * read-only all the same. Say that the buttons set it in its label, or in
   * its `message` where it renders one.
   */
  editable?: boolean;
  /**
   * Shows a loading spinner on the input's control.
   * Under `prefers-reduced-motion: reduce` the spinner stops and stays
   * drawn (with bestax's CSS loaded).
   * Use this rather than `isLoading` on a `Control` around the Numberinput:
   * that spinner sits at the `Control`'s right edge, on top of whichever
   * button is there, while this one stays inside the input.
   * The spinner is only drawn, so a screen reader hears nothing of it. Say
   * that the field is loading in its `message` as well, where it renders
   * one, or in text you tie to the input with `aria-describedby`, which a
   * screen reader reads when the input takes focus.
   * A load that starts while the user is in the field, such as a search as
   * they type, isn't reliably heard without a live region, such as a
   * `role="status"` element.
   */
  isLoading?: boolean;
  /** Enables exponential step increments when holding buttons. */
  exponential?: boolean;
  /**
   * Called with the new value, within `min` and `max`. While the field is
   * edited it isn't called for a number typed outside them, such as the `2`
   * of `25` when `min` is 10: Enter or leaving the field clamps that number
   * and calls it, and a step toward `min` and `max` calls it with the nearer
   * one, while a step away from them does nothing. It isn't called either while the field is empty or holds text
   * that isn't a number yet, such as a lone `-`: Enter or leaving the field
   * puts the last value back, and a step starts from the last value.
   */
  onChange?: ((value: number) => void) | undefined;
}

// The buttons are out of the Tab order, and a pointer press on one leaves
// focus where it was, in the input when it had it, so the arrow keys keep
// working and a button that disables at `min` or `max` takes no focus with it
// (#1971). A press on a disabled one blurs the input, as a press on any text
// does.
const keepFocus = (event: React.MouseEvent) => event.preventDefault();

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
      labels,
      disabled: disabledProp,
      editable = true,
      isLoading = false,
      exponential = false,
      onChange,
      className,
      ...props
    },
    ref
  ) => {
    const disabled = useFieldsetDisabled(disabledProp);
    const insideField = useInsideField();
    // Bare controls join their parent's row, which a `.control` does not lay
    // out. `useInsideControl()` is true anywhere below a `Control`, even past
    // a `Field` nested in it, so there they keep their own row as well.
    const insideControl = useInsideControl();
    const effectiveBare = bare ?? (insideField && !insideControl);
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const [internalValue, setInternalValue] = useState<number | undefined>(
      defaultValue
    );
    const inputRef = useRef<HTMLInputElement>(null);

    // Determine if controlled
    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : internalValue;

    // What the field holds while it's edited, when that isn't a value to
    // report: no number, which a number input reports as '' (empty, or a
    // lone `-`), or a number outside `min` and `max`, such as the `2` of `25`
    // when `min` is 10. Without it React wrote the last value, or the clamped
    // one, straight back, so the field couldn't be cleared to retype (#1976)
    // or take a number typed digit by digit (#2110). A value from a number in
    // range, a step that moves or outside ends it, and so do Enter and
    // leaving the field.
    const [draft, setDraft] = useState<{
      over: number | undefined;
      text: string;
    } | null>(null);
    if (draft && draft.over !== currentValue) setDraft(null);
    const draftNumber = draft ? parseFloat(draft.text) : NaN;

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
        setDraft(null);
        if (!isControlled) {
          setInternalValue(clampedValue);
        }
        onChange?.(clampedValue);
      },
      [isControlled, clampValue, onChange]
    );

    // Ends the draft before a caller's handler, or a form, reads the field:
    // a number outside `min` and `max` is clamped and reported, and with no
    // number the last value comes back.
    const commit = () => {
      if (!draft) return;
      // eslint-disable-next-line @eslint-react/dom-no-flush-sync -- the caller's onBlur or the form reads the field right after
      flushSync(() => {
        if (isNaN(draftNumber)) setDraft(null);
        else updateValue(draftNumber);
      });
    };

    // The number the field holds, for a step and for the buttons' limits: a
    // number typed, or the last value.
    const shown = isNaN(draftNumber) ? currentValue : draftNumber;

    // Exponential step: step grows with value magnitude
    const getEffectiveStep = useCallback(() => {
      if (!exponential) return step;
      return step * Math.max(1, Math.floor(Math.abs(shown ?? 0)));
    }, [exponential, step, shown]);

    // A step from the number the field holds. From outside `min` and `max`,
    // one toward them lands on the nearer one and one away does nothing, the
    // way a native number input's step moves (though that lands on its step
    // grid rather than on the bound itself). Inside them it moves by the step
    // and is clamped.
    const stepBy = useCallback(
      (direction: 1 | -1) => {
        if (shown !== undefined) {
          const clamped = clampValue(shown);
          if (clamped !== shown) {
            if ((clamped - shown) * direction > 0) updateValue(clamped);
            return;
          }
        }
        updateValue((shown ?? 0) + direction * getEffectiveStep());
      },
      [shown, clampValue, getEffectiveStep, updateValue]
    );

    // Handle increment
    const handleIncrement = useCallback(() => stepBy(1), [stepBy]);

    // Handle decrement
    const handleDecrement = useCallback(() => stepBy(-1), [stepBy]);

    // Handle input change: a number in range is reported as it's typed, and
    // anything else is held as a draft.
    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        const newValue = parseFloat(text);
        if (!isNaN(newValue) && clampValue(newValue) === newValue) {
          updateValue(newValue);
        } else {
          setDraft({ over: currentValue, text });
        }
      },
      [currentValue, clampValue, updateValue]
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

    const increaseLabel = labels?.increase || 'Increase value';
    const decreaseLabel = labels?.decrease || 'Decrease value';

    // Check if at limits, or past one with a number typed outside them
    const isAtMin = min !== undefined && shown !== undefined && shown <= min;
    const isAtMax = max !== undefined && shown !== undefined && shown >= max;

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

    // A bare plusminus Numberinput renders no message, so it describes
    // nothing with one either.
    const { messageEl, describedBy } = useFieldMessage(
      isStepper || !effectiveBare ? message : undefined,
      messageColor,
      props['aria-describedby']
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

    // Shared input element
    const inputControl = (
      <div className={expandedControlClasses}>
        <input
          ref={combinedRef}
          type="number"
          className={inputClasses}
          value={draft ? draft.text : (currentValue ?? '')}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          readOnly={!editable}
          onChange={handleInputChange}
          // A draft is no value yet, so the field reports what it holds.
          aria-valuenow={draft ? undefined : currentValue}
          aria-valuemin={min}
          aria-valuemax={max}
          {...rest}
          // After the spread: an undefined `id` key in rest would wipe it.
          id={controlId}
          aria-describedby={describedBy}
          // After the spread, so a draft ends on Enter or when the field is
          // left, before a form or a caller's own handler reads it. A
          // caller's `onKeyDown` still takes the place of the arrow keys'.
          onKeyDown={event => {
            if (event.key === 'Enter') commit();
            (props.onKeyDown ?? handleKeyDown)(event);
          }}
          onBlur={event => {
            commit();
            props.onBlur?.(event);
          }}
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
                onMouseDown={keepFocus}
                aria-label={increaseLabel}
              >
                <ArrowDropUp />
              </button>
              <button
                type="button"
                className={stepperButtonClasses}
                onClick={handleDecrement}
                disabled={disabled || isAtMin}
                tabIndex={-1}
                onMouseDown={keepFocus}
                aria-label={decreaseLabel}
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
        onMouseDown={keepFocus}
        aria-label={decreaseLabel}
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
        onMouseDown={keepFocus}
        aria-label={increaseLabel}
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

/** @deprecated Use `Numberinput` — same component. */
export const NumberInput = Numberinput;

/** @deprecated Use `NumberinputProps`. */
export type NumberInputProps = NumberinputProps;

export default Numberinput;
