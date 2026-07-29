import React, { forwardRef } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

/**
 * Props for the Select component.
 */
export interface SelectBaseProps
  extends
    Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    Omit<BulmaClassesProps, 'color'> {
  /** Bulma color modifier for the select. */
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
  /** Size modifier for the select. */
  size?: 'small' | 'medium' | 'large';
  /** Rounded select corners. */
  isRounded?: boolean;
  /** Shows loading indicator. */
  isLoading?: boolean;
  /** Applies Bulma's is-active modifier. */
  isActive?: boolean;
  /** Forces hovered state on the inner select. */
  isHovered?: boolean;
  /** Forces focused state on the inner select. */
  isFocused?: boolean;
  /** Makes the select span the full width of parent. */
  isFullwidth?: boolean;
  /** Additional CSS classes to apply. */
  className?: string;
  /** Disables the select. */
  disabled?: boolean;
  /** Allows multiple selections. */
  multiple?: boolean;
  /** Number of visible options in multiselect. */
  multipleSize?: number;
  /** `<option>` elements. */
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
