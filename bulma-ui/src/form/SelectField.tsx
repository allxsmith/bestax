import React, { forwardRef } from 'react';
import { usePrefixedClassNames } from '../helpers/classNames';
import { Field, FieldProps } from './Field';
import { Control, ControlBaseProps } from './Control';
import { Select, SelectProps } from './Select';

/**
 * Props for the SelectField component.
 *
 * Composes Field, Control, and Select into a single convenience component.
 * Supports all Select props, plus Field-level (label, horizontal) and
 * Control-level (icons, loading) props.
 *
 * @property {React.ReactNode} [label] - Field label.
 * @property {FieldProps['labelSize']} [labelSize] - Size for the label.
 * @property {FieldProps['labelProps']} [labelProps] - Props for the label element.
 * @property {boolean} [horizontal] - Horizontal field layout.
 * @property {ControlBaseProps['iconLeft']} [iconLeft] - Icon props for left icon.
 * @property {string} [iconLeftName] - Shortcut for left icon name.
 * @property {ControlBaseProps['iconLeftSize']} [iconLeftSize] - Shortcut for left icon size.
 * @property {boolean} [hasIconsLeft] - Force left icon container.
 * @property {boolean} [isLoading] - Show loading indicator on the control.
 * @property {boolean} [isExpanded] - Expand the control.
 * @property {'small'|'medium'|'large'} [controlSize] - Control size.
 * @property {React.ReactNode} [message] - Help/validation message below the select.
 * @property {string} [messageColor] - Bulma color for the message.
 * @property {string} [fieldClassName] - Additional CSS classes for the Field.
 * @property {string} [controlClassName] - Additional CSS classes for the Control.
 */
export interface SelectFieldProps extends SelectProps {
  label?: React.ReactNode;
  labelSize?: FieldProps['labelSize'];
  labelProps?: FieldProps['labelProps'];
  horizontal?: boolean;
  iconLeft?: ControlBaseProps['iconLeft'];
  iconLeftName?: string;
  iconLeftSize?: ControlBaseProps['iconLeftSize'];
  hasIconsLeft?: boolean;
  isLoading?: boolean;
  isExpanded?: boolean;
  controlSize?: ControlBaseProps['size'];
  message?: React.ReactNode;
  messageColor?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  fieldClassName?: string;
  controlClassName?: string;
}

/**
 * SelectField is a convenience component that composes Field, Control, and Select.
 *
 * Use this for typical form fields. For complex layouts (grouped fields,
 * addons, etc.), compose Field, Control, and Select directly.
 *
 * @function
 * @param {SelectFieldProps} props - Props for SelectField.
 * @returns {JSX.Element} The composed field element.
 *
 * @example
 * <SelectField label="Country" iconLeftName="globe">
 *   <option>United States</option>
 *   <option>Canada</option>
 * </SelectField>
 */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    {
      // Field props
      label,
      labelSize,
      labelProps,
      horizontal,
      // Control props
      iconLeft,
      iconLeftName,
      iconLeftSize,
      hasIconsLeft,
      isLoading: controlIsLoading,
      isExpanded,
      controlSize,
      // Message props
      message,
      messageColor,
      // Container class overrides
      fieldClassName,
      controlClassName,
      // Everything else goes to Select
      ...selectProps
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
          iconLeftName={iconLeftName}
          iconLeftSize={iconLeftSize}
          hasIconsLeft={hasIconsLeft}
          isLoading={controlIsLoading}
          isExpanded={isExpanded}
          size={controlSize}
          className={controlClassName}
        >
          <Select ref={ref} {...selectProps} />
        </Control>
        {message && <p className={helpClass}>{message}</p>}
      </Field>
    );
  }
);

SelectField.displayName = 'SelectField';

export default SelectField;
