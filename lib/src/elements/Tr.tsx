import React from 'react';
import classNames from 'classnames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { TableColor, validTableColors } from './Td'; // Import TableColor from Td

/**
 * Tr component for rendering a styled Bulma table row.
 *
 * Supports the is-selected modifier and color modifiers.
 */
export interface TrProps
  extends Omit<React.HTMLAttributes<HTMLTableRowElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor' | 'color'> {
  className?: string;
  isSelected?: boolean;
  color?: TableColor;
}

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
