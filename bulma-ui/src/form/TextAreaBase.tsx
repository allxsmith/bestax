import React, { forwardRef } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useFieldLabelId } from './FormContext';

/**
 * Props for the TextArea component.
 */
export interface TextAreaBaseProps
  extends
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    Omit<BulmaClassesProps, 'color'> {
  /** Bulma color modifier for the textarea. */
  color?:
    | 'primary'
    | 'link'
    | 'info'
    | 'success'
    | 'warning'
    | 'danger'
    | 'black'
    | 'dark'
    | 'light'
    | 'white';
  /** Size modifier for the textarea. */
  size?: 'small' | 'medium' | 'large';
  /** Rounded textarea corners. */
  isRounded?: boolean;
  /** Renders textarea as static (styled readonly). */
  isStatic?: boolean;
  /** Applies hovered state. */
  isHovered?: boolean;
  /** Applies focused state. */
  isFocused?: boolean;
  /** Shows loading indicator on the wrapping Control. */
  isLoading?: boolean;
  /** Applies Bulma's is-active modifier. */
  isActive?: boolean;
  /** Fixed textarea size (no resize). */
  hasFixedSize?: boolean;
  /** Additional CSS classes to apply. */
  className?: string;
  /** Disables the textarea. */
  disabled?: boolean;
  /** Read-only textarea. */
  readOnly?: boolean;
  /** Number of visible text lines. */
  rows?: number;
}

/**
 * Bulma TextArea component with full Bulma helper class support.
 *
 * @function
 * @param {TextAreaBaseProps} props - Props for the TextAreaBase component.
 * @returns {JSX.Element} The rendered textarea element.
 * @see {@link https://bulma.io/documentation/form/textarea/ | Bulma Textarea documentation}
 */
export const TextAreaBase = forwardRef<HTMLTextAreaElement, TextAreaBaseProps>(
  (
    {
      color,
      size,
      isRounded,
      isStatic,
      isHovered,
      isFocused,
      isLoading: _isLoading,
      isActive,
      hasFixedSize,
      className,
      disabled,
      readOnly,
      rows,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color,
      ...props,
    });
    const fieldLabelId = useFieldLabelId();

    // Note: `is-loading` is intentionally NOT applied to the <textarea> itself —
    // Bulma documents `<div class="control is-loading">` as the loading pattern
    // for textareas, not `<textarea class="textarea is-loading">`. The convenience
    // <TextArea> component routes its `isLoading` prop to the wrapping Control.
    const mainClass = usePrefixedClassNames('textarea', {
      [`is-${color}`]: !!color,
      [`is-${size}`]: !!size,
      'is-rounded': isRounded,
      'is-static': isStatic,
      'is-hovered': isHovered,
      'is-focused': isFocused,
      'is-active': isActive,
      'has-fixed-size': hasFixedSize,
    });
    const textareaClass = classNames(mainClass, bulmaHelperClasses, className);

    return (
      <textarea
        ref={ref}
        className={textareaClass}
        disabled={disabled}
        readOnly={readOnly}
        rows={rows}
        {...rest}
        // After the spread: a labeled Field's generated id is adopted only
        // when no user id arrived (rest.id may be an undefined own key).
        id={rest.id ?? fieldLabelId}
      />
    );
  }
);
TextAreaBase.displayName = 'TextAreaBase';

export default TextAreaBase;
