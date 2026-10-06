import React, { forwardRef } from 'react';
import { usePrefixedClassNames } from '../helpers/classNames';
import { Field, FieldProps } from './Field';
import { Control, ControlBaseProps } from './Control';
import { DateInputBase, DateInputBaseProps } from './DateInputBase';
import { useInsideField, useInsideControl } from './FormContext';
import { useAutoLabelId } from './useAutoLabelId';
import { useControlLoading } from './controlLoading';

/**
 * Props for the DateInput convenience wrapper. Extends `DateInputBaseProps`
 * with Field-level (label, horizontal) and Control-level (icons, loading) props.
 * Inside an existing `Control` within a `Field` it renders no `Field` or
 * `Control` of its own, so set the Control-level props on that `Control` instead.
 * @extraProp {string} [name] - Form field name. The text field submits the text it displays. The native input on touch devices submits the ISO value (`YYYY-MM-DD`, or `YYYY-MM` at month granularity), and an `inline` calendar, which has no visible input, submits it from a hidden input (`YYYY-MM-DD`, `YYYY-MM` or `YYYY`).
 * @extraProp {string} [form] - Form id the input belongs to.
 * @extraProp {boolean} [required=false] - Marks the input as required.
 * @extraProp {string} [className] - Additional CSS classes for the input.
 * @extraProp {React.Ref<HTMLInputElement>} [ref] - Forwarded to the underlying `<input>`.
 */
export interface DateInputProps extends DateInputBaseProps {
  /** Field label (component auto-wraps in a `Field` if not already inside). Automatically associated with the input via `htmlFor` — uses your `id` when provided, otherwise a generated one. Not wired in `inline` mode (no visible input to label) and dropped inside an outer `Field`. */
  label?: React.ReactNode;
  /** Size for the label. */
  labelSize?: FieldProps['labelSize'];
  /** Props for the label element. An explicit `htmlFor` here overrides the automatic association (no id is generated then). */
  labelProps?: FieldProps['labelProps'];
  /** Render the field with horizontal layout. */
  horizontal?: boolean;
  /**
   * Icon props for the left icon.
   * Bulma gives control icons `pointer-events: none`, so a clickable node here
   * never receives a click. Put a button beside the input in its own addon `Control` instead.
   */
  iconLeft?: ControlBaseProps['iconLeft'];
  /**
   * Icon props for the right icon.
   * Bulma gives control icons `pointer-events: none`, so a clickable node here
   * never receives a click. Put a button beside the input in its own addon `Control` instead.
   */
  iconRight?: ControlBaseProps['iconRight'];
  /** Shortcut for the right icon name. */
  iconRightName?: string;
  /** Shortcut for left icon size. */
  iconLeftSize?: ControlBaseProps['iconLeftSize'];
  /** Shortcut for right icon size. */
  iconRightSize?: ControlBaseProps['iconRightSize'];
  /** Force the left icon container. */
  hasIconsLeft?: boolean;
  /** Force the right icon container. */
  hasIconsRight?: boolean;
  /**
   * Shows a loading spinner on the `Control` it renders, and hides the
   * launcher (`triggerIcon`) while it does. Inside your own `Control` it
   * renders none, so this draws nothing; set `isLoading` on that `Control`.
   * Under `prefers-reduced-motion: reduce` the spinner stops and stays
   * drawn (with bestax's CSS loaded).
   */
  isLoading?: boolean;
  /**
   * Show a clickable launcher button on the right that toggles the popover.
   * Off by default while a loading spinner shows at the same right edge,
   * whether from this component's `isLoading` or from the `Control` it
   * sits in.
   * @defaultValue !isLoading
   */
  triggerIcon?: boolean;
  /** Expand the control to fill its container. */
  isExpanded?: boolean;
  /** Size of the wrapping Control. */
  controlSize?: ControlBaseProps['size'];
  /** Help/validation text below the input. */
  message?: React.ReactNode;
  /** Color modifier for the help message. */
  messageColor?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Additional CSS classes for the Field wrapper. */
  fieldClassName?: string;
  /** Additional CSS classes for the Control wrapper. */
  controlClassName?: string;
}

/**
 * The `DateInput` component is a form input that opens a popover calendar for date selection.
 *
 * @function
 * @param {DateInputProps} props - Props for the DateInput.
 * @returns {JSX.Element}
 *
 * @example
 * <DateInput label="Date of birth" defaultValue={new Date(1990, 0, 1)} />
 *
 * @example
 * <DateInput
 *   label="Booking"
 *   min={new Date()}
 *   shouldDisableDate={d => d.getDay() === 0 || d.getDay() === 6}
 * />
 */
export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      label,
      labelSize,
      labelProps,
      horizontal,
      iconLeft,
      iconRight,
      iconLeftName = 'calendar',
      iconRightName,
      iconLeftSize,
      iconRightSize,
      hasIconsLeft,
      hasIconsRight,
      isLoading,
      isExpanded,
      controlSize,
      message,
      messageColor,
      fieldClassName,
      controlClassName,
      ...baseProps
    },
    ref
  ) => {
    const insideField = useInsideField();
    const insideControl = useInsideControl();
    const { controlId, fieldLabelProps } = useAutoLabelId({
      label,
      id: baseProps.id,
      labelProps,
      // Inline mode renders a bare calendar with no input to label.
      rendersLabel: !insideField && !baseProps.inline,
    });
    const helpClass = usePrefixedClassNames('help', {
      [`is-${messageColor}`]: !!messageColor,
    });

    // Inline mode renders a bare calendar with no input, so the Control's
    // icon-left container has nothing to anchor to. Skip the Control wrap.
    const rendersControl = !insideControl && !baseProps.inline;

    // The right-side launcher is on by default; suppress it while a loading
    // spinner (also on the right) shows, unless explicitly set. The spinner is
    // the Control's rendered here, or else the one this sits in.
    const outerLoading = useControlLoading();
    let content: React.ReactNode = (
      <DateInputBase
        ref={ref}
        id={controlId}
        {...baseProps}
        triggerIcon={
          baseProps.triggerIcon ?? !(rendersControl ? isLoading : outerLoading)
        }
      />
    );

    if (rendersControl) {
      content = (
        <Control
          iconLeft={iconLeft}
          iconRight={iconRight}
          iconLeftName={iconLeftName}
          iconRightName={iconRightName}
          iconLeftSize={iconLeftSize}
          iconRightSize={iconRightSize}
          hasIconsLeft={hasIconsLeft || !!iconLeftName}
          hasIconsRight={hasIconsRight}
          isLoading={isLoading}
          isExpanded={isExpanded}
          size={controlSize}
          className={controlClassName}
        >
          {content}
        </Control>
      );
    }

    const messageEl = message ? <p className={helpClass}>{message}</p> : null;

    if (!insideField) {
      return (
        <Field
          label={label}
          labelSize={labelSize}
          labelProps={fieldLabelProps}
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

DateInput.displayName = 'DateInput';

export default DateInput;
