---
title: DataTable
sidebar_label: DataTable
description: The `DataTable` component is a table of records that people can sort, search, page through and select rows from, rendered with bestax's own `Table` parts, `Checkbox` and `Pagination`.
---

# DataTable

## Overview

<!-- bestax:generated overview -->

The `DataTable` component is a table of records that people can sort, search, page through and select rows from, rendered with bestax's own `Table` parts, `Checkbox` and `Pagination`.

<!-- /bestax:generated overview -->

Reach for it for a list of records people work through: users, orders or invoices that they sort
by a column, search by name, page through, and pick rows from for an action. It's sometimes called
a data grid.

It renders bestax's own [`Table`](../elements/table.md) parts, with the table's modifiers
(`isStriped`, `isHoverable`, `isBordered`, `isNarrow`, `isFullwidth`), a
[`Checkbox`](../form/checkbox.md) per row and a [`Pagination`](./pagination.md) under the rows. It
sorts by one column, selects rows with checkboxes, pages, and filters by a search and by values per
column. Each of those is its own state, which the table keeps or you hold, and `manual` hands them
to a server. It writes what's shown as CSV too.

It runs on `useDataTable`, which is public. The hook returns the table: its rows, its state, and
props for bestax's `Th`, `Tr`, `Td`, `Checkbox` and `Pagination`, so markup of your own behaves the
same way, and `<DataTable table={table} />` renders a table the hook made, with a count or a button
anywhere on the page.

:::info
Bulma has the table and nothing that sorts it, so `DataTable` brings a few styles of its own, for
the sort buttons and the toolbar, in `bestax.css` and its variants, or in `extras.css` next to your
own Bulma. The rest is Bulma's table, checkbox and pagination.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { DataTable, useDataTable } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Give it `columns` and `data`. Each column has an `id`, which reads the row's property of that name
unless an `accessor` says otherwise, and a `header`, which is its name. `sortable` makes the header a
button, and `isRowHeader` makes a column's cells the row's header. A table needs a name: a `caption`
here, or an `aria-label` or `aria-labelledby`.

```tsx live
function example() {
  const users = [
    { id: 'u1', name: 'Ada Lovelace', role: 'Admin', score: 98 },
    { id: 'u2', name: 'Alan Turing', role: 'Editor', score: 95 },
    { id: 'u3', name: 'Grace Hopper', role: 'Viewer', score: 91 },
    { id: 'u4', name: 'Katherine Johnson', role: 'Admin', score: 90 },
  ];

  return (
    <DataTable
      caption="Users"
      columns={[
        { id: 'name', header: 'Name', sortable: true, isRowHeader: true },
        { id: 'role', header: 'Role', sortable: true },
        { id: 'score', header: 'Score', sortable: true, align: 'right' },
      ]}
      data={users}
      isStriped
      isHoverable
      isFullwidth
    />
  );
}
```

Pressing a header sorts ascending, then descending, then not at all. Each row is keyed by its
`id`, or by what `getRowId` returns for rows that name it something else.

The examples here write `columns` inline to keep them short. In an app, define them outside the
component, or in `useMemo`, so they're the same array from one render to the next: a new one has
every cell's text worked out again.

### Values, Text and Content

A column keeps three things apart. `accessor` is the raw value, a key of the row or a function, and
it's what sorting compares. `format` turns the value into text, which the cell shows, the search
matches and an export writes. `cell` is rich content for the screen only, such as
a tag or a link, and nothing else reads it.

```tsx live
import type { DataTableColumn } from '@allxsmith/bestax-bulma';

function example() {
  type Order = { id: string; customer: string; total: number; placed: string };
  const orders: Order[] = [
    {
      id: 'A-1041',
      customer: 'Ada Lovelace',
      total: 1249.5,
      placed: '2026-10-02',
    },
    { id: 'A-1042', customer: 'Alan Turing', total: 89, placed: '2026-10-14' },
    {
      id: 'A-1043',
      customer: 'Grace Hopper',
      total: 405.25,
      placed: '2026-09-28',
    },
  ];
  const columns: DataTableColumn<Order>[] = [
    {
      id: 'id',
      header: 'Order',
      isRowHeader: true,
      cell: row => <a href={`#order-${row.id}`}>{row.id}</a>,
    },
    { id: 'customer', header: 'Customer', sortable: true },
    {
      id: 'total',
      header: 'Total',
      sortable: true,
      align: 'right',
      format: value =>
        (value as number).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        }),
    },
    {
      id: 'placed',
      header: 'Placed',
      sortable: true,
      sortDescFirst: true,
      cell: (_row, { text }) => <Tag>{text}</Tag>,
    },
  ];

  return (
    <DataTable caption="Orders" columns={columns} data={orders} isFullwidth />
  );
}
```

Sorting by Total compares the numbers, not the text, so $1,249.50 sorts above $405.25.
`sortDescFirst` starts a column descending, which suits dates and scores read from the top.

### Sorting

Numbers, dates and booleans compare by value. Anything else compares as text in the
`LocaleProvider`'s locale, with the numbers inside it read as numbers, so "Item 9" comes before
"Item 10". An empty value goes last whichever way the column sorts. `sortFn` takes over for a column
that sorts some other way, comparing two rows for an ascending sort.

`defaultSort` starts the table sorted. A sort is a list of `{ id, direction }`, so `sort` and
`onSortChange` hold it as one, the first entry deciding. The headers set one column at a time.

```tsx live
function example() {
  const priorities = ['Low', 'Medium', 'High', 'Urgent'];
  const tickets = [
    { id: 't1', title: 'Item 10: Login loops', priority: 'High' },
    { id: 't2', title: 'Item 9: Export is empty', priority: 'Urgent' },
    { id: 't3', title: 'Item 2: Typo on Pricing', priority: 'Low' },
    { id: 't4', title: 'Item 1: Slow search', priority: 'Medium' },
  ];

  return (
    <DataTable
      caption="Tickets"
      columns={[
        { id: 'title', header: 'Title', sortable: true, isRowHeader: true },
        {
          id: 'priority',
          header: 'Priority',
          sortable: true,
          sortDescFirst: true,
          sortFn: (a, b) =>
            priorities.indexOf(a.priority) - priorities.indexOf(b.priority),
        },
      ]}
      data={tickets}
      defaultSort={[{ id: 'priority', direction: 'descending' }]}
      isFullwidth
    />
  );
}
```

### Selecting Rows

`selectionMode="multiple"` adds a narrow column of checkboxes, each named "Select" and the row's
label, from its row header, or from its first column without one. The checkbox in the header selects
every row on the page shown, and it's mixed when some of them are. The selection is a list of row
ids, kept while the search, a filter or the page hides a row.

`toolbar` puts more in the bar above the table, such as a count and buttons for the selected rows.
It's given the table, so it reads the selection and changes it.

```tsx live
function example() {
  const [people, setPeople] = useState([
    { id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com' },
    { id: 'u2', name: 'Alan Turing', email: 'alan@example.com' },
    { id: 'u3', name: 'Grace Hopper', email: 'grace@example.com' },
    { id: 'u4', name: 'Katherine Johnson', email: 'katherine@example.com' },
  ]);

  return (
    <DataTable
      caption="Members"
      columns={[
        { id: 'name', header: 'Name', isRowHeader: true },
        { id: 'email', header: 'Email' },
      ]}
      data={people}
      selectionMode="multiple"
      isFullwidth
      toolbar={table => (
        <Button
          color="danger"
          isOutlined
          size="small"
          disabled={table.state.selected.length === 0}
          onClick={() => {
            const gone = table.state.selected;
            setPeople(rows => rows.filter(row => !gone.includes(row.id)));
            table.setSelected([]);
          }}
        >
          Remove {table.state.selected.length || ''} selected
        </Button>
      )}
    />
  );
}
```

A selected row takes Bulma's selected look, and its checkbox takes the row's text color, so it still
shows. Clicking a row doesn't select it, so its text can be selected and its links followed.

### Paging

`pageSize` pages the rows through `Pagination`, which shows once there's more than one page. Pages
count from 1, as `Pagination` counts them. The pager is named after the table, "Countries pages"
here, so two tables on a page have pagers with different names. `page` and `onPageChange` hold the
page, and a page past the end shows the last one.

```tsx live
function example() {
  const countries = [
    'Argentina',
    'Brazil',
    'Canada',
    'Denmark',
    'Egypt',
    'France',
    'Ghana',
    'Hungary',
    'India',
    'Japan',
    'Kenya',
    'Lebanon',
    'Mexico',
    'Norway',
  ].map((name, i) => ({ id: name, name, code: String(100 + i * 7) }));

  return (
    <DataTable
      caption="Countries"
      columns={[
        { id: 'name', header: 'Country', sortable: true, isRowHeader: true },
        { id: 'code', header: 'Code', align: 'right' },
      ]}
      data={countries}
      pageSize={5}
      isFullwidth
    />
  );
}
```

### Searching and Filtering

`hasSearch` adds a search field to the toolbar. The search matches every filterable column's text,
in the `LocaleProvider`'s locale when there is one, so "cafe" finds "Café" in French, and as a
case-insensitive substring outside one. `filterable: false` leaves a column out, as for one of
actions.

`filters` holds a value per column, by `id`. Without a `filterFn`, a column's text has to contain the
value's text. A `Select` in the toolbar that calls `table.setFilter` makes a filter control.
Changing the search or a filter through the table goes back to page 1.

```tsx live
function example() {
  const books = [
    { id: 'b1', title: 'Le Petit Prince', author: 'Saint-Exupéry', year: 1943 },
    { id: 'b2', title: 'Les Misérables', author: 'Hugo', year: 1862 },
    { id: 'b3', title: 'L’Étranger', author: 'Camus', year: 1942 },
    { id: 'b4', title: 'Madame Bovary', author: 'Flaubert', year: 1857 },
    { id: 'b5', title: 'La Peste', author: 'Camus', year: 1947 },
  ];

  return (
    <LocaleProvider locale="fr">
      <DataTable
        caption="Livres"
        columns={[
          { id: 'title', header: 'Titre', sortable: true, isRowHeader: true },
          { id: 'author', header: 'Auteur', sortable: true },
          {
            id: 'year',
            header: 'Année',
            align: 'right',
            filterFn: (row, value) => row.year < Number(value),
          },
        ]}
        data={books}
        hasSearch
        isFullwidth
        labels={{ search: 'Rechercher' }}
        toolbar={table => (
          <Select
            aria-label="Parution"
            value={String(table.state.filters.year ?? '')}
            onChange={event => table.setFilter('year', event.target.value)}
          >
            <option value="">Toutes les années</option>
            <option value="1900">Avant 1900</option>
          </Select>
        )}
      />
    </LocaleProvider>
  );
}
```

Type "etranger" or "miserables" and the accents don't get in the way. A short while after the search
or a filter changes, a status message says how many rows match, for screen reader users, who don't
see the rows change.

### Filtering by Several Values

A filter value can be an array, which passes a row whose text contains any of its entries, so a set
of checkboxes, or any control that picks several, filters to rows matching any of them. An empty
array is no filter. A column with a `filterFn` gets the array as it is.

```tsx live
function example() {
  const roles = ['Admin', 'Editor', 'Viewer'];
  const people = [
    { id: 'u1', name: 'Ada Lovelace', role: 'Admin' },
    { id: 'u2', name: 'Alan Turing', role: 'Editor' },
    { id: 'u3', name: 'Grace Hopper', role: 'Viewer' },
    { id: 'u4', name: 'Katherine Johnson', role: 'Admin' },
    { id: 'u5', name: 'Edsger Dijkstra', role: 'Editor' },
  ];

  return (
    <DataTable
      caption="People"
      columns={[
        { id: 'name', header: 'Name', sortable: true, isRowHeader: true },
        { id: 'role', header: 'Role', sortable: true },
      ]}
      data={people}
      defaultFilters={{ role: ['Admin', 'Viewer'] }}
      isFullwidth
      toolbar={table => (
        <Checkboxes
          label="Roles"
          value={(table.state.filters.role as string[] | undefined) ?? []}
          onChange={picked => table.setFilter('role', picked)}
        >
          {roles.map(role => (
            <Checkbox key={role} value={role}>
              {role}
            </Checkbox>
          ))}
        </Checkboxes>
      )}
    />
  );
}
```

`setFilter` and `setFilters` go back to page 1, and two calls in one handler, such as a "Clear
filters" button that clears two columns, build on each other while the table holds its filters. When
you hold them with `filters` and `onFiltersChange`, each call builds on the filters as rendered, so
set several at once with `setFilters`.

### Empty and No Results

With no rows at all, the table shows `empty`, and when the search and filters let nothing through,
`noResults`, each in one cell across every column. The defaults are a small `EmptyState` with a
sentence. A title of your own is a heading, so give it the level under the heading the table sits
under with `titleAs`.

A "Clear search" button goes away with the message when it works, so send focus back to the search
field when it's pressed. Here the field is the toolbar's own, an `Input` with a ref, bound to the
search by `getSearchProps`, in place of `hasSearch`.

```tsx live
function example() {
  const [search, setSearch] = useState('kraken');
  const searchRef = React.useRef<HTMLInputElement>(null);
  const projects = [
    { id: 'p1', name: 'Apollo' },
    { id: 'p2', name: 'Gemini' },
    { id: 'p3', name: 'Mercury' },
  ];

  return (
    <DataTable
      caption="Projects"
      columns={[{ id: 'name', header: 'Project', isRowHeader: true }]}
      data={projects}
      search={search}
      onSearchChange={setSearch}
      isFullwidth
      toolbar={table => (
        <Input
          ref={searchRef}
          label="Search projects"
          {...table.getSearchProps()}
        />
      )}
      noResults={
        <EmptyState
          size="small"
          title={`No projects match “${search}”`}
          titleAs="h3"
          description="Check the spelling, or clear the search."
        >
          <Button
            size="small"
            onClick={() => {
              setSearch('');
              searchRef.current?.focus();
            }}
          >
            Clear search
          </Button>
        </EmptyState>
      }
    />
  );
}
```

### Loading

`loading` keeps the header, shows a page of `Skeleton` rows in place of the rows, and marks the table
busy (`aria-busy`). Once the search, a filter or the page has changed, the status message says
"Loading" too.

```tsx live
<DataTable
  caption="Invoices"
  columns={[
    { id: 'number', header: 'Invoice' },
    { id: 'customer', header: 'Customer' },
    { id: 'total', header: 'Total', align: 'right' },
  ]}
  data={[]}
  loading
  pageSize={3}
  isFullwidth
/>
```

### Data From a Server

`manual` hands sorting, filtering and paging to a server. The table shows `data` as the page it is,
and only reports the state as it changes. Hold each piece of state, fetch when one changes, and give
`rowCount`, how many rows match in all, so the pager and the status message count right. Without it,
the table counts the rows in `data`, one page's worth, and a development build warns. Here a timer
stands in for the server.

```tsx live
import type { DataTableSort } from '@allxsmith/bestax-bulma';

function example() {
  const everyone = Array.from({ length: 23 }, (_, i) => ({
    id: `u${i + 1}`,
    name: `User ${i + 1}`,
    visits: (i * 37) % 100,
  }));
  const pageSize = 5;
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<DataTableSort[]>([]);
  const [search, setSearch] = useState('');
  const [result, setResult] = useState({
    rows: everyone.slice(0, 0),
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  // Each change starts a fetch, so the table shows it's loading.
  const fetching =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      setLoading(true);
      set(value);
    };

  useEffect(() => {
    const timer = setTimeout(() => {
      // What the server does with the query.
      const matched = everyone.filter(row =>
        row.name.toLowerCase().includes(search.trim().toLowerCase())
      );
      const [by] = sort;
      if (by?.id === 'visits') {
        matched.sort((a, b) =>
          by.direction === 'ascending'
            ? a.visits - b.visits
            : b.visits - a.visits
        );
      }
      setResult({
        rows: matched.slice((page - 1) * pageSize, page * pageSize),
        total: matched.length,
      });
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [page, sort, search]);

  return (
    <DataTable
      caption="Visitors"
      columns={[
        { id: 'name', header: 'Name', isRowHeader: true },
        { id: 'visits', header: 'Visits', sortable: true, align: 'right' },
      ]}
      data={result.rows}
      manual
      rowCount={result.total}
      loading={loading}
      pageSize={pageSize}
      page={page}
      onPageChange={fetching(setPage)}
      sort={sort}
      onSortChange={fetching(setSort)}
      hasSearch
      search={search}
      onSearchChange={fetching(setSearch)}
      isFullwidth
    />
  );
}
```

The search and a sort go through `onSearchChange` and `onSortChange`, and a search change also calls
`onPageChange` with 1, so the next fetch starts at the first page.

### The useDataTable Hook

`useDataTable` takes the same columns, data and state options as `DataTable` and returns the table.
Pass it to `<DataTable table={table} />` to render it, and read it anywhere else: here the heading
counts the rows the search lets through, and the line under it the selection.

```tsx live
function example() {
  const table = useDataTable({
    columns: [
      { id: 'name', header: 'Name', sortable: true, isRowHeader: true },
      { id: 'team', header: 'Team', sortable: true },
    ],
    data: [
      { id: 'e1', name: 'Ada Lovelace', team: 'Engines' },
      { id: 'e2', name: 'Alan Turing', team: 'Codes' },
      { id: 'e3', name: 'Grace Hopper', team: 'Compilers' },
      { id: 'e4', name: 'Hedy Lamarr', team: 'Radio' },
    ],
    selectionMode: 'multiple',
  });

  return (
    <>
      <Title as="h3" size="5" id="people-heading">
        People ({table.rowCount})
      </Title>
      <Paragraph>{table.state.selected.length} selected</Paragraph>
      <DataTable
        table={table}
        aria-labelledby="people-heading"
        hasSearch
        isFullwidth
      />
    </>
  );
}
```

A table from the hook takes no `columns`, `data` or state props: they go to the hook, and a
development build warns when both are given.

### Downloading CSV

`table.toCSV()` writes what the user sees as CSV: the columns in order, under their headers, and the
rows the search and filters let through, sorted as shown, from every page. `{ rows: 'selected' }`
writes the selected ones instead, `{ rows: 'page' }` the page shown and `{ rows: 'all' }` every row,
and `columns` picks and orders the columns by id. Each field is the column's `format` text, never
its `cell`.

A field that starts with `=`, `+`, `-`, `@`, a tab or a carriage return gets a `'` in front, so a
spreadsheet shows it as text rather than running it as a formula, unless it's a plain number such as
`-12.5`. Here the last order's note tries it.

Saving the text is up to the page. This puts a byte order mark in front, which Excel needs to read the
file as UTF-8, and downloads it.

```tsx live
function example() {
  const orders = [
    {
      id: 'A-1041',
      customer: 'Zoë Ørsted',
      total: 1249.5,
      note: 'Gift, wrapped',
    },
    { id: 'A-1042', customer: 'Alan Turing', total: -89, note: 'Refund' },
    {
      id: 'A-1043',
      customer: 'Grace Hopper',
      total: 405.25,
      note: '=HYPERLINK("x")',
    },
  ];
  const download = (csv: string, name: string) => {
    // The byte order mark tells Excel the file is UTF-8.
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url));
  };

  return (
    <DataTable
      caption="Orders"
      columns={[
        { id: 'id', header: 'Order', isRowHeader: true },
        { id: 'customer', header: 'Customer', sortable: true },
        {
          id: 'total',
          header: 'Total',
          sortable: true,
          align: 'right',
          format: value => (value as number).toFixed(2),
        },
        { id: 'note', header: 'Note' },
      ]}
      data={orders}
      selectionMode="multiple"
      isFullwidth
      toolbar={table => (
        <Buttons>
          <Button
            size="small"
            onClick={() => download(table.toCSV(), 'orders.csv')}
          >
            Download CSV
          </Button>
          <Button
            size="small"
            disabled={table.state.selected.length === 0}
            onClick={() =>
              download(table.toCSV({ rows: 'selected' }), 'selected-orders.csv')
            }
          >
            Download selected
          </Button>
        </Buttons>
      )}
    />
  );
}
```

There's no Excel export in bestax. Its columns keep their raw value (`accessor`) apart from their
text, and `meta` takes options of an add-on's own, so one can come later.

### Custom Markup

The table hands out props for bestax's own table parts: `getHeaderCellProps` for a column's `Th`
(its scope, `aria-sort` while sorted, alignment and width), `getSortButtonProps` for the button
inside it, `getRowProps` for a `Tr`, `getCellProps` for a cell, `getSelectAllProps` and
`getSelectRowProps` for the `Checkbox`es, `getPaginationProps` for `Pagination`, and
`getSearchProps` for a search field. Markup built from them sorts, selects and pages as `DataTable`
does, and the sort button gets its indicator from the same styles. Here the plans picked are listed
under the table.

```tsx live
function example() {
  const table = useDataTable({
    columns: [
      { id: 'name', header: 'Plan', sortable: true },
      { id: 'price', header: 'Price', sortable: true, format: v => `$${v}/mo` },
    ],
    data: [
      { id: 'free', name: 'Free', price: 0 },
      { id: 'team', name: 'Team', price: 12 },
      { id: 'pro', name: 'Pro', price: 29 },
    ],
    selectionMode: 'multiple',
  });

  return (
    <>
      <Table isFullwidth aria-label="Plans">
        <Table.Thead>
          <Table.Tr>
            <Table.Th scope="col" isNarrow>
              <Checkbox {...table.getSelectAllProps()} />
            </Table.Th>
            {table.columns.map(column => (
              <Table.Th key={column.id} {...table.getHeaderCellProps(column)}>
                <button {...table.getSortButtonProps(column)}>
                  {column.header}
                </button>
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {table.getRows('page').map(row => (
            <Table.Tr key={row.id} {...table.getRowProps(row)}>
              <Table.Td isNarrow>
                <Checkbox {...table.getSelectRowProps(row)} />
              </Table.Td>
              {table.columns.map(column => (
                <Table.Td key={column.id} {...table.getCellProps(row, column)}>
                  {table.getText(row, column.id)}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      <Paragraph>
        Picked:{' '}
        {table
          .getRows('selected')
          .map(row => row.name)
          .join(', ') || 'none'}
      </Paragraph>
    </>
  );
}
```

This is also how a row goes inside a `ContextMenu`, whose `trigger` is the row's `Table.Tr`.

### Wide Tables

`isResponsive` scrolls a table wider than its space sideways, in a
[`ScrollArea`](./scrollarea.md) named after the table, rather than Bulma's `.table-container`, so
it can be scrolled from the keyboard while it overflows.

```tsx live
<Columns>
  <Column size="half">
    <DataTable
      caption="Quarterly results"
      columns={[
        { id: 'region', header: 'Region', isRowHeader: true },
        { id: 'q1', header: 'Q1 2026', align: 'right' },
        { id: 'q2', header: 'Q2 2026', align: 'right' },
        { id: 'q3', header: 'Q3 2026', align: 'right' },
        { id: 'q4', header: 'Q4 2026', align: 'right' },
        { id: 'total', header: 'Full year', align: 'right' },
      ]}
      data={['North', 'South', 'East', 'West'].map((region, i) => ({
        id: region,
        region,
        q1: 1200 + i * 97,
        q2: 1310 + i * 89,
        q3: 1405 + i * 71,
        q4: 1550 + i * 64,
        total: 5465 + i * 321,
      }))}
      isResponsive
      isNarrow
    />
  </Column>
</Columns>
```

### Translations

The words the table writes are English by default, and `labels` gives your own: the checkbox names,
the hint that headers sort, the search field's label, the status messages, the pager's name, and the
empty and no-match sentences. The numbers in the default messages are written in the
`LocaleProvider`'s locale.

```tsx live
<DataTable
  caption="Mitglieder"
  columns={[{ id: 'name', header: 'Name', sortable: true, isRowHeader: true }]}
  data={[
    { id: 'm1', name: 'Emmy Noether' },
    { id: 'm2', name: 'Lise Meitner' },
    { id: 'm3', name: 'Konrad Zuse' },
  ]}
  selectionMode="multiple"
  hasSearch
  pageSize={2}
  isFullwidth
  labels={{
    selectAll: 'Alle Zeilen dieser Seite auswählen',
    selectRow: label => `${label} auswählen`,
    sortHint: 'Spaltenköpfe mit Schaltflächen sind sortierbar',
    search: 'Suchen',
    results: count => (count === 1 ? '1 Treffer' : `${count} Treffer`),
    pageRange: (first, last, total) => `${first} bis ${last} von ${total}`,
    loading: 'Wird geladen',
    pagination: 'Mitglieder, Seiten',
    empty: 'Noch keine Mitglieder.',
    noResults: 'Keine Treffer.',
  }}
/>
```

---

## The Table Model

What `useDataTable` returns, what `toolbar` is given, and what `table` takes.

| Member                                                                                                                                                      | What it is                                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `columns`                                                                                                                                                   | The columns, in the order they're shown                                                            |
| `state`                                                                                                                                                     | `{ sort, selected, page, pageSize, search, filters }` as they stand                                |
| `rowCount`, `pageCount`                                                                                                                                     | How many rows the search and filters let through (or `rowCount` with `manual`), and how many pages |
| `selectionMode`, `manual`, `labels`                                                                                                                         | The options it was given, with the labels' defaults filled in                                      |
| `getRows(scope?)`                                                                                                                                           | The rows in the table's order: `'filtered'` by default, or `'all'`, `'page'` or `'selected'`       |
| `toCSV(options?)`                                                                                                                                           | The rows as CSV: `rows`, `columns`, `header` and `delimiter` choose what and how                   |
| `getRowId(row)`, `getRowLabel(row)`                                                                                                                         | A row's id, and what names it                                                                      |
| `getValue(row, columnId)`, `getText(row, columnId)`                                                                                                         | A column's raw value for a row, and its text                                                       |
| `isSelected(row)`                                                                                                                                           | Whether a row is selected                                                                          |
| `setSort`, `toggleSort(columnId)`                                                                                                                           | Sets the sort, or moves a column through it as its header does                                     |
| `setSelected`, `toggleRowSelected`, `togglePageSelected`                                                                                                    | Sets the selected ids, or selects or clears a row or the page                                      |
| `setPage`, `setSearch`, `setFilter`, `setFilters`                                                                                                           | Goes to a page, or sets the search or the filters, which goes back to page 1                       |
| `getHeaderCellProps`, `getSortButtonProps`, `getRowProps`, `getCellProps`, `getSelectAllProps`, `getSelectRowProps`, `getPaginationProps`, `getSearchProps` | Props for bestax's `Th`, its button, `Tr`, `Td`, the `Checkbox`es, `Pagination` and a search field |

An add-on can give columns options of its own by merging into `DataTableColumnMeta`, which every
column's `meta` takes:

```tsx
declare module '@allxsmith/bestax-bulma' {
  interface DataTableColumnMeta<TRow> {
    exportValue?: (row: TRow) => string | number;
  }
}
```

---

## Keyboard

It's a table with buttons and checkboxes in it, so the browser's own keys work it.

| Key   | What it does                                                                               |
| ----- | ------------------------------------------------------------------------------------------ |
| Tab   | Moves through the search field, the toolbar, each sort button, each checkbox and the pager |
| Enter | Presses a sort button or a page link                                                       |
| Space | Presses a sort button or a page link, or checks a checkbox                                 |

Focus stays where it was after a sort, a check or a page change. A screen reader's own table
commands move through the cells, since no cell takes focus and the reader stays in its reading mode.

---

## Accessibility

- **A native table,** as in the ARIA Authoring Practices' Sortable Table example: `th scope="col"`
  headers, `th scope="row"` for the row header, and a `caption` or your `aria-label` or
  `aria-labelledby` as its name. A development build warns when it has none.
- **Sorting:** a sortable header holds a `<button>` with the header's text, and only the sorted
  header has `aria-sort`, `ascending` or `descending`, which screen readers read out as they reach
  it. That headers with buttons sort is said once, hidden at the end of the caption, or as a hidden
  caption of its own when `aria-label` names the table. The indicator is drawn in CSS, so it's not
  read.
- **Selection** rides on the checkboxes: each is named "Select" and the row's label, and the one in
  the header is mixed (`aria-checked="mixed"`) when some of the page is selected. Rows get Bulma's
  selected look and no `aria-selected`, which ARIA gives the rows of a grid rather than a table.
- **A status message** in a polite live region says how many rows match a short while after the
  search or a filter changes, the range shown after a page change, and "Loading" while `loading` is
  on after one of those. Nothing is said as the page loads, or for a sort, which `aria-sort` covers.
- **The pager** is a `navigation` named after the table, so two tables on a page have two named
  pagers.
- **Busy:** `aria-busy` is on the table while `loading`, and the skeleton rows are hidden from
  assistive tech.
- **Wide tables:** with `isResponsive`, the `ScrollArea` around the table is a tab stop and a
  named region while it overflows, so it can be scrolled from the keyboard.
- **Forced colors:** the sort indicator is painted in the system's button text color, and the sort
  button's focus ring is an outline. A selected row's fill is a color forced colors takes away, so
  the checked checkbox carries the selection there.
- **No motion:** nothing animates but the skeleton, which stops under reduced motion.

---

## Related Components

- [`Table`](../elements/table.md): Bulma's table, which DataTable renders, for a table that
  doesn't sort or page.
- [`Pagination`](./pagination.md): The pager under the rows.
- [`Checkbox`](../form/checkbox.md): The row checkboxes, with a controlled `indeterminate`.
- [`EmptyState`](./emptystate.md): What the table shows with no rows or no matches.
- [`ScrollArea`](./scrollarea.md): What `isResponsive` scrolls the table in.
- [`LocaleProvider`](../helpers/localeprovider.md): The locale the table sorts, matches and counts in.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: DataTable Stories](https://bestax.io/storybook/?path=/story/components-datatable--default)
- [ARIA Authoring Practices: Sortable Table Example](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/)
- [ARIA Authoring Practices: Table Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/table/)
- [Adrian Roselli: Sortable Table Columns](https://adrianroselli.com/2021/04/sortable-table-columns.html)
- [WCAG 2.2, Understanding Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)

---

## Props

<!-- bestax:generated props -->

| Prop               | Type                                                   | Default  | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------ | ------------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `columns`          | `DataTableColumn<TRow>[]`                              | —        | The columns, in the order they're shown. Required unless `table` is given. Keep the array the same from one render to the next, defined outside the component or in `useMemo`: a new one has every cell's text worked out again.                                                                                                                                                                                                                               |
| `data`             | `TRow[]`                                               | —        | The rows, as records of your own. Required unless `table` is given.                                                                                                                                                                                                                                                                                                                                                                                            |
| `table`            | `DataTableModel<TRow>`                                 | —        | A table made by `useDataTable`, rendered in place of one made from `columns`, `data` and the state props, which are then left unread. Use it to put a toolbar, a count or an export button elsewhere on the page.                                                                                                                                                                                                                                              |
| `caption`          | `React.ReactNode`                                      | —        | Names the table, as a visible `<caption>`. A table needs a name: this, `aria-label` or `aria-labelledby`.                                                                                                                                                                                                                                                                                                                                                      |
| `isBordered`       | `boolean`                                              | `false`  | Adds borders to all cells.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `isStriped`        | `boolean`                                              | `false`  | Adds zebra-striping to rows.                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `isNarrow`         | `boolean`                                              | `false`  | Makes the table more compact by cutting cell padding in half.                                                                                                                                                                                                                                                                                                                                                                                                  |
| `isHoverable`      | `boolean`                                              | `false`  | Adds a hover effect on rows.                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `isFullwidth`      | `boolean`                                              | `false`  | Makes the table span the full width of its wrapper.                                                                                                                                                                                                                                                                                                                                                                                                            |
| `isResponsive`     | `boolean`                                              | `false`  | Scrolls a table wider than its wrapper sideways, in a `ScrollArea` named after the table, which can be scrolled from the keyboard while it overflows.                                                                                                                                                                                                                                                                                                          |
| `hasSearch`        | `boolean`                                              | `false`  | Shows a search field in the toolbar, labelled by `labels.search`.                                                                                                                                                                                                                                                                                                                                                                                              |
| `toolbar`          | `(table: DataTableModel<TRow>) => React.ReactNode`     | —        | More of the toolbar, after the search field: buttons for the selected rows, a filter, a download. Given the table.                                                                                                                                                                                                                                                                                                                                             |
| `loading`          | `boolean`                                              | `false`  | Shows a page of skeleton rows under the header in place of the rows, and marks the table busy. For data on its way, as from a server with `manual`.                                                                                                                                                                                                                                                                                                            |
| `empty`            | `React.ReactNode`                                      | —        | What the table shows when it has no rows at all, in one cell across every column. A small `EmptyState` saying `labels.empty` by default. A title of your own sits under the heading the table does, so give it the next level down with `titleAs`.                                                                                                                                                                                                             |
| `noResults`        | `React.ReactNode`                                      | —        | What the table shows when the search and filters let no row through, in one cell across every column. A small `EmptyState` saying `labels.noResults` by default. A button that clears the search goes away with it, so send focus back to the search field when it's pressed.                                                                                                                                                                                  |
| `rowProps`         | `(row: TRow) => DataTableRowProps`                     | —        | Props of your own for a row's `Tr`, such as a handler or a class. The table's own (`isSelected`) win. To wrap a row in a `ContextMenu`, build the table from `useDataTable`'s props instead.                                                                                                                                                                                                                                                                   |
| `className`        | `string`                                               | —        | Additional CSS classes, on the wrapper `<div>`.                                                                                                                                                                                                                                                                                                                                                                                                                |
| `getRowId`         | `(row: TRow, index: number) => string`                 | —        | A row's id, unique and stable, which the selection is a list of. Left out, it's the row's `id` property as a string. A development build warns about a missing or repeated id, and a row with none falls back to its index, which doesn't survive the data changing.                                                                                                                                                                                           |
| `sort`             | `{ id: string; direction: DataTableSortDirection }[]`  | —        | The sort when you hold it: an array of `{ id, direction }`, the first deciding and each next one breaking ties. The headers set one at a time.                                                                                                                                                                                                                                                                                                                 |
| `defaultSort`      | `{ id: string; direction: DataTableSortDirection }[]`  | —        | The sort to start with when the table holds it. Text sorts in the `LocaleProvider`'s locale, or the runtime's own outside one, which can differ between a server and the browser, so put a table rendered on the server sorted inside a `LocaleProvider`.                                                                                                                                                                                                      |
| `onSortChange`     | `(sort: DataTableSort[]) => void`                      | —        | Called with the new sort when a header is pressed.                                                                                                                                                                                                                                                                                                                                                                                                             |
| `selectionMode`    | `'none'` \| `'multiple'`                               | `'none'` | `multiple` adds a checkbox to each row and a "select all" checkbox to the header.                                                                                                                                                                                                                                                                                                                                                                              |
| `selected`         | `string[]`                                             | —        | The selected rows' ids when you hold them. They stay selected while the search, a filter or the page hides them.                                                                                                                                                                                                                                                                                                                                               |
| `defaultSelected`  | `string[]`                                             | —        | The rows selected to begin with, by id, when the table holds them.                                                                                                                                                                                                                                                                                                                                                                                             |
| `onSelectedChange` | `(selected: string[]) => void`                         | —        | Called with every selected id after a checkbox changes.                                                                                                                                                                                                                                                                                                                                                                                                        |
| `pageSize`         | `number`                                               | —        | Rows per page. Set, the table pages through `Pagination`; left out, it shows every row.                                                                                                                                                                                                                                                                                                                                                                        |
| `page`             | `number`                                               | —        | The page shown when you hold it, counting from 1. A page past the end shows the last.                                                                                                                                                                                                                                                                                                                                                                          |
| `defaultPage`      | `number`                                               | `1`      | The page to start on when the table holds it.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `onPageChange`     | `(page: number) => void`                               | —        | Called with the page chosen in the pager, and with 1 when the search or a filter changes through the table while the page held isn't 1, even when a page past the end shows as the last.                                                                                                                                                                                                                                                                       |
| `search`           | `string`                                               | —        | The search when you hold it, matched against every filterable column's text: in the `LocaleProvider`'s locale, ignoring case and the accents the language ignores, or a case-insensitive substring outside one.                                                                                                                                                                                                                                                |
| `defaultSearch`    | `string`                                               | —        | The search to start with when the table holds it.                                                                                                                                                                                                                                                                                                                                                                                                              |
| `onSearchChange`   | `(search: string) => void`                             | —        | Called with the search as it changes through the table.                                                                                                                                                                                                                                                                                                                                                                                                        |
| `filters`          | `DataTableFilters`                                     | —        | A value per column, by `id`, when you hold them. A row passes when every column with a value passes it: the column's `filterFn` if it has one, given the value as it is, or else the column's text has to contain the value's text, compared as the search compares. An array is a choice of values, as a multiple-choice filter gives, and passes a row whose text contains any of them. A value of `undefined`, `null`, `''` or an empty array is no filter. |
| `defaultFilters`   | `DataTableFilters`                                     | —        | The filters to start with when the table holds them.                                                                                                                                                                                                                                                                                                                                                                                                           |
| `onFiltersChange`  | `(filters: DataTableFilters) => void`                  | —        | Called with every filter value after one changes through the table.                                                                                                                                                                                                                                                                                                                                                                                            |
| `manual`           | `boolean`                                              | `false`  | Hands sorting, filtering and paging to a server: the table shows `data` as given, as the current page, and only reports the state as it changes.                                                                                                                                                                                                                                                                                                               |
| `rowCount`         | `number`                                               | —        | With `manual`, how many rows match in all, which sets the page count and the announced count. Without it, the table counts the rows in `data`, which with a `pageSize` is one page and no pager, and a development build warns.                                                                                                                                                                                                                                |
| `labels`           | `DataTableLabels`                                      | —        | The words the table writes, in your app's language.                                                                                                                                                                                                                                                                                                                                                                                                            |
| `aria-label`       | `string`                                               | —        | Names the table, in place of a `caption`. A table needs a name, so pass a `caption`, this or `aria-labelledby`, and a development build warns when it has none.                                                                                                                                                                                                                                                                                                |
| `aria-labelledby`  | `string`                                               | —        | The id of a visible heading that names the table, in place of a `caption`.                                                                                                                                                                                                                                                                                                                                                                                     |
| `ref`              | `React.Ref<HTMLDivElement>`                            | —        | Ref forwarded to the wrapper `<div>`.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `...`              | All standard `<div>` attributes and Bulma helper props | —        | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                              |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`DataTable` registers these variables on its own `.data-table` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                 | Sass Variable                       | Default   |
| -------------------------------------------- | ----------------------------------- | --------- |
| `--bulma-data-table-gap`                     | `$data-table-gap`                   | `0.75rem` |
| `--bulma-data-table-sort-gap` ‡              | `$data-table-sort-gap`              | `0.375em` |
| `--bulma-data-table-sort-indicator-size` ‡   | `$data-table-sort-indicator-size`   | `0.75em`  |
| `--bulma-data-table-sort-unsorted-opacity` ‡ | `$data-table-sort-unsorted-opacity` | `0.35`    |

‡ declared on a constituent element: values set via `className`, the `style` prop, or an ancestor are only inherited and lose — target the declaring element in your CSS.

<!-- /bestax:generated cssvars -->
