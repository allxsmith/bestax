/**
 * @group Table
 */
import React from 'react';
import classNames from 'classnames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

/**
 * Props for the Thead component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {React.ReactNode} [children] - Table header content (rows).
 */
export interface TheadProps
  extends Omit<React.HTMLAttributes<HTMLTableSectionElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor'> {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Thead component for rendering a styled Bulma table header.
 *
 * Supports Bulma helper classes for additional styling.
 *
 * @function
 * @param {TheadProps} props - Props for the Thead component.
 * @returns {JSX.Element} The rendered table header element.
 */
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
