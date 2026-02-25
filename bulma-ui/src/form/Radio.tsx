import React, { forwardRef } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Valid colors for the Radio component.
 */
export const radioColors = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
] as const;

/**
 * Valid sizes for the Radio component.
 */
export const radioSizes = ['small', 'normal', 'medium', 'large'] as const;

/**
 * Props for the Radio component.
 *
 * @property {(typeof radioColors)[number]} [color] - Color variant for the radio.
 * @property {(typeof radioSizes)[number]} [size] - Size of the radio.
 * @property {boolean} [disabled] - Whether the radio is disabled.
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color.
 * @property {React.ReactNode} [children] - The label/content for the radio.
 * @see Bulma Radio documentation: https://bulma.io/documentation/form/radio/
 */
export interface RadioProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'size' | 'type' | 'color'
    >,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor' | 'size'> {
  color?: (typeof radioColors)[number];
  size?: (typeof radioSizes)[number];
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Bulma Radio component with themed styling support.
 *
 * Renders a custom-styled radio button with a visual indicator,
 * supporting colors, sizes, and various states.
 *
 * @function
 * @param {RadioProps} props - Props for the Radio component.
 * @returns {JSX.Element} The rendered radio element.
 *
 * @example
 * // Basic radio
 * <Radio name="option">Option A</Radio>
 *
 * @example
 * // Colored radio
 * <Radio color="primary" name="choice" defaultChecked>
 *   Selected choice
 * </Radio>
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(
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

    const mainClass = usePrefixedClassNames('radio', {
      [`is-${color}`]: color && radioColors.includes(color),
      [`is-${size}`]: size && radioSizes.includes(size),
    });
    const radioClass = classNames(mainClass, bulmaHelperClasses, className);

    return (
      <label className={radioClass}>
        <input ref={ref} type="radio" disabled={disabled} {...rest} />
        <span className="check" />
        {children && <span className="control-label">{children}</span>}
      </label>
    );
  }
);

Radio.displayName = 'Radio';

export default Radio;
