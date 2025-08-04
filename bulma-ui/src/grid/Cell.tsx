import React from 'react';
import classNames from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { useConfig } from '../helpers/Config';

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
  extends React.HTMLAttributes<HTMLDivElement>,
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
 * Builds Bulma grid cell class names for the Cell component.
 */
function getCellGridClasses(props: CellProps): string[] {
  const classes: string[] = [];

  if (props.colStart !== undefined)
    classes.push(`is-col-start-${props.colStart}`);
  if (props.colFromEnd !== undefined)
    classes.push(`is-col-from-end-${props.colFromEnd}`);
  if (props.colSpan !== undefined) classes.push(`is-col-span-${props.colSpan}`);

  if (props.rowStart !== undefined)
    classes.push(`is-row-start-${props.rowStart}`);
  if (props.rowFromEnd !== undefined)
    classes.push(`is-row-from-end-${props.rowFromEnd}`);
  if (props.rowSpan !== undefined) classes.push(`is-row-span-${props.rowSpan}`);

  return classes;
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
  bgColor,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const { classPrefix } = useConfig();
  const mainClass = classPrefix ? `${classPrefix}cell` : 'cell';

  const cellClasses = classNames(
    mainClass,
    ...getCellGridClasses({
      colStart,
      colFromEnd,
      colSpan,
      rowStart,
      rowFromEnd,
      rowSpan,
    }),
    className,
    bulmaHelperClasses
  );

  return (
    <div className={cellClasses} {...rest}>
      {children}
    </div>
  );
};
