import React, { forwardRef } from 'react';
import classNames from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

/**
 * Props for the Radio component.
 *
 * @property {boolean} [disabled] - Whether the radio is disabled.
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {React.ReactNode} [children] - The label/content for the radio.
 * @see Bulma Radio documentation: https://bulma.io/documentation/form/radio/
 */
export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Bulma Radio component with Bulma helper classes support.
 * The label is provided via the children prop.
 *
 * @function
 * @param {RadioProps} props - Props for the Radio component.
 * @returns {JSX.Element} The rendered radio element.
 */
const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ disabled, className, children, ...props }, ref) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      ...props,
    });

    const radioClass = classNames('radio', bulmaHelperClasses, className);

    return (
      <label className={radioClass}>
        <input ref={ref} type="radio" disabled={disabled} {...rest} />
        {children}
      </label>
    );
  }
);

Radio.displayName = 'Radio';

export default Radio;
