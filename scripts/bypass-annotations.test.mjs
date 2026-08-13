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
  const entries = parseBypassEntries(`
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
  const entries = parseBypassEntries(`
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
  const entries = parseBypassEntries(`
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
  const entries = parseBypassEntries(`
overrides:
  # bestax:review 2026-11-13 — section prose, not this entry's annotation

  'bare@1': '>=1.2.3'
`);
  assert.equal(entries[0].review, null);
});

test('covers all three bypass lists, including the nested one', () => {
  const entries = parseBypassEntries(`
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
  const entries = parseBypassEntries(`
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

test('the committed pnpm-workspace.yaml satisfies its own contract', async () => {
  const entries = parseBypassEntries(
    await readFile(join(REPO, 'pnpm-workspace.yaml'), 'utf8')
  );
  // A parser that silently matched nothing would pass every assertion below.
  assert.ok(entries.length >= 15, `parsed only ${entries.length} entries`);
  const { unannotated } = findExpired(entries, '2026-08-13');
  assert.deepEqual(
    unannotated.map(e => `${e.label}:${e.name}`),
    [],
    'every committed bypass must carry a bestax:review or bestax:permanent marker'
  );
});
