import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import { libs, parseCell } from '@site/src/data/componentComparison';
import { diffSnapshots } from './snapshots.mjs';
import { fixedInLine, legendNote } from './changesText.mjs';
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

const pullRequest = pr => `https://github.com/allxsmith/bestax/pull/${pr}`;

function ChangedCell({ lib, before, after, corrected }) {
  const was = parseCell(before);
  const now = parseCell(after);
  const label =
    `${lib.title} ${now.status === 'none' ? was.name : now.name}: ` +
    `was ${STATUS_LABEL[was.status]}, now ${STATUS_LABEL[now.status]}` +
    (corrected ? ' (a correction: the last edition had it wrong)' : '');
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
    <td
      className={clsx(
        styles.cell,
        corrected ? styles.correctedCell : styles.changedCell
      )}
    >
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
 * previous edition, with the changed cells marked and the rest of each row
 * shown for context. A cell the previous edition had wrong is marked as a
 * correction instead, and a row a correction renamed is compared with the row
 * under its old name, from the corrections `to` records (see diffSnapshots).
 * `from` and `to` are edition snapshots from src/data/state-of-react/*.json.
 */
export default function ComparisonChanges({ from, to }) {
  const { columns, fromIdx, groups, removed, fixes } = diffSnapshots(
    from,
    to,
    libs
  );

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

      <Legend note={legendNote(fixes.length > 0)} />

      <div className={styles.tableWrap}>
        <table
          className={styles.table}
          style={{ '--sor-cols': columns.length }}
        >
          <thead>
            <HeadRow columns={columns} />
          </thead>
          <tbody>
            {groups.map(group => (
              <React.Fragment key={group.heading}>
                <CategoryRow
                  heading={group.heading}
                  span={columns.length + 1}
                />
                {group.rows.map(({ row, prev, changed, corrected }) => (
                  <tr key={row[0]} className={styles.dataRow}>
                    <th scope="row" className={styles.capCell}>
                      {row[0]}
                      {!prev && <span className={styles.newBadge}>new</span>}
                    </th>
                    {columns.map(lib =>
                      changed.has(lib.id) ? (
                        <ChangedCell
                          key={lib.id}
                          lib={lib}
                          before={prev[fromIdx.get(lib.id)]}
                          after={row[lib.idx]}
                          corrected={corrected.has(lib.id)}
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

      {fixes.length > 0 && (
        <p className={styles.fixedIn}>
          {fixedInLine(fixes, pr => (
            <a
              key={pr}
              href={pullRequest(pr)}
              target="_blank"
              rel="noopener noreferrer"
            >
              #{pr}
            </a>
          ))}
        </p>
      )}
    </div>
  );
}
