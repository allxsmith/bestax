import React, { forwardRef } from 'react';
import classNames from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
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
  isHovered?: boolean; // Bulma state modifier
  isFocused?: boolean; // Bulma state modifier
  isLoading?: boolean; // Optional, for loading state
  className?: string;
  disabled?: boolean; // Standard HTML input attribute
  readOnly?: boolean; // Standard HTML input attribute
}

const Input = forwardRef<HTMLInputElement, InputProps>(
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

    const inputClass = classNames(
      'input',
      bulmaHelperClasses,
      {
        [`is-${color}`]: color,
        [`is-${size}`]: size,
        'is-rounded': isRounded,
        'is-static': isStatic,
        'is-hovered': isHovered,
        'is-focused': isFocused,
        'is-loading': isLoading,
      },
      className
    );

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
