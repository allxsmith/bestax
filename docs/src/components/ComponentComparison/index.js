import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {
  libs,
  categories,
  lastReviewed,
  parseCell,
} from '@site/src/data/componentComparison';
import styles from './styles.module.css';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatReviewed(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

const GLYPH = { full: '✓', partial: '◐', none: '–' };
const STATUS_LABEL = {
  full: 'dedicated component',
  partial: 'via prop or composition',
  none: 'no equivalent',
};

function Cell({ lib, value }) {
  const { status, name } = parseCell(value);

  if (status === 'none') {
    return (
      <td className={clsx(styles.cell, styles.noneCell)}>
        <span className={clsx(styles.glyph, styles.none)} aria-hidden="true">
          {GLYPH.none}
        </span>
        <span className={styles.srOnly}>none</span>
      </td>
    );
  }

  const href = lib.resolve(name);
  const internal = href.startsWith('/');
  const label = `${lib.title || lib.label} ${name} — ${STATUS_LABEL[status]}`;
  const inner = (
    <>
      <span className={clsx(styles.glyph, styles[status])} aria-hidden="true">
        {GLYPH[status]}
      </span>
      {!lib.iconOnly && <span className={styles.name}>{name}</span>}
    </>
  );

  return (
    <td className={styles.cell}>
      {internal ? (
        <Link
          to={href}
          className={styles.cellLink}
          title={label}
          aria-label={label}
        >
          {inner}
        </Link>
      ) : (
        <a
          href={href}
          className={styles.cellLink}
          title={label}
          aria-label={label}
          target="_blank"
          rel="noopener noreferrer"
        >
          {inner}
        </a>
      )}
    </td>
  );
}

export default function ComponentComparison() {
  return (
    <div className={clsx(styles.root, 'sorl-comparison')}>
      <div className={styles.meta}>
        <span className={styles.asOf}>
          Data as of <strong>{formatReviewed(lastReviewed)}</strong>
        </span>
        <span className={styles.latest}>
          A newer edition may exist —{' '}
          <Link to="/blog/tags/state-of-react-libs">
            see the latest “A State of React Libs”
          </Link>
          .
        </span>
      </div>

      <div className={styles.legend}>
        <span>
          <span className={clsx(styles.glyph, styles.full)}>{GLYPH.full}</span>{' '}
          Dedicated component
        </span>
        <span>
          <span className={clsx(styles.glyph, styles.partial)}>
            {GLYPH.partial}
          </span>{' '}
          Via prop / composition
        </span>
        <span>
          <span className={clsx(styles.glyph, styles.none)}>{GLYPH.none}</span>{' '}
          None
        </span>
        <span className={styles.legendNote}>
          Every ✓/◐ links to that library’s own docs.
        </span>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={clsx(styles.headCell, styles.capCol)}>
                Capability
              </th>
              {libs.map(lib => (
                <th
                  key={lib.id}
                  className={clsx(styles.headCell, styles.libCol)}
                  style={{ '--lib-color': lib.color }}
                  title={lib.title}
                >
                  <span className={styles.libLabel}>{lib.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <React.Fragment key={cat.heading}>
                <tr className={styles.catRow}>
                  <th
                    scope="colgroup"
                    colSpan={libs.length + 1}
                    className={styles.catCell}
                  >
                    {cat.heading}
                  </th>
                </tr>
                {cat.rows.map(row => (
                  <tr key={row[0]} className={styles.dataRow}>
                    <th scope="row" className={styles.capCell}>
                      {row[0]}
                    </th>
                    {libs.map(lib => (
                      <Cell key={lib.id} lib={lib} value={row[lib.idx]} />
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <details className={styles.method}>
        <summary>How this was compiled — method &amp; caveats</summary>
        <ul>
          <li>
            Rows are <strong>capabilities</strong>, not raw exports — sub-parts
            are folded into their parent and internal utilities dropped, so a
            column approximates each library’s user-facing catalog.
          </li>
          <li>
            <strong>◐</strong> means the capability exists via a prop or by
            composing primitives, not as a dedicated named component; it is
            treated as “absent” when judging what a library uniquely ships.
          </li>
          <li>
            Official companion packages count as first-party (Mantine{' '}
            <code>@mantine/*</code>, MUI <code>@mui/lab</code> &amp;{' '}
            <code>@mui/x-*</code>). shadcn/ui is a copy-paste registry powered
            by Radix, cmdk, TanStack Table, and react-day-picker — not an npm
            dependency.
          </li>
          <li>
            Matched by purpose, not name (e.g. bestax <code>Badge</code> →
            Mantine <code>Indicator</code> / MUI <code>Badge</code>). Competitor
            links are best-effort; a few resolve to a library’s component index
            rather than an exact page.
          </li>
        </ul>
      </details>
    </div>
  );
}
