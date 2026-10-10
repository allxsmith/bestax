#!/usr/bin/env node
/**
 * Who may start a Claude deep review by labeling a PR, whether the run
 * repeats a review already posted, and in which mode it runs
 * (claude-review.yml, rule 9 in .github/CLAUDE.md).
 *
 * `labeler` decides whether a run may go ahead. Only a `deep-review` labeling
 * event needs a decision, since the job's `if:` already settles every other
 * event shape. Two labelers pass:
 *
 * - a person whose live role on the repository is triage or higher, read
 *   from the collaborators API rather than trusted from the event, so a label
 *   that automation applies on an outsider's behalf never spends usage;
 * - the bestaxbot App, which asks for a review by cycling `deep-review` on
 *   its own loop PRs. Its bot user is no collaborator, so the role lookup
 *   would refuse it, and it is matched by type and login instead
 *   (isBestaxbotApp in review-converged.mjs). It passes only on a PR it
 *   opened that carries `ai-loop` from a `claude/` branch, the shape the
 *   `opened` path already trusts.
 *
 * `dedupe` skips a run when the PR already has a deep review, unless the run
 * was started by a `deep-review` labeling, which is a deliberate re-run. That
 * keeps the `opened` and `ai-loop` paths, and a PR opened with a label already
 * on it, at one review. A deep review is a summary review by the claude[bot]
 * app (summaries in review-converged.mjs). This is a yes or no, not the
 * reviewed commit: a verify pass posts a summary too, so the newest summary's
 * commit stops naming a commit anything code-reviewed after the first verify
 * pass.
 *
 * `mode` decides between FRESH, a full review of the head, VERIFY, a pass that
 * settles the threads an earlier review left and reviews no commits, and
 * SKIP, no run. With no deep review on the PR yet, a run is FRESH. After that:
 *
 * - a person's re-run is VERIFY unless the steer comment starts with
 *   `fresh`;
 * - the App's run is VERIFY while a deep-review thread awaits a verify pass.
 *   With none awaiting, it is FRESH when no deep-review thread is open, and
 *   SKIP when one is: a verify pass would have nothing to settle, and a fresh
 *   review would raise those findings again. A person rules on such a thread
 *   (a reply, or resolving it) before the App's next run. The App toggles the
 *   label for two reasons: its fixes answered threads, which only a verify
 *   pass settles, or its head moved with no thread open (a CI fix, a merge
 *   of the default branch), which only a fresh review covers. A `fresh`
 *   steer does not apply to it, since the threads already say which of the
 *   two it is asking for. The bot decides when to toggle, in its own
 *   repository.
 *
 * A deep-review thread is one the deep reviewer opened. It is open while
 * unresolved, and it awaits a verify pass when, after the reviewer's newest
 * comment in it, someone whose word counts has replied since the newest
 * verify-pass summary. On the App's runs that is the App, which is the PR's
 * author there, or a person GitHub associates with the repository (owner,
 * member or collaborator) whose live role is triage or higher. Anyone else's
 * comment is context, as it is to the verify pass. A verify summary posted
 * after the reply means a pass has ruled on it, by resolving the thread,
 * replying, or leaving it open for a person, so a thread the reviewer has
 * declined to argue again stops asking for passes. A reply posted while a
 * verify pass runs, after it read the threads, reads as ruled on too.
 *
 * The App's runs are capped: once the PR's events show more than
 * APP_RUNS_PER_DAY `deep-review` labelings by the App in the past day, this
 * one's included, its run is SKIP. The labelings are counted rather than the
 * summaries, so a run that posts nothing still counts. The bot keeps caps of
 * its own; this one holds when those do not.
 *
 * Fail closed. A role the API cannot read refuses the labeler and keeps that
 * person's replies from counting. Reviews, threads or events it cannot read
 * fail the run rather than guess, and a failed run starts no review. Nothing
 * from the API is printed except through forLog, and every log line starts
 * with a fixed prefix.
 *
 * Plain node with no npm dependencies, run on the runner's own Node from a
 * checkout of the default branch, never the PR's: the PR branch must not be
 * able to rewrite the decision about its own review.
 *
 * Usage (in Actions, which sets GITHUB_EVENT_PATH and GITHUB_REPOSITORY):
 *   GITHUB_TOKEN=... node scripts/deep-review-gate.mjs labeler
 *   GITHUB_TOKEN=... node scripts/deep-review-gate.mjs dedupe
 *   GITHUB_TOKEN=... BY_BOT=true|false FRESH_STEER=true|false \
 *     node scripts/deep-review-gate.mjs mode
 *
 * Each prints its step outputs as `key=value` lines on stdout, for the
 * workflow to append to $GITHUB_OUTPUT, and logs to stderr: `allowed` and
 * `by_bot` from labeler, `skip` from dedupe, and `mode` and `run` from mode.
 * Exit codes: 0 a decision was printed, 1 an API error, 2 bad usage.
 */
import { readFileSync } from 'node:fs';
import process from 'node:process';
import { isMainModule } from './lib/main-module.mjs';
import {
  APP_LOGIN,
  LOOP_LABEL,
  SCOPE_LABEL as REVIEW_LABEL,
  UsageError,
  createClient,
  fetchThreads,
  forLog,
  isAppPr,
  isBestaxbotApp,
  isDeepReviewAuthor,
  labelNames,
  parseSummary,
  summaries,
  threadFacts,
} from './review-converged.mjs';

/** Live roles that may start a review, and whose replies count. */
export const TRUSTED_ROLES = new Set(['admin', 'maintain', 'write', 'triage']);

/** The most `deep-review` labelings by the App a PR may show in a day. */
export const APP_RUNS_PER_DAY = 6;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Comment author associations that can carry a live role worth looking up.
 * GitHub sets them, and a comment from anyone else is context without an API
 * call, so an outsider's comments cannot make the script look roles up.
 */
const MEMBER_ASSOCIATIONS = new Set(['OWNER', 'MEMBER', 'COLLABORATOR']);

const TAG = 'deep-review-gate:';

/** True when `event` puts `deep-review` on, the case a labeler decides. */
function isReviewLabeling(event) {
  return event?.action === 'labeled' && event?.label?.name === REVIEW_LABEL;
}

/**
 * True when `pr`, a pull_request payload, is one of the App's own loop PRs:
 * opened by the App, carrying `ai-loop`, from a `claude/` branch.
 */
export function isAppLoopPr(pr) {
  return (
    isAppPr(pr) &&
    labelNames(pr).includes(LOOP_LABEL) &&
    String(pr?.head?.ref ?? '').startsWith('claude/')
  );
}

/**
 * True for the App as the author of a thread comment. GraphQL spells an app's
 * login without the `[bot]` suffix, as isDeepReviewAuthor says of claude, so
 * the account type is what ties the bare login to the app: the bare
 * `bestaxbot` is also the machine User the older workflows post as, which
 * this does not match.
 */
export function isAppAuthor(author) {
  return (
    author?.type === 'Bot' &&
    (author.login === APP_LOGIN || `${author.login}[bot]` === APP_LOGIN)
  );
}

/**
 * The labeler decision that needs no API call. Returns
 *   { allowed, byBot, why } when the event alone decides, or
 *   { lookup: login } when the sender's live role decides.
 */
export function labelerCheck(event) {
  if (!isReviewLabeling(event))
    return {
      allowed: true,
      byBot: false,
      why: `not a ${REVIEW_LABEL} labeling event, no extra check needed`,
    };
  if (isBestaxbotApp(event?.sender)) {
    if (isAppLoopPr(event?.pull_request))
      return {
        allowed: true,
        byBot: true,
        why: `the App cycled ${REVIEW_LABEL} on its own loop PR, running`,
      };
    return {
      allowed: false,
      byBot: false,
      why: `the App may only cycle ${REVIEW_LABEL} on its own loop PRs, not running`,
    };
  }
  return { lookup: String(event?.sender?.login ?? '') };
}

/** The decision for a sender whose live role is `role`. */
export function roleDecision(login, role) {
  if (TRUSTED_ROLES.has(role))
    return {
      allowed: true,
      byBot: false,
      why: `${forLog(login)} has ${forLog(role)} access, running`,
    };
  return {
    allowed: false,
    byBot: false,
    why: `${forLog(login)} lacks triage access (${forLog(role)}), not running`,
  };
}

/**
 * A user's live role on `repo`, or `none` when the API cannot say. On a
 * public repository the endpoint answers `read` for any account rather than
 * 404, so an outsider lands on a role that is refused either way.
 */
export async function liveRole(client, repo, login) {
  if (!login) return 'none';
  try {
    const data = await client.json(
      `/repos/${repo}/collaborators/${encodeURIComponent(login)}/permission`
    );
    return typeof data?.role_name === 'string' ? data.role_name : 'none';
  } catch {
    return 'none';
  }
}

/** True when `reviews`, a PR's reviews, hold a deep-review summary. */
export function isReviewed(reviews) {
  return summaries(reviews).length > 0;
}

/**
 * When the newest verify-pass summary in `reviews` was posted, in
 * milliseconds, or -Infinity when there is none.
 */
export function newestVerifyAt(reviews) {
  let at = -Infinity;
  for (const review of summaries(reviews))
    if (parseSummary(review.body).kind === 'verify')
      at = Math.max(at, Date.parse(review.submitted_at));
  return at;
}

/** The open deep-review threads in `threads`, as threadFacts. */
function openReviewThreads(threads) {
  return (threads ?? [])
    .map(threadFacts)
    .filter(
      thread =>
        !thread.resolved &&
        thread.opener !== null &&
        isDeepReviewAuthor(thread.opener.author)
    );
}

/**
 * The comments in a thread after the deep reviewer's newest one, newest
 * first. THREADS_QUERY's `latest` comments come oldest first, and with none
 * the opener is the newest.
 */
function sinceReviewer(thread) {
  const comments = thread.latest.length ? thread.latest : [thread.opener];
  const after = [];
  for (let i = comments.length - 1; i >= 0; i--) {
    if (isDeepReviewAuthor(comments[i].author)) break;
    after.push(comments[i]);
  }
  return after;
}

/** How many deep-review threads are open. `threads` are THREADS_QUERY nodes. */
export function openThreads(threads) {
  return openReviewThreads(threads).length;
}

/**
 * The logins whose live role decides whether their replies count: people
 * GitHub associates with the repository who have replied in an open
 * deep-review thread since the reviewer last did.
 */
export function replyLogins(threads) {
  const logins = new Set();
  for (const thread of openReviewThreads(threads))
    for (const { author, association } of sinceReviewer(thread))
      if (
        author.type === 'User' &&
        typeof author.login === 'string' &&
        MEMBER_ASSOCIATIONS.has(association)
      )
        logins.add(author.login);
  return [...logins].sort();
}

/**
 * How many open deep-review threads await a verify pass. `trusted` holds the
 * logins of people whose live role is triage or higher, and `ruledAt` is
 * newestVerifyAt's answer. The header has the rule.
 */
export function awaitingVerify(threads, { trusted, ruledAt } = {}) {
  let count = 0;
  for (const thread of openReviewThreads(threads)) {
    const reply = sinceReviewer(thread).find(
      ({ author }) =>
        isAppAuthor(author) ||
        (author.type === 'User' && trusted?.has(author.login) === true)
    );
    if (reply && reply.at > (ruledAt ?? -Infinity)) count++;
  }
  return count;
}

/**
 * How many times `events`, a PR's issue events, show the App putting
 * `deep-review` on in the day before `now`. An event whose time does not
 * parse counts.
 */
export function appRunsToday(events, now) {
  let count = 0;
  for (const event of events ?? []) {
    if (event?.event !== 'labeled' || event?.label?.name !== REVIEW_LABEL)
      continue;
    if (!isBestaxbotApp(event?.actor)) continue;
    if (!(Date.parse(event?.created_at ?? '') <= now - DAY_MS)) count++;
  }
  return count;
}

/** The dedupe decision. A `deep-review` labeling runs whatever `reviewed` is. */
export function dedupeDecision(event, reviewed) {
  if (isReviewLabeling(event))
    return {
      skip: false,
      why: `${REVIEW_LABEL} put on by ${forLog(event?.sender?.login)}, admitted by the perm step, running (the mode step picks the mode)`,
    };
  return reviewed
    ? { skip: true, why: 'a deep review is already on this PR, skipping' }
    : { skip: false, why: 'no deep review on this PR yet, running' };
}

/**
 * The run's mode. `appRuns` is needed only for the App's run, and `awaiting`
 * and `open` only for the App's run on a reviewed PR. Returns { mode, why }.
 */
export function pickMode({
  reviewed,
  byBot,
  freshSteer,
  awaiting = 0,
  open = 0,
  appRuns = 0,
}) {
  if (byBot && appRuns > APP_RUNS_PER_DAY)
    return {
      mode: 'SKIP',
      why: `the App has put ${REVIEW_LABEL} on this PR ${appRuns} times in the past day, over the cap of ${APP_RUNS_PER_DAY}`,
    };
  if (!reviewed) return { mode: 'FRESH', why: 'no deep review on this PR yet' };
  if (byBot) {
    if (awaiting > 0)
      return {
        mode: 'VERIFY',
        why: `${awaiting} deep-review thread(s) await a verify pass`,
      };
    if (open > 0)
      return {
        mode: 'SKIP',
        why: `${open} deep-review thread(s) are open and none awaits a verify pass, so a person rules on them before the App's next run`,
      };
    return {
      mode: 'FRESH',
      why: 'no deep-review thread is open, so the App asked for a fresh review',
    };
  }
  return freshSteer
    ? { mode: 'FRESH', why: "the steer starts with 'fresh'" }
    : { mode: 'VERIFY', why: 'a re-run settles the open threads' };
}

/** The payload of the event that started the run. */
function readEvent(env) {
  if (!env.GITHUB_EVENT_PATH)
    throw new UsageError('GITHUB_EVENT_PATH is not set');
  return JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, 'utf8'));
}

/** The number of the pull request the event is about. */
function prNumber(event) {
  const number = event?.pull_request?.number;
  if (!Number.isInteger(number) || number < 1)
    throw new UsageError('the event names no pull request');
  return number;
}

/** The repository the run belongs to. */
function repoOf(env) {
  const repo = env.GITHUB_REPOSITORY ?? '';
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo))
    throw new UsageError('GITHUB_REPOSITORY must be owner/name');
  return repo;
}

/** An API client, or a usage error when there is no token. */
function clientFor(env, fetchImpl) {
  if (!env.GITHUB_TOKEN) throw new UsageError('GITHUB_TOKEN is not set');
  return createClient({ token: env.GITHUB_TOKEN, fetchImpl });
}

/** A PR's reviews. */
function fetchReviews(client, repo, number) {
  return client.pages(`/repos/${repo}/pulls/${number}/reviews?per_page=100`);
}

/** The logins in `logins` whose live role is triage or higher. */
async function trustedLogins(client, repo, logins) {
  const trusted = new Set();
  for (const login of logins)
    if (TRUSTED_ROLES.has(await liveRole(client, repo, login)))
      trusted.add(login);
  return trusted;
}

async function labeler(env, { fetchImpl, log }) {
  const event = readEvent(env);
  let decision = labelerCheck(event);
  if ('lookup' in decision) {
    const repo = repoOf(env);
    const role = await liveRole(
      clientFor(env, fetchImpl),
      repo,
      decision.lookup
    );
    decision = roleDecision(decision.lookup, role);
  }
  log(`${TAG} ${decision.why}`);
  return [`allowed=${decision.allowed}`, `by_bot=${decision.byBot}`];
}

async function dedupe(env, { fetchImpl, log }) {
  const event = readEvent(env);
  let reviewed = false;
  if (!isReviewLabeling(event)) {
    const repo = repoOf(env);
    const reviews = await fetchReviews(
      clientFor(env, fetchImpl),
      repo,
      prNumber(event)
    );
    reviewed = isReviewed(reviews);
  }
  const decision = dedupeDecision(event, reviewed);
  log(`${TAG} ${decision.why}`);
  return [`skip=${decision.skip}`];
}

async function mode(env, { fetchImpl, log, now }) {
  const byBot = env.BY_BOT === 'true';
  const facts = { byBot, freshSteer: env.FRESH_STEER === 'true' };
  const repo = repoOf(env);
  const number = prNumber(readEvent(env));
  const client = clientFor(env, fetchImpl);
  if (byBot)
    facts.appRuns = appRunsToday(
      await client.pages(`/repos/${repo}/issues/${number}/events?per_page=100`),
      now()
    );
  const reviews = await fetchReviews(client, repo, number);
  facts.reviewed = isReviewed(reviews);
  if (byBot && facts.reviewed && facts.appRuns <= APP_RUNS_PER_DAY) {
    const threads = await fetchThreads(client, repo, number);
    facts.open = openThreads(threads);
    facts.awaiting = awaitingVerify(threads, {
      trusted: await trustedLogins(client, repo, replyLogins(threads)),
      ruledAt: newestVerifyAt(reviews),
    });
  }
  const decision = pickMode(facts);
  log(`${TAG} ${decision.mode}: ${decision.why}`);
  return [`mode=${decision.mode}`, `run=${decision.mode !== 'SKIP'}`];
}

const COMMANDS = { labeler, dedupe, mode };

/**
 * Run one command. Returns the `key=value` lines for $GITHUB_OUTPUT.
 * `fetchImpl`, `log` and `now` are injectable so the test sibling can drive
 * it without the network or the clock.
 */
export async function run({
  argv,
  env,
  fetchImpl = globalThis.fetch,
  log = line => console.error(line),
  now = () => Date.now(),
}) {
  const [name, ...rest] = argv;
  const command = Object.hasOwn(COMMANDS, name ?? '') ? COMMANDS[name] : null;
  if (!command || rest.length)
    throw new UsageError(
      `expected labeler, dedupe or mode, got ${forLog(argv.join(' '))}`
    );
  return command(env, { fetchImpl, log, now });
}

if (isMainModule(import.meta.url)) {
  run({ argv: process.argv.slice(2), env: process.env }).then(
    lines => {
      process.stdout.write(`${lines.join('\n')}\n`);
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
