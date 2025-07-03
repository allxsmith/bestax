import React, { forwardRef } from 'react';
import classNames from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

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
  isActive?: boolean; // New: Bulma's is-active modifier
  hasFixedSize?: boolean; // New: Bulma's has-fixed-size modifier
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  rows?: number; // New: rows for textarea
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
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
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color,
      ...props,
    });

    const textareaClass = classNames(
      'textarea',
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
