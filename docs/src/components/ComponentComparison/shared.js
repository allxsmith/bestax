import clsx from 'clsx';
import Link from '@docusaurus/Link';
import { parseCell } from '@site/src/data/componentComparison';
import styles from './styles.module.css';

// The docs page that hosts the full, filterable matrix. Every edition's table
// links here for the current data.
export const COMPARE_PAGE = '/docs/guides/getting-started/compare';

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

export function formatReviewed(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export const GLYPH = { full: '✓', partial: '◐', none: '–' };
export const STATUS_LABEL = {
  full: 'dedicated component',
  partial: 'via prop or composition',
  none: 'no equivalent',
};

/** The glyph for one status, as the legend and the tally row draw it. */
export function Glyph({ status, hidden = true }) {
  return (
    <span
      className={clsx(styles.glyph, styles[status])}
      aria-hidden={hidden ? 'true' : undefined}
    >
      {GLYPH[status]}
    </span>
  );
}

/** A link to a library's docs for one component, internal or external. */
export function DocLink({ href, label, className, children }) {
  if (href.startsWith('/')) {
    return (
      <Link to={href} className={className} title={label} aria-label={label}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      className={className}
      title={label}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

export function Cell({ lib, value, className }) {
  const { status, name } = parseCell(value);

  if (status === 'none') {
    return (
      <td className={clsx(styles.cell, styles.noneCell, className)}>
        <Glyph status="none" />
        <span className={styles.srOnly}>none</span>
      </td>
    );
  }

  const label = `${lib.title || lib.label} ${name}: ${STATUS_LABEL[status]}`;
  return (
    <td className={clsx(styles.cell, className)}>
      <DocLink
        href={lib.resolve(name)}
        label={label}
        className={styles.cellLink}
      >
        <Glyph status={status} />
      </DocLink>
    </td>
  );
}

export function Legend({ note }) {
  return (
    <div className={styles.legend}>
      <span>
        <Glyph status="full" hidden={false} /> Dedicated component
      </span>
      <span>
        <Glyph status="partial" hidden={false} /> Via prop / composition
      </span>
      <span>
        <Glyph status="none" hidden={false} /> None
      </span>
      {note && <span className={styles.legendNote}>{note}</span>}
    </div>
  );
}

/** The header row: a capability column plus one column per library shown. */
export function HeadRow({ columns }) {
  return (
    <tr>
      <th className={clsx(styles.headCell, styles.capCol)}>Capability</th>
      {columns.map(lib => (
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
  );
}

export function CategoryRow({ heading, span }) {
  return (
    <tr className={styles.catRow}>
      <th scope="colgroup" colSpan={span} className={styles.catCell}>
        {heading}
      </th>
    </tr>
  );
}
