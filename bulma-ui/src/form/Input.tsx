import React, { forwardRef } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

/**
 * Props for the Input component.
 *
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'|'black'|'dark'|'light'|'white'} [color] - Bulma color modifier for the input.
 * @property {'small'|'medium'|'large'} [size] - Size modifier for the input.
 * @property {boolean} [isRounded] - Renders the input with rounded corners.
 * @property {boolean} [isStatic] - Renders the input as static text.
 * @property {boolean} [isHovered] - Applies the hovered state.
 * @property {boolean} [isFocused] - Applies the focused state.
 * @property {boolean} [isLoading] - Shows loading indicator.
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {boolean} [disabled] - Whether the input is disabled.
 * @property {boolean} [readOnly] - Whether the input is read-only.
 */
export interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
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
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

/**
 * Bulma Input component with full Bulma helper class support.
 *
 * @function
 * @param {InputProps} props - Props for the Input component.
 * @returns {JSX.Element} The rendered input element.
 * @see {@link https://bulma.io/documentation/form/input/ | Bulma Input documentation}
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      color,
      size,
      isRounded,
      isStatic,
      isHovered,
      isFocused,
      isLoading,
      className,
      disabled,
      readOnly,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color,
      ...props,
    });

    const mainClass = usePrefixedClassNames('input', {
      [`is-${color}`]: !!color,
      [`is-${size}`]: !!size,
      'is-rounded': isRounded,
      'is-static': isStatic,
      'is-hovered': isHovered,
      'is-focused': isFocused,
      'is-loading': isLoading,
    });
    const inputClass = classNames(mainClass, bulmaHelperClasses, className);

    return (
      <input
        ref={ref}
        className={inputClass}
        disabled={disabled}
        readOnly={readOnly}
        {...rest}
      />
    );
  }
);
Input.displayName = 'Input';

export default Input;
