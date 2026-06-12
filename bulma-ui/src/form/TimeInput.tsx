import React, { forwardRef } from 'react';
import { usePrefixedClassNames } from '../helpers/classNames';
import { Field, FieldProps } from './Field';
import { Control, ControlBaseProps } from './Control';
import { TimeInputBase, TimeInputBaseProps } from './TimeInputBase';
import { useInsideField, useInsideControl } from './FormContext';

/**
 * Props for the TimeInput convenience wrapper. Extends `TimeInputBaseProps`
 * with Field-level (label, horizontal) and Control-level (icons, loading) props.
 *
 * @property {React.ReactNode} [label] - Field label.
 * @property {FieldProps['labelSize']} [labelSize] - Size for the label.
 * @property {FieldProps['labelProps']} [labelProps] - Props for the label element.
 * @property {boolean} [horizontal] - Render the field with horizontal layout.
 * @property {ControlBaseProps['iconLeft']} [iconLeft] - Icon props for the left icon.
 * @property {ControlBaseProps['iconRight']} [iconRight] - Icon props for the right icon.
 * @property {string} [iconRightName] - Shortcut for the right icon name.
 * @property {ControlBaseProps['iconLeftSize']} [iconLeftSize] - Shortcut for left icon size.
 * @property {ControlBaseProps['iconRightSize']} [iconRightSize] - Shortcut for right icon size.
 * @property {boolean} [hasIconsLeft] - Force the left icon container.
 * @property {boolean} [hasIconsRight] - Force the right icon container.
 * @property {boolean} [isLoading] - Show a loading indicator on the control.
 * @property {boolean} [isExpanded] - Expand the control to fill its container.
 * @property {ControlBaseProps['size']} [controlSize] - Size of the wrapping Control.
 * @property {React.ReactNode} [message] - Help/validation text below the input.
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'} [messageColor] - Message color.
 * @property {string} [fieldClassName] - Additional CSS classes for the Field wrapper.
 * @property {string} [controlClassName] - Additional CSS classes for the Control wrapper.
 */
export interface TimeInputProps extends TimeInputBaseProps {
  label?: React.ReactNode;
  labelSize?: FieldProps['labelSize'];
  labelProps?: FieldProps['labelProps'];
  horizontal?: boolean;
  iconLeft?: ControlBaseProps['iconLeft'];
  iconRight?: ControlBaseProps['iconRight'];
  iconRightName?: string;
  iconLeftSize?: ControlBaseProps['iconLeftSize'];
  iconRightSize?: ControlBaseProps['iconRightSize'];
  hasIconsLeft?: boolean;
  hasIconsRight?: boolean;
  isLoading?: boolean;
  isExpanded?: boolean;
  controlSize?: ControlBaseProps['size'];
  message?: React.ReactNode;
  messageColor?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  fieldClassName?: string;
  controlClassName?: string;
}

/**
 * TimeInput is a form input that opens a popover spinner for time-of-day
 * selection. Supports 12h/24h, optional seconds, custom step increments,
 * min/max bounds, an unselectable-times predicate, and a native
 * `<input type="time">` fallback for touch devices.
 *
 * @function
 * @param {TimeInputProps} props
 * @returns {JSX.Element}
 *
 * @example
 * <TimeInput label="Departure" defaultValue={new Date()} />
 *
 * @example
 * <TimeInput label="Slot" hourFormat="12" incrementMinutes={15} />
 */
export const TimeInput = forwardRef<HTMLInputElement, TimeInputProps>(
  (
    {
      label,
      labelSize,
      labelProps,
      horizontal,
      iconLeft,
      iconRight,
      iconLeftName = 'clock',
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
      <TimeInputBase
        ref={ref}
        {...baseProps}
        triggerIcon={baseProps.triggerIcon ?? !isLoading}
      />
    );

    // Inline mode renders a bare panel with no input, so the Control's
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

TimeInput.displayName = 'TimeInput';

export default TimeInput;
