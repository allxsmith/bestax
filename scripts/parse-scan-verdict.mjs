#!/usr/bin/env node
/**
 * Fail-closed verdict parser for the AI security scan (#454, rule 9).
 *
 * ai-scan.yml's labeler step calls this over the Claude action's
 * execution_file and applies `needs-security-review` on anything that is not
 * positively clean. The default verdict is FLAGGED: only a session whose last
 * result record has `is_error: false` AND whose final non-empty output line is
 * exactly `SECURITY-SCAN: clean` leaves the label off. A crashed, empty,
 * truncated, unparsable or inconclusive session flags rather than passes —
 * that is the point of the step, so every degenerate input below maps to
 * flagged, and the test sibling asserts each one.
 *
 * The match is anchored to the last non-empty line, never a loose search over
 * the file: the execution file contains echoed attacker text, and a
 * `SECURITY-SCAN: clean` reproduced mid-transcript must not read as a verdict.
 * Whitespace-only lines count as lines here (jq `select(length > 0)` parity),
 * so a trailing line of spaces after a clean sentinel still flags.
 *
 * Direction of the failure modes, because the split is deliberate
 * (.github/CLAUDE.md rule 4): the VERDICT fails closed (this file), while the
 * scan GATE fails open (a budget error skips the scan entirely) — an unscanned
 * item is indistinguishable from a clean one downstream.
 *
 * CLI contract (the YAML wrapper depends on every clause):
 *   node scripts/parse-scan-verdict.mjs <execution-file>
 * - Always exits 0. The verdict is the single stdout line — exactly `clean`
 *   or `flagged <injection|obfuscated-code|social-engineering|other>` — and a
 *   print contract fails closed where an exit-code contract would not: Node's
 *   default exit status is 0, so a forgotten code path under an exit-code
 *   contract would read as clean, while here it prints nothing that matches
 *   and the wrapper keeps its flagged/other default.
 * - Log hygiene: no input-derived text is ever written to stdout or stderr.
 *   JSON parse errors embed input snippets, and the workflow header promises
 *   the execution file stays off the public job log (evasion-oracle risk), so
 *   every internal error is swallowed into `flagged other` rather than
 *   reported. Infra failures that prevent this script from running at all
 *   (missing checkout, missing node) surface in the wrapper instead, which
 *   also defaults to flagged/other.
 *
 * Parsing against the jq it replaced (`jq -es '[.[] | if type == "array"
 * then .[] else . end] | ...'`): the file may be one JSON array or a stream of
 * newline-delimited values; top-level arrays are flattened exactly one level;
 * only plain objects with `type == "result"` count and the LAST one wins;
 * `is_error` must be strictly false (absent flags); a non-string `result`
 * reads as empty. The stream fallback is all-or-nothing — one unparsable
 * non-empty line rejects the whole file. Never "improve" that to skip bad
 * lines: a skipped final `is_error: true` record would promote an earlier
 * clean one, which is a fail-open parse.
 *
 * That is parity-or-STRICTER, not parity — do not restate it as parity. `jq
 * -s` slurps any whitespace-separated stream, so a pretty-printed multi-line
 * value, or two values on one line, both parsed under the shell and both
 * return `flagged other` here (the single-document parse fails, then the
 * line-oriented fallback rejects each fragment). Unreachable while the action
 * writes one JSON array, and it errs toward flagging, so it is a false-flag
 * risk rather than a security one — but if the output format ever drifts to a
 * pretty-printed stream, this is the line that turns every scan into a flag.
 * The test sibling pins both shapes so the divergence stays visible.
 *
 * Exported helpers are pure so the fail-closed matrix is unit-testable; main
 * only runs when the file is executed directly.
 */
import { readFileSync } from 'node:fs';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export const CLEAN_RE = /^SECURITY-SCAN: clean$/;
export const FLAGGED_RE =
  /^SECURITY-SCAN: flagged \((injection|obfuscated-code|social-engineering|other)\)$/;

const isPlainObject = v =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Parse the execution file's text into its top-level JSON values, flattening
 * arrays one level (jq slurp parity). Returns null — never a partial list —
 * when anything fails to parse.
 */
export function parseExecutionRecords(text) {
  if (typeof text !== 'string') return null;
  let values;
  try {
    values = [JSON.parse(text)];
  } catch {
    // Not a single JSON document — try newline-delimited values. One bad
    // non-empty line rejects the file (see header: skipping would fail open).
    values = [];
    for (const line of text.split('\n')) {
      if (line.trim() === '') continue;
      try {
        values.push(JSON.parse(line));
      } catch {
        return null;
      }
    }
  }
  return values.flatMap(v => (Array.isArray(v) ? v : [v]));
}

/** The last plain-object record with type === "result", or null. */
export function lastResultRecord(records) {
  if (!Array.isArray(records)) return null;
  const results = records.filter(r => isPlainObject(r) && r.type === 'result');
  return results.length > 0 ? results[results.length - 1] : null;
}

/**
 * The last `n` non-empty lines of a result payload, in document order.
 * Filters on length, NOT trim: a whitespace-only line is a line (jq
 * `select(length > 0)` parity), so trailing spaces after a sentinel still push
 * it off the final position.
 *
 * Returns FEWER than `n` lines when the payload has fewer — never padded.
 * render-triage-comment.mjs depends on that: it compares the returned count
 * against the number of commands it expected, so padding would let a session
 * that emitted one sentinel satisfy a two-sentinel check. Non-positive or
 * non-integer `n` yields [].
 */
export function lastNonEmptyLines(result, n) {
  if (!Number.isSafeInteger(n) || n <= 0) return [];
  const text = typeof result === 'string' ? result : '';
  const lines = text.split('\n').filter(line => line.length > 0);
  return lines.slice(-n);
}

/**
 * Last non-empty line of a result payload, or '' when there is none. Thin
 * wrapper so the jq-parity line semantics live in exactly one place, shared
 * with the ai-triage watchdog's multi-sentinel reader.
 */
export function lastNonEmptyLine(result) {
  return lastNonEmptyLines(result, 1)[0] ?? '';
}

/**
 * The whole verdict, fail-closed: { verdict: 'clean' } or
 * { verdict: 'flagged', category }. Category is only trusted from a session
 * that ended with is_error false — an errored session's category line is as
 * unreliable as its verdict, so it reads as `other` (matching the shell,
 * where both branches were gated on OK).
 */
export function parseVerdict(text) {
  const flagged = { verdict: 'flagged', category: 'other' };
  const records = parseExecutionRecords(text);
  const record = lastResultRecord(records);
  if (record === null || record.is_error !== false) return flagged;
  const line = lastNonEmptyLine(record.result);
  if (CLEAN_RE.test(line)) return { verdict: 'clean' };
  const match = FLAGGED_RE.exec(line);
  if (match) return { verdict: 'flagged', category: match[1] };
  return flagged;
}

function main() {
  let out = 'flagged other';
  try {
    const path = process.argv[2];
    if (path) {
      const { verdict, category } = parseVerdict(readFileSync(path, 'utf8'));
      out = verdict === 'clean' ? 'clean' : `flagged ${category}`;
    }
  } catch {
    // Swallowed on purpose — missing/unreadable file is one of the mandated
    // fail-closed shapes, and error text may embed file content (log
    // hygiene, see header). `out` keeps its flagged default.
  }
  process.stdout.write(`${out}\n`);
}

// Run only when executed directly (keeps the pure helpers importable).
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
