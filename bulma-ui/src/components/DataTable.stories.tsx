import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import {
  DataTable,
  useDataTable,
  type DataTableColumn,
  type DataTableSort,
} from './DataTable';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';
import { Button } from '../elements/Button';
import { Buttons } from '../elements/Buttons';
import { Paragraph } from '../elements/Paragraph';
import { Table } from '../elements/Table';
import { Tag } from '../elements/Tag';
import { Title } from '../elements/Title';
import { Checkbox } from '../form/Checkbox';
import { Column } from '../columns/Column';
import { Columns } from '../columns/Columns';
import { Select } from '../form/Select';
import { LocaleProvider } from '../helpers/LocaleProvider';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  score: number;
  joined: string;
}

const NAMES = [
  'Ada Lovelace',
  'Alan Turing',
  'Grace Hopper',
  'Katherine Johnson',
  'Edsger Dijkstra',
  'Barbara Liskov',
  'Donald Knuth',
  'Margaret Hamilton',
  'Tim Berners-Lee',
  'Radia Perlman',
  'Ken Thompson',
  'Frances Allen',
  'John McCarthy',
  'Shafi Goldwasser',
  'Leslie Lamport',
  'Hedy Lamarr',
  'Claude Shannon',
  'Mary Jackson',
  'Niklaus Wirth',
  'Sophie Wilson',
  'Dennis Ritchie',
  'Annie Easley',
];
const ROLES = ['Admin', 'Editor', 'Viewer'] as const;

const users: User[] = NAMES.map((name, i) => ({
  id: `u${i + 1}`,
  name,
  email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
  role: ROLES[i % 3],
  score: ((i * 37) % 60) + 40 + (i % 2) / 2,
  joined: `20${20 + (i % 6)}-${String(((i * 5) % 12) + 1).padStart(2, '0')}-01`,
}));

const columns: DataTableColumn<User>[] = [
  { id: 'name', header: 'Name', sortable: true, isRowHeader: true },
  { id: 'email', header: 'Email' },
  {
    id: 'role',
    header: 'Role',
    sortable: true,
    cell: row => (
      <Tag color={row.role === 'Admin' ? 'primary' : undefined}>{row.role}</Tag>
    ),
  },
  {
    id: 'score',
    header: 'Score',
    sortable: true,
    sortDescFirst: true,
    align: 'right',
    format: value => (value as number).toFixed(1),
  },
  { id: 'joined', header: 'Joined', sortable: true },
];

const meta: Meta<typeof DataTable> = {
  title: 'Components/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A table of records that people can sort, search, page through and select rows from, rendered with bestax’s own Table parts, Checkbox and Pagination. It’s a native sortable table: the sorted header carries aria-sort, a sortable header holds a button, and each row’s checkbox is named for the row. useDataTable runs it, and custom markup can use its props too.',
      },
    },
  },
  args: {
    caption: 'Users',
    columns: columns as DataTableColumn<unknown>[],
    data: users,
    isFullwidth: true,
    isHoverable: true,
  },
  argTypes: {
    columns: {
      control: false,
      description:
        'The columns, in order: an id, a header, and how to read, write and render the value',
    },
    data: {
      control: false,
      description: 'The rows, as records of your own',
    },
    caption: {
      control: 'text',
      description: 'Names the table as a visible caption',
    },
    selectionMode: {
      control: 'inline-radio',
      options: ['none', 'multiple'],
      description:
        'multiple adds a checkbox named for each row and a select-all checkbox for the page',
    },
    pageSize: {
      control: 'number',
      description: 'Rows per page; set, the table pages through Pagination',
    },
    hasSearch: {
      control: 'boolean',
      description: 'Shows a search field over every filterable column',
    },
    loading: {
      control: 'boolean',
      description: 'Shows skeleton rows and marks the table busy',
    },
    manual: {
      control: 'boolean',
      description:
        'Shows the data as given and only reports the state, for a server that sorts, filters and pages',
    },
    isBordered: {
      control: 'boolean',
      description: 'Adds borders to all cells',
    },
    isStriped: {
      control: 'boolean',
      description: 'Adds zebra-striping to rows',
    },
    isNarrow: {
      control: 'boolean',
      description: 'Cuts cell padding in half',
    },
    isHoverable: {
      control: 'boolean',
      description: 'Adds a hover effect on rows',
    },
    isFullwidth: {
      control: 'boolean',
      description: 'Makes the table span its wrapper',
    },
    isResponsive: {
      control: 'boolean',
      description:
        'Scrolls a wide table sideways in a ScrollArea you can scroll from the keyboard',
    },
    onSortChange: {
      action: 'sort changed',
      description: 'Called with the new sort when a header is pressed',
    },
    onSelectedChange: {
      action: 'selection changed',
      description: 'Called with every selected id after a checkbox changes',
    },
    onPageChange: {
      action: 'page changed',
      description: 'Called with the page chosen in the pager',
    },
    onSearchChange: {
      action: 'search changed',
      description: 'Called with the search as it changes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DataTable>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const name = canvas.getByRole('button', { name: 'Name' });
    await userEvent.click(name);
    await expect(name.closest('th')).toHaveAttribute('aria-sort', 'ascending');
  },
};

export const Selection: Story = {
  args: { selectionMode: 'multiple', pageSize: 5, isStriped: true },
  render: function SelectionExample(args) {
    return (
      <DataTable
        {...args}
        toolbar={table => (
          <Buttons>
            <Paragraph mb="0" mr="3">
              {table.state.selected.length} selected
            </Paragraph>
            <Button
              size="small"
              disabled={table.state.selected.length === 0}
              onClick={() => table.setSelected([])}
            >
              Clear selection
            </Button>
          </Buttons>
        )}
      />
    );
  },
};

export const Paging: Story = {
  args: { pageSize: 5 },
};

export const SearchAndFilters: Story = {
  args: { hasSearch: true, pageSize: 5 },
  render: function SearchAndFiltersExample(args) {
    return (
      <DataTable
        {...args}
        toolbar={table => (
          <Select
            aria-label="Role"
            value={String(table.state.filters.role ?? '')}
            onChange={event => table.setFilter('role', event.target.value)}
          >
            <option value="">Any role</option>
            {ROLES.map(role => (
              <option key={role}>{role}</option>
            ))}
          </Select>
        )}
      />
    );
  },
};

export const EmptyAndNoResults: Story = {
  render: function EmptyAndNoResultsExample(args) {
    return (
      <>
        <DataTable
          {...args}
          caption="Invites"
          data={[]}
          empty={
            <EmptyState
              size="small"
              title="No invites yet"
              titleAs="h3"
              description="People you invite show up here."
            >
              <Button size="small" color="primary">
                Invite someone
              </Button>
            </EmptyState>
          }
        />
        <DataTable {...args} hasSearch defaultSearch="kraken" />
      </>
    );
  },
};

export const Loading: Story = {
  args: { loading: true, pageSize: 4 },
};

/** Sorting, searching and paging done by a pretend server, with `manual`. */
export const Server: Story = {
  render: function ServerExample(args) {
    const pageSize = 5;
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<DataTableSort[]>([]);
    const [search, setSearch] = useState('');
    const [result, setResult] = useState({ rows: [] as User[], total: 0 });
    const [loading, setLoading] = useState(true);
    useEffect(() => {
      // What a server would do with the query, a little later.
      const timer = setTimeout(() => {
        const term = search.trim().toLowerCase();
        const matched = users.filter(user =>
          user.name.toLowerCase().includes(term)
        );
        const [by] = sort;
        if (by) {
          const key = by.id as keyof User;
          matched.sort(
            (a, b) =>
              String(a[key]).localeCompare(String(b[key]), 'en', {
                numeric: true,
              }) * (by.direction === 'ascending' ? 1 : -1)
          );
        }
        setResult({
          rows: matched.slice((page - 1) * pageSize, page * pageSize),
          total: matched.length,
        });
        setLoading(false);
      }, 400);
      return () => clearTimeout(timer);
    }, [page, sort, search]);
    const changed =
      <T,>(set: (value: T) => void) =>
      (value: T) => {
        setLoading(true);
        set(value);
      };
    return (
      <DataTable
        {...args}
        data={result.rows}
        manual
        rowCount={result.total}
        loading={loading}
        pageSize={pageSize}
        page={page}
        onPageChange={changed(setPage)}
        sort={sort}
        onSortChange={changed(setSort)}
        hasSearch
        search={search}
        onSearchChange={changed(setSearch)}
      />
    );
  },
};

/** A table from useDataTable, so the count and the button sit above it. */
export const WithTheHook: Story = {
  render: function WithTheHookExample() {
    const table = useDataTable({
      columns,
      data: users,
      selectionMode: 'multiple',
      pageSize: 5,
    });
    return (
      <>
        <Title as="h2" size="5">
          Team ({table.rowCount})
        </Title>
        <Paragraph>
          {table.state.selected.length} of {users.length} selected
        </Paragraph>
        <DataTable table={table} caption="Team" isFullwidth hasSearch />
      </>
    );
  },
};

/** The hook's props on bestax's own Table parts, for markup of your own. */
export const CustomMarkup: Story = {
  render: function CustomMarkupExample() {
    const table = useDataTable({
      columns: columns.slice(0, 3),
      data: users,
      selectionMode: 'multiple',
      pageSize: 4,
    });
    return (
      <>
        <Table isFullwidth aria-label="Team">
          <Table.Thead>
            <Table.Tr>
              <Table.Th scope="col" isNarrow>
                <Checkbox {...table.getSelectAllProps()} />
              </Table.Th>
              {table.columns.map(column => (
                <Table.Th key={column.id} {...table.getHeaderCellProps(column)}>
                  {column.sortable ? (
                    <button {...table.getSortButtonProps(column)}>
                      {column.header}
                    </button>
                  ) : (
                    column.header
                  )}
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
                  <Table.Td
                    key={column.id}
                    {...table.getCellProps(row, column)}
                  >
                    {table.getText(row, column.id)}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        <Pagination {...table.getPaginationProps()} aria-label="Team pages" />
      </>
    );
  },
};

/** A table wider than its space scrolls sideways, from the keyboard too. */
export const Responsive: Story = {
  args: { isResponsive: true, isFullwidth: false },
  render: function ResponsiveExample(args) {
    return (
      <Columns>
        <Column size="half">
          <DataTable {...args} />
        </Column>
      </Columns>
    );
  },
};

export const RightToLeft: Story = {
  args: { selectionMode: 'multiple', pageSize: 5, hasSearch: true },
  render: function RightToLeftExample(args) {
    return (
      <LocaleProvider locale="ar">
        <DataTable {...args} />
      </LocaleProvider>
    );
  },
};
