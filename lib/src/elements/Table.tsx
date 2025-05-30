import React from 'react';
import classNames from 'classnames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

/**
 * Table component for rendering a styled Bulma table.
 *
 * Supports responsive, bordered, striped, narrow, hoverable, and fullwidth variants.
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
}

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
