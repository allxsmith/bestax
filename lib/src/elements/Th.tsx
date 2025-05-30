import React from 'react';
import classNames from 'classnames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { TableColor, validTableColors } from './Td';

const validAlignments = ['left', 'right', 'centered'] as const;
type TableAlignment = (typeof validAlignments)[number];

/**
 * Th component for rendering a styled Bulma table header cell.
 *
 * Supports alignment, width, and color modifiers.
 */
export interface ThProps
  extends Omit<React.ThHTMLAttributes<HTMLTableCellElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor' | 'color'> {
  className?: string;
  isAligned?: TableAlignment;
  width?: string | number;
  color?: TableColor;
}

export const Th: React.FC<ThProps> = ({
  className,
  isAligned,
  width,
  color,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  const thClasses = classNames(className, bulmaHelperClasses, {
    [`has-text-${isAligned}`]: isAligned && validAlignments.includes(isAligned),
    [`is-${color}`]: color && validTableColors.includes(color), // Line 32
  });

  return (
    <th
      className={thClasses}
      style={
        width
          ? { width: typeof width === 'number' ? `${width}px` : width }
          : undefined
      }
      {...rest}
    >
      {children}
    </th>
  );
};
