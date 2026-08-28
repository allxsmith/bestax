/**
 * Guards on the triage upsert picker (pick-triage-upsert.mjs).
 *
 * This decides which existing comment ai-triage.yml's publish step PATCHes as
 * bestaxbot. Two ways to get it wrong, and the tests are organised around
 * them rather than around the implementation:
 *
 * 1. Picking SOMEONE ELSE'S comment overwrites it. That is the failure
 *    `.github/CLAUDE.md` rule 6 exists to prevent (`--edit-last` selects by
 *    author, not by marker), so the author-class and marker tests below are
 *    the load-bearing ones.
 * 2. Picking NOTHING when a marker comment exists posts a duplicate on every
 *    labeled re-run. Recoverable noise, which is why "no match" is the
 *    direction this errs toward — but the pagination test pins the case that
 *    used to make it happen silently.
 *
 * The author test is imported, not restated: sharing
 * auto-close-duplicates.mjs's `isAutomationAuthor` is the point of the file,
 * so a test that hard-coded its own notion of an automation author would
 * defeat it.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { MARKERS } from './render-triage-comments.mjs';
import { pickUpsertTarget, parseArgs } from './pick-triage-upsert.mjs';

const SCRIPT = fileURLToPath(
  new URL('./pick-triage-upsert.mjs', import.meta.url)
);
const MARKER = MARKERS['triage-dedupe'];

const comment = (id, login, type, body) => ({
  id,
  user: { login, type },
  body,
});

const bestaxbot = (id, body) => comment(id, 'bestaxbot', 'User', body);
const human = (id, body) => comment(id, 'someone', 'User', body);

// --- author class: rule 6's whole point -------------------------------------

test('a human comment carrying the marker is never selected', () => {
  // Anyone can quote a marker into their own comment. Selecting it would
  // overwrite a person's words with a machine comment.
  const comments = [human(1, `look: ${MARKER}`)];
  assert.equal(pickUpsertTarget(comments, MARKER), null);
});

test('every automation author class is selectable, including the legacy ones', () => {
  // The identity has changed twice: claude[bot] → github-actions[bot] →
  // bestaxbot. A labeled re-run on an old item must refresh, not duplicate.
  for (const author of [
    ['bestaxbot', 'User'],
    ['github-actions[bot]', 'Bot'],
    ['claude[bot]', 'Bot'],
    // A `[bot]`-suffixed login typed as User: the jq this replaced tested
    // only `login == "bestaxbot" or type == "Bot"` and missed exactly this.
    ['someapp[bot]', 'User'],
  ]) {
    const [login, type] = author;
    assert.equal(
      pickUpsertTarget([comment(7, login, type, MARKER)], MARKER),
      7,
      `${login} (${type}) should be selectable`
    );
  }
});

// --- marker scoping ---------------------------------------------------------

test('a different triage marker is not a match', () => {
  // The three commands each own one comment; find-issues must never refresh
  // the dedupe comment.
  const comments = [bestaxbot(1, MARKERS['triage-find-issues'])];
  assert.equal(pickUpsertTarget(comments, MARKER), null);
  assert.equal(pickUpsertTarget(comments, MARKERS['triage-find-issues']), 1);
});

test('the marker is matched anywhere in the body, because it sits at the end', () => {
  assert.equal(
    pickUpsertTarget([bestaxbot(3, `### AI triage\n\n${MARKER}`)], MARKER),
    3
  );
});

test('an automation comment without the marker is not a match', () => {
  assert.equal(pickUpsertTarget([bestaxbot(1, 'a repro draft')], MARKER), null);
});

test('a marker comment with no Duplicate-of line still matches', () => {
  // Deliberate divergence from auto-close-duplicates.mjs's findMarkerComment,
  // which additionally requires `Duplicate of #N` because it wants a close
  // candidate. A "No duplicates found." comment must still be refreshed.
  const body = `### AI triage\n\nNo duplicates found.\n\n${MARKER}`;
  assert.equal(pickUpsertTarget([bestaxbot(5, body)], MARKER), 5);
});

// --- last-match-wins, across pages ------------------------------------------

test('the LAST matching comment wins, not the first', () => {
  const comments = [bestaxbot(1, MARKER), human(2, 'hi'), bestaxbot(3, MARKER)];
  assert.equal(pickUpsertTarget(comments, MARKER), 3);
});

test('a newer human comment does not displace the marker comment', () => {
  const comments = [bestaxbot(1, MARKER), human(9, 'still broken for me')];
  assert.equal(pickUpsertTarget(comments, MARKER), 1);
});

test('degenerate entries are skipped rather than throwing', () => {
  const comments = [
    null,
    'not an object',
    { id: 1 },
    { id: 2, user: null, body: MARKER },
    { id: 3, user: { login: 'bestaxbot', type: 'User' }, body: null },
    // A non-integer id would produce a malformed PATCH URL.
    { id: 'x', user: { login: 'bestaxbot', type: 'User' }, body: MARKER },
    bestaxbot(4, MARKER),
  ];
  assert.equal(pickUpsertTarget(comments, MARKER), 4);
});

test('no comments, no marker, and bad input all yield no target', () => {
  assert.equal(pickUpsertTarget([], MARKER), null);
  assert.equal(pickUpsertTarget([bestaxbot(1, MARKER)], ''), null);
  assert.equal(pickUpsertTarget(null, MARKER), null);
});

// --- the CLI, including the pagination shape it exists for ------------------

const write = contents => {
  const dir = mkdtempSync(join(tmpdir(), 'pick-upsert-'));
  const file = join(dir, 'comments.json');
  writeFileSync(file, contents);
  return file;
};

const run = (file, marker = MARKER) =>
  spawnSync(
    process.execPath,
    [SCRIPT, `--comments-file=${file}`, `--marker=${marker}`],
    { encoding: 'utf8' }
  );

test('a single page prints the id', () => {
  const res = run(
    write(JSON.stringify([human(1, 'hi'), bestaxbot(2, MARKER)]))
  );
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), '2');
});

test('MULTIPLE pages are flattened, so the overall last match wins', () => {
  // `gh api --paginate` applies --jq per page, so this is what the publish
  // step actually feeds in: one compact JSON array per line. A per-page
  // `last` would answer 8 here only by luck, and would answer wrongly when
  // the final page holds no match at all — the next test.
  const file = write(
    [
      JSON.stringify([bestaxbot(1, MARKER), human(2, 'hi')]),
      JSON.stringify([human(7, 'more'), bestaxbot(8, MARKER)]),
    ].join('\n')
  );
  assert.equal(run(file).stdout.trim(), '8');
});

test('a match on an EARLIER page is still found when the last page has none', () => {
  const file = write(
    [
      JSON.stringify([bestaxbot(1, MARKER)]),
      JSON.stringify([human(2, 'later chatter'), human(3, 'and more')]),
    ].join('\n')
  );
  assert.equal(run(file).stdout.trim(), '1');
});

test('no match prints nothing and still exits 0 — the caller then POSTs', () => {
  const res = run(write(JSON.stringify([human(1, 'hi')])));
  assert.equal(res.status, 0);
  assert.equal(res.stdout, '');
});

test('unparsable input exits 1 rather than posting a duplicate', () => {
  const res = run(write('{ not json'));
  assert.equal(res.status, 1);
  assert.equal(res.stdout, '');
});

test('a missing file exits 1 and leaks no path-derived text beyond the fixed message', () => {
  const res = run('/nonexistent/comments.json');
  assert.equal(res.status, 1);
  assert.equal(res.stdout, '');
  assert.match(res.stderr, /^pick-triage-upsert: /);
});

test('usage errors exit 2', () => {
  for (const args of [
    [],
    ['--comments-file=/tmp/x.json'],
    ['--marker=m'],
    ['--comments-file=/tmp/x.json', '--marker=m', '--extra=1'],
    ['positional'],
  ]) {
    assert.equal(
      spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' })
        .status,
      2,
      args.join(' ')
    );
  }
});

test('parseArgs accepts a marker containing the characters a marker has', () => {
  assert.deepEqual(
    parseArgs([`--comments-file=/tmp/c.json`, `--marker=${MARKER}`]),
    { commentsFile: '/tmp/c.json', marker: MARKER }
  );
});
