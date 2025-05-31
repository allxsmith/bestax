import React from 'react';
import classNames from 'classnames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { TableColor, validTableColors } from './Td';

const validAlignments = ['left', 'right', 'centered'] as const;
/**
 * Valid alignment values for the Th component.
 */
type TableAlignment = (typeof validAlignments)[number];

/**
 * Props for the Th component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {TableAlignment} [isAligned] - Text alignment for the header cell ('left', 'right', 'centered').
 * @property {string|number} [width] - Width of the header cell (e.g., '100px' or 100).
 * @property {TableColor} [color] - Bulma color modifier for the header cell.
 * @property {React.ReactNode} [children] - Table header cell content.
 */
export interface ThProps
  extends Omit<React.ThHTMLAttributes<HTMLTableCellElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor' | 'color'> {
  className?: string;
  isAligned?: TableAlignment;
  width?: string | number;
  color?: TableColor;
  children?: React.ReactNode;
}

/**
 * Th component for rendering a styled Bulma table header cell.
 *
 * Supports alignment, width, and color modifiers.
 *
 * @function
 * @param {ThProps} props - Props for the Th component.
 * @returns {JSX.Element} The rendered table header cell element.
 */
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
    [`is-${color}`]: color && validTableColors.includes(color),
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
