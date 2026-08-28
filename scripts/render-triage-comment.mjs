#!/usr/bin/env node
/**
 * Deterministic renderer + publisher for AI triage comments (#457, rule 9).
 *
 * ai-triage.yml's session used to build its own comment bodies and post them
 * with `gh issue comment` under bestaxbot's PAT. PAT-authored comments DO emit
 * workflow events (GITHUB_TOKEN ones do not), so model free text was reaching a
 * re-trigger-capable identity — invariant I2, held up only by every
 * comment-triggered workflow remembering to exclude bestaxbot. This script is
 * the deterministic half that removes the need for that enumeration: the
 * session now emits a structured payload and posts nothing, and everything a
 * reader (or auto-close-duplicates.mjs) acts on is built here from renderer
 * constants and validated integers.
 *
 * Two modes, deliberately split across two jobs:
 *   --mode=render   in the session job. Reads the Claude action's execution
 *                   file, validates + sanitizes the payload, renders each
 *                   body, refuses anything carrying a credential, writes the
 *                   bodies out. The execution file is the whole transcript
 *                   (echoed untrusted issue/PR text included) and never leaves
 *                   this job.
 *   --mode=publish  in the publish job, which holds the PAT and no OAuth
 *                   token. Reads ONE finished body on stdin, RE-asserts its
 *                   invariants — it crossed a job boundary, so the job that
 *                   can actually post re-verifies rather than trusts — then
 *                   does a marker-scoped upsert.
 *
 * Direction of failure: this is a publish path, so it fails like the sanitizer
 * (scripts/sanitize-repro-draft.mjs) and NOT like the verdict parser
 * (scripts/parse-scan-verdict.mjs). Fail-closed here means publishing NOTHING
 * and exiting non-zero; there is no degraded-comment path and none should be
 * added. parse-scan-verdict must print its fail-closed default because silence
 * there would read as `clean`; here the safe action has already been taken by
 * the time the process exits, so the exit code is free to carry the signal.
 *
 * Why the payload rides the TRIAGE-RESULT sentinel line rather than a line of
 * its own: the watchdog step in ai-triage.yml already guarantees exactly N
 * sentinel lines, as the LAST N non-empty lines, with none anywhere else.
 * Riding that line inherits all three properties, so a payload echoed
 * mid-transcript (attacker text quoted back by the session) is unreadable —
 * extraction only ever looks at the last N lines of the final result record.
 * The payload must therefore be compact JSON on ONE line; a pretty-printed one
 * fails the watchdog first, which is the correct direction.
 *
 * Log hygiene, as in parse-scan-verdict.mjs: stdout carries renderer-owned
 * strings and validated integers only. No model-supplied text is ever printed
 * (--dry-run, never used in CI, is the sole exception).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import {
  lastNonEmptyLines,
  lastResultRecord,
  parseExecutionRecords,
} from './parse-scan-verdict.mjs';
import { sanitizeText } from './sanitize-repro-draft.mjs';
import {
  DEFAULT_WAIT_DAYS,
  MARKER,
  isAutomationAuthor,
} from './auto-close-duplicates.mjs';

const API_BASE = 'https://api.github.com';
const FETCH_TIMEOUT_MS = 30_000;

export const MAX_PAYLOAD_BYTES = 8000;
export const MAX_TITLE_CHARS = 256; // GitHub's own issue-title limit
export const MAX_REASON_CHARS = 400;
export const MAX_BODY_BYTES = 60_000; // GitHub caps comment bodies at 65536
export const MAX_ITEMS_HARD = 50; // reject absurd arrays before per-item work

export const AUTOCLOSE_SENTENCE =
  `This issue may be auto-closed in ${DEFAULT_WAIT_DAYS} days unless someone ` +
  'objects (comment or \u{1F44E}).';

/**
 * Everything structural, per command. NOTHING here may come from the payload:
 * markers, headings, fallback sentences and the `Duplicate of #N` / `Fixes #N`
 * lines are renderer constants, so a payload cannot forge a marker, attach an
 * auto-close promise while AUTOCLOSE is off, or turn a silent run into a
 * comment. `expectFor` pins which item type each command is valid on; it is
 * enforced in parseArgs against --is-pr, so `--expect=triage-dedupe` on a pull
 * request is a usage error rather than a `Duplicate of #N` plus a 14-day
 * auto-close promise rendered onto a PR the cron will never look at.
 */
export const COMMANDS = {
  'triage-dedupe': {
    marker: MARKER, // imported, so the two files cannot drift
    heading: '### AI triage',
    itemsHeading: '**Likely duplicates**',
    maxItems: 3,
    maxRelated: 3,
    emptyLine: 'No duplicates found.',
    silentWhenEmptyOnOpened: false,
    expectFor: 'issue',
  },
  'triage-find-issues': {
    marker: '<!-- ai-triage:find-issues -->',
    heading: '### AI triage — issues this PR may resolve',
    itemsHeading: null,
    maxItems: 5,
    maxRelated: 0,
    emptyLine: 'No open issues found that this PR resolves.',
    silentWhenEmptyOnOpened: true,
    expectFor: 'pr',
  },
  'triage-find-duplicate-prs': {
    marker: '<!-- ai-triage:find-duplicate-prs -->',
    heading: '### AI triage — possible duplicate PRs',
    itemsHeading: null,
    maxItems: 3,
    maxRelated: 0,
    emptyLine: 'No duplicate PRs found.',
    silentWhenEmptyOnOpened: true,
    expectFor: 'pr',
  },
};

/**
 * Deliberately stricter than the watchdog's `startswith("TRIAGE-RESULT:")`: no
 * leading or trailing slack, no doubled spaces, no CR. A line the watchdog
 * tolerates but this rejects fails the render loudly rather than publishing
 * something only half understood.
 */
export const SENTINEL_RE =
  /^TRIAGE-RESULT: ([a-z][a-z-]{0,39}) (publish|skip)(?: (.*))?$/;

/**
 * Credential shapes worth refusing on sight; see findCredentialLeak.
 *
 * Each prefix REQUIRES a plausible secret body. Matching the bare prefix
 * turned any outside author into a denial of service: an issue titled
 * "Redact ghp_ prefixed tokens in debug logs" made the renderer refuse and
 * red the run, citing a credential the session never saw. Real tokens are
 * long opaque strings, so the length floor keeps the control while making
 * prose about tokens harmless. A deliberately planted 20-char lookalike can
 * still trip it — loudly, which is the right direction for this check.
 */
const CREDENTIAL_SHAPE_RE =
  /(sk-ant-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/;

const isPlainObject = v =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

// ---------------------------------------------------------------------------
// Field sanitizing. The ORDER of these steps is the security property — see
// each numbered comment before rearranging anything.
// ---------------------------------------------------------------------------

/**
 * Neutralize one model-supplied free-text field (a title or a reason).
 *
 * sanitizeText() matches literal sequences, so on its own it is evadable by
 * splitting a token across lines and letting the caller's flattening reassemble
 * it. Both halves of that were verified against the real consumer:
 *
 *   title = "<!\n-- ai-triage:dedupe --\n>"   joined with '' -> a LIVE marker
 *   title = "Duplicate of\n#777"              joined with ' ' -> a LIVE target
 *
 * Hence: removal steps first, flattening BEFORE sanitizeText, and the flatten
 * join is a SPACE and never ''. Only step 1 removes characters and it runs
 * first; every later whitespace step maps to a single space, which is what
 * makes steps 3 and 6 unable to create a token.
 */
export function sanitizeField(raw, maxChars) {
  if (typeof raw !== 'string') return '';
  let s = raw;
  // 1. Invisible and bidi controls are REMOVED, before anything pattern-based:
  //    `@cl<ZWSP>aude` must not reassemble into a live mention after defanging.
  //    The set has to cover every character a reader cannot see, not just
  //    the well-known ones: SOFT HYPHEN (U+00AD) and WORD JOINER (U+2060)
  //    are invisible in rendered markdown too, so omitting them let
  //    `@cl<U+00AD>aude` DISPLAY as a mention while invariant 4 read the
  //    body as clean. A spoof rather than an escalation — GitHub will not
  //    autolink across the joiner either — but preventing exactly that is
  //    why this step runs first.
  s = s.replace(
    /[\u00AD\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g,
    ''
  );
  // 2. Other C0/C1 controls become spaces (never removed — removal could join
  //    two fragments into a token). Matching control characters is the whole
  //    point here, so no-control-regex is disabled deliberately rather than
  //    worked around: these bytes must not survive into a comment body.
  // eslint-disable-next-line no-control-regex
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\u009F]/g, ' ');
  // 3. FLATTEN to one line, joined with a space. Must precede sanitizeText so
  //    it sees fully assembled tokens, and must not join with ''.
  s = s.replace(/[\r\n\u0085\u2028\u2029]+/g, ' ');
  // 4. Escape markup. A field is prose inside a list item, never markup, and
  //    raw HTML is honored in GitHub comments: a title of
  //    `<details><summary>more context</summary>` renders as a collapsed
  //    widget that hides `Duplicate of #N` and the auto-close notice from
  //    the very reader whose objection is the only veto. `<img>` beacons and
  //    disguised links ride the same gap, published under bestaxbot.
  s = s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // 5. Defang every issue/PR reference. `&#35;123` renders as `#123` for a
  //    reader but is not an autolink and cannot be matched by any `#(\d+)`
  //    consumer, which is what lets assertRenderedInvariants insist that every
  //    raw `#N` left in the body is one the renderer itself emitted. Must run
  //    BEFORE the entity-producing steps below, whose own `#NN` would be
  //    re-encoded into nonsense.
  s = s.replace(/#(?=\d)/g, '&#35;');
  // 6. Defang EVERY mention, not just the three re-trigger targets. sanitizeText
  //    handles @claude/@coderabbitai/@bestaxbot; a triage comment quoting
  //    `cc @allxsmith` still pinged a human, and `@copilot` is actionable in
  //    this repo while `@org/team` pings a whole team — all under bestaxbot,
  //    from text an outside author wrote.
  s = s.replace(/@(?=[A-Za-z0-9])/g, '&#64;');
  // 7. Break URL autolinking. A quoted `https://github.com/o/r/issues/999`
  //    autolinks and records a 'referenced' event on #999 from bestaxbot, so
  //    step 5 alone did not deliver the cross-reference silence it claims.
  s = s.replace(/:\/\//g, '&#58;//');
  // 8. Same for GitHub's other issue shorthand, `GH-123`. Entity-encoding the
  //    first digit renders identically and links nothing.
  s = s.replace(
    /\b(GH-)(\d)/gi,
    (_, prefix, digit) => `${prefix}&#${digit.charCodeAt(0)};`
  );
  // 9. Defang a credential-shaped string so the published comment can never
  //    carry a working token. findCredentialLeak still REFUSES outright on
  //    the job's own secrets; this only covers shapes it cannot compare
  //    against, and defanging beats publishing them intact.
  s = s.replace(CREDENTIAL_SHAPE_RE, m => m.replace(/_/g, '&#95;'));
  // 10. The shared defang rules (`Duplicate of #`, line-start sentinels,
  //     fences). Mentions and comment delimiters are already handled above.
  s = sanitizeText(s);
  // 11. Collapse runs of spaces/tabs left by the steps above.
  s = s.replace(/[ \t]+/g, ' ').trim();
  // 12. Truncate LAST, so the bound holds after entity expansion — then drop
  //    a numeric character reference the cut landed inside. `&#64;` sliced
  //    to `&#6` is NOT inert: with no closing `;` invariant 6 strips
  //    nothing, reads the leftover as a reference to issue #6, and refuses
  //    to publish a comment whose only sin was a long title. Named
  //    fragments (`&lt`) are left alone — they render as literal text,
  //    which is ugly but fabricates no reference.
  if (s.length <= maxChars) return s;
  return `${s.slice(0, maxChars - 1).replace(/&#\d*$/, '')}…`;
}

/**
 * Refuse a body carrying a credential, rather than redacting it: publishing a
 * scrubbed version would destroy the only signal that the session went
 * somewhere it had no business going (claude-repro.yml makes the same call).
 *
 * This RAISES THE COST of exfiltration; it is not a proof. Any chunked,
 * reversed or arithmetic encoding defeats it. The real control is the tool
 * allowlist — this catches the naive path and turns it into a failed build
 * instead of a public comment. Returns a reason string, or null when clean.
 */
export function findCredentialLeak(body, secrets = []) {
  const haystack = body.toLowerCase();
  for (const secret of secrets) {
    if (!secret) continue;
    const forms = [
      secret,
      // Match the shell this mirrors: base64 with padding and newlines
      // stripped, and lowercase hex.
      Buffer.from(secret, 'utf8').toString('base64').replace(/[\n=]/g, ''),
      Buffer.from(secret, 'utf8').toString('hex'),
    ];
    for (const form of forms) {
      if (form && haystack.includes(form.toLowerCase())) {
        return 'a live credential value (literal or encoded)';
      }
    }
  }
  return CREDENTIAL_SHAPE_RE.test(body) ? 'a credential-shaped string' : null;
}

// ---------------------------------------------------------------------------
// Payload extraction and validation.
// ---------------------------------------------------------------------------

/**
 * Read one sentinel line per expected command out of the execution file's
 * final message. Returns a Map(command -> { status, json }) or null.
 *
 * Null is fail-closed: nothing publishes for ANY command. A wrong sentinel
 * count or an unexpected command set means the session did not follow the
 * contract at all, so no payload in the message can be attributed with
 * confidence.
 *
 * A well-formed set with ONE bad payload is isolated inside this script — the
 * other commands still render — but that is not the end state: runRender still
 * exits non-zero, and the workflow step runs under `set -euo pipefail`, so the
 * run fails and NOTHING is published. That is deliberate (a half-triaged item
 * that looks complete is worse than a loud failure); the per-command isolation
 * here only keeps the error messages specific.
 */
export function parseSentinels(execText, expectedCommands) {
  const record = lastResultRecord(parseExecutionRecords(execText));
  if (record === null || record.is_error !== false) return null;

  // Re-enforce the watchdog's whole contract rather than assuming that step
  // ran: NO sentinel may appear outside the final N lines. Reading only the
  // last N would already ignore a sentinel echoed from quoted issue text, but
  // ignoring it silently makes this script's safety depend on a sibling step's
  // continued existence and ordering. Counting them here fails the run closed
  // instead, which is the same answer the watchdog gives.
  const text = typeof record.result === 'string' ? record.result : '';
  const total = text
    .split('\n')
    .filter(line => line.startsWith('TRIAGE-RESULT:')).length;
  if (total !== expectedCommands.length) return null;

  const lines = lastNonEmptyLines(record.result, expectedCommands.length);
  if (lines.length !== expectedCommands.length) return null;

  const found = new Map();
  for (const line of lines) {
    const match = SENTINEL_RE.exec(line);
    if (match === null) return null;
    const [, command, status, json] = match;
    if (found.has(command)) return null; // a repeated command is unattributable
    found.set(command, { status, json: json ?? '' });
  }
  for (const command of expectedCommands) {
    if (!found.has(command)) return null;
  }
  return found;
}

/** Parse one payload. Size is checked BEFORE parsing. Null on anything odd. */
export function parsePayload(jsonText) {
  if (typeof jsonText !== 'string' || jsonText === '') return null;
  if (Buffer.byteLength(jsonText, 'utf8') > MAX_PAYLOAD_BYTES) return null;
  let value;
  try {
    value = JSON.parse(jsonText);
  } catch {
    return null;
  }
  return isPlainObject(value) ? value : null;
}

/** A number we are willing to put in a comment. No coercion, ever. */
const isValidNumber = n =>
  typeof n === 'number' && Number.isSafeInteger(n) && n >= 1;

/**
 * Validate one list of candidates. Returns { kept, rawCount }, or null when
 * the list itself is unusable (not an array, or absurdly long).
 *
 * Caps are noise limits rather than security boundaries, so an over-long list
 * truncates instead of failing. Everything else drops the individual entry.
 */
export function validateItems(raw, { cap, exclude = new Set() } = {}) {
  if (!Array.isArray(raw) || raw.length > MAX_ITEMS_HARD) return null;
  const kept = [];
  const seen = new Set(exclude);
  let invalid = 0;
  for (const entry of raw) {
    if (seen.has(entry?.number)) continue; // excluded, NOT malformed
    if (!isPlainObject(entry) || !isValidNumber(entry.number)) {
      invalid++;
      continue;
    }
    const title = sanitizeField(entry.title, MAX_TITLE_CHARS);
    if (title === '') {
      invalid++; // a bullet with no title is not worth posting
      continue;
    }
    seen.add(entry.number);
    kept.push({
      number: entry.number,
      title,
      reason: sanitizeField(entry.reason, MAX_REASON_CHARS),
    });
    if (kept.length === cap) break;
  }
  return { kept, rawCount: raw.length, invalid };
}

// ---------------------------------------------------------------------------
// Rendering.
// ---------------------------------------------------------------------------

const bullet = item =>
  item.reason === ''
    ? `- #${item.number} — ${item.title}`
    : `- #${item.number} — ${item.title}: ${item.reason}`;

/**
 * Render one command's comment body.
 *
 * Returns null when there is legitimately nothing to publish (an empty result
 * on an `opened` run of either PR command). Throws when the payload is
 * unusable — the two are different outcomes and the caller treats them so.
 *
 * Model text and structural text are never in the same string: the body is
 * assembled as an array of lines, and `Duplicate of #N` / `Fixes #N` are their
 * own elements built from a literal plus a validated integer. There is
 * therefore no "sanitize this part but not that part" branch anywhere in here,
 * which is the ambiguity that would eventually get resolved the wrong way.
 */
export function renderComment(command, payload, ctx) {
  const spec = COMMANDS[command];
  if (!spec) throw new Error(`unknown command: ${command}`);
  const { number, trigger, autoclose } = ctx;

  const items = validateItems(payload.items, {
    cap: spec.maxItems,
    exclude: new Set([number]), // never cite the item as its own duplicate
  });
  if (items === null) throw new Error(`${command}: items is not a usable list`);
  // A list whose entries were all MALFORMED is a broken payload, not an empty
  // result — publishing "No duplicates found." over it would state a confident
  // finding the session never made. Entries dropped because they were
  // EXCLUDED (the item citing itself, or the same number twice) are ordinary:
  // models list the target among its own duplicates all the time, and
  // treating that as a broken payload threw away the whole run.
  if (items.invalid > 0 && items.kept.length === 0) {
    throw new Error(
      `${command}: every usable candidate in a non-empty list was malformed`
    );
  }

  // `related` is documented as optional, so every spelling of "nothing here"
  // — absent, null, [] — must render rather than discard a good duplicate
  // finding. A malformed value is ignored for the same reason: it is a
  // decoration on this comment, never the finding itself.
  let related = { kept: [] };
  if (spec.maxRelated > 0) {
    related = validateItems(payload.related, {
      cap: spec.maxRelated,
      exclude: new Set([number, ...items.kept.map(i => i.number)]),
    }) ?? { kept: [] };
  }

  const empty = items.kept.length === 0;
  if (empty && trigger === 'opened' && spec.silentWhenEmptyOnOpened)
    return null;

  const lines = [spec.heading, ''];
  if (spec.itemsHeading) lines.push(spec.itemsHeading, '');
  lines.push(...(empty ? [spec.emptyLine] : items.kept.map(bullet)));

  let duplicateTarget = null;
  if (command === 'triage-dedupe' && !empty) {
    duplicateTarget = items.kept[0].number;
    lines.push('', `Duplicate of #${duplicateTarget}`);
    if (autoclose === 'active') lines.push('', AUTOCLOSE_SENTENCE);
  }
  if (command === 'triage-find-issues' && !empty) {
    lines.push(
      '',
      'If this PR resolves one of these, add the line below to the PR ' +
        'description so the issue closes on merge:',
      '',
      '```',
      `Fixes #${items.kept[0].number}`,
      '```'
    );
  }
  if (related.kept.length > 0) {
    lines.push('', '**Related**', '', ...related.kept.map(bullet));
  }
  lines.push('', spec.marker, '');

  const body = lines.join('\n');
  const numbers = new Set(
    [...items.kept, ...related.kept].map(item => item.number)
  );
  assertRenderedInvariants(body, { command, numbers, duplicateTarget });
  return { body, duplicateTarget, numbers };
}

/**
 * The backstop, and the reason it exists: it does not depend on sanitizeField
 * being complete. If a defang rule is later weakened, these assertions still
 * refuse to publish. Throws on violation — callers must not catch and post.
 *
 * Invariant 3 is what makes the consumer's first-match-wins behavior
 * non-exploitable: auto-close-duplicates.mjs's DUPLICATE_RE is NOT global, so
 * `body.match()` resolves the FIRST `Duplicate of #N` — and a forged one inside
 * a bullet would sit above the renderer's real line.
 */
export function assertRenderedInvariants(
  body,
  { command, numbers, duplicateTarget }
) {
  const spec = COMMANDS[command];
  const fail = why => {
    throw new Error(`${command}: rendered body failed an invariant — ${why}`);
  };

  // 1. Exactly one marker, and it is the last non-empty line.
  const markerCount = body.split(spec.marker).length - 1;
  if (markerCount !== 1)
    fail(`marker appears ${markerCount} times, expected 1`);
  if (lastNonEmptyLines(body, 1)[0] !== spec.marker) {
    fail('marker is not the last non-empty line');
  }
  // 2. No other HTML comment delimiters anywhere.
  const withoutMarker = body.replace(spec.marker, '');
  if (withoutMarker.includes('<!--') || /--!?>/.test(withoutMarker)) {
    fail('a stray HTML comment delimiter survived');
  }
  // 3. At most one `Duplicate of #N`, and it must be the validated target.
  const dupes = [...body.matchAll(/Duplicate of #(\d+)/g)];
  if (dupes.length > 1) fail(`${dupes.length} "Duplicate of #N" lines`);
  if (dupes.length === 1 && Number(dupes[0][1]) !== duplicateTarget) {
    fail('a "Duplicate of #N" line names an unvalidated number');
  }
  if (dupes.length === 0 && duplicateTarget !== null) {
    fail('the duplicate target was dropped from the body');
  }
  // 4. No live mention of ANYONE. Restating sanitizeText's three literals
  //    made this backstop fail together with the rule it backstops, and it
  //    said nothing about @allxsmith, @copilot or @org/team. No renderer-owned
  //    string contains an `@`, so the strict form costs nothing.
  if (/@[A-Za-z0-9]/.test(body)) fail('a live @mention');
  // 4b. No raw markup. Fields are escaped, and nothing the renderer writes
  //     contains an angle bracket except the marker handled above.
  if (/[<>]/.test(withoutMarker)) fail('raw markup outside the marker');
  // 5. No line may start with a watchdog sentinel.
  if (/^(TRIAGE-RESULT|SECURITY-SCAN|REPRO-RESULT|REPRO-DRAFT):/m.test(body)) {
    fail('a line starts with a machine sentinel');
  }
  // 6. Every raw `#N` left is one we emitted. Entities are stripped first:
  //    `'&#35;'.match(/#(\d+)/)` matches `#35`, which would false-positive.
  const deEntitied = body.replace(/&#\d+;/g, '');
  for (const [, n] of deEntitied.matchAll(/#(\d+)/g)) {
    if (!numbers.has(Number(n))) fail(`an unvalidated reference #${n}`);
  }
  // 7. Size, so a body can never blow the comment or job-output limit.
  const bytes = Buffer.byteLength(body, 'utf8');
  if (bytes > MAX_BODY_BYTES) fail(`body is ${bytes} bytes`);
}

// ---------------------------------------------------------------------------
// GitHub REST (small, local: this makes 1-3 calls, so it needs none of
// auto-close-duplicates.mjs's cron-scale rate-limit budgeting).
// ---------------------------------------------------------------------------

async function api(pathOrUrl, { method = 'GET', body } = {}) {
  const url = pathOrUrl.startsWith('https://')
    ? pathOrUrl
    : `${API_BASE}${pathOrUrl}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'bestax-render-triage-comment',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `${method} ${url} failed: ${res.status} ${res.statusText} ${text.slice(0, 200)}`
    );
  }
  return res;
}

async function getAllPages(path) {
  const items = [];
  let url = path;
  while (url) {
    const res = await api(url);
    items.push(...(await res.json()));
    url =
      (res.headers.get('link') ?? '').match(/<([^>]+)>;\s*rel="next"/)?.[1] ??
      null;
  }
  return items;
}

/**
 * The LATEST automation-authored comment carrying this marker, or null.
 *
 * Matched on marker + author CLASS via the consumer's own isAutomationAuthor —
 * never one specific login (rule 6). bestaxbot is a machine *User*, so a
 * `type === 'Bot'` test alone misses it, and a login test alone breaks the next
 * time the identity changes. A human quoting the marker is not automation and
 * is ignored. `comments` must be in ascending created order (the REST default).
 */
export function findTriageComment(comments, marker) {
  for (let i = comments.length - 1; i >= 0; i--) {
    const c = comments[i];
    if (!isAutomationAuthor(c.user)) continue;
    if (c.body?.includes(marker)) return c;
  }
  return null;
}

// ---------------------------------------------------------------------------
// CLI.
// ---------------------------------------------------------------------------

export function parseArgs(argv) {
  const opts = { dryRun: false };
  const take = (arg, name) => arg.slice(name.length + 3);
  for (const arg of argv) {
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg.startsWith('--mode=')) opts.mode = take(arg, 'mode');
    else if (arg.startsWith('--exec-file='))
      opts.execFile = take(arg, 'exec-file');
    else if (arg.startsWith('--out-dir=')) opts.outDir = take(arg, 'out-dir');
    else if (arg.startsWith('--body-file='))
      opts.bodyFile = take(arg, 'body-file');
    else if (arg.startsWith('--expect='))
      opts.expect = take(arg, 'expect').split(',').filter(Boolean);
    else if (arg.startsWith('--command=')) opts.command = take(arg, 'command');
    else if (arg.startsWith('--repo=')) opts.repo = take(arg, 'repo');
    else if (arg.startsWith('--number=')) {
      // Strict: `Number()` accepts 0x10, 1e3 and whitespace, which the
      // "no coercion, ever" rule this file states elsewhere would not.
      const raw = take(arg, 'number');
      opts.number = /^[0-9]+$/.test(raw) ? Number(raw) : NaN;
    } else if (arg.startsWith('--trigger='))
      opts.trigger = take(arg, 'trigger');
    else if (arg.startsWith('--is-pr=')) opts.isPr = take(arg, 'is-pr');
    else if (arg.startsWith('--autoclose='))
      opts.autoclose = take(arg, 'autoclose');
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (opts.mode !== 'render' && opts.mode !== 'publish') {
    throw new Error('--mode=render|publish is required');
  }
  if (opts.trigger !== 'opened' && opts.trigger !== 'labeled') {
    throw new Error('--trigger=opened|labeled is required');
  }
  if (opts.mode === 'render') {
    if (!opts.expect?.length)
      throw new Error('--expect=<command,...> is required');
    if (opts.isPr !== 'true' && opts.isPr !== 'false') {
      throw new Error('--is-pr=true|false is required for --mode=render');
    }
    const itemKind = opts.isPr === 'true' ? 'pr' : 'issue';
    for (const command of opts.expect) {
      if (!COMMANDS[command])
        throw new Error(`--expect names an unknown command: ${command}`);
      if (COMMANDS[command].expectFor !== itemKind) {
        throw new Error(
          `${command} is only valid on ${COMMANDS[command].expectFor} items, not ${itemKind}`
        );
      }
    }
    if (!opts.outDir)
      throw new Error('--out-dir=<dir> is required for --mode=render');
    if (opts.autoclose !== 'active' && opts.autoclose !== 'off') {
      throw new Error('--autoclose=active|off is required for --mode=render');
    }
  } else {
    if (!opts.command || !COMMANDS[opts.command]) {
      throw new Error(
        '--command=<known command> is required for --mode=publish'
      );
    }
    if (!opts.repo || !/^[^/\s]+\/[^/\s]+$/.test(opts.repo)) {
      throw new Error('--repo=owner/name is required');
    }
  }
  if (!isValidNumber(opts.number))
    throw new Error('--number=<positive integer> is required');
  return opts;
}

/**
 * Render every expected command's body into --out-dir. One file per command
 * that has something to publish, named `<command>.md`; commands with nothing
 * to say write no file, which is how the workflow decides what to publish.
 */
function runRender(opts) {
  let text;
  try {
    text = opts.execFile ? readFileSync(opts.execFile, 'utf8') : '';
  } catch (err) {
    // ENOENT matches the watchdog's tolerance: no execution file means the
    // action ran no session, so there is nothing to judge and nothing to
    // publish. Every OTHER error (EACCES, EISDIR, a read fault) means a file
    // exists and we could not read it — that is an infrastructure failure
    // wearing the same clothes, and swallowing it produced four green jobs,
    // no comment, a consumed label and nothing in the log to distinguish it
    // from a legitimate no-session run.
    if (err.code === 'ENOENT') {
      console.log('no execution file — the action ran no session');
      return 0;
    }
    console.error(
      `::error::execution file could not be read (${err.code ?? 'unknown'}) — publishing nothing.`
    );
    return 1;
  }
  if (text === '') {
    console.log('empty execution file — nothing to render');
    return 0;
  }

  const sentinels = parseSentinels(text, opts.expect);
  if (sentinels === null) {
    console.error(
      '::error::triage payload unreadable (wrong sentinel count, malformed ' +
        'sentinel, repeated or unexpected command) — publishing nothing.'
    );
    return 1;
  }

  mkdirSync(opts.outDir, { recursive: true });
  const secrets = [
    process.env.CLAUDE_CODE_OAUTH_TOKEN,
    process.env.GITHUB_TOKEN,
  ];
  let exit = 0;

  for (const command of opts.expect) {
    const { status, json } = sentinels.get(command);
    if (status === 'skip') {
      console.log(`${command}: session reported skip — nothing to publish`);
      continue;
    }
    const payload = parsePayload(json);
    if (payload === null) {
      console.error(
        `::error::${command}: payload missing, oversized or malformed.`
      );
      exit = 1;
      continue;
    }
    let rendered;
    try {
      rendered = renderComment(command, payload, {
        number: opts.number,
        trigger: opts.trigger,
        autoclose: opts.autoclose,
      });
    } catch (err) {
      // The message is renderer-owned (it names the command and the invariant,
      // never the offending text), so it is safe for a public job log.
      console.error(`::error::${command}: ${err.message}`);
      exit = 1;
      continue;
    }
    if (rendered === null) {
      console.log(`${command}: empty result on an opened run — staying silent`);
      continue;
    }
    const leak = findCredentialLeak(rendered.body, secrets);
    if (leak !== null) {
      console.error(
        `::error::${command}: rendered comment contains ${leak} — refusing to ` +
          'publish. This is a backstop, not a proof; treat it as a signal that ' +
          'the session read something it should not have.'
      );
      exit = 1;
      continue;
    }
    writeFileSync(join(opts.outDir, `${command}.md`), rendered.body, 'utf8');
    console.log(
      `${command}: rendered ${Buffer.byteLength(rendered.body)} bytes`
    );
    if (opts.dryRun) console.log(rendered.body);
  }
  return exit;
}

/**
 * Publish ONE already-rendered body (read from stdin) with a marker-scoped
 * upsert. Never `--edit-last`: that selects by author, so a newer repro draft
 * or the other triage command's comment would be the one overwritten (rule 6).
 */
async function runPublish(opts) {
  const body = readFileSync(opts.bodyFile ?? 0, 'utf8');
  if (body.trim() === '') {
    console.log(`${opts.command}: empty body on stdin — nothing to publish`);
    return 0;
  }
  const spec = COMMANDS[opts.command];

  // Re-check what crossed the job boundary. Be precise about what this buys,
  // because the obvious reading is wrong: `numbers` and `duplicateTarget` are
  // DERIVED FROM THE SAME BODY that is then scanned, so invariants 3 and 6 are
  // tautological on this hop — a tampered body claiming `Duplicate of #999`
  // with bullets naming #999 would satisfy them. What IS live here, and worth
  // the call, is everything not self-referential: exactly one marker and it
  // last, no raw markup, no @mention, no smuggled sentinel, and the size cap.
  // Re-deriving the payload would need the validated numbers carried across
  // the boundary; the render job is where that check has teeth.
  const deEntitied = body.replace(/&#\d+;/g, '');
  const numbers = new Set(
    [...deEntitied.matchAll(/#(\d+)/g)].map(m => Number(m[1]))
  );
  const dupe = body.match(/Duplicate of #(\d+)/);
  try {
    assertRenderedInvariants(body, {
      command: opts.command,
      numbers,
      duplicateTarget: dupe ? Number(dupe[1]) : null,
    });
  } catch (err) {
    console.error(`::error::${err.message}`);
    return 1;
  }
  const leak = findCredentialLeak(body, [process.env.GITHUB_TOKEN]);
  if (leak !== null) {
    console.error(
      `::error::${opts.command}: body contains ${leak} — refusing to publish.`
    );
    return 1;
  }

  if (opts.dryRun) {
    // Accepted in this mode but previously never read, so `--dry-run` issued a
    // live PATCH. Check it before any network call, not after.
    console.log(
      `${opts.command}: --dry-run — would publish ${Buffer.byteLength(body)} bytes, no request made`
    );
    return 0;
  }

  const comments = await getAllPages(
    `/repos/${opts.repo}/issues/${opts.number}/comments?per_page=100`
  );
  const existing = findTriageComment(comments, spec.marker);

  if (existing && opts.trigger === 'opened') {
    // Deterministic idempotency. The session's pre-check already covers this,
    // but doing it here makes "an opened run never overwrites an existing
    // triage comment" true by construction rather than by model compliance.
    console.log(
      `${opts.command}: already triaged — leaving comment ${existing.id} alone`
    );
    return 0;
  }

  // Editing needs the comment to be OURS. Pre-#361 dedupe comments were
  // authored by github-actions[bot], and PATCHing one of those with bestaxbot's
  // PAT is not reliably permitted — so fall back to a fresh comment rather than
  // failing the run. Resolved at runtime so an identity change needs no edit.
  let self;
  try {
    self = (await (await api('/user')).json()).login ?? '';
  } catch (err) {
    // Falling back to a fresh POST is the safe direction, but it must not be
    // SILENT: an unlogged failure here is byte-identical to a legitimate
    // first post, and it is a second route to a duplicate marker comment.
    // `GET /user` 403s for a GitHub App installation token, so if the
    // publishing identity ever changes, this warning is the only thing that
    // will say why every run started posting instead of refreshing.
    console.log(
      `::warning::${opts.command}: could not resolve the publishing identity (${err.message}); posting a fresh comment instead of refreshing.`
    );
    self = '';
  }

  // Any NEW dedupe verdict must start a new objection window. The auto-close
  // cron measures the 14 days from the comment's created_at, and a PATCH
  // preserves it — so refreshing a 30-day-old comment with a `Duplicate of #N`
  // it did not previously carry hands the cron an already-expired clock and
  // closes the issue against a target nobody has had a chance to object to,
  // while the body it just wrote promises 14 days. Reposting resets the clock
  // honestly, and findMarkerComment reads the LATEST marker comment, so the new
  // one wins.
  //
  // The predicate keys on the NEW target alone, which covers both directions
  // that matter — an earlier version required both sides to be defined and so
  // missed the "No duplicates found." -> `Duplicate of #N` promotion, which is
  // the same stale-clock bug wearing different clothes:
  //   undefined -> #N   repost   (a first verdict on an aged comment)
  //   #100      -> #200 repost   (a changed verdict)
  //   #100      -> #100 PATCH    (same verdict; the clock legitimately runs on)
  //   #100      -> none  PATCH   (a retraction carries no clock, and editing in
  //                               place is what removes the target the cron reads)
  const previousTarget = existing?.body?.match(/Duplicate of #(\d+)/)?.[1];
  const nextTarget = dupe?.[1];
  const verdictChanged =
    nextTarget !== undefined && previousTarget !== nextTarget;
  if (verdictChanged) {
    console.log(
      `${opts.command}: duplicate target is new (${previousTarget ? `#${previousTarget}` : 'none'} -> #${nextTarget}) — posting fresh so the objection window restarts`
    );
  }

  if (existing && !verdictChanged && existing.user?.login === self) {
    await api(`/repos/${opts.repo}/issues/comments/${existing.id}`, {
      method: 'PATCH',
      body: { body },
    });
    console.log(`${opts.command}: refreshed comment ${existing.id}`);
    return 0;
  }
  const created = await api(
    `/repos/${opts.repo}/issues/${opts.number}/comments`,
    {
      method: 'POST',
      body: { body },
    }
  );
  console.log(`${opts.command}: posted comment ${(await created.json()).id}`);
  return 0;
}

export async function main(argv = process.argv.slice(2)) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (err) {
    console.error(`Usage error: ${err.message}`);
    console.error(
      'Usage: node scripts/render-triage-comment.mjs --mode=render ' +
        '--exec-file=<path> --expect=<command,...> --number=<n> ' +
        '--is-pr=true|false --trigger=opened|labeled --autoclose=active|off ' +
        '--out-dir=<dir>\n' +
        '   or: node scripts/render-triage-comment.mjs --mode=publish ' +
        '--command=<command> --repo=owner/name --number=<n> ' +
        '--trigger=opened|labeled [--body-file=<path>]   (body on stdin ' +
        'when --body-file is absent)'
    );
    return 2;
  }
  if (opts.mode === 'publish' && !process.env.GITHUB_TOKEN) {
    console.error('Usage error: GITHUB_TOKEN environment variable is required');
    return 2;
  }
  if (opts.mode === 'render') return runRender(opts);
  try {
    return await runPublish(opts);
  } catch (err) {
    console.error(`::error::${opts.command}: publish failed: ${err.message}`);
    return 1;
  }
}

// Run only when executed directly (keeps the pure helpers importable).
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exitCode = await main();
}
