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

const snapshot = (reviewed, libs, rows, corrections) => ({
  reviewed,
  libs,
  categories: [{ heading: 'Date & time', rows }],
  ...(corrections && { corrections }),
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

// Three cells move between July and this October: React-Bootstrap's Date
// input from – to ✓, MUI's from ✓ to ◐, and bestax's Time input from ✓ to –.
const october = corrections =>
  snapshot(
    '2026-10-13',
    ['bestax', 'mantine', 'rbootstrap', 'mui'],
    [
      ['Date input', 'DateInput', 'DateInput', 'Form.Date', '~DateField'],
      ['Time input', 0, 'TimePicker', 0, 'TimePicker'],
      ['Month picker', 0, 'MonthPicker', 0, '~DatePicker'],
    ],
    corrections
  );

const diffCells = (from, to) => {
  const { groups, fixes } = diffSnapshots(from, to, LIVE);
  const rows = groups.flatMap(g => g.rows);
  const cells = kind =>
    rows.flatMap(r => [...r[kind]].map(id => `${r.row[0]}/${id}`)).sort();
  return { changed: cells('changed'), corrected: cells('corrected'), fixes };
};

test('a fix to the older edition marks the cell it gave its mark as a correction', () => {
  const { changed, corrected, fixes } = diffCells(
    JULY,
    october([
      {
        edition: '2026-07-27',
        pr: 101,
        cells: { 'Date input': { rbootstrap: 'full', mui: 'partial' } },
      },
    ])
  );
  assert.deepEqual(changed, [
    'Date input/mui',
    'Date input/rbootstrap',
    'Time input/bestax',
  ]);
  assert.deepEqual(corrected, ['Date input/mui', 'Date input/rbootstrap']);
  assert.deepEqual(fixes, [101]);
});

test('a fix a release overtook reads as a change', () => {
  // The fix gave Time input ◐; a release since took it to –, so the – is news.
  const { corrected, fixes } = diffCells(
    JULY,
    october([
      {
        edition: '2026-07-27',
        pr: 101,
        cells: { 'Time input': { bestax: 'partial' } },
      },
    ])
  );
  assert.deepEqual(corrected, []);
  assert.deepEqual(fixes, []);
});

test('a fix to a different edition marks nothing', () => {
  const { corrected, fixes } = diffCells(
    JULY,
    october([
      {
        edition: '2026-09-26',
        pr: 101,
        cells: { 'Date input': { rbootstrap: 'full' } },
      },
    ])
  );
  assert.deepEqual(corrected, []);
  assert.deepEqual(fixes, []);
});

test('fixes list each pull request behind a correction shown, once, ascending', () => {
  const { corrected, fixes } = diffCells(
    JULY,
    october([
      {
        edition: '2026-07-27',
        pr: 205,
        cells: { 'Date input': { mui: 'partial' } },
      },
      {
        edition: '2026-07-27',
        pr: 101,
        cells: {
          'Date input': { rbootstrap: 'full' },
          'Month picker': { mantine: 'none' },
        },
      },
      {
        edition: '2026-07-27',
        pr: 300,
        cells: { 'Time input': { bestax: 'partial' } },
      },
    ])
  );
  assert.deepEqual(corrected, ['Date input/mui', 'Date input/rbootstrap']);
  // 300's fix was overtaken, and Month picker never moved, so neither shows.
  assert.deepEqual(fixes, [101, 205]);
});

test('a snapshot without corrections shows every changed cell as a change', () => {
  const { changed, corrected, fixes } = diffCells(JULY, october());
  assert.equal(changed.length, 3);
  assert.deepEqual(corrected, []);
  assert.deepEqual(fixes, []);
});

// July's Month picker row, renamed Month calendar by October, with bestax's
// cell on it moved from – to ◐ unless `steady`.
const renamedOctober = (corrections, steady = false) =>
  snapshot(
    '2026-10-13',
    ['bestax', 'mantine', 'rbootstrap', 'mui'],
    [
      ['Date input', 'DateInput', 'DateInput', 0, 'DateField'],
      ['Time input', 'TimeInput', 'TimePicker', 0, 'TimePicker'],
      [
        'Month calendar',
        steady ? 0 : '~DateInput',
        'MonthPicker',
        0,
        '~DatePicker',
      ],
    ],
    corrections
  );

const RENAME = { 'Month picker': 'Month calendar' };

test('a row a fix renamed is compared with its old row, neither dropped nor new', () => {
  const { groups, removed } = diffSnapshots(
    JULY,
    renamedOctober([
      { edition: '2026-07-27', pr: 101, renamed: RENAME, cells: {} },
    ]),
    LIVE
  );
  assert.deepEqual(removed, []);
  const rows = groups.flatMap(g => g.rows);
  assert.deepEqual(
    rows.map(r => r.row[0]),
    ['Month calendar']
  );
  // Compared with July's Month picker row, so it gets no "new" badge, and
  // only the cell that moved is marked.
  assert.equal(rows[0].prev, JULY.categories[0].rows[2]);
  assert.deepEqual([...rows[0].changed], ['bestax']);
  assert.deepEqual([...rows[0].corrected], []);
});

test("a renamed row's corrected cells are named as the edition had them", () => {
  const { corrected, fixes } = diffCells(
    JULY,
    renamedOctober([
      {
        edition: '2026-07-27',
        pr: 101,
        renamed: RENAME,
        cells: { 'Month picker': { bestax: 'partial' } },
      },
    ])
  );
  assert.deepEqual(corrected, ['Month calendar/bestax']);
  assert.deepEqual(fixes, [101]);
});

test('a renamed row whose cells held steady is left out like any other', () => {
  const { groups, removed } = diffSnapshots(
    JULY,
    renamedOctober(
      [{ edition: '2026-07-27', pr: 101, renamed: RENAME, cells: {} }],
      true
    ),
    LIVE
  );
  assert.deepEqual(groups, []);
  assert.deepEqual(removed, []);
});

test('a rename recorded against a different edition does nothing', () => {
  const { groups, removed } = diffSnapshots(
    JULY,
    renamedOctober([
      { edition: '2026-09-26', pr: 101, renamed: RENAME, cells: {} },
    ]),
    LIVE
  );
  assert.deepEqual(removed, ['Month picker']);
  const rows = groups.flatMap(g => g.rows);
  assert.deepEqual(
    rows.map(r => [r.row[0], r.prev]),
    [['Month calendar', null]]
  );
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
  assert.deepEqual(JSON.parse(text), { ...JULY, corrections: [] });
  // one row per line
  assert.match(
    text,
    /\n {8}\["Date input","DateInput","DateInput",0,"DateField"\]/
  );
});

test('serializeSnapshot carries the corrections, one corrected or renamed row per line', () => {
  const corrections = [
    {
      edition: '2026-07-27',
      pr: 101,
      renamed: { 'Time picker': 'Time input' },
      cells: {
        'Date input': { rbootstrap: 'full' },
        'Month picker': { bestax: 'partial', mui: 'full' },
      },
    },
    { edition: '2026-07-27', pr: 102, renamed: RENAME, cells: {} },
    {
      edition: '2026-07-27',
      pr: 103,
      cells: { 'Date input': { mui: 'none' } },
    },
  ];
  const text = serializeSnapshot({
    reviewed: '2026-09-26',
    libs: JULY.libs,
    categories: JULY.categories,
    corrections,
  });
  // A fix without renames writes no `renamed`, so this round-trips exactly.
  assert.deepEqual(JSON.parse(text).corrections, corrections);
  assert.match(
    text,
    /\n {8}"Month picker": \{"bestax":"partial","mui":"full"\}/
  );
  assert.match(text, /\n {8}"Time picker": "Time input"\n/);
  assert.match(text, /\n {6}"cells": \{\}\n/);
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

test('every live row has one cell per library, as a snapshot requires', async () => {
  // Cells are positional, and the table renders a missing one as a dash, so a
  // miscounted row builds cleanly. Snapshotting refuses it, so check now
  // rather than when the next edition is written.
  const { lastReviewed, libs, categories } = await loadLiveData();
  assert.doesNotThrow(() =>
    serializeSnapshot({
      reviewed: lastReviewed,
      libs: columnOrder(libs),
      categories,
    })
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

/** Every committed edition snapshot, oldest first. */
function committedSnapshots() {
  const dir = join(
    dirname(fileURLToPath(import.meta.url)),
    '../src/data/state-of-react'
  );
  return readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .map(f => JSON.parse(readFileSync(join(dir, f), 'utf8')));
}

const MARKS = ['full', 'partial', 'none'];

test('every live correction fixes a cell or a row name an edition showed differently', async () => {
  // A fix finds its edition by review date, its cells by capability name and
  // library id, and its renamed rows by name, so a typo in any of them would
  // silently mark nothing.
  const { corrections } = await loadLiveData();
  const editions = new Map(committedSnapshots().map(s => [s.reviewed, s]));
  for (const fix of corrections) {
    const name = `the fix in #${fix.pr} to ${fix.edition}`;
    assert.ok(Number.isInteger(fix.pr) && fix.pr > 0, `${name}: pr`);
    const edition = editions.get(fix.edition);
    assert.ok(edition, `${name}: no committed snapshot has that review date`);
    const rows = new Map(
      edition.categories.flatMap(g => g.rows.map(r => [r[0], r]))
    );
    const renamed = Object.entries(fix.renamed ?? {});
    assert.ok(
      Object.keys(fix.cells).length + renamed.length > 0,
      `${name} names no cells and renames no rows`
    );
    for (const [was, now] of renamed) {
      assert.ok(rows.has(was), `${name}: that edition has no row "${was}"`);
      assert.ok(!rows.has(now), `${name}: that edition already has "${now}"`);
    }
    for (const [capability, marks] of Object.entries(fix.cells)) {
      const row = rows.get(capability);
      assert.ok(row, `${name}: that edition has no row "${capability}"`);
      for (const [id, mark] of Object.entries(marks)) {
        const cell = `${name}: ${capability}, ${id}`;
        const at = edition.libs.indexOf(id);
        assert.ok(at >= 0, `${cell}: that edition has no such column`);
        assert.ok(MARKS.includes(mark), `${cell}: unknown mark "${mark}"`);
        assert.notEqual(
          parseStatus(row[at + 1]),
          mark,
          `${cell}: the edition already showed that mark`
        );
      }
    }
  }
});

test('the next edition shows each pending correction it still holds as one', async () => {
  // Through the same path an edition takes: snapshot the live data, then diff
  // the newest committed snapshot against it.
  const { lastReviewed, libs, categories, corrections } = await loadLiveData();
  const newest = committedSnapshots().at(-1);
  const next = JSON.parse(
    serializeSnapshot({
      reviewed: lastReviewed,
      libs: columnOrder(libs),
      categories,
      corrections,
    })
  );
  const { groups, removed } = diffSnapshots(newest, next, libs);
  const shown = new Map(groups.flatMap(g => g.rows).map(r => [r.row[0], r]));
  const live = new Map(categories.flatMap(g => g.rows.map(r => [r[0], r])));
  const pending = corrections.filter(f => f.edition === newest.reviewed);
  const renamed = new Map(
    pending.flatMap(f => Object.entries(f.renamed ?? {}))
  );
  for (const [was, now] of renamed) {
    // A rename the live data has since undone or renamed again has nothing
    // to follow.
    if (!live.has(now)) continue;
    assert.ok(!removed.includes(was), `"${was}" reads as dropped`);
    assert.notEqual(shown.get(now)?.prev, null, `"${now}" reads as new`);
  }
  for (const fix of pending) {
    for (const [capability, marks] of Object.entries(fix.cells)) {
      const now = renamed.get(capability) ?? capability;
      for (const [id, mark] of Object.entries(marks)) {
        const row = live.get(now);
        const lib = libs.find(l => l.id === id);
        // A row renamed again or a release since the fix leaves nothing to
        // mark.
        if (!row || parseStatus(row[lib.idx]) !== mark) continue;
        assert.ok(
          shown.get(now)?.corrected.has(id),
          `${capability}, ${id} (#${fix.pr})`
        );
      }
    }
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
