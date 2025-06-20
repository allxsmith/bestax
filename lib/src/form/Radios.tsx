import React from 'react';
import classNames from 'classnames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

export interface RadiosProps extends Omit<BulmaClassesProps, 'color'> {
  className?: string;
  children: React.ReactNode;
}

/**
 * Wraps Radio components inside a Bulma 'radios' wrapper.
 * Leverages useBulmaClasses for consistency with other components.
 */
const Radios: React.FC<RadiosProps> = ({ children, className, ...props }) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    ...props,
  });

  const wrapperClass = classNames(
    'radios', // Bulma's class for grouped radios
    bulmaHelperClasses,
    className
  );

  return (
    <div className={wrapperClass} {...rest}>
      {children}
    </div>
  );
};

export default Radios;
