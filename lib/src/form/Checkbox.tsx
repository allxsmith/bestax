import React, { forwardRef } from 'react';
import classNames from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode; // The label/content for the checkbox
}

/**
 * Bulma Checkbox component with Bulma helper classes support.
 * The label is provided via the children prop.
 */
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ disabled, className, children, ...props }, ref) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      ...props,
    });

    const checkboxClass = classNames('checkbox', bulmaHelperClasses, className);

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
