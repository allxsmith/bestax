/**
 * Guards on the supply-chain bypass expiry parser (#391).
 *
 * The failure mode worth guarding is silent and specific: comment-block
 * association. Entries in pnpm-workspace.yaml share comment blocks on purpose
 * (the four brace-expansion majors sit under one explanation), so the parser
 * cannot simply consume a block at the first entry — but it also must not let
 * a block leak forward past an entry, or a NEW unannotated bypass inherits the
 * date of whatever happened to precede it and the gate waves it through. Both
 * directions are asserted below, because a diff review cannot tell them apart.
 *
 * `.mjs` and `node --test` rather than jest: these are root-level scripts with
 * no package of their own, matching how docs/scripts is covered.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseBypassEntries, findExpired } from './lib/bypass-annotations.mjs';

const REPO = join(import.meta.dirname, '..');
const byName = (entries, name) => entries.find(e => e.name === name);

test('reads the annotation from the comment block above each entry', () => {
  const { entries } = parseBypassEntries(`
overrides:
  # bestax:review 2026-11-13 — quarterly sweep
  # Force patched thing.
  'thing@1': '>=1.2.3'
`);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].name, 'thing@1');
  assert.equal(entries[0].review, '2026-11-13');
  assert.equal(entries[0].permanent, false);
  assert.equal(entries[0].label, 'overrides');
});

test('consecutive entries share one comment block', () => {
  const { entries } = parseBypassEntries(`
overrides:
  # bestax:review 2026-11-13 — covers both majors
  # Force patched thing per major.
  'thing@1': '>=1.2.3'
  'thing@2': '>=2.3.4'
`);
  assert.equal(entries.length, 2);
  assert.equal(entries[0].review, '2026-11-13');
  assert.equal(entries[1].review, '2026-11-13');
});

test('a comment after an entry starts a new block instead of extending it', () => {
  // The regression that makes this check decorative: without the reset, the
  // unannotated second entry inherits the first's date and passes.
  const { entries } = parseBypassEntries(`
overrides:
  # bestax:review 2026-11-13 — annotated
  'annotated@1': '>=1.2.3'
  # Force patched other thing, with no annotation at all.
  'bare@2': '>=2.3.4'
`);
  assert.equal(byName(entries, 'annotated@1').review, '2026-11-13');
  assert.equal(byName(entries, 'bare@2').review, null);
});

test('a blank line breaks the association', () => {
  const { entries } = parseBypassEntries(`
overrides:
  # bestax:review 2026-11-13 — section prose, not this entry's annotation

  'bare@1': '>=1.2.3'
`);
  assert.equal(entries[0].review, null);
});

test('covers all three bypass lists, including the nested one', () => {
  const { entries } = parseBypassEntries(`
minimumReleaseAgeExclude:
  # bestax:permanent — deterministic formatting
  - prettier
overrides:
  # bestax:review 2026-11-13 — sweep
  'thing@1': '>=1.2.3'
auditConfig:
  ignoreGhsas:
    # bestax:review 2026-11-13 — sweep
    - GHSA-aaaa-bbbb-cccc
`);
  assert.deepEqual(
    entries.map(e => e.label),
    ['minimumReleaseAgeExclude', 'overrides', 'auditConfig.ignoreGhsas']
  );
  assert.equal(byName(entries, 'prettier').permanent, true);
  assert.equal(byName(entries, 'GHSA-aaaa-bbbb-cccc').review, '2026-11-13');
});

test('does not mistake a later top-level key for a bypass entry', () => {
  const { entries } = parseBypassEntries(`
overrides:
  # bestax:review 2026-11-13 — sweep
  'thing@1': '>=1.2.3'

nodeLinker: isolated
publicHoistPattern:
  - '*eslint*'
`);
  assert.deepEqual(
    entries.map(e => e.name),
    ['thing@1']
  );
});

test('findExpired separates due, unannotated, and healthy', () => {
  const entries = [
    { name: 'due', review: '2026-08-01', permanent: false },
    { name: 'today', review: '2026-08-13', permanent: false },
    { name: 'future', review: '2026-11-13', permanent: false },
    { name: 'bare', review: null, permanent: false },
    { name: 'forever', review: null, permanent: true },
  ];
  const { expired, unannotated } = findExpired(entries, '2026-08-13');

  // An entry is due the day it names, not the day after.
  assert.deepEqual(
    expired.map(e => e.name),
    ['due', 'today']
  );
  assert.deepEqual(
    unannotated.map(e => e.name),
    ['bare']
  );
});

test('permanent entries never expire, however old', () => {
  const { expired, unannotated } = findExpired(
    [{ name: 'prettier', review: '2020-01-01', permanent: true }],
    '2026-08-13'
  );
  assert.deepEqual(expired, []);
  assert.deepEqual(unannotated, []);
});

// --- Malformed annotations. Every shape below fails OPEN if unvalidated: the
// date never comes due, or a stray marker outranks a real one. ---

test('a date-shaped non-date is rejected, not treated as far future', () => {
  const { entries } = parseBypassEntries(`
overrides:
  # bestax:review 9999-99-99 — typo
  'thing@1': '>=1.2.3'
`);
  assert.match(entries[0].error, /not a real calendar date/);
  assert.equal(entries[0].review, null);
  // Lexicographically "9999-99-99" beats every real date, so an unvalidated
  // parser would call this healthy forever.
  const { malformed, expired } = findExpired(entries, '2026-08-13');
  assert.deepEqual(expired, []);
  assert.deepEqual(
    malformed.map(e => e.name),
    ['thing@1']
  );
});

test('a rolled-over date (2026-02-30) is rejected', () => {
  const { entries } = parseBypassEntries(`
overrides:
  # bestax:review 2026-02-30 — nope
  'thing@1': '>=1.2.3'
`);
  assert.match(entries[0].error, /not a real calendar date/);
});

test('both markers at once is an error, not a silent permanent', () => {
  const { entries } = parseBypassEntries(`
overrides:
  # bestax:review 2026-01-01 — due long ago
  # bestax:permanent — incidental mention
  'thing@1': '>=1.2.3'
`);
  assert.match(entries[0].error, /both/);
  assert.equal(entries[0].permanent, false);
  assert.deepEqual(findExpired(entries, '2026-08-13').expired, []);
});

test('a marker with no reason is an error', () => {
  const { entries: bare } = parseBypassEntries(`
overrides:
  # bestax:permanent
  'thing@1': '>=1.2.3'
`);
  assert.match(bare[0].error, /no reason/);

  const { entries: dated } = parseBypassEntries(`
overrides:
  # bestax:review 2026-11-13
  'thing@1': '>=1.2.3'
`);
  assert.match(dated[0].error, /no reason/);
});

test('malformed entries are reported as malformed, not as unannotated', () => {
  const { entries } = parseBypassEntries(`
overrides:
  # bestax:review 9999-99-99 — typo
  'thing@1': '>=1.2.3'
`);
  const { unannotated, malformed } = findExpired(entries, '2026-08-13');
  assert.deepEqual(unannotated, [], 'would tell the author the wrong fix');
  assert.equal(malformed.length, 1);
});

// --- Block termination. Ending a block early fails open: the skipped entries
// go unpoliced while other blocks keep the total nonzero. ---

test('a list item with an inline comment is still an entry', () => {
  const { entries, problems } = parseBypassEntries(`
minimumReleaseAgeExclude:
  # bestax:permanent — dev-only formatter
  - prettier # deterministic output
`);
  assert.deepEqual(
    entries.map(e => e.name),
    ['prettier']
  );
  assert.deepEqual(problems, []);
});

test('an unparsable indented line is surfaced, and does not end the block', () => {
  const { entries, problems } = parseBypassEntries(`
minimumReleaseAgeExclude:
  # bestax:permanent — dev-only formatter
  ? weird: mapping key
  # bestax:review 2026-11-13 — still policed
  - after
`);
  assert.equal(problems.length, 1);
  assert.match(problems[0].why, /not recognisable as an entry/);
  // The entry below the bad line must still be seen.
  assert.deepEqual(
    entries.map(e => e.name),
    ['after']
  );
});

test('the committed pnpm-workspace.yaml satisfies its own contract', async () => {
  const { entries, problems } = parseBypassEntries(
    await readFile(join(REPO, 'pnpm-workspace.yaml'), 'utf8')
  );
  // A parser that silently matched nothing would pass every assertion below.
  assert.ok(entries.length >= 15, `parsed only ${entries.length} entries`);
  assert.deepEqual(problems, []);
  const { unannotated, malformed } = findExpired(entries, '2026-08-13');
  assert.deepEqual(
    unannotated.map(e => `${e.label}:${e.name}`),
    [],
    'every committed bypass must carry a bestax:review or bestax:permanent marker'
  );
  assert.deepEqual(
    malformed.map(e => `${e.label}:${e.name} — ${e.error}`),
    []
  );
});
