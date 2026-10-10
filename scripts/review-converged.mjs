#!/usr/bin/env node
/**
 * Keep the `review-converged` label in step with deep-review PRs.
 *
 * A triage+ user applies `deep-review` to a same-repo PR to get the Claude
 * deep review on it, and then has to work out by hand when that review has
 * settled. This answers it from live data and labels the PR, so a PR that is
 * ready for human review shows up in the PR list. The bestaxbot App's own PRs
 * are judged by the same rule, and `ai-loop` alone puts them in scope: the bot
 * applies it to start the fresh review and cycles `deep-review` only to ask
 * for a later one, so a fresh review with no findings leaves its PR without
 * `deep-review`. The bot hands off when this label arrives. Any other PR
 * carrying `ai-loop` is out of scope, `deep-review` or not: claude-pr-loop.yml
 * drives those and hands them off with `needs-human-review`.
 *
 * A PR is in scope when it is open, its head branch is in this repository, its
 * base is the default branch, and it carries `deep-review` without `ai-loop`,
 * or either of them on a PR the App opened (isAppPr). The base matters
 * because CI runs only on pull requests to main (ci.yml): a PR stacked on
 * another branch gets no CI, and the skipped check runs it does get would
 * read as passing. An in-scope PR has converged when all of these hold:
 *
 * 1. Its newest deep-review summary (a review by the claude[bot] app that
 *    starts with the marker) is pinned to the current head commit and leaves
 *    nothing open: a fresh review reporting no findings (`0 blocking` and
 *    `0 advisory`), or a verify pass reporting `0 open`.
 * 2. A fresh review stands behind the head. A verify pass settles the threads
 *    an earlier review left and reviews no commits, so on its own it proves
 *    nothing about the code, even though its summary is pinned to the head.
 *    Take the newest fresh summary, and count its findings as blocking plus
 *    advisory:
 *    - If it reports no findings, it must be pinned to the head commit.
 *      Otherwise commits pushed since it would count as reviewed when nothing
 *      reviewed them.
 *    - If it reports findings, the threads it opened decide, not the counts
 *      in the summaries: a verify pass also resolves threads an earlier
 *      review left, so its count can cover a finding that never became a
 *      thread. The review posts each finding, advisories included, as its
 *      own inline thread before it posts its summary, so its threads are the
 *      ones the app opened on the commit the summary is pinned to, after the
 *      summary before it and no later than its own. There must be at least as
 *      many as it reports findings. Each must be settled by a verify pass:
 *      resolved by the app, with a reply from the app after the fresh
 *      summary. The pass that settled the last of them is the first summary
 *      at or after that reply. It must be a verify pass pinned to the commit
 *      the reply was posted on, and to the head commit. It is the last review
 *      to read the code for those findings, so a push after it was read by no
 *      review, and only a new fresh review can cover it. Commits pushed
 *      alongside the fixes ride on that pass, which re-checked only the code
 *      its threads point at.
 *    A summary between it and the newest that does not parse fails closed,
 *    since it may have been a fresh review with blocking findings.
 *
 *    The timestamps hold because claude-review.yml's concurrency group never
 *    runs two deep reviews of one PR at once. A verify pass that posts no
 *    summary leaves its replies to the next summary, and the commit check
 *    catches a push in between. The costs: a thread resolved by hand holds
 *    the label back until it is reopened and a verify pass settles it, or a
 *    fresh review runs. And one gap remains. A run cancelled before its
 *    summary can leave threads on the same commit as the next fresh review,
 *    which counts them as its own, so they can stand in for a finding that
 *    review never posted.
 * 3. Every review thread on the PR is resolved.
 * 4. On the head commit, the newest check run per app and name (latestRuns)
 *    and the newest status per context finished as success, neutral or
 *    skipped, and there is at least one. The check run this workflow creates
 *    is left out so it cannot hold itself back.
 * 5. The PR does not carry `needs-security-review`.
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
/** In scope with this, unless on an `ai-loop` PR the App did not open. */
export const SCOPE_LABEL = 'deep-review';
/** A PR the App opened is in scope with this alone, and any other is out. */
export const LOOP_LABEL = 'ai-loop';
export const FLAG_LABEL = 'needs-security-review';

/** The bestaxbot App's bot user, as REST and event payloads spell it. */
export const APP_LOGIN = 'bestaxbot[bot]';
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
 *
 * Pinning the login goes against rule 6 in .github/CLAUDE.md on purpose. That
 * rule is for finding a machine comment. This probe grants trust instead,
 * because the label certifies a review. Accepting any Bot-type author would
 * let any app that can post a review, or a workflow's GITHUB_TOKEN, post a
 * summary that counts by putting the marker on its first line. An identity
 * change fails closed: no summary counts, so no PR converges.
 */
export function isDeepReviewAuthor(user) {
  return user?.type === 'Bot' && /^claude(\[bot\])?$/.test(user.login ?? '');
}

/**
 * True for the bestaxbot App's bot user. Pinned by type and login for the
 * reason isDeepReviewAuthor gives: GitHub usernames cannot contain brackets,
 * so no account but the App can have this login, and a User claiming it is
 * not the App. The bare `bestaxbot` is the machine User the older workflows
 * post as, which this does not match.
 */
export function isBestaxbotApp(user) {
  return user?.type === 'Bot' && user?.login === APP_LOGIN;
}

/** True when the App opened `pr`, a REST or event-payload pull request. */
export function isAppPr(pr) {
  return isBestaxbotApp(pr?.user);
}

/**
 * True when the app resolved a review thread. GraphQL types `resolvedBy` as a
 * User, so the app reads as the User `claude[bot]` there and the account type
 * cannot tie it to the app. The login can: GitHub usernames cannot contain
 * brackets, so no other account can have this one.
 */
export function isDeepReviewResolver(user) {
  return user?.login === 'claude[bot]';
}

/**
 * The facts this script reads off one review thread node from THREADS_QUERY:
 * whether it is resolved and by whom, and for its opening comment and its
 * latest comments, when each was posted, by whom, on which commit the thread
 * was opened, and which commit the PR head was on when the comment was posted
 * (the commit of the review GitHub files each comment under). A missing field
 * reads as a value that matches nothing.
 */
export function threadFacts(node) {
  const comment = c => ({
    at: Date.parse(c?.createdAt ?? ''),
    author: { login: c?.author?.login, type: c?.author?.__typename },
    openedOn: c?.originalCommit?.oid,
    postedOn: c?.pullRequestReview?.commit?.oid,
  });
  const opener = node?.opener?.nodes?.[0];
  return {
    resolved: node?.isResolved === true,
    resolver: node?.resolvedBy,
    opener: opener ? comment(opener) : null,
    latest: (node?.latest?.nodes ?? []).map(comment),
  };
}

/**
 * The deep-review summaries in a PR's reviews, oldest first. A summary is a
 * review by the app whose body contains the marker anywhere. parseSummary then
 * requires the marker on the first line, so a review that only quotes it reads
 * as unparseable instead of being skipped.
 */
export function summaries(reviews) {
  const found = [];
  for (const review of reviews ?? []) {
    if (!isDeepReviewAuthor(review?.user)) continue;
    if (typeof review.body !== 'string' || !review.body.includes(MARKER))
      continue;
    // A pending review has no submitted_at and is not visible to us anyway.
    const at = Date.parse(review.submitted_at ?? '');
    if (Number.isFinite(at)) found.push({ review, at });
  }
  // Same second: the higher id is the later review. A missing id compares as
  // NaN, which sort treats as equal, so the API's own order stands.
  found.sort((a, b) => a.at - b.at || a.review.id - b.review.id);
  return found.map(entry => entry.review);
}

/** The newest deep-review summary, or null. */
export function newestSummary(reviews) {
  return summaries(reviews).at(-1) ?? null;
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

/**
 * How many findings a parsed fresh summary reports. Advisories count with
 * the blocking ones because the review posts each of them as a thread that a
 * verify pass has to settle.
 */
function findingCount(parsed) {
  return parsed.blocking + parsed.advisory;
}

/** A fresh summary's findings, as the problem text names them. */
function findingText(parsed) {
  return `${parsed.blocking} blocking and ${parsed.advisory} advisory`;
}

/** The label names on a PR, ignoring anything that is not a string. */
export function labelNames(pr) {
  return (pr?.labels ?? [])
    .map(label => label?.name)
    .filter(name => typeof name === 'string');
}

/**
 * Why a PR is out of scope, or null when it is in scope. `defaultBranch` is
 * the repository's, read once per run. Without it the PR is out of scope
 * rather than in: skipping the base check when a caller forgets the argument
 * would reopen the stacked-PR gap silently, and out of scope leaves the label
 * as it was instead of guessing either way.
 */
export function scopeOf(pr, repo, defaultBranch) {
  if (pr?.state !== 'open') return 'not open';
  // A fork whose repository was deleted has a null head repo, and lands here.
  const head = String(pr?.head?.repo?.full_name ?? '').toLowerCase();
  if (head !== repo.toLowerCase()) return 'head branch is not in this repo';
  if (typeof defaultBranch !== 'string' || defaultBranch === '')
    return 'the default branch is unknown';
  if (pr?.base?.ref !== defaultBranch)
    return `based on ${forLog(pr?.base?.ref)}, not ${forLog(defaultBranch)}`;
  if (!hasScopeLabel(pr))
    return `no ${SCOPE_LABEL} label, and not an ${LOOP_LABEL} PR the App opened`;
  if (labelNames(pr).includes(LOOP_LABEL) && !isAppPr(pr))
    return `${LOOP_LABEL} PR the App did not open, which claude-pr-loop.yml hands off`;
  return null;
}

/**
 * True when `pr` carries SCOPE_LABEL, or LOOP_LABEL on a PR the App opened.
 * scopeOf adds the rest of the scope, and the run log names an out-of-scope
 * PR that passes this.
 */
function hasScopeLabel(pr) {
  const labels = labelNames(pr);
  return (
    labels.includes(SCOPE_LABEL) || (labels.includes(LOOP_LABEL) && isAppPr(pr))
  );
}

/**
 * True for a check run this workflow created. workflow_run, schedule and a
 * dispatch from main run on the default branch's commit, so theirs never
 * reach a PR head. A dispatch started from a PR's own branch runs on that
 * branch's tip, so this job's check run sits on the head, still running,
 * while the script judges it.
 */
function isOwnCheck(run) {
  return run?.name === OWN_CHECK_NAME && run?.app?.slug === 'github-actions';
}

/**
 * The newest check run per app and name. A commit keeps the check runs of
 * every workflow run on it, so one that a later run of the same workflow
 * replaced is still listed: cancelling a deep review and toggling the label
 * leaves a cancelled `review` beside the fresh one. Newest is the latest
 * started_at, then the higher id.
 *
 * A check run does not name its workflow, and some job names are shared
 * between workflows, so one key can hold runs of more than one workflow. A
 * skipped run therefore wins only when every run under its key was skipped,
 * so a same-named job skipped on a later event cannot hide a failure. A newer
 * same-named job that ran still decides.
 */
export function latestRuns(checkRuns) {
  const byKey = new Map();
  for (const run of checkRuns ?? []) {
    const key = JSON.stringify([
      String(run?.app?.slug ?? ''),
      String(run?.name ?? ''),
    ]);
    const rank = [
      run?.conclusion === 'skipped' ? 0 : 1,
      Date.parse(run?.started_at ?? '') || 0,
      run?.id ?? 0,
    ];
    const prev = byKey.get(key);
    if (!prev || outranks(rank, prev.rank)) byKey.set(key, { run, rank });
  }
  return [...byKey.values()].map(entry => entry.run);
}

/** True when rank `a` is greater than `b`, comparing in order. */
function outranks(a, b) {
  const at = a.findIndex((value, i) => value !== b[i]);
  return at !== -1 && a[at] > b[at];
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
  const runs = latestRuns((checkRuns ?? []).filter(run => !isOwnCheck(run)));
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

/** When a summary was submitted, in milliseconds. */
function submittedAt(entry) {
  return Date.parse(entry.review.submitted_at);
}

/**
 * The threads a fresh review opened: opened by the app on the commit its
 * summary is pinned to, after the summary before it and no later than its
 * own. `threads` are threadFacts().
 */
function openedBy(found, at, threads) {
  const { review } = found[at];
  const until = submittedAt(found[at]);
  const since = at > 0 ? submittedAt(found[at - 1]) : -Infinity;
  return threads.filter(
    ({ opener }) =>
      opener !== null &&
      isDeepReviewAuthor(opener.author) &&
      opener.openedOn === review.commit_id &&
      opener.at > since &&
      opener.at <= until
  );
}

/**
 * The app's latest reply in a thread after `since`, or undefined. A verify
 * pass replies before it resolves a thread, so this is the reply it settled
 * the thread with.
 */
function settlingReply(thread, since) {
  let reply;
  for (const comment of thread.latest)
    if (
      isDeepReviewAuthor(comment.author) &&
      comment.at > since &&
      (!reply || comment.at > reply.at)
    )
      reply = comment;
  return reply;
}

/**
 * Condition 2 in the header: what stops the newest fresh review from standing
 * behind the head. `found` is summaries() with each one parsed, oldest first,
 * and `threads` are threadFacts(). When the newest fresh summary is also the
 * newest summary, condition 1 has already judged it and this adds nothing.
 */
function freshProblems(found, threads, head) {
  let at = found.length - 1;
  while (at >= 0 && found[at].parsed.kind !== 'fresh') at--;
  if (at === -1)
    return ['no fresh deep review, and a verify pass reviews no code'];
  const after = found.slice(at + 1);
  if (!after.length) return [];
  const problems = [];
  // The newest summary's own parse is condition 1's to report.
  if (after.slice(0, -1).some(entry => entry.parsed.kind === 'unparseable'))
    problems.push('a summary after the newest fresh review did not parse');
  const { review, parsed } = found[at];
  const findings = findingCount(parsed);
  if (findings === 0) {
    if (review.commit_id !== head)
      problems.push(
        `the newest fresh review is for ${shortSha(review.commit_id)}, and ` +
          'no fresh review covers the commits since'
      );
    return problems;
  }
  const opened = openedBy(found, at, threads);
  if (opened.length < findings)
    problems.push(
      `the newest fresh review reports ${findingText(parsed)} but opened ` +
        `${opened.length} thread(s)`
    );
  // An open thread is condition 3's to report.
  const since = submittedAt(found[at]);
  let last;
  let unsettled = 0;
  for (const thread of opened.filter(t => t.resolved)) {
    const reply = settlingReply(thread, since);
    if (!isDeepReviewResolver(thread.resolver) || !reply) unsettled++;
    else if (!last || reply.at > last.at) last = reply;
  }
  if (unsettled)
    problems.push(
      `${unsettled} of the newest fresh review's threads were not settled ` +
        'by a verify pass'
    );
  if (problems.length || !last || opened.some(t => !t.resolved))
    return problems;
  // The pass that settled the last thread posted the first summary at or
  // after its reply. A run that posted none hands its replies to the next
  // summary, which is only sound when the head had not moved in between.
  const pass = after.find(entry => submittedAt(entry) >= last.at);
  if (!pass)
    problems.push(
      "the reply that settled the newest fresh review's last thread has no " +
        'summary after it'
    );
  // An unparseable summary has been reported above or by condition 1.
  else if (pass.parsed.kind !== 'verify') return problems;
  else if (last.postedOn !== pass.review.commit_id)
    problems.push(
      "the reply that settled the newest fresh review's last thread was " +
        `posted on ${shortSha(last.postedOn)}, not on ` +
        `${shortSha(pass.review.commit_id)} where its verify pass is pinned`
    );
  // When it is the newest summary, condition 1 has judged its commit.
  else if (pass !== after.at(-1) && pass.review.commit_id !== head)
    problems.push(
      'the verify pass that resolved the last of the newest fresh ' +
        `review's findings is for ${shortSha(pass.review.commit_id)}, ` +
        'and no fresh review covers the commits since'
    );
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
  const found = summaries(reviews).map(review => ({
    review,
    parsed: parseSummary(review.body),
  }));
  const newest = found.at(-1);
  if (!newest) problems.push('no deep-review summary');
  else {
    const { review, parsed } = newest;
    if (!SHA_RE.test(head ?? '') || review.commit_id !== head)
      problems.push(
        `the newest summary is for ${shortSha(review.commit_id)}, ` +
          `not the head ${shortSha(head)}`
      );
    if (parsed.kind === 'unparseable')
      problems.push(`the newest summary did not parse: ${parsed.why}`);
    else if (parsed.kind === 'fresh' && findingCount(parsed) > 0)
      problems.push(`the newest summary reports ${findingText(parsed)}`);
    else if (parsed.kind === 'verify' && parsed.open > 0)
      problems.push(`the newest summary leaves ${parsed.open} open`);
    problems.push(
      ...freshProblems(found, (threads ?? []).map(threadFacts), head)
    );
  }
  // A thread with no isResolved field counts as open.
  const unresolved = (threads ?? []).filter(t => t?.isResolved !== true);
  if (unresolved.length)
    problems.push(`${unresolved.length} unresolved review thread(s)`);
  problems.push(...checkProblems(checkRuns, statuses));
  problems.push(...flagProblems(pr));
  return problems;
}

/**
 * Condition 5 in the header. apply() asks it again of the PR as re-read, so a
 * flag that lands after the evaluation stops an add the same way.
 */
function flagProblems(pr) {
  return labelNames(pr).includes(FLAG_LABEL) ? [`carries ${FLAG_LABEL}`] : [];
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
export function decide({
  repo,
  defaultBranch,
  pr,
  reviews,
  threads,
  checkRuns,
  statuses,
}) {
  const number = pr?.number;
  const skip = scopeOf(pr, repo, defaultBranch);
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

// `latest` is where the settling reply is looked for. A reply older than every
// comment it reads is not found, which fails closed.
export const THREADS_QUERY = `query($owner: String!, $name: String!, $number: Int!, $after: String) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      reviewThreads(first: 100, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          isResolved
          resolvedBy { login }
          opener: comments(first: 1) { nodes { ...facts } }
          latest: comments(last: 50) { nodes { ...facts } }
        }
      }
    }
  }
}
fragment facts on PullRequestReviewComment {
  createdAt
  author { login __typename }
  originalCommit { oid }
  pullRequestReview { commit { oid } }
}`;

/** Every review thread node on a PR, in the shape threadFacts reads. */
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
export async function evaluate(client, repo, pr, defaultBranch) {
  if (scopeOf(pr, repo, defaultBranch))
    return decide({ repo, defaultBranch, pr });
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
  return decide({
    repo,
    defaultBranch,
    pr,
    reviews,
    threads,
    checkRuns,
    statuses,
  });
}

/**
 * Apply a decision. The PR is read again before either write, dry run
 * included. The write is dropped as stale when the state it was decided on is
 * gone: scopeOf no longer accepts the PR (closed, a new base, no label left
 * that puts it in scope, or `ai-loop` on a PR the App did not open), or its
 * head moved. So a PR that left scope while it was evaluated keeps its label,
 * as every out-of-scope PR does, and a later run judges a moved head. An add
 * is also dropped when the PR now carries `needs-security-review`, read by the
 * same flagProblems the evaluation used. A removal goes ahead then, since the
 * flag only stops convergence.
 */
async function apply(client, repo, defaultBranch, pr, decision, dryRun) {
  const now = await client.json(`/repos/${repo}/pulls/${pr.number}`);
  if (scopeOf(now, repo, defaultBranch) || now.head?.sha !== pr.head.sha)
    return 'stale';
  const hasLabel = labelNames(now).includes(LABEL);
  if (decision.action === 'add') {
    if (flagProblems(now).length) return 'stale';
    if (hasLabel) return 'already set';
  } else if (!hasLabel) return 'already gone';
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
  // Read once per run. A failure here throws before any PR is looked at, so
  // the run fails and no label is touched.
  const defaultBranch = (await client.json(`/repos/${repo}`))?.default_branch;
  if (typeof defaultBranch !== 'string' || defaultBranch === '')
    throw new Error(`/repos/${repo} returned no default_branch`);
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
      const decision = await evaluate(client, repo, pr, defaultBranch);
      const labels = labelNames(pr);
      if (decision.skip) {
        // A sweep passes every open PR, so only name the ones that have
        // something to do with this label.
        if (only || hasScopeLabel(pr) || labels.includes(LABEL))
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
      const outcome = await apply(
        client,
        repo,
        defaultBranch,
        pr,
        decision,
        dryRun
      );
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
