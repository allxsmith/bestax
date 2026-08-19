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

test('operators never stay glued to a path', () => {
  // The property callers depend on: a path abutting an operator is still its
  // own word. Operators split character by character, which is coarser than a
  // real shell parser and deliberately so — nothing here interprets them, it
  // only needs them not to swallow a filename.
  assert.deepEqual(tokenize('a 1>&2 && { b || true; }'), [
    'a',
    '1',
    '>',
    '&',
    '2',
    '&',
    '&',
    '{',
    'b',
    '|',
    '|',
    'true',
    ';',
    '}',
  ]);
  assert.ok(tokenize('node ./a.mjs;node ./b.mjs').includes('./a.mjs'));
  assert.ok(tokenize('node ./a.mjs>out').includes('./a.mjs'));
});

test('an empty or whitespace-only command yields no words', () => {
  assert.deepEqual(tokenize(''), []);
  assert.deepEqual(tokenize('   '), []);
});

test('an empty quoted string is a real, empty word', () => {
  assert.deepEqual(tokenize("a '' b"), ['a', '', 'b']);
});

test('shell operators end a word even without whitespace', () => {
  // `node ./a.mjs;node ./b.mjs` names two scripts, and a caller scanning for
  // paths has to see both.
  assert.deepEqual(tokenize('node ./a.mjs;node ./b.mjs'), [
    'node',
    './a.mjs',
    ';',
    'node',
    './b.mjs',
  ]);
  assert.deepEqual(tokenize('a>b'), ['a', '>', 'b']);
  assert.deepEqual(tokenize('a|b'), ['a', '|', 'b']);
});

test('backslash escapes are honoured where sh honours them', () => {
  // Inside double quotes sh unescapes \" and \; inside single quotes nothing
  // is special.
  assert.deepEqual(tokenize('node "a\\"b.mjs"'), ['node', 'a"b.mjs']);
  assert.deepEqual(tokenize("node 'a\\b.mjs'"), ['node', 'a\\b.mjs']);
});

test('an unbalanced quote throws instead of inventing a word', () => {
  // The shell would reject the command outright, so accepting it would let a
  // caller assert things about a command that cannot run.
  assert.throws(() => tokenize("node 'x.mjs"), /unbalanced single quote/);
  assert.throws(() => tokenize('node "x.mjs'), /unbalanced double quote/);
});

test('subshell parens and backticks end a word', () => {
  // `(cd x && node ./a.mjs)` otherwise yields `./a.mjs)`, which no extension
  // test matches, so a path scanner drops it silently.
  assert.ok(
    tokenize('(cd sub && node ./scripts/stamp.mjs)').includes(
      './scripts/stamp.mjs'
    )
  );
  assert.ok(tokenize('node `which x`/a.mjs').includes('/a.mjs'));
});
