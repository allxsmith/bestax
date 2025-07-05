/**
 * @group Table
 */
import React from 'react';
import classNames from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

/**
 * Props for the Table component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {boolean} [isBordered] - Adds borders to all the cells.
 * @property {boolean} [isStriped] - Adds zebra-striping to rows.
 * @property {boolean} [isNarrow] - Makes the table more compact by cutting cell padding in half.
 * @property {boolean} [isHoverable] - Adds a hover effect on rows.
 * @property {boolean} [isFullwidth] - Makes the table span the full width of its parent.
 * @property {boolean} [isResponsive] - Makes the table horizontally scrollable on small screens.
 * @property {React.ReactNode} [children] - Table content.
 */
export interface TableProps
  extends Omit<React.TableHTMLAttributes<HTMLTableElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor'> {
  className?: string;
  isBordered?: boolean;
  isStriped?: boolean;
  isNarrow?: boolean;
  isHoverable?: boolean;
  isFullwidth?: boolean;
  isResponsive?: boolean;
  children?: React.ReactNode;
}

/**
 * Table component for rendering a styled Bulma table.
 *
 * Supports responsive, bordered, striped, narrow, hoverable, and fullwidth variants.
 *
 * @function
 * @param {TableProps} props - Props for the Table component.
 * @returns {JSX.Element} The rendered table element.
 * @see {@link https://bulma.io/documentation/elements/table/ | Bulma Table documentation}
 */
export const Table: React.FC<TableProps> = ({
  className,
  isBordered,
  isStriped,
  isNarrow,
  isHoverable,
  isFullwidth,
  isResponsive,
  children,
  ...props
}) => {
  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  const tableClasses = classNames('table', className, bulmaHelperClasses, {
    'is-bordered': isBordered,
    'is-striped': isStriped,
    'is-narrow': isNarrow,
    'is-hoverable': isHoverable,
    'is-fullwidth': isFullwidth,
  });

  const tableElement = (
    <table className={tableClasses} {...rest}>
      {children}
    </table>
  );

  return isResponsive ? (
    <div className="table-container">{tableElement}</div>
  ) : (
    tableElement
  );
};
