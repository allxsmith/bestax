import React, { createRef } from 'react';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  within,
} from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import {
  DataTable,
  useDataTable,
  type DataTableColumn,
  type DataTableModel,
  type DataTableProps,
  type UseDataTableOptions,
} from '../DataTable';
import { ConfigProvider } from '../../helpers/Config';
import { LocaleProvider } from '../../helpers/LocaleProvider';
import { resetDevWarnings } from '../../helpers/devWarnings';

interface Person {
  id: string;
  name: string;
  role: string;
  score: number | null;
}

const people: Person[] = [
  { id: 'p1', name: 'Ada Lovelace', role: 'Admin', score: 98 },
  { id: 'p2', name: 'Alan Turing', role: 'Editor', score: 95 },
  { id: 'p3', name: 'Grace Hopper', role: 'Viewer', score: null },
  { id: 'p4', name: 'Katherine Johnson', role: 'Admin', score: 90 },
  { id: 'p5', name: 'Edsger Dijkstra', role: 'Editor', score: 91 },
];

const columns: DataTableColumn<Person>[] = [
  { id: 'name', header: 'Name', sortable: true, isRowHeader: true },
  { id: 'role', header: 'Role', sortable: true },
  {
    id: 'score',
    header: 'Score',
    sortable: true,
    sortDescFirst: true,
    align: 'right',
    width: 80,
    format: value => (value === null ? '—' : String(value)),
  },
];

/** A DataTable over `people`, with a caption, and any props on top. */
const renderTable = (props: Partial<DataTableProps<Person>> = {}) =>
  render(
    <DataTable caption="People" columns={columns} data={people} {...props} />
  );

/** The text of each body row's header cell, top to bottom. */
const names = (container: HTMLElement = document.body) =>
  Array.from(container.querySelectorAll('tbody th')).map(
    cell => cell.textContent
  );

const header = (name: string) =>
  screen.getByRole('columnheader', { name: new RegExp(`^${name}`) });

const sortButton = (name: string) => screen.getByRole('button', { name });

let warn: jest.SpyInstance;
beforeEach(() => {
  resetDevWarnings();
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  warn.mockRestore();
  jest.useRealTimers();
});

describe('DataTable', () => {
  describe('rendering', () => {
    it('renders Bulma table parts inside a wrapper div', () => {
      const ref = createRef<HTMLDivElement>();
      const { container } = render(
        <DataTable
          ref={ref}
          id="people"
          data-testid="wrapper"
          className="mine"
          mt="3"
          caption="People"
          columns={columns}
          data={people}
          isBordered
          isStriped
          isNarrow
          isHoverable
          isFullwidth
        />
      );
      const wrapper = screen.getByTestId('wrapper');
      expect(ref.current).toBe(wrapper);
      expect(wrapper.tagName).toBe('DIV');
      expect(wrapper).toHaveClass('data-table', 'mine', 'mt-3');
      expect(wrapper).toHaveAttribute('id', 'people');
      const table = container.querySelector('table')!;
      expect(table).toHaveClass(
        'table',
        'is-bordered',
        'is-striped',
        'is-narrow',
        'is-hoverable',
        'is-fullwidth'
      );
      expect(wrapper.firstElementChild).toBe(table);
      expect(screen.getAllByRole('columnheader')).toHaveLength(3);
      for (const th of screen.getAllByRole('columnheader')) {
        expect(th).toHaveAttribute('scope', 'col');
      }
      expect(screen.getAllByRole('row')).toHaveLength(people.length + 1);
    });

    it('names the table with its caption, and says once that headers sort', () => {
      renderTable();
      const table = screen.getByRole('table');
      const caption = table.querySelector('caption')!;
      expect(caption.firstElementChild).toHaveTextContent(/^People$/);
      expect(caption).toHaveTextContent(
        'People, column headers with buttons are sortable.'
      );
    });

    it('puts aria-label and aria-labelledby on the table, not the wrapper', () => {
      const { container, rerender } = render(
        <DataTable aria-label="People" columns={columns} data={people} />
      );
      const table = container.querySelector('table')!;
      expect(table).toHaveAttribute('aria-label', 'People');
      expect(container.firstElementChild).not.toHaveAttribute('aria-label');
      // The hint becomes a hidden caption of its own.
      expect(table.querySelector('caption')).toHaveTextContent(
        /^column headers with buttons are sortable$/
      );
      rerender(
        <DataTable aria-labelledby="h" columns={columns} data={people} />
      );
      expect(table).toHaveAttribute('aria-labelledby', 'h');
    });

    it('has no caption with no caption and nothing to sort', () => {
      const { container } = render(
        <DataTable
          aria-label="People"
          columns={[{ id: 'name', header: 'Name' }]}
          data={people}
        />
      );
      expect(container.querySelector('caption')).toBeNull();
    });

    it('keeps a caption without the hint when nothing sorts', () => {
      const { container } = render(
        <DataTable
          caption="People"
          columns={[{ id: 'name', header: 'Name' }]}
          data={people}
        />
      );
      expect(container.querySelector('caption')).toHaveTextContent(/^People$/);
    });

    it('shows each column text, from format, accessors or the row', () => {
      render(
        <DataTable
          aria-label="People"
          columns={[
            { id: 'name', header: 'Name' },
            { id: 'job', header: 'Job', accessor: 'role' },
            {
              id: 'initials',
              header: 'Initials',
              accessor: row =>
                row.name
                  .split(' ')
                  .map(part => part[0])
                  .join(''),
            },
            { id: 'score', header: 'Score' },
            {
              id: 'badge',
              header: 'Badge',
              accessor: 'score',
              format: value => `#${value}`,
              cell: (row, { value, text, rowId }) => (
                <b data-testid={`badge-${rowId}`}>
                  {row.name}:{String(value)}:{text}
                </b>
              ),
            },
          ]}
          data={people.slice(0, 3)}
        />
      );
      const first = screen.getAllByRole('row')[1];
      expect(
        within(first)
          .getAllByRole('cell')
          .map(cell => cell.textContent)
      ).toEqual(['Ada Lovelace', 'Admin', 'AL', '98', 'Ada Lovelace:98:#98']);
      // A null value shows as nothing.
      const third = screen.getAllByRole('row')[3];
      expect(within(third).getAllByRole('cell')[3]).toBeEmptyDOMElement();
      expect(screen.getByTestId('badge-p2')).toHaveTextContent(
        'Alan Turing:95:#95'
      );
    });

    it('aligns and sizes columns, and renders row headers', () => {
      renderTable();
      expect(header('Score')).toHaveClass('has-text-right');
      expect(header('Score')).toHaveStyle({ width: '80px' });
      const row = screen.getAllByRole('row')[1];
      const rowHeader = within(row).getByRole('rowheader');
      expect(rowHeader).toHaveTextContent('Ada Lovelace');
      expect(rowHeader).toHaveAttribute('scope', 'row');
      expect(within(row).getAllByRole('cell')[1]).toHaveClass('has-text-right');
    });

    it('passes rowProps to each row, with its own props winning', () => {
      const onClick = jest.fn();
      renderTable({
        selectionMode: 'multiple',
        defaultSelected: ['p1'],
        rowProps: row =>
          ({
            className: `row-${row.id}`,
            onClick: () => onClick(row.id),
            isSelected: false,
          }) as never,
      });
      const row = screen.getAllByRole('row')[1];
      expect(row).toHaveClass('row-p1', 'is-selected');
      fireEvent.click(within(row).getByRole('rowheader'));
      expect(onClick).toHaveBeenCalledWith('p1');
    });

    it('prefixes every class it adds under a ConfigProvider', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bestax-">
          <DataTable
            caption="People"
            columns={columns}
            data={people}
            selectionMode="multiple"
            defaultSelected={['p1']}
            hasSearch
            toolbar={() => <span>Tools</span>}
            pageSize={2}
          />
          <DataTable aria-label="Nothing" columns={columns} data={[]} />
        </ConfigProvider>
      );
      for (const name of [
        'data-table',
        'data-table-toolbar',
        'data-table-actions',
        'data-table-sort',
        'data-table-empty',
        'table',
        'is-selected',
        'is-narrow',
        'pagination',
      ]) {
        expect(container.querySelector(`.bestax-${name}`)).not.toBeNull();
        expect(container.querySelector(`.${name}`)).toBeNull();
      }
    });
  });

  describe('sorting', () => {
    it('cycles a header through ascending, descending and unsorted', () => {
      const onSortChange = jest.fn();
      renderTable({ onSortChange });
      expect(header('Name')).not.toHaveAttribute('aria-sort');
      fireEvent.click(sortButton('Name'));
      expect(onSortChange).toHaveBeenLastCalledWith([
        { id: 'name', direction: 'ascending' },
      ]);
      expect(header('Name')).toHaveAttribute('aria-sort', 'ascending');
      expect(names()).toEqual([
        'Ada Lovelace',
        'Alan Turing',
        'Edsger Dijkstra',
        'Grace Hopper',
        'Katherine Johnson',
      ]);
      fireEvent.click(sortButton('Name'));
      expect(header('Name')).toHaveAttribute('aria-sort', 'descending');
      expect(names()[0]).toBe('Katherine Johnson');
      fireEvent.click(sortButton('Name'));
      expect(header('Name')).not.toHaveAttribute('aria-sort');
      expect(onSortChange).toHaveBeenLastCalledWith([]);
      expect(names()).toEqual(people.map(person => person.name));
    });

    it('puts aria-sort on one header at a time', () => {
      const { container } = renderTable();
      fireEvent.click(sortButton('Name'));
      fireEvent.click(sortButton('Role'));
      expect(container.querySelectorAll('th[aria-sort]')).toHaveLength(1);
      expect(header('Role')).toHaveAttribute('aria-sort', 'ascending');
    });

    it('sorts descending first with sortDescFirst, and empty values last', () => {
      renderTable();
      fireEvent.click(sortButton('Score'));
      expect(header('Score')).toHaveAttribute('aria-sort', 'descending');
      expect(names()).toEqual([
        'Ada Lovelace',
        'Alan Turing',
        'Edsger Dijkstra',
        'Katherine Johnson',
        'Grace Hopper',
      ]);
      fireEvent.click(sortButton('Score'));
      expect(header('Score')).toHaveAttribute('aria-sort', 'ascending');
      // The empty score stays last going up too.
      expect(names()).toEqual([
        'Katherine Johnson',
        'Edsger Dijkstra',
        'Alan Turing',
        'Ada Lovelace',
        'Grace Hopper',
      ]);
      fireEvent.click(sortButton('Score'));
      expect(header('Score')).not.toHaveAttribute('aria-sort');
    });

    it('compares numbers, dates, booleans and numbered text by value', () => {
      type Row = { id: string; when: Date; on: boolean; label: string };
      const rows: Row[] = [
        { id: 'a', when: new Date(2024, 1, 1), on: true, label: 'Item 10' },
        { id: 'b', when: new Date(2023, 5, 1), on: false, label: 'Item 9' },
        { id: 'c', when: new Date(NaN), on: true, label: '' },
        { id: 'd', when: new Date(2025, 0, 1), on: false, label: 'Item 1' },
      ];
      const { result } = renderHook(
        ({ id }: { id: keyof Row }) =>
          useDataTable<Row>({
            columns: [
              { id: 'when', header: 'When' },
              { id: 'on', header: 'On' },
              { id: 'label', header: 'Label' },
            ],
            data: rows,
            sort: [{ id, direction: 'ascending' }],
          }),
        { initialProps: { id: 'when' as keyof Row } }
      );
      const ids = () => result.current.getRows().map(row => row.id);
      expect(ids()).toEqual(['b', 'a', 'd', 'c']);
      expect(
        renderHook(() =>
          useDataTable<Row>({
            columns: [{ id: 'on', header: 'On' }],
            data: rows,
            sort: [{ id: 'on', direction: 'descending' }],
          })
        )
          .result.current.getRows()
          .map(row => row.id)
      ).toEqual(['a', 'c', 'b', 'd']);
      expect(
        renderHook(() =>
          useDataTable<Row>({
            columns: [{ id: 'label', header: 'Label' }],
            data: rows,
            sort: [{ id: 'label', direction: 'ascending' }],
          })
        )
          .result.current.getRows()
          .map(row => row.label)
      ).toEqual(['Item 1', 'Item 9', 'Item 10', '']);
    });

    it('puts NaN and undefined last, and keeps ties in data order', () => {
      type Row = { id: string; n?: number };
      const rows: Row[] = [
        { id: 'a', n: 2 },
        { id: 'b', n: NaN },
        { id: 'c' },
        { id: 'd', n: 1 },
        { id: 'e', n: 2 },
      ];
      const { result } = renderHook(() =>
        useDataTable<Row>({
          columns: [{ id: 'n', header: 'N' }],
          data: rows,
          sort: [{ id: 'n', direction: 'descending' }],
        })
      );
      expect(result.current.getRows().map(row => row.id)).toEqual([
        'a',
        'e',
        'd',
        'b',
        'c',
      ]);
    });

    it('uses sortFn, reversed for descending, and breaks ties with the next entry', () => {
      const byLength = (a: Person, b: Person) => a.name.length - b.name.length;
      const { result, rerender } = renderHook(
        ({ direction }: { direction: 'ascending' | 'descending' }) =>
          useDataTable<Person>({
            columns: [
              { id: 'name', header: 'Name', sortFn: byLength },
              { id: 'role', header: 'Role' },
            ],
            data: people,
            sort: [
              { id: 'role', direction },
              { id: 'missing', direction },
              { id: 'name', direction: 'ascending' },
            ],
          }),
        { initialProps: { direction: 'ascending' as const } }
      );
      expect(result.current.getRows().map(row => row.name)).toEqual([
        'Ada Lovelace',
        'Katherine Johnson',
        'Alan Turing',
        'Edsger Dijkstra',
        'Grace Hopper',
      ]);
      rerender({ direction: 'descending' as never });
      expect(result.current.getRows().map(row => row.name)).toEqual([
        'Grace Hopper',
        'Alan Turing',
        'Edsger Dijkstra',
        'Ada Lovelace',
        'Katherine Johnson',
      ]);
      const reversed = renderHook(() =>
        useDataTable<Person>({
          columns: [{ id: 'name', header: 'Name', sortFn: byLength }],
          data: people,
          sort: [{ id: 'name', direction: 'descending' }],
        })
      );
      expect(reversed.result.current.getRows()[0].name).toBe(
        'Katherine Johnson'
      );
    });

    it("compares text in the LocaleProvider's locale", () => {
      const rows = [
        { id: '1', word: 'Zebra' },
        { id: '2', word: 'Äpple' },
      ];
      const sorted = (locale: string) =>
        renderHook(
          () =>
            useDataTable({
              columns: [{ id: 'word', header: 'Word' }],
              data: rows,
              sort: [{ id: 'word', direction: 'ascending' }],
            }),
          {
            wrapper: ({ children }) => (
              <LocaleProvider locale={locale}>{children}</LocaleProvider>
            ),
          }
        )
          .result.current.getRows()
          .map(row => row.word);
      expect(sorted('de')).toEqual(['Äpple', 'Zebra']);
      expect(sorted('sv')).toEqual(['Zebra', 'Äpple']);
    });

    it('waits for the parent with a controlled sort', () => {
      const onSortChange = jest.fn();
      renderTable({ sort: [], onSortChange });
      fireEvent.click(sortButton('Role'));
      expect(onSortChange).toHaveBeenCalledWith([
        { id: 'role', direction: 'ascending' },
      ]);
      expect(header('Role')).not.toHaveAttribute('aria-sort');
    });

    it('marks a column sorted from outside even when it has no button', () => {
      renderTable({
        columns: [{ id: 'name', header: 'Name' }],
        defaultSort: [{ id: 'name', direction: 'descending' }],
      });
      expect(
        screen.getByRole('columnheader', { name: 'Name' })
      ).toHaveAttribute('aria-sort', 'descending');
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('ignores a sort toggled for a column it does not have', () => {
      const onSortChange = jest.fn();
      const { result } = renderHook(() =>
        useDataTable({ columns, data: people, onSortChange })
      );
      act(() => result.current.toggleSort('nope'));
      expect(onSortChange).not.toHaveBeenCalled();
    });
  });

  describe('selection', () => {
    it('adds a narrow checkbox column, named for each row', () => {
      renderTable({ selectionMode: 'multiple' });
      const all = screen.getByRole('checkbox', { name: 'Select all rows' });
      expect(all.closest('th')).toHaveClass('is-narrow');
      expect(all.closest('th')).toHaveAttribute('scope', 'col');
      const ada = screen.getByRole('checkbox', { name: 'Select Ada Lovelace' });
      expect(ada.closest('td')).toHaveClass('is-narrow');
      expect(screen.getAllByRole('checkbox')).toHaveLength(people.length + 1);
    });

    it('names rows from the first column without a row header, then the id', () => {
      render(
        <DataTable
          aria-label="People"
          columns={[
            {
              id: 'role',
              header: 'Role',
              format: (value, row) => (row.id === 'p2' ? '' : String(value)),
            },
          ]}
          data={people.slice(0, 2)}
          selectionMode="multiple"
          labels={{ selectRow: label => `Choose ${label}` }}
        />
      );
      expect(
        screen.getByRole('checkbox', { name: 'Choose Admin' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: 'Choose p2' })
      ).toBeInTheDocument();
    });

    it('selects rows, marks them selected and reports the ids', () => {
      const onSelectedChange = jest.fn();
      renderTable({ selectionMode: 'multiple', onSelectedChange });
      const all = screen.getByRole('checkbox', {
        name: 'Select all rows',
      }) as HTMLInputElement;
      fireEvent.click(
        screen.getByRole('checkbox', { name: 'Select Alan Turing' })
      );
      expect(onSelectedChange).toHaveBeenLastCalledWith(['p2']);
      const row = screen.getAllByRole('row')[2];
      expect(row).toHaveClass('is-selected');
      expect(row).not.toHaveAttribute('aria-selected');
      expect(all.indeterminate).toBe(true);
      expect(all.checked).toBe(false);
      fireEvent.click(all);
      expect(onSelectedChange).toHaveBeenLastCalledWith([
        'p2',
        'p1',
        'p3',
        'p4',
        'p5',
      ]);
      expect(all.checked).toBe(true);
      expect(all.indeterminate).toBe(false);
      fireEvent.click(all);
      expect(onSelectedChange).toHaveBeenLastCalledWith([]);
      expect(all.checked).toBe(false);
      fireEvent.click(
        screen.getByRole('checkbox', { name: 'Select Alan Turing' })
      );
      fireEvent.click(
        screen.getByRole('checkbox', { name: 'Select Alan Turing' })
      );
      expect(onSelectedChange).toHaveBeenLastCalledWith([]);
    });

    it('covers only the page shown, and keeps the selection across pages', () => {
      renderTable({ selectionMode: 'multiple', pageSize: 2 });
      const all = screen.getByRole('checkbox', {
        name: 'Select all rows on this page',
      }) as HTMLInputElement;
      fireEvent.click(all);
      expect(screen.getAllByRole('row').slice(1)).toHaveLength(2);
      fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
      expect(all.checked).toBe(false);
      expect(all.indeterminate).toBe(false);
      fireEvent.click(screen.getByRole('button', { name: 'Page 1' }));
      expect(all.checked).toBe(true);
    });

    it('keeps a selected row selected while the search hides it', () => {
      const onSelectedChange = jest.fn();
      renderTable({
        selectionMode: 'multiple',
        defaultSelected: ['p1'],
        onSelectedChange,
        hasSearch: true,
      });
      fireEvent.change(screen.getByRole('searchbox'), {
        target: { value: 'alan' },
      });
      fireEvent.click(
        screen.getByRole('checkbox', { name: 'Select all rows' })
      );
      expect(onSelectedChange).toHaveBeenLastCalledWith(['p1', 'p2']);
    });

    it('waits for the parent with a controlled selection', () => {
      const onSelectedChange = jest.fn();
      renderTable({
        selectionMode: 'multiple',
        selected: ['p3'],
        onSelectedChange,
      });
      fireEvent.click(
        screen.getByRole('checkbox', { name: 'Select Ada Lovelace' })
      );
      expect(onSelectedChange).toHaveBeenCalledWith(['p3', 'p1']);
      expect(
        screen.getByRole('checkbox', { name: 'Select Ada Lovelace' })
      ).not.toBeChecked();
      expect(
        screen.getByRole('checkbox', { name: 'Select Grace Hopper' })
      ).toBeChecked();
    });

    it('disables select all when there are no rows', () => {
      renderTable({ selectionMode: 'multiple', data: [] });
      expect(
        screen.getByRole('checkbox', { name: 'Select all rows' })
      ).toBeDisabled();
    });

    it('selects nothing with no selection mode', () => {
      const { result } = renderHook(() =>
        useDataTable({ columns, data: people, selected: ['p1'] })
      );
      expect(result.current.isSelected(people[0])).toBe(false);
      expect(result.current.getRowProps(people[0])).toEqual({
        isSelected: false,
      });
    });

    it('changes nothing when a toggle asks for what is already so', () => {
      const onSelectedChange = jest.fn();
      const { result } = renderHook(() =>
        useDataTable({
          columns,
          data: people.slice(0, 2),
          selectionMode: 'multiple',
          defaultSelected: ['p1', 'p2'],
          onSelectedChange,
        })
      );
      act(() => result.current.toggleRowSelected(people[0], true));
      act(() => result.current.togglePageSelected(true));
      expect(onSelectedChange).not.toHaveBeenCalled();
      act(() => result.current.togglePageSelected(false));
      expect(onSelectedChange).toHaveBeenLastCalledWith([]);
      act(() => result.current.togglePageSelected(false));
      expect(onSelectedChange).toHaveBeenCalledTimes(1);
      act(() => result.current.setSelected(['p2']));
      expect(result.current.state.selected).toEqual(['p2']);
    });
  });

  describe('paging', () => {
    it('pages through Pagination, named after the table', () => {
      const onPageChange = jest.fn();
      renderTable({ pageSize: 2, onPageChange });
      const pager = screen.getByRole('navigation', { name: 'People pages' });
      expect(
        within(pager).getAllByRole('button', { name: /^Page/ })
      ).toHaveLength(3);
      expect(names()).toEqual(['Ada Lovelace', 'Alan Turing']);
      fireEvent.click(within(pager).getByRole('button', { name: 'Page 3' }));
      expect(onPageChange).toHaveBeenLastCalledWith(3);
      expect(names()).toEqual(['Edsger Dijkstra']);
    });

    it('names the pager from aria-label, labels, or leaves it to Pagination', () => {
      const { rerender } = render(
        <DataTable
          aria-label="Staff"
          columns={columns}
          data={people}
          pageSize={2}
        />
      );
      expect(screen.getByRole('navigation')).toHaveAccessibleName(
        'Staff pages'
      );
      rerender(
        <DataTable
          aria-label="Staff"
          columns={columns}
          data={people}
          pageSize={2}
          labels={{ pagination: 'Staff, by page' }}
        />
      );
      expect(screen.getByRole('navigation')).toHaveAccessibleName(
        'Staff, by page'
      );
      rerender(
        <DataTable
          aria-labelledby="x"
          columns={columns}
          data={people}
          pageSize={2}
        />
      );
      expect(screen.getByRole('navigation')).toHaveAccessibleName('pagination');
    });

    it('shows no pager for one page, or without a usable pageSize', () => {
      const { rerender } = renderTable({ pageSize: 10 });
      expect(screen.queryByRole('navigation')).toBeNull();
      rerender(
        <DataTable
          caption="People"
          columns={columns}
          data={people}
          pageSize={0}
        />
      );
      expect(screen.queryByRole('navigation')).toBeNull();
      expect(names()).toHaveLength(people.length);
      rerender(
        <DataTable
          caption="People"
          columns={columns}
          data={people}
          pageSize={NaN}
        />
      );
      expect(names()).toHaveLength(people.length);
    });

    it('shows the last page for a page past the end, and the first for one before it', () => {
      const { rerender } = renderTable({ pageSize: 2, page: 9 });
      expect(names()).toEqual(['Edsger Dijkstra']);
      rerender(
        <DataTable
          caption="People"
          columns={columns}
          data={people}
          pageSize={2}
          page={-1}
        />
      );
      expect(names()).toEqual(['Ada Lovelace', 'Alan Turing']);
      rerender(
        <DataTable
          caption="People"
          columns={columns}
          data={people}
          pageSize={2}
          page={NaN}
        />
      );
      expect(names()).toEqual(['Ada Lovelace', 'Alan Turing']);
      rerender(
        <DataTable
          caption="People"
          columns={columns}
          data={people}
          pageSize={2.5}
          defaultPage={2}
        />
      );
      expect(names()).toEqual(['Ada Lovelace', 'Alan Turing']);
    });

    it('starts on defaultPage, and does not report the page it is on', () => {
      const onPageChange = jest.fn();
      const { result } = renderHook(() =>
        useDataTable({
          columns,
          data: people,
          pageSize: 2,
          defaultPage: 2,
          onPageChange,
        })
      );
      expect(result.current.state.page).toBe(2);
      expect(result.current.getPaginationProps()).toEqual({
        total: 3,
        current: 2,
        onPageChange: result.current.setPage,
      });
      act(() => result.current.setPage(2));
      expect(onPageChange).not.toHaveBeenCalled();
    });
  });

  describe('filtering', () => {
    it('searches every filterable column, and goes back to page 1', () => {
      const onSearchChange = jest.fn();
      const onPageChange = jest.fn();
      renderTable({
        hasSearch: true,
        pageSize: 2,
        defaultPage: 2,
        onSearchChange,
        onPageChange,
        columns: [...columns, { id: 'id', header: 'Id', filterable: false }],
      });
      const search = screen.getByRole('searchbox', { name: 'Search' });
      fireEvent.change(search, { target: { value: '  EDITOR ' } });
      expect(onSearchChange).toHaveBeenLastCalledWith('  EDITOR ');
      expect(onPageChange).toHaveBeenLastCalledWith(1);
      expect(names()).toEqual(['Alan Turing', 'Edsger Dijkstra']);
      fireEvent.change(search, { target: { value: 'p1' } });
      expect(names()).toEqual([]);
    });

    it('matches accents as the LocaleProvider language does', () => {
      const data = [
        { id: '1', word: 'Café' },
        { id: '2', word: 'Cafeteria' },
      ];
      const ui = (search: string) => (
        <DataTable
          aria-label="Words"
          columns={[{ id: 'word', header: 'Word', isRowHeader: true }]}
          data={data}
          search={search}
        />
      );
      const { rerender } = render(ui('café'));
      expect(names()).toEqual(['Café']);
      rerender(<LocaleProvider locale="fr">{ui('cafe')}</LocaleProvider>);
      expect(names()).toEqual(['Café', 'Cafeteria']);
    });

    it('filters by column value, with filterFn or by text', () => {
      const onFiltersChange = jest.fn();
      const { result } = renderHook(() =>
        useDataTable<Person>({
          columns: [
            ...columns,
            {
              id: 'min',
              header: 'Min',
              accessor: 'score',
              filterFn: (row, value) => (row.score ?? 0) >= (value as number),
            },
            { id: 'id', header: 'Id', filterable: false },
          ],
          data: people,
          onFiltersChange,
        })
      );
      const shown = () => result.current.getRows().map(row => row.id);
      act(() => result.current.setFilter('role', 'admin'));
      expect(onFiltersChange).toHaveBeenLastCalledWith({ role: 'admin' });
      expect(shown()).toEqual(['p1', 'p4']);
      act(() => result.current.setFilter('min', 95));
      expect(shown()).toEqual(['p1']);
      act(() => result.current.setFilter('role', ''));
      expect(result.current.state.filters).toEqual({ min: 95 });
      expect(shown()).toEqual(['p1', 'p2']);
      act(() =>
        result.current.setFilters({
          min: null,
          role: [],
          nope: 'x',
          id: 'p9',
        })
      );
      expect(shown()).toEqual(people.map(person => person.id));
    });

    it('passes a row whose text matches any entry of an array', () => {
      const filterFn = jest.fn(() => true);
      const { result } = renderHook(() =>
        useDataTable<Person>({
          columns: [...columns, { id: 'id', header: 'Id', filterFn }],
          data: people,
        })
      );
      const shown = () => result.current.getRows().map(row => row.id);
      act(() => result.current.setFilter('role', ['Admin', 'viewer']));
      expect(shown()).toEqual(['p1', 'p3', 'p4']);
      act(() => result.current.setFilter('role', ['editor']));
      expect(shown()).toEqual(['p2', 'p5']);
      // Numbers are matched as their text, as a single value is.
      act(() => result.current.setFilters({ score: [98, 91] }));
      expect(shown()).toEqual(['p1', 'p5']);
      // A filterFn gets the array as it is.
      act(() => result.current.setFilters({ id: ['p1', 'p2'] }));
      expect(filterFn).toHaveBeenCalledWith(people[0], ['p1', 'p2']);
    });

    it('matches array entries in the LocaleProvider locale', () => {
      const { result } = renderHook(
        () =>
          useDataTable({
            columns: [{ id: 'word', header: 'Word' }],
            data: [
              { id: '1', word: 'Café' },
              { id: '2', word: 'Thé' },
              { id: '3', word: 'Eau' },
            ],
            filters: { word: ['cafe', 'the'] },
          }),
        {
          wrapper: ({ children }) => (
            <LocaleProvider locale="fr">{children}</LocaleProvider>
          ),
        }
      );
      expect(result.current.getRows().map(row => row.id)).toEqual(['1', '2']);
    });

    it('builds a second change in one handler on the first', () => {
      const onFiltersChange = jest.fn();
      const onSelectedChange = jest.fn();
      const { result } = renderHook(() =>
        useDataTable<Person>({
          columns,
          data: people,
          selectionMode: 'multiple',
          pageSize: 2,
          onFiltersChange,
          onSelectedChange,
        })
      );
      act(() => {
        result.current.setFilter('role', 'admin');
        result.current.setFilter('name', 'ada');
      });
      expect(result.current.state.filters).toEqual({
        role: 'admin',
        name: 'ada',
      });
      expect(onFiltersChange).toHaveBeenLastCalledWith({
        role: 'admin',
        name: 'ada',
      });
      act(() => {
        result.current.setFilter('role', undefined);
        result.current.setFilter('name', undefined);
      });
      expect(result.current.state.filters).toEqual({});
      act(() => {
        result.current.toggleRowSelected(people[0]);
        result.current.toggleRowSelected(people[2]);
      });
      expect(result.current.state.selected).toEqual(['p1', 'p3']);
      act(() => {
        // The page is p1 and p2: p1 is selected already, so this adds p2.
        result.current.togglePageSelected();
        result.current.toggleRowSelected(people[0], false);
      });
      expect(result.current.state.selected).toEqual(['p3', 'p2']);
      act(() => {
        result.current.togglePageSelected(false);
        result.current.togglePageSelected();
      });
      expect(onSelectedChange).toHaveBeenLastCalledWith(['p3', 'p1', 'p2']);
    });

    it('builds each change on the state as rendered while the parent holds it', () => {
      const onFiltersChange = jest.fn();
      const onSelectedChange = jest.fn();
      const { result } = renderHook(() =>
        useDataTable<Person>({
          columns,
          data: people,
          selectionMode: 'multiple',
          filters: { role: 'admin' },
          selected: ['p3'],
          onFiltersChange,
          onSelectedChange,
        })
      );
      act(() => {
        result.current.setFilter('name', 'ada');
        result.current.setFilter('score', '98');
      });
      expect(onFiltersChange).toHaveBeenLastCalledWith({
        role: 'admin',
        score: '98',
      });
      act(() => {
        result.current.toggleRowSelected(people[0]);
        result.current.toggleRowSelected(people[1]);
      });
      expect(onSelectedChange).toHaveBeenLastCalledWith(['p3', 'p2']);
    });

    it('goes back to the page it holds, not the one it shows, on a new search', () => {
      // Five rows in pages of two, held on page 3, then down to one row, so
      // page 3 shows as page 1. A search then has to reset the page held, or
      // page 3 comes back when the rows do.
      const { result, rerender } = renderHook(
        ({ data }: { data: Person[] }) =>
          useDataTable<Person>({
            columns,
            data,
            pageSize: 2,
            defaultPage: 3,
          }),
        { initialProps: { data: people } }
      );
      expect(result.current.state.page).toBe(3);
      rerender({ data: people.slice(0, 1) });
      expect(result.current.state.page).toBe(1);
      act(() => result.current.setSearch(''));
      rerender({ data: people });
      expect(result.current.state.page).toBe(1);
      expect(result.current.getRows('page')).toEqual(people.slice(0, 2));
    });

    it('tells the parent to go to page 1 when the page it holds is past the end', () => {
      const onPageChange = jest.fn();
      const { result, rerender } = renderHook(
        ({ data, page }: { data: Person[]; page: number }) =>
          useDataTable<Person>({
            columns,
            data,
            pageSize: 2,
            page,
            onPageChange,
          }),
        { initialProps: { data: people, page: 3 } }
      );
      rerender({ data: people.slice(0, 1), page: 3 });
      expect(result.current.state.page).toBe(1);
      act(() => result.current.setFilter('role', 'admin'));
      expect(onPageChange).toHaveBeenCalledTimes(1);
      expect(onPageChange).toHaveBeenLastCalledWith(1);
      // On page 1 already, a new search asks for nothing.
      rerender({ data: people, page: 1 });
      act(() => result.current.setSearch('a'));
      expect(onPageChange).toHaveBeenCalledTimes(1);
    });

    it('waits for the parent with controlled search and filters', () => {
      const onSearchChange = jest.fn();
      renderTable({
        hasSearch: true,
        search: 'ada',
        onSearchChange,
        filters: { role: 'Admin' },
      });
      expect(names()).toEqual(['Ada Lovelace']);
      fireEvent.change(screen.getByRole('searchbox'), {
        target: { value: '' },
      });
      expect(onSearchChange).toHaveBeenCalledWith('');
      expect(names()).toEqual(['Ada Lovelace']);
    });
  });

  describe('empty, no results and loading', () => {
    it('shows the empty state across every column', () => {
      renderTable({ data: [], selectionMode: 'multiple' });
      const cell = screen.getByText('No rows to show.').closest('td')!;
      expect(cell).toHaveAttribute('colspan', '4');
      expect(cell).toHaveClass('data-table-empty');
      expect(cell.querySelector('.empty-state')).not.toBeNull();
      // No heading: the table can't know the level it sits under.
      expect(screen.queryByRole('heading')).toBeNull();
    });

    it('shows no results when the search lets nothing through', () => {
      renderTable({ search: 'kraken' });
      expect(screen.getByText('No rows match.').closest('td')).toHaveAttribute(
        'colspan',
        '3'
      );
    });

    it('takes content of its own, labels, or nothing', () => {
      const { rerender } = renderTable({
        data: [],
        empty: <p>Add someone</p>,
      });
      expect(screen.getByText('Add someone')).toBeInTheDocument();
      rerender(
        <DataTable
          caption="People"
          columns={columns}
          data={people}
          search="kraken"
          noResults={<p>Clear it</p>}
        />
      );
      expect(screen.getByText('Clear it')).toBeInTheDocument();
      rerender(
        <DataTable
          caption="People"
          columns={columns}
          data={people}
          search="kraken"
          labels={{ noResults: 'Nobody.' }}
        />
      );
      expect(screen.getByText('Nobody.')).toBeInTheDocument();
      rerender(
        <DataTable
          caption="People"
          columns={columns}
          data={[]}
          labels={{ empty: 'Empty.' }}
        />
      );
      expect(screen.getByText('Empty.')).toBeInTheDocument();
      rerender(
        <DataTable caption="People" columns={columns} data={[]} empty={null} />
      );
      expect(document.querySelector('.data-table-empty')).toBeEmptyDOMElement();
      rerender(
        <DataTable
          caption="People"
          columns={columns}
          data={people}
          search="kraken"
          noResults={null}
        />
      );
      expect(document.querySelector('.data-table-empty')).toBeEmptyDOMElement();
    });

    it('with manual, reads no rows under a search as no results', () => {
      const { rerender } = render(
        <DataTable caption="People" columns={columns} data={[]} manual />
      );
      expect(screen.getByText('No rows to show.')).toBeInTheDocument();
      rerender(
        <DataTable
          caption="People"
          columns={columns}
          data={[]}
          manual
          filters={{ role: 'Admin' }}
        />
      );
      expect(screen.getByText('No rows match.')).toBeInTheDocument();
    });

    it('shows skeleton rows under the header while loading', () => {
      const { container, rerender } = renderTable({
        loading: true,
        selectionMode: 'multiple',
        pageSize: 3,
      });
      const table = container.querySelector('table')!;
      expect(table).toHaveAttribute('aria-busy', 'true');
      const rows = container.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(3);
      expect(rows[0]).toHaveAttribute('aria-hidden', 'true');
      expect(rows[0].querySelectorAll('td .skeleton-lines')).toHaveLength(4);
      expect(screen.getAllByRole('columnheader')).toHaveLength(4);
      // The rows it would select aren't on screen.
      expect(screen.getByRole('checkbox')).toBeDisabled();
      rerender(
        <DataTable caption="People" columns={columns} data={people} loading />
      );
      expect(container.querySelectorAll('tbody tr')).toHaveLength(5);
      rerender(<DataTable caption="People" columns={columns} data={people} />);
      expect(table).not.toHaveAttribute('aria-busy');
    });
  });

  describe('the status message', () => {
    const status = () => screen.getByRole('status');

    it('says nothing on mount, then the count a moment after the search changes', () => {
      jest.useFakeTimers();
      renderTable({ hasSearch: true });
      act(() => jest.advanceTimersByTime(1000));
      expect(status()).toBeEmptyDOMElement();
      const search = screen.getByRole('searchbox');
      fireEvent.change(search, { target: { value: 'a' } });
      act(() => jest.advanceTimersByTime(200));
      fireEvent.change(search, { target: { value: 'ad' } });
      act(() => jest.advanceTimersByTime(200));
      expect(status()).toBeEmptyDOMElement();
      act(() => jest.advanceTimersByTime(400));
      expect(status()).toHaveTextContent('2 rows match');
      fireEvent.change(search, { target: { value: 'alan' } });
      act(() => jest.advanceTimersByTime(600));
      expect(status()).toHaveTextContent('1 row matches');
      fireEvent.change(search, { target: { value: 'kraken' } });
      act(() => jest.advanceTimersByTime(600));
      expect(status()).toHaveTextContent('No rows match');
      expect(status()).toHaveAttribute('aria-live', 'polite');
    });

    it('says the range after a page change', () => {
      jest.useFakeTimers();
      renderTable({ pageSize: 2 });
      fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
      act(() => jest.advanceTimersByTime(600));
      expect(status()).toHaveTextContent('Showing 5 to 5 of 5');
    });

    it('says Loading while loading after a change, and the count in the locale', () => {
      jest.useFakeTimers();
      const ui = (props: Partial<DataTableProps<Person>>) => (
        <LocaleProvider locale="de">
          <DataTable
            caption="People"
            columns={columns}
            data={people.slice(0, 2)}
            manual
            rowCount={12345}
            pageSize={2}
            {...props}
          />
        </LocaleProvider>
      );
      const { rerender } = render(ui({ search: '' }));
      rerender(ui({ search: 'a', loading: true }));
      act(() => jest.advanceTimersByTime(600));
      expect(status()).toHaveTextContent('Loading');
      rerender(ui({ search: 'a' }));
      act(() => jest.advanceTimersByTime(600));
      expect(status()).toHaveTextContent('12.345 rows match');
      rerender(ui({ search: 'a', page: 3 }));
      act(() => jest.advanceTimersByTime(600));
      expect(status()).toHaveTextContent('Showing 5 to 6 of 12.345');
    });

    it('takes its words from labels', () => {
      jest.useFakeTimers();
      const { rerender } = render(
        <DataTable
          caption="People"
          columns={columns}
          data={people}
          pageSize={2}
          labels={{
            results: count => `${count} Treffer`,
            pageRange: (first, last, total) => `${first}–${last} von ${total}`,
            loading: 'Lädt',
          }}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
      act(() => jest.advanceTimersByTime(600));
      expect(status()).toHaveTextContent('3–4 von 5');
      rerender(
        <DataTable
          caption="People"
          columns={columns}
          data={people}
          pageSize={2}
          search="ada"
          labels={{ results: count => `${count} Treffer` }}
        />
      );
      act(() => jest.advanceTimersByTime(600));
      expect(status()).toHaveTextContent('1 Treffer');
    });

    it('says the count when the rows run out under the page', () => {
      jest.useFakeTimers();
      const { rerender } = renderTable({ pageSize: 2 });
      fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
      rerender(
        <DataTable caption="People" columns={columns} data={[]} pageSize={2} />
      );
      act(() => jest.advanceTimersByTime(600));
      expect(status()).toHaveTextContent('No rows match');
    });

    it('says the whole range when the page size is taken away', () => {
      jest.useFakeTimers();
      const { rerender } = renderTable({ pageSize: 2 });
      fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
      rerender(<DataTable caption="People" columns={columns} data={people} />);
      act(() => jest.advanceTimersByTime(600));
      expect(status()).toHaveTextContent('Showing 1 to 5 of 5');
    });

    it('survives filters it cannot write out', () => {
      const loop: Record<string, unknown> = {};
      loop.self = loop;
      renderTable({
        filters: { role: loop },
        columns: [
          ...columns.slice(0, 1),
          { ...columns[1], filterFn: () => true },
        ],
      });
      expect(names()).toHaveLength(people.length);
    });
  });

  describe('the toolbar', () => {
    it('renders the search field and the toolbar slot, given the table', () => {
      let given: DataTableModel<Person> | undefined;
      const { container } = renderTable({
        hasSearch: true,
        toolbar: table => {
          given = table;
          return <button type="button">Export</button>;
        },
      });
      const toolbar = container.querySelector('.data-table-toolbar')!;
      expect(
        within(toolbar as HTMLElement).getByRole('searchbox')
      ).toHaveAttribute('type', 'search');
      expect(toolbar.querySelector('.data-table-actions')).toContainElement(
        screen.getByRole('button', { name: 'Export' })
      );
      expect(given?.getRows()).toHaveLength(people.length);
      expect(toolbar.nextElementSibling?.tagName).toBe('TABLE');
    });

    it('renders no toolbar when the slot renders nothing and there is no search', () => {
      const { container, rerender } = renderTable({ toolbar: () => null });
      expect(container.querySelector('.data-table-toolbar')).toBeNull();
      rerender(
        <DataTable
          caption="People"
          columns={columns}
          data={people}
          hasSearch
          labels={{ search: 'Find people' }}
        />
      );
      expect(
        screen.getByRole('searchbox', { name: 'Find people' })
      ).toBeInTheDocument();
      expect(container.querySelector('.data-table-actions')).toBeNull();
    });
  });

  describe('isResponsive', () => {
    it('scrolls the table in a ScrollArea named after it', () => {
      const { container, rerender } = renderTable({ isResponsive: true });
      const viewport = container.querySelector('.scroll-area-viewport')!;
      expect(viewport.querySelector('table')).not.toBeNull();
      expect(container.querySelector('.table-container')).toBeNull();
      const nameId = container.querySelector('caption span')!.id;
      expect(nameId).not.toBe('');
      // Named only while it overflows, which jsdom never measures, so the
      // name waits on the props it was given.
      const scrollArea = container.querySelector('.scroll-area');
      expect(scrollArea).not.toBeNull();
      rerender(
        <DataTable
          aria-label="Staff"
          columns={columns}
          data={people}
          isResponsive
        />
      );
      expect(
        container.querySelector('.scroll-area-viewport table')
      ).toHaveAttribute('aria-label', 'Staff');
      rerender(
        <DataTable
          aria-labelledby="h"
          columns={columns}
          data={people}
          isResponsive
        />
      );
      expect(
        container.querySelector('.scroll-area-viewport table')
      ).not.toBeNull();
    });
  });

  describe('with a table from useDataTable', () => {
    function Page({ extra }: { extra?: Partial<DataTableProps<Person>> }) {
      const table = useDataTable({
        columns,
        data: people,
        selectionMode: 'multiple',
        pageSize: 2,
      });
      return (
        <>
          <p data-testid="count">{table.state.selected.length} picked</p>
          <DataTable table={table} caption="People" {...extra} />
        </>
      );
    }

    it('renders that table, which the rest of the page reads', () => {
      render(<Page />);
      fireEvent.click(
        screen.getByRole('checkbox', { name: 'Select Ada Lovelace' })
      );
      expect(screen.getByTestId('count')).toHaveTextContent('1 picked');
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(warn).not.toHaveBeenCalled();
    });

    it('warns when it is given columns or data as well', () => {
      render(<Page extra={{ data: [] }} />);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('was given a `table` and `columns`')
      );
      expect(names()).toHaveLength(2);
    });
  });

  describe('development warnings', () => {
    it('warns when the table has no name', () => {
      render(<DataTable columns={columns} data={people} />);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('<DataTable> has no accessible name')
      );
    });

    it('warns with neither columns and data nor a table, and still renders', () => {
      const { container } = render(<DataTable caption="Nothing" />);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('needs `columns` and `data`')
      );
      expect(container.querySelector('table')).not.toBeNull();
    });

    it('warns about a repeated column id and keeps the first', () => {
      const { result } = renderHook(() =>
        useDataTable({
          columns: [
            { id: 'name', header: 'Name' },
            { id: 'name', header: 'Again', format: () => 'x' },
          ],
          data: people,
        })
      );
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('two columns with the id "name"')
      );
      expect(result.current.getText(people[0], 'name')).toBe('Ada Lovelace');
    });

    it('falls back to the index for a row with no id, and warns', () => {
      const { result } = renderHook(() =>
        useDataTable({
          columns: [{ id: 'name', header: 'Name' }],
          data: [{ name: 'A' }, { name: 'B', id: null }, { name: 'C', id: '' }],
        })
      );
      expect(result.current.getRows().map(result.current.getRowId)).toEqual([
        '0',
        '1',
        '2',
      ]);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('row has no id')
      );
    });

    it('reads a row listed twice from its first place', () => {
      const twice = [people[0], people[1], people[0]];
      const { result } = renderHook(() =>
        useDataTable({ columns, data: twice })
      );
      expect(result.current.getRows()).toHaveLength(3);
      expect(result.current.getText(people[0], 'name')).toBe('Ada Lovelace');
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('same id, so selecting one selects both')
      );
    });

    it('warns when manual paging has no rowCount', () => {
      const { rerender } = render(
        <DataTable caption="People" columns={columns} data={people} manual />
      );
      // Not paging, so nothing is missing.
      expect(warn).not.toHaveBeenCalled();
      rerender(
        <DataTable
          caption="People"
          columns={columns}
          data={people}
          manual
          pageSize={2}
          rowCount={40}
        />
      );
      expect(warn).not.toHaveBeenCalled();
      rerender(
        <DataTable
          caption="People"
          columns={columns}
          data={people}
          manual
          pageSize={2}
        />
      );
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('`manual` and a `pageSize` has no `rowCount`')
      );
    });

    it('warns about repeated row ids', () => {
      renderHook(() =>
        useDataTable({
          columns: [{ id: 'name', header: 'Name' }],
          data: [
            { id: 1, name: 'A' },
            { id: '1', name: 'B' },
          ],
        })
      );
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('same id, so selecting one selects both')
      );
    });

    it('takes ids from getRowId, a string from it falling back too', () => {
      const getRowId = jest.fn((row: Person, index: number) =>
        index === 1 ? '' : `row-${row.name}`
      );
      const { result } = renderHook(() =>
        useDataTable({ columns, data: people.slice(0, 2), getRowId })
      );
      expect(result.current.getRows().map(result.current.getRowId)).toEqual([
        'row-Ada Lovelace',
        '1',
      ]);
      // A row that isn't in the data asks getRowId with no index.
      expect(result.current.getRowId(people[3])).toBe('row-Katherine Johnson');
      expect(getRowId).toHaveBeenLastCalledWith(people[3], -1);
    });
  });

  describe('the model', () => {
    const model = (options: Partial<UseDataTableOptions<Person>> = {}) =>
      renderHook(() =>
        useDataTable<Person>({ columns, data: people, ...options })
      ).result;

    it('reads rows in each scope, in the order the table shows them', () => {
      const result = model({
        selectionMode: 'multiple',
        defaultSelected: ['p5', 'p1', 'p2'],
        sort: [{ id: 'name', direction: 'descending' }],
        filters: { role: 'e' },
        pageSize: 1,
        defaultPage: 2,
      });
      const ids = (rows: Person[]) => rows.map(row => row.id);
      expect(ids(result.current.getRows('all'))).toEqual([
        'p4',
        'p3',
        'p5',
        'p2',
        'p1',
      ]);
      expect(ids(result.current.getRows())).toEqual(['p3', 'p5', 'p2']);
      expect(ids(result.current.getRows('filtered'))).toEqual([
        'p3',
        'p5',
        'p2',
      ]);
      expect(ids(result.current.getRows('page'))).toEqual(['p5']);
      expect(ids(result.current.getRows('selected'))).toEqual(['p5', 'p2']);
      expect(result.current.rowCount).toBe(3);
      expect(result.current.pageCount).toBe(3);
      expect(result.current.state).toEqual({
        sort: [{ id: 'name', direction: 'descending' }],
        selected: ['p5', 'p1', 'p2'],
        page: 2,
        pageSize: 1,
        search: '',
        filters: { role: 'e' },
      });
    });

    it('reads values and text by column id', () => {
      const result = model();
      const stranger: Person = {
        id: 'x',
        name: 'Stranger',
        role: 'Guest',
        score: 1,
      };
      expect(result.current.getValue(people[2], 'score')).toBeNull();
      expect(result.current.getText(people[2], 'score')).toBe('—');
      expect(result.current.getValue(people[0], 'nope')).toBeUndefined();
      expect(result.current.getText(people[0], 'nope')).toBe('');
      expect(result.current.getText(stranger, 'role')).toBe('Guest');
      expect(result.current.getRowId(stranger)).toBe('x');
      expect(result.current.getRowId({ name: 'No id' } as Person)).toBe('');
      expect(result.current.getRowLabel(people[1])).toBe('Alan Turing');
    });

    it('reads nothing from rows that are not records', () => {
      const { result } = renderHook(() =>
        useDataTable<string>({
          columns: [
            { id: 'length', header: 'Length' },
            {
              id: 'upper',
              header: 'Upper',
              accessor: word => word.toUpperCase(),
            },
          ],
          data: ['b', 'a'],
          sort: [{ id: 'upper', direction: 'ascending' }],
        })
      );
      expect(result.current.getRows()).toEqual(['a', 'b']);
      expect(result.current.getText('a', 'length')).toBe('');
      expect(result.current.getRowId('a')).toBe('1');
    });

    it('hands out props for custom markup', () => {
      const result = model({
        defaultSort: [{ id: 'name', direction: 'ascending' }],
        selectionMode: 'multiple',
      });
      expect(result.current.getHeaderCellProps(columns[0])).toEqual({
        scope: 'col',
        'aria-sort': 'ascending',
        isAligned: undefined,
        width: undefined,
      });
      expect(result.current.getHeaderCellProps(columns[2])).toEqual({
        scope: 'col',
        'aria-sort': undefined,
        isAligned: 'right',
        width: 80,
      });
      expect(result.current.getCellProps(people[0], columns[0])).toEqual({
        scope: 'row',
        isAligned: undefined,
      });
      expect(result.current.getCellProps(people[0], columns[2])).toEqual({
        scope: undefined,
        isAligned: 'right',
      });
      const button = result.current.getSortButtonProps(columns[1]);
      expect(button).toMatchObject({
        type: 'button',
        className: 'data-table-sort',
      });
      act(() => button.onClick());
      expect(result.current.state.sort).toEqual([
        { id: 'role', direction: 'ascending' },
      ]);
      const search = result.current.getSearchProps();
      expect(search).toMatchObject({ type: 'search', value: '' });
      act(() =>
        search.onChange({
          target: { value: 'ada' },
        } as React.ChangeEvent<HTMLInputElement>)
      );
      expect(result.current.getRows()).toHaveLength(1);
      expect(result.current.getSelectRowProps(people[0])).toMatchObject({
        'aria-label': 'Select Ada Lovelace',
        checked: false,
      });
      expect(result.current.getSelectAllProps()).toMatchObject({
        'aria-label': 'Select all rows',
        checked: false,
        indeterminate: false,
        disabled: false,
      });
      expect(result.current.labels).toMatchObject({
        sortHint: 'column headers with buttons are sortable',
        search: 'Search',
        loading: 'Loading',
        pagination: undefined,
        empty: 'No rows to show.',
        noResults: 'No rows match.',
      });
      expect(result.current.selectionMode).toBe('multiple');
      expect(result.current.manual).toBe(false);
    });

    it('with manual, shows the data as given and only reports', () => {
      const onSortChange = jest.fn();
      const result = model({
        manual: true,
        rowCount: 42.7,
        pageSize: 10,
        sort: [{ id: 'name', direction: 'descending' }],
        search: 'zzz',
        filters: { role: 'nobody' },
        onSortChange,
      });
      expect(result.current.getRows().map(row => row.id)).toEqual(
        people.map(person => person.id)
      );
      expect(result.current.getRows('page')).toHaveLength(people.length);
      expect(result.current.rowCount).toBe(42);
      expect(result.current.pageCount).toBe(5);
      act(() => result.current.toggleSort('name'));
      expect(onSortChange).toHaveBeenCalledWith([]);
      const counted = model({ manual: true, rowCount: NaN });
      expect(counted.current.rowCount).toBe(people.length);
      const none = model({ manual: true, rowCount: -3 });
      expect(none.current.rowCount).toBe(0);
    });
  });

  describe('server rendering', () => {
    it('hydrates without a mismatch', () => {
      const ui = (
        <DataTable
          caption="People"
          columns={columns}
          data={people}
          selectionMode="multiple"
          defaultSelected={['p1']}
          defaultSort={[{ id: 'name', direction: 'ascending' }]}
          pageSize={2}
          hasSearch
          isResponsive
        />
      );
      const html = renderToString(ui);
      expect(html).toContain('aria-sort="ascending"');
      const host = document.createElement('div');
      host.innerHTML = html;
      document.body.appendChild(host);
      const error = jest.spyOn(console, 'error').mockImplementation(() => {});
      act(() => {
        hydrateRoot(host, ui);
      });
      expect(error).not.toHaveBeenCalled();
      error.mockRestore();
      host.remove();
    });
  });
});
