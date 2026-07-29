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
 */
export interface CellProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Which column the cell starts at (Bulma: `is-col-start-x`). */
  colStart?: number;
  /** Which column the cell ends at, counting from the end (Bulma: `is-col-from-end-x`). */
  colFromEnd?: number;
  /** How many columns the cell will span (Bulma: `is-col-span-x`). */
  colSpan?: CellSpanValue;
  /** Which row the cell starts at (Bulma: `is-row-start-x`). */
  rowStart?: number;
  /** Which row the cell ends at, counting from the end (Bulma: `is-row-from-end-x`). */
  rowFromEnd?: number;
  /** How many rows the cell will span (Bulma: `is-row-span-x`). */
  rowSpan?: CellSpanValue;
  /** Additional CSS class names. */
  className?: string;
  /** Text color. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color modifier for the cell. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Background color. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Content to render inside the cell. Children to render inside the cell. */
  children?: React.ReactNode;
}

/**
 * The `Cell` component provides a single Bulma grid cell for use inside the [`Grid`](./grid.md) component.
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
