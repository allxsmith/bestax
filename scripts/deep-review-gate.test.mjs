/**
 * Guards on who may start a Claude deep review and in which mode it runs
 * (deep-review-gate.mjs).
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
  awaitingVerify,
  isAppLoopPr,
  labelerCheck,
  liveRole,
  pickMode,
  roleDecision,
  run,
} from './deep-review-gate.mjs';
import { APP_LOGIN, UsageError, createClient } from './review-converged.mjs';
import { yamlGet } from './check-conformance.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const SCRIPT = join(HERE, 'deep-review-gate.mjs');
const REPO = 'allxsmith/bestax';
const APP = { login: APP_LOGIN, type: 'Bot' };
const HUMAN = { login: 'octocat', type: 'User' };

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

/** A GraphQL comment node, `minute` minutes past a fixed hour. */
function comment(minute, author) {
  return {
    createdAt: `2026-10-09T12:${String(minute).padStart(2, '0')}:00Z`,
    author,
    originalCommit: { oid: 'a'.repeat(40) },
    pullRequestReview: { commit: { oid: 'a'.repeat(40) } },
  };
}

const REVIEWER = { login: 'claude', __typename: 'Bot' };
const BOT_REPLY = { login: 'bestaxbot', __typename: 'Bot' };
const MAINTAINER = { login: 'allxsmith', __typename: 'User' };
const CODERABBIT = { login: 'coderabbitai', __typename: 'Bot' };

/** A thread node opened by `by`, with the later comments' authors in order. */
function thread(by, later = [], resolved = false) {
  const first = comment(0, by);
  return {
    isResolved: resolved,
    resolvedBy: resolved ? { login: 'claude[bot]' } : null,
    opener: { nodes: [first] },
    latest: {
      nodes: [first, ...later.map((author, i) => comment(i + 1, author))],
    },
  };
}

// ---------------------------------------------------------------------------
// The App's loop PRs (the App itself is review-converged.mjs's isAppPr)
// ---------------------------------------------------------------------------

test('an App loop PR is the App’s, carries ai-loop and is on a claude/ branch', () => {
  assert.equal(isAppLoopPr(loopPr()), true);
  assert.equal(isAppLoopPr(loopPr({ labels: ['ai-loop'] })), true);
  assert.equal(isAppLoopPr(loopPr({ user: HUMAN })), false);
  assert.equal(
    isAppLoopPr(loopPr({ user: { login: 'bestaxbot', type: 'User' } })),
    false
  );
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
  assert.deepEqual(
    labelerCheck(labeled({ sender: { login: 'bestaxbot', type: 'User' } })),
    { lookup: 'bestaxbot' }
  );
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
// mode
// ---------------------------------------------------------------------------

test('a thread awaits a verify pass when someone answered the reviewer', () => {
  // The App's Fixed in or refutation, a maintainer's reply, and anyone
  // else's last word all leave the reviewer a thread to settle.
  assert.equal(awaitingVerify([thread(REVIEWER, [BOT_REPLY])]), 1);
  assert.equal(awaitingVerify([thread(REVIEWER, [MAINTAINER])]), 1);
  assert.equal(
    awaitingVerify([thread(REVIEWER, [BOT_REPLY, REVIEWER, BOT_REPLY])]),
    1
  );
  assert.equal(awaitingVerify([thread(REVIEWER, [CODERABBIT])]), 1);
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
});

test('a PR with no deep review gets a fresh one, whoever asked', () => {
  for (const byBot of [true, false])
    for (const freshSteer of [true, false])
      assert.equal(
        pickMode({ reviewed: false, byBot, freshSteer, awaiting: 3 }).mode,
        'FRESH'
      );
});

test('a person’s re-run verifies unless the steer asks for fresh', () => {
  assert.equal(
    pickMode({ reviewed: true, byBot: false, freshSteer: false, awaiting: 0 })
      .mode,
    'VERIFY'
  );
  assert.equal(
    pickMode({ reviewed: true, byBot: false, freshSteer: true, awaiting: 3 })
      .mode,
    'FRESH'
  );
});

test('the App’s run verifies while threads await it, and is fresh otherwise', () => {
  // A fresh steer changes neither answer.
  for (const freshSteer of [true, false]) {
    const verify = pickMode({
      reviewed: true,
      byBot: true,
      freshSteer,
      awaiting: 2,
    });
    assert.equal(verify.mode, 'VERIFY');
    assert.match(verify.why, /^2 deep-review thread\(s\) await/);
    const fresh = pickMode({
      reviewed: true,
      byBot: true,
      freshSteer,
      awaiting: 0,
    });
    assert.equal(fresh.mode, 'FRESH');
    assert.match(fresh.why, /no deep-review thread awaits/);
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
  });
  return { outputs, log: lines.join('\n'), calls };
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

test('mode reads the threads only for the App’s run on a reviewed PR', async t => {
  const env = withEvent(t, labeled(), { GITHUB_TOKEN: 't' });
  const routes = threadsRoute([thread(REVIEWER, [BOT_REPLY])]);
  const app = await runWith(
    ['mode'],
    { ...env, REVIEWED: 'true', BY_BOT: 'true', FRESH_STEER: 'true' },
    routes
  );
  assert.deepEqual(app.outputs, ['mode=VERIFY']);
  assert.equal(app.calls.length, 1);
  assert.equal(app.calls[0].body.variables.number, 912);
  assert.match(app.log, /^deep-review-gate: VERIFY: 1 deep-review thread/);

  const settled = await runWith(
    ['mode'],
    { ...env, REVIEWED: 'true', BY_BOT: 'true' },
    threadsRoute([thread(REVIEWER, [BOT_REPLY], true)])
  );
  assert.deepEqual(settled.outputs, ['mode=FRESH']);

  // A person's run and an unreviewed PR need no API, and no token.
  const person = await runWith(['mode'], { REVIEWED: 'true', BY_BOT: 'false' });
  assert.deepEqual(person.outputs, ['mode=VERIFY']);
  assert.equal(person.calls.length, 0);
  const steered = await runWith(['mode'], {
    REVIEWED: 'true',
    FRESH_STEER: 'true',
  });
  assert.deepEqual(steered.outputs, ['mode=FRESH']);
  const first = await runWith(['mode'], { REVIEWED: 'false', BY_BOT: 'true' });
  assert.deepEqual(first.outputs, ['mode=FRESH']);
  assert.equal(first.calls.length, 0);
});

test('mode fails rather than guess when the threads cannot be read', async t => {
  const env = {
    ...withEvent(t, labeled(), { GITHUB_TOKEN: 't' }),
    REVIEWED: 'true',
    BY_BOT: 'true',
  };
  await assert.rejects(runWith(['mode'], env, {}), /HTTP 404/);
  await assert.rejects(
    runWith(['mode'], env, {
      'POST /graphql': response(200, { errors: [{ message: 'nope' }] }),
    }),
    /GraphQL query failed/
  );
  // An event with no pull request is a usage error, not a guess.
  const noPr = {
    ...withEvent(t, { action: 'labeled' }, { GITHUB_TOKEN: 't' }),
    REVIEWED: 'true',
    BY_BOT: 'true',
  };
  await assert.rejects(runWith(['mode'], noPr), UsageError);
  await assert.rejects(
    runWith(['mode'], {
      GITHUB_REPOSITORY: REPO,
      REVIEWED: 'true',
      BY_BOT: 'true',
    }),
    /GITHUB_EVENT_PATH is not set/
  );
  await assert.rejects(
    runWith(['mode'], { REVIEWED: 'true', BY_BOT: 'true' }),
    /GITHUB_REPOSITORY must be owner\/name/
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
      REVIEWED: 'true',
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

test('claude-review.yml runs both commands from its default-branch checkout', () => {
  const text = reviewSteps();
  const checkout =
    /- name: Check out the default branch for the gate script\n(?:\s+#.*\n)*\s+uses: actions\/checkout@[0-9a-f]{40} # v7\n\s+with:\n\s+ref: \$\{\{ github\.event\.repository\.default_branch \}\}\n\s+path: (\S+)\n/.exec(
      text
    );
  assert.ok(checkout, 'no default-branch checkout step');
  const path = checkout[1];
  for (const command of ['labeler', 'mode'])
    assert.ok(
      text.includes(
        `node ${path}/scripts/deep-review-gate.mjs ${command} >> "$GITHUB_OUTPUT"`
      ),
      `no step runs ${command} from ${path}`
    );
  // The checkout precedes both calls and the PR head checkout follows them.
  const at = needle => text.indexOf(needle);
  assert.ok(at(checkout[0]) < at('deep-review-gate.mjs labeler'));
  assert.ok(at('deep-review-gate.mjs mode') < at('- name: Checkout PR head'));
});

test('claude-review.yml reads the outputs the script prints', () => {
  const text = reviewSteps();
  for (const output of [
    'steps.perm.outputs.allowed',
    'steps.perm.outputs.by_bot',
    'steps.mode.outputs.mode',
  ])
    assert.ok(text.includes(output), output);
});
