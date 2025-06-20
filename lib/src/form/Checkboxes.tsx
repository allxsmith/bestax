import React from 'react';
import classNames from 'classnames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

export interface CheckboxesProps extends Omit<BulmaClassesProps, 'color'> {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Wraps Checkbox components inside a Bulma 'checkboxes' wrapper.
 * Leverages useBulmaClasses for consistency with other components.
 */
const Checkboxes: React.FC<CheckboxesProps> = ({
  children,
  className,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    ...props,
  });

  const wrapperClass = classNames(
    'checkboxes', // Bulma's correct class for grouped checkboxes
    bulmaHelperClasses,
    className
  );

  return (
    <div className={wrapperClass} {...rest}>
      {children}
    </div>
  );
};

export default Checkboxes;
