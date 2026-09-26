import React, { useMemo, useSyncExternalStore } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {
  libs,
  categories,
  lastReviewed,
  parseCell,
} from '@site/src/data/componentComparison';
import {
  COMPARE_PAGE,
  formatReviewed,
  Glyph,
  Cell,
  Legend,
  HeadRow,
  CategoryRow,
} from './shared';
import { snapshotColumns } from './snapshots.mjs';
import styles from './styles.module.css';

const groupId = heading =>
  heading
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const LIB_IDS = libs.map(lib => lib.id);

/** Does a capability or any shown library's component name match the query? */
function matchesQuery(row, columns, query) {
  if (!query) return true;
  if (row[0].toLowerCase().includes(query)) return true;
  return columns.some(lib => {
    const { status, name } = parseCell(row[lib.idx]);
    return status !== 'none' && name.toLowerCase().includes(query);
  });
}

/** True when the shown libraries don't all land on the same status. */
function differs(row, columns) {
  return new Set(columns.map(lib => parseCell(row[lib.idx]).status)).size > 1;
}

function Tally({ columns, groups }) {
  const rows = groups.flatMap(group => group.rows);
  return (
    <tfoot>
      <tr className={styles.tallyRow}>
        <th scope="row" className={clsx(styles.capCell, styles.tallyHead)}>
          Covered in these rows
        </th>
        {columns.map(lib => {
          let full = 0;
          let partial = 0;
          for (const row of rows) {
            const { status } = parseCell(row[lib.idx]);
            if (status === 'full') full += 1;
            if (status === 'partial') partial += 1;
          }
          return (
            <td
              key={lib.id}
              className={clsx(styles.cell, styles.tallyCell)}
              aria-label={`${lib.title}: ${full} dedicated, ${partial} via prop or composition`}
            >
              <span className={styles.tallyPair}>
                <Glyph status="full" /> {full}
              </span>
              <span className={styles.tallyPair}>
                <Glyph status="partial" /> {partial}
              </span>
            </td>
          );
        })}
      </tr>
    </tfoot>
  );
}

function MatrixTable({ columns, groups, tally = false }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table} style={{ '--sor-cols': columns.length }}>
        <thead>
          <HeadRow columns={columns} />
        </thead>
        <tbody>
          {groups.map(group => (
            <React.Fragment key={group.heading}>
              <CategoryRow heading={group.heading} span={columns.length + 1} />
              {group.rows.map(row => (
                <tr key={row[0]} className={styles.dataRow}>
                  <th scope="row" className={styles.capCell}>
                    {row[0]}
                  </th>
                  {columns.map(lib => (
                    <Cell key={lib.id} lib={lib} value={row[lib.idx]} />
                  ))}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
        {tally && <Tally columns={columns} groups={groups} />}
      </table>
    </div>
  );
}

function Chip({ pressed, onClick, color, children }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={clsx(styles.chip, pressed && styles.chipOn)}
      style={color ? { '--lib-color': color } : undefined}
    >
      {color && <span className={styles.chipSwatch} aria-hidden="true" />}
      {children}
    </button>
  );
}

// The explorer's filters live in the URL query, so a comparison can be shared
// as a link. The query is the only copy of that state: components read it
// through useSyncExternalStore and write it with history.replaceState, then
// tell subscribers it moved (replaceState fires no event of its own).
const searchListeners = new Set();
function subscribeToSearch(callback) {
  searchListeners.add(callback);
  window.addEventListener('popstate', callback);
  return () => {
    searchListeners.delete(callback);
    window.removeEventListener('popstate', callback);
  };
}
const readSearch = () => window.location.search;
// The server render (and hydration) shows the unfiltered matrix.
const readServerSearch = () => '';
function writeSearch(params) {
  // Commas are legal in a query; keep them readable in a shared link.
  const qs = params.toString().replace(/%2C/gi, ',');
  const { pathname, hash } = window.location;
  window.history.replaceState(
    window.history.state,
    '',
    `${pathname}${qs ? `?${qs}` : ''}${hash}`
  );
  searchListeners.forEach(callback => callback());
}

/**
 * Parse the filters out of a query string; an absent key means "all". Picks
 * come back in canonical order with unknown and repeated ids dropped, so a
 * hand-edited link can't make a partial pick look like "all".
 */
function readFilters(search, groupIds) {
  const params = new URLSearchParams(search);
  const pick = (key, known) => {
    if (!params.has(key)) return known;
    const wanted = new Set(params.get(key).split(','));
    return known.filter(id => wanted.has(id));
  };
  return {
    pickedLibs: pick('libs', LIB_IDS),
    pickedGroups: pick('groups', groupIds),
    query: params.get('q') ?? '',
    diffOnly: params.get('diff') === '1',
  };
}

/** Write filters back to the query, leaving out anything at its default. */
function writeFilters(filters, groupIds) {
  const params = new URLSearchParams(window.location.search);
  const set = (key, value, isDefault) =>
    isDefault ? params.delete(key) : params.set(key, value);
  set(
    'libs',
    filters.pickedLibs.join(','),
    filters.pickedLibs.length === LIB_IDS.length
  );
  set(
    'groups',
    filters.pickedGroups.join(','),
    filters.pickedGroups.length === groupIds.length
  );
  set('q', filters.query, filters.query === '');
  set('diff', '1', !filters.diffOnly);
  writeSearch(params);
}

/**
 * The filterable matrix: pick libraries and feature groups, search, and
 * narrow to the rows where the picked libraries differ.
 */
function Explorer({ data }) {
  const groupIds = useMemo(
    () => data.map(group => groupId(group.heading)),
    [data]
  );
  const search = useSyncExternalStore(
    subscribeToSearch,
    readSearch,
    readServerSearch
  );
  const filters = readFilters(search, groupIds);
  const { pickedLibs, pickedGroups, query, diffOnly } = filters;
  const update = changes => writeFilters({ ...filters, ...changes }, groupIds);
  const setPickedLibs = next => update({ pickedLibs: next });
  const setPickedGroups = next => update({ pickedGroups: next });
  const setQuery = next => update({ query: next });
  const setDiffOnly = next => update({ diffOnly: next });

  const toggle = (list, setList, order) => id =>
    setList(
      list.includes(id)
        ? list.filter(v => v !== id)
        : order.filter(v => v === id || list.includes(v))
    );
  const toggleLib = toggle(pickedLibs, setPickedLibs, LIB_IDS);
  const toggleGroup = toggle(pickedGroups, setPickedGroups, groupIds);
  const reset = () =>
    update({
      pickedLibs: LIB_IDS,
      pickedGroups: groupIds,
      query: '',
      diffOnly: false,
    });

  const columns = libs.filter(lib => pickedLibs.includes(lib.id));
  const q = query.trim().toLowerCase();
  const canDiff = columns.length > 1;
  const groups = data
    .filter(group => pickedGroups.includes(groupId(group.heading)))
    .map(group => ({
      heading: group.heading,
      rows: group.rows.filter(
        row =>
          matchesQuery(row, columns, q) &&
          (!diffOnly || !canDiff || differs(row, columns))
      ),
    }))
    .filter(group => group.rows.length > 0);
  const total = data.reduce((n, group) => n + group.rows.length, 0);
  const shown = groups.reduce((n, group) => n + group.rows.length, 0);

  return (
    <>
      <div className={styles.filters}>
        <div
          className={styles.filterGroup}
          role="group"
          aria-labelledby="sor-libs"
        >
          <span id="sor-libs" className={styles.filterLabel}>
            Libraries
          </span>
          <div className={styles.chips}>
            {libs.map(lib => (
              <Chip
                key={lib.id}
                color={lib.color}
                pressed={pickedLibs.includes(lib.id)}
                onClick={() => toggleLib(lib.id)}
              >
                {lib.title}
              </Chip>
            ))}
            <button
              type="button"
              className={styles.chipAction}
              onClick={() =>
                setPickedLibs(
                  pickedLibs.length === LIB_IDS.length ? [] : LIB_IDS
                )
              }
            >
              {pickedLibs.length === LIB_IDS.length ? 'Clear' : 'All'}
            </button>
          </div>
        </div>

        <div
          className={styles.filterGroup}
          role="group"
          aria-labelledby="sor-groups"
        >
          <span id="sor-groups" className={styles.filterLabel}>
            Feature groups
          </span>
          <div className={styles.chips}>
            {data.map(group => (
              <Chip
                key={group.heading}
                pressed={pickedGroups.includes(groupId(group.heading))}
                onClick={() => toggleGroup(groupId(group.heading))}
              >
                {group.heading}
              </Chip>
            ))}
            <button
              type="button"
              className={styles.chipAction}
              onClick={() =>
                setPickedGroups(
                  pickedGroups.length === groupIds.length ? [] : groupIds
                )
              }
            >
              {pickedGroups.length === groupIds.length ? 'Clear' : 'All'}
            </button>
          </div>
        </div>

        <div className={styles.filterRow}>
          <label className={styles.search}>
            <span className={styles.srOnly}>
              Search capabilities and component names
            </span>
            <input
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search, e.g. date, tooltip, Combobox"
            />
          </label>
          <label
            className={clsx(styles.toggle, !canDiff && styles.toggleOff)}
            title={canDiff ? undefined : 'Pick two or more libraries'}
          >
            <input
              type="checkbox"
              checked={diffOnly && canDiff}
              disabled={!canDiff}
              onChange={event => setDiffOnly(event.target.checked)}
            />
            Only rows where they differ
          </label>
          <button type="button" className={styles.reset} onClick={reset}>
            Reset
          </button>
        </div>

        <p className={styles.resultCount} aria-live="polite">
          Showing {shown} of {total} capabilities across {columns.length} of{' '}
          {libs.length} libraries.
        </p>
      </div>

      {columns.length === 0 || shown === 0 ? (
        <p className={styles.empty}>
          {columns.length === 0
            ? 'Pick at least one library to compare.'
            : 'No capabilities match these filters.'}{' '}
          <button type="button" className={styles.reset} onClick={reset}>
            Reset filters
          </button>
        </p>
      ) : (
        <MatrixTable columns={columns} groups={groups} tally />
      )}
    </>
  );
}

function Method() {
  return (
    <details className={styles.method}>
      <summary>How this was compiled: method and caveats</summary>
      <ul>
        <li>
          Rows are <strong>capabilities</strong>, not raw exports. Sub-parts are
          folded into their parent and internal utilities dropped, so a column
          approximates each library’s user-facing catalog.
        </li>
        <li>
          <strong>◐</strong> means the capability exists via a prop or by
          composing primitives, not as a dedicated named component; it is
          treated as “absent” when judging what a library uniquely ships.
        </li>
        <li>
          Official companion packages count as first-party (Mantine{' '}
          <code>@mantine/*</code>, MUI <code>@mui/lab</code> &amp;{' '}
          <code>@mui/x-*</code>, Chakra <code>@chakra-ui/charts</code>).
          shadcn/ui is a copy-paste registry built on Base UI, Radix, or React
          Aria, plus cmdk, TanStack Table, and react-day-picker, not an npm
          dependency.
        </li>
        <li>
          Matched by purpose, not name (e.g. bestax <code>Badge</code> → Mantine{' '}
          <code>Indicator</code> / MUI <code>Badge</code>). Competitor links are
          best-effort; a few resolve to a library’s component index rather than
          an exact page.
        </li>
      </ul>
    </details>
  );
}

/**
 * The component-comparison matrix behind "The State of React".
 *
 * - `interactive`: the filterable explorer the compare docs page renders,
 *   always on the live data.
 * - `snapshot`: a frozen edition's data (src/data/state-of-react/*.json), so a
 *   published post keeps showing the table it was written against.
 */
export default function ComponentComparison({ snapshot, interactive = false }) {
  const reviewed = snapshot?.reviewed ?? lastReviewed;
  const data = snapshot?.categories ?? categories;
  // A snapshot's rows are positional in its own recorded column order, not
  // the live one.
  const columns = snapshot ? snapshotColumns(snapshot, libs) : libs;

  return (
    <div className={clsx(styles.root, 'sor-comparison')}>
      <div className={styles.meta}>
        <span className={styles.asOf}>
          {snapshot ? 'Snapshot from ' : 'Data as of '}
          <strong>{formatReviewed(reviewed)}</strong>
        </span>
        <span className={styles.latest}>
          {snapshot ? (
            <>
              Frozen with this edition.{' '}
              <Link to={COMPARE_PAGE}>See the current matrix</Link>.
            </>
          ) : (
            <>
              Updated with each edition of{' '}
              <Link to="/blog/tags/state-of-react">
                <em>The State of React</em>
              </Link>
              .
            </>
          )}
        </span>
      </div>

      <Legend note="Hover a cell for the component name; click it to open the docs." />

      {interactive && !snapshot ? (
        <Explorer data={data} />
      ) : (
        <MatrixTable columns={columns} groups={data} />
      )}

      <Method />
    </div>
  );
}
