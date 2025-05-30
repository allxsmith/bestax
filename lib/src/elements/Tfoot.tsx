import React from 'react';
import classNames from 'classnames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

/**
 * Tfoot component for rendering a styled Bulma table footer.
 */
export interface TfootProps
  extends Omit<React.HTMLAttributes<HTMLTableSectionElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor'> {
  className?: string;
}

export const Tfoot: React.FC<TfootProps> = ({
  className,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  const tfootClasses = classNames(className, bulmaHelperClasses);

  return (
    <tfoot className={tfootClasses} {...rest}>
      {children}
    </tfoot>
  );
};
