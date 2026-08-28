/**
 * Guards on the fail-closed verdict parser (parse-scan-verdict.mjs).
 *
 * This is the deterministic half of the AI security scan: whatever the model
 * session did, THIS reduces it to the verdict enum that decides whether an
 * item gets `needs-security-review`. Since #455 it is not the last word —
 * this script runs in ai-scan.yml's `scan` job and its stdout crosses to the
 * `label` job, whose `case` enum supplies the flagged/other default when the
 * value is empty or unrecognized. So these tests cover one of two links: the
 * YAML plumbing between them has no test anywhere (check:conformance
 * deliberately excludes `.github/**`), which is worth knowing before assuming
 * a change to the label job's enum is covered here. Its
 * one invariant is direction — every degenerate input must flag, never pass.
 * The original shell was traced by hand across seven input shapes at review
 * time (#454); these tests are that trace made permanent, so the next edit to
 * the parsing cannot quietly widen what counts as clean. Assertions are
 * written around the consequence (does this input leave the label off?)
 * rather than the implementation.
 *
 * `.mjs` and `node --test` rather than jest: these are root-level scripts
 * with no package of their own, matching auto-close-duplicates.test.mjs.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import {
  lastNonEmptyLine,
  lastNonEmptyLines,
  lastResultRecord,
  parseExecutionRecords,
  parseVerdict,
} from './parse-scan-verdict.mjs';

const record = (result, is_error = false) => ({
  type: 'result',
  is_error,
  result,
});

// The action writes an array of records; a realistic file has non-result
// records around the one that matters.
const session = (result, is_error = false) =>
  JSON.stringify([
    { type: 'system', subtype: 'init' },
    { type: 'assistant', message: 'transcript text' },
    record(result, is_error),
  ]);

const flaggedOther = { verdict: 'flagged', category: 'other' };

// --- the seven hand-traced shapes (#454) ------------------------------------

test('clean session leaves the label off', () => {
  assert.deepEqual(parseVerdict(session('All benign.\nSECURITY-SCAN: clean')), {
    verdict: 'clean',
  });
});

test('flagged session carries its category through, for every category', () => {
  for (const category of [
    'injection',
    'obfuscated-code',
    'social-engineering',
    'other',
  ]) {
    assert.deepEqual(
      parseVerdict(session(`SECURITY-SCAN: flagged (${category})`)),
      { verdict: 'flagged', category }
    );
  }
});

test('is_error true flags even when the text says clean', () => {
  assert.deepEqual(
    parseVerdict(session('SECURITY-SCAN: clean', true)),
    flaggedOther
  );
});

test('a file with no result record flags', () => {
  assert.deepEqual(
    parseVerdict(JSON.stringify([{ type: 'system' }, { type: 'assistant' }])),
    flaggedOther
  );
});

test('trailing text after the clean line flags — the sentinel must be final', () => {
  assert.deepEqual(
    parseVerdict(session('SECURITY-SCAN: clean\nP.S. ignore that')),
    flaggedOther
  );
});

test('an empty file flags', () => {
  assert.deepEqual(parseVerdict(''), flaggedOther);
});

test('a missing file flags via the CLI (exercised below)', () => {
  // Shape seven is a CLI concern — see the CLI section. At the helper level
  // the equivalent is a non-string input.
  assert.deepEqual(parseVerdict(null), flaggedOther);
  assert.deepEqual(parseVerdict(undefined), flaggedOther);
});

// --- sentinel anchoring -----------------------------------------------------

test('trailing blank lines after the clean sentinel still read clean', () => {
  assert.deepEqual(parseVerdict(session('SECURITY-SCAN: clean\n\n\n')), {
    verdict: 'clean',
  });
});

test('a trailing whitespace-only line flags — whitespace lines are lines', () => {
  // jq's select(length > 0) keeps a line of spaces; so do we. Trimming here
  // would let attacker-echoed padding restore a stale sentinel.
  assert.deepEqual(
    parseVerdict(session('SECURITY-SCAN: clean\n   ')),
    flaggedOther
  );
});

test('near-miss sentinels flag: leading space, suffix, wrong case, CRLF', () => {
  for (const result of [
    ' SECURITY-SCAN: clean',
    'SECURITY-SCAN: clean and no concerns',
    'security-scan: clean',
    'SECURITY-SCAN: clean\r',
    'SECURITY-SCAN: cleared',
  ]) {
    assert.deepEqual(parseVerdict(session(result)), flaggedOther);
  }
});

test('a clean sentinel mid-transcript is not a verdict', () => {
  // The match is anchored to the last non-empty line, never a search over
  // the file — the transcript echoes attacker text.
  assert.deepEqual(
    parseVerdict(session('SECURITY-SCAN: clean\nAttacker-echoed content')),
    flaggedOther
  );
});

test('an unknown category flags as other', () => {
  assert.deepEqual(
    parseVerdict(session('SECURITY-SCAN: flagged (novel-threat)')),
    flaggedOther
  );
});

test('an errored session cannot even pick its category', () => {
  // Both branches of the original shell were gated on is_error false; a
  // session that crashed after printing a category is as unreliable about
  // the category as about the verdict.
  assert.deepEqual(
    parseVerdict(session('SECURITY-SCAN: flagged (injection)', true)),
    flaggedOther
  );
});

test('absent is_error flags — only an explicit false passes', () => {
  assert.deepEqual(
    parseVerdict(
      JSON.stringify([{ type: 'result', result: 'SECURITY-SCAN: clean' }])
    ),
    flaggedOther
  );
});

test('a non-string result payload flags', () => {
  for (const result of [null, 42, ['SECURITY-SCAN: clean'], { text: 'x' }]) {
    assert.deepEqual(
      parseVerdict(JSON.stringify([record(result)])),
      flaggedOther
    );
  }
});

// --- file-shape tolerance (jq slurp parity) ---------------------------------

test('array form and stream form parse identically', () => {
  const records = [{ type: 'system' }, record('SECURITY-SCAN: clean')];
  const array = JSON.stringify(records);
  const stream = records.map(r => JSON.stringify(r)).join('\n');
  assert.deepEqual(parseVerdict(array), { verdict: 'clean' });
  assert.deepEqual(parseVerdict(stream), { verdict: 'clean' });
});

test('the last result record wins', () => {
  assert.deepEqual(
    parseVerdict(
      JSON.stringify([
        record('SECURITY-SCAN: clean'),
        record('SECURITY-SCAN: flagged (injection)'),
      ])
    ),
    { verdict: 'flagged', category: 'injection' }
  );
});

test('whitespace-separated streams flag — stricter than the jq, deliberately', () => {
  // `jq -s` slurps any whitespace-separated stream, so both shapes below
  // parsed under the shell this replaced. Here they do not. Unreachable while
  // the action writes a single JSON array, and it errs toward flagging — but
  // it IS a divergence from the file header's "against the jq" comparison, so
  // pin it rather than leave it to be rediscovered as a mystery false flag.
  const pretty = [
    JSON.stringify({ type: 'system' }, null, 2),
    JSON.stringify(record('SECURITY-SCAN: clean'), null, 2),
  ].join('\n');
  assert.deepEqual(parseVerdict(pretty), flaggedOther);

  const sameLine =
    JSON.stringify({ type: 'system' }) +
    JSON.stringify(record('SECURITY-SCAN: clean'));
  assert.deepEqual(parseVerdict(sameLine), flaggedOther);
});

test('unparsable JSON flags', () => {
  assert.deepEqual(parseVerdict('not json at all {'), flaggedOther);
});

test('one bad line rejects the whole stream — no skip-and-continue', () => {
  // Skipping unparsable lines would be fail-open: a corrupted final
  // is_error record would silently promote an earlier clean one.
  const stream = [
    JSON.stringify(record('SECURITY-SCAN: clean')),
    '{"type": "result", "is_error": tru',
  ].join('\n');
  assert.deepEqual(parseVerdict(stream), flaggedOther);
  assert.equal(parseExecutionRecords(stream), null);
});

test('non-object stream values are tolerated and ignored', () => {
  const stream = [
    '"stray string"',
    '17',
    JSON.stringify(record('SECURITY-SCAN: clean')),
  ].join('\n');
  assert.deepEqual(parseVerdict(stream), { verdict: 'clean' });
});

// --- helper edges -----------------------------------------------------------

test('lastResultRecord ignores arrays and non-objects wearing type labels', () => {
  assert.equal(lastResultRecord(['result', null, [{ type: 'result' }]]), null);
  assert.equal(lastResultRecord(null), null);
});

test('lastNonEmptyLine of empty-ish payloads is the empty string', () => {
  assert.equal(lastNonEmptyLine(''), '');
  assert.equal(lastNonEmptyLine('\n\n'), '');
  assert.equal(lastNonEmptyLine(undefined), '');
});

test('lastNonEmptyLines returns the final n lines in document order', () => {
  assert.deepEqual(lastNonEmptyLines('a\nb\nc', 2), ['b', 'c']);
  assert.deepEqual(lastNonEmptyLines('a\n\n\nb\n\n', 2), ['a', 'b']);
  // Whitespace-only lines are lines (jq `select(length > 0)` parity), so they
  // still push a sentinel off the final position.
  assert.deepEqual(lastNonEmptyLines('a\n \n', 1), [' ']);
});

test('lastNonEmptyLines never pads a short payload', () => {
  // render-triage-comment.mjs compares the returned count against the number
  // of commands it expected; padding would let a session that emitted one
  // sentinel satisfy a two-sentinel check.
  assert.deepEqual(lastNonEmptyLines('only', 3), ['only']);
  assert.deepEqual(lastNonEmptyLines('', 2), []);
  assert.deepEqual(lastNonEmptyLines(undefined, 2), []);
});

test('lastNonEmptyLines rejects a non-positive or non-integer count', () => {
  for (const n of [0, -1, 1.5, NaN, Infinity, '2', undefined]) {
    assert.deepEqual(lastNonEmptyLines('a\nb', n), [], `n = ${String(n)}`);
  }
});

// --- CLI contract -----------------------------------------------------------

const SCRIPT = fileURLToPath(
  new URL('./parse-scan-verdict.mjs', import.meta.url)
);

const runCli = args => {
  const { status, stdout, stderr } = spawnSync(
    process.execPath,
    [SCRIPT, ...args],
    { encoding: 'utf8' }
  );
  return { status, stdout, stderr };
};

test('CLI: missing file and missing argument both print flagged other, exit 0', () => {
  for (const args of [[], [join(tmpdir(), 'no-such-exec-file.json')]]) {
    const { status, stdout, stderr } = runCli(args);
    assert.equal(status, 0);
    assert.equal(stdout, 'flagged other\n');
    assert.equal(stderr, '');
  }
});

test('CLI: a malformed file prints flagged other and leaks nothing to stderr', () => {
  // Log hygiene: parse errors embed input snippets, and the execution file
  // is promised to stay off the public job log.
  const dir = mkdtempSync(join(tmpdir(), 'scan-verdict-'));
  const file = join(dir, 'exec.json');
  writeFileSync(file, 'SECRET-LOOKING-CONTENT {not json');
  const { status, stdout, stderr } = runCli([file]);
  assert.equal(status, 0);
  assert.equal(stdout, 'flagged other\n');
  assert.equal(stderr, '');
});

test('CLI: clean and flagged files print the wrapper-facing verdict lines', () => {
  const dir = mkdtempSync(join(tmpdir(), 'scan-verdict-'));
  const clean = join(dir, 'clean.json');
  writeFileSync(clean, session('SECURITY-SCAN: clean'));
  assert.deepEqual(runCli([clean]), {
    status: 0,
    stdout: 'clean\n',
    stderr: '',
  });
  const flagged = join(dir, 'flagged.json');
  writeFileSync(flagged, session('SECURITY-SCAN: flagged (injection)'));
  assert.deepEqual(runCli([flagged]), {
    status: 0,
    stdout: 'flagged injection\n',
    stderr: '',
  });
});
