#!/usr/bin/env node
/**
 * Deterministic renderer for AI triage comments (#457, rule 9).
 *
 * ai-triage.yml used to let the triage session post its own comments: it held
 * bestaxbot's PAT and `Bash(gh issue comment:*)` / `Bash(gh pr comment:*)`, so
 * model free text — written by a session that reads untrusted issue and PR
 * text — went straight into a comment authored by a re-trigger-capable
 * identity. That is what invariant I2 forbids, and #457 is the fix: the
 * session now REPORTS `TRIAGE-PAYLOAD:` lines, this script validates them
 * fail-closed and renders the comment bodies from a trusted skeleton, and a
 * separate workflow step posts them. The two comment commands left the
 * allowlist (rule 2 — narrowing, the preferred direction) and the PAT left the
 * model session's environment entirely.
 *
 * FAILS CLOSED, unlike its parser sibling. parse-scan-verdict.mjs always exits
 * 0 and prints a verdict because its wrapper has a flagged default to fall to.
 * This one has no safe default — a comment is either correct or not posted —
 * so any defect (unreadable file, is_error, bad anchoring, wrong payload count,
 * any schema violation) exits non-zero with EMPTY stdout, and the wrapper runs
 * under `set -euo pipefail` with no fallback plus an exit-0-empty-stdout guard
 * (the claude-repro.yml publish precedent). Nothing posts when anything is off.
 *
 * ANCHORING. The payload lines must be the LAST non-empty lines of the last
 * result record, one per expected command, AND no other line in that message
 * may start with the sentinel. The execution file echoes attacker-controlled
 * text, so a loose search is forbidden: an issue body quoting a well-formed
 * payload line would otherwise be read as the session's own report. The exact
 * count also means a session that finishes the first PR command and bails
 * during the second cannot pass on one payload. Whitespace-only lines count as
 * lines (jq `select(length > 0)` parity with the check this replaced), so
 * trailing spaces after the payloads still fail. Leading narration is
 * tolerated — run 29794090279 false-failed an otherwise-correct skip because
 * the session prefixed one explanatory line.
 *
 * THE SANITIZER RUNS ON FIELDS, NEVER ON THE ASSEMBLED BODY. This is the
 * deliberate inversion from sanitize-repro-draft.mjs, where the whole draft is
 * untrusted and gets one pass. Here the skeleton is trusted and only `title` /
 * `reason` are not, so sanitizeField is applied to those two strings BEFORE
 * they are interpolated. A well-meant "simplify: sanitize the finished body
 * once" refactor would defang the skeleton's own `<!-- ai-triage:dedupe -->`
 * marker and its `Duplicate of #N` line — both of which
 * scripts/auto-close-duplicates.mjs consumes — and silently break auto-close.
 * The test sibling pins that coupling against that file's own MARKER and
 * DUPLICATE_RE, and asserts a hostile title cannot forge either.
 *
 * Why sanitizeField is written here rather than imported from
 * sanitize-repro-draft.mjs: two of that file's rules are the wrong shape for
 * this job. Its mention rule defangs only the three re-trigger handles, but
 * these comments are authored by bestaxbot, so ANY `@user` pings a human —
 * every `@` is encoded here. Its fence rule is line-start anchored, which
 * never fires on a single-line field embedded mid-line. Importing and
 * post-tightening would couple this path to a file whose header pins byte
 * parity with a different job's sed; the duplication is six short regexes.
 *
 * CLI contract (the YAML wrapper depends on every clause):
 *   node scripts/render-triage-comments.mjs \
 *     --exec-file=<path> --mode=issue|pr --trigger=opened|labeled \
 *     --autoclose=active|off --self=<N>
 * - exit 0: one line of compact JSON on stdout — the envelope the publish step
 *   iterates. This covers "post", a legitimate model skip, and a silent
 *   no-findings alike; the per-comment `disposition` says which.
 * - exit 1: fail closed, stdout empty (never a partial envelope).
 * - exit 2: usage error (matches auto-close-duplicates.mjs).
 * - stderr carries fixed diagnostics and a payload index only, never
 *   payload-derived text: attacker strings must not reach a log position that
 *   interprets `::error::`.
 *
 * The empty-result policy lives in buildEnvelope, not in the prompt. dedupe
 * posts "No duplicates found." on any trigger; the two PR commands stay silent
 * on `opened` and post their one-liner on `labeled` (an explicit human request
 * — silence would read as a malfunction). Making that structural is the point:
 * the model can no longer forget the labeled-rerun rule.
 *
 * Still silent on a bailed session, by design (#317/#338/#340): a session that
 * dies mid-task emits no payload lines, so the count check fails and the job
 * fails loudly rather than passing with no comment.
 */
import { readFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import {
  parseExecutionRecords,
  lastResultRecord,
} from './parse-scan-verdict.mjs';

export const PAYLOAD_PREFIX = 'TRIAGE-PAYLOAD:';
export const PAYLOAD_RE = /^TRIAGE-PAYLOAD: (\{.*\})$/;

export const MAX_PAYLOAD_LINE_BYTES = 10000;
export const MAX_TITLE_BYTES = 200;
export const MAX_REASON_BYTES = 300;
export const MAX_SKIP_REASON_BYTES = 300;
export const MAX_ITEM_NUMBER = 10_000_000;

/** Commands the session runs per item type, in the order it reports them. */
export const COMMANDS_FOR_MODE = {
  issue: ['triage-dedupe'],
  pr: ['triage-find-issues', 'triage-find-duplicate-prs'],
};

/**
 * Marker per command — the publish step scopes its upsert by these, and
 * auto-close-duplicates.mjs reads the dedupe one. Never probe by author login
 * alone (.github/CLAUDE.md rule 6).
 */
export const MARKERS = {
  'triage-dedupe': '<!-- ai-triage:dedupe -->',
  'triage-find-issues': '<!-- ai-triage:find-issues -->',
  'triage-find-duplicate-prs': '<!-- ai-triage:find-duplicate-prs -->',
};

export const AUTOCLOSE_SENTENCE =
  'This issue may be auto-closed in 14 days unless someone objects (comment or 👎).';

/** Per-command caps on how many entries a comment may list. */
const MAX_ENTRIES = {
  duplicates: 3,
  related: 3,
  issues: 5,
  prs: 3,
};

/** Thrown for every rejected payload; its message is always a fixed string. */
export class TriagePayloadError extends Error {}

const fail = message => {
  throw new TriagePayloadError(message);
};

const isPlainObject = v =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

// C0 controls plus DEL. A JSON string can encode \n and \t, so single-line-ness
// has to be checked, not inferred from having split the transcript on newlines.
// This is the structural kill for newline smuggling: a title carrying a newline
// could otherwise inject a whole extra line — a forged `Duplicate of #N` among
// them — into an otherwise well-formed comment. no-control-regex is disabled
// because matching control characters is the entire point of this pattern.
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u001F\u007F]/;

/**
 * Lines of a result payload, filtering on length and NOT trim — a
 * whitespace-only line is a line, so it still displaces a payload from the
 * final position. Parity with parse-scan-verdict.mjs's lastNonEmptyLine, which
 * is single-line shaped and so cannot be reused directly.
 */
export function nonEmptyLines(text) {
  const s = typeof text === 'string' ? text : '';
  return s.split('\n').filter(line => line.length > 0);
}

/**
 * Field defanging, applied to `title`/`reason` BEFORE interpolation — never to
 * a finished body (see header). Input is already validated as a single line
 * within its byte cap, so these rules are the second layer, not the first.
 */
const FIELD_RULES = [
  // Strip rather than reject: a legitimate title carrying a bidi mark must not
  // be able to fail the whole triage job (that shape is a denial of service).
  [/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, ''],
  // EVERY mention, not just the re-trigger handles: bestaxbot authors these
  // comments, so any live @mention pings a real person. Entities render as `@`
  // and never notify. Cost is a literal `&#64;` inside a backticked title.
  [/@/g, '&#64;'],
  [/<!--/g, '&lt;!--'],
  [/(--!?)>/g, '$1&gt;'],
  [/(Duplicate of) #/gi, '$1 &#35;'],
  [
    /^(TRIAGE-RESULT|TRIAGE-PAYLOAD|SECURITY-SCAN|REPRO-RESULT|REPRO-DRAFT):/gm,
    '$1 :',
  ],
  // Anywhere, not line-start: a single-line field has no legitimate fence, and
  // one mid-string would break out of the comment's own formatting.
  [/`{3,}|~{3,}/g, '&#96;&#96;&#96;'],
];

/** Apply every field rule in order. Pure; exported for the per-rule tests. */
export function sanitizeField(text) {
  let out = text;
  for (const [pattern, replacement] of FIELD_RULES) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

function requireKeys(value, required, optional, label) {
  const allowed = [...required, ...optional];
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) fail(`${label} carries an unexpected key`);
  }
  for (const key of required) {
    if (!Object.keys(value).includes(key)) {
      fail(`${label} is missing a required key`);
    }
  }
}

function validateText(value, maxBytes, label) {
  if (typeof value !== 'string') fail(`${label} is not a string`);
  if (CONTROL_RE.test(value)) fail(`${label} contains control characters`);
  if (Buffer.byteLength(value, 'utf8') > maxBytes) {
    fail(`${label} exceeds its byte cap`);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) fail(`${label} is empty`);
  return trimmed;
}

function validateNumber(value, self, label) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    fail(`${label} is not an integer`);
  }
  if (value < 1 || value > MAX_ITEM_NUMBER) fail(`${label} is out of range`);
  if (value === self) fail(`${label} is the item being triaged`);
  return value;
}

function validateEntries(value, key, self, label) {
  if (!Array.isArray(value)) fail(`${label} ${key} is not an array`);
  if (value.length > MAX_ENTRIES[key])
    fail(`${label} ${key} has too many entries`);
  const seen = new Set();
  return value.map(entry => {
    if (!isPlainObject(entry)) fail(`${label} ${key} entry is not an object`);
    requireKeys(
      entry,
      ['number', 'title', 'reason'],
      [],
      `${label} ${key} entry`
    );
    const number = validateNumber(entry.number, self, `${label} ${key} number`);
    if (seen.has(number)) fail(`${label} ${key} repeats an item number`);
    seen.add(number);
    return {
      number,
      title: validateText(
        entry.title,
        MAX_TITLE_BYTES,
        `${label} ${key} title`
      ),
      reason: validateText(
        entry.reason,
        MAX_REASON_BYTES,
        `${label} ${key} reason`
      ),
    };
  });
}

/**
 * Validate one payload against the command expected at its position. Returns a
 * normalized object built key by key — nothing from the input object is
 * carried through by reference, so an unexpected key cannot survive even if a
 * future edit loosens requireKeys.
 */
export function validatePayload(value, expectedCommand, self) {
  const label = `payload for ${expectedCommand}`;
  if (!isPlainObject(value)) fail(`${label} is not a JSON object`);
  if (value.command !== expectedCommand) {
    fail(`${label} reports a different command than its position expects`);
  }
  if (value.action !== 'post' && value.action !== 'skip') {
    fail(`${label} action is neither "post" nor "skip"`);
  }

  if (value.action === 'skip') {
    requireKeys(value, ['command', 'action', 'reason'], [], label);
    return {
      command: expectedCommand,
      action: 'skip',
      reason: validateText(
        value.reason,
        MAX_SKIP_REASON_BYTES,
        `${label} reason`
      ),
    };
  }

  if (expectedCommand === 'triage-dedupe') {
    requireKeys(
      value,
      ['command', 'action', 'duplicates', 'related'],
      ['duplicateOf'],
      label
    );
    const duplicates = validateEntries(
      value.duplicates,
      'duplicates',
      self,
      label
    );
    const related = validateEntries(value.related, 'related', self, label);
    const payload = {
      command: expectedCommand,
      action: 'post',
      duplicates,
      related,
    };
    if (Object.keys(value).includes('duplicateOf')) {
      const best = validateNumber(
        value.duplicateOf,
        self,
        `${label} duplicateOf`
      );
      // The auto-close cron acts on this line, so it may only ever name a
      // candidate this same comment lists.
      if (!duplicates.some(d => d.number === best)) {
        fail(`${label} duplicateOf is not one of the listed duplicates`);
      }
      payload.duplicateOf = best;
    }
    return payload;
  }

  const key = expectedCommand === 'triage-find-issues' ? 'issues' : 'prs';
  requireKeys(value, ['command', 'action', key], [], label);
  return {
    command: expectedCommand,
    action: 'post',
    [key]: validateEntries(value[key], key, self, label),
  };
}

/**
 * Pull the payloads out of an execution file, fail-closed. Throws
 * TriagePayloadError on any defect; never returns a partial list.
 */
export function extractPayloads(execText, expectedCommands, self) {
  const records = parseExecutionRecords(execText);
  if (records === null) fail('execution file is not parsable JSON');
  const record = lastResultRecord(records);
  if (record === null) fail('execution file has no result record');
  if (record.is_error !== false)
    fail('session result record is_error is not false');

  const lines = nonEmptyLines(record.result);
  const expected = expectedCommands.length;
  const tagged = lines.filter(line => line.startsWith(PAYLOAD_PREFIX));
  if (tagged.length !== expected) {
    fail('final message does not carry exactly one payload line per command');
  }
  const tail = lines.slice(lines.length - expected);

  return tail.map((line, index) => {
    const at = `payload ${index + 1}`;
    if (Buffer.byteLength(line, 'utf8') > MAX_PAYLOAD_LINE_BYTES) {
      fail(`${at} exceeds the maximum payload line length`);
    }
    const match = PAYLOAD_RE.exec(line);
    if (match === null) {
      fail(`${at}: the final lines are not all well-formed payload lines`);
    }
    let parsed;
    try {
      parsed = JSON.parse(match[1]);
    } catch {
      // Never surface the parse error: it embeds the input snippet.
      fail(`${at} is not valid JSON`);
    }
    return validatePayload(parsed, expectedCommands[index], self);
  });
}

const entryLines = entries =>
  entries.map(
    e =>
      `- #${e.number} — ${sanitizeField(e.title)}: ${sanitizeField(e.reason)}`
  );

export function renderDedupe(payload, { autoclose } = {}) {
  const lines = ['### AI triage', '', '**Likely duplicates**', ''];
  if (payload.duplicates.length === 0) {
    lines.push('No duplicates found.');
  } else {
    lines.push(...entryLines(payload.duplicates));
  }
  if (payload.duplicateOf !== undefined) {
    lines.push('', `Duplicate of #${payload.duplicateOf}`);
    if (autoclose) lines.push(AUTOCLOSE_SENTENCE);
  }
  if (payload.related.length > 0) {
    lines.push('', '**Related**', '', ...entryLines(payload.related));
  }
  lines.push('', MARKERS['triage-dedupe']);
  return lines.join('\n');
}

export function renderFindIssues(payload) {
  const lines = ['### AI triage — issues this PR may resolve', ''];
  if (payload.issues.length === 0) {
    lines.push('No open issues found that this PR resolves.');
  } else {
    lines.push(...entryLines(payload.issues));
    lines.push(
      '',
      'If this PR resolves one of these, add the line below to the PR description so the issue closes on merge:',
      '',
      '```',
      `Fixes #${payload.issues[0].number}`,
      '```'
    );
  }
  lines.push('', MARKERS['triage-find-issues']);
  return lines.join('\n');
}

export function renderFindDuplicatePrs(payload) {
  const lines = ['### AI triage — possible duplicate PRs', ''];
  if (payload.prs.length === 0) {
    lines.push('No duplicate PRs found.');
  } else {
    lines.push(...entryLines(payload.prs));
  }
  lines.push('', MARKERS['triage-find-duplicate-prs']);
  return lines.join('\n');
}

const RENDERERS = {
  'triage-dedupe': renderDedupe,
  'triage-find-issues': renderFindIssues,
  'triage-find-duplicate-prs': renderFindDuplicatePrs,
};

const isEmpty = payload => {
  if (payload.command === 'triage-dedupe') {
    return payload.duplicates.length === 0 && payload.related.length === 0;
  }
  const key = payload.command === 'triage-find-issues' ? 'issues' : 'prs';
  return payload[key].length === 0;
};

/**
 * Decide post-or-not per command and render the bodies. This owns the trigger
 * policy the command files describe: dedupe always reports its result, while
 * the two PR commands are silent on `opened` when they found nothing and post
 * on `labeled`, where a human asked and silence would read as a malfunction.
 */
export function buildEnvelope(payloads, { mode, trigger, autoclose }) {
  const commands = COMMANDS_FOR_MODE[mode];
  const comments = payloads.map((payload, index) => {
    const command = commands[index];
    const marker = MARKERS[command];
    if (payload.action === 'skip') {
      return {
        command,
        marker,
        disposition: 'none',
        cause: 'skip',
        reason: sanitizeField(payload.reason),
      };
    }
    if (
      isEmpty(payload) &&
      trigger === 'opened' &&
      command !== 'triage-dedupe'
    ) {
      return { command, marker, disposition: 'none', cause: 'no-findings' };
    }
    return {
      command,
      marker,
      disposition: 'post',
      body: RENDERERS[command](payload, { autoclose }),
    };
  });
  return { comments };
}

const USAGE =
  'usage: render-triage-comments.mjs --exec-file=<path> --mode=issue|pr ' +
  '--trigger=opened|labeled --autoclose=active|off --self=<number>';

/** Parse the five required flags. Returns null on any usage error. */
export function parseArgs(argv) {
  const raw = {};
  for (const arg of argv) {
    const match = /^--([a-z-]+)=(.*)$/.exec(arg);
    if (match === null) return null;
    if (Object.keys(raw).includes(match[1])) return null;
    raw[match[1]] = match[2];
  }
  const keys = Object.keys(raw).sort().join(',');
  if (keys !== 'autoclose,exec-file,mode,self,trigger') return null;
  if (raw.mode !== 'issue' && raw.mode !== 'pr') return null;
  if (raw.trigger !== 'opened' && raw.trigger !== 'labeled') return null;
  if (raw.autoclose !== 'active' && raw.autoclose !== 'off') return null;
  if (!/^[0-9]+$/.test(raw.self)) return null;
  const self = Number(raw.self);
  if (!Number.isSafeInteger(self) || self < 1) return null;
  if (raw['exec-file'].length === 0) return null;
  return {
    execFile: raw['exec-file'],
    mode: raw.mode,
    trigger: raw.trigger,
    autoclose: raw.autoclose === 'active',
    self,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args === null) {
    process.stderr.write(`${USAGE}\n`);
    process.exit(2);
  }

  let envelope;
  try {
    const text = readFileSync(args.execFile, 'utf8');
    const payloads = extractPayloads(
      text,
      COMMANDS_FOR_MODE[args.mode],
      args.self
    );
    envelope = buildEnvelope(payloads, args);
  } catch (error) {
    // Only our own fixed messages are ever echoed. Anything else (an fs error,
    // whose message can embed a path) collapses to a constant.
    const message =
      error instanceof TriagePayloadError
        ? error.message
        : 'execution file could not be read';
    process.stderr.write(`render-triage-comments: ${message}\n`);
    process.exit(1);
  }

  // Written only after everything above succeeded: a failure must leave stdout
  // empty rather than half an envelope.
  process.stdout.write(`${JSON.stringify(envelope)}\n`);
}

// Run only when executed directly (keeps the pure helpers importable).
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
