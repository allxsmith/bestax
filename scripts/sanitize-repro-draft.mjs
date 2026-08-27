#!/usr/bin/env node
/**
 * Deterministic publish sanitizer for AI-drafted repro tests (#454, rule 9).
 *
 * claude-repro.yml's publish job pipes the attacker-influenced draft through
 * this before it enters a public github-actions[bot] comment (invariant I2).
 * Stdin is opaque bytes, stdout is the neutralized draft truncated to
 * MAX_BYTES; the YAML wrapper runs it under `set -euo pipefail` with no
 * fallback, so if this script is missing or crashes, the step fails and
 * nothing unsanitized ever posts — the correct failure direction for a
 * sanitizer (the parser sibling, parse-scan-verdict.mjs, deliberately has the
 * opposite shape).
 *
 * What each rule defangs, and why:
 * 1. `@claude` / `@coderabbitai` / `@bestaxbot` → entity-encoded, so no
 *    comment can carry a live mention. Belt-and-braces: a GITHUB_TOKEN
 *    comment cannot re-trigger workflows anyway.
 * 2. `<!--` / `-->` broken, so a forged machine marker (`<!-- ai-triage:dedupe
 *    -->`, `<!-- ai-repro:draft -->`) never survives into a comment other
 *    automation attributes to github-actions[bot].
 * 3. `Duplicate of #` broken, because scripts/auto-close-duplicates.mjs
 *    trusts that line from automation authors — github-actions[bot] included.
 *    The test sibling imports that consumer's MARKER/DUPLICATE_RE and asserts
 *    sanitized output can never satisfy them; the two files must stay in step.
 * 4. `TRIAGE-RESULT:`/`SECURITY-SCAN:`/`REPRO-RESULT:`/`REPRO-DRAFT:` at line
 *    start get a space before the colon, so the *-RESULT/SECURITY-SCAN
 *    watchdog parsers cannot read a smuggled sentinel.
 * 5. Runs of 3+ backticks or tildes at line start collapse to three `&#96;`
 *    entities. The draft is wrapped in a ```tsx block by the caller, so a
 *    fence inside it would close that block early and render the rest as
 *    markdown. Cosmetic rather than a privilege issue — the markers above are
 *    already defanged — but a broken-out draft is exactly the thing a
 *    reviewer skims past.
 *
 * Byte parity with the sed|head pipeline this replaced: stdin is decoded as
 * latin1 (bytes ≡ chars, lossless round-trip) so invalid UTF-8 passes through
 * byte-identically and truncation at MAX_BYTES is exactly `head -c` —
 * applied AFTER entity expansion, as before. Every pattern is pure ASCII and
 * UTF-8 continuation bytes are all ≥ 0x80, so no rule can false-match inside
 * a multibyte character. Two accepted divergences, both in the
 * more-sanitized direction — do not "fix" either back toward the sed
 * behavior, which would be a fail-open change:
 * - JS `^` under /m also matches after a bare `\r`, where sed only splits on
 *   `\n` — a CR-delimited line can be defanged here that sed left alone.
 * - `--!>` (HTML's "incorrectly closed comment", which parsers still honor
 *   as a comment end) is broken alongside `-->`; the sed only broke the
 *   latter. Flagged by CodeQL js/bad-tag-filter on the extraction PR.
 */
import { readFileSync } from 'node:fs';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export const MAX_BYTES = 12000;

// Order matters: these run as a pipeline, same sequence as the sed they
// replaced. Case-insensitivity (i) mirrors GNU sed's `I` flag per rule.
const RULES = [
  [/@(claude|coderabbitai|bestaxbot)/gi, '&#64;$1'],
  [/<!--/g, '&lt;!--'],
  [/(--!?)>/g, '$1&gt;'],
  [/(Duplicate of) #/gi, '$1 &#35;'],
  [/^(TRIAGE-RESULT|SECURITY-SCAN|REPRO-RESULT|REPRO-DRAFT):/gm, '$1 :'],
  [/^([ \t]*)(`{3,}|~{3,})/gm, '$1&#96;&#96;&#96;'],
];

/**
 * Apply the five defang rules to latin1-decoded text (no truncation). Pure;
 * exported for the per-rule tests.
 */
export function sanitizeText(text) {
  let out = text;
  for (const [pattern, replacement] of RULES) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

/**
 * Full pipeline over raw bytes: decode latin1 → defang → truncate to
 * MAX_BYTES. Returns a Buffer so truncation is byte-exact even when it lands
 * mid-way through a multibyte character (identical to `head -c`).
 */
export function sanitizeDraft(buf) {
  const out = sanitizeText(buf.toString('latin1'));
  return Buffer.from(out, 'latin1').subarray(0, MAX_BYTES);
}

// Run only when executed directly (keeps the pure helpers importable).
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.stdout.write(sanitizeDraft(readFileSync(0)));
}
