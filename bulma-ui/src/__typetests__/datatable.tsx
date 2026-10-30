import { DataTable, useDataTable, type DataTableColumn } from '../index';

/**
 * An add-on gives every column options of its own by merging into
 * `DataTableColumnMeta` through the package's entry point, which only
 * re-exports it. This is that merge, as an add-on would write it against the
 * published package.
 */
declare module '../index' {
  interface DataTableColumnMeta<TRow> {
    exportWidth?: number;
    exportValue?: (row: TRow) => string | number;
  }
}

interface User {
  id: string;
  name: string;
  score: number;
}

const users: User[] = [{ id: 'u1', name: 'Ada', score: 98 }];

/**
 * The row type comes from the columns and the data, so a key `accessor` and
 * the callbacks are checked against it, and so are the add-on's fields.
 */
const columns: DataTableColumn<User>[] = [
  {
    id: 'name',
    header: 'Name',
    accessor: 'name',
    meta: { exportWidth: 30, exportValue: row => row.name },
  },
  {
    id: 'score',
    header: 'Score',
    format: (_value, row) => row.score.toFixed(1),
    cell: (row, { text }) => <strong title={row.name}>{text}</strong>,
    sortFn: (a, b) => a.score - b.score,
    filterFn: (row, value) => row.score >= Number(value),
  },
];

export const typed = (
  <DataTable caption="Users" columns={columns} data={users} />
);

export const badAccessor: DataTableColumn<User> = {
  id: 'x',
  header: 'X',
  // @ts-expect-error not a key of User
  accessor: 'nope',
};

export const badMeta: DataTableColumn<User> = {
  id: 'x',
  header: 'X',
  // @ts-expect-error the add-on typed its width as a number
  meta: { exportWidth: 'wide' },
};

export const mismatched = (
  // @ts-expect-error data of another row type than the columns
  <DataTable caption="Users" columns={columns} data={[1, 2, 3]} />
);

/** A hook's table goes back into the component with the same row type. */
export function FromHook() {
  const table = useDataTable({ columns, data: users, pageSize: 10 });
  const first: User | undefined = table.getRows('page')[0];
  return (
    <DataTable table={table} caption={first ? first.name : 'Users'} hasSearch />
  );
}
