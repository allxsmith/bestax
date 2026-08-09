import React, { forwardRef } from 'react';
import { usePrefixedClassNames } from '../helpers/classNames';
import { Field, FieldProps } from './Field';
import { Control, ControlBaseProps } from './Control';
import { InputBase, InputBaseProps } from './InputBase';
import { useInsideField, useInsideControl } from './FormContext';
import { useAutoLabelId } from './useAutoLabelId';

/**
 * Props for the Input component.
 *
 * Composes Field, Control, and Input into a single convenience component.
 * Supports all Input props, plus Field-level (label, horizontal) and
 * Control-level (icons, loading) props.
 */
export interface InputProps extends InputBaseProps {
  /** Field label. Automatically associated with the input via `htmlFor` — uses your `id` when provided, otherwise a generated one. Dropped inside an outer `Field`, whose own label associates instead when that `Field` generates a target id (not `grouped`/`hasAddons`, no explicit `labelProps.htmlFor`). */
  label?: React.ReactNode;
  /** Size for the label. */
  labelSize?: FieldProps['labelSize'];
  /** Props for the label element when the component renders its own `Field`; dropped inside an outer `Field` (use that `Field`'s `labelProps` instead). An explicit `htmlFor` key — even `undefined` — overrides the automatic association and no id is generated. */
  labelProps?: FieldProps['labelProps'];
  /** Horizontal field layout. */
  horizontal?: boolean;
  /** Icon props for left icon. */
  iconLeft?: ControlBaseProps['iconLeft'];
  /** Icon props for right icon. */
  iconRight?: ControlBaseProps['iconRight'];
  /** Shortcut for left icon name. */
  iconLeftName?: string;
  /** Shortcut for right icon name. */
  iconRightName?: string;
  /** Shortcut for left icon size. */
  iconLeftSize?: ControlBaseProps['iconLeftSize'];
  /** Shortcut for right icon size. */
  iconRightSize?: ControlBaseProps['iconRightSize'];
  /** Force left icon container. */
  hasIconsLeft?: boolean;
  /** Force right icon container. */
  hasIconsRight?: boolean;
  /** Shows loading indicator. */
  isLoading?: boolean;
  /** Expand the control. */
  isExpanded?: boolean;
  /** Control size. */
  controlSize?: ControlBaseProps['size'];
  /** Help/validation message below the input. */
  message?: React.ReactNode;
  /** Bulma color for the message. */
  messageColor?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Additional CSS classes for the Field. */
  fieldClassName?: string;
  /** Additional CSS classes for the Control. */
  controlClassName?: string;
}

/**
 * The `Input` component provides a Bulma-styled text input, supporting colors, sizes, rounded corners, static/read-only state, hover/focus/loading states, and all Bulma helper props.
 *
 * @function
 * @param {InputProps} props - Props for Input.
 * @returns {JSX.Element} The composed field element.
 *
 * @example
 * <Input label="Username" placeholder="Enter username" iconLeftName="user" />
 *
 * @example
 * <Input
 *   label="Email"
 *   type="email"
 *   message="Please enter a valid email"
 *   messageColor="danger"
 *   color="danger"
 * />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
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
    const insideField = useInsideField();
    const insideControl = useInsideControl();
    const { controlId, fieldLabelProps } = useAutoLabelId({
      label,
      id: inputProps.id,
      labelProps,
      rendersLabel: !insideField,
    });
    const helpClass = usePrefixedClassNames('help', {
      [`is-${messageColor}`]: !!messageColor,
    });

    let content = <InputBase ref={ref} id={controlId} {...inputProps} />;

    if (!insideControl) {
      content = (
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

Input.displayName = 'Input';

export default Input;
