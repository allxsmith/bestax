#!/usr/bin/env node
/**
 * Keep the `review-converged` label in step with deep-review PRs.
 *
 * A triage+ user applies `deep-review` to a same-repo PR to get the Claude
 * deep review on it, and then has to work out by hand when that review has
 * settled. This answers it from live data and labels the PR, so a PR that is
 * ready for human review shows up in the PR list. PRs labeled `ai-loop` are
 * out of scope: claude-pr-loop.yml hands those off with `needs-human-review`.
 *
 * A PR is in scope when it is open, its head branch is in this repository, it
 * carries `deep-review`, and it does not carry `ai-loop`. An in-scope PR has
 * converged when all of these hold:
 *
 * 1. Its newest deep-review summary (a review by the claude[bot] app that
 *    starts with the marker) was posted for the current head commit and
 *    leaves nothing open: a fresh review reporting `0 blocking`, or a verify
 *    pass reporting `0 open`.
 * 2. Every review thread on the PR is resolved.
 * 3. Every check run and commit status on the head commit finished as success,
 *    neutral or skipped, and there is at least one. The check run this
 *    workflow creates is left out so it cannot hold itself back.
 * 4. The PR does not carry `needs-security-review`.
 *
 * Converged without the label adds it. Not converged with the label removes
 * it. Everything else is left alone, and that includes every PR out of scope.
 *
 * Fail closed. A summary this cannot parse, a missing field, or a check in any
 * other state reads as not converged. An API error leaves that PR's label as
 * it was and fails the run, so a transient error can neither add the label nor
 * strip it.
 *
 * Review bodies are model-authored text on a public repository. They are only
 * matched against the fixed patterns below. They are never evaluated and never
 * printed. Values that do reach the log (check names, status contexts, API
 * error text) go through forLog first, and every line starts with a fixed
 * prefix, so no value can open a workflow command.
 *
 * Plain node and the global fetch with no npm dependencies, because the
 * workflow runs it on the runner's own Node without installing anything. Pure
 * helpers are exported for the test sibling, and main only runs when the file
 * is executed directly.
 *
 * Usage:
 *   GITHUB_TOKEN=... node scripts/review-converged.mjs --repo=owner/name \
 *     [--pr=N] [--dry-run]
 *
 * Without a PR number it sweeps every open PR. --dry-run reports what it would
 * do and writes nothing.
 *
 * Exit codes: 0 clean run, 1 an API error, 2 bad usage.
 */
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export const LABEL = 'review-converged';
export const SCOPE_LABEL = 'deep-review';
export const LOOP_LABEL = 'ai-loop';
export const FLAG_LABEL = 'needs-security-review';
export const MARKER = '<!-- claude-deep-review -->';

/**
 * The job name in review-converged.yml, which is also the name of the check
 * run its runs create. The test sibling holds the two equal.
 */
export const OWN_CHECK_NAME = 'Sync review-converged label';

/** Check run conclusions that count as passing. */
export const PASSING_CONCLUSIONS = new Set(['success', 'neutral', 'skipped']);

/**
 * The sentence the review prompt puts in place of the table when a fresh
 * review found nothing of any tier.
 */
export const NO_FINDINGS_LINE = 'No blocking defects found.';

/**
 * The summary headings, after headingText has taken off the heading markup.
 * The separators are the ones the prompt asks for plus their nearest ASCII
 * stand-ins. A count longer than four digits does not match.
 */
const FRESH_RE =
  /^Deep review[ \t]*[—–-]{1,2}[ \t]*(\d{1,4})[ \t]+blocking[ \t]*[·•|,][ \t]*(\d{1,4})[ \t]+advisory$/i;
const VERIFY_RE =
  /^Deep review[ \t]+\(verify\)[ \t]*[—–-]{1,2}[ \t]*(\d{1,4})[ \t]+resolved[ \t]*[·•|,][ \t]*(\d{1,4})[ \t]+open$/i;

const SHA_RE = /^[0-9a-f]{40}$/;
const API_BASE = 'https://api.github.com';
const FETCH_TIMEOUT_MS = 30_000;
const MAX_PAGES = 50;
const TAG = 'review-converged:';

/** Raised for a bad command line, which exits 2 rather than 1. */
export class UsageError extends Error {}

/**
 * Render a value for a log line. JSON.stringify escapes newlines, carriage
 * returns, quotes and control characters, so the value stays one line of
 * inert text and cannot end the line and start a workflow command. The same
 * helper as check-consumer-sbom.mjs, kept local so this script imports
 * nothing.
 */
export function forLog(value) {
  return JSON.stringify(String(value ?? ''));
}

/** A commit id cut to its short form, or the value made safe to log. */
function shortSha(sha) {
  return SHA_RE.test(sha ?? '') ? sha.slice(0, 7) : forLog(sha);
}

/** Parse argv. Throws UsageError on misuse. */
export function parseArgs(argv) {
  let repo;
  let pr = null;
  let dryRun = false;
  for (const arg of argv) {
    if (arg.startsWith('--repo=')) repo = arg.slice('--repo='.length);
    else if (arg.startsWith('--pr=')) {
      // Empty means sweep, so the workflow can always pass its input.
      const value = arg.slice('--pr='.length);
      if (value !== '') {
        if (!/^[1-9]\d{0,9}$/.test(value))
          throw new UsageError(
            `--pr must be a PR number, got ${forLog(value)}`
          );
        pr = Number(value);
      }
    } else if (arg === '--dry-run') dryRun = true;
    else throw new UsageError(`unknown argument ${forLog(arg)}`);
  }
  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo))
    throw new UsageError('--repo=owner/name is required');
  return { repo, pr, dryRun };
}

/**
 * True for the Claude GitHub App. The login alone is not enough: `claude`
 * with no suffix is an ordinary User account on GitHub, so the account type
 * is what ties a review to the app. REST spells the app `claude[bot]` and
 * GraphQL spells it `claude`, and both carry type Bot.
 */
export function isDeepReviewAuthor(user) {
  return user?.type === 'Bot' && /^claude(\[bot\])?$/.test(user.login ?? '');
}

/**
 * The newest deep-review summary in a PR's reviews, or null. A summary is a
 * review by the app whose body contains the marker anywhere. parseSummary
 * then requires the marker on the first line, so a newest review that only
 * quotes it reads as unparseable instead of letting an older one decide.
 */
export function newestSummary(reviews) {
  let newest = null;
  for (const review of reviews ?? []) {
    if (!isDeepReviewAuthor(review?.user)) continue;
    if (typeof review.body !== 'string' || !review.body.includes(MARKER))
      continue;
    // A pending review has no submitted_at and is not visible to us anyway.
    const at = Date.parse(review.submitted_at ?? '');
    if (!Number.isFinite(at)) continue;
    if (
      !newest ||
      at > newest.at ||
      (at === newest.at && review.id > newest.review.id)
    )
      newest = { review, at };
  }
  return newest?.review ?? null;
}

/**
 * The text of a heading line with its markup taken off. Covers the shapes the
 * deep review has posted: an ATX heading (`## ...`), an HTML heading
 * (`<h2>...</h2>`), and a bare line, which is how a setext heading's first
 * line reads. Bold wrapping is taken off too.
 */
function headingText(line) {
  let text = line.trim();
  const atx = /^#{1,6}[ \t]+(.*?)(?:[ \t]+#+)?$/.exec(text);
  const html = /^<h([1-6])>(.*)<\/h\1>$/i.exec(text);
  if (atx) text = atx[1];
  else if (html) text = html[2];
  text = text.trim();
  const bold = /^\*\*(.+)\*\*$/.exec(text);
  return bold ? bold[1].trim() : text;
}

/**
 * Read a summary body. Returns one of
 *   { kind: 'fresh', blocking, advisory }
 *   { kind: 'verify', resolved, open }
 *   { kind: 'unparseable', why }
 * The heading is the first non-blank line after the marker line.
 */
export function parseSummary(body) {
  const lines = String(body ?? '').split(/\r?\n/);
  if (lines[0].trim() !== MARKER)
    return { kind: 'unparseable', why: 'the marker is not its first line' };
  const at = lines.findIndex((line, i) => i > 0 && line.trim() !== '');
  if (at === -1) return { kind: 'unparseable', why: 'it has no heading' };
  const heading = headingText(lines[at]);
  const fresh = FRESH_RE.exec(heading);
  if (fresh) {
    const blocking = Number(fresh[1]);
    // The zero-findings sentence beside a heading that counts blocking
    // findings is a contradiction, and a contradiction is not a zero.
    if (blocking > 0 && lines.some(line => line.trim() === NO_FINDINGS_LINE))
      return {
        kind: 'unparseable',
        why: `its heading counts blocking findings beside "${NO_FINDINGS_LINE}"`,
      };
    return { kind: 'fresh', blocking, advisory: Number(fresh[2]) };
  }
  const verify = VERIFY_RE.exec(heading);
  if (verify)
    return {
      kind: 'verify',
      resolved: Number(verify[1]),
      open: Number(verify[2]),
    };
  return { kind: 'unparseable', why: 'its heading matches neither shape' };
}

/** The label names on a PR, ignoring anything that is not a string. */
export function labelNames(pr) {
  return (pr?.labels ?? [])
    .map(label => label?.name)
    .filter(name => typeof name === 'string');
}

/** Why a PR is out of scope, or null when it is in scope. */
export function scopeOf(pr, repo) {
  const labels = labelNames(pr);
  if (pr?.state !== 'open') return 'not open';
  // A fork whose repository was deleted has a null head repo, and lands here.
  const head = String(pr?.head?.repo?.full_name ?? '').toLowerCase();
  if (head !== repo.toLowerCase()) return 'head branch is not in this repo';
  if (!labels.includes(SCOPE_LABEL)) return `no ${SCOPE_LABEL} label`;
  if (labels.includes(LOOP_LABEL))
    return `${LOOP_LABEL} PR, which claude-pr-loop.yml hands off`;
  return null;
}

/** True for a check run this workflow created. */
function isOwnCheck(run) {
  return run?.name === OWN_CHECK_NAME && run?.app?.slug === 'github-actions';
}

/**
 * The newest status per context. The combined status endpoint already
 * returns one per context, and this keeps the answer right if it ever
 * returns more.
 */
export function latestStatuses(statuses) {
  const byContext = new Map();
  for (const status of statuses ?? []) {
    const key = String(status?.context ?? '');
    const at = Date.parse(status?.updated_at ?? status?.created_at ?? '') || 0;
    const prev = byContext.get(key);
    if (
      !prev ||
      at > prev.at ||
      (at === prev.at && (status?.id ?? 0) > (prev.status?.id ?? 0))
    )
      byContext.set(key, { status, at });
  }
  return [...byContext.values()].map(entry => entry.status);
}

/** Everything about the head commit's checks that stops convergence. */
export function checkProblems(checkRuns, statuses) {
  const problems = [];
  const runs = (checkRuns ?? []).filter(run => !isOwnCheck(run));
  for (const run of runs) {
    if (run?.status !== 'completed')
      problems.push(`check ${forLog(run?.name)} is ${forLog(run?.status)}`);
    else if (!PASSING_CONCLUSIONS.has(run.conclusion))
      problems.push(
        `check ${forLog(run.name)} concluded ${forLog(run.conclusion)}`
      );
  }
  const latest = latestStatuses(statuses);
  for (const status of latest) {
    if (status?.state !== 'success')
      problems.push(
        `status ${forLog(status?.context)} is ${forLog(status?.state)}`
      );
  }
  // Nothing reported yet is not the same as everything passed.
  if (!runs.length && !latest.length)
    problems.push('no check runs or statuses on the head commit');
  return problems;
}

/** Every reason an in-scope PR has not converged. Empty means converged. */
export function convergenceProblems({
  pr,
  reviews,
  threads,
  checkRuns,
  statuses,
}) {
  const problems = [];
  const head = pr?.head?.sha;
  const summary = newestSummary(reviews);
  if (!summary) problems.push('no deep-review summary');
  else {
    if (!SHA_RE.test(head ?? '') || summary.commit_id !== head)
      problems.push(
        `the newest summary is for ${shortSha(summary.commit_id)}, ` +
          `not the head ${shortSha(head)}`
      );
    const parsed = parseSummary(summary.body);
    if (parsed.kind === 'unparseable')
      problems.push(`the newest summary did not parse: ${parsed.why}`);
    else if (parsed.kind === 'fresh' && parsed.blocking > 0)
      problems.push(`the newest summary reports ${parsed.blocking} blocking`);
    else if (parsed.kind === 'verify' && parsed.open > 0)
      problems.push(`the newest summary leaves ${parsed.open} open`);
  }
  // A thread with no isResolved field counts as open.
  const unresolved = (threads ?? []).filter(t => t?.isResolved !== true);
  if (unresolved.length)
    problems.push(`${unresolved.length} unresolved review thread(s)`);
  problems.push(...checkProblems(checkRuns, statuses));
  if (labelNames(pr).includes(FLAG_LABEL))
    problems.push(`carries ${FLAG_LABEL}`);
  return problems;
}

/** 'add', 'remove' or 'none'. */
export function planAction(hasLabel, converged) {
  if (converged && !hasLabel) return 'add';
  if (!converged && hasLabel) return 'remove';
  return 'none';
}

/**
 * The whole decision for one PR over data already fetched. Returns
 * { number, skip, problems, action }, where skip is the out-of-scope reason
 * or null.
 */
export function decide({ repo, pr, reviews, threads, checkRuns, statuses }) {
  const number = pr?.number;
  const skip = scopeOf(pr, repo);
  if (skip) return { number, skip, problems: [], action: 'none' };
  const problems = convergenceProblems({
    pr,
    reviews,
    threads,
    checkRuns,
    statuses,
  });
  const hasLabel = labelNames(pr).includes(LABEL);
  return {
    number,
    skip: null,
    problems,
    action: planAction(hasLabel, problems.length === 0),
  };
}

// ---------------------------------------------------------------------------
// GitHub API client. The token only ever goes to API_BASE: a pagination link
// pointing anywhere else is refused.
// ---------------------------------------------------------------------------

/** The rel="next" URL in a Link header, or null. */
export function nextLink(header) {
  return /<([^>]+)>;\s*rel="next"/.exec(header ?? '')?.[1] ?? null;
}

export function createClient({
  token,
  fetchImpl = globalThis.fetch,
  base = API_BASE,
}) {
  async function request(method, url, body, allowed = []) {
    const full = url.startsWith(`${base}/`) ? url : `${base}${url}`;
    if (!full.startsWith(`${base}/`))
      throw new Error(`refusing a request outside ${base}`);
    const res = await fetchImpl(full, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'bestax-review-converged',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      // A hung request must not hold the run until the job timeout.
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok && !allowed.includes(res.status)) {
      const text = await res.text().catch(() => '');
      throw new Error(
        `${method} ${url} failed with HTTP ${res.status} ` +
          forLog(text.slice(0, 200))
      );
    }
    return res;
  }

  return {
    async json(path) {
      return (await request('GET', path)).json();
    },

    /** Every item across pages, taken from `key` when the page is an object. */
    async pages(path, key) {
      const items = [];
      let url = path;
      for (let page = 0; url; page++) {
        if (page >= MAX_PAGES)
          throw new Error(`GET ${path} ran past ${MAX_PAGES} pages`);
        const res = await request('GET', url);
        const data = await res.json();
        const list = key ? data?.[key] : data;
        if (!Array.isArray(list))
          throw new Error(`GET ${path} returned no ${key ?? 'array'}`);
        items.push(...list);
        url = nextLink(res.headers.get('link'));
        if (url && !url.startsWith(`${base}/`))
          throw new Error(`GET ${path} paginated off ${base}, refusing`);
      }
      return items;
    },

    async graphql(query, variables) {
      const res = await request('POST', '/graphql', { query, variables });
      const data = await res.json();
      if (data?.errors?.length || !data?.data)
        throw new Error(
          `GraphQL query failed: ${forLog(data?.errors?.[0]?.message)}`
        );
      return data.data;
    },

    async addLabel(repo, number, label) {
      await request('POST', `/repos/${repo}/issues/${number}/labels`, {
        labels: [label],
      });
    },

    /** A label that is already gone is not an error. */
    async removeLabel(repo, number, label) {
      await request(
        'DELETE',
        `/repos/${repo}/issues/${number}/labels/${encodeURIComponent(label)}`,
        undefined,
        [404]
      );
    },
  };
}

const THREADS_QUERY = `query($owner: String!, $name: String!, $number: Int!, $after: String) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      reviewThreads(first: 100, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes { isResolved }
      }
    }
  }
}`;

/** Every review thread on a PR, as { isResolved } nodes. */
export async function fetchThreads(client, repo, number) {
  const [owner, name] = repo.split('/');
  const threads = [];
  let after = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await client.graphql(THREADS_QUERY, {
      owner,
      name,
      number,
      after,
    });
    const conn = data?.repository?.pullRequest?.reviewThreads;
    if (!conn || !Array.isArray(conn.nodes))
      throw new Error('the GraphQL response has no reviewThreads');
    threads.push(...conn.nodes);
    if (!conn.pageInfo?.hasNextPage) return threads;
    const cursor = conn.pageInfo.endCursor;
    if (!cursor || cursor === after)
      throw new Error('reviewThreads pagination did not advance');
    after = cursor;
  }
  throw new Error(`reviewThreads ran past ${MAX_PAGES} pages`);
}

/** Fetch what decide needs for one PR and decide. */
export async function evaluate(client, repo, pr) {
  if (scopeOf(pr, repo)) return decide({ repo, pr });
  const sha = pr.head.sha;
  if (!SHA_RE.test(sha ?? '')) throw new Error('the head is not a commit id');
  const reviews = await client.pages(
    `/repos/${repo}/pulls/${pr.number}/reviews?per_page=100`
  );
  const threads = await fetchThreads(client, repo, pr.number);
  const checkRuns = await client.pages(
    `/repos/${repo}/commits/${sha}/check-runs?per_page=100`,
    'check_runs'
  );
  const statuses = await client.pages(
    `/repos/${repo}/commits/${sha}/status?per_page=100`,
    'statuses'
  );
  return decide({ repo, pr, reviews, threads, checkRuns, statuses });
}

/**
 * Apply a decision. Before adding, the PR is read again: a push or a label
 * change that landed while it was evaluated means the decision was made for
 * a state that is gone, so it is dropped. The push starts CI, and CI's
 * completion runs this again. Removing needs no such check, because a moved
 * head has no summary for it yet and would not converge either.
 */
async function apply(client, repo, pr, decision, dryRun) {
  if (decision.action === 'add') {
    const now = await client.json(`/repos/${repo}/pulls/${pr.number}`);
    if (scopeOf(now, repo) || now.head?.sha !== pr.head.sha) return 'stale';
    if (labelNames(now).includes(LABEL)) return 'already set';
  }
  if (dryRun) return 'dry run, not written';
  if (decision.action === 'add') await client.addLabel(repo, pr.number, LABEL);
  else await client.removeLabel(repo, pr.number, LABEL);
  return 'written';
}

/** Summarize problems for one log line, capped so a long list stays short. */
function describe(problems) {
  const shown = problems.slice(0, 5).join(', ');
  const more = problems.length - 5;
  return more > 0 ? `${shown}, and ${more} more` : shown;
}

/**
 * Run the sync. Returns the exit code. `fetchImpl` and `log` are injectable so
 * the test sibling can drive it end to end without the network.
 */
export async function run({
  argv,
  env,
  fetchImpl = globalThis.fetch,
  log = console.log,
}) {
  const { repo, pr: only, dryRun } = parseArgs(argv);
  if (!env.GITHUB_TOKEN) throw new UsageError('GITHUB_TOKEN is not set');
  const client = createClient({ token: env.GITHUB_TOKEN, fetchImpl });
  const prs = only
    ? [await client.json(`/repos/${repo}/pulls/${only}`)]
    : await client.pages(`/repos/${repo}/pulls?state=open&per_page=100`);

  log(
    `${TAG} repo=${repo} ${only ? `pr=${only}` : 'sweep'}` +
      (dryRun ? ' dry-run' : '')
  );
  let failed = 0;
  for (const pr of prs) {
    const number = Number(pr?.number);
    try {
      const decision = await evaluate(client, repo, pr);
      const labels = labelNames(pr);
      if (decision.skip) {
        // A sweep passes every open PR, so only name the ones that have
        // something to do with this label.
        if (only || labels.includes(SCOPE_LABEL) || labels.includes(LABEL))
          log(`${TAG} #${number} skipped (${decision.skip})`);
        continue;
      }
      const state = decision.problems.length
        ? `not converged: ${describe(decision.problems)}`
        : 'converged';
      if (decision.action === 'none') {
        log(`${TAG} #${number} ${state}, label unchanged`);
        continue;
      }
      const outcome = await apply(client, repo, pr, decision, dryRun);
      log(`${TAG} #${number} ${state}, ${decision.action} label: ${outcome}`);
      // A notice carries only the PR number and fixed text.
      if (outcome === 'written')
        log(
          `::notice title=${LABEL}::#${number} ${decision.action === 'add' ? 'labeled' : 'unlabeled'}`
        );
    } catch (err) {
      failed++;
      log(
        `${TAG} #${number} error, label left as it was: ${forLog(err?.message)}`
      );
    }
  }
  return failed ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  run({ argv: process.argv.slice(2), env: process.env }).then(
    code => {
      process.exitCode = code;
    },
    err => {
      const usage = err instanceof UsageError;
      console.error(
        `${TAG} ${usage ? 'usage error: ' : ''}${forLog(err?.message)}`
      );
      process.exitCode = usage ? 2 : 1;
    }
  );
}
