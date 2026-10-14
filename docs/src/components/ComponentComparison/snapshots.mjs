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
// comparison-snapshots.test.mjs holds the two to the same answers.
export function parseStatus(value) {
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

const cellKey = (capability, id) => JSON.stringify([capability, id]);

/**
 * The fixes `to` records against the `from` edition. A snapshot carries the
 * live `corrections` list as it stood, and a fix names the edition it
 * corrects by that edition's `reviewed` date.
 *
 * Returns them by cell (`byCell`: the mark each fix gave the cell and the
 * pull request that made it, with the row named as the edition had it), and
 * the rows they renamed (`oldNames`: the name now, mapped to the edition's).
 */
function fixesAgainst(from, to) {
  const byCell = new Map();
  const oldNames = new Map();
  for (const fix of to.corrections ?? []) {
    if (fix.edition !== from.reviewed) continue;
    for (const [capability, marks] of Object.entries(fix.cells)) {
      for (const [id, mark] of Object.entries(marks)) {
        const key = cellKey(capability, id);
        byCell.set(key, [...(byCell.get(key) ?? []), { mark, pr: fix.pr }]);
      }
    }
    for (const [was, now] of Object.entries(fix.renamed ?? {})) {
      oldNames.set(now, was);
    }
  }
  return { byCell, oldNames };
}

/**
 * Work out what moved between two edition snapshots: rows whose status
 * changed for any library both snapshots cover, rows that are new, and rows
 * that were dropped. A renamed component with the same status is not a change
 * a reader can see in the glyphs, so it is left out, and a library that only
 * the newer snapshot covers has nothing to compare against.
 *
 * A row's previous row is the one a recorded fix to the `from` edition renamed
 * it from, or else the one with its name. A renamed row is then compared cell
 * by cell like any other, and reads as neither dropped nor new.
 *
 * A changed cell is a correction when `to` records a fix to the `from`
 * edition that gave the cell the mark it has now: the older edition had that
 * cell wrong, rather than the library changing since. When a release moves
 * the cell again after the fix, the mark it has now isn't the fix's, so the
 * cell reads as a change.
 *
 * Returns the newer snapshot's columns, each library's position in the older
 * snapshot's rows (`fromIdx`, by id), the changed rows grouped by heading
 * (each with the previous row, or null when the row is new, the set of
 * library ids whose status changed, and the subset of those that are
 * corrections), the dropped capability names, and the pull requests behind
 * the corrections shown (`fixes`, ascending).
 */
export function diffSnapshots(from, to, liveLibs) {
  const fromColumns = snapshotColumns(from, liveLibs);
  const columns = snapshotColumns(to, liveLibs);
  const fromIdx = new Map(fromColumns.map(lib => [lib.id, lib.idx]));
  const { byCell, oldNames } = fixesAgainst(from, to);
  const fixes = new Set();

  const before = new Map();
  for (const group of from.categories) {
    for (const row of group.rows) before.set(row[0], row);
  }
  const seen = new Set();
  const groups = to.categories
    .map(group => ({
      heading: group.heading,
      rows: group.rows.flatMap(row => {
        const name = oldNames.get(row[0]) ?? row[0];
        seen.add(name);
        const prev = before.get(name);
        if (!prev) {
          return [
            { row, prev: null, changed: new Set(), corrected: new Set() },
          ];
        }
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
        if (changed.size === 0) return [];
        const corrected = new Set();
        for (const lib of columns.filter(c => changed.has(c.id))) {
          const now = parseStatus(row[lib.idx]);
          const made = (byCell.get(cellKey(name, lib.id)) ?? []).filter(
            fix => fix.mark === now
          );
          if (made.length === 0) continue;
          corrected.add(lib.id);
          for (const fix of made) fixes.add(fix.pr);
        }
        return [{ row, prev, changed, corrected }];
      }),
    }))
    .filter(group => group.rows.length > 0);
  const removed = [...before.keys()].filter(cap => !seen.has(cap));
  return {
    columns,
    fromIdx,
    groups,
    removed,
    fixes: [...fixes].sort((a, b) => a - b),
  };
}
