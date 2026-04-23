import React, { forwardRef } from 'react';
import { usePrefixedClassNames } from '../helpers/classNames';
import { Field, FieldProps } from './Field';
import { Control, ControlBaseProps } from './Control';
import { SelectBase, SelectBaseProps } from './SelectBase';
import { useInsideField, useInsideControl } from './FormContext';

/**
 * Props for the Select component.
 *
 * Composes Field, Control, and SelectBase into a single convenience component.
 * Supports all SelectBase props, plus Field-level (label, horizontal) and
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
export interface SelectProps extends SelectBaseProps {
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
 * Select is a convenience component that composes Field, Control, and SelectBase.
 *
 * Use this for typical form fields. For complex layouts (grouped fields,
 * addons, etc.), compose Field, Control, and SelectBase directly.
 *
 * @function
 * @param {SelectProps} props - Props for Select.
 * @returns {JSX.Element} The composed field element.
 *
 * @example
 * <Select label="Country" iconLeftName="globe">
 *   <option>United States</option>
 *   <option>Canada</option>
 * </Select>
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
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
      isExpanded,
      controlSize,
      // Message props
      message,
      messageColor,
      // Container class overrides
      fieldClassName,
      controlClassName,
      // Everything else (including isLoading) goes to Select.
      // Note: isLoading on a select is rendered on the .select wrapper itself
      // (replacing the chevron with a spinner), not on .control — this matches
      // Bulma's documented behavior for `<div class="select is-loading">`.
      ...selectProps
    },
    ref
  ) => {
    const insideField = useInsideField();
    const insideControl = useInsideControl();
    const helpClass = usePrefixedClassNames('help', {
      [`is-${messageColor}`]: !!messageColor,
    });

    let content = <SelectBase ref={ref} {...selectProps} />;

    if (!insideControl) {
      content = (
        <Control
          iconLeft={iconLeft}
          iconLeftName={iconLeftName}
          iconLeftSize={iconLeftSize}
          hasIconsLeft={hasIconsLeft}
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

Select.displayName = 'Select';

export default Select;
