import React, { forwardRef } from 'react';
import { usePrefixedClassNames } from '../helpers/classNames';
import { Field, FieldProps } from './Field';
import { Control, ControlBaseProps } from './Control';
import { TextAreaBase, TextAreaBaseProps } from './TextAreaBase';
import {
  useInsideField,
  useInsideControl,
  rendersOwnField,
  rendersOwnControl,
} from './FormContext';
import { useAutoLabelId } from './useAutoLabelId';

/**
 * Props for the TextArea component.
 *
 * Composes Field, Control, and TextAreaBase into a single convenience component.
 * Supports all TextAreaBase props, plus Field-level (label, horizontal) and
 * Control-level (loading) props.
 * Inside an existing `Control` it renders no `Control` of its own, so its
 * Control-level props do nothing there and warn in development; set them on
 * that `Control` instead. Inside an outer `Field`, or a `Control` with no
 * `Field` around it, it renders no `Field` of its own either.
 * The exception is `label`, `message`, `horizontal` or `fieldClassName` in that
 * bare `Control`: it keeps a `Field` for them, nested in the `.control`, and
 * warns in development. Wrap the `Control` in a `Field` instead, and set the
 * `label`, `horizontal` and class name on that `Field`.
 */
export interface TextAreaProps extends TextAreaBaseProps {
  /** Field label. Automatically associated with the textarea via `htmlFor` — uses your `id` when provided, otherwise a generated one. Dropped inside an outer `Field`, whose own label associates instead when that `Field` generates a target id (not `grouped`/`hasAddons`, no explicit `labelProps.htmlFor`). */
  label?: React.ReactNode;
  /** Size for the label. */
  labelSize?: FieldProps['labelSize'];
  /** Props for the label element when the component renders its own `Field`; dropped inside an outer `Field` (use that `Field`'s `labelProps` instead). An explicit `htmlFor` key — even `undefined` — overrides the automatic association and no id is generated. */
  labelProps?: FieldProps['labelProps'];
  /** Horizontal field layout. */
  horizontal?: boolean;
  /**
   * Shows a loading spinner on the `Control` it renders.
   * Under `prefers-reduced-motion: reduce` the spinner stops and stays
   * drawn (with bestax's CSS loaded).
   */
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
 * The `TextArea` component provides a Bulma-styled multi-line text input, supporting color, size, hover/focus/loading states, fixed size, and all Bulma helper props.
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
    const ownField = rendersOwnField('TextArea', {
      insideField,
      insideControl,
      label,
      message,
      horizontal,
      fieldClassName,
    });
    const ownControl = rendersOwnControl('TextArea', {
      insideControl,
      isLoading: controlIsLoading,
      controlSize,
      controlClassName,
    });
    const { controlId, fieldLabelProps } = useAutoLabelId({
      label,
      id: textAreaProps.id,
      labelProps,
      rendersLabel: ownField,
    });
    const helpClass = usePrefixedClassNames('help', {
      [`is-${messageColor}`]: !!messageColor,
    });

    let content = <TextAreaBase ref={ref} id={controlId} {...textAreaProps} />;

    if (ownControl) {
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

    if (ownField) {
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
