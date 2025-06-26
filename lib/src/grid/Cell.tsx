import React from 'react';
import classNames from 'classnames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

export type CellSpanValue = number;

export interface CellProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /**
   * Which column the cell starts at (Bulma: is-col-start-x)
   */
  colStart?: number;
  /**
   * Which column the cell ends at, counting from the end (Bulma: is-col-from-end-x)
   */
  colFromEnd?: number;
  /**
   * How many columns the cell will span (Bulma: is-col-span-x)
   */
  colSpan?: CellSpanValue;
  /**
   * Which row the cell starts at (Bulma: is-row-start-x)
   */
  rowStart?: number;
  /**
   * Which row the cell ends at, counting from the end (Bulma: is-row-from-end-x)
   */
  rowFromEnd?: number;
  /**
   * How many rows the cell will span (Bulma: is-row-span-x)
   */
  rowSpan?: CellSpanValue;
  /**
   * Additional CSS class names
   */
  className?: string;
  /**
   * Text color (Bulma color, 'inherit', or 'current')
   */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /**
   * Bulma color modifier for the cell text
   */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /**
   * Background color (Bulma color, 'inherit', or 'current')
   */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /**
   * Children to render inside the cell
   */
  children?: React.ReactNode;
}

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
  const cellClasses = classNames(
    'cell',
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
