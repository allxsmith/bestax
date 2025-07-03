import React, { forwardRef } from 'react';
import classNames from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode; // The label/content for the radio
}

/**
 * Bulma Radio component with Bulma helper classes support.
 * The label is provided via the children prop.
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
