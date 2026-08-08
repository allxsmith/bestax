import React, { forwardRef } from 'react';
import { usePrefixedClassNames } from '../helpers/classNames';
import { Field, FieldProps } from './Field';
import { Control, ControlBaseProps } from './Control';
import { TextAreaBase, TextAreaBaseProps } from './TextAreaBase';
import { useInsideField, useInsideControl } from './FormContext';
import { useAutoLabelId } from './useAutoLabelId';

/**
 * Props for the TextArea component.
 *
 * Composes Field, Control, and TextAreaBase into a single convenience component.
 * Supports all TextAreaBase props, plus Field-level (label, horizontal) and
 * Control-level (loading) props.
 */
export interface TextAreaProps extends TextAreaBaseProps {
  /** Field label. Automatically associated with the textarea via `htmlFor` — uses your `id` when provided, otherwise a generated one. Dropped inside an outer `Field`, whose own label then associates automatically. */
  label?: React.ReactNode;
  /** Size for the label. */
  labelSize?: FieldProps['labelSize'];
  /** Props for the label element. An explicit `htmlFor` here overrides the automatic association (no id is generated then). */
  labelProps?: FieldProps['labelProps'];
  /** Horizontal field layout. */
  horizontal?: boolean;
  /** Shows loading indicator on the wrapping Control. */
  isLoading?: boolean;
  /** Control size. */
  controlSize?: ControlBaseProps['size'];
  /** Help/validation message below the textarea. */
  message?: React.ReactNode;
  /** Bulma color for the message. */
  messageColor?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Additional CSS classes for the Field. */
  fieldClassName?: string;
  /** Additional CSS classes for the Control. */
  controlClassName?: string;
}

/**
 * The `TextArea` component provides a Bulma-styled multi-line text input, supporting color, size, rounded corners, static/read-only state, hover/focus/loading states, fixed size, and all Bulma helper props.
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
    const { controlId, fieldLabelProps } = useAutoLabelId({
      label,
      id: textAreaProps.id,
      labelProps,
      rendersLabel: !insideField,
    });
    const helpClass = usePrefixedClassNames('help', {
      [`is-${messageColor}`]: !!messageColor,
    });

    let content = <TextAreaBase ref={ref} id={controlId} {...textAreaProps} />;

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

TextArea.displayName = 'TextArea';

export default TextArea;
