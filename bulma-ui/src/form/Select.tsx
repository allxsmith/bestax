import React, { forwardRef } from 'react';
import classNames from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useConfig } from '../helpers/Config';

/**
 * Props for the Select component.
 *
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'|'black'|'dark'|'light'|'white'} [color] - Bulma color modifier for the select.
 * @property {'small'|'medium'|'large'} [size] - Size modifier for the select.
 * @property {boolean} [isRounded] - Renders the select with rounded corners.
 * @property {boolean} [isLoading] - Shows loading indicator.
 * @property {boolean} [isActive] - Applies Bulma's is-active modifier.
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {boolean} [disabled] - Whether the select is disabled.
 * @property {boolean} [multiple] - Whether the select allows multiple values.
 * @property {number} [multipleSize] - For multiple select: number of visible options.
 * @property {React.ReactNode} [children] - Option elements.
 */
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
  isActive?: boolean;
  className?: string;
  disabled?: boolean;
  multiple?: boolean;
  multipleSize?: number;
  children?: React.ReactNode;
}

/**
 * Bulma Select component with full Bulma helper class support.
 *
 * @function
 * @param {SelectProps} props - Props for the Select component.
 * @returns {JSX.Element} The rendered select element.
 * @see {@link https://bulma.io/documentation/form/select/ | Bulma Select documentation}
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
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
      multipleSize,
      ...props
    },
    ref
  ) => {
    const { classPrefix } = useConfig();
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color,
      ...props,
    });

    const mainClass = classPrefix ? `${classPrefix}select` : 'select';
    const selectClass = classNames(
      mainClass,
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
