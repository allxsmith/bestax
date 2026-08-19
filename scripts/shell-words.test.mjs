/**
 * Holds scripts/lib/shell-words.mjs's two halves in agreement (#436).
 *
 * `quote` writes the release commands; `tokenize` reads them back to find the
 * script paths they name. A value that survives quoting but not tokenizing
 * makes check:conformance report a missing script on a config that would
 * publish fine. The round trip is the property, so it is asserted over the
 * awkward cases directly rather than left to agree by inspection.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { quote, tokenize } from './lib/shell-words.mjs';

const AWKWARD = [
  '/plain/path/script.mjs',
  '/My Projects/bestax/scripts/x.mjs',
  "/Users/o'brien/bestax/scripts/x.mjs",
  '/path/with"double/x.mjs',
  '/path/with$dollar/x.mjs',
  '/path/with\\backslash/x.mjs',
  '/trailing space /x.mjs',
  '/-leading-dash/x.mjs',
];

for (const value of AWKWARD) {
  test(`round trip: ${value}`, () => {
    // One word in, one word out, unchanged.
    assert.deepEqual(tokenize(quote(value)), [value]);
  });
}

test('a quoted value survives inside a larger command', () => {
  const path = "/Users/o'brien/My Projects/x.mjs";
  const cmd = `node ${quote(path)} --dir=${quote('/A B')} \${nextRelease.version}`;
  assert.deepEqual(tokenize(cmd), [
    'node',
    path,
    '--dir=/A B',
    '${nextRelease.version}',
  ]);
});

test('an unquoted command tokenizes on whitespace', () => {
  assert.deepEqual(tokenize('pnpm publish --no-git-checks --provenance'), [
    'pnpm',
    'publish',
    '--no-git-checks',
    '--provenance',
  ]);
});

test('shell operators stay attached as their own words', () => {
  // scriptTokens only cares about path-shaped words, but the classifier splits
  // on these, so tokenize must not swallow them.
  assert.deepEqual(tokenize('a 1>&2 && { b || true; }'), [
    'a',
    '1>&2',
    '&&',
    '{',
    'b',
    '||',
    'true;',
    '}',
  ]);
});

test('an empty or whitespace-only command yields no words', () => {
  assert.deepEqual(tokenize(''), []);
  assert.deepEqual(tokenize('   '), []);
});

test('an empty quoted string is a real, empty word', () => {
  assert.deepEqual(tokenize("a '' b"), ['a', '', 'b']);
});
