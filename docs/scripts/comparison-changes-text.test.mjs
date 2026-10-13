/**
 * The words around a "The State of React" changes table. A published edition
 * can't be edited, and the paths that explain corrections only run once an
 * edition has some, so these pin the text before a post depends on it.
 *
 * Lives in docs/scripts/ for the same reason as comparison-snapshots.test.mjs:
 * `node --test "scripts/*.test.mjs"` is where this package's unit tests run.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  fixedInLine,
  joinAnd,
  legendNote,
} from '../src/components/ComponentComparison/changesText.mjs';

test('joinAnd reads as prose for one, two, and more items', () => {
  assert.deepEqual(joinAnd([]), []);
  assert.equal(joinAnd(['a']).join(''), 'a');
  assert.equal(joinAnd(['a', 'b']).join(''), 'a and b');
  assert.equal(joinAnd(['a', 'b', 'c']).join(''), 'a, b, and c');
  assert.equal(joinAnd(['a', 'b', 'c', 'd']).join(''), 'a, b, c, and d');
});

test('joinAnd keeps the items themselves, so they can be elements', () => {
  const a = { pr: 1 };
  const b = { pr: 2 };
  assert.deepEqual(joinAnd([a, b]), [a, ' and ', b]);
});

test('the line under the table names every pull request behind a correction', () => {
  const line = fixes => fixedInLine(fixes, pr => `#${pr}`).join('');
  assert.equal(line([766]), 'The reasons for each correction are in #766.');
  assert.equal(
    line([766, 843]),
    'The reasons for each correction are in #766 and #843.'
  );
  assert.equal(
    line([766, 843, 901]),
    'The reasons for each correction are in #766, #843, and #901.'
  );
});

test('without corrections, the legend says what the published editions say', () => {
  assert.equal(
    legendNote(false),
    'Highlighted cells changed (before → after); the rest of each row is shown for context.'
  );
});

test('with corrections, the legend explains the dashed cells', () => {
  assert.match(legendNote(true), /Dashed ones are corrections/);
  assert.match(
    legendNote(true),
    /^Highlighted cells changed \(before → after\)/
  );
});
