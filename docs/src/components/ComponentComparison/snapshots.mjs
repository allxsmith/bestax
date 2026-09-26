// Reading "The State of React" edition snapshots (src/data/state-of-react/*.json).
//
// A matrix row is a positional tuple: [capability, cell for library 1, …]. The
// live data says which library sits at which position through `libs[].idx`,
// and that list is free to change: a library can be added, dropped, or
// reordered in any edition. So each snapshot records its own column order in
// `libs` (library ids, in row position order), and everything here resolves a
// snapshot's cells through that list rather than the live `idx`. A published
// edition then keeps showing the table it was written against.
//
// Pure functions of their arguments, so they run under `node --test` without
// the React side of the component.

// Mirrors parseCell's status rule in src/data/componentComparison.js, which
// this module does not import so it stays free of the site's module setup.
function parseStatus(value) {
  if (value === 0 || value == null) return 'none';
  if (typeof value === 'string' && value[0] === '~') return 'partial';
  return 'full';
}

/**
 * The columns a snapshot can show: the live library entries (label, color,
 * link resolver) for every library the snapshot recorded, each with `idx`
 * pointing at that library's position in the snapshot's own rows. Display
 * order follows the live list.
 *
 * Throws when the snapshot predates column recording, names a library the
 * live data no longer describes, or has a row of the wrong length, so a
 * mismatch fails the build instead of shifting every cell.
 */
export function snapshotColumns(snapshot, liveLibs) {
  const recorded = snapshot.libs;
  if (!Array.isArray(recorded) || recorded.length === 0) {
    throw new Error(
      `Comparison snapshot ${snapshot.reviewed} does not record its library ` +
        'columns. Regenerate it with `snapshot:comparison`.'
    );
  }
  const known = new Set(liveLibs.map(lib => lib.id));
  const unknown = recorded.filter(id => !known.has(id));
  if (unknown.length > 0) {
    throw new Error(
      `Comparison snapshot ${snapshot.reviewed} has columns for ` +
        `${unknown.join(', ')}, which src/data/componentComparison.js no ` +
        'longer describes. Keep the library entry (label, color, resolver) so ' +
        'published editions still render.'
    );
  }
  for (const group of snapshot.categories) {
    for (const row of group.rows) {
      if (row.length !== recorded.length + 1) {
        throw new Error(
          `Comparison snapshot ${snapshot.reviewed}: row "${row[0]}" has ` +
            `${row.length - 1} cells for ${recorded.length} libraries.`
        );
      }
    }
  }
  return liveLibs
    .filter(lib => recorded.includes(lib.id))
    .map(lib => ({ ...lib, idx: recorded.indexOf(lib.id) + 1 }));
}

/**
 * Work out what moved between two edition snapshots: rows whose status
 * changed for any library both snapshots cover, rows that are new, and rows
 * that were dropped. A renamed component with the same status is not a change
 * a reader can see in the glyphs, so it is left out, and a library that only
 * the newer snapshot covers has nothing to compare against.
 *
 * Returns the newer snapshot's columns, each library's position in the older
 * snapshot's rows (`fromIdx`, by id), the changed rows grouped by heading
 * (each with the previous row, or null when the row is new, and the set of
 * library ids whose status changed), and the dropped capability names.
 */
export function diffSnapshots(from, to, liveLibs) {
  const fromColumns = snapshotColumns(from, liveLibs);
  const columns = snapshotColumns(to, liveLibs);
  const fromIdx = new Map(fromColumns.map(lib => [lib.id, lib.idx]));

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
          columns
            .filter(
              lib =>
                fromIdx.has(lib.id) &&
                parseStatus(prev[fromIdx.get(lib.id)]) !==
                  parseStatus(row[lib.idx])
            )
            .map(lib => lib.id)
        );
        return changed.size > 0 ? [{ row, prev, changed }] : [];
      }),
    }))
    .filter(group => group.rows.length > 0);
  const removed = [...before.keys()].filter(cap => !seen.has(cap));
  return { columns, fromIdx, groups, removed };
}
