import React, { forwardRef } from 'react';
import { usePrefixedClassNames } from '../helpers/classNames';
import { Field, FieldProps } from './Field';
import { Control, ControlBaseProps } from './Control';
import {
  DatetimepickerBase,
  DatetimepickerBaseProps,
} from './DatetimepickerBase';
import { useInsideField, useInsideControl } from './FormContext';

/**
 * Props for the Datetimepicker convenience wrapper. Extends
 * `DatetimepickerBaseProps` with Field-level and Control-level props.
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
export interface DatetimepickerProps extends DatetimepickerBaseProps {
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
 * Datetimepicker is a form input that opens a popover combining a calendar
 * (above) and a time spinner (below). Footer offers Today / Now / Clear / OK.
 * Includes a native `<input type="datetime-local">` fallback for touch devices.
 *
 * @function
 * @param {DatetimepickerProps} props
 * @returns {JSX.Element}
 *
 * @example
 * <Datetimepicker label="Appointment" defaultValue={new Date()} />
 *
 * @example
 * <Datetimepicker
 *   label="When"
 *   hourFormat="12"
 *   shouldDisableDate={d => d.getDay() === 0 || d.getDay() === 6}
 * />
 */
export const Datetimepicker = forwardRef<HTMLInputElement, DatetimepickerProps>(
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
      <DatetimepickerBase
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

Datetimepicker.displayName = 'Datetimepicker';

export default Datetimepicker;
