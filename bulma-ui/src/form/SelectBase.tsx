import React, { forwardRef } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

/**
 * Props for the Select component.
 *
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'|'black'|'dark'|'light'|'white'} [color] - Bulma color modifier for the select.
 * @property {'small'|'medium'|'large'} [size] - Size modifier for the select.
 * @property {boolean} [isRounded] - Renders the select with rounded corners.
 * @property {boolean} [isLoading] - Shows loading indicator.
 * @property {boolean} [isActive] - Applies Bulma's is-active modifier.
 * @property {boolean} [isHovered] - Forces the hovered state on the inner select element.
 * @property {boolean} [isFocused] - Forces the focused state on the inner select element.
 * @property {boolean} [isFullwidth] - Makes the select span the full width of its parent.
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {boolean} [disabled] - Whether the select is disabled.
 * @property {boolean} [multiple] - Whether the select allows multiple values.
 * @property {number} [multipleSize] - For multiple select: number of visible options.
 * @property {React.ReactNode} [children] - Option elements.
 */
export interface SelectBaseProps
  extends
    Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
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
  isHovered?: boolean;
  isFocused?: boolean;
  isFullwidth?: boolean;
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
 * @param {SelectBaseProps} props - Props for the SelectBase component.
 * @returns {JSX.Element} The rendered select element.
 * @see {@link https://bulma.io/documentation/form/select/ | Bulma Select documentation}
 */
export const SelectBase = forwardRef<HTMLSelectElement, SelectBaseProps>(
  (
    {
      color,
      size,
      isRounded,
      isLoading,
      isActive,
      isHovered,
      isFocused,
      isFullwidth,
      className,
      disabled,
      children,
      multiple,
      multipleSize,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color,
      ...props,
    });

    const mainClass = usePrefixedClassNames('select', {
      [`is-${color}`]: !!color,
      [`is-${size}`]: !!size,
      'is-rounded': isRounded,
      'is-loading': isLoading,
      'is-active': isActive,
      'is-multiple': !!multiple,
      'is-fullwidth': isFullwidth,
    });
    const selectClass = classNames(mainClass, bulmaHelperClasses, className);

    // is-hovered / is-focused belong on the inner <select> element, not the wrapper.
    const innerSelectClass = usePrefixedClassNames('', {
      'is-hovered': isHovered,
      'is-focused': isFocused,
    });

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
        <select
          ref={ref}
          className={innerSelectClass || undefined}
          {...selectProps}
        >
          {children}
        </select>
      </div>
    );
  }
);

SelectBase.displayName = 'SelectBase';

export default SelectBase;
