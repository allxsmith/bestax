#!/usr/bin/env node
/**
 * Pick the triage comment to refresh, if any (#457, rule 9).
 *
 * ai-triage.yml's publish step upserts one marker-tagged comment per triage
 * command. Choosing WHICH comment to PATCH is the part worth testing, so it
 * lives here instead of in the workflow's jq, and it reuses the helper the
 * auto-close cron already trusts rather than reimplementing the author test.
 *
 * The rule (.github/CLAUDE.md rule 6): match on marker + automation-author
 * class, never `--edit-last` and never one specific login. bestaxbot is a
 * machine USER account, pre-#361 triage comments are `github-actions[bot]` or
 * `claude[bot]`, and the identity has already changed twice — so the author
 * test is imported from auto-close-duplicates.mjs (`isAutomationAuthor`),
 * which covers Bot-type, a `[bot]` login suffix, AND named machine users. The
 * jq this replaced tested only `login == "bestaxbot" or type == "Bot"`, which
 * silently missed the `[bot]`-suffix case; sharing the helper means the two
 * consumers of these markers cannot drift apart again.
 *
 * The LAST match wins, which is why this reads a whole list rather than
 * trusting the caller: `gh api --paginate` applies `--jq` per page, so a
 * per-page `last` returns the last match ON THE FINAL PAGE, and a naive
 * `tail -n 1` over per-page output is only accidentally right. Pages arrive
 * as one compact JSON array per line, so the input is parsed with
 * parse-scan-verdict.mjs's `parseExecutionRecords`, which already flattens
 * exactly one level of array and accepts either a single document or a
 * newline-delimited stream.
 *
 * Note the deliberate difference from auto-close-duplicates.mjs's
 * `findMarkerComment`: that one additionally requires a parseable
 * `Duplicate of #N`, because it is looking for a close candidate. This one
 * must match ANY comment carrying the marker — a "No duplicates found."
 * comment has no such line and must still be refreshed in place rather than
 * duplicated.
 *
 * CLI contract:
 *   node scripts/pick-triage-upsert.mjs --comments-file=<path> --marker=<text>
 * - exit 0 and print the comment id when there is one to refresh.
 * - exit 0 and print NOTHING when there is none — the caller then POSTs.
 *   Printing nothing is the safe direction: a new comment is recoverable
 *   noise, whereas PATCHing the wrong id destroys someone else's comment.
 * - exit 1 on unreadable/unparsable input, so the publish step fails rather
 *   than silently posting a duplicate on every run.
 * - exit 2 on usage error.
 */
import { readFileSync } from 'node:fs';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { isAutomationAuthor } from './auto-close-duplicates.mjs';
import { parseExecutionRecords } from './parse-scan-verdict.mjs';

/**
 * The id of the last automation-authored comment whose body contains the
 * marker, or null. `comments` must be in ascending created order (the REST
 * API default for issue comments).
 */
export function pickUpsertTarget(comments, marker) {
  if (!Array.isArray(comments)) return null;
  if (typeof marker !== 'string' || marker.length === 0) return null;
  for (let i = comments.length - 1; i >= 0; i--) {
    const c = comments[i];
    if (c === null || typeof c !== 'object') continue;
    if (!isAutomationAuthor(c.user)) continue;
    if (typeof c.body !== 'string' || !c.body.includes(marker)) continue;
    if (!Number.isSafeInteger(c.id) || c.id <= 0) continue;
    return c.id;
  }
  return null;
}

/** Parse the two required flags. Returns null on any usage error. */
export function parseArgs(argv) {
  const raw = {};
  for (const arg of argv) {
    const match = /^--([a-z-]+)=([\s\S]*)$/.exec(arg);
    if (match === null) return null;
    if (Object.keys(raw).includes(match[1])) return null;
    raw[match[1]] = match[2];
  }
  if (Object.keys(raw).sort().join(',') !== 'comments-file,marker') return null;
  if (raw['comments-file'].length === 0 || raw.marker.length === 0) return null;
  return { commentsFile: raw['comments-file'], marker: raw.marker };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args === null) {
    process.stderr.write(
      'usage: pick-triage-upsert.mjs --comments-file=<path> --marker=<text>\n'
    );
    process.exit(2);
  }

  let comments;
  try {
    comments = parseExecutionRecords(readFileSync(args.commentsFile, 'utf8'));
  } catch {
    // Fixed message: the input is a comments dump full of untrusted text.
    process.stderr.write('pick-triage-upsert: comments file is unreadable\n');
    process.exit(1);
  }
  if (comments === null) {
    process.stderr.write(
      'pick-triage-upsert: comments file is not valid JSON\n'
    );
    process.exit(1);
  }

  const id = pickUpsertTarget(comments, args.marker);
  if (id !== null) process.stdout.write(`${id}\n`);
}

// Run only when executed directly (keeps the pure helpers importable).
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
