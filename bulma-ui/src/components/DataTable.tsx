import React, { forwardRef, useEffect, useId, useState } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { warnOnce } from '../helpers/devWarnings';
import { visuallyHidden } from '../helpers/statusRegion';
import { Table } from '../elements/Table';
import { Thead } from '../elements/Thead';
import { Tbody } from '../elements/Tbody';
import { Tr, TrProps } from '../elements/Tr';
import { Th } from '../elements/Th';
import { Td } from '../elements/Td';
import { Skeleton } from '../elements/Skeleton';
import { Checkbox } from '../form/Checkbox';
import { Input } from '../form/Input';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';
import { ScrollArea } from './ScrollArea';
import {
  isFiltering,
  useDataTable,
  type DataTableColumn,
  type DataTableFilters,
  type DataTableModel,
  type DataTableStateOptions,
} from './useDataTable';

export { useDataTable } from './useDataTable';
export type {
  DataTableCSVOptions,
  DataTableCellContext,
  DataTableCellProps,
  DataTableCheckboxProps,
  DataTableColumn,
  DataTableColumnMeta,
  DataTableFilters,
  DataTableHeaderCellProps,
  DataTableLabels,
  DataTableModel,
  DataTablePaginationProps,
  DataTableResolvedLabels,
  DataTableRowScope,
  DataTableSearchProps,
  DataTableSelectionMode,
  DataTableSort,
  DataTableSortButtonProps,
  DataTableSortDirection,
  DataTableState,
  DataTableStateOptions,
  UseDataTableOptions,
} from './useDataTable';

/**
 * Props for the DataTable component. The helper props, `className`, the
 * `ref` and the other attributes go on the wrapper `<div>`, which holds the
 * toolbar, the table and the pager. `aria-label` and `aria-labelledby` name
 * the `<table>` itself.
 *
 * @extraProp {string} [aria-label] - Names the table, in place of a `caption`. A table needs a name, so pass a `caption`, this or `aria-labelledby`, and a development build warns when it has none.
 * @extraProp {string} [aria-labelledby] - The id of a visible heading that names the table, in place of a `caption`.
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the wrapper `<div>`.
 */
export interface DataTableProps<TRow>
  extends
    DataTableStateOptions<TRow>,
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /**
   * The columns, in the order they're shown. Required unless `table` is
   * given. Keep the array the same from one render to the next, defined
   * outside the component or in `useMemo`: a new one has every cell's text
   * worked out again.
   */
  columns?: DataTableColumn<TRow>[];
  /** The rows, as records of your own. Required unless `table` is given. */
  data?: TRow[];
  /**
   * A table made by `useDataTable`, rendered in place of one made from
   * `columns`, `data` and the state props, which are then left unread. Use
   * it to put a toolbar, a count or an export button elsewhere on the page.
   */
  table?: DataTableModel<TRow>;
  /**
   * Names the table, as a visible `<caption>`. A table needs a name: this,
   * `aria-label` or `aria-labelledby`.
   */
  caption?: React.ReactNode;
  /** Adds borders to all cells. */
  isBordered?: boolean;
  /** Adds zebra-striping to rows. */
  isStriped?: boolean;
  /** Makes the table more compact by cutting cell padding in half. */
  isNarrow?: boolean;
  /** Adds a hover effect on rows. */
  isHoverable?: boolean;
  /** Makes the table span the full width of its wrapper. */
  isFullwidth?: boolean;
  /**
   * Scrolls a table wider than its wrapper sideways, in a `ScrollArea`
   * named after the table, which can be scrolled from the keyboard while it
   * overflows.
   */
  isResponsive?: boolean;
  /** Shows a search field in the toolbar, labelled by `labels.search`. */
  hasSearch?: boolean;
  /**
   * More of the toolbar, after the search field: buttons for the selected
   * rows, a filter, a download. Given the table.
   */
  toolbar?: (table: DataTableModel<TRow>) => React.ReactNode;
  /**
   * Shows a page of skeleton rows under the header in place of the rows,
   * and marks the table busy. For data on its way, as from a server with
   * `manual`.
   */
  loading?: boolean;
  /**
   * What the table shows when it has no rows at all, in one cell across
   * every column. A small `EmptyState` saying `labels.empty` by default. A
   * title of your own sits under the heading the table does, so give it the
   * next level down with `titleAs`.
   */
  empty?: React.ReactNode;
  /**
   * What the table shows when the search and filters let no row through, in
   * one cell across every column. A small `EmptyState` saying
   * `labels.noResults` by default. A button that clears the search goes
   * away with it, so send focus back to the search field when it's pressed.
   */
  noResults?: React.ReactNode;
  /**
   * Props of your own for a row's `Tr`, such as a handler or a class. The
   * table's own (`isSelected`) win. To wrap a row in a `ContextMenu`, build
   * the table from `useDataTable`'s props instead.
   */
  rowProps?: (row: TRow) => DataTableRowProps;
  /** Additional CSS classes, on the wrapper `<div>`. */
  className?: string;
}

/** What `rowProps` gives a row's `Tr`: any of its props but the ones the table sets. */
export type DataTableRowProps = Omit<TrProps, 'isSelected' | 'children'>;

/** The type of `DataTable`, generic in the row. */
export type DataTableComponent = (<TRow>(
  props: DataTableProps<TRow> & React.RefAttributes<HTMLDivElement>
) => React.ReactElement | null) & { displayName?: string };

/** How long the status region waits after a change before it speaks, in ms. */
const statusDelay = 500;

const noColumns: never[] = [];
const noRows: never[] = [];

/** A text signature of the search and the filters, to tell when they change. */
function filterSignature(search: string, filters: DataTableFilters): string {
  try {
    return JSON.stringify([search, Object.entries(filters).sort()]);
  } catch {
    return search;
  }
}

/** Whether a node renders something. */
const isShown = (node: React.ReactNode) =>
  node !== undefined && node !== null && node !== false && node !== '';

/**
 * The `DataTable` component is a table of records that people can sort,
 * search, page through and select rows from, rendered with bestax's own
 * `Table` parts, `Checkbox` and `Pagination`.
 *
 * It's a native table, as in the WAI-ARIA Authoring Practices' sortable
 * table: a sortable header holds a button, the sorted one carries
 * `aria-sort`, and each row's checkbox is named for the row. It runs on
 * `useDataTable`, which custom markup can use too.
 *
 * @example
 * <DataTable
 *   caption="Users"
 *   columns={[
 *     { id: 'name', header: 'Name', sortable: true, isRowHeader: true },
 *     { id: 'role', header: 'Role', sortable: true },
 *   ]}
 *   data={users}
 *   selectionMode="multiple"
 *   pageSize={10}
 *   hasSearch
 * />
 */
export const DataTable = forwardRef(function DataTableRender<TRow>(
  {
    columns,
    data,
    table: given,
    getRowId,
    sort,
    defaultSort,
    onSortChange,
    selectionMode,
    selected,
    defaultSelected,
    onSelectedChange,
    pageSize,
    page,
    defaultPage,
    onPageChange,
    search,
    defaultSearch,
    onSearchChange,
    filters,
    defaultFilters,
    onFiltersChange,
    manual,
    rowCount,
    labels,
    caption,
    isBordered,
    isStriped,
    isNarrow,
    isHoverable,
    isFullwidth,
    isResponsive,
    hasSearch,
    toolbar,
    loading,
    empty,
    noResults,
    rowProps,
    className,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    ...props
  }: DataTableProps<TRow>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const own = useDataTable<TRow>({
    columns: columns ?? noColumns,
    data: data ?? noRows,
    getRowId,
    sort,
    defaultSort,
    onSortChange,
    selectionMode,
    selected,
    defaultSelected,
    onSelectedChange,
    pageSize,
    page,
    defaultPage,
    onPageChange,
    search,
    defaultSearch,
    onSearchChange,
    filters,
    defaultFilters,
    onFiltersChange,
    manual,
    rowCount,
    labels,
  });
  const table = given ?? own;
  const { state } = table;

  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const rootClass = classNames(
    usePrefixedClassNames('data-table'),
    bulmaHelperClasses,
    className
  );
  const toolbarClass = usePrefixedClassNames('data-table-toolbar');
  const actionsClass = usePrefixedClassNames('data-table-actions');
  const emptyClass = usePrefixedClassNames('data-table-empty');

  const nameId = useId();
  const hasCaption = isShown(caption);
  const named = hasCaption || Boolean(ariaLabel || ariaLabelledby);
  useEffect(() => {
    if (!named) {
      warnOnce(
        'DataTable:unnamed',
        '[bestax-bulma] <DataTable> has no accessible name. Pass a caption, ' +
          'aria-label or aria-labelledby, so a screen reader can say which ' +
          'table it is in.'
      );
    }
  }, [named]);
  const mixed = Boolean(given) && Boolean(columns || data);
  const bare = !given && (!columns || !data);
  useEffect(() => {
    if (mixed) {
      warnOnce(
        'DataTable:table-and-columns',
        '[bestax-bulma] <DataTable> was given a `table` and `columns` or ' +
          '`data` too. It renders the `table` and leaves the rest unread, so ' +
          'pass those to useDataTable instead.'
      );
    }
    if (bare) {
      warnOnce(
        'DataTable:no-data',
        '[bestax-bulma] <DataTable> needs `columns` and `data`, or a `table` ' +
          'from useDataTable.'
      );
    }
  }, [mixed, bare]);

  // The status region speaks only after the search, a filter or the page
  // changes, so nothing is read out as the page loads. `kind` is what last
  // changed, kept beside the values it changed from.
  const signature = filterSignature(state.search, state.filters);
  const [last, setLast] = useState({
    signature,
    page: state.page,
    kind: null as 'results' | 'page' | null,
  });
  if (last.signature !== signature) {
    setLast({ signature, page: state.page, kind: 'results' });
  } else if (last.page !== state.page) {
    setLast({ signature, page: state.page, kind: 'page' });
  }
  const { labels: words, rowCount: total, pageCount } = table;
  const size = state.pageSize;
  let message = '';
  if (last.kind && loading) {
    message = words.loading;
  } else if (last.kind === 'results' || (last.kind === 'page' && !total)) {
    message = words.results(total);
  } else if (last.kind === 'page') {
    // Without a page size, as when it's just been taken away, there's one
    // page, holding every row.
    const per = size ?? total;
    message = words.pageRange(
      (state.page - 1) * per + 1,
      Math.min(state.page * per, total),
      total
    );
  }
  // Written a moment after it changes, so typing in the search is read out
  // once it pauses rather than at every keystroke.
  const [said, setSaid] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSaid(message), statusDelay);
    return () => clearTimeout(timer);
  }, [message]);

  const selectable = table.selectionMode === 'multiple';
  const sortable = table.columns.some(column => column.sortable);
  const columnCount = table.columns.length + (selectable ? 1 : 0);
  const pageRows = table.getRows('page');
  const selectAll = table.getSelectAllProps();

  const captionNode = hasCaption ? (
    <caption>
      <span id={nameId}>{caption}</span>
      {sortable && <span style={visuallyHidden}>{`, ${words.sortHint}.`}</span>}
    </caption>
  ) : sortable ? (
    <caption>
      <span style={visuallyHidden}>{words.sortHint}</span>
    </caption>
  ) : null;

  const header = (
    <Thead>
      <Tr>
        {selectable && (
          <Th scope="col" isNarrow>
            <Checkbox
              {...selectAll}
              // While loading, the rows it would select aren't on screen.
              disabled={selectAll.disabled || Boolean(loading)}
            />
          </Th>
        )}
        {table.columns.map(column => (
          <Th key={column.id} {...table.getHeaderCellProps(column)}>
            {column.sortable ? (
              <button {...table.getSortButtonProps(column)}>
                {column.header}
              </button>
            ) : (
              column.header
            )}
          </Th>
        ))}
      </Tr>
    </Thead>
  );

  let body: React.ReactNode;
  if (loading) {
    body = Array.from({ length: size ?? 5 }, (_, index) => (
      <Tr key={index} aria-hidden="true">
        {Array.from({ length: columnCount }, (__, cell) => (
          <Td key={cell}>
            <Skeleton variant="lines" lines={1} />
          </Td>
        ))}
      </Tr>
    ));
  } else if (pageRows.length === 0) {
    // With `manual`, no rows under a search or a filter is no match: only
    // the server knows whether there's anything else.
    const nothing =
      table.getRows('all').length === 0 &&
      !(table.manual && isFiltering(state.search, state.filters));
    const content = nothing
      ? isShown(empty)
        ? empty
        : empty === undefined && (
            <EmptyState size="small" description={words.empty} />
          )
      : isShown(noResults)
        ? noResults
        : noResults === undefined && (
            <EmptyState size="small" description={words.noResults} />
          );
    body = (
      <Tr>
        <Td colSpan={columnCount} className={emptyClass}>
          {content}
        </Td>
      </Tr>
    );
  } else {
    body = pageRows.map(row => {
      const rowId = table.getRowId(row);
      return (
        <Tr key={rowId} {...rowProps?.(row)} {...table.getRowProps(row)}>
          {selectable && (
            <Td isNarrow>
              <Checkbox {...table.getSelectRowProps(row)} />
            </Td>
          )}
          {table.columns.map(column => {
            const text = table.getText(row, column.id);
            const content = column.cell
              ? column.cell(row, {
                  value: table.getValue(row, column.id),
                  text,
                  rowId,
                })
              : text;
            const cellProps = table.getCellProps(row, column);
            return column.isRowHeader ? (
              <Th key={column.id} {...cellProps}>
                {content}
              </Th>
            ) : (
              <Td key={column.id} {...cellProps}>
                {content}
              </Td>
            );
          })}
        </Tr>
      );
    });
  }

  const tableElement = (
    <Table
      isBordered={isBordered}
      isStriped={isStriped}
      isNarrow={isNarrow}
      isHoverable={isHoverable}
      isFullwidth={isFullwidth}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      aria-busy={loading || undefined}
    >
      {captionNode}
      {header}
      <Tbody>{body}</Tbody>
    </Table>
  );

  // The name the scroll area and the pager take from the table.
  const textName =
    ariaLabel || (typeof caption === 'string' ? caption : undefined);
  const scrollName = ariaLabel
    ? { 'aria-label': ariaLabel }
    : {
        'aria-labelledby': ariaLabelledby || (hasCaption ? nameId : undefined),
      };

  // Pagination names itself "pagination" unless given another name.
  const pagerLabel =
    words.pagination || (textName ? `${textName} pages` : undefined);
  const pagerName = pagerLabel ? { 'aria-label': pagerLabel } : {};

  const toolbarContent = toolbar?.(table);
  const hasToolbar = hasSearch || isShown(toolbarContent);

  return (
    <div ref={ref} className={rootClass} {...rest}>
      {hasToolbar && (
        <div className={toolbarClass}>
          {hasSearch && (
            <Input label={words.search} {...table.getSearchProps()} />
          )}
          {isShown(toolbarContent) && (
            <div className={actionsClass}>{toolbarContent}</div>
          )}
        </div>
      )}
      {isResponsive ? (
        <ScrollArea orientation="horizontal" {...scrollName}>
          {tableElement}
        </ScrollArea>
      ) : (
        tableElement
      )}
      {/* In the page from the start, so a change to it is announced. */}
      <div role="status" aria-live="polite" style={visuallyHidden}>
        {said}
      </div>
      {pageCount > 1 && (
        <Pagination {...table.getPaginationProps()} {...pagerName} />
      )}
    </div>
  );
}) as DataTableComponent;

DataTable.displayName = 'DataTable';

export default DataTable;
