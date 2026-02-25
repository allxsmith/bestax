import React, { forwardRef } from 'react';
import { usePrefixedClassNames } from '../helpers/classNames';
import { Field, FieldProps } from './Field';
import { Control, ControlBaseProps } from './Control';
import { TextArea, TextAreaProps } from './TextArea';

/**
 * Props for the TextAreaField component.
 *
 * Composes Field, Control, and TextArea into a single convenience component.
 * Supports all TextArea props, plus Field-level (label, horizontal) and
 * Control-level (loading) props.
 *
 * @property {React.ReactNode} [label] - Field label.
 * @property {FieldProps['labelSize']} [labelSize] - Size for the label.
 * @property {FieldProps['labelProps']} [labelProps] - Props for the label element.
 * @property {boolean} [horizontal] - Horizontal field layout.
 * @property {boolean} [isLoading] - Show loading indicator on the control.
 * @property {'small'|'medium'|'large'} [controlSize] - Control size.
 * @property {React.ReactNode} [message] - Help/validation message below the textarea.
 * @property {string} [messageColor] - Bulma color for the message.
 * @property {string} [fieldClassName] - Additional CSS classes for the Field.
 * @property {string} [controlClassName] - Additional CSS classes for the Control.
 */
export interface TextAreaFieldProps extends TextAreaProps {
  label?: React.ReactNode;
  labelSize?: FieldProps['labelSize'];
  labelProps?: FieldProps['labelProps'];
  horizontal?: boolean;
  isLoading?: boolean;
  controlSize?: ControlBaseProps['size'];
  message?: React.ReactNode;
  messageColor?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  fieldClassName?: string;
  controlClassName?: string;
}

/**
 * TextAreaField is a convenience component that composes Field, Control, and TextArea.
 *
 * Use this for typical form fields. For complex layouts (grouped fields,
 * addons, etc.), compose Field, Control, and TextArea directly.
 *
 * @function
 * @param {TextAreaFieldProps} props - Props for TextAreaField.
 * @returns {JSX.Element} The composed field element.
 *
 * @example
 * <TextAreaField label="Bio" placeholder="Tell us about yourself" rows={4} />
 *
 * @example
 * <TextAreaField
 *   label="Comments"
 *   message="Max 500 characters"
 *   messageColor="info"
 * />
 */
export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  (
    {
      // Field props
      label,
      labelSize,
      labelProps,
      horizontal,
      // Control props
      isLoading: controlIsLoading,
      controlSize,
      // Message props
      message,
      messageColor,
      // Container class overrides
      fieldClassName,
      controlClassName,
      // Everything else goes to TextArea
      ...textAreaProps
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
          isLoading={controlIsLoading}
          size={controlSize}
          className={controlClassName}
        >
          <TextArea ref={ref} {...textAreaProps} />
        </Control>
        {message && <p className={helpClass}>{message}</p>}
      </Field>
    );
  }
);

TextAreaField.displayName = 'TextAreaField';

export default TextAreaField;
