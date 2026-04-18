import React, { forwardRef } from 'react';
import { usePrefixedClassNames } from '../helpers/classNames';
import { Field, FieldProps } from './Field';
import { Control, ControlBaseProps } from './Control';
import { TextAreaBase, TextAreaBaseProps } from './TextAreaBase';
import { useInsideField, useInsideControl } from './FormContext';

/**
 * Props for the TextArea component.
 *
 * Composes Field, Control, and TextAreaBase into a single convenience component.
 * Supports all TextAreaBase props, plus Field-level (label, horizontal) and
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
export interface TextAreaProps extends TextAreaBaseProps {
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
 * TextArea is a convenience component that composes Field, Control, and TextAreaBase.
 *
 * Use this for typical form fields. For complex layouts (grouped fields,
 * addons, etc.), compose Field, Control, and TextAreaBase directly.
 *
 * @function
 * @param {TextAreaProps} props - Props for TextArea.
 * @returns {JSX.Element} The composed field element.
 *
 * @example
 * <TextArea label="Bio" placeholder="Tell us about yourself" rows={4} />
 *
 * @example
 * <TextArea
 *   label="Comments"
 *   message="Max 500 characters"
 *   messageColor="info"
 * />
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
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
      // Everything else goes to TextAreaBase
      ...textAreaProps
    },
    ref
  ) => {
    const insideField = useInsideField();
    const insideControl = useInsideControl();
    const helpClass = usePrefixedClassNames('help', {
      [`is-${messageColor}`]: !!messageColor,
    });

    let content = <TextAreaBase ref={ref} {...textAreaProps} />;

    if (!insideControl) {
      content = (
        <Control
          isLoading={controlIsLoading}
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

TextArea.displayName = 'TextArea';

export default TextArea;
