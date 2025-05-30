import React from 'react';
import classNames from 'classnames';
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

export type TableColor = (typeof validTableColors)[number];

/**
 * Td component for rendering a styled Bulma table cell.
 */
export interface TdProps
  extends Omit<React.TdHTMLAttributes<HTMLTableCellElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor' | 'color'> {
  className?: string;
  color?: TableColor;
}

export const Td: React.FC<TdProps> = ({
  className,
  color,
  children,
  ...props
}) => {
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
