import React from 'react';
import classNames from 'classnames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

/**
 * Tbody component for rendering a styled Bulma table body.
 */
export interface TbodyProps
  extends Omit<React.HTMLAttributes<HTMLTableSectionElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor'> {
  className?: string;
}

export const Tbody: React.FC<TbodyProps> = ({
  className,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  const tbodyClasses = classNames(className, bulmaHelperClasses);

  return (
    <tbody className={tbodyClasses} {...rest}>
      {children}
    </tbody>
  );
};
