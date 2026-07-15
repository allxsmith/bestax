#!/usr/bin/env node
/**
 * Auto-close silence-approved duplicate issues (#289, PR B).
 *
 * Ported from oven-sh/bun's scripts/auto-close-duplicates.ts, with the
 * objection window widened from 3 to 14 days (deliberate owner choice).
 *
 * An issue is a close candidate when its LATEST bot-authored comment carries
 * the `<!-- ai-triage:dedupe -->` idempotency marker AND a machine-parseable
 * `Duplicate of #N` line (posted by the ai-triage workflow, PR A of #289).
 * The candidate is closed only if ALL of these hold:
 *   - the marker comment is at least --wait-days old (default 14), AND
 *   - no non-bot user commented after the marker comment (objection), AND
 *   - the marker comment has no 👎 reaction (objection), AND
 *   - the issue was never reopened (a reopened issue is never auto-closed
 *     again — the timeline keeps its `reopened` event forever), AND
 *   - the target issue #N exists and is not the issue itself.
 *
 * Design (mirrors check-conformance.mjs / gen-component-catalog.mjs): plain
 * node, zero npm deps — node: builtins plus the global fetch against the
 * GitHub REST API, authenticated via process.env.GITHUB_TOKEN. Every action
 * and every logged skip names the issue number and the reason, because the
 * log line is what the operator acts on. Pure helpers are exported and main
 * only runs when the file is executed directly, so the parsing/veto logic is
 * unit-testable with `node -e`.
 *
 * CI consumption: .github/workflows/auto-close-duplicates.yml runs this on a
 * daily cron, passing --mode straight from the AI_TRIAGE_AUTOCLOSE repo
 * variable (`dry-run` logs the would-close list; `on` comments and closes
 * with state_reason=duplicate, falling back to not_planned on a 422).
 *
 * Usage:
 *   GITHUB_TOKEN=… node scripts/auto-close-duplicates.mjs \
 *     --repo=owner/name --mode=dry-run|on [--wait-days=14]
 *
 * Exit codes: 0 clean run (including a polite rate-limit abort),
 *             1 API or close failure, 2 bad usage.
 */
import process from 'node:process';
import { setTimeout as sleep } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

export const MARKER = '<!-- ai-triage:dedupe -->';
export const DUPLICATE_RE = /Duplicate of #(\d+)/;

const API_BASE = 'https://api.github.com';
const DAY_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_FLOOR = 20;
const FETCH_TIMEOUT_MS = 30_000;
const RETRY_AFTER_FALLBACK_MS = 30_000;
const RATE_LIMIT_RETRIES = 2;

// ---------------------------------------------------------------------------
// Pure helpers (exported for tests).
// ---------------------------------------------------------------------------

/** Parse argv into { repo, mode, waitDays }; throws Error(message) on misuse. */
export function parseArgs(argv) {
  let repo, mode;
  let waitDays = 14;
  for (const arg of argv) {
    if (arg.startsWith('--repo=')) repo = arg.slice('--repo='.length);
    else if (arg.startsWith('--mode=')) mode = arg.slice('--mode='.length);
    else if (arg.startsWith('--wait-days='))
      waitDays = Number(arg.slice('--wait-days='.length));
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!repo || !/^[^/\s]+\/[^/\s]+$/.test(repo))
    throw new Error('--repo=owner/name is required');
  if (mode !== 'dry-run' && mode !== 'on')
    throw new Error('--mode=dry-run|on is required');
  if (!Number.isInteger(waitDays) || waitDays < 1)
    throw new Error('--wait-days must be a positive integer');
  return { repo, mode, waitDays };
}

/** True for bot accounts: user.type === 'Bot' or a `[bot]` login suffix. */
export function isBot(user) {
  if (!user) return false;
  return user.type === 'Bot' || /\[bot\]$/.test(user.login ?? '');
}

/**
 * Find the LATEST bot-authored comment that carries the dedupe marker and a
 * parseable `Duplicate of #N`. Matched by marker + Bot author, never a
 * specific login (Bun's convention): the triage workflow posts via
 * GITHUB_TOKEN as github-actions[bot] since #312, while pre-#312 comments
 * are claude[bot]. Returns { comment, target } or null. `comments` must be
 * in ascending created order (the REST API default for issue comments).
 */
export function findMarkerComment(comments) {
  for (let i = comments.length - 1; i >= 0; i--) {
    const c = comments[i];
    if (!isBot(c.user)) continue;
    if (!c.body?.includes(MARKER)) continue;
    const m = c.body.match(DUPLICATE_RE);
    if (!m) continue;
    return { comment: c, target: Number(m[1]) };
  }
  return null;
}

/** Whole days elapsed since the ISO timestamp. */
export function ageInDays(createdAt, now = Date.now()) {
  return Math.floor((now - Date.parse(createdAt)) / DAY_MS);
}

/**
 * First non-bot comment posted after the marker comment (an objection), or
 * null. Compares by created_at, with id as the tiebreaker for same-second
 * posts.
 */
export function humanCommentAfter(comments, marker) {
  const markerTime = Date.parse(marker.created_at);
  return (
    comments.find(c => {
      const t = Date.parse(c.created_at);
      const after = t > markerTime || (t === markerTime && c.id > marker.id);
      return after && !isBot(c.user);
    }) ?? null
  );
}

// ---------------------------------------------------------------------------
// GitHub REST client (global fetch, Link-header pagination, rate-limit floor).
// ---------------------------------------------------------------------------

let rateLimitRemaining = Infinity;

async function api(pathOrUrl, { method = 'GET', body, okStatuses } = {}) {
  const url = pathOrUrl.startsWith('https://')
    ? pathOrUrl
    : `${API_BASE}${pathOrUrl}`;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'bestax-auto-close-duplicates',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      // A hung request must not stall the whole cron run.
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const remaining = res.headers.get('x-ratelimit-remaining');
    if (remaining !== null) rateLimitRemaining = Number(remaining);
    // 403/429 is (usually) a primary/secondary rate limit: honor Retry-After
    // (falling back to a fixed pause when absent) and retry before failing.
    if (
      (res.status === 403 || res.status === 429) &&
      !okStatuses?.includes(res.status) &&
      attempt < RATE_LIMIT_RETRIES
    ) {
      const retryAfterSec = Number(res.headers.get('retry-after'));
      const delayMs =
        Number.isFinite(retryAfterSec) && retryAfterSec > 0
          ? retryAfterSec * 1000
          : RETRY_AFTER_FALLBACK_MS;
      console.log(
        `${method} ${url}: HTTP ${res.status} (rate limited?), retrying in ` +
          `${delayMs / 1000}s (attempt ${attempt + 1}/${RATE_LIMIT_RETRIES})`
      );
      await res.text().catch(() => ''); // drain the body before retrying
      await sleep(delayMs);
      continue;
    }
    if (!res.ok && !okStatuses?.includes(res.status)) {
      const text = await res.text().catch(() => '');
      const err = new Error(
        `${method} ${url} failed: ${res.status} ${res.statusText} ${text.slice(0, 300)}`
      );
      err.status = res.status;
      throw err;
    }
    return res;
  }
}

/** Paginate a GET endpoint by following Link rel="next" headers. */
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

class RateLimitAbort extends Error {}

function checkRateBudget() {
  if (rateLimitRemaining < RATE_LIMIT_FLOOR) {
    throw new RateLimitAbort(
      `rate limit nearly exhausted (${rateLimitRemaining} requests remaining ` +
        `< floor of ${RATE_LIMIT_FLOOR})`
    );
  }
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`Usage error: ${err.message}`);
    console.error(
      'Usage: node scripts/auto-close-duplicates.mjs --repo=owner/name ' +
        '--mode=dry-run|on [--wait-days=14]'
    );
    process.exit(2);
  }
  const { repo, mode, waitDays } = opts;
  if (!process.env.GITHUB_TOKEN) {
    console.error('Usage error: GITHUB_TOKEN environment variable is required');
    process.exit(2);
  }

  const now = Date.now();
  const counts = { scanned: 0, closed: 0, deferred: 0, vetoed: 0, failed: 0 };

  console.log(
    `auto-close-duplicates: repo=${repo} mode=${mode} wait-days=${waitDays}`
  );

  try {
    const issues = await getAllPages(
      `/repos/${repo}/issues?state=open&per_page=100`
    );
    for (const issue of issues) {
      // The issues list endpoint also returns PRs; and bot-authored issues
      // (e.g. bestaxbot automation) are out of scope for auto-close.
      if (issue.pull_request || isBot(issue.user)) continue;
      counts.scanned++;

      // Isolate per-issue failures: one bad issue (transferred target, a
      // stray 5xx, …) must not abort the scan of every remaining issue.
      // Only the polite rate-limit abort escapes to the outer catch.
      try {
        checkRateBudget();

        const comments = await getAllPages(
          `/repos/${repo}/issues/${issue.number}/comments?per_page=100`
        );
        const marker = findMarkerComment(comments);
        if (!marker) continue; // no dedupe verdict on this issue — skip silently

        const { comment, target } = marker;
        const age = ageInDays(comment.created_at, now);

        // Age gate: the objection window must have fully elapsed.
        if (age < waitDays) {
          console.log(
            `#${issue.number}: deferred (age ${age}d < ${waitDays}d)`
          );
          counts.deferred++;
          continue;
        }

        // Veto (a): any non-bot comment after the marker is an objection.
        const objection = humanCommentAfter(comments, comment);
        if (objection) {
          console.log(
            `#${issue.number}: vetoed (comment by @${objection.user?.login} ` +
              `after the dedupe marker)`
          );
          counts.vetoed++;
          continue;
        }

        // Veto (b): a 👎 on the marker comment is an objection.
        checkRateBudget();
        const reactions = await getAllPages(
          `/repos/${repo}/issues/comments/${comment.id}/reactions?per_page=100`
        );
        if (reactions.some(r => r.content === '-1')) {
          console.log(
            `#${issue.number}: vetoed (👎 reaction on the dedupe marker comment)`
          );
          counts.vetoed++;
          continue;
        }

        // Veto (c): a previously reopened issue is never auto-closed again.
        checkRateBudget();
        const timeline = await getAllPages(
          `/repos/${repo}/issues/${issue.number}/timeline?per_page=100`
        );
        if (timeline.some(e => e.event === 'reopened')) {
          console.log(
            `#${issue.number}: vetoed (issue was reopened at some point)`
          );
          counts.vetoed++;
          continue;
        }

        // Sanity: the duplicate target must be a real, different issue.
        if (target === issue.number) {
          console.log(
            `#${issue.number}: vetoed (marker points at the issue itself)`
          );
          counts.vetoed++;
          continue;
        }
        checkRateBudget();
        const targetRes = await api(`/repos/${repo}/issues/${target}`, {
          okStatuses: [404, 410],
        });
        if (!targetRes.ok) {
          console.log(
            `#${issue.number}: vetoed (duplicate target #${target} does not ` +
              `exist: HTTP ${targetRes.status})`
          );
          counts.vetoed++;
          continue;
        }

        if (mode === 'dry-run') {
          console.log(
            `WOULD CLOSE #${issue.number} as duplicate of #${target} ` +
              `(marker age ${age}d)`
          );
          counts.closed++;
          continue;
        }

        // mode === 'on': comment, then close.
        checkRateBudget();
        await api(`/repos/${repo}/issues/${issue.number}/comments`, {
          method: 'POST',
          body: {
            body:
              `Duplicate of #${target} — automatically closed after ` +
              `${waitDays} days with no objection. If this is wrong, comment ` +
              `here or reopen and it will never be auto-closed again.`,
          },
        });
        try {
          await api(`/repos/${repo}/issues/${issue.number}`, {
            method: 'PATCH',
            body: { state: 'closed', state_reason: 'duplicate' },
          });
        } catch (err) {
          if (err.status !== 422) throw err;
          // Older/limited APIs reject state_reason=duplicate; fall back.
          console.log(
            `#${issue.number}: state_reason=duplicate rejected (422), ` +
              `falling back to not_planned`
          );
          await api(`/repos/${repo}/issues/${issue.number}`, {
            method: 'PATCH',
            body: { state: 'closed', state_reason: 'not_planned' },
          });
        }
        console.log(`CLOSED #${issue.number} as duplicate of #${target}`);
        counts.closed++;
      } catch (err) {
        if (err instanceof RateLimitAbort) throw err;
        console.error(`#${issue.number}: skipped after error: ${err.message}`);
        counts.failed++;
      }
    }
  } catch (err) {
    if (err instanceof RateLimitAbort) {
      console.log(`Aborting politely: ${err.message}. Try again later.`);
    } else {
      console.error(`API failure: ${err.message}`);
      printSummary(mode, counts);
      process.exit(1);
    }
  }

  printSummary(mode, counts);
}

function printSummary(mode, counts) {
  const closedLabel = mode === 'on' ? 'closed' : 'would-close';
  console.log(
    `Summary: scanned=${counts.scanned} ${closedLabel}=${counts.closed} ` +
      `deferred=${counts.deferred} vetoed=${counts.vetoed} ` +
      `failed=${counts.failed}`
  );
}

// Run only when executed directly (keeps the pure helpers importable).
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
