/**
 * @group Table
 */
import React, { useEffect } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useScrollRegion } from '../helpers/useScrollRegion';
import { warnOnce } from '../helpers/devWarnings';
import { Thead } from './Thead';
import { Tbody } from './Tbody';
import { Tfoot } from './Tfoot';
import { Tr } from './Tr';
import { Th } from './Th';
import { Td } from './Td';

/**
 * Props for the Table component.
 */
export interface TableProps
  extends
    Omit<React.TableHTMLAttributes<HTMLTableElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string | undefined;
  /** Adds borders to all cells. */
  isBordered?: boolean;
  /** Adds zebra-striping to rows. */
  isStriped?: boolean;
  /** Makes the table more compact by cutting cell padding in half. */
  isNarrow?: boolean;
  /** Adds a hover effect on rows. */
  isHoverable?: boolean;
  /** Makes the table span the full width of its parent. */
  isFullwidth?: boolean;
  /** Makes the table span the full width of its parent. @deprecated Use `isFullwidth` instead — `isFullwidth` wins if both are set. */
  isFullWidth?: boolean;
  /**
   * Wraps the table in Bulma's `.table-container`, which scrolls it sideways
   * when it's wider than its parent. While it overflows, the container is a
   * region you can tab to and scroll by keyboard, named by the table's own
   * `aria-label` or `aria-labelledby`, so name the table with one of them; a
   * development build warns when it overflows with neither. While the table
   * fits, the container is a plain `div`.
   */
  isResponsive?: boolean;
  /** Table content (should use subcomponents). */
  children?: React.ReactNode;
}

/**
 * Bulma's `.table-container` around a responsive table. While the table
 * overflows, it's a region you can tab to and scroll by keyboard, Safari
 * included, named as the table is, as `ScrollArea`'s viewport is.
 */
const TableContainer = ({
  className,
  ariaLabel,
  ariaLabelledby,
  children,
}: {
  className: string;
  ariaLabel: string | undefined;
  ariaLabelledby: string | undefined;
  children: React.ReactNode;
}) => {
  const { ref, isRegion, onScroll, onFocus, onBlur } =
    useScrollRegion<HTMLDivElement>({ orientation: 'horizontal' });
  const named = Boolean(ariaLabel || ariaLabelledby);
  useEffect(() => {
    if (isRegion && !named) {
      warnOnce(
        'Table:unnamed',
        '[bestax-bulma] <Table isResponsive> overflows, and its scroll ' +
          'container has no name: it takes the table’s aria-label or ' +
          'aria-labelledby, not a caption. Pass one of them, pointing ' +
          'aria-labelledby at the caption’s id if it has one, so a screen ' +
          'reader can say what took focus when the table scrolls.'
      );
    }
  }, [isRegion, named]);
  return (
    <div
      ref={ref}
      className={className}
      role={isRegion ? 'region' : undefined}
      aria-label={isRegion ? ariaLabel : undefined}
      aria-labelledby={isRegion ? ariaLabelledby : undefined}
      tabIndex={isRegion ? 0 : undefined}
      onScroll={onScroll}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {children}
    </div>
  );
};

/**
 * The `Table` component and its subcomponents provide a highly composable, Bulma-styled table system for React.
 *
 * @function
 * @param {TableProps} props - Props for the Table component.
 * @returns {JSX.Element} The rendered table element.
 * @see {@link https://bulma.io/documentation/elements/table/ | Bulma Table documentation}
 */
const TableComponent: React.FC<TableProps> = ({
  className,
  isBordered,
  isStriped,
  isNarrow,
  isHoverable,
  isFullwidth,
  isFullWidth,
  isResponsive,
  children,
  ...props
}) => {
  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  const bulmaClasses = usePrefixedClassNames('table', {
    'is-bordered': isBordered,
    'is-striped': isStriped,
    'is-narrow': isNarrow,
    'is-hoverable': isHoverable,
    'is-fullwidth': isFullwidth ?? isFullWidth,
  });

  const containerClass = usePrefixedClassNames('table-container');
  const tableClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

  const tableElement = (
    <table className={tableClasses} {...rest}>
      {children}
    </table>
  );

  if (isResponsive) {
    return (
      <TableContainer
        className={containerClass}
        ariaLabel={rest['aria-label']}
        ariaLabelledby={rest['aria-labelledby']}
      >
        {tableElement}
      </TableContainer>
    );
  }

  return tableElement;
};

export const Table = withSubComponents(
  TableComponent,
  {
    Thead,
    Tbody,
    Tfoot,
    Tr,
    Th,
    Td,
  },
  'Table'
);
