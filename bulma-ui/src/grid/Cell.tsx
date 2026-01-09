import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Type for grid cell span values.
 */
export type CellSpanValue = number;

/**
 * Props for the Cell component.
 *
 * @property {number} [colStart] - Which column the cell starts at (Bulma: is-col-start-x).
 * @property {number} [colFromEnd] - Which column the cell ends at, counting from the end (Bulma: is-col-from-end-x).
 * @property {CellSpanValue} [colSpan] - How many columns the cell will span (Bulma: is-col-span-x).
 * @property {number} [rowStart] - Which row the cell starts at (Bulma: is-row-start-x).
 * @property {number} [rowFromEnd] - Which row the cell ends at, counting from the end (Bulma: is-row-from-end-x).
 * @property {CellSpanValue} [rowSpan] - How many rows the cell will span (Bulma: is-row-span-x).
 * @property {string} [className] - Additional CSS class names.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'} [color] - Bulma color modifier for the cell.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {React.ReactNode} [children] - Children to render inside the cell.
 */
export interface CellProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  colStart?: number;
  colFromEnd?: number;
  colSpan?: CellSpanValue;
  rowStart?: number;
  rowFromEnd?: number;
  rowSpan?: CellSpanValue;
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  children?: React.ReactNode;
}

/**
 * Bulma Cell component for CSS Grid layouts.
 *
 * @function
 * @param {CellProps} props - Props for the Cell component.
 * @returns {JSX.Element} The rendered grid cell.
 * @see {@link https://bulma.io/documentation/grid/ | Bulma Grid documentation}
 */
export const Cell: React.FC<CellProps> = ({
  colStart,
  colFromEnd,
  colSpan,
  rowStart,
  rowFromEnd,
  rowSpan,
  className,
  textColor,
  color: _fieldColor,
  bgColor,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const mainClass = usePrefixedClassNames('cell');

  // Build cell grid classes with prefixes
  const cellGridClasses = usePrefixedClassNames('', {
    [`is-col-start-${colStart}`]: colStart !== undefined && colStart !== null,
    [`is-col-from-end-${colFromEnd}`]:
      colFromEnd !== undefined && colFromEnd !== null,
    [`is-col-span-${colSpan}`]: colSpan !== undefined && colSpan !== null,
    [`is-row-start-${rowStart}`]: rowStart !== undefined && rowStart !== null,
    [`is-row-from-end-${rowFromEnd}`]:
      rowFromEnd !== undefined && rowFromEnd !== null,
    [`is-row-span-${rowSpan}`]: rowSpan !== undefined && rowSpan !== null,
  });

  const cellClasses = classNames(
    mainClass,
    cellGridClasses,
    className,
    bulmaHelperClasses
  );

  return (
    <div className={cellClasses} {...rest}>
      {children}
    </div>
  );
};
