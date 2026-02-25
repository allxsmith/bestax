import React, { forwardRef } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Valid colors for the Checkbox component.
 */
export const checkboxColors = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
] as const;

/**
 * Valid sizes for the Checkbox component.
 */
export const checkboxSizes = ['small', 'normal', 'medium', 'large'] as const;

/**
 * Props for the Checkbox component.
 *
 * @property {(typeof checkboxColors)[number]} [color] - Color variant for the checkbox.
 * @property {(typeof checkboxSizes)[number]} [size] - Size of the checkbox.
 * @property {boolean} [disabled] - Whether the checkbox is disabled.
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color.
 * @property {React.ReactNode} [children] - The label/content for the checkbox.
 * @see Bulma Checkbox documentation: https://bulma.io/documentation/form/checkbox/
 */
export interface CheckboxProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'size' | 'type' | 'color'
    >,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor' | 'size'> {
  color?: (typeof checkboxColors)[number];
  size?: (typeof checkboxSizes)[number];
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Bulma Checkbox component with themed styling support.
 *
 * Renders a custom-styled checkbox with a visual check indicator,
 * supporting colors, sizes, and various states.
 *
 * @function
 * @param {CheckboxProps} props - Props for the Checkbox component.
 * @returns {JSX.Element} The rendered checkbox element.
 *
 * @example
 * // Basic checkbox
 * <Checkbox>Accept terms</Checkbox>
 *
 * @example
 * // Colored checkbox
 * <Checkbox color="primary" defaultChecked>
 *   Enable feature
 * </Checkbox>
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      color,
      size,
      className,
      children,
      textColor,
      disabled,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor,
      ...props,
    });

    const mainClass = usePrefixedClassNames('checkbox', {
      [`is-${color}`]: color && checkboxColors.includes(color),
      [`is-${size}`]: size && checkboxSizes.includes(size),
    });
    const checkboxClass = classNames(mainClass, bulmaHelperClasses, className);

    return (
      <label className={checkboxClass}>
        <input ref={ref} type="checkbox" disabled={disabled} {...rest} />
        <span className="check" />
        {children && <span className="control-label">{children}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
