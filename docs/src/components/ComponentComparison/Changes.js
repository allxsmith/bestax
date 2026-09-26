import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import { libs, parseCell } from '@site/src/data/componentComparison';
import {
  COMPARE_PAGE,
  formatReviewed,
  STATUS_LABEL,
  Glyph,
  DocLink,
  Cell,
  Legend,
  HeadRow,
  CategoryRow,
} from './shared';
import styles from './styles.module.css';

/**
 * Work out what moved between two edition snapshots: rows whose status
 * changed for any library, rows that are new, and rows that were dropped. A
 * renamed component with the same status is not a change a reader can see in
 * the glyphs, so it is left out.
 */
export function diffSnapshots(from, to) {
  const before = new Map();
  for (const group of from.categories) {
    for (const row of group.rows) before.set(row[0], row);
  }
  const seen = new Set();
  const groups = to.categories
    .map(group => ({
      heading: group.heading,
      rows: group.rows.flatMap(row => {
        seen.add(row[0]);
        const prev = before.get(row[0]);
        if (!prev) return [{ row, prev: null, changed: new Set() }];
        const changed = new Set(
          libs
            .filter(
              lib =>
                parseCell(prev[lib.idx]).status !==
                parseCell(row[lib.idx]).status
            )
            .map(lib => lib.id)
        );
        return changed.size > 0 ? [{ row, prev, changed }] : [];
      }),
    }))
    .filter(group => group.rows.length > 0);
  const removed = [...before.keys()].filter(cap => !seen.has(cap));
  return { groups, removed };
}

function ChangedCell({ lib, before, after }) {
  const was = parseCell(before);
  const now = parseCell(after);
  const label =
    `${lib.title} ${now.status === 'none' ? was.name : now.name}: ` +
    `was ${STATUS_LABEL[was.status]}, now ${STATUS_LABEL[now.status]}`;
  const pair = (
    <span className={styles.changePair}>
      <Glyph status={was.status} />
      <span className={styles.changeArrow} aria-hidden="true">
        →
      </span>
      <Glyph status={now.status} />
    </span>
  );
  return (
    <td className={clsx(styles.cell, styles.changedCell)}>
      {now.status === 'none' ? (
        <span title={label}>
          {pair}
          <span className={styles.srOnly}>{label}</span>
        </span>
      ) : (
        <DocLink
          href={lib.resolve(now.name)}
          label={label}
          className={styles.cellLink}
        >
          {pair}
        </DocLink>
      )}
    </td>
  );
}

/**
 * The State of React edition table: only the rows that changed since the
 * previous edition, with the changed cells marked and the rest shown dimmed
 * for context. `from` and `to` are edition snapshots from
 * src/data/state-of-react/*.json.
 */
export default function ComparisonChanges({ from, to }) {
  const { groups, removed } = diffSnapshots(from, to);

  return (
    <div className={clsx(styles.root, 'sor-comparison')}>
      <div className={styles.meta}>
        <span className={styles.asOf}>
          What changed from <strong>{formatReviewed(from.reviewed)}</strong> to{' '}
          <strong>{formatReviewed(to.reviewed)}</strong>
        </span>
        <span className={styles.latest}>
          Every other row held steady.{' '}
          <Link to={COMPARE_PAGE}>Compare the full matrix</Link>.
        </span>
      </div>

      <Legend note="Highlighted cells changed (before → after); the rest are shown for context." />

      <div className={styles.tableWrap}>
        <table className={styles.table} style={{ '--sor-cols': libs.length }}>
          <thead>
            <HeadRow columns={libs} />
          </thead>
          <tbody>
            {groups.map(group => (
              <React.Fragment key={group.heading}>
                <CategoryRow heading={group.heading} span={libs.length + 1} />
                {group.rows.map(({ row, prev, changed }) => (
                  <tr key={row[0]} className={styles.dataRow}>
                    <th scope="row" className={styles.capCell}>
                      {row[0]}
                      {!prev && <span className={styles.newBadge}>new</span>}
                    </th>
                    {libs.map(lib =>
                      changed.has(lib.id) ? (
                        <ChangedCell
                          key={lib.id}
                          lib={lib}
                          before={prev[lib.idx]}
                          after={row[lib.idx]}
                        />
                      ) : (
                        <Cell
                          key={lib.id}
                          lib={lib}
                          value={row[lib.idx]}
                          className={prev ? styles.contextCell : undefined}
                        />
                      )
                    )}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {removed.length > 0 && (
        <p className={styles.removed}>
          Dropped since the last edition: {removed.join(', ')}.
        </p>
      )}
    </div>
  );
}
