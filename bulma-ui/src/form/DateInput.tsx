import React, { forwardRef } from 'react';
import { usePrefixedClassNames } from '../helpers/classNames';
import { Field, FieldProps } from './Field';
import { Control, ControlBaseProps } from './Control';
import { DateInputBase, DateInputBaseProps } from './DateInputBase';
import { useInsideField, useInsideControl } from './FormContext';

/**
 * Props for the DateInput convenience wrapper. Extends `DateInputBaseProps`
 * with Field-level (label, horizontal) and Control-level (icons, loading) props.
 * @extraProp {string} [name] - Form field name. Forwarded to a hidden ISO-formatted input.
 * @extraProp {string} [form] - Form id the input belongs to.
 * @extraProp {boolean} [required=false] - Marks the input as required.
 * @extraProp {string} [className] - Additional CSS classes for the input.
 * @extraProp {React.Ref<HTMLInputElement>} [ref] - Forwarded to the underlying `<input>`.
 */
export interface DateInputProps extends DateInputBaseProps {
  /** Field label (component auto-wraps in a `Field` if not already inside). */
  label?: React.ReactNode;
  /** Size for the label. */
  labelSize?: FieldProps['labelSize'];
  /** Props for the label element. */
  labelProps?: FieldProps['labelProps'];
  /** Render the field with horizontal layout. */
  horizontal?: boolean;
  /** Icon props for the left icon. */
  iconLeft?: ControlBaseProps['iconLeft'];
  /** Icon props for the right icon. */
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
  /** Show a loading indicator on the control. */
  isLoading?: boolean;
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
    const helpClass = usePrefixedClassNames('help', {
      [`is-${messageColor}`]: !!messageColor,
    });

    // The right-side launcher is on by default; suppress it while the Control
    // shows its loading spinner (also on the right) unless explicitly set.
    let content: React.ReactNode = (
      <DateInputBase
        ref={ref}
        {...baseProps}
        triggerIcon={baseProps.triggerIcon ?? !isLoading}
      />
    );

    // Inline mode renders a bare calendar with no input, so the Control's
    // icon-left container has nothing to anchor to. Skip the Control wrap.
    if (!insideControl && !baseProps.inline) {
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

DateInput.displayName = 'DateInput';

export default DateInput;
