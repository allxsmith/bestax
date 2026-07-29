/**
 * @group Table
 */
import React from 'react';
import classNames from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

/**
 * Props for the Tfoot component.
 */
export interface TfootProps
  extends
    Omit<React.HTMLAttributes<HTMLTableSectionElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Table footer content (rows). */
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
 * @see {@link https://bulma.io/documentation/elements/table/#table-footer | Bulma Table documentation}
 */
export const Tfoot: React.FC<TfootProps> = ({
  className,
  children,
  ...props
}) => {
  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  const tfootClasses = classNames(className, bulmaHelperClasses);

  return (
    <tfoot className={tfootClasses} {...rest}>
      {children}
    </tfoot>
  );
};
