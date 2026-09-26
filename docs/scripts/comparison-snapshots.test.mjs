/**
 * "The State of React" edition snapshots: writing them, reading them back by
 * column id, and diffing two of them.
 *
 * Lives in docs/scripts/ rather than beside the module because `docs` has no
 * jest config — `node --test "scripts/*.test.mjs"` is the only place a unit test
 * in this package actually runs in CI.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseStatus,
  snapshotColumns,
  diffSnapshots,
} from '../src/components/ComponentComparison/snapshots.mjs';
import {
  columnOrder,
  loadLiveData,
  serializeSnapshot,
} from './snapshot-comparison.mjs';

const lib = (id, idx) => ({ id, idx, title: id, label: id, color: '#000' });

// The live list as it stands, and as it would after an edition inserts a
// library at position 2, shifting everything after it.
const LIVE = [
  lib('bestax', 1),
  lib('mantine', 2),
  lib('rbootstrap', 3),
  lib('mui', 4),
];
const LIVE_WITH_NEWLIB = [
  lib('bestax', 1),
  lib('newlib', 2),
  lib('mantine', 3),
  lib('rbootstrap', 4),
  lib('mui', 5),
];

const snapshot = (reviewed, libs, rows) => ({
  reviewed,
  libs,
  categories: [{ heading: 'Date & time', rows }],
});

const JULY = snapshot(
  '2026-07-27',
  ['bestax', 'mantine', 'rbootstrap', 'mui'],
  [
    ['Date input', 'DateInput', 'DateInput', 0, 'DateField'],
    ['Time input', 'TimeInput', 'TimePicker', 0, 'TimePicker'],
    ['Month picker', 0, 'MonthPicker', 0, '~DatePicker'],
  ]
);

const cellsOf = (snap, live, capability) => {
  const columns = snapshotColumns(snap, live);
  const row = snap.categories[0].rows.find(r => r[0] === capability);
  return Object.fromEntries(columns.map(c => [c.id, row[c.idx]]));
};

test('a snapshot resolves cells by its own recorded columns', () => {
  const expected = {
    bestax: 'DateInput',
    mantine: 'DateInput',
    rbootstrap: 0,
    mui: 'DateField',
  };
  assert.deepEqual(cellsOf(JULY, LIVE, 'Date input'), expected);
  // Inserting a library in the live list must not shift a frozen edition.
  assert.deepEqual(cellsOf(JULY, LIVE_WITH_NEWLIB, 'Date input'), expected);
});

test('a snapshot shows only the libraries it recorded', () => {
  const ids = snapshotColumns(JULY, LIVE_WITH_NEWLIB).map(c => c.id);
  assert.deepEqual(ids, ['bestax', 'mantine', 'rbootstrap', 'mui']);
});

test('a snapshot without recorded columns is refused', () => {
  const legacy = { ...JULY };
  delete legacy.libs;
  assert.throws(() => snapshotColumns(legacy, LIVE), /does not record/);
});

test('a snapshot naming a library the live data dropped is refused', () => {
  const live = LIVE.filter(l => l.id !== 'rbootstrap');
  assert.throws(() => snapshotColumns(JULY, live), /rbootstrap/);
});

test('a row of the wrong length is refused', () => {
  const bad = snapshot('2026-07-27', ['bestax', 'mantine'], [['Row', 'A']]);
  assert.throws(() => snapshotColumns(bad, LIVE), /1 cells for 2 libraries/);
});

test('diffSnapshots reports status changes, new rows, and dropped rows', () => {
  const september = snapshot(
    '2026-09-26',
    ['bestax', 'newlib', 'mantine', 'rbootstrap', 'mui'],
    [
      // rbootstrap: none -> dedicated; everything else holds
      ['Date input', 'DateInput', 'X', 'DateInput', 'Form.Date', 'DateField'],
      // mantine renamed TimePicker -> TimeInput, same status: not a change
      ['Time input', 'TimeInput', 0, 'TimeInput', 0, 'TimePicker'],
      ['Year picker', 0, 0, 'YearPicker', 0, 0],
    ]
  );
  const { columns, fromIdx, groups, removed } = diffSnapshots(
    JULY,
    september,
    LIVE_WITH_NEWLIB
  );
  assert.deepEqual(
    columns.map(c => c.id),
    ['bestax', 'newlib', 'mantine', 'rbootstrap', 'mui']
  );
  assert.equal(fromIdx.get('mantine'), 2);
  assert.equal(fromIdx.has('newlib'), false);

  const rows = groups.flatMap(g => g.rows);
  assert.deepEqual(
    rows.map(r => r.row[0]),
    ['Date input', 'Year picker']
  );
  // newlib has no July column, so its cell is not a change.
  assert.deepEqual([...rows[0].changed], ['rbootstrap']);
  assert.equal(rows[1].prev, null);
  assert.deepEqual(removed, ['Month picker']);
});

test('serializeSnapshot writes the column order and round-trips', () => {
  const libs = columnOrder([
    lib('mui', 4),
    lib('bestax', 1),
    lib('mantine', 2),
    lib('rbootstrap', 3),
  ]);
  assert.deepEqual(libs, ['bestax', 'mantine', 'rbootstrap', 'mui']);
  const text = serializeSnapshot({
    reviewed: JULY.reviewed,
    libs,
    categories: JULY.categories,
  });
  assert.deepEqual(JSON.parse(text), JULY);
  // one row per line
  assert.match(
    text,
    /\n {8}\["Date input","DateInput","DateInput",0,"DateField"\]/
  );
});

test('serializeSnapshot refuses a row that does not match the columns', () => {
  assert.throws(
    () =>
      serializeSnapshot({
        reviewed: '2026-07-27',
        libs: ['bestax', 'mantine'],
        categories: [{ heading: 'X', rows: [['Row', 'A', 'B', 'C']] }],
      }),
    /3 cells for 2 libraries/
  );
});

test('every committed snapshot records its columns and matches them', () => {
  const dir = join(
    dirname(fileURLToPath(import.meta.url)),
    '../src/data/state-of-react'
  );
  const files = readdirSync(dir).filter(f => f.endsWith('.json'));
  assert.ok(files.length > 0);
  for (const file of files) {
    const snap = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    assert.match(snap.reviewed, /^\d{4}-\d{2}-\d{2}$/, file);
    assert.ok(Array.isArray(snap.libs) && snap.libs.length > 0, file);
    assert.equal(new Set(snap.libs).size, snap.libs.length, file);
    const seen = new Set();
    for (const group of snap.categories) {
      for (const row of group.rows) {
        assert.equal(row.length, snap.libs.length + 1, `${file}: ${row[0]}`);
        assert.ok(!seen.has(row[0]), `${file}: duplicate row ${row[0]}`);
        seen.add(row[0]);
      }
    }
  }
});

test('the diff reads cell status the same way the table renders it', async () => {
  const { parseCell } = await loadLiveData();
  for (const value of [0, null, undefined, 'Button', '~Button', '', '~']) {
    assert.equal(parseStatus(value), parseCell(value).status, String(value));
  }
});

test('every committed snapshot resolves against the live library list', async () => {
  const { libs } = await loadLiveData();
  const dir = join(
    dirname(fileURLToPath(import.meta.url)),
    '../src/data/state-of-react'
  );
  for (const file of readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const snap = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    assert.doesNotThrow(() => snapshotColumns(snap, libs), file);
  }
});
