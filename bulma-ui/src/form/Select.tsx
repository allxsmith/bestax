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
 */
export interface SelectProps extends SelectBaseProps {
  /** Field label. */
  label?: React.ReactNode;
  /** Size for the label. */
  labelSize?: FieldProps['labelSize'];
  /** Props for the label element. */
  labelProps?: FieldProps['labelProps'];
  /** Horizontal field layout. */
  horizontal?: boolean;
  /** Icon props for left icon. */
  iconLeft?: ControlBaseProps['iconLeft'];
  /** Shortcut for left icon name. */
  iconLeftName?: string;
  /** Shortcut for left icon size. */
  iconLeftSize?: ControlBaseProps['iconLeftSize'];
  /** Force left icon container. */
  hasIconsLeft?: boolean;
  /** Show loading indicator on the control. */
  isLoading?: boolean;
  /** Expand the control. */
  isExpanded?: boolean;
  /** Control size. */
  controlSize?: ControlBaseProps['size'];
  /** Help/validation message below the select. */
  message?: React.ReactNode;
  /** Bulma color for the message. */
  messageColor?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Additional CSS classes for the Field. */
  fieldClassName?: string;
  /** Additional CSS classes for the Control. */
  controlClassName?: string;
}

/**
 * The `Select` component provides a Bulma-styled dropdown for selecting one or more options.
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
