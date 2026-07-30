import React, { forwardRef } from 'react';
import { usePrefixedClassNames } from '../helpers/classNames';
import { Field, FieldProps } from './Field';
import { Control, ControlBaseProps } from './Control';
import { DateTimeInputBase, DateTimeInputBaseProps } from './DateTimeInputBase';
import { useInsideField, useInsideControl } from './FormContext';

/**
 * Props for the DateTimeInput convenience wrapper. Extends
 * `DateTimeInputBaseProps` with Field-level and Control-level props.
 * @extraProp [name] - Form field name.
 * @extraProp [form] - Optional id of the form the input belongs to.
 * @extraProp [required] - Marks the field as required for native HTML form validation.
 */
export interface DateTimeInputProps extends DateTimeInputBaseProps {
  /** Field label. */
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
  /** Message color. */
  messageColor?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Additional CSS classes for the Field wrapper. */
  fieldClassName?: string;
  /** Additional CSS classes for the Control wrapper. */
  controlClassName?: string;
}

/**
 * The `DateTimeInput` combines a calendar and a time **wheel spinner** in a single popover — an iOS-style layout.
 *
 * @function
 * @param {DateTimeInputProps} props
 * @returns {JSX.Element}
 *
 * @example
 * <DateTimeInput label="Appointment" defaultValue={new Date()} />
 *
 * @example
 * <DateTimeInput
 *   label="When"
 *   hourFormat="12"
 *   shouldDisableDate={d => d.getDay() === 0 || d.getDay() === 6}
 * />
 */
export const DateTimeInput = forwardRef<HTMLInputElement, DateTimeInputProps>(
  (
    {
      label,
      labelSize,
      labelProps,
      horizontal,
      iconLeft,
      iconRight,
      iconLeftName = 'calendar-alt',
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
      <DateTimeInputBase
        ref={ref}
        {...baseProps}
        triggerIcon={baseProps.triggerIcon ?? !isLoading}
      />
    );

    // Inline mode renders a bare picker with no input, so the Control's
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

DateTimeInput.displayName = 'DateTimeInput';

export default DateTimeInput;
