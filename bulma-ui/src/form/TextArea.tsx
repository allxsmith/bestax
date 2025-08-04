import React, { forwardRef } from 'react';
import classNames from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useConfig } from '../helpers/Config';

/**
 * Props for the TextArea component.
 *
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'|'black'|'dark'|'light'|'white'} [color] - Bulma color modifier for the textarea.
 * @property {'small'|'medium'|'large'} [size] - Size modifier for the textarea.
 * @property {boolean} [isRounded] - Renders the textarea with rounded corners.
 * @property {boolean} [isStatic] - Renders the textarea as static text.
 * @property {boolean} [isHovered] - Applies the hovered state.
 * @property {boolean} [isFocused] - Applies the focused state.
 * @property {boolean} [isLoading] - Shows loading indicator.
 * @property {boolean} [isActive] - Applies Bulma's is-active modifier.
 * @property {boolean} [hasFixedSize] - Applies Bulma's has-fixed-size modifier.
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {boolean} [disabled] - Whether the textarea is disabled.
 * @property {boolean} [readOnly] - Whether the textarea is read-only.
 * @property {number} [rows] - Number of visible text lines.
 */
export interface TextAreaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    Omit<BulmaClassesProps, 'color'> {
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
  size?: 'small' | 'medium' | 'large';
  isRounded?: boolean;
  isStatic?: boolean;
  isHovered?: boolean;
  isFocused?: boolean;
  isLoading?: boolean;
  isActive?: boolean;
  hasFixedSize?: boolean;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  rows?: number;
}

/**
 * Bulma TextArea component with full Bulma helper class support.
 *
 * @function
 * @param {TextAreaProps} props - Props for the TextArea component.
 * @returns {JSX.Element} The rendered textarea element.
 * @see {@link https://bulma.io/documentation/form/textarea/ | Bulma Textarea documentation}
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      color,
      size,
      isRounded,
      isStatic,
      isHovered,
      isFocused,
      isLoading,
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
    const { classPrefix } = useConfig();
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color,
      ...props,
    });

    const mainClass = classPrefix ? `${classPrefix}textarea` : 'textarea';
    const textareaClass = classNames(
      mainClass,
      bulmaHelperClasses,
      {
        [`is-${color}`]: color,
        [`is-${size}`]: size,
        'is-rounded': isRounded,
        'is-static': isStatic,
        'is-hovered': isHovered,
        'is-focused': isFocused,
        'is-loading': isLoading,
        'is-active': isActive,
        'has-fixed-size': hasFixedSize,
      },
      className
    );

    return (
      <textarea
        ref={ref}
        className={textareaClass}
        disabled={disabled}
        readOnly={readOnly}
        rows={rows}
        {...rest}
      />
    );
  }
);
TextArea.displayName = 'TextArea';

export default TextArea;
