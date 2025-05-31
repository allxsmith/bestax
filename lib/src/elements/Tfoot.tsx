import React from 'react';
import classNames from 'classnames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

/**
 * Props for the Tfoot component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {React.ReactNode} [children] - Table footer content (rows).
 */
export interface TfootProps
  extends Omit<React.HTMLAttributes<HTMLTableSectionElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor'> {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Tfoot component for rendering a styled Bulma table footer.
 *
 * Supports Bulma helper classes for additional styling.
 *
 * @function
 * @param {TfootProps} props - Props for the Tfoot component.
 * @returns {JSX.Element} The rendered table footer element.
 */
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
