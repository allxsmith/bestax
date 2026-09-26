/**
 * The footnotes on the live comparison matrix. A note finds its rows by
 * capability name, so renaming a row would silently drop its marker; these
 * hold every note to rows that exist.
 *
 * Lives in docs/scripts/ for the same reason as comparison-snapshots.test.mjs:
 * `node --test "scripts/*.test.mjs"` is where this package's unit tests run.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadLiveData } from './snapshot-comparison.mjs';

test('every note points at rows the live matrix has', async () => {
  const { categories, notes } = await loadLiveData();
  const rows = new Set(categories.flatMap(group => group.rows.map(r => r[0])));
  for (const note of notes) {
    assert.ok(note.rows.length > 0, `note "${note.id}" names no rows`);
    for (const row of note.rows) {
      assert.ok(rows.has(row), `note "${note.id}" names unknown row "${row}"`);
    }
  }
});

test('note ids are unique, since they become page anchors', async () => {
  const { notes } = await loadLiveData();
  const ids = notes.map(note => note.id);
  assert.equal(new Set(ids).size, ids.length);
});
