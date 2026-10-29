/**
 * @group Table
 */
import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { TableColor, validTableColors } from './Td'; // Import TableColor from Td

/**
 * Props for the Tr component.
 */
export interface TrProps
  extends
    Omit<React.HTMLAttributes<HTMLTableRowElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor' | 'color'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /**
   * Whether the row is selected (adds Bulma's is-selected class). It's a look
   * only: it says nothing to assistive tech, so pair it with a checkbox named
   * for the row when the selection matters. A bestax `Checkbox` placed
   * straight in one of the row's cells takes the row's text color, so a
   * checked box shows on the row's fill. One in a menu or a table nested in a
   * cell keeps its own colors, since it sits on that surface instead.
   */
  isSelected?: boolean;
  /** Bulma color modifier for the table row. */
  color?: TableColor;
  /** Table row content (cells). */
  children?: React.ReactNode;
}

/**
 * Tr component for rendering a styled Bulma table row.
 *
 * Supports the is-selected modifier and color modifiers.
 *
 * @function
 * @param {TrProps} props - Props for the Tr component.
 * @returns {JSX.Element} The rendered table row element.
 * @see {@link https://bulma.io/documentation/elements/table/#table-row | Bulma Table documentation}
 */
export const Tr: React.FC<TrProps> = ({
  className,
  isSelected,
  color,
  children,
  ...props
}) => {
  const bulmaClasses = usePrefixedClassNames('', {
    'is-selected': isSelected,
    [`is-${color}`]: color && validTableColors.includes(color),
  });

  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  const trClasses = classNames(bulmaClasses, className, bulmaHelperClasses);

  return (
    <tr className={trClasses || undefined} {...rest}>
      {children}
    </tr>
  );
};
