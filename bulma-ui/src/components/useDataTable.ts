import React, { useCallback, useMemo, useRef, useState } from 'react';
import { prefixedClassNames } from '../helpers/classNames';
import { useClassPrefix } from '../helpers/Config';
import { isDev, warnOnce } from '../helpers/devWarnings';
import { useLocale } from '../helpers/LocaleProvider';
import { useLocaleMatcher, useNumberFormat } from '../helpers/localeFormat';
import { useClientLayoutEffect } from '../helpers/useClientLayoutEffect';
import { useLatestRef } from '../helpers/useLatestRef';
import type { TableAlignment } from '../elements/tableAlignment';

/**
 * Carries a row type and adds nothing, so `DataTableColumnMeta` can take the
 * row type for the fields an add-on merges in while it has none of its own.
 */
type CarriesRow<TRow> = { [K in never]?: TRow };

/**
 * Options of its own an add-on gives a column, read from the column's
 * `meta`. Empty in bestax: an add-on, such as a spreadsheet exporter, adds
 * its fields by declaration merging, and every column then takes them. Every
 * declaration of it names the row type the same way, `TRow`.
 *
 * @example
 * declare module '@allxsmith/bestax-bulma' {
 *   interface DataTableColumnMeta<TRow> {
 *     exportValue?: (row: TRow) => string | number;
 *   }
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- empty so an add-on can merge into it
export interface DataTableColumnMeta<TRow = unknown> extends CarriesRow<TRow> {}

/** What a column's `cell` is given beside the row. */
export interface DataTableCellContext {
  /** The column's raw value for the row, from its `accessor`. */
  value: unknown;
  /** The column's text for the row, from its `format`. */
  text: string;
  /** The row's id, from `getRowId`. */
  rowId: string;
}

/**
 * One column of a DataTable. A column keeps three things apart: its raw
 * value (`accessor`), which sorting and `filterFn` read; its text
 * (`format`), which the cell shows, the search matches and an export
 * writes; and its rich content (`cell`), which only the screen sees.
 */
export interface DataTableColumn<TRow> {
  /**
   * Names the column for good: the sort, the filters and an export refer to
   * it by this id. Unique within the table, and stable across renders.
   */
  id: string;
  /**
   * The column's name, as text: the header, the sort button's name, the
   * row checkboxes' names when it's the row header, and the header an
   * export writes.
   */
  header: string;
  /**
   * The raw value, for sorting and filtering: a key of the row, or a
   * function of it. Left out, it's the row's property named `id`.
   */
  accessor?: keyof TRow | ((row: TRow) => unknown);
  /**
   * The text for the value: what the cell shows when there's no `cell`, what
   * the search matches, and what an export writes. Left out, it's the value
   * as a string, and nothing for `null` or `undefined`. Give one for
   * numbers and dates you want written a certain way.
   */
  format?: (value: unknown, row: TRow) => string;
  /**
   * Rich content for the cell, such as a tag or a link. Only the screen
   * reads it: sorting, the search and an export use the value and its text.
   */
  cell?: (row: TRow, context: DataTableCellContext) => React.ReactNode;
  /**
   * Makes the header a button that sorts by this column: ascending, then
   * descending, then unsorted.
   */
  sortable?: boolean;
  /** Sorts descending on the first press, for a column read from the top, such as a score. */
  sortDescFirst?: boolean;
  /**
   * Compares two rows for an ascending sort, returning a negative number,
   * zero or a positive one. Descending reverses it. Without it, numbers,
   * dates and booleans compare by value, anything else by its text in the
   * `LocaleProvider`'s locale with numbers inside it read as numbers ("Item
   * 9" before "Item 10"), and an empty value goes last either way.
   */
  sortFn?: (a: TRow, b: TRow) => number;
  /**
   * Whether the column takes part in filtering: the search matches its
   * text, and `filters` can hold a value for it. `false` leaves it out of
   * both, as for a column of actions.
   */
  filterable?: boolean;
  /**
   * Decides whether a row passes this column's value in `filters`. Without
   * it, the column's text has to contain the value's text, compared as the
   * search compares.
   */
  filterFn?: (row: TRow, filterValue: unknown) => boolean;
  /** Aligns the header and the cells (`isAligned` on `Th` and `Td`). */
  align?: TableAlignment;
  /** The column's width, on its header cell: a number is pixels, a string any CSS length. */
  width?: string | number;
  /**
   * Renders this column's cells as row headers (`th scope="row"`), which a
   * screen reader reads out with the other cells of the row. The row's
   * checkbox is named from it. Mark one column, usually the first.
   */
  isRowHeader?: boolean;
  /** Options of an add-on's own, as `DataTableColumnMeta` declares them. */
  meta?: DataTableColumnMeta<TRow>;
}

/** The direction of a sort, in `aria-sort`'s words. */
export type DataTableSortDirection = 'ascending' | 'descending';

/** One column a DataTable sorts by. */
export interface DataTableSort {
  /** The column's `id`. */
  id: string;
  /** Which way it sorts. */
  direction: DataTableSortDirection;
}

/** The values per column `filters` holds, keyed by column `id`. */
export type DataTableFilters = Record<string, unknown>;

/**
 * Which of a table's rows to read: `all` of `data`, `filtered` (the ones the
 * search and the filters let through, from every page), the `page` shown,
 * or the `selected` ones the filters let through. Each comes in the order
 * the table shows them.
 */
export type DataTableRowScope = 'all' | 'filtered' | 'page' | 'selected';

/** Whether a DataTable has row checkboxes. */
export type DataTableSelectionMode = 'none' | 'multiple';

/**
 * The words a DataTable writes. Each is English unless you give your own,
 * and the numbers in the default messages are written in the
 * `LocaleProvider`'s locale.
 */
export interface DataTableLabels {
  /**
   * The header checkbox's name. "Select all rows", or "Select all rows on
   * this page" when there's more than one page, since it then covers the
   * page shown.
   */
  selectAll?: string;
  /** A row checkbox's name, from the row's label (`label => 'Select ' + label`). */
  selectRow?: (rowLabel: string) => string;
  /**
   * Says that headers with buttons sort: hidden at the end of the caption,
   * after a comma, or as a hidden caption of its own. "column headers with
   * buttons are sortable".
   */
  sortHint?: string;
  /** The search field's label. "Search". */
  search?: string;
  /** Announced after the search or a filter changes ("12 rows match"). */
  results?: (count: number) => string;
  /** Announced after the page changes ("Showing 11 to 20 of 57"). */
  pageRange?: (first: number, last: number, total: number) => string;
  /** Announced while `loading`, once the search, a filter or the page has changed. "Loading". */
  loading?: string;
  /**
   * The pager's name. "{the table's name} pages" when the table is named by
   * `aria-label` or a text `caption`, so two tables' pagers have different
   * names, else `Pagination`'s own.
   */
  pagination?: string;
  /** What the table shows with no rows at all. "No rows to show." */
  empty?: string;
  /** What the table shows when the search and filters let no row through. "No rows match." */
  noResults?: string;
}

/** The words a DataTable writes, with every default filled in. */
export interface DataTableResolvedLabels extends Required<
  Omit<DataTableLabels, 'pagination'>
> {
  /** The pager's name, when one was given. */
  pagination?: string;
}

/**
 * The options `useDataTable` and `DataTable` share, beside the columns and
 * the data. Each piece of state is yours when you pass its value (and its
 * `on…Change`), or the table's own, starting from its `default…`.
 */
export interface DataTableStateOptions<TRow> {
  /**
   * A row's id, unique and stable, which the selection is a list of. Left
   * out, it's the row's `id` property as a string. A development build
   * warns about a missing or repeated id, and a row with none falls back to
   * its index, which doesn't survive the data changing.
   */
  getRowId?: (row: TRow, index: number) => string;
  /**
   * The sort when you hold it: an array of `{ id, direction }`, the first
   * deciding and each next one breaking ties. The headers set one at a time.
   */
  sort?: DataTableSort[];
  /**
   * The sort to start with when the table holds it. Text sorts in the
   * `LocaleProvider`'s locale, or the runtime's own outside one, which can
   * differ between a server and the browser, so put a table rendered on the
   * server sorted inside a `LocaleProvider`.
   */
  defaultSort?: DataTableSort[];
  /** Called with the new sort when a header is pressed. */
  onSortChange?: (sort: DataTableSort[]) => void;
  /**
   * `multiple` adds a checkbox to each row and a "select all" checkbox to the header.
   *
   * @defaultValue 'none'
   */
  selectionMode?: DataTableSelectionMode;
  /**
   * The selected rows' ids when you hold them. They stay selected while the
   * search, a filter or the page hides them.
   */
  selected?: string[];
  /** The rows selected to begin with, by id, when the table holds them. */
  defaultSelected?: string[];
  /** Called with every selected id after a checkbox changes. */
  onSelectedChange?: (selected: string[]) => void;
  /** Rows per page. Set, the table pages through `Pagination`; left out, it shows every row. */
  pageSize?: number;
  /**
   * The page shown when you hold it, counting from 1. A page past the end
   * shows the last.
   */
  page?: number;
  /**
   * The page to start on when the table holds it.
   *
   * @defaultValue 1
   */
  defaultPage?: number;
  /**
   * Called with the page chosen in the pager, and with 1 when the search or
   * a filter changes through the table while the page held isn't 1, even
   * when a page past the end shows as the last.
   */
  onPageChange?: (page: number) => void;
  /**
   * The search when you hold it, matched against every filterable column's
   * text: in the `LocaleProvider`'s locale, ignoring case and the accents
   * the language ignores, or a case-insensitive substring outside one.
   */
  search?: string;
  /** The search to start with when the table holds it. */
  defaultSearch?: string;
  /** Called with the search as it changes through the table. */
  onSearchChange?: (search: string) => void;
  /**
   * A value per column, by `id`, when you hold them. A row passes when every
   * column with a value passes it: the column's `filterFn` if it has one,
   * given the value as it is, or else the column's text has to contain the
   * value's text, compared as the search compares. An array is a choice of
   * values, as a multiple-choice filter gives, and passes a row whose text
   * contains any of them. A value of `undefined`, `null`, `''` or an empty
   * array is no filter.
   */
  filters?: DataTableFilters;
  /** The filters to start with when the table holds them. */
  defaultFilters?: DataTableFilters;
  /** Called with every filter value after one changes through the table. */
  onFiltersChange?: (filters: DataTableFilters) => void;
  /**
   * Hands sorting, filtering and paging to a server: the table shows `data`
   * as given, as the current page, and only reports the state as it
   * changes.
   */
  manual?: boolean;
  /**
   * With `manual`, how many rows match in all, which sets the page count and
   * the announced count. Without it, the table counts the rows in `data`,
   * which with a `pageSize` is one page and no pager, and a development
   * build warns.
   */
  rowCount?: number;
  /** The words the table writes, in your app's language. */
  labels?: DataTableLabels;
}

/** What `useDataTable` takes. */
export interface UseDataTableOptions<TRow> extends DataTableStateOptions<TRow> {
  /**
   * The columns, in the order they're shown. Keep the array the same from
   * one render to the next, defined outside the component or in `useMemo`:
   * a new one has every cell's text worked out again.
   */
  columns: DataTableColumn<TRow>[];
  /** The rows, as records of your own. */
  data: TRow[];
}

/** The table's state, as it stands. */
export interface DataTableState {
  /** The sort, the first entry deciding. */
  sort: DataTableSort[];
  /** The selected rows' ids. */
  selected: string[];
  /** The page shown, counting from 1. */
  page: number;
  /** Rows per page, or `undefined` when it doesn't page. */
  pageSize: number | undefined;
  /** The search. */
  search: string;
  /** The filter values, by column id. */
  filters: DataTableFilters;
}

/** The props `getSortButtonProps` gives a header's `<button>`. */
export interface DataTableSortButtonProps {
  type: 'button';
  className: string;
  onClick: () => void;
}

/** The props `getSearchProps` gives a search `<input>` or bestax `Input`. */
export interface DataTableSearchProps {
  type: 'search';
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/** The props `getHeaderCellProps` gives a column's `Th`. */
export interface DataTableHeaderCellProps {
  scope: 'col';
  'aria-sort'?: DataTableSortDirection;
  isAligned?: TableAlignment;
  width?: string | number;
}

/** The props `getCellProps` gives a row's `Td`, or its `Th` for the row header. */
export interface DataTableCellProps {
  scope?: 'row';
  isAligned?: TableAlignment;
}

/** The props `getSelectAllProps` and `getSelectRowProps` give a `Checkbox`. */
export interface DataTableCheckboxProps {
  'aria-label': string;
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange: () => void;
}

/** The props `getPaginationProps` gives `Pagination`. */
export interface DataTablePaginationProps {
  total: number;
  current: number;
  onPageChange: (page: number) => void;
}

/** What `toCSV` writes. */
export interface DataTableCSVOptions {
  /**
   * Which rows, in the order the table shows them: the ones the search and
   * filters let through, from every page, by default, or `all`, `page` or
   * `selected`.
   *
   * @defaultValue 'filtered'
   */
  rows?: DataTableRowScope;
  /** The ids of the columns to write, in that order. Every column, in the order shown, by default. */
  columns?: string[];
  /**
   * Writes the columns' headers as the first line.
   *
   * @defaultValue true
   */
  header?: boolean;
  /**
   * What separates the fields. A semicolon suits a spreadsheet that reads
   * a comma as the decimal point, as Excel does in much of Europe.
   *
   * @defaultValue ','
   */
  delimiter?: string;
}

/**
 * A table: what `useDataTable` returns, what `DataTable`'s `toolbar` is
 * given, and what its `table` takes. It reads the rows and the state, changes
 * the state, and hands out props for bestax's own `Th`, `Tr`, `Td`,
 * `Checkbox` and `Pagination`, so markup of your own behaves as DataTable's
 * does.
 */
export interface DataTableModel<TRow> {
  /** The columns, in the order they're shown. */
  columns: DataTableColumn<TRow>[];
  /** The state as it stands. */
  state: DataTableState;
  /** Whether rows have checkboxes. */
  selectionMode: DataTableSelectionMode;
  /** Whether a server sorts, filters and pages (`manual`). */
  manual: boolean;
  /** How many rows the search and filters let through, or `rowCount` with `manual`. */
  rowCount: number;
  /** How many pages there are, at least 1. */
  pageCount: number;
  /** The words the table writes, with the defaults filled in. */
  labels: DataTableResolvedLabels;
  /** The rows in `scope` (`filtered` by default), in the order the table shows them. */
  getRows: (scope?: DataTableRowScope) => TRow[];
  /** A row's id. */
  getRowId: (row: TRow) => string;
  /** A column's raw value for a row, or `undefined` for a column it doesn't have. */
  getValue: (row: TRow, columnId: string) => unknown;
  /** A column's text for a row, or `''` for a column it doesn't have. */
  getText: (row: TRow, columnId: string) => string;
  /** What names a row: its row header's text, or its first column's. */
  getRowLabel: (row: TRow) => string;
  /**
   * The rows as CSV, from the columns' text (`format`, not `cell`), with a
   * line break of `\r\n` between rows and fields quoted as RFC 4180 asks.
   * A field that starts with `=`, `+`, `-`, `@`, a tab or a carriage return
   * gets a `'` in front, so a spreadsheet shows it as text rather than
   * running it as a formula, unless it's a plain number such as `-12.5`.
   * Excel takes a file as UTF-8 only when it starts with a byte order mark,
   * so put `\uFEFF` in front of the text when you save it for Excel.
   */
  toCSV: (options?: DataTableCSVOptions) => string;
  /** Whether a row is selected. */
  isSelected: (row: TRow) => boolean;
  /** Sets the sort. */
  setSort: (sort: DataTableSort[]) => void;
  /** Moves a column through its sort, as its header button does. */
  toggleSort: (columnId: string) => void;
  /** Sets the selected ids. */
  setSelected: (selected: string[]) => void;
  /**
   * Selects a row, or clears it, or with no `selected` flips it. Called
   * twice in one handler, the second call builds on the first while the
   * table holds the selection. While you hold it, each call builds on the
   * selection as rendered, so make several changes at once with
   * `setSelected`.
   */
  toggleRowSelected: (row: TRow, selected?: boolean) => void;
  /**
   * Selects every row on the page, or clears them, or with no `selected`
   * does what the header checkbox does. It builds on earlier calls as
   * `toggleRowSelected` does.
   */
  togglePageSelected: (selected?: boolean) => void;
  /** Goes to a page, counting from 1. */
  setPage: (page: number) => void;
  /**
   * Sets the search, and goes back to page 1, calling `onPageChange` with 1
   * unless the page held is 1 already.
   */
  setSearch: (search: string) => void;
  /**
   * Sets one column's filter value, and goes back to page 1. Called twice in
   * one handler, the second call builds on the first while the table holds
   * the filters. While you hold them, each call builds on the filters as
   * rendered, so set several at once with `setFilters`.
   */
  setFilter: (columnId: string, value: unknown) => void;
  /** Sets every filter value, and goes back to page 1, as `setSearch` does. */
  setFilters: (filters: DataTableFilters) => void;
  /** Props for a column's `Th`: its scope, its `aria-sort` while sorted, its alignment and width. */
  getHeaderCellProps: (
    column: DataTableColumn<TRow>
  ) => DataTableHeaderCellProps;
  /** Props for the `<button>` in a sortable column's header. */
  getSortButtonProps: (
    column: DataTableColumn<TRow>
  ) => DataTableSortButtonProps;
  /** Props for a row's `Tr`: Bulma's selected look while it's selected. */
  getRowProps: (row: TRow) => { isSelected: boolean };
  /** Props for a row's cell in a column: its alignment, and `scope="row"` for the row header. */
  getCellProps: (
    row: TRow,
    column: DataTableColumn<TRow>
  ) => DataTableCellProps;
  /** Props for the header's "select all" `Checkbox`, which covers the page shown. */
  getSelectAllProps: () => DataTableCheckboxProps;
  /** Props for a row's `Checkbox`, named for the row. */
  getSelectRowProps: (row: TRow) => DataTableCheckboxProps;
  /** Props for `Pagination`: the page count, the page and the handler. */
  getPaginationProps: () => DataTablePaginationProps;
  /** Props for a search field, bound to the search. */
  getSearchProps: () => DataTableSearchProps;
}

/** A column's raw value for a row. */
function readValue<TRow>(column: DataTableColumn<TRow>, row: TRow): unknown {
  const { accessor } = column;
  if (typeof accessor === 'function') return accessor(row);
  if (row === null || typeof row !== 'object') return undefined;
  return (row as Record<PropertyKey, unknown>)[
    (accessor ?? column.id) as PropertyKey
  ];
}

/** A column's text for a row. */
function readText<TRow>(column: DataTableColumn<TRow>, row: TRow): string {
  const value = readValue(column, row);
  if (column.format) return column.format(value, row);
  return value === null || value === undefined ? '' : String(value);
}

/** Whether a value sorts as empty: nothing, no text, or no number or date. */
function isEmptyValue(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (typeof value === 'number' && Number.isNaN(value)) ||
    (value instanceof Date && Number.isNaN(value.getTime()))
  );
}

/** Compares two values that aren't empty, for an ascending sort. */
function compareValues(a: unknown, b: unknown, collator: Intl.Collator) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return Number(a) - Number(b);
  }
  return collator.compare(String(a), String(b));
}

/** Whether a filter value filters anything. */
function isActiveFilter(value: unknown): boolean {
  return (
    value !== undefined &&
    value !== null &&
    value !== '' &&
    !(Array.isArray(value) && value.length === 0)
  );
}

/** A field a spreadsheet would read as the start of a formula. */
const formulaStart = /^[=+\-@\t\r]/;
/** A plain number, signed, with any grouping, which no spreadsheet runs. */
const plainNumber = /^[+-]?\d[\d.,]*$/;

/**
 * One CSV field: a `'` in front of what would start a formula, then quoted
 * when it holds the delimiter, a quote or a line break, its quotes doubled.
 */
function csvField(text: string, delimiter: string): string {
  const safe =
    formulaStart.test(text) && !plainNumber.test(text) ? `'${text}` : text;
  return safe.includes(delimiter) || /["\r\n]/.test(safe)
    ? `"${safe.replace(/"/g, '""')}"`
    : safe;
}

/**
 * Whether a search or a filter value is narrowing the rows. Used by
 * DataTable to tell an empty table from one with no matches.
 */
export function isFiltering(search: string, filters: DataTableFilters) {
  return search.trim() !== '' || Object.values(filters).some(isActiveFilter);
}

/** A row's id from its `id` property, or nothing when it has none. */
function idOf(row: unknown): string | undefined {
  if (row === null || typeof row !== 'object') return undefined;
  const id = (row as { id?: unknown }).id;
  return id === undefined || id === null || id === '' ? undefined : String(id);
}

/**
 * A piece of state that's the caller's when they pass its value, and the
 * table's own otherwise. Setting it calls the change handler either way.
 *
 * It also returns `latest`, what a change should build on. While the table
 * holds the state, that's the value last set, even before React renders it,
 * so two changes in one handler build on each other. While the caller holds
 * it, it's the value as rendered, since only the caller knows what it made
 * of a change.
 */
function useTableState<T>(
  value: T | undefined,
  initial: T,
  onChange: ((next: T) => void) | undefined
): [T, (next: T) => void, () => T] {
  const [own, setOwn] = useState(initial);
  const held = value !== undefined;
  const current = held ? value : own;
  const rendered = useLatestRef(current);
  // A value set since the last commit, cleared once a commit shows it.
  const pendingRef = useRef<{ value: T } | null>(null);
  useClientLayoutEffect(() => {
    pendingRef.current = null;
  });
  const set = useCallback(
    (next: T) => {
      if (!held) {
        pendingRef.current = { value: next };
        setOwn(next);
      }
      onChange?.(next);
    },
    [held, onChange]
  );
  const latest = useCallback(
    () => (pendingRef.current ? pendingRef.current.value : rendered.current),
    [rendered]
  );
  return [current, set, latest];
}

const noSort: DataTableSort[] = [];
const noIds: string[] = [];
const noFilters: DataTableFilters = {};

/**
 * `useDataTable` holds a table's sort, selection, page, search and filters,
 * works out its rows, and hands out props for bestax's own table parts, so
 * custom markup behaves as `DataTable` does. Pass its result to
 * `<DataTable table={table} />` to render it with DataTable's own markup,
 * with a toolbar or an export button elsewhere on the page.
 *
 * @example
 * const table = useDataTable({ columns, data: users, pageSize: 10 });
 *
 * <DataTable table={table} caption="Users" hasSearch />
 */
export function useDataTable<TRow>(
  options: UseDataTableOptions<TRow>
): DataTableModel<TRow> {
  const {
    columns,
    data,
    getRowId: rowIdOf,
    sort: sortProp,
    defaultSort = noSort,
    onSortChange,
    selectionMode = 'none',
    selected: selectedProp,
    defaultSelected = noIds,
    onSelectedChange,
    pageSize: pageSizeProp,
    page: pageProp,
    defaultPage = 1,
    onPageChange,
    search: searchProp,
    defaultSearch = '',
    onSearchChange,
    filters: filtersProp,
    defaultFilters = noFilters,
    onFiltersChange,
    manual = false,
    rowCount: rowCountProp,
    labels,
  } = options;

  const [sort, setSort] = useTableState(sortProp, defaultSort, onSortChange);
  const [selected, setSelected, latestSelected] = useTableState(
    selectedProp,
    defaultSelected,
    onSelectedChange
  );
  const [pageState, setPageState, latestPage] = useTableState(
    pageProp,
    defaultPage,
    onPageChange
  );
  const [search, setSearchState] = useTableState(
    searchProp,
    defaultSearch,
    onSearchChange
  );
  const [filters, setFiltersState, latestFilters] = useTableState(
    filtersProp,
    defaultFilters,
    onFiltersChange
  );

  const prefix = useClassPrefix();
  const { locale } = useLocale();
  const matchText = useLocaleMatcher();
  const formatNumber = useNumberFormat();
  const collator = useMemo(
    () => new Intl.Collator(locale, { numeric: true }),
    [locale]
  );

  const pageSize =
    pageSizeProp !== undefined &&
    Number.isFinite(pageSizeProp) &&
    pageSizeProp >= 1
      ? Math.floor(pageSizeProp)
      : undefined;

  const columnsById = useMemo(() => {
    const byId = new Map<string, DataTableColumn<TRow>>();
    for (const column of columns) {
      if (byId.has(column.id)) {
        warnOnce(
          'DataTable:duplicate-column',
          `[bestax-bulma] DataTable has two columns with the id "${column.id}". ` +
            'Give each column its own id: the sort, the filters and an export ' +
            'find a column by it.'
        );
      } else {
        byId.set(column.id, column);
      }
    }
    return byId;
  }, [columns]);

  // Each row's id, by its index in `data`.
  const ids = useMemo(() => {
    const out = data.map((row, index) => {
      const id = rowIdOf ? rowIdOf(row, index) : idOf(row);
      if (id === undefined || id === '') {
        warnOnce(
          'DataTable:missing-row-id',
          '[bestax-bulma] A DataTable row has no id, so it falls back to its ' +
            "index, which doesn't survive the data changing. Give each row " +
            'an `id`, or pass `getRowId`.'
        );
        return String(index);
      }
      return id;
    });
    if (isDev() && new Set(out).size < out.length) {
      warnOnce(
        'DataTable:duplicate-row-id',
        '[bestax-bulma] Two DataTable rows have the same id, so selecting ' +
          'one selects both. Make the ids unique, or pass a `getRowId` ' +
          'that does.'
      );
    }
    return out;
  }, [data, rowIdOf]);

  const indexOf = useMemo(() => {
    const map = new Map<TRow, number>();
    data.forEach((row, index) => {
      if (!map.has(row)) map.set(row, index);
    });
    return map;
  }, [data]);

  /** A row's id, from its index when the row is one of `data`. */
  const getRowId = useCallback(
    (row: TRow) => {
      const index = indexOf.get(row);
      if (index !== undefined) return ids[index];
      const id = rowIdOf ? rowIdOf(row, -1) : idOf(row);
      return id ?? '';
    },
    [indexOf, ids, rowIdOf]
  );

  // Every column's text for every row, worked out once per data and
  // columns, since the search reads them on every keystroke.
  const texts = useMemo(
    () => data.map(row => columns.map(column => readText(column, row))),
    [data, columns]
  );

  const sortedIndexes = useMemo(() => {
    const all = data.map((_, index) => index);
    if (manual) return all;
    const keys = sort
      .map(entry => ({
        column: columnsById.get(entry.id),
        descending: entry.direction === 'descending',
      }))
      .filter(
        (key): key is { column: DataTableColumn<TRow>; descending: boolean } =>
          key.column !== undefined
      );
    if (keys.length === 0) return all;
    const values = keys.map(({ column }) =>
      column.sortFn ? null : data.map(row => readValue(column, row))
    );
    return all.sort((x, y) => {
      for (let k = 0; k < keys.length; k++) {
        const { column, descending } = keys[k];
        let result: number;
        if (column.sortFn) {
          result = column.sortFn(data[x], data[y]);
          if (descending) result = -result;
        } else {
          const a = values[k]![x];
          const b = values[k]![y];
          const aEmpty = isEmptyValue(a);
          const bEmpty = isEmptyValue(b);
          if (aEmpty || bEmpty) {
            // Empty values go last whichever way the column sorts.
            result = Number(aEmpty) - Number(bEmpty);
          } else {
            result = compareValues(a, b, collator);
            if (descending) result = -result;
          }
        }
        if (result) return result;
      }
      // Ties keep the order of `data`.
      return x - y;
    });
  }, [data, sort, columnsById, collator, manual]);

  const filteredIndexes = useMemo(() => {
    if (manual) return sortedIndexes;
    const query = search.trim();
    const holds = matchText
      ? (text: string, needle: string) => matchText(text, needle)
      : (text: string, needle: string) =>
          text.toLowerCase().includes(needle.toLowerCase());
    const searched = columns
      .map((column, index) => ({ column, index }))
      .filter(({ column }) => column.filterable !== false);
    const filtered = Object.entries(filters)
      .filter(([, value]) => isActiveFilter(value))
      .map(([id, value]) => ({
        column: columnsById.get(id),
        index: columns.findIndex(column => column.id === id),
        value,
      }))
      .filter(
        ({ column }) => column !== undefined && column.filterable !== false
      );
    if (query === '' && filtered.length === 0) return sortedIndexes;
    return sortedIndexes.filter(rowIndex => {
      const row = data[rowIndex];
      const rowTexts = texts[rowIndex];
      for (const { column, index, value } of filtered) {
        // An array is any of its entries, as a multiple-choice filter gives.
        const passes = column!.filterFn
          ? column!.filterFn(row, value)
          : Array.isArray(value)
            ? value.some(entry => holds(rowTexts[index], String(entry)))
            : holds(rowTexts[index], String(value));
        if (!passes) return false;
      }
      return (
        query === '' ||
        searched.some(({ index }) => holds(rowTexts[index], query))
      );
    });
  }, [
    manual,
    sortedIndexes,
    search,
    filters,
    matchText,
    columns,
    columnsById,
    data,
    texts,
  ]);

  const knowsCount =
    rowCountProp !== undefined && Number.isFinite(rowCountProp);
  if (manual && pageSize !== undefined && !knowsCount) {
    warnOnce(
      'DataTable:manual-row-count',
      '[bestax-bulma] A DataTable with `manual` and a `pageSize` has no ' +
        '`rowCount`, so it counts only the rows in `data`, makes one page ' +
        'of them and shows no pager. Pass `rowCount`, how many rows match ' +
        'on the server.'
    );
  }
  const rowCount = manual
    ? Math.max(
        Math.floor(knowsCount ? (rowCountProp as number) : data.length),
        0
      )
    : filteredIndexes.length;
  const pageCount = pageSize ? Math.max(Math.ceil(rowCount / pageSize), 1) : 1;
  const page = Math.min(
    Math.max(Number.isFinite(pageState) ? Math.floor(pageState) : 1, 1),
    pageCount
  );

  const pageIndexes = useMemo(() => {
    if (manual || !pageSize) return filteredIndexes;
    return filteredIndexes.slice((page - 1) * pageSize, page * pageSize);
  }, [manual, pageSize, filteredIndexes, page]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const selectable = selectionMode === 'multiple';

  const rowsOf = useCallback(
    (indexes: number[]) => indexes.map(index => data[index]),
    [data]
  );

  const getRows = useCallback(
    (scope: DataTableRowScope = 'filtered') => {
      switch (scope) {
        case 'all':
          return rowsOf(sortedIndexes);
        case 'page':
          return rowsOf(pageIndexes);
        case 'selected':
          return rowsOf(
            filteredIndexes.filter(index => selectedSet.has(ids[index]))
          );
        default:
          return rowsOf(filteredIndexes);
      }
    },
    [rowsOf, sortedIndexes, pageIndexes, filteredIndexes, selectedSet, ids]
  );

  const getValue = useCallback(
    (row: TRow, columnId: string) => {
      const column = columnsById.get(columnId);
      return column ? readValue(column, row) : undefined;
    },
    [columnsById]
  );

  const getText = useCallback(
    (row: TRow, columnId: string) => {
      const column = columnsById.get(columnId);
      if (!column) return '';
      const index = indexOf.get(row);
      return index !== undefined
        ? texts[index][columns.indexOf(column)]
        : readText(column, row);
    },
    [columnsById, indexOf, columns, texts]
  );

  const labelColumn = columns.find(column => column.isRowHeader) ?? columns[0];
  const getRowLabel = useCallback(
    (row: TRow) =>
      (labelColumn && getText(row, labelColumn.id)) || getRowId(row),
    [labelColumn, getText, getRowId]
  );

  const isSelected = useCallback(
    (row: TRow) => selectable && selectedSet.has(getRowId(row)),
    [selectable, selectedSet, getRowId]
  );

  const setPage = useCallback(
    (next: number) => {
      if (next !== page) setPageState(next);
    },
    [page, setPageState]
  );

  // A new search or filter starts from the first page. It's measured against
  // the page as stored, not as shown: a page past the end shows the last,
  // and left stored it would come back once the rows grew again.
  const resetPage = useCallback(() => {
    if (latestPage() !== 1) setPageState(1);
  }, [latestPage, setPageState]);

  const setSearch = useCallback(
    (next: string) => {
      setSearchState(next);
      resetPage();
    },
    [setSearchState, resetPage]
  );

  const setFilters = useCallback(
    (next: DataTableFilters) => {
      setFiltersState(next);
      resetPage();
    },
    [setFiltersState, resetPage]
  );

  const setFilter = useCallback(
    (columnId: string, value: unknown) => {
      const next = { ...latestFilters() };
      if (isActiveFilter(value)) next[columnId] = value;
      else delete next[columnId];
      setFilters(next);
    },
    [latestFilters, setFilters]
  );

  const toggleSort = useCallback(
    (columnId: string) => {
      const column = columnsById.get(columnId);
      if (!column) return;
      const first: DataTableSortDirection = column.sortDescFirst
        ? 'descending'
        : 'ascending';
      const current = sort[0]?.id === columnId ? sort[0].direction : undefined;
      if (current === undefined) {
        setSort([{ id: columnId, direction: first }]);
      } else if (current === first) {
        setSort([
          {
            id: columnId,
            direction: first === 'ascending' ? 'descending' : 'ascending',
          },
        ]);
      } else {
        setSort([]);
      }
    },
    [columnsById, sort, setSort]
  );

  const toggleRowSelected = useCallback(
    (row: TRow, value?: boolean) => {
      const id = getRowId(row);
      const current = latestSelected();
      const has = current.includes(id);
      const on = value ?? !has;
      if (on === has) return;
      setSelected(on ? [...current, id] : current.filter(s => s !== id));
    },
    [getRowId, latestSelected, setSelected]
  );

  const pageIds = useMemo(
    () => pageIndexes.map(index => ids[index]),
    [pageIndexes, ids]
  );
  const pageSelectedCount = pageIds.filter(id => selectedSet.has(id)).length;
  const allPageSelected =
    pageIds.length > 0 && pageSelectedCount === pageIds.length;

  const togglePageSelected = useCallback(
    (value?: boolean) => {
      const current = latestSelected();
      const has = new Set(current);
      const on =
        value ?? !(pageIds.length > 0 && pageIds.every(id => has.has(id)));
      if (on) {
        const adding = pageIds.filter(id => !has.has(id));
        if (adding.length > 0) setSelected([...current, ...adding]);
      } else {
        const onPage = new Set(pageIds);
        const kept = current.filter(id => !onPage.has(id));
        if (kept.length !== current.length) setSelected(kept);
      }
    },
    [latestSelected, pageIds, setSelected]
  );

  const count = useCallback(
    (value: number) => (formatNumber ? formatNumber(value) : String(value)),
    [formatNumber]
  );

  const resolvedLabels: DataTableResolvedLabels = {
    selectAll:
      labels?.selectAll ||
      (pageCount > 1 ? 'Select all rows on this page' : 'Select all rows'),
    selectRow: labels?.selectRow ?? (label => `Select ${label}`),
    sortHint: labels?.sortHint || 'column headers with buttons are sortable',
    search: labels?.search || 'Search',
    results:
      labels?.results ??
      (total =>
        total === 0
          ? 'No rows match'
          : `${count(total)} ${total === 1 ? 'row matches' : 'rows match'}`),
    pageRange:
      labels?.pageRange ??
      ((first, last, total) =>
        `Showing ${count(first)} to ${count(last)} of ${count(total)}`),
    loading: labels?.loading || 'Loading',
    pagination: labels?.pagination || undefined,
    empty: labels?.empty || 'No rows to show.',
    noResults: labels?.noResults || 'No rows match.',
  };

  const toCSV = useCallback(
    ({
      rows = 'filtered',
      columns: ids,
      header = true,
      delimiter = ',',
    }: DataTableCSVOptions = {}) => {
      const written = ids
        ? ids
            .map(id => columnsById.get(id))
            .filter(
              (column): column is DataTableColumn<TRow> => column !== undefined
            )
        : columns;
      const line = (fields: string[]) =>
        fields.map(field => csvField(field, delimiter)).join(delimiter);
      const lines = getRows(rows).map(row =>
        line(written.map(column => getText(row, column.id)))
      );
      if (header) lines.unshift(line(written.map(column => column.header)));
      return lines.join('\r\n');
    },
    [columnsById, columns, getRows, getText]
  );

  const sortButtonClass = prefixedClassNames(prefix, 'data-table-sort');

  return {
    columns,
    state: { sort, selected, page, pageSize, search, filters },
    selectionMode,
    manual,
    rowCount,
    pageCount,
    labels: resolvedLabels,
    getRows,
    getRowId,
    getValue,
    getText,
    getRowLabel,
    toCSV,
    isSelected,
    setSort,
    toggleSort,
    setSelected,
    toggleRowSelected,
    togglePageSelected,
    setPage,
    setSearch,
    setFilter,
    setFilters,
    getHeaderCellProps: column => ({
      scope: 'col',
      'aria-sort': sort[0]?.id === column.id ? sort[0].direction : undefined,
      isAligned: column.align,
      width: column.width,
    }),
    getSortButtonProps: column => ({
      type: 'button',
      className: sortButtonClass,
      onClick: () => toggleSort(column.id),
    }),
    getRowProps: row => ({ isSelected: isSelected(row) }),
    getCellProps: (_row, column) => ({
      scope: column.isRowHeader ? 'row' : undefined,
      isAligned: column.align,
    }),
    getSelectAllProps: () => ({
      'aria-label': resolvedLabels.selectAll,
      checked: allPageSelected,
      indeterminate: pageSelectedCount > 0 && !allPageSelected,
      disabled: pageIds.length === 0,
      onChange: () => togglePageSelected(),
    }),
    getSelectRowProps: row => ({
      'aria-label': resolvedLabels.selectRow(getRowLabel(row)),
      checked: selectedSet.has(getRowId(row)),
      onChange: () => toggleRowSelected(row),
    }),
    getPaginationProps: () => ({
      total: pageCount,
      current: page,
      onPageChange: setPage,
    }),
    getSearchProps: () => ({
      type: 'search',
      value: search,
      onChange: event => setSearch(event.target.value),
    }),
  };
}
