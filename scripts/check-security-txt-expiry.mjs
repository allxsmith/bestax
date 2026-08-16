#!/usr/bin/env node
/**
 * Open a renewal issue before docs/static/.well-known/security.txt expires (#414).
 *
 * RFC 9116 makes `Expires` mandatory, and an expired security.txt is worse
 * than publishing none at all — scanners flag it rather than ignoring it. The
 * file therefore carries a date that somebody has to move, and this is the
 * thing that remembers to ask.
 *
 * Deliberately a reminder and NOT a CI gate. Failing the build the day the
 * date passes would red whichever unrelated PR happened to push next, which is
 * the complaint #391 is about; the 30-day lead time is what makes a gate
 * unnecessary. Nothing here can fail a build or block a merge.
 *
 * Design (mirrors auto-close-duplicates.mjs): plain node, zero npm deps —
 * node: builtins plus global fetch against the GitHub REST API, authenticated
 * via process.env.GITHUB_TOKEN. Pure helpers are exported and main only runs
 * when the file is executed directly, so the date arithmetic is unit-testable
 * without a clock or a network.
 *
 * Idempotency: the issue body carries MARKER, and an existing open issue with
 * it is UPDATED rather than joined by a second one. A weekly cron that opened a
 * fresh issue every run would be worse than no reminder, because the noise is
 * what trains you to ignore it.
 *
 * CI consumption: .github/workflows/security-txt-expiry.yml, weekly cron plus
 * workflow_dispatch.
 *
 * Usage:
 *   GITHUB_TOKEN=… node scripts/check-security-txt-expiry.mjs \
 *     --repo=owner/name [--file=path] [--warn-days=30] [--dry-run]
 *
 * Exit codes: 0 clean run (whether or not it acted),
 *             1 API failure or an unreadable/malformed security.txt,
 *             2 bad usage.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const MARKER = '<!-- security-txt-expiry -->';
export const DEFAULT_WARN_DAYS = 30;

/**
 * RFC 3339 §5.6 `date-time`, anchored, with each field bounded so an
 * out-of-range component is rejected rather than silently rolled over.
 * Seconds and an offset (`Z` or ±HH:MM) are both required by that grammar.
 */
export const RFC3339_DATE_TIME =
  /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])[Tt](?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:[Zz]|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;

const API_BASE = 'https://api.github.com';
const DAY_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 30_000;
const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const DEFAULT_FILE = path.join(
  REPO_ROOT,
  'docs',
  'static',
  '.well-known',
  'security.txt'
);

// ---------------------------------------------------------------------------
// Pure helpers (exported for tests).
// ---------------------------------------------------------------------------

/** Parse argv into { repo, file, warnDays, dryRun }; throws Error on misuse. */
export function parseArgs(argv) {
  const get = name =>
    argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3);

  const repo = get('repo');
  if (!repo || !/^[^/\s]+\/[^/\s]+$/.test(repo)) {
    throw new Error('usage: --repo=owner/name is required');
  }

  const warnRaw = get('warn-days');
  const warnDays = warnRaw === undefined ? DEFAULT_WARN_DAYS : Number(warnRaw);
  if (!Number.isFinite(warnDays) || warnDays < 0) {
    throw new Error(
      `--warn-days must be a non-negative number, got "${warnRaw}"`
    );
  }

  return {
    repo,
    file: get('file') ?? DEFAULT_FILE,
    warnDays,
    dryRun: argv.includes('--dry-run'),
  };
}

/**
 * Pull the `Expires` value out of a security.txt body.
 *
 * Throws rather than returning null on absence or garbage. A silent "no date
 * found" is indistinguishable from "not due yet" once it reaches the caller,
 * and the failure mode of guessing wrong here is an expired file nobody is
 * told about — precisely what this script exists to prevent.
 *
 * RFC 9116 field names are case-insensitive and `#` starts a comment, so both
 * are handled rather than assumed away.
 */
export function parseExpires(text) {
  const lines = String(text ?? '')
    .split('\n')
    // Strip a UTF-8 BOM if the file was saved with one. Escaped rather than
    // written literally: a raw BOM here is invisible in review and trips
    // eslint's no-irregular-whitespace.
    .map(line => line.replace(/^\uFEFF/, '').trim())
    .filter(line => line && !line.startsWith('#'));

  const matches = lines
    .map(line => /^Expires\s*:\s*(.+)$/i.exec(line))
    .filter(Boolean)
    .map(m => m[1].trim());

  if (matches.length === 0) {
    throw new Error(
      'security.txt has no `Expires:` field (RFC 9116 requires one)'
    );
  }
  // RFC 9116 §2.5.5: exactly one Expires. Two dates means nobody knows which
  // one is authoritative, so refuse rather than pick.
  if (matches.length > 1) {
    throw new Error(
      `security.txt has ${matches.length} \`Expires:\` fields; RFC 9116 allows exactly one`
    );
  }

  const value = matches[0];

  // Format-check before parsing. RFC 9116 §2.5.5 imports `date-time` from
  // RFC 3339 §5.6, but `new Date()` is far more permissive than that and its
  // handling of non-ISO input is implementation-defined. Left to the Date
  // constructor, `Expires: August 15, 2027` parses happily — so this script
  // would report "364 days away, nothing to do" about a file that securitytxt
  // .org rejects. Policing this file is the whole job, so the check is here.
  if (!RFC3339_DATE_TIME.test(value)) {
    throw new Error(
      `security.txt has a non-RFC-3339 \`Expires:\` value: "${value}". ` +
        `RFC 9116 requires a full date-time with seconds and an offset, ` +
        `e.g. 2027-08-15T00:00:00.000Z`
    );
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(
      `security.txt has an unparseable \`Expires:\` value: "${value}"`
    );
  }

  // The regex bounds each field but cannot know that February has no 30th, and
  // JS silently rolls such a date forward instead of rejecting it.
  //
  // Validated on the calendar date ALONE, independent of the time and offset.
  // The first version of this compared `parsed.toISOString()` against the
  // input, which only works for a `Z` value — a legitimate `+05:30` timestamp
  // can shift the UTC date by a day, so that check had to be skipped for
  // offsets, and `2027-02-30T00:00:00+05:30` sailed through. Round-tripping
  // just the Y-M-D through Date.UTC has no such blind spot.
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    throw new Error(
      `security.txt has an \`Expires:\` date that does not exist: "${value}" ` +
        `(${year}-${String(month).padStart(2, '0')} has no day ${day})`
    );
  }

  return parsed;
}

/**
 * Whole days from `now` until `expires`. Negative once the date has passed.
 *
 * `now` is injected (same trick as ageInDays in auto-close-duplicates.mjs) so
 * every test is deterministic rather than dependent on the wall clock.
 *
 * trunc, not floor. Real dates are almost never a whole number of days away, so
 * the rounding direction shows up in the issue title. floor is right going
 * forward (9.99 days left really is 9 whole days) but wrong going back: it
 * turns -3.0001 into -4, and the issue then claims the file expired four days
 * ago when it expired three. trunc rounds toward zero, which is "whole days
 * elapsed" in both directions.
 */
export function daysUntil(expires, now = Date.now()) {
  const then =
    expires instanceof Date ? expires.getTime() : new Date(expires).getTime();
  const days = Math.trunc((then - new Date(now).getTime()) / DAY_MS);
  // Normalise -0. Math.trunc(-0.5) is -0, and `-0 < 0` is false, so a file
  // that expired a few hours ago would take the not-expired branch in
  // renderIssue and announce itself in the future tense. Returning +0 keeps
  // that day reading as "expires in 0 day(s)" — urgent either way, and the
  // body carries the exact timestamp — instead of silently mis-tensed.
  return days === 0 ? 0 : days;
}

/** True when the date is close enough (or past) to be worth an issue. */
export function shouldNotify(days, warnDays = DEFAULT_WARN_DAYS) {
  return days <= warnDays;
}

/** Title and body for the renewal issue. Pure, so the wording is testable. */
export function renderIssue(
  days,
  expires,
  { file = 'docs/static/.well-known/security.txt' } = {}
) {
  const iso = (
    expires instanceof Date ? expires : new Date(expires)
  ).toISOString();
  const expired = days < 0;

  const title = expired
    ? `security.txt EXPIRED ${Math.abs(days)} day(s) ago — renew now`
    : `security.txt expires in ${days} day(s) — renew it`;

  const lede = expired
    ? `\`${file}\` **expired on ${iso}**. An expired security.txt is worse than ` +
      `not publishing one: scanners flag it rather than ignoring it, so this ` +
      `is actively costing us until the date moves.`
    : `\`${file}\` expires on ${iso}, in ${days} day(s).`;

  const body = [
    MARKER,
    '',
    lede,
    '',
    '### What to do',
    '',
    '1. Re-verify the contacts still work — `security@bestax.io` reaches someone,',
    '   and the advisories URL still resolves.',
    '2. Check `Policy:` still points at a live page.',
    '3. Push `Expires:` out another year (RFC 3339, e.g. `2028-08-15T00:00:00.000Z`).',
    '4. Validate the result at https://securitytxt.org/ and close this issue.',
    '',
    `Renewing is a one-line edit to \`${file}\`.`,
    '',
    '<sub>Opened automatically by `.github/workflows/security-txt-expiry.yml`. ' +
      'This issue is updated in place rather than reopened weekly, so it will ' +
      'not multiply while it sits here.</sub>',
  ].join('\n');

  return { title, body };
}

/** The open issue carrying our marker, or undefined. */
export function findMarkerIssue(issues) {
  return (issues ?? []).find(
    issue =>
      !issue.pull_request &&
      typeof issue.body === 'string' &&
      issue.body.includes(MARKER)
  );
}

// ---------------------------------------------------------------------------
// GitHub REST client (global fetch).
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
      'User-Agent': 'bestax-security-txt-expiry',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    // A hung request must not stall the cron run.
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(
      `${method} ${url} failed: ${res.status} ${res.statusText} ${text.slice(0, 300)}`
    );
    err.status = res.status;
    throw err;
  }
  return res;
}

/**
 * Paginate a GET endpoint by following Link rel="next" (same helper shape as
 * auto-close-duplicates.mjs).
 *
 * Load-bearing rather than tidiness. The marker lookup below has to see EVERY
 * open issue: miss the reminder because it fell off page one and the script
 * concludes none exists and opens another, every single week. That is the
 * duplicate-issue spam this design is built to avoid, and it would arrive
 * silently the first time the repo carries more than 100 open issues and PRs
 * (40 today, so it is latent rather than live).
 */
async function getAllPages(path) {
  const items = [];
  let url = path;
  while (url) {
    const res = await api(url);
    items.push(...(await res.json()));
    const link = res.headers.get('link') ?? '';
    url = link.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null;
  }
  return items;
}

// ---------------------------------------------------------------------------
// Main.
// ---------------------------------------------------------------------------

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    process.exit(2);
  }

  const text = await readFile(opts.file, 'utf8');
  const expires = parseExpires(text);
  const days = daysUntil(expires);

  if (!shouldNotify(days, opts.warnDays)) {
    console.log(
      `security.txt expires ${expires.toISOString()} — ${days} day(s) away, ` +
        `more than the ${opts.warnDays}-day window. Nothing to do.`
    );
    return;
  }

  const relFile = path.relative(REPO_ROOT, opts.file) || opts.file;
  const { title, body } = renderIssue(days, expires, { file: relFile });

  if (opts.dryRun) {
    console.log(`[dry-run] would open or update an issue titled: ${title}`);
    return;
  }

  // Only open issues: a closed one means somebody handled a previous cycle,
  // and reopening it would bury this cycle's context under old discussion.
  // Paginated, not just the first page — see getAllPages.
  const existing = findMarkerIssue(
    await getAllPages(
      `/repos/${opts.repo}/issues?state=open&per_page=100&sort=created&direction=desc`
    )
  );

  if (existing) {
    await api(`/repos/${opts.repo}/issues/${existing.number}`, {
      method: 'PATCH',
      body: { title, body },
    });
    console.log(`Updated #${existing.number}: ${title}`);
    return;
  }

  // No labels on purpose. There is no plain `security` label in this repo, and
  // the nearest match — `needs-security-review` — is a refusal gate:
  // claude-repro, claude-fix, @claude and @bestaxbot all decline an item
  // carrying it until a maintainer clears it. Tagging an automated reminder
  // with that would wedge those entry points for no reason. Label it by hand
  // if a suitable one is ever added.
  const created = await api(`/repos/${opts.repo}/issues`, {
    method: 'POST',
    body: { title, body },
  });
  console.log(`Opened #${(await created.json()).number}: ${title}`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch(err => {
    console.error(err.message ?? err);
    process.exit(1);
  });
}
