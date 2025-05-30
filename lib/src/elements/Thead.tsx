import React from 'react';
import classNames from 'classnames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

/**
 * Thead component for rendering a styled Bulma table header.
 */
export interface TheadProps
  extends Omit<React.HTMLAttributes<HTMLTableSectionElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor'> {
  className?: string;
}

export const Thead: React.FC<TheadProps> = ({
  className,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  const theadClasses = classNames(className, bulmaHelperClasses);

  return (
    <thead className={theadClasses} {...rest}>
      {children}
    </thead>
  );
};
