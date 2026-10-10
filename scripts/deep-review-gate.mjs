#!/usr/bin/env node
/**
 * Who may start a Claude deep review by labeling a PR, and in which mode it
 * runs (claude-review.yml, rule 9 in .github/CLAUDE.md).
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
 * `mode` decides between FRESH, a full review of the head, and VERIFY, a pass
 * that settles the threads an earlier review left and reviews no commits.
 * With no deep review on the PR yet, a run is FRESH. After that:
 *
 * - a person's re-run is VERIFY unless the steer comment starts with
 *   `fresh`;
 * - the App's run is VERIFY while a deep-review thread awaits a verify pass,
 *   and FRESH otherwise. The App toggles the label for two reasons: its fixes
 *   answered threads, which only a verify pass settles, or its head moved
 *   with nothing awaiting one (a CI fix, a merge of the default branch),
 *   which only a fresh review covers. A `fresh` steer does not apply to it,
 *   since the threads already say which of the two it is asking for. The bot
 *   decides when to toggle, in its own repository.
 *
 * A thread awaits a verify pass when it is unresolved, the deep reviewer
 * opened it, and someone else wrote its newest comment: the author's
 * `Fixed in` or refutation, or a maintainer's reply.
 *
 * Fail closed. A role the API cannot read refuses the labeler, and threads
 * it cannot read fail the run rather than guess a mode. Nothing from the API
 * is printed except through forLog, and every log line starts with a fixed
 * prefix.
 *
 * Plain node with no npm dependencies, run on the runner's own Node from a
 * checkout of the default branch, never the PR's: the PR branch must not be
 * able to rewrite the decision about its own review.
 *
 * Usage (in Actions, which sets GITHUB_EVENT_PATH and GITHUB_REPOSITORY):
 *   GITHUB_TOKEN=... node scripts/deep-review-gate.mjs labeler
 *   GITHUB_TOKEN=... REVIEWED=true|false BY_BOT=true|false \
 *     FRESH_STEER=true|false node scripts/deep-review-gate.mjs mode
 *
 * Each prints its step outputs as `key=value` lines on stdout, for the
 * workflow to append to $GITHUB_OUTPUT, and logs to stderr. Exit codes: 0 a
 * decision was printed, 1 an API error, 2 bad usage.
 */
import { readFileSync } from 'node:fs';
import process from 'node:process';
import { isMainModule } from './lib/main-module.mjs';
import {
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
  threadFacts,
} from './review-converged.mjs';

/** Live roles that may start a review. */
export const TRUSTED_ROLES = new Set(['admin', 'maintain', 'write', 'triage']);

const TAG = 'deep-review-gate:';

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
 * The labeler decision that needs no API call. Returns
 *   { allowed, byBot, why } when the event alone decides, or
 *   { lookup: login } when the sender's live role decides.
 */
export function labelerCheck(event) {
  if (event?.action !== 'labeled' || event?.label?.name !== REVIEW_LABEL)
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

/**
 * How many threads await a verify pass. `threads` are review thread nodes
 * from THREADS_QUERY in review-converged.mjs, whose `latest` comments come
 * oldest first, so the last of them is the newest comment.
 */
export function awaitingVerify(threads) {
  let count = 0;
  for (const node of threads ?? []) {
    const thread = threadFacts(node);
    if (thread.resolved || !thread.opener) continue;
    if (!isDeepReviewAuthor(thread.opener.author)) continue;
    const newest = thread.latest.at(-1) ?? thread.opener;
    if (!isDeepReviewAuthor(newest.author)) count++;
  }
  return count;
}

/**
 * The run's mode. `awaiting` is awaitingVerify's count, needed only for the
 * App's run on a reviewed PR. Returns { mode, why }.
 */
export function pickMode({ reviewed, byBot, freshSteer, awaiting }) {
  if (!reviewed) return { mode: 'FRESH', why: 'no deep review on this PR yet' };
  if (byBot)
    return awaiting > 0
      ? {
          mode: 'VERIFY',
          why: `${awaiting} deep-review thread(s) await a verify pass`,
        }
      : {
          mode: 'FRESH',
          why: 'no deep-review thread awaits a verify pass, so the App asked for a fresh review',
        };
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

async function labeler(env, fetchImpl, log) {
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

async function mode(env, fetchImpl, log) {
  const reviewed = env.REVIEWED === 'true';
  const byBot = env.BY_BOT === 'true';
  const freshSteer = env.FRESH_STEER === 'true';
  let awaiting = 0;
  if (reviewed && byBot) {
    const repo = repoOf(env);
    const number = readEvent(env)?.pull_request?.number;
    if (!Number.isInteger(number) || number < 1)
      throw new UsageError('the event names no pull request');
    awaiting = awaitingVerify(
      await fetchThreads(clientFor(env, fetchImpl), repo, number)
    );
  }
  const decision = pickMode({ reviewed, byBot, freshSteer, awaiting });
  log(`${TAG} ${decision.mode}: ${decision.why}`);
  return [`mode=${decision.mode}`];
}

const COMMANDS = { labeler, mode };

/**
 * Run one command. Returns the `key=value` lines for $GITHUB_OUTPUT.
 * `fetchImpl` and `log` are injectable so the test sibling can drive it
 * without the network.
 */
export async function run({
  argv,
  env,
  fetchImpl = globalThis.fetch,
  log = line => console.error(line),
}) {
  const [name, ...rest] = argv;
  const command = Object.hasOwn(COMMANDS, name ?? '') ? COMMANDS[name] : null;
  if (!command || rest.length)
    throw new UsageError(
      `expected labeler or mode, got ${forLog(argv.join(' '))}`
    );
  return command(env, fetchImpl, log);
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
