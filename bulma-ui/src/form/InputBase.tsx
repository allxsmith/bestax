import React, { forwardRef } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

/**
 * Props for the Input component.
 */
export interface InputBaseProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    Omit<BulmaClassesProps, 'color'> {
  /** Bulma color modifier for the input. */
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
  /** Size modifier for the input. */
  size?: 'small' | 'medium' | 'large';
  /** Rounded input corners. */
  isRounded?: boolean;
  /** Renders input as static (read only, styled). */
  isStatic?: boolean;
  /** Applies hovered state. */
  isHovered?: boolean;
  /** Applies focused state. */
  isFocused?: boolean;
  /** Shows loading indicator. */
  isLoading?: boolean;
  /** Additional CSS classes to apply. */
  className?: string;
  /** Disabled input. */
  disabled?: boolean;
  /** Read-only input. */
  readOnly?: boolean;
}

/**
 * Bulma Input component with full Bulma helper class support.
 *
 * @function
 * @param {InputBaseProps} props - Props for the Input component.
 * @returns {JSX.Element} The rendered input element.
 * @see {@link https://bulma.io/documentation/form/input/ | Bulma Input documentation}
 */
export const InputBase = forwardRef<HTMLInputElement, InputBaseProps>(
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
InputBase.displayName = 'InputBase';

export default InputBase;
