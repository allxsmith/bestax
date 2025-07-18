/**
 * @group Table
 */
import React from 'react';
import classNames from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

/**
 * Props for the Tbody component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {React.ReactNode} [children] - Table body content (rows).
 */
export interface TbodyProps
  extends Omit<React.HTMLAttributes<HTMLTableSectionElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor'> {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Tbody component for rendering a styled Bulma table body.
 *
 * Supports Bulma helper classes for additional styling.
 *
 * @function
 * @param {TbodyProps} props - Props for the Tbody component.
 * @returns {JSX.Element} The rendered table body element.
 * @see {@link https://bulma.io/documentation/elements/table/#table-body | Bulma Table documentation}
 */
export const Tbody: React.FC<TbodyProps> = ({
  className,
  children,
  ...props
}) => {
  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  const tbodyClasses = classNames(className, bulmaHelperClasses);

  return (
    <tbody className={tbodyClasses} {...rest}>
      {children}
    </tbody>
  );
};
