/**
 * @group Table
 */
import React from 'react';
import classNames from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

export const validTableColors = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
  'black',
  'dark',
  'light',
  'white',
] as const;

/**
 * Valid color values for the Td component (Bulma table cell colors).
 */
export type TableColor = (typeof validTableColors)[number];

/**
 * Props for the Td component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {TableColor} [color] - Bulma color modifier for the table cell.
 * @property {React.ReactNode} [children] - Table cell content.
 */
export interface TdProps
  extends Omit<React.TdHTMLAttributes<HTMLTableCellElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor' | 'color'> {
  className?: string;
  color?: TableColor;
  children?: React.ReactNode;
}

/**
 * Td component for rendering a styled Bulma table cell.
 *
 * Supports Bulma color modifiers and helper classes for additional styling.
 *
 * @function
 * @param {TdProps} props - Props for the Td component.
 * @returns {JSX.Element} The rendered table cell element.
 * @see {@link https://bulma.io/documentation/elements/table/#table-body | Bulma Table documentation}
 */
export const Td: React.FC<TdProps> = ({
  className,
  color,
  children,
  ...props
}) => {
  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  const tdClasses = classNames(className, bulmaHelperClasses, {
    [`is-${color}`]: color && validTableColors.includes(color),
  });

  return (
    <td className={tdClasses} {...rest}>
      {children}
    </td>
  );
};
