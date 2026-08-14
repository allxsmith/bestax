/**
 * Guards on the supply-chain bypass expiry parser (#391).
 *
 * Every failure mode here is silent and fails OPEN — the gate goes green while
 * a bypass goes unpoliced, which is the one outcome this check exists to
 * prevent. So the assertions below are mostly about what must NOT slip past:
 * an entry inheriting a neighbour's date, a date-shaped non-date that never
 * comes due, a second marker that is quietly ignored, and an unparsed line
 * that drops every entry beneath it. A diff review cannot tell any of those
 * apart from correct behaviour, which is why they are pinned here.
 *
 * `.mjs` and `node --test` rather than jest: these are root-level scripts with
 * no package of their own, matching how docs/scripts is covered.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  BYPASS_BLOCKS,
  parseBypassEntries,
  findExpired,
} from './lib/bypass-annotations.mjs';

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

test('an entry directly beneath an annotated one inherits nothing', () => {
  // The fail-open this contract exists to close: appending a bypass under an
  // annotated neighbour, with no comment of its own, must not borrow its date.
  const { entries } = parseBypassEntries(`
overrides:
  # bestax:review 2026-11-13 — annotated
  'thing@1': '>=1.2.3'
  'appended@2': '>=2.3.4'
`);
  assert.equal(entries.length, 2);
  assert.equal(byName(entries, 'thing@1').review, '2026-11-13');
  assert.equal(byName(entries, 'appended@2').review, null);
});

test('a comment after an entry annotates only the next entry', () => {
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

test('two markers of the same kind is an error, not first-wins', () => {
  // The likely mistake: adding a fresh date above a stale one instead of
  // replacing it. Only the first is read, so the due date vanishes silently.
  const { entries } = parseBypassEntries(`
overrides:
  # bestax:review 2026-12-01 — new date, stacked on top
  # bestax:review 2026-01-01 — stale, should have been replaced
  'thing@1': '>=1.2.3'
`);
  assert.match(entries[0].error, /2 `bestax:` markers/);
  assert.equal(entries[0].review, null);
  assert.deepEqual(findExpired(entries, '2026-08-13').expired, []);
  assert.equal(findExpired(entries, '2026-08-13').malformed.length, 1);
});

test('two permanent markers is likewise an error', () => {
  const { entries } = parseBypassEntries(`
overrides:
  # bestax:permanent — one reason
  # bestax:permanent — another reason
  'thing@1': '>=1.2.3'
`);
  assert.match(entries[0].error, /markers/);
  assert.equal(entries[0].permanent, false);
});

test('both markers at once is an error, not a silent permanent', () => {
  const { entries } = parseBypassEntries(`
overrides:
  # bestax:review 2026-01-01 — due long ago
  # bestax:permanent — incidental mention
  'thing@1': '>=1.2.3'
`);
  assert.match(entries[0].error, /2 `bestax:` markers/);
  // Permanent must not win the tie-break and bury the overdue date.
  assert.equal(entries[0].permanent, false);
  assert.deepEqual(findExpired(entries, '2026-08-13').expired, []);
});

test('a near-marker is not a marker', () => {
  // `\b` matched between "permanent" and a hyphen, so this read as a valid
  // permanent exemption and disabled expiry forever. A typo must fail CLOSED:
  // no annotation at all, which the unannotated rule then catches.
  for (const near of [
    '# bestax:permanent-ish — reason',
    '# bestax:permanently — reason',
    '# bestax:reviewed 2026-11-13 — reason',
    '# bestax:review-by 2026-11-13 — reason',
  ]) {
    const { entries } = parseBypassEntries(`
overrides:
  ${near}
  'thing@1': '>=1.2.3'
`);
    assert.equal(entries[0].permanent, false, near);
    assert.equal(entries[0].review, null, near);
    assert.equal(entries[0].error, null, near);
    assert.equal(
      findExpired(entries, '2026-08-13').unannotated.length,
      1,
      `${near} must be caught as unannotated`
    );
  }
});

test('a marker mentioned mid-prose does not annotate', () => {
  const { entries } = parseBypassEntries(`
overrides:
  # Force patched thing. See # bestax:permanent — in the contract above.
  'thing@1': '>=1.2.3'
`);
  assert.equal(entries[0].permanent, false);
  assert.equal(findExpired(entries, '2026-08-13').unannotated.length, 1);
});

test('a terse but real reason is accepted', () => {
  // The bar is "is there a reason", not "is it a good reason". Rejecting `CI`
  // put a linter argument in front of someone adding an urgent bypass.
  for (const reason of ['CI', 'n/a', 'see #391']) {
    const { entries } = parseBypassEntries(`
overrides:
  # bestax:review 2026-11-13 — ${reason}
  'thing@1': '>=1.2.3'
`);
    assert.equal(entries[0].error, null, reason);
    assert.equal(entries[0].review, '2026-11-13', reason);
  }
});

test('separators alone are still not a reason', () => {
  for (const empty of ['—', '-', ':', '— —', '']) {
    const { entries } = parseBypassEntries(`
overrides:
  # bestax:review 2026-11-13 ${empty}
  'thing@1': '>=1.2.3'
`);
    assert.match(entries[0].error ?? '', /no reason/, JSON.stringify(empty));
  }
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
  // And it must read ITS OWN marker. An unparsed line separates the comment
  // block from what follows, like a blank line does — otherwise the orphaned
  // marker leaks down and `after` is reported as carrying two markers, which
  // names a defect that isn't there and hides its real annotation.
  assert.equal(entries[0].error, null);
  assert.equal(entries[0].review, '2026-11-13');
});

test('every expected block is reported as seen', () => {
  const { blocksSeen } = parseBypassEntries(`
minimumReleaseAgeExclude:
  # bestax:permanent — a
  - prettier
overrides:
  # bestax:review 2026-11-13 — b
  'thing@1': '>=1.2.3'
auditConfig:
  ignoreGhsas:
    # bestax:review 2026-11-13 — c
    - GHSA-aaaa-bbbb-cccc
`);
  assert.deepEqual([...blocksSeen].sort(), [
    'ignoreGhsas',
    'minimumReleaseAgeExclude',
    'overrides',
  ]);
});

test('an unindented comment does not end the block', () => {
  // YAML comments carry no structure, so column 0 is a legal place for one
  // inside an indented block. Treating it as a dedent skipped every entry
  // below it — no entry, no problem, and blocksSeen still holding the block,
  // so the gate passed with that bypass entirely unpoliced.
  const { entries, problems } = parseBypassEntries(`
overrides:
# bestax:review 2026-11-13 — unindented but valid YAML
  'thing@1': '>=1.2.3'
  # bestax:review 2026-11-13 — normally indented
  'thing@2': '>=2.3.4'
`);
  assert.deepEqual(
    entries.map(e => e.name),
    ['thing@1', 'thing@2'],
    'entries below an unindented comment must still be seen'
  );
  assert.equal(entries[0].review, '2026-11-13', 'and read its annotation');
  assert.deepEqual(problems, []);
});

test('a real dedent still ends the block, even after comments', () => {
  const { entries } = parseBypassEntries(`
overrides:
  # bestax:review 2026-11-13 — sweep
  'thing@1': '>=1.2.3'

# a banner comment between sections
nodeLinker: isolated
publicHoistPattern:
  - '*eslint*'
`);
  assert.deepEqual(
    entries.map(e => e.name),
    ['thing@1'],
    'publicHoistPattern entries must not be mistaken for bypasses'
  );
});

test('an explicitly emptied block counts as seen, per collection type', () => {
  // Pruning the last entry must not require editing BYPASS_BLOCKS: removing a
  // block definition would unpolice that surface permanently, so an entry
  // added back later would never be checked at all.
  //
  // The literal differs by type: `overrides` is a MAPPING, so its empty form
  // is `{}`. Accepting only `[]` there would reject the correct YAML and the
  // diagnostic would be telling maintainers to write the wrong type.
  const { entries, blocksSeen } = parseBypassEntries(`
minimumReleaseAgeExclude: []
overrides: {}
auditConfig:
  ignoreGhsas: []
`);
  assert.deepEqual([...blocksSeen].sort(), [
    'ignoreGhsas',
    'minimumReleaseAgeExclude',
    'overrides',
  ]);
  assert.deepEqual(entries, [], 'empty blocks contribute no entries');
});

test('an emptied block does not swallow what follows it', () => {
  const { entries, blocksSeen } = parseBypassEntries(`
minimumReleaseAgeExclude: []
overrides:
  # bestax:review 2026-11-13 — sweep
  'thing@1': '>=1.2.3'
`);
  assert.ok(blocksSeen.has('minimumReleaseAgeExclude'));
  assert.deepEqual(
    entries.map(e => e.name),
    ['thing@1']
  );
});

test('every block declares an empty literal matching its own pattern', () => {
  // The diagnostic quotes emptyLiteral verbatim, so a mismatch would print
  // advice the parser itself rejects.
  for (const block of BYPASS_BLOCKS) {
    const line = block.emptyLiteral.startsWith('ignoreGhsas')
      ? `  ${block.emptyLiteral}`
      : block.emptyLiteral;
    assert.ok(
      block.empty.test(line),
      `${block.key}: emptyLiteral ${JSON.stringify(block.emptyLiteral)} does not match its own empty pattern`
    );
  }
});

test('an unsupported header shape leaves the block unseen, not silently empty', () => {
  // Header matching is deliberately narrow, so semantically equivalent YAML —
  // a quoted key, or a flow sequence — matches nothing. That is safe ONLY
  // because blocksSeen makes the absence loud; on its own the other blocks
  // would keep entries.length nonzero and the gate would pass.
  for (const shape of [
    `auditConfig:\n  'ignoreGhsas':\n    - GHSA-aaaa-bbbb-cccc`,
    `auditConfig:\n  ignoreGhsas: [GHSA-aaaa-bbbb-cccc]`,
  ]) {
    const { entries, blocksSeen } = parseBypassEntries(`
overrides:
  # bestax:review 2026-11-13 — keeps the total nonzero
  'thing@1': '>=1.2.3'
${shape}
`);
    assert.ok(entries.length > 0, 'other blocks still parse');
    assert.ok(
      !blocksSeen.has('ignoreGhsas'),
      `unsupported shape must not read as found: ${shape}`
    );
  }
});

test('a renamed block is absent from blocksSeen, not merely empty', () => {
  // The fail-open the per-block guard closes: the other blocks keep the total
  // entry count nonzero, so only the missing KEY reveals the silent list.
  const { entries, blocksSeen } = parseBypassEntries(`
minimumReleaseAgeExcludeRenamed:
  - prettier
overrides:
  # bestax:review 2026-11-13 — b
  'thing@1': '>=1.2.3'
`);
  assert.ok(entries.length > 0, 'total stays nonzero and hides the gap');
  assert.ok(!blocksSeen.has('minimumReleaseAgeExclude'));
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
