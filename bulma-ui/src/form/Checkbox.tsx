import React, { forwardRef } from 'react';
import classNames from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useConfig } from '../helpers/Config';

/**
 * Props for the Checkbox component.
 *
 * @property {boolean} [disabled] - Whether the checkbox is disabled.
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {React.ReactNode} [children] - The label/content for the checkbox.
 * @see Bulma Checkbox documentation: https://bulma.io/documentation/form/checkbox/
 */
export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Bulma Checkbox component with Bulma helper classes support.
 * The label is provided via the children prop.
 *
 * @function
 * @param {CheckboxProps} props - Props for the Checkbox component.
 * @returns {JSX.Element} The rendered checkbox element.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ disabled, className, children, ...props }, ref) => {
    const { classPrefix } = useConfig();
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      ...props,
    });

    const mainClass = classPrefix ? `${classPrefix}checkbox` : 'checkbox';
    const checkboxClass = classNames(mainClass, bulmaHelperClasses, className);

    return (
      <label className={checkboxClass}>
        <input ref={ref} type="checkbox" disabled={disabled} {...rest} />
        {children}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
