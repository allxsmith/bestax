import React from 'react';
import classNames from 'classnames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { TableColor, validTableColors } from './Td'; // Import TableColor from Td

/**
 * Props for the Tr component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {boolean} [isSelected] - Whether the row is selected (adds Bulma's is-selected class).
 * @property {TableColor} [color] - Bulma color modifier for the table row.
 * @property {React.ReactNode} [children] - Table row content (cells).
 */
export interface TrProps
  extends Omit<React.HTMLAttributes<HTMLTableRowElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor' | 'color'> {
  className?: string;
  isSelected?: boolean;
  color?: TableColor;
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
 */
export const Tr: React.FC<TrProps> = ({
  className,
  isSelected,
  color,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  const trClasses = classNames(className, bulmaHelperClasses, {
    'is-selected': isSelected,
    [`is-${color}`]: color && validTableColors.includes(color),
  });

  return (
    <tr className={trClasses} {...rest}>
      {children}
    </tr>
  );
};
