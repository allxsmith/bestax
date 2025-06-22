import React, { forwardRef } from 'react';
import classNames from 'classnames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
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
  isLoading?: boolean;
  isActive?: boolean; // Bulma's is-active modifier
  className?: string;
  disabled?: boolean;
  multipleSize?: number; // NEW: for multiple select, maps to <select size>
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      color,
      size,
      isRounded,
      isLoading,
      isActive,
      className,
      disabled,
      children,
      multiple,
      multipleSize, // NEW
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color,
      ...props,
    });

    const selectClass = classNames(
      'select',
      bulmaHelperClasses,
      {
        [`is-${color}`]: color,
        [`is-${size}`]: size,
        'is-rounded': isRounded,
        'is-loading': isLoading,
        'is-active': isActive,
      },
      className
    );

    // Only set size attribute when multiple is true and multipleSize is specified
    const selectProps: React.SelectHTMLAttributes<HTMLSelectElement> = {
      disabled,
      multiple,
      ...rest,
    };

    if (multiple && typeof multipleSize === 'number') {
      selectProps.size = multipleSize;
    }

    return (
      <div className={selectClass}>
        <select ref={ref} {...selectProps}>
          {children}
        </select>
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
