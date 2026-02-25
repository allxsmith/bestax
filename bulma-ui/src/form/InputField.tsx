import React, { forwardRef } from 'react';
import { usePrefixedClassNames } from '../helpers/classNames';
import { Field, FieldProps } from './Field';
import { Control, ControlBaseProps } from './Control';
import { Input, InputProps } from './Input';

/**
 * Props for the InputField component.
 *
 * Composes Field, Control, and Input into a single convenience component.
 * Supports all Input props, plus Field-level (label, horizontal) and
 * Control-level (icons, loading) props.
 *
 * @property {React.ReactNode} [label] - Field label.
 * @property {FieldProps['labelSize']} [labelSize] - Size for the label.
 * @property {FieldProps['labelProps']} [labelProps] - Props for the label element.
 * @property {boolean} [horizontal] - Horizontal field layout.
 * @property {ControlBaseProps['iconLeft']} [iconLeft] - Icon props for left icon.
 * @property {ControlBaseProps['iconRight']} [iconRight] - Icon props for right icon.
 * @property {string} [iconLeftName] - Shortcut for left icon name.
 * @property {string} [iconRightName] - Shortcut for right icon name.
 * @property {ControlBaseProps['iconLeftSize']} [iconLeftSize] - Shortcut for left icon size.
 * @property {ControlBaseProps['iconRightSize']} [iconRightSize] - Shortcut for right icon size.
 * @property {boolean} [hasIconsLeft] - Force left icon container.
 * @property {boolean} [hasIconsRight] - Force right icon container.
 * @property {boolean} [isLoading] - Show loading indicator on the control.
 * @property {boolean} [isExpanded] - Expand the control.
 * @property {'small'|'medium'|'large'} [controlSize] - Control size.
 * @property {React.ReactNode} [message] - Help/validation message below the input.
 * @property {string} [messageColor] - Bulma color for the message.
 * @property {string} [fieldClassName] - Additional CSS classes for the Field.
 * @property {string} [controlClassName] - Additional CSS classes for the Control.
 */
export interface InputFieldProps extends InputProps {
  label?: React.ReactNode;
  labelSize?: FieldProps['labelSize'];
  labelProps?: FieldProps['labelProps'];
  horizontal?: boolean;
  iconLeft?: ControlBaseProps['iconLeft'];
  iconRight?: ControlBaseProps['iconRight'];
  iconLeftName?: string;
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
 * InputField is a convenience component that composes Field, Control, and Input.
 *
 * Use this for typical form fields. For complex layouts (grouped fields,
 * addons, etc.), compose Field, Control, and Input directly.
 *
 * @function
 * @param {InputFieldProps} props - Props for InputField.
 * @returns {JSX.Element} The composed field element.
 *
 * @example
 * <InputField label="Username" placeholder="Enter username" iconLeftName="user" />
 *
 * @example
 * <InputField
 *   label="Email"
 *   type="email"
 *   message="Please enter a valid email"
 *   messageColor="danger"
 *   color="danger"
 * />
 */
export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      // Field props
      label,
      labelSize,
      labelProps,
      horizontal,
      // Control props
      iconLeft,
      iconRight,
      iconLeftName,
      iconRightName,
      iconLeftSize,
      iconRightSize,
      hasIconsLeft,
      hasIconsRight,
      isLoading,
      isExpanded,
      controlSize,
      // Message props
      message,
      messageColor,
      // Container class overrides
      fieldClassName,
      controlClassName,
      // Everything else goes to Input
      ...inputProps
    },
    ref
  ) => {
    const helpClass = usePrefixedClassNames('help', {
      [`is-${messageColor}`]: !!messageColor,
    });

    return (
      <Field
        label={label}
        labelSize={labelSize}
        labelProps={labelProps}
        horizontal={horizontal}
        className={fieldClassName}
      >
        <Control
          iconLeft={iconLeft}
          iconRight={iconRight}
          iconLeftName={iconLeftName}
          iconRightName={iconRightName}
          iconLeftSize={iconLeftSize}
          iconRightSize={iconRightSize}
          hasIconsLeft={hasIconsLeft}
          hasIconsRight={hasIconsRight}
          isLoading={isLoading}
          isExpanded={isExpanded}
          size={controlSize}
          className={controlClassName}
        >
          <Input ref={ref} {...inputProps} />
        </Control>
        {message && <p className={helpClass}>{message}</p>}
      </Field>
    );
  }
);

InputField.displayName = 'InputField';

export default InputField;
