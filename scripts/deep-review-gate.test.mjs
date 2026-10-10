/**
 * Guards on who may start a Claude deep review, whether a run repeats a
 * review already posted, and in which mode it runs (deep-review-gate.mjs).
 *
 * The decisions are pure functions over the event payload and fetched data,
 * so most of this file hands them fixtures. The end drives the command line
 * with a fake fetch, and reads claude-review.yml so the steps that call the
 * script and the outputs they read cannot drift from it.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import {
  APP_RUNS_PER_DAY,
  appRunsToday,
  awaitingVerify,
  dedupeDecision,
  isAppAuthor,
  isAppLoopPr,
  isReviewed,
  labelerCheck,
  liveRole,
  newestVerifyAt,
  openThreads,
  pickMode,
  replyLogins,
  roleDecision,
  run,
} from './deep-review-gate.mjs';
import {
  APP_LOGIN,
  MARKER,
  UsageError,
  createClient,
} from './review-converged.mjs';
import { yamlGet } from './check-conformance.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const SCRIPT = join(HERE, 'deep-review-gate.mjs');
const REPO = 'allxsmith/bestax';
const APP = { login: APP_LOGIN, type: 'Bot' };
const HUMAN = { login: 'octocat', type: 'User' };
const MACHINE_USER = { login: 'bestaxbot', type: 'User' };

/** A fixed clock for the cap, and a time `minutes` past the hour it reads. */
const NOW = Date.parse('2026-10-09T13:00:00Z');
const at = minutes =>
  new Date(Date.parse('2026-10-09T12:00:00Z') + minutes * 60_000)
    .toISOString()
    .replace('.000Z', 'Z');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function loopPr(overrides = {}) {
  const { labels = ['ai-loop', 'deep-review'], ...rest } = overrides;
  return {
    number: 912,
    user: APP,
    head: { ref: 'claude/issue-77', repo: { full_name: REPO } },
    labels: labels.map(name => ({ name })),
    ...rest,
  };
}

function labeled(overrides = {}) {
  return {
    action: 'labeled',
    label: { name: 'deep-review' },
    sender: APP,
    pull_request: loopPr(),
    ...overrides,
  };
}

/** A GraphQL comment node, `minute` minutes past the hour. */
function comment(minute, author, association = 'NONE') {
  return {
    createdAt: at(minute),
    author,
    authorAssociation: association,
    originalCommit: { oid: 'a'.repeat(40) },
    pullRequestReview: { commit: { oid: 'a'.repeat(40) } },
  };
}

const REVIEWER = { login: 'claude', __typename: 'Bot' };
const BOT_REPLY = { login: 'bestaxbot', __typename: 'Bot' };
const MAINTAINER = { login: 'allxsmith', __typename: 'User' };
const OUTSIDER = { login: 'octocat', __typename: 'User' };
const MACHINE_REPLY = { login: 'bestaxbot', __typename: 'User' };
const CODERABBIT = { login: 'coderabbitai', __typename: 'Bot' };

/** GitHub's association for each fixture author's comments. */
const ASSOCIATION = new Map([
  [MAINTAINER, 'OWNER'],
  [MACHINE_REPLY, 'COLLABORATOR'],
]);

/**
 * A thread node opened by `by`, with the later comments' authors in order, a
 * minute apart. An entry may be [author, minute] to place it.
 */
function thread(by, later = [], resolved = false) {
  const first = comment(0, by);
  return {
    isResolved: resolved,
    resolvedBy: resolved ? { login: 'claude[bot]' } : null,
    opener: { nodes: [first] },
    latest: {
      nodes: [
        first,
        ...later.map((entry, i) => {
          const [author, minute] = Array.isArray(entry)
            ? entry
            : [entry, i + 1];
          return comment(minute, author, ASSOCIATION.get(author));
        }),
      ],
    },
  };
}

/** A review as the REST API lists it. */
function review(body, minute, user = { login: 'claude[bot]', type: 'Bot' }) {
  return { id: minute, user, body, submitted_at: at(minute) };
}
const FRESH = minute =>
  review(`${MARKER}\n## Deep review — 1 blocking · 0 advisory`, minute);
const VERIFY = minute =>
  review(`${MARKER}\n## Deep review (verify) — 0 resolved · 1 open`, minute);

/** An issue event putting `label` on, by `actor`, `minute` past the hour. */
function labeling(minute, actor = APP, label = 'deep-review') {
  return {
    event: 'labeled',
    label: { name: label },
    actor,
    created_at: at(minute),
  };
}

// ---------------------------------------------------------------------------
// The App's loop PRs (the App itself is review-converged.mjs's isAppPr)
// ---------------------------------------------------------------------------

test('an App loop PR is the App’s, carries ai-loop and is on a claude/ branch', () => {
  assert.equal(isAppLoopPr(loopPr()), true);
  assert.equal(isAppLoopPr(loopPr({ labels: ['ai-loop'] })), true);
  assert.equal(isAppLoopPr(loopPr({ user: HUMAN })), false);
  assert.equal(isAppLoopPr(loopPr({ user: MACHINE_USER })), false);
  assert.equal(isAppLoopPr(loopPr({ labels: ['deep-review'] })), false);
  // A label that only starts with the loop label's name is not it.
  assert.equal(isAppLoopPr(loopPr({ labels: ['ai-loop-paused'] })), false);
  assert.equal(
    isAppLoopPr(loopPr({ head: { ref: 'feat/claude/x', repo: null } })),
    false
  );
  assert.equal(isAppLoopPr(loopPr({ head: undefined })), false);
  assert.equal(isAppLoopPr(undefined), false);
});

test('a thread comment is the App’s by type and either spelling of its login', () => {
  // GraphQL spells it bare, REST with the suffix.
  assert.equal(isAppAuthor({ login: 'bestaxbot', type: 'Bot' }), true);
  assert.equal(isAppAuthor({ login: APP_LOGIN, type: 'Bot' }), true);
  // The machine User, the deep reviewer, and another app are not it.
  assert.equal(isAppAuthor({ login: 'bestaxbot', type: 'User' }), false);
  assert.equal(isAppAuthor({ login: 'claude', type: 'Bot' }), false);
  assert.equal(isAppAuthor({ login: 'bestaxbot-x', type: 'Bot' }), false);
  assert.equal(isAppAuthor({ type: 'Bot' }), false);
  assert.equal(isAppAuthor(undefined), false);
});

// ---------------------------------------------------------------------------
// labeler
// ---------------------------------------------------------------------------

test('every event but a deep-review labeling passes without a check', () => {
  for (const event of [
    { action: 'opened', sender: HUMAN, pull_request: loopPr() },
    labeled({ label: { name: 'ai-loop' } }),
    labeled({ label: { name: 'ai-loop' }, sender: HUMAN }),
    {},
  ]) {
    const decision = labelerCheck(event);
    assert.equal(decision.allowed, true);
    assert.equal(decision.byBot, false);
    assert.match(decision.why, /not a deep-review labeling event/);
  }
});

test('the App passes on its own loop PR and is marked as the starter', () => {
  const decision = labelerCheck(labeled());
  assert.deepEqual(
    { allowed: decision.allowed, byBot: decision.byBot },
    { allowed: true, byBot: true }
  );
});

test('the App is refused on any PR that is not its own loop PR', () => {
  for (const pr of [
    loopPr({ user: HUMAN }),
    loopPr({ labels: ['deep-review'] }),
    loopPr({ head: { ref: 'fix/thing', repo: { full_name: REPO } } }),
  ]) {
    const decision = labelerCheck(labeled({ pull_request: pr }));
    assert.equal(decision.allowed, false);
    assert.equal(decision.byBot, false);
    assert.match(decision.why, /only cycle deep-review on its own loop PRs/);
  }
});

test('every other labeler goes to the live role lookup', () => {
  // A person, the machine User, another app, and a sender with no login.
  assert.deepEqual(labelerCheck(labeled({ sender: HUMAN })), {
    lookup: 'octocat',
  });
  assert.deepEqual(labelerCheck(labeled({ sender: MACHINE_USER })), {
    lookup: 'bestaxbot',
  });
  assert.deepEqual(
    labelerCheck(
      labeled({ sender: { login: 'github-actions[bot]', type: 'Bot' } })
    ),
    { lookup: 'github-actions[bot]' }
  );
  // The App's login on a User is not the App.
  assert.deepEqual(
    labelerCheck(labeled({ sender: { login: APP_LOGIN, type: 'User' } })),
    { lookup: APP_LOGIN }
  );
  assert.deepEqual(labelerCheck(labeled({ sender: undefined })), {
    lookup: '',
  });
});

test('triage and above pass the role check, and nothing else does', () => {
  for (const role of ['admin', 'maintain', 'write', 'triage']) {
    const decision = roleDecision('octocat', role);
    assert.equal(decision.allowed, true, role);
    assert.equal(decision.byBot, false);
    assert.match(decision.why, /^"octocat" has "\w+" access, running$/);
  }
  for (const role of ['read', 'none', '', undefined, 'Admin']) {
    const decision = roleDecision('octocat', role);
    assert.equal(decision.allowed, false, String(role));
    assert.match(decision.why, /lacks triage access/);
  }
});

test('a login reaches the log as inert text', () => {
  const { why } = roleDecision('x\n::error::y', 'read');
  assert.doesNotMatch(why, /\n/);
  assert.match(why, /^"x\\n::error::y" lacks/);
});

// ---------------------------------------------------------------------------
// Fake API
// ---------------------------------------------------------------------------

function response(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: async () => body,
    text: async () => JSON.stringify(body ?? ''),
  };
}

/** A fetch that answers from a route table and records every call. */
function fakeFetch(routes) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const method = init?.method ?? 'GET';
    const path = url.replace('https://api.github.com', '');
    const body = init?.body ? JSON.parse(init.body) : undefined;
    calls.push({ method, path, body });
    const route = routes[`${method} ${path}`];
    if (!route) return response(404, { message: 'Not Found' });
    const answer = typeof route === 'function' ? route(body) : route;
    if (answer instanceof Error) throw answer;
    return answer;
  };
  return { fetchImpl, calls };
}

const roleRoute = (login, role) => ({
  [`GET /repos/${REPO}/collaborators/${encodeURIComponent(login)}/permission`]:
    response(200, { role_name: role }),
});

const REVIEWS = `GET /repos/${REPO}/pulls/912/reviews?per_page=100`;
const EVENTS = `GET /repos/${REPO}/issues/912/events?per_page=100`;
const reviewsRoute = reviews => ({ [REVIEWS]: response(200, reviews) });
const eventsRoute = events => ({ [EVENTS]: response(200, events) });

function threadsRoute(nodes) {
  return {
    'POST /graphql': response(200, {
      data: {
        repository: {
          pullRequest: {
            reviewThreads: {
              pageInfo: { hasNextPage: false, endCursor: null },
              nodes,
            },
          },
        },
      },
    }),
  };
}

test('liveRole reads role_name and reads any failure as none', async () => {
  const client = routes =>
    createClient({ token: 't', fetchImpl: fakeFetch(routes).fetchImpl });
  assert.equal(
    await liveRole(client(roleRoute('octocat', 'write')), REPO, 'octocat'),
    'write'
  );
  // A deleted user, an API error, a body without the field, and no login.
  assert.equal(await liveRole(client({}), REPO, 'octocat'), 'none');
  assert.equal(
    await liveRole(
      client({
        [`GET /repos/${REPO}/collaborators/octocat/permission`]: new Error(
          'offline'
        ),
      }),
      REPO,
      'octocat'
    ),
    'none'
  );
  assert.equal(
    await liveRole(
      client({
        [`GET /repos/${REPO}/collaborators/octocat/permission`]: response(200, {
          permission: 'admin',
        }),
      }),
      REPO,
      'octocat'
    ),
    'none'
  );
  const { fetchImpl, calls } = fakeFetch({});
  assert.equal(
    await liveRole(createClient({ token: 't', fetchImpl }), REPO, ''),
    'none'
  );
  assert.equal(calls.length, 0);
});

test('a login is encoded into the role lookup path', async () => {
  const { fetchImpl, calls } = fakeFetch(roleRoute(APP_LOGIN, 'read'));
  assert.equal(
    await liveRole(createClient({ token: 't', fetchImpl }), REPO, APP_LOGIN),
    'read'
  );
  assert.equal(
    calls[0].path,
    `/repos/${REPO}/collaborators/bestaxbot%5Bbot%5D/permission`
  );
});

// ---------------------------------------------------------------------------
// dedupe
// ---------------------------------------------------------------------------

test('a PR is reviewed when the deep reviewer posted a summary', () => {
  assert.equal(isReviewed([FRESH(1)]), true);
  assert.equal(isReviewed([VERIFY(1)]), true);
  // A User named claude, a review without the marker, a pending review, and
  // no reviews at all.
  assert.equal(
    isReviewed([review(FRESH(1).body, 1, { login: 'claude', type: 'User' })]),
    false
  );
  assert.equal(isReviewed([review('looks good', 1)]), false);
  assert.equal(isReviewed([{ ...FRESH(1), submitted_at: null }]), false);
  assert.equal(isReviewed([]), false);
  assert.equal(isReviewed(undefined), false);
});

test('a deep-review labeling runs, and anything else runs once', () => {
  for (const reviewed of [true, false]) {
    const rerun = dedupeDecision(labeled({ sender: HUMAN }), reviewed);
    assert.equal(rerun.skip, false);
    assert.match(rerun.why, /^deep-review put on by "octocat", admitted/);
  }
  const opened = { action: 'opened', pull_request: loopPr() };
  assert.equal(dedupeDecision(opened, true).skip, true);
  assert.equal(dedupeDecision(opened, false).skip, false);
  const loop = labeled({ label: { name: 'ai-loop' } });
  assert.equal(dedupeDecision(loop, true).skip, true);
  assert.match(dedupeDecision(loop, true).why, /already on this PR/);
});

// ---------------------------------------------------------------------------
// mode: threads
// ---------------------------------------------------------------------------

const ALLXSMITH = new Set(['allxsmith']);

test('a thread awaits a verify pass when the App or a trusted person answered', () => {
  // The App's Fixed in or refutation, and a triage+ maintainer's reply.
  assert.equal(awaitingVerify([thread(REVIEWER, [BOT_REPLY])]), 1);
  assert.equal(
    awaitingVerify([thread(REVIEWER, [MAINTAINER])], { trusted: ALLXSMITH }),
    1
  );
  // A reply after the reviewer's rebuttal.
  assert.equal(
    awaitingVerify([thread(REVIEWER, [BOT_REPLY, REVIEWER, BOT_REPLY])]),
    1
  );
  // Anyone else's later comment is context, and the reply before it counts.
  assert.equal(
    awaitingVerify([thread(REVIEWER, [BOT_REPLY, OUTSIDER, CODERABBIT])]),
    1
  );
  // The machine User counts only with a triage+ role.
  assert.equal(
    awaitingVerify([thread(REVIEWER, [MACHINE_REPLY])], {
      trusted: new Set(['bestaxbot']),
    }),
    1
  );
});

test('a reply from anyone else does not ask for a verify pass', () => {
  for (const later of [
    [OUTSIDER],
    [CODERABBIT],
    [MACHINE_REPLY],
    // A maintainer whose role was not confirmed.
    [MAINTAINER],
    // The reviewer's own words come after the App's.
    [BOT_REPLY, REVIEWER],
    [BOT_REPLY, REVIEWER, OUTSIDER],
  ])
    assert.equal(
      awaitingVerify([thread(REVIEWER, later)], { trusted: new Set() }),
      0,
      later.map(a => `${a.login}:${a.__typename}`).join(',')
    );
});

test('a reply a verify pass has already ruled on awaits nothing', () => {
  // The App replied at minute 1, and the verify summary came at minute 2:
  // the reviewer left the thread open for a person.
  const answered = thread(REVIEWER, [[BOT_REPLY, 1]]);
  assert.equal(awaitingVerify([answered], { ruledAt: Date.parse(at(2)) }), 0);
  // A summary posted in the same second reads as having seen it.
  assert.equal(awaitingVerify([answered], { ruledAt: Date.parse(at(1)) }), 0);
  // A reply after the newest verify pass is still waiting for one.
  assert.equal(awaitingVerify([answered], { ruledAt: Date.parse(at(0)) }), 1);
  // A reply whose time does not parse cannot be shown to be newer.
  const undated = thread(REVIEWER, [BOT_REPLY]);
  undated.latest.nodes[1].createdAt = 'soon';
  assert.equal(awaitingVerify([undated]), 0);
});

test('a thread does not await a verify pass in any other state', () => {
  assert.equal(
    awaitingVerify([
      // Unanswered, and answered then rebutted: the author's turn.
      thread(REVIEWER),
      thread(REVIEWER, [BOT_REPLY, REVIEWER]),
      // Settled already.
      thread(REVIEWER, [BOT_REPLY, REVIEWER], true),
      thread(REVIEWER, [BOT_REPLY], true),
      // Opened by someone other than the deep reviewer.
      thread(CODERABBIT, [BOT_REPLY]),
      thread(MAINTAINER, [BOT_REPLY]),
      // A User spelling the reviewer's login is not the app.
      thread({ login: 'claude', __typename: 'User' }, [BOT_REPLY]),
      // A thread whose comments the API did not return.
      { isResolved: false, opener: { nodes: [] }, latest: { nodes: [] } },
      null,
    ]),
    0
  );
  assert.equal(awaitingVerify(undefined), 0);
});

test('with only an opener and no latest list, the opener is the newest', () => {
  const node = thread(REVIEWER);
  delete node.latest;
  assert.equal(awaitingVerify([node]), 0);
  assert.equal(openThreads([node]), 1);
});

test('a deep-review thread is open until it is resolved', () => {
  assert.equal(
    openThreads([
      thread(REVIEWER),
      thread(REVIEWER, [BOT_REPLY]),
      thread(REVIEWER, [BOT_REPLY], true),
      thread(CODERABBIT),
      thread(MAINTAINER),
      { isResolved: false, opener: { nodes: [] }, latest: { nodes: [] } },
      null,
    ]),
    2
  );
  assert.equal(openThreads(undefined), 0);
});

test('only people GitHub associates with the repo get their role looked up', () => {
  const nameless = { __typename: 'User' };
  ASSOCIATION.set(nameless, 'MEMBER');
  assert.deepEqual(
    replyLogins([
      // Since the reviewer last spoke: the owner, an outsider, the App, a
      // collaborator, and a member the API gave no login.
      thread(REVIEWER, [MAINTAINER, OUTSIDER, BOT_REPLY, MACHINE_REPLY]),
      thread(REVIEWER, [nameless]),
      // Before the reviewer's newest comment, settled, or not its thread.
      thread(REVIEWER, [{ login: 'early', __typename: 'User' }, REVIEWER]),
      thread(REVIEWER, [MAINTAINER], true),
      thread(CODERABBIT, [MAINTAINER]),
      // The owner again, looked up once.
      thread(REVIEWER, [MAINTAINER]),
    ]),
    ['allxsmith', 'bestaxbot']
  );
  ASSOCIATION.delete(nameless);
  assert.deepEqual(replyLogins(undefined), []);
});

test('newestVerifyAt finds the newest verify summary', () => {
  assert.equal(
    newestVerifyAt([FRESH(1), VERIFY(2), FRESH(3), VERIFY(4), FRESH(5)]),
    Date.parse(at(4))
  );
  // A fresh review, a summary that does not parse, and no summaries.
  assert.equal(newestVerifyAt([FRESH(1)]), -Infinity);
  assert.equal(
    newestVerifyAt([review(`${MARKER}\nsomething else`, 1)]),
    -Infinity
  );
  assert.equal(newestVerifyAt(undefined), -Infinity);
});

// ---------------------------------------------------------------------------
// mode: the cap
// ---------------------------------------------------------------------------

test('the cap counts the App’s deep-review labelings in the past day', () => {
  assert.equal(
    appRunsToday(
      [
        labeling(0),
        labeling(59),
        // An undated labeling counts.
        { ...labeling(1), created_at: undefined },
        // A day old or older, another label, a removal, and other actors.
        { ...labeling(0), created_at: '2026-10-08T13:00:00Z' },
        { ...labeling(0), created_at: '2026-10-08T12:00:00Z' },
        labeling(1, APP, 'ai-loop'),
        { ...labeling(1), event: 'unlabeled' },
        labeling(1, HUMAN),
        labeling(1, MACHINE_USER),
        labeling(1, { login: 'bestaxbot', type: 'Bot' }),
        null,
      ],
      NOW
    ),
    3
  );
  assert.equal(appRunsToday(undefined, NOW), 0);
});

// ---------------------------------------------------------------------------
// mode: the decision
// ---------------------------------------------------------------------------

test('a PR with no deep review gets a fresh one, whoever asked', () => {
  for (const byBot of [true, false])
    for (const freshSteer of [true, false])
      assert.equal(
        pickMode({ reviewed: false, byBot, freshSteer, awaiting: 3, open: 3 })
          .mode,
        'FRESH'
      );
});

test('a person’s re-run verifies unless the steer asks for fresh', () => {
  // The App's facts do not reach a person's run.
  const facts = { reviewed: true, byBot: false, open: 2, appRuns: 99 };
  assert.equal(pickMode({ ...facts, freshSteer: false }).mode, 'VERIFY');
  assert.equal(pickMode({ ...facts, freshSteer: true }).mode, 'FRESH');
});

test('the App’s run verifies while threads await it, and is fresh with none open', () => {
  // A fresh steer changes none of the answers.
  for (const freshSteer of [true, false]) {
    const facts = { reviewed: true, byBot: true, freshSteer };
    const verify = pickMode({ ...facts, awaiting: 2, open: 3 });
    assert.equal(verify.mode, 'VERIFY');
    assert.match(verify.why, /^2 deep-review thread\(s\) await/);
    const fresh = pickMode({ ...facts, awaiting: 0, open: 0 });
    assert.equal(fresh.mode, 'FRESH');
    assert.match(fresh.why, /no deep-review thread is open/);
    assert.equal(pickMode(facts).mode, 'FRESH');
  }
});

test('the App’s run is skipped while a thread is open and none awaits a pass', () => {
  // A verify pass would settle nothing, and a fresh review would repeat it.
  const skip = pickMode({ reviewed: true, byBot: true, awaiting: 0, open: 1 });
  assert.equal(skip.mode, 'SKIP');
  assert.match(skip.why, /^1 deep-review thread\(s\) are open and none awaits/);
});

test('the App’s runs stop at the cap, whatever else holds', () => {
  for (const reviewed of [true, false]) {
    const over = pickMode({
      reviewed,
      byBot: true,
      awaiting: 1,
      appRuns: APP_RUNS_PER_DAY + 1,
    });
    assert.equal(over.mode, 'SKIP');
    assert.match(over.why, /times in the past day, over the cap of \d+$/);
    assert.notEqual(
      pickMode({ reviewed, byBot: true, appRuns: APP_RUNS_PER_DAY }).mode,
      'SKIP'
    );
  }
});

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------

/** Write `event` to a temporary file and return the env naming it. */
function withEvent(t, event, env = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'deep-review-gate-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const file = join(dir, 'event.json');
  writeFileSync(file, JSON.stringify(event));
  return { GITHUB_EVENT_PATH: file, GITHUB_REPOSITORY: REPO, ...env };
}

async function runWith(argv, env, routes = {}) {
  const { fetchImpl, calls } = fakeFetch(routes);
  const lines = [];
  const outputs = await run({
    argv,
    env,
    fetchImpl,
    log: line => lines.push(line),
    now: () => NOW,
  });
  return {
    outputs,
    log: lines.join('\n'),
    calls,
    paths: calls.map(c => `${c.method} ${c.path}`),
  };
}

test('labeler prints both outputs for the App without an API call', async t => {
  const env = withEvent(t, labeled(), { GITHUB_TOKEN: 't' });
  const { outputs, log, calls } = await runWith(['labeler'], env);
  assert.deepEqual(outputs, ['allowed=true', 'by_bot=true']);
  assert.match(log, /^deep-review-gate: the App cycled deep-review/);
  assert.equal(calls.length, 0);
});

test('labeler looks up a person’s live role', async t => {
  const env = withEvent(t, labeled({ sender: HUMAN }), { GITHUB_TOKEN: 't' });
  const allowed = await runWith(
    ['labeler'],
    env,
    roleRoute('octocat', 'triage')
  );
  assert.deepEqual(allowed.outputs, ['allowed=true', 'by_bot=false']);
  const refused = await runWith(['labeler'], env, roleRoute('octocat', 'read'));
  assert.deepEqual(refused.outputs, ['allowed=false', 'by_bot=false']);
  assert.match(refused.log, /lacks triage access \("read"\)/);
});

test('labeler needs no token when the event decides', async t => {
  const env = withEvent(t, { action: 'opened', pull_request: loopPr() });
  const { outputs } = await runWith(['labeler'], env);
  assert.deepEqual(outputs, ['allowed=true', 'by_bot=false']);
});

test('labeler refuses to look a role up without a token or a repo', async t => {
  const event = labeled({ sender: HUMAN });
  await assert.rejects(
    runWith(['labeler'], withEvent(t, event)),
    /GITHUB_TOKEN is not set/
  );
  await assert.rejects(
    runWith(
      ['labeler'],
      withEvent(t, event, { GITHUB_TOKEN: 't', GITHUB_REPOSITORY: 'nope' })
    ),
    UsageError
  );
});

test('dedupe runs a deep-review labeling without reading the reviews', async t => {
  const env = withEvent(t, labeled(), { GITHUB_TOKEN: 't' });
  const { outputs, log, calls } = await runWith(['dedupe'], env);
  assert.deepEqual(outputs, ['skip=false']);
  assert.match(
    log,
    /^deep-review-gate: deep-review put on by "bestaxbot\[bot\]"/
  );
  assert.equal(calls.length, 0);
});

test('dedupe skips any other event once the PR has a deep review', async t => {
  const env = withEvent(
    t,
    { action: 'opened', pull_request: loopPr() },
    { GITHUB_TOKEN: 't' }
  );
  const reviewed = await runWith(['dedupe'], env, reviewsRoute([FRESH(1)]));
  assert.deepEqual(reviewed.outputs, ['skip=true']);
  assert.deepEqual(reviewed.paths, [REVIEWS]);
  const first = await runWith(['dedupe'], env, reviewsRoute([]));
  assert.deepEqual(first.outputs, ['skip=false']);
  // A review it cannot read fails the run rather than run a second review.
  await assert.rejects(runWith(['dedupe'], env), /HTTP 404/);
  await assert.rejects(
    runWith(
      ['dedupe'],
      withEvent(t, { action: 'opened' }, { GITHUB_TOKEN: 't' })
    ),
    /the event names no pull request/
  );
  await assert.rejects(
    runWith(['dedupe'], {
      ...env,
      GITHUB_TOKEN: '',
    }),
    /GITHUB_TOKEN is not set/
  );
});

test('a person’s mode reads only the reviews', async t => {
  const env = withEvent(t, labeled({ sender: HUMAN }), { GITHUB_TOKEN: 't' });
  const rerun = await runWith(
    ['mode'],
    { ...env, BY_BOT: 'false' },
    reviewsRoute([FRESH(1)])
  );
  assert.deepEqual(rerun.outputs, ['mode=VERIFY', 'run=true']);
  assert.deepEqual(rerun.paths, [REVIEWS]);
  const steered = await runWith(
    ['mode'],
    { ...env, FRESH_STEER: 'true' },
    reviewsRoute([FRESH(1)])
  );
  assert.deepEqual(steered.outputs, ['mode=FRESH', 'run=true']);
  const first = await runWith(['mode'], env, reviewsRoute([]));
  assert.deepEqual(first.outputs, ['mode=FRESH', 'run=true']);
});

/** The App's mode run over `threads`, with `reviews` and `events` on the PR. */
async function appMode(
  t,
  { threads, reviews = [FRESH(0)], events = [], roles = {} }
) {
  const env = withEvent(t, labeled(), {
    GITHUB_TOKEN: 't',
    BY_BOT: 'true',
    FRESH_STEER: 'true',
  });
  return runWith(['mode'], env, {
    ...eventsRoute(events),
    ...reviewsRoute(reviews),
    ...threadsRoute(threads),
    ...Object.assign(
      {},
      ...Object.entries(roles).map(([l, r]) => roleRoute(l, r))
    ),
  });
}

test('the App’s mode reads the events, the reviews and the threads', async t => {
  const result = await appMode(t, {
    threads: [thread(REVIEWER, [BOT_REPLY])],
    events: [labeling(0)],
  });
  assert.deepEqual(result.outputs, ['mode=VERIFY', 'run=true']);
  assert.deepEqual(result.paths, [EVENTS, REVIEWS, 'POST /graphql']);
  assert.equal(result.calls[2].body.variables.number, 912);
  assert.match(result.log, /^deep-review-gate: VERIFY: 1 deep-review thread/);
});

test('the App gets a fresh review with no deep-review thread open', async t => {
  const settled = await appMode(t, {
    threads: [thread(REVIEWER, [BOT_REPLY], true), thread(CODERABBIT)],
  });
  assert.deepEqual(settled.outputs, ['mode=FRESH', 'run=true']);
  // With no deep review yet, the threads are not read.
  const first = await appMode(t, { threads: [], reviews: [] });
  assert.deepEqual(first.outputs, ['mode=FRESH', 'run=true']);
  assert.deepEqual(first.paths, [EVENTS, REVIEWS]);
});

test('the App’s run is skipped on a thread a verify pass already ruled on', async t => {
  // The App's second refutation at minute 3, a verify pass at minute 4 that
  // left it open with no reply, and a later CI fix that moved the head.
  const ruled = thread(REVIEWER, [
    [BOT_REPLY, 1],
    [REVIEWER, 2],
    [BOT_REPLY, 3],
  ]);
  const result = await appMode(t, {
    threads: [ruled],
    reviews: [FRESH(0), VERIFY(2), VERIFY(4)],
  });
  assert.deepEqual(result.outputs, ['mode=SKIP', 'run=false']);
  assert.match(
    result.log,
    /^deep-review-gate: SKIP: 1 deep-review thread\(s\) are open/
  );
  // A maintainer's reply after that pass asks for another.
  const replied = thread(REVIEWER, [
    [BOT_REPLY, 1],
    [REVIEWER, 2],
    [BOT_REPLY, 3],
    [MAINTAINER, 5],
  ]);
  const reopened = await appMode(t, {
    threads: [replied],
    reviews: [FRESH(0), VERIFY(2), VERIFY(4)],
    roles: { allxsmith: 'admin' },
  });
  assert.deepEqual(reopened.outputs, ['mode=VERIFY', 'run=true']);
  assert.deepEqual(reopened.paths, [
    EVENTS,
    REVIEWS,
    'POST /graphql',
    `GET /repos/${REPO}/collaborators/allxsmith/permission`,
  ]);
});

test('a reply counts only from a person whose live role is triage or higher', async t => {
  const threads = [thread(REVIEWER, [MAINTAINER, OUTSIDER])];
  const read = await appMode(t, { threads, roles: { allxsmith: 'read' } });
  assert.deepEqual(read.outputs, ['mode=SKIP', 'run=false']);
  // A role the API cannot read does not count either.
  const unknown = await appMode(t, { threads });
  assert.deepEqual(unknown.outputs, ['mode=SKIP', 'run=false']);
  // The outsider is never looked up.
  assert.ok(!unknown.paths.some(p => p.includes('/octocat/')));
});

test('the App’s run past the cap is skipped before the threads are read', async t => {
  const events = Array.from({ length: APP_RUNS_PER_DAY + 1 }, (_, i) =>
    labeling(i)
  );
  const result = await appMode(t, {
    threads: [thread(REVIEWER, [BOT_REPLY])],
    events,
  });
  assert.deepEqual(result.outputs, ['mode=SKIP', 'run=false']);
  assert.deepEqual(result.paths, [EVENTS, REVIEWS]);
  assert.match(result.log, /over the cap of \d+$/);
  // At the cap, it still runs.
  const at = await appMode(t, {
    threads: [thread(REVIEWER, [BOT_REPLY])],
    events: events.slice(1),
  });
  assert.deepEqual(at.outputs, ['mode=VERIFY', 'run=true']);
});

test('the App’s mode reads the real clock when none is given', async t => {
  const { fetchImpl } = fakeFetch({
    ...eventsRoute([labeling(0)]),
    ...reviewsRoute([]),
  });
  const outputs = await run({
    argv: ['mode'],
    env: withEvent(t, labeled(), { GITHUB_TOKEN: 't', BY_BOT: 'true' }),
    fetchImpl,
    log: () => {},
  });
  assert.deepEqual(outputs, ['mode=FRESH', 'run=true']);
});

test('mode fails rather than guess when it cannot read what it needs', async t => {
  const env = {
    ...withEvent(t, labeled(), { GITHUB_TOKEN: 't' }),
    BY_BOT: 'true',
  };
  // The events, the reviews, and the threads.
  await assert.rejects(runWith(['mode'], env, {}), /HTTP 404/);
  await assert.rejects(runWith(['mode'], env, eventsRoute([])), /HTTP 404/);
  await assert.rejects(
    runWith(['mode'], env, {
      ...eventsRoute([]),
      ...reviewsRoute([FRESH(0)]),
      'POST /graphql': response(200, { errors: [{ message: 'nope' }] }),
    }),
    /GraphQL query failed/
  );
  // An event with no pull request is a usage error, not a guess.
  await assert.rejects(
    runWith(['mode'], {
      ...withEvent(t, { action: 'labeled' }, { GITHUB_TOKEN: 't' }),
      BY_BOT: 'true',
    }),
    UsageError
  );
  await assert.rejects(
    runWith(['mode'], { GITHUB_REPOSITORY: REPO, BY_BOT: 'true' }),
    /GITHUB_EVENT_PATH is not set/
  );
  await assert.rejects(
    runWith(['mode'], { BY_BOT: 'true' }),
    /GITHUB_REPOSITORY must be owner\/name/
  );
  await assert.rejects(
    runWith(['mode'], { ...env, GITHUB_TOKEN: '' }),
    /GITHUB_TOKEN is not set/
  );
});

test('run takes exactly one known command', async () => {
  for (const argv of [[], ['nope'], ['labeler', 'extra'], ['toString']])
    await assert.rejects(runWith(argv, {}), UsageError, argv.join(' '));
});

// ---------------------------------------------------------------------------
// The command line
// ---------------------------------------------------------------------------

/**
 * Run the script as a command. `fetchStub` is the body of a module preloaded
 * with --import that replaces the global fetch, so no request leaves. The
 * parent environment is passed on so coverage of the child is still
 * collected.
 */
function cli(args, env, fetchStub) {
  const preload = fetchStub
    ? ['--import', `data:text/javascript,${encodeURIComponent(fetchStub)}`]
    : [];
  return spawnSync(process.execPath, [...preload, SCRIPT, ...args], {
    encoding: 'utf8',
    env: { ...process.env, GITHUB_TOKEN: '', ...env },
  });
}

test('the command line prints outputs on stdout and logs on stderr', t => {
  const result = cli(['labeler'], withEvent(t, labeled()));
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'allowed=true\nby_bot=true\n');
  assert.match(result.stderr, /^deep-review-gate: the App cycled/);
});

test('the command line exits 2 on bad usage and 1 on an API error', t => {
  const bad = cli(['bogus'], {});
  assert.equal(bad.status, 2);
  assert.equal(bad.stdout, '');
  assert.match(bad.stderr, /^deep-review-gate: usage error: /);

  const offline = cli(
    ['mode'],
    {
      ...withEvent(t, labeled(), { GITHUB_TOKEN: 't' }),
      BY_BOT: 'true',
    },
    'globalThis.fetch = async () => { throw new Error("offline"); };'
  );
  assert.equal(offline.status, 1);
  assert.equal(offline.stdout, '');
  assert.match(offline.stderr, /^deep-review-gate: "offline"/);
});

// ---------------------------------------------------------------------------
// The workflow
// ---------------------------------------------------------------------------

function reviewSteps() {
  const lines = readFileSync(
    join(ROOT, '.github/workflows/claude-review.yml'),
    'utf8'
  ).split(/\r?\n/);
  const steps = yamlGet(lines, 'jobs', 'review', 'steps');
  assert.ok(steps, 'claude-review.yml has no review steps');
  return steps.lines.join('\n');
}

test('claude-review.yml runs every command from its default-branch checkout', () => {
  const text = reviewSteps();
  const checkout =
    /- name: Check out the default branch for the gate script\n(?:\s+#.*\n)*\s+uses: actions\/checkout@[0-9a-f]{40} # v7\n\s+with:\n\s+ref: \$\{\{ github\.event\.repository\.default_branch \}\}\n\s+path: (\S+)\n/.exec(
      text
    );
  assert.ok(checkout, 'no default-branch checkout step');
  const path = checkout[1];
  for (const command of ['labeler', 'dedupe', 'mode'])
    assert.ok(
      text.includes(
        `node ${path}/scripts/deep-review-gate.mjs ${command} >> "$GITHUB_OUTPUT"`
      ),
      `no step runs ${command} from ${path}`
    );
  // The checkout precedes every call and the PR head checkout follows them.
  const at = needle => text.indexOf(needle);
  assert.ok(at(checkout[0]) < at('deep-review-gate.mjs labeler'));
  assert.ok(
    at('deep-review-gate.mjs labeler') < at('deep-review-gate.mjs dedupe')
  );
  assert.ok(
    at('deep-review-gate.mjs dedupe') < at('deep-review-gate.mjs mode')
  );
  assert.ok(at('deep-review-gate.mjs mode') < at('- name: Checkout PR head'));
});

test('claude-review.yml reads the outputs the script prints', () => {
  const text = reviewSteps();
  for (const output of [
    'steps.perm.outputs.allowed',
    'steps.perm.outputs.by_bot',
    'steps.dedupe.outputs.skip',
    'steps.mode.outputs.mode',
    'steps.mode.outputs.run',
  ])
    assert.ok(text.includes(output), output);
});

test('claude-review.yml runs nothing of the PR’s when the mode is SKIP', () => {
  const text = reviewSteps();
  for (const name of [
    'Checkout PR head',
    'Setup pnpm',
    'Setup Node.js',
    'Install dependencies',
    'Run Claude (deep review)',
  ]) {
    const start = text.indexOf(`- name: ${name}\n`);
    assert.ok(start !== -1, name);
    const end = text.indexOf('\n      - name: ', start + 1);
    const step = text.slice(start, end === -1 ? undefined : end);
    const condition = /\n\s+if: (.*)\n/.exec(step)?.[1] ?? '';
    assert.ok(
      condition.includes("steps.mode.outputs.run == 'true'"),
      `${name} runs whatever the mode is: ${condition}`
    );
  }
});
