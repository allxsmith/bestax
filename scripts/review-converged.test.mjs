/**
 * Guards on the review-converged label sync (review-converged.mjs).
 *
 * The decision is a pure function over fetched data, so most of this file
 * hands it fixtures and checks the verdict. The heading fixtures are the
 * shapes real deep-review summaries on this repository have used, because a
 * shape the parser misses fails closed and the label never appears. The end
 * of the file drives run() against a fake fetch, so the label writes, the
 * dry run and the re-read before each write are covered without the network,
 * and reads review-converged.yml so the names and the trigger it shares with
 * the script cannot drift apart.
 *
 * `.mjs` and `node --test` rather than jest: these are root-level scripts with
 * no package of their own, matching auto-close-duplicates.test.mjs.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import {
  APP_LOGIN,
  FLAG_LABEL,
  LABEL,
  MARKER,
  NO_FINDINGS_LINE,
  OWN_CHECK_NAME,
  THREADS_QUERY,
  UsageError,
  checkProblems,
  convergenceProblems,
  createClient,
  decide,
  fetchThreads,
  forLog,
  isAppPr,
  isBestaxbotApp,
  isDeepReviewAuthor,
  isDeepReviewResolver,
  labelNames,
  latestRuns,
  latestStatuses,
  newestSummary,
  nextLink,
  parseArgs,
  parseSummary,
  planAction,
  run,
  scopeOf,
  threadFacts,
} from './review-converged.mjs';
import { yamlGet, yamlItems, yamlScalar } from './check-conformance.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const SCRIPT = join(HERE, 'review-converged.mjs');
const REPO = 'allxsmith/bestax';
const HEAD = 'a'.repeat(40);
const OLD = 'b'.repeat(40);
const MID = 'c'.repeat(40);
const BOT = { login: 'claude[bot]', type: 'Bot' };
/** The bestaxbot App, and the machine User the older workflows post as. */
const APP_USER = { login: APP_LOGIN, type: 'Bot' };
const MACHINE_USER = { login: 'bestaxbot', type: 'User' };

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function pr(overrides = {}) {
  const { labels = ['deep-review'], ...rest } = overrides;
  return {
    number: 870,
    state: 'open',
    head: { sha: HEAD, repo: { full_name: REPO } },
    base: { ref: 'main' },
    labels: labels.map(name => ({ name })),
    ...rest,
  };
}

function summary(body, overrides = {}) {
  return {
    id: 2,
    user: BOT,
    body,
    commit_id: HEAD,
    submitted_at: '2026-10-03T12:00:00Z',
    state: 'COMMENTED',
    ...overrides,
  };
}

const FRESH_CLEAN = `${MARKER}\n## Deep review — 0 blocking · 0 advisory\n\n${NO_FINDINGS_LINE}`;
const VERIFY_CLEAN = `${MARKER}\n\n## Deep review (verify) — 2 resolved · 0 open\n`;

/** A clean fresh review on the head, posted before the summary() default. */
const EARLIER = summary(FRESH_CLEAN, {
  id: 1,
  submitted_at: '2026-10-03T10:00:00Z',
});

const GREEN_RUN = {
  name: 'Build and Test',
  status: 'completed',
  conclusion: 'success',
  app: { slug: 'github-actions' },
};
const GREEN_STATUS = {
  context: 'CodeRabbit',
  state: 'success',
  updated_at: '2026-10-03T12:00:00Z',
};

function converged(overrides = {}) {
  return {
    repo: REPO,
    defaultBranch: 'main',
    pr: pr(),
    reviews: [summary(FRESH_CLEAN)],
    threads: [{ isResolved: true }],
    checkRuns: [GREEN_RUN],
    statuses: [GREEN_STATUS],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// parseArgs and forLog
// ---------------------------------------------------------------------------

test('parseArgs reads the repo, an optional PR and the dry-run flag', () => {
  assert.deepEqual(parseArgs([`--repo=${REPO}`]), {
    repo: REPO,
    pr: null,
    dryRun: false,
  });
  assert.deepEqual(parseArgs([`--repo=${REPO}`, '--pr=870', '--dry-run']), {
    repo: REPO,
    pr: 870,
    dryRun: true,
  });
  // The workflow always passes --pr, empty outside a dispatch.
  assert.equal(parseArgs([`--repo=${REPO}`, '--pr=']).pr, null);
});

test('parseArgs refuses anything else', () => {
  for (const argv of [
    [],
    ['--repo=nope'],
    ['--repo=a/b c'],
    [`--repo=${REPO}`, '--pr=0'],
    [`--repo=${REPO}`, '--pr=12a'],
    [`--repo=${REPO}`, '--pr=-1'],
    [`--repo=${REPO}`, '--sweep'],
  ]) {
    assert.throws(() => parseArgs(argv), UsageError, argv.join(' '));
  }
});

test('forLog keeps a value on one inert line', () => {
  assert.equal(forLog('a\n::error::x'), '"a\\n::error::x"');
  assert.equal(forLog(undefined), '""');
  assert.ok(!forLog('x\r\ny').includes('\n'));
});

// ---------------------------------------------------------------------------
// Who wrote the summary, and which one is newest
// ---------------------------------------------------------------------------

test('only the Claude app counts as the deep reviewer', () => {
  assert.equal(isDeepReviewAuthor(BOT), true);
  assert.equal(isDeepReviewAuthor({ login: 'claude', type: 'Bot' }), true);
  // `claude` is also an ordinary User account on GitHub.
  assert.equal(isDeepReviewAuthor({ login: 'claude', type: 'User' }), false);
  assert.equal(
    isDeepReviewAuthor({ login: 'claude[bot]', type: 'User' }),
    false
  );
  assert.equal(
    isDeepReviewAuthor({ login: 'coderabbitai[bot]', type: 'Bot' }),
    false
  );
  assert.equal(isDeepReviewAuthor({ type: 'Bot' }), false);
  assert.equal(isDeepReviewAuthor(null), false);
});

test('only the Claude app counts as resolving a thread for the deep review', () => {
  // GraphQL types resolvedBy as a User, so the app reads as one there.
  assert.equal(isDeepReviewResolver({ login: 'claude[bot]' }), true);
  for (const user of [{ login: 'claude' }, { login: 'allxsmith' }, {}, null])
    assert.equal(isDeepReviewResolver(user), false, JSON.stringify(user));
});

test('newestSummary picks the newest marker review by the app', () => {
  const older = summary(FRESH_CLEAN, {
    id: 1,
    submitted_at: '2026-10-03T10:00:00Z',
  });
  const newer = summary(VERIFY_CLEAN, { id: 9 });
  assert.equal(newestSummary([newer, older]), newer);
  assert.equal(newestSummary([older, newer]), newer);
  // Same second: the higher id is the later review.
  const twin = summary(FRESH_CLEAN, { id: 10 });
  assert.equal(newestSummary([twin, newer]), twin);
});

test('newestSummary ignores reviews that are not summaries', () => {
  const later = '2026-10-03T13:00:00Z';
  const real = summary(FRESH_CLEAN);
  const noise = [
    summary(FRESH_CLEAN, { user: { login: 'claude', type: 'User' } }),
    summary('', { submitted_at: later }),
    summary('inline finding', { submitted_at: later }),
    summary(FRESH_CLEAN, { submitted_at: null }),
    summary(null, { submitted_at: later }),
    null,
  ];
  assert.equal(newestSummary([real, ...noise]), real);
  assert.equal(newestSummary(noise), null);
  assert.equal(newestSummary(undefined), null);
});

// ---------------------------------------------------------------------------
// parseSummary
// ---------------------------------------------------------------------------

test('parseSummary reads every heading shape the deep review has used', () => {
  const fresh = (blocking, advisory) => ({
    kind: 'fresh',
    blocking,
    advisory,
  });
  const verify = (resolved, open) => ({ kind: 'verify', resolved, open });
  const cases = [
    ['## Deep review — 0 blocking · 5 advisory', fresh(0, 5)],
    ['## Deep review — 2 blocking · 5 advisory', fresh(2, 5)],
    ['<h2>Deep review — 0 blocking · 5 advisory</h2>', fresh(0, 5)],
    ['Deep review — 1 blocking · 6 advisory\n---', fresh(1, 6)],
    ['Deep review — 0 blocking · 3 advisory\n===', fresh(0, 3)],
    ['## Deep review (verify) — 2 resolved · 0 open', verify(2, 0)],
    ['<h2>Deep review (verify) — 1 resolved · 0 open</h2>', verify(1, 0)],
    ['Deep review (verify) — 1 resolved · 0 open\n------', verify(1, 0)],
    ['## Deep review (verify) — 0 resolved · 3 open', verify(0, 3)],
    // Close variants of the same heading.
    ['### Deep review – 0 blocking · 1 advisory ###', fresh(0, 1)],
    ['**Deep review - 0 blocking | 2 advisory**', fresh(0, 2)],
    ['# deep review -- 0 blocking, 0 advisory', fresh(0, 0)],
  ];
  for (const [heading, want] of cases) {
    assert.deepEqual(parseSummary(`${MARKER}\n${heading}\n\n| x |`), want);
    // A blank line after the marker and CRLF line ends read the same.
    assert.deepEqual(
      parseSummary(`${MARKER}\r\n\r\n${heading.replace(/\n/g, '\r\n')}`),
      want,
      heading
    );
  }
});

test('the zero-findings form reads as zero blocking', () => {
  const body = `${MARKER}\n## Deep review — 0 blocking · 0 advisory\n\n${NO_FINDINGS_LINE}\n\n**Overall:** fine.`;
  assert.deepEqual(parseSummary(body), {
    kind: 'fresh',
    blocking: 0,
    advisory: 0,
  });
});

test('parseSummary fails closed on anything it cannot read', () => {
  const unparseable = body => {
    const got = parseSummary(body);
    assert.equal(got.kind, 'unparseable', JSON.stringify(body));
    assert.equal(typeof got.why, 'string');
  };
  unparseable('');
  unparseable(undefined);
  unparseable(`\n${MARKER}\n## Deep review — 0 blocking · 0 advisory`);
  unparseable(`quoted ${MARKER}\n## Deep review — 0 blocking · 0 advisory`);
  unparseable(`${MARKER}\n\n  \n`);
  unparseable(`${MARKER}\n## Deep review`);
  unparseable(`${MARKER}\n## Deep review — no blocking · 0 advisory`);
  unparseable(`${MARKER}\n## Deep review — 0 blocking · 0 advisory, honest`);
  unparseable(`${MARKER}\n## Deep review — 12345 blocking · 0 advisory`);
  unparseable(`${MARKER}\n## Deep review (verify) — 1 resolved`);
  unparseable(
    `${MARKER}\n| # | Severity |\n## Deep review — 0 blocking · 0 advisory`
  );
  // A heading that counts blocking findings beside the zero-findings line
  // contradicts itself.
  unparseable(
    `${MARKER}\n## Deep review — 2 blocking · 0 advisory\n\n${NO_FINDINGS_LINE}`
  );
});

// ---------------------------------------------------------------------------
// Scope
// ---------------------------------------------------------------------------

test('only the Bot-type bestaxbot[bot] is the App', () => {
  assert.equal(isBestaxbotApp(APP_USER), true);
  // The machine User and a person cannot pass for it, and neither can the
  // bare login GraphQL uses or a Bot with another name.
  assert.equal(isBestaxbotApp(MACHINE_USER), false);
  assert.equal(isBestaxbotApp({ login: APP_LOGIN, type: 'User' }), false);
  assert.equal(isBestaxbotApp({ login: 'bestaxbot', type: 'Bot' }), false);
  assert.equal(isBestaxbotApp(BOT), false);
  assert.equal(isBestaxbotApp(undefined), false);
  assert.equal(isAppPr(pr({ user: APP_USER })), true);
  assert.equal(isAppPr(pr({ user: MACHINE_USER })), false);
  assert.equal(isAppPr(pr()), false);
  assert.equal(isAppPr(undefined), false);
});

test('scopeOf keeps open same-repo deep-review PRs, and the App’s ai-loop PRs, on main', () => {
  const scope = (p, branch = 'main') => scopeOf(p, REPO, branch);
  assert.equal(scope(pr()), null);
  assert.equal(
    scope(pr({ head: { sha: HEAD, repo: { full_name: 'AllxSmith/Bestax' } } })),
    null
  );
  assert.equal(scope(pr({ state: 'closed' })), 'not open');
  assert.equal(scope(undefined), 'not open');
  assert.equal(
    scope(pr({ head: { sha: HEAD, repo: { full_name: 'fork/bestax' } } })),
    'head branch is not in this repo'
  );
  assert.equal(
    scope(pr({ head: { sha: HEAD, repo: null } })),
    'head branch is not in this repo'
  );
  assert.equal(
    scope(pr({ labels: [] })),
    'no deep-review label, and not an ai-loop PR the App opened'
  );
  // The App's own PRs are judged like any other. Its fresh review starts on
  // ai-loop, and deep-review arrives only with a later cycle, so a fresh
  // review with no findings leaves the PR with ai-loop alone.
  const app = labels => pr({ labels, user: APP_USER });
  assert.equal(scope(app(['ai-loop'])), null);
  assert.equal(scope(app(['deep-review', 'ai-loop'])), null);
  // ai-loop keeps anyone else's PR out, deep-review or not: claude-pr-loop.yml
  // drives the PRs the machine User opened and hands them off itself.
  for (const user of [
    MACHINE_USER,
    { login: 'octocat', type: 'User' },
    undefined,
  ]) {
    assert.equal(
      scope(pr({ labels: ['ai-loop'], user })),
      'no deep-review label, and not an ai-loop PR the App opened'
    );
    assert.equal(
      scope(pr({ labels: ['deep-review', 'ai-loop'], user })),
      'ai-loop PR the App did not open, which claude-pr-loop.yml hands off'
    );
  }
  // The App's handoff and park take ai-loop and deep-review off, and the PR
  // leaves scope, keeping whatever label it has. A label that only starts
  // with a scope label's name is not one.
  assert.equal(
    scope(app(['ai-loop-paused', 'needs-human-review', LABEL])),
    'no deep-review label, and not an ai-loop PR the App opened'
  );
});

test('a PR stacked on another branch is out of scope', () => {
  // CI runs only on pull requests to main, so a stacked PR has no CI to judge.
  assert.equal(
    scopeOf(pr({ base: { ref: 'feat/base' } }), REPO, 'main'),
    'based on "feat/base", not "main"'
  );
  assert.equal(
    scopeOf(pr({ base: undefined }), REPO, 'main'),
    'based on "", not "main"'
  );
  // A base name reaches the reason escaped.
  assert.ok(
    !scopeOf(pr({ base: { ref: 'x\n::error::y' } }), REPO, 'main').includes(
      '\n'
    )
  );
  // The same PR is in scope when its base is the default branch.
  assert.equal(scopeOf(pr({ base: { ref: 'trunk' } }), REPO, 'trunk'), null);
});

test('without the default branch every open same-repo PR is out of scope', () => {
  for (const branch of [undefined, null, '', 7])
    assert.equal(
      scopeOf(pr(), REPO, branch),
      'the default branch is unknown',
      String(branch)
    );
  assert.deepEqual(
    decide(
      converged({
        defaultBranch: undefined,
        pr: pr({ labels: ['deep-review', LABEL] }),
      })
    ),
    {
      number: 870,
      skip: 'the default branch is unknown',
      problems: [],
      action: 'none',
    }
  );
});

test('labelNames skips labels without a string name', () => {
  assert.deepEqual(
    labelNames({ labels: [{ name: 'a' }, { name: 3 }, null, {}] }),
    ['a']
  );
  assert.deepEqual(labelNames(undefined), []);
});

// ---------------------------------------------------------------------------
// Checks and statuses
// ---------------------------------------------------------------------------

test('checks pass only when every one finished well', () => {
  const run = (status, conclusion, name = 'x') => ({
    name,
    status,
    conclusion,
    app: { slug: 'github-actions' },
  });
  assert.deepEqual(
    checkProblems(
      [
        run('completed', 'success', 'a'),
        run('completed', 'neutral', 'b'),
        run('completed', 'skipped', 'c'),
      ],
      []
    ),
    []
  );
  for (const conclusion of [
    'failure',
    'cancelled',
    'timed_out',
    'action_required',
    'stale',
    null,
  ]) {
    assert.equal(
      checkProblems([run('completed', conclusion)], []).length,
      1,
      String(conclusion)
    );
  }
  for (const status of ['queued', 'in_progress', 'waiting', 'pending']) {
    assert.match(
      checkProblems([run(status, null)], [])[0],
      new RegExp(`is "${status}"`)
    );
  }
});

test('this workflow’s own check run is left out, and only that one', () => {
  const own = {
    name: OWN_CHECK_NAME,
    status: 'in_progress',
    conclusion: null,
    app: { slug: 'github-actions' },
  };
  assert.deepEqual(checkProblems([own, GREEN_RUN], []), []);
  // Leaving it out leaves nothing, and nothing is not a pass.
  assert.deepEqual(checkProblems([own], []), [
    'no check runs or statuses on the head commit',
  ]);
  // The same name from another app still counts.
  assert.equal(
    checkProblems([{ ...own, app: { slug: 'other' } }, GREEN_RUN], []).length,
    1
  );
});

test('statuses pass only on success, newest per context', () => {
  assert.deepEqual(checkProblems([], [GREEN_STATUS]), []);
  for (const state of ['pending', 'failure', 'error', undefined]) {
    assert.equal(
      checkProblems([], [{ ...GREEN_STATUS, state }]).length,
      1,
      String(state)
    );
  }
  const stale = {
    ...GREEN_STATUS,
    state: 'pending',
    updated_at: '2026-10-03T11:00:00Z',
  };
  assert.deepEqual(checkProblems([], [stale, GREEN_STATUS]), []);
  assert.deepEqual(checkProblems([], [GREEN_STATUS, stale]), []);
});

/** A deep-review check run, as GitHub lists one on the head commit. */
const reviewRun = (id, startedAt, conclusion) => ({
  id,
  name: 'review',
  status: 'completed',
  conclusion,
  started_at: `2026-10-03T${startedAt}Z`,
  app: { slug: 'github-actions' },
});

test('a deep review cancelled and then run again converges', () => {
  // PR #879's head: the review was cancelled for a re-steer, and the label
  // toggle ran a fresh one that succeeded. The cancelled run stays listed.
  const cancelled = reviewRun(111230277145, '15:14:03', 'cancelled');
  const fresh = reviewRun(111232410036, '15:26:25', 'success');
  for (const checkRuns of [
    [GREEN_RUN, cancelled, fresh],
    [fresh, GREEN_RUN, cancelled],
  ]) {
    const latest = latestRuns(checkRuns);
    assert.equal(latest.length, 2);
    assert.ok(latest.includes(GREEN_RUN) && latest.includes(fresh));
    assert.deepEqual(convergenceProblems(converged({ checkRuns })), []);
  }
});

test('a newer failure of the same check is not hidden by an older success', () => {
  const passed = reviewRun(1, '15:14:03', 'success');
  const failed = reviewRun(2, '15:26:25', 'failure');
  for (const checkRuns of [
    [passed, failed],
    [failed, passed],
  ])
    assert.deepEqual(convergenceProblems(converged({ checkRuns })), [
      'check "review" concluded "failure"',
    ]);
});

test('a skipped run only stands in when every run under its name was skipped', () => {
  // Some job names are shared between workflows, and a skipped `gate` from one
  // of them must not hide a failed `gate` that ran.
  const failed = { ...reviewRun(1, '15:14:03', 'failure'), name: 'gate' };
  const skipped = { ...reviewRun(2, '15:26:25', 'skipped'), name: 'gate' };
  assert.deepEqual(latestRuns([failed, skipped]), [failed]);
  assert.deepEqual(latestRuns([skipped, failed]), [failed]);
  const later = { ...skipped, id: 3, started_at: '2026-10-03T15:30:00Z' };
  assert.deepEqual(latestRuns([later, skipped]), [later]);
});

test('latestRuns keys by app and name, and breaks a tie by id', () => {
  const a = reviewRun(1, '15:00:00', 'failure');
  const b = reviewRun(2, '15:00:00', 'success');
  assert.deepEqual(latestRuns([a, b]), [b]);
  assert.deepEqual(latestRuns([b, a]), [b]);
  // A run with no start time is older than any that has one.
  const undated = { ...b, id: 9, started_at: undefined };
  assert.deepEqual(latestRuns([undated, a]), [a]);
  // The same name from another app is a different check.
  const other = { ...a, app: { slug: 'other' } };
  assert.deepEqual(latestRuns([b, other]), [b, other]);
  assert.deepEqual(latestRuns([{}, null]), [{}]);
  assert.deepEqual(latestRuns(undefined), []);
});

test('latestStatuses breaks a timestamp tie by id', () => {
  const a = { context: 'c', state: 'pending', id: 1 };
  const b = { context: 'c', state: 'success', id: 2 };
  assert.deepEqual(latestStatuses([a, b]), [b]);
  assert.deepEqual(latestStatuses([b, a]), [b]);
  assert.deepEqual(latestStatuses([{}, null]), [{}]);
  assert.deepEqual(latestStatuses(undefined), []);
});

test('missing lists read as empty, and empty checks are not a pass', () => {
  assert.deepEqual(checkProblems(undefined, undefined), [
    'no check runs or statuses on the head commit',
  ]);
  assert.deepEqual(convergenceProblems(converged({ threads: undefined })), []);
});

test('check names reach the problem text escaped', () => {
  const [problem] = checkProblems(
    [{ name: 'evil\n::error::x', status: 'queued' }],
    undefined
  );
  assert.ok(!problem.includes('\n'));
});

// ---------------------------------------------------------------------------
// Convergence and the decision
// ---------------------------------------------------------------------------

test('a clean fresh review on the head converges', () => {
  assert.deepEqual(convergenceProblems(converged()), []);
  assert.deepEqual(convergenceProblems(converged({ threads: [] })), []);
});

test('each condition on its own stops convergence', () => {
  const cases = [
    [{ reviews: [] }, /^no deep-review summary$/],
    [
      { reviews: [summary(FRESH_CLEAN, { commit_id: OLD })] },
      /^the newest summary is for bbbbbbb, not the head aaaaaaa$/,
    ],
    [
      { reviews: [summary(FRESH_CLEAN, { commit_id: null })] },
      /is for "", not the head/,
    ],
    [
      {
        pr: pr({ head: { repo: { full_name: REPO } } }),
        reviews: [summary(FRESH_CLEAN, { commit_id: undefined })],
      },
      /is for "", not the head ""$/,
    ],
    [
      {
        reviews: [
          summary(`${MARKER}\n## Deep review — 1 blocking · 0 advisory`),
        ],
      },
      /reports 1 blocking/,
    ],
    [
      {
        reviews: [
          summary(`${MARKER}\n## Deep review — 0 blocking · 1 advisory`),
        ],
      },
      /reports 0 blocking and 1 advisory$/,
    ],
    [
      {
        reviews: [
          EARLIER,
          summary(`${MARKER}\n## Deep review (verify) — 0 resolved · 2 open`),
        ],
      },
      /leaves 2 open/,
    ],
    [
      { reviews: [EARLIER, summary(`${MARKER}\nsomething else`)] },
      /did not parse: its heading matches neither shape/,
    ],
    [{ threads: [{ isResolved: false }, {}] }, /^2 unresolved review thread/],
    [
      { checkRuns: [{ ...GREEN_RUN, conclusion: 'failure' }] },
      /concluded "failure"/,
    ],
    [{ statuses: [{ ...GREEN_STATUS, state: 'pending' }] }, /is "pending"/],
    [
      { pr: pr({ labels: ['deep-review', 'needs-security-review'] }) },
      /^carries needs-security-review$/,
    ],
  ];
  for (const [overrides, want] of cases) {
    const problems = convergenceProblems(converged(overrides));
    assert.equal(problems.length, 1, JSON.stringify(problems));
    assert.match(problems[0], want);
  }
});

test('a newer summary that does not parse is not covered by an older one', () => {
  const older = summary(FRESH_CLEAN, {
    id: 1,
    submitted_at: '2026-10-03T10:00:00Z',
  });
  const newer = summary(
    `> quoting\n${MARKER}\n## Deep review — 0 blocking · 0 advisory`
  );
  const problems = convergenceProblems(converged({ reviews: [older, newer] }));
  assert.deepEqual(problems, [
    'the newest summary did not parse: the marker is not its first line',
  ]);
});

// ---------------------------------------------------------------------------
// The fresh review behind the head
// ---------------------------------------------------------------------------

/** A timestamp `minute` minutes after 11:00, to the second. */
const stamp = minute => {
  const seconds = Math.round(minute * 60);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `2026-10-03T11:${mm}:${ss}Z`;
};

/** A summary posted at the given minute, so the order is explicit. */
const posted = (body, minute, overrides = {}) =>
  summary(body, { id: minute, submitted_at: stamp(minute), ...overrides });
const freshWith = (blocking, advisory = 0) =>
  `${MARKER}\n## Deep review — ${blocking} blocking · ${advisory} advisory`;
const verifyWith = (resolved, open) =>
  `${MARKER}\n## Deep review (verify) — ${resolved} resolved · ${open} open`;
const problemsFor = reviews => convergenceProblems(converged({ reviews }));
const problemsWith = (reviews, threads) =>
  convergenceProblems(converged({ reviews, threads }));
const NO_FRESH = 'no fresh deep review, and a verify pass reviews no code';
const NOT_SETTLED = name =>
  `${name} of the newest fresh review's threads were not settled by a verify pass`;

/** The app as GraphQL names a comment's author. */
const APP = { login: 'claude', __typename: 'Bot' };
const HUMAN = { login: 'allxsmith', __typename: 'User' };

/** A review comment node as THREADS_QUERY returns it. */
const commentNode = (
  minute,
  { author = APP, openedOn, postedOn = openedOn }
) => ({
  createdAt: stamp(minute),
  author,
  originalCommit: { oid: openedOn },
  pullRequestReview: { commit: { oid: postedOn } },
});

/**
 * A thread node as THREADS_QUERY returns it, opened at minute `opened` on
 * commit `on`. Each reply is [minute, the commit the head was on, author],
 * by the app unless it names another author. Resolved by the app unless it
 * says otherwise.
 */
function thread({
  opened,
  on,
  replies = [],
  resolved = true,
  resolvedBy = 'claude[bot]',
  author = APP,
}) {
  const first = commentNode(opened, { author, openedOn: on });
  return {
    isResolved: resolved,
    resolvedBy: resolved ? { login: resolvedBy } : null,
    opener: { nodes: [first] },
    latest: {
      nodes: [
        first,
        ...replies.map(([minute, postedOn, by = APP]) =>
          commentNode(minute, { author: by, openedOn: on, postedOn })
        ),
      ],
    },
  };
}

test('threadFacts reads a thread node, and a missing field matches nothing', () => {
  const opener = {
    at: Date.parse('2026-10-03T11:00:30Z'),
    author: { login: 'claude', type: 'Bot' },
    openedOn: OLD,
    postedOn: OLD,
  };
  assert.deepEqual(
    threadFacts(thread({ opened: 0.5, on: OLD, replies: [[1.5, HEAD]] })),
    {
      resolved: true,
      resolver: { login: 'claude[bot]' },
      opener,
      latest: [
        opener,
        { ...opener, at: Date.parse('2026-10-03T11:01:30Z'), postedOn: HEAD },
      ],
    }
  );
  const bare = threadFacts({
    opener: { nodes: [{}] },
    latest: { nodes: [null] },
  });
  assert.equal(bare.resolved, false);
  assert.ok(Number.isNaN(bare.opener.at));
  assert.equal(isDeepReviewAuthor(bare.opener.author), false);
  assert.equal(bare.latest[0].postedOn, undefined);
  assert.deepEqual(threadFacts(null), {
    resolved: false,
    resolver: undefined,
    opener: null,
    latest: [],
  });
});

test('the threads query asks for every field threadFacts reads', () => {
  for (const field of [
    'isResolved',
    'resolvedBy { login }',
    'opener: comments(first: 1)',
    'latest: comments(last:',
    'createdAt',
    'author { login __typename }',
    'originalCommit { oid }',
    'pullRequestReview { commit { oid } }',
  ])
    assert.ok(THREADS_QUERY.includes(field), field);
});

test('a verify pass alone does not converge', () => {
  assert.deepEqual(problemsFor([posted(verifyWith(0, 0), 1)]), [NO_FRESH]);
  // A summary that does not parse is not a fresh review either.
  assert.deepEqual(
    problemsFor([
      posted(`${MARKER}\nsomething`, 1),
      posted(verifyWith(0, 0), 2),
    ]),
    [NO_FRESH]
  );
});

test('a clean fresh review then a verify pass on the same head converges', () => {
  assert.deepEqual(
    problemsFor([posted(freshWith(0), 1), posted(verifyWith(0, 0), 2)]),
    []
  );
});

test('commits pushed after a clean fresh review need another fresh review', () => {
  // Re-applying deep-review after a push runs a verify pass, pinned to the
  // new head, that reviewed none of the new commits.
  const stale = posted(freshWith(0), 1, { commit_id: OLD });
  assert.deepEqual(problemsFor([stale, posted(verifyWith(0, 0), 2)]), [
    'the newest fresh review is for bbbbbbb, and no fresh review covers ' +
      'the commits since',
  ]);
  // A fresh review of the new head clears it.
  assert.deepEqual(
    problemsFor([stale, posted(verifyWith(0, 0), 2), posted(freshWith(0), 3)]),
    []
  );
});

test('blocking findings converge once verify passes settle their threads and every thread is resolved', () => {
  // The fixes moved the head, and the verify pass on the new head settled
  // both threads.
  const fresh = posted(freshWith(2), 1, { commit_id: OLD });
  const settled = [
    thread({ opened: 0.5, on: OLD, replies: [[1.5, HEAD]] }),
    thread({ opened: 0.6, on: OLD, replies: [[1.6, HEAD]] }),
  ];
  assert.deepEqual(
    problemsWith([fresh, posted(verifyWith(2, 0), 2)], settled),
    []
  );
  // Settled across more than one pass counts the same. The first thread's
  // earlier reply said what was still wrong, and the API may list replies in
  // any order.
  assert.deepEqual(
    problemsWith(
      [
        fresh,
        posted(verifyWith(1, 1), 2, { commit_id: OLD }),
        posted(verifyWith(1, 0), 3),
      ],
      [
        thread({
          opened: 0.5,
          on: OLD,
          replies: [
            [2.5, HEAD],
            [1.5, OLD],
          ],
        }),
        thread({ opened: 0.6, on: OLD, replies: [[1.6, OLD]] }),
      ]
    ),
    []
  );
  // An open thread holds it back whatever the summaries say.
  assert.deepEqual(
    problemsWith(
      [fresh, posted(verifyWith(2, 0), 2)],
      [settled[0], thread({ opened: 0.6, on: OLD, resolved: false })]
    ),
    ['1 unresolved review thread(s)']
  );
  // Fewer threads than the fresh review counted leaves a finding no thread
  // carries, and no verify pass can see that one.
  for (const opened of [0, 1]) {
    assert.deepEqual(
      problemsWith(
        [fresh, posted(verifyWith(2, 0), 2)],
        settled.slice(0, opened)
      ),
      [
        'the newest fresh review reports 2 blocking and 0 advisory but ' +
          `opened ${opened} thread(s)`,
      ]
    );
  }
});

test('the verify pass that settled the last thread must be on the head', () => {
  const fresh = posted(freshWith(2), 1, { commit_id: OLD });
  const settledOn = (commit, minutes) =>
    minutes.map((minute, i) =>
      thread({ opened: 0.5 + i / 10, on: OLD, replies: [[minute, commit]] })
    );
  // Settled at MID, then an unrelated push to the head and a verify pass
  // there that touched nothing. No review has read the head.
  assert.deepEqual(
    problemsWith(
      [
        fresh,
        posted(verifyWith(2, 0), 2, { commit_id: MID }),
        posted(verifyWith(0, 0), 3),
      ],
      settledOn(MID, [1.5, 1.6])
    ),
    [
      "the verify pass that resolved the last of the newest fresh review's " +
        'findings is for ccccccc, and no fresh review covers the commits since',
    ]
  );
  // The same, with the last thread settled on the head before a later
  // verify pass on the same head.
  assert.deepEqual(
    problemsWith(
      [
        fresh,
        posted(verifyWith(1, 1), 2, { commit_id: MID }),
        posted(verifyWith(1, 0), 3),
        posted(verifyWith(0, 0), 4),
      ],
      [
        ...settledOn(MID, [1.5]),
        thread({ opened: 0.7, on: OLD, replies: [[2.5, HEAD]] }),
      ]
    ),
    []
  );
  // When that pass is the newest summary, condition 1 reports its commit
  // once.
  assert.deepEqual(
    convergenceProblems(
      converged({
        pr: pr({ head: { sha: 'd'.repeat(40), repo: { full_name: REPO } } }),
        reviews: [fresh, posted(verifyWith(2, 0), 2, { commit_id: MID })],
        threads: settledOn(MID, [1.5, 1.6]),
      })
    ),
    ['the newest summary is for ccccccc, not the head ddddddd']
  );
});

test('an older thread a verify pass resolves does not stand in for one the newest fresh review never opened', () => {
  // Copilot's case on #898. The first fresh review's thread was still open
  // when a fresh review re-ran, found one blocking and one advisory, and
  // opened a thread for the blocking one only. The verify pass after it
  // resolved both open threads, so its count of 2 resolved equals the
  // findings.
  const reviews = [
    posted(freshWith(1), 1, { commit_id: OLD }),
    posted(freshWith(1, 1), 3, { commit_id: OLD }),
    posted(verifyWith(2, 0), 4),
  ];
  const threads = [
    thread({ opened: 0.5, on: OLD, replies: [[3.5, HEAD]] }),
    thread({ opened: 2.5, on: OLD, replies: [[3.6, HEAD]] }),
  ];
  assert.deepEqual(problemsWith(reviews, threads), [
    'the newest fresh review reports 1 blocking and 1 advisory but opened ' +
      '1 thread(s)',
  ]);
  // With a thread for the advisory too, the same PR converges.
  assert.deepEqual(
    problemsWith(reviews, [
      ...threads,
      thread({ opened: 2.6, on: OLD, replies: [[3.7, HEAD]] }),
    ]),
    []
  );
});

test('a fresh review owns only the threads the app opened on its commit since the summary before it', () => {
  const reviews = [
    posted(freshWith(0), 1, { commit_id: OLD }),
    posted(freshWith(1), 3, { commit_id: OLD }),
    posted(verifyWith(1, 0), 4),
  ];
  const settled = { replies: [[3.5, HEAD]] };
  const others = [
    // Before the summary before it.
    thread({ ...settled, opened: 0.5, on: OLD }),
    // On another commit, as a run cancelled before its summary leaves one.
    thread({ ...settled, opened: 2.5, on: MID }),
    // After its own summary.
    thread({ ...settled, opened: 3.2, on: OLD }),
    // Opened by someone other than the app.
    thread({ ...settled, opened: 2.5, on: OLD, author: HUMAN }),
    thread({
      ...settled,
      opened: 2.5,
      on: OLD,
      author: { login: 'claude', __typename: 'User' },
    }),
  ];
  assert.deepEqual(problemsWith(reviews, others), [
    'the newest fresh review reports 1 blocking and 0 advisory but opened ' +
      '0 thread(s)',
  ]);
  // A thread opened in the same second as its summary is its own.
  assert.deepEqual(
    problemsWith(reviews, [thread({ ...settled, opened: 3, on: OLD })]),
    []
  );
});

test('a thread is settled only when the app resolved it after replying to it in a verify pass', () => {
  const reviews = [
    posted(freshWith(1), 1, { commit_id: OLD }),
    posted(verifyWith(1, 0), 2),
  ];
  // Resolved by hand. `claude` without the suffix is an ordinary account.
  for (const resolvedBy of ['allxsmith', 'claude'])
    assert.deepEqual(
      problemsWith(reviews, [
        thread({ opened: 0.5, on: OLD, replies: [[1.5, HEAD]], resolvedBy }),
      ]),
      [NOT_SETTLED(1)]
    );
  // Resolved by the app with no reply of its own after the fresh review.
  assert.deepEqual(
    problemsWith(reviews, [
      thread({ opened: 0.5, on: OLD, replies: [[1.5, HEAD, HUMAN]] }),
    ]),
    [NOT_SETTLED(1)]
  );
});

test('a reply from a run that posted no summary is judged by the commit it was posted on', () => {
  const fresh = posted(freshWith(1), 1, { commit_id: OLD });
  // A verify pass settled the thread on MID and stopped before its summary.
  // Then a push, and a verify pass on the head that touched nothing.
  assert.deepEqual(
    problemsWith(
      [fresh, posted(verifyWith(0, 0), 3)],
      [thread({ opened: 0.5, on: OLD, replies: [[1.5, MID]] })]
    ),
    [
      "the reply that settled the newest fresh review's last thread was " +
        'posted on ccccccc, not on aaaaaaa where its verify pass is pinned',
    ]
  );
  // With no push in between, the next pass on the same commit stands for it.
  assert.deepEqual(
    problemsWith(
      [fresh, posted(verifyWith(0, 0), 3)],
      [thread({ opened: 0.5, on: OLD, replies: [[1.5, HEAD]] })]
    ),
    []
  );
  // With no summary after it at all, nothing stands for it.
  assert.deepEqual(
    problemsWith(
      [fresh, posted(verifyWith(0, 1), 2)],
      [thread({ opened: 0.5, on: OLD, replies: [[2.5, HEAD]] })]
    ),
    [
      'the newest summary leaves 1 open',
      "the reply that settled the newest fresh review's last thread has no " +
        'summary after it',
    ]
  );
  // When the summary after it does not parse, condition 1 says so.
  assert.deepEqual(
    problemsWith(
      [fresh, posted(`${MARKER}\nsomething`, 2)],
      [thread({ opened: 0.5, on: OLD, replies: [[1.5, HEAD]] })]
    ),
    ['the newest summary did not parse: its heading matches neither shape']
  );
});

test('an open advisory thread holds convergence back, and a settled one does not', () => {
  // The review posts advisories as threads too. The fix moved the head, and
  // the verify pass there settled the one finding.
  const reviews = [
    posted(freshWith(0, 1), 1, { commit_id: OLD }),
    posted(verifyWith(1, 0), 2),
  ];
  assert.deepEqual(
    problemsWith(reviews, [thread({ opened: 0.5, on: OLD, resolved: false })]),
    ['1 unresolved review thread(s)']
  );
  assert.deepEqual(
    problemsWith(reviews, [
      thread({ opened: 0.5, on: OLD, replies: [[1.5, HEAD]] }),
    ]),
    []
  );
  // A fresh review on the head with no blocking findings is not clean while
  // its advisory thread is open.
  assert.deepEqual(
    problemsWith(
      [posted(freshWith(0, 1), 1)],
      [thread({ opened: 0.5, on: HEAD, resolved: false })]
    ),
    [
      'the newest summary reports 0 blocking and 1 advisory',
      '1 unresolved review thread(s)',
    ]
  );
});

test('advisories count toward the threads the newest fresh review must open and settle', () => {
  // Resolved by hand, with no verify pass after the fresh review.
  assert.deepEqual(problemsFor([posted(freshWith(0, 2), 1)]), [
    'the newest summary reports 0 blocking and 2 advisory',
  ]);
  const fresh = posted(freshWith(0, 2), 1, { commit_id: OLD });
  const one = thread({ opened: 0.5, on: OLD, replies: [[1.5, HEAD]] });
  const two = thread({ opened: 0.6, on: OLD, replies: [[1.6, HEAD]] });
  assert.deepEqual(problemsWith([fresh, posted(verifyWith(1, 0), 2)], [one]), [
    'the newest fresh review reports 0 blocking and 2 advisory but opened ' +
      '1 thread(s)',
  ]);
  // A push that fixes an advisory is covered by the verify pass that settles
  // the last thread on the head, as it is for a blocking finding.
  assert.deepEqual(
    problemsWith([fresh, posted(verifyWith(2, 0), 2)], [one, two]),
    []
  );
  // The first pass settled two of three on MID before a push, and the pass
  // on the head settled the third.
  const mixed = posted(freshWith(2, 1), 1, { commit_id: OLD });
  assert.deepEqual(
    problemsWith(
      [
        mixed,
        posted(verifyWith(2, 1), 2, { commit_id: MID }),
        posted(verifyWith(1, 0), 3),
      ],
      [
        thread({ opened: 0.5, on: OLD, replies: [[1.5, MID]] }),
        thread({ opened: 0.6, on: OLD, replies: [[1.6, MID]] }),
        thread({ opened: 0.7, on: OLD, replies: [[2.5, HEAD]] }),
      ]
    ),
    []
  );
  // An advisory that never became a thread.
  assert.deepEqual(
    problemsWith([mixed, posted(verifyWith(2, 0), 2)], [one, two]),
    [
      'the newest fresh review reports 2 blocking and 1 advisory but opened ' +
        '2 thread(s)',
    ]
  );
});

test('the newest fresh review decides, and only the threads it opened count', () => {
  assert.deepEqual(
    problemsFor([
      posted(freshWith(0), 1),
      posted(freshWith(1), 2),
      posted(verifyWith(0, 0), 3),
    ]),
    [
      'the newest fresh review reports 1 blocking and 0 advisory but opened ' +
        '0 thread(s)',
    ]
  );
  // The first fresh review's thread, settled before the second ran, is not
  // the second's.
  assert.deepEqual(
    problemsWith(
      [
        posted(freshWith(1), 1),
        posted(verifyWith(1, 0), 2),
        posted(freshWith(1), 3),
        posted(verifyWith(0, 0), 4),
      ],
      [thread({ opened: 0.5, on: HEAD, replies: [[1.5, HEAD]] })]
    ),
    [
      'the newest fresh review reports 1 blocking and 0 advisory but opened ' +
        '0 thread(s)',
    ]
  );
});

test('a fresh summary from anyone but the app is ignored', () => {
  const human = { login: 'claude', type: 'User' };
  assert.deepEqual(
    problemsFor([
      posted(freshWith(0), 1, { user: human }),
      posted(verifyWith(0, 0), 2),
    ]),
    [NO_FRESH]
  );
  // Nor can one stand in for a genuine fresh review with findings.
  assert.deepEqual(
    problemsFor([
      posted(freshWith(2), 1),
      posted(freshWith(0), 2, { user: human }),
      posted(verifyWith(0, 0), 3),
    ]),
    [
      'the newest fresh review reports 2 blocking and 0 advisory but opened ' +
        '0 thread(s)',
    ]
  );
});

test('a summary that does not parse after the newest fresh review fails closed', () => {
  assert.deepEqual(
    problemsFor([
      posted(freshWith(0), 1),
      posted(`${MARKER}\n## Deep review — lots`, 2),
      posted(verifyWith(0, 0), 3),
    ]),
    ['a summary after the newest fresh review did not parse']
  );
  // The same when the fresh review had findings that a later pass settled.
  assert.deepEqual(
    problemsWith(
      [
        posted(freshWith(2), 1, { commit_id: OLD }),
        posted(`${MARKER}\n## Deep review — lots`, 2),
        posted(verifyWith(2, 0), 3),
      ],
      [
        thread({ opened: 0.5, on: OLD, replies: [[2.5, HEAD]] }),
        thread({ opened: 0.6, on: OLD, replies: [[2.6, HEAD]] }),
      ]
    ),
    ['a summary after the newest fresh review did not parse']
  );
});

test('planAction only writes when the label disagrees', () => {
  assert.equal(planAction(false, true), 'add');
  assert.equal(planAction(true, false), 'remove');
  assert.equal(planAction(true, true), 'none');
  assert.equal(planAction(false, false), 'none');
});

test('decide composes scope, convergence and the action', () => {
  assert.deepEqual(decide(converged()), {
    number: 870,
    skip: null,
    problems: [],
    action: 'add',
  });
  const labeled = pr({ labels: ['deep-review', LABEL] });
  assert.equal(decide(converged({ pr: labeled })).action, 'none');
  assert.equal(
    decide(converged({ pr: labeled, threads: [{ isResolved: false }] })).action,
    'remove'
  );
  // Out of scope is left alone even when it carries the label.
  assert.deepEqual(
    decide({ repo: REPO, pr: pr({ state: 'closed', labels: [LABEL] }) }),
    { number: 870, skip: 'not open', problems: [], action: 'none' }
  );
});

test('a run that starts with CI takes the label off and never adds it', () => {
  // The workflow also runs when a CI run is requested, so it sees a push
  // before CI on it finishes: the newest summary is pinned to the old head,
  // and the new head's checks are queued, running or not created yet.
  const moved = { sha: MID, repo: { full_name: REPO } };
  const running = status => ({ ...GREEN_RUN, status, conclusion: null });
  for (const checkRuns of [[running('queued')], [running('in_progress')], []]) {
    const state = { checkRuns, statuses: [] };
    const labeled = decide(
      converged({
        ...state,
        pr: pr({ labels: ['deep-review', LABEL], head: moved }),
      })
    );
    assert.equal(labeled.action, 'remove', JSON.stringify(checkRuns));
    assert.equal(
      labeled.problems[0],
      'the newest summary is for aaaaaaa, not the head ccccccc'
    );
    assert.equal(
      decide(converged({ ...state, pr: pr({ head: moved }) })).action,
      'none'
    );
  }
  // CI started again on a reviewed head holds the label back until it ends.
  assert.equal(
    decide(
      converged({
        pr: pr({ labels: ['deep-review', LABEL] }),
        checkRuns: [running('in_progress')],
      })
    ).action,
    'remove'
  );
});

// ---------------------------------------------------------------------------
// The API client, against a fake fetch
// ---------------------------------------------------------------------------

function response(status, body, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: name => headers[name.toLowerCase()] ?? null },
    json: async () => body,
    text: async () =>
      typeof body === 'string' ? body : JSON.stringify(body ?? ''),
  };
}

/** A fetch that answers from a route table and records every call. */
function fakeFetch(routes) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const method = init?.method ?? 'GET';
    const path = url.replace('https://api.github.com', '');
    const body = init?.body ? JSON.parse(init.body) : undefined;
    calls.push({ method, path, body, headers: init?.headers });
    const route = routes[`${method} ${path}`];
    if (!route) return response(404, { message: 'Not Found' });
    const answer = typeof route === 'function' ? route(body) : route;
    if (answer instanceof Error) throw answer;
    return answer;
  };
  return { fetchImpl, calls };
}

test('nextLink reads the next page out of a Link header', () => {
  assert.equal(
    nextLink(
      '<https://api.github.com/x?page=1>; rel="prev", <https://api.github.com/x?page=3>; rel="next"'
    ),
    'https://api.github.com/x?page=3'
  );
  assert.equal(nextLink('<https://api.github.com/x>; rel="last"'), null);
  assert.equal(nextLink(null), null);
});

test('pages follows Link headers and reads a keyed list', async () => {
  const next = 'https://api.github.com/list?page=2';
  const { fetchImpl, calls } = fakeFetch({
    'GET /list': response(
      200,
      { items: [1, 2] },
      { link: `<${next}>; rel="next"` }
    ),
    'GET /list?page=2': response(200, { items: [3] }),
  });
  const client = createClient({ token: 't', fetchImpl });
  assert.deepEqual(await client.pages('/list', 'items'), [1, 2, 3]);
  assert.equal(calls[0].headers.Authorization, 'Bearer t');
  assert.equal(calls[0].headers['Content-Type'], undefined);
});

test('pages refuses a missing list, an off-host link and a runaway', async () => {
  const offHost = createClient({
    token: 't',
    fetchImpl: fakeFetch({
      'GET /list': response(200, [], {
        link: '<https://api.github.com.example/list>; rel="next"',
      }),
    }).fetchImpl,
  });
  await assert.rejects(offHost.pages('/list'), /paginated off/);

  const notList = createClient({
    token: 't',
    fetchImpl: fakeFetch({ 'GET /list': response(200, { items: 3 }) })
      .fetchImpl,
  });
  await assert.rejects(notList.pages('/list', 'items'), /returned no items/);
  await assert.rejects(notList.pages('/list'), /returned no array/);

  const loop = createClient({
    token: 't',
    fetchImpl: fakeFetch({
      'GET /list': response(200, [1], {
        link: '<https://api.github.com/list>; rel="next"',
      }),
    }).fetchImpl,
  });
  await assert.rejects(loop.pages('/list'), /ran past/);
});

test('an HTTP error throws with its status, escaped', async () => {
  const client = createClient({
    token: 't',
    fetchImpl: fakeFetch({
      'GET /x': response(403, 'Resource not accessible\n::error::x'),
    }).fetchImpl,
  });
  await assert.rejects(client.json('/x'), err => {
    assert.match(err.message, /HTTP 403/);
    assert.ok(!err.message.includes('\n'));
    return true;
  });
  // A body that cannot be read still reports the status.
  const unreadable = createClient({
    token: 't',
    fetchImpl: async () => ({
      ok: false,
      status: 500,
      text: async () => {
        throw new Error('reset');
      },
    }),
  });
  await assert.rejects(unreadable.json('/x'), /HTTP 500 ""$/);
});

test('the client sends nothing outside the API host', async () => {
  const { fetchImpl, calls } = fakeFetch({});
  const client = createClient({ token: 't', fetchImpl });
  await assert.rejects(client.json('@example.com/x'), /outside/);
  assert.deepEqual(calls, []);
});

test('graphql returns data and throws on errors', async () => {
  const { fetchImpl, calls } = fakeFetch({
    'POST /graphql': body =>
      body.variables.ok
        ? response(200, { data: { hello: 1 } })
        : response(200, { errors: [{ message: 'bad' }] }),
  });
  const client = createClient({ token: 't', fetchImpl });
  assert.deepEqual(await client.graphql('q', { ok: true }), { hello: 1 });
  assert.equal(calls[0].headers['Content-Type'], 'application/json');
  await assert.rejects(client.graphql('q', { ok: false }), /"bad"/);
});

test('label writes hit the issue labels endpoints, and a gone label is fine', async () => {
  const { fetchImpl, calls } = fakeFetch({
    [`POST /repos/${REPO}/issues/870/labels`]: response(200, []),
  });
  const client = createClient({ token: 't', fetchImpl });
  await client.addLabel(REPO, 870, LABEL);
  await client.removeLabel(REPO, 870, LABEL);
  assert.deepEqual(calls[0].body, { labels: [LABEL] });
  assert.equal(calls[1].method, 'DELETE');
  assert.equal(calls[1].path, `/repos/${REPO}/issues/870/labels/${LABEL}`);
});

test('fetchThreads pages through every thread', async () => {
  const page = (nodes, hasNextPage, endCursor) =>
    response(200, {
      data: {
        repository: {
          pullRequest: {
            reviewThreads: { pageInfo: { hasNextPage, endCursor }, nodes },
          },
        },
      },
    });
  const { fetchImpl, calls } = fakeFetch({
    'POST /graphql': body =>
      body.variables.after === null
        ? page([{ isResolved: true }], true, 'c1')
        : page([{ isResolved: false }], false, null),
  });
  const client = createClient({ token: 't', fetchImpl });
  assert.deepEqual(await fetchThreads(client, REPO, 870), [
    { isResolved: true },
    { isResolved: false },
  ]);
  assert.deepEqual(calls[0].body.variables, {
    owner: 'allxsmith',
    name: 'bestax',
    number: 870,
    after: null,
  });
  assert.equal(calls[1].body.variables.after, 'c1');
});

test('fetchThreads fails on a missing connection or a stuck cursor', async () => {
  const empty = createClient({
    token: 't',
    fetchImpl: fakeFetch({
      'POST /graphql': response(200, { data: { repository: null } }),
    }).fetchImpl,
  });
  await assert.rejects(fetchThreads(empty, REPO, 1), /no reviewThreads/);
  const stuck = createClient({
    token: 't',
    fetchImpl: fakeFetch({
      'POST /graphql': response(200, {
        data: {
          repository: {
            pullRequest: {
              reviewThreads: {
                pageInfo: { hasNextPage: true, endCursor: null },
                nodes: [],
              },
            },
          },
        },
      }),
    }).fetchImpl,
  });
  await assert.rejects(fetchThreads(stuck, REPO, 1), /did not advance/);
});

test('fetchThreads gives up after the page cap', async () => {
  let n = 0;
  const client = createClient({
    token: 't',
    fetchImpl: fakeFetch({
      'POST /graphql': () =>
        response(200, {
          data: {
            repository: {
              pullRequest: {
                reviewThreads: {
                  pageInfo: { hasNextPage: true, endCursor: `c${n++}` },
                  nodes: [],
                },
              },
            },
          },
        }),
    }).fetchImpl,
  });
  await assert.rejects(fetchThreads(client, REPO, 1), /ran past/);
});

// ---------------------------------------------------------------------------
// run(), end to end against a fake repository
// ---------------------------------------------------------------------------

/** Routes for one in-scope PR's reads. */
function prRoutes(number, { sha = HEAD, reviews, threads, runs, statuses }) {
  return {
    [`GET /repos/${REPO}/pulls/${number}/reviews?per_page=100`]: response(
      200,
      reviews
    ),
    [`GET /repos/${REPO}/commits/${sha}/check-runs?per_page=100`]: response(
      200,
      { check_runs: runs }
    ),
    [`GET /repos/${REPO}/commits/${sha}/status?per_page=100`]: response(200, {
      statuses,
    }),
    [`threads ${number}`]: threads,
  };
}

/** Answers the threads query per PR number from `thread <n>` entries. */
function withThreads(routes) {
  return {
    ...routes,
    'POST /graphql': body =>
      response(200, {
        data: {
          repository: {
            pullRequest: {
              reviewThreads: {
                pageInfo: { hasNextPage: false, endCursor: null },
                nodes: routes[`threads ${body.variables.number}`],
              },
            },
          },
        },
      }),
  };
}

/** The repository read every run makes for its default branch. */
const REPO_ROUTE = {
  [`GET /repos/${REPO}`]: response(200, { default_branch: 'main' }),
};
const repoReads = calls =>
  calls.filter(c => c.method === 'GET' && c.path === `/repos/${REPO}`).length;

const CLEAN = {
  reviews: [summary(FRESH_CLEAN)],
  threads: [{ isResolved: true }],
  runs: [GREEN_RUN],
  statuses: [GREEN_STATUS],
};

function sweepRoutes() {
  const ready = pr({ number: 1 });
  const stale = pr({ number: 2, labels: ['deep-review', LABEL] });
  const loop = pr({ number: 3, labels: ['deep-review', 'ai-loop', LABEL] });
  const plain = pr({ number: 4, labels: [] });
  const settled = pr({ number: 5, labels: ['deep-review', LABEL] });
  const stacked = pr({
    number: 6,
    labels: ['deep-review', LABEL],
    base: { ref: 'feat/base' },
  });
  return withThreads({
    ...REPO_ROUTE,
    [`GET /repos/${REPO}/pulls?state=open&per_page=100`]: response(200, [
      ready,
      stale,
      loop,
      plain,
      settled,
      stacked,
    ]),
    ...prRoutes(1, CLEAN),
    ...prRoutes(2, { ...CLEAN, threads: [{ isResolved: false }] }),
    ...prRoutes(5, CLEAN),
    // The re-read before each write.
    [`GET /repos/${REPO}/pulls/1`]: response(200, ready),
    [`GET /repos/${REPO}/pulls/2`]: response(200, stale),
    [`GET /repos/${REPO}/pulls/5`]: response(200, settled),
    [`POST /repos/${REPO}/issues/1/labels`]: response(200, []),
    [`DELETE /repos/${REPO}/issues/2/labels/${LABEL}`]: response(200, []),
  });
}

const writes = calls =>
  calls.filter(c => c.method !== 'GET' && c.path !== '/graphql');

test('a sweep adds, removes and leaves alone as the decision says', async () => {
  const { fetchImpl, calls } = fakeFetch(sweepRoutes());
  const lines = [];
  const code = await run({
    argv: [`--repo=${REPO}`, '--pr='],
    env: { GITHUB_TOKEN: 't' },
    fetchImpl,
    log: line => lines.push(line),
  });
  assert.equal(code, 0);
  assert.deepEqual(
    writes(calls).map(c => `${c.method} ${c.path}`),
    [
      `POST /repos/${REPO}/issues/1/labels`,
      `DELETE /repos/${REPO}/issues/2/labels/${LABEL}`,
    ]
  );
  const text = lines.join('\n');
  assert.match(text, /^review-converged: repo=allxsmith\/bestax sweep$/m);
  assert.match(text, /#1 converged, add label: written/);
  assert.match(text, /^::notice title=review-converged::#1 labeled$/m);
  assert.match(
    text,
    /#2 not converged: 1 unresolved review thread\(s\), remove label: written/
  );
  assert.match(text, /^::notice title=review-converged::#2 unlabeled$/m);
  // The old loop's PR keeps its label: claude-pr-loop.yml hands it off.
  assert.match(
    text,
    /#3 skipped \(ai-loop PR the App did not open, which claude-pr-loop\.yml hands off\)/
  );
  assert.match(text, /#5 converged, label unchanged/);
  // A stacked PR keeps its label: it is out of scope, not unconverged.
  assert.match(text, /#6 skipped \(based on "feat\/base", not "main"\)/);
  assert.equal(repoReads(calls), 1);
  // A PR with nothing to do with the label is not named in a sweep.
  assert.doesNotMatch(text, /#4/);
  // Every line but the notices starts with the fixed prefix.
  for (const line of lines)
    assert.match(
      line,
      /^(review-converged: |::notice title=review-converged::#\d+ )/
    );
});

test('a dry run decides the same and writes nothing', async () => {
  const { fetchImpl, calls } = fakeFetch(sweepRoutes());
  const lines = [];
  const code = await run({
    argv: [`--repo=${REPO}`, '--dry-run'],
    env: { GITHUB_TOKEN: 't' },
    fetchImpl,
    log: line => lines.push(line),
  });
  assert.equal(code, 0);
  assert.deepEqual(writes(calls), []);
  assert.match(lines.join('\n'), /sweep dry-run/);
  assert.match(
    lines.join('\n'),
    /#1 converged, add label: dry run, not written/
  );
  assert.match(lines.join('\n'), /#2 .*remove label: dry run, not written/);
  assert.doesNotMatch(lines.join('\n'), /::notice/);
});

test('a PR that moved or changed while it was checked is not labeled', async () => {
  for (const [now, outcome] of [
    [pr({ number: 1, head: { sha: OLD, repo: { full_name: REPO } } }), 'stale'],
    [pr({ number: 1, labels: [] }), 'stale'],
    [pr({ number: 1, labels: ['deep-review', 'ai-loop'] }), 'stale'],
    [pr({ number: 1, state: 'closed' }), 'stale'],
    [pr({ number: 1, base: { ref: 'feat/base' } }), 'stale'],
    [pr({ number: 1, labels: ['deep-review', LABEL] }), 'already set'],
  ]) {
    // A sweep, so the PR under test comes from the list and the single read
    // of /pulls/1 is the re-read before adding.
    const routes = sweepRoutes();
    routes[`GET /repos/${REPO}/pulls/1`] = response(200, now);
    const { fetchImpl, calls } = fakeFetch(routes);
    const lines = [];
    await run({
      argv: [`--repo=${REPO}`],
      env: { GITHUB_TOKEN: 't' },
      fetchImpl,
      log: line => lines.push(line),
    });
    assert.deepEqual(
      writes(calls).filter(c => c.path.includes('/issues/1/')),
      [],
      outcome
    );
    assert.match(
      lines.join('\n'),
      new RegExp(`#1 converged, add label: ${outcome}`)
    );
  }
});

test('a flag that lands while a PR is checked stops an add, not a removal', async () => {
  // The evaluation saw no needs-security-review on either PR, and the re-read
  // before each write does. #1 was going to get the label and #2 to lose it.
  const routes = sweepRoutes();
  routes[`GET /repos/${REPO}/pulls/1`] = response(
    200,
    pr({ number: 1, labels: ['deep-review', FLAG_LABEL] })
  );
  routes[`GET /repos/${REPO}/pulls/2`] = response(
    200,
    pr({ number: 2, labels: ['deep-review', LABEL, FLAG_LABEL] })
  );
  const { fetchImpl, calls } = fakeFetch(routes);
  const lines = [];
  await run({
    argv: [`--repo=${REPO}`],
    env: { GITHUB_TOKEN: 't' },
    fetchImpl,
    log: line => lines.push(line),
  });
  assert.deepEqual(
    writes(calls).map(c => `${c.method} ${c.path}`),
    [`DELETE /repos/${REPO}/issues/2/labels/${LABEL}`]
  );
  const text = lines.join('\n');
  assert.match(text, /#1 converged, add label: stale/);
  assert.match(text, /#2 not converged: .*, remove label: written/);
});

test('a PR that left scope or moved while it was checked keeps its label', async () => {
  // #2 carries the label and has an open thread, so the decision is to take
  // the label off. The re-read before removing finds the PR changed.
  const labels = ['deep-review', LABEL];
  for (const [now, outcome] of [
    [pr({ number: 2, labels: [LABEL] }), 'stale'],
    [pr({ number: 2, labels: [...labels, 'ai-loop'] }), 'stale'],
    [pr({ number: 2, labels, base: { ref: 'feat/base' } }), 'stale'],
    [pr({ number: 2, labels, state: 'closed' }), 'stale'],
    [
      pr({ number: 2, labels, head: { sha: OLD, repo: { full_name: REPO } } }),
      'stale',
    ],
    [pr({ number: 2 }), 'already gone'],
  ]) {
    const routes = sweepRoutes();
    routes[`GET /repos/${REPO}/pulls/2`] = response(200, now);
    const { fetchImpl, calls } = fakeFetch(routes);
    const lines = [];
    await run({
      argv: [`--repo=${REPO}`],
      env: { GITHUB_TOKEN: 't' },
      fetchImpl,
      log: line => lines.push(line),
    });
    assert.deepEqual(
      writes(calls).filter(c => c.path.includes('/issues/2/')),
      [],
      outcome
    );
    assert.match(
      lines.join('\n'),
      new RegExp(`#2 not converged: .*, remove label: ${outcome}`)
    );
  }
});

/**
 * A sweep over one PR, #9, opened by `user`, that the list shows with `seen`
 * labels and the re-read before a write shows with `now`.
 */
async function sweepOne(seen, now, data, user = APP_USER) {
  const { fetchImpl, calls } = fakeFetch(
    withThreads({
      ...REPO_ROUTE,
      [`GET /repos/${REPO}/pulls?state=open&per_page=100`]: response(200, [
        pr({ number: 9, labels: seen, user }),
      ]),
      ...prRoutes(9, data),
      [`GET /repos/${REPO}/pulls/9`]: response(
        200,
        pr({ number: 9, labels: now, user })
      ),
      [`POST /repos/${REPO}/issues/9/labels`]: response(200, []),
      [`DELETE /repos/${REPO}/issues/9/labels/${LABEL}`]: response(200, []),
    })
  );
  const lines = [];
  const code = await run({
    argv: [`--repo=${REPO}`],
    env: { GITHUB_TOKEN: 't' },
    fetchImpl,
    log: line => lines.push(line),
  });
  return {
    code,
    text: lines.join('\n'),
    writes: writes(calls).map(c => `${c.method} ${c.path}`),
  };
}

test('either scope label is enough to add the label on an App PR', async () => {
  // ai-loop alone is the App PR whose fresh review found nothing. The second
  // case is a re-read between the halves of the App's deep-review cycle,
  // with the label taken off and not yet put back.
  for (const [seen, now] of [
    [['ai-loop'], ['ai-loop']],
    [['ai-loop', 'deep-review'], ['ai-loop']],
    [['deep-review'], ['deep-review']],
  ]) {
    const result = await sweepOne(seen, now, CLEAN);
    assert.equal(result.code, 0);
    assert.deepEqual(
      result.writes,
      [`POST /repos/${REPO}/issues/9/labels`],
      seen.join(',')
    );
    assert.match(result.text, /#9 converged, add label: written/);
  }
});

test('either scope label is enough to remove the label on an App PR', async () => {
  for (const scope of ['ai-loop', 'deep-review']) {
    const labels = [scope, LABEL];
    const result = await sweepOne(labels, labels, {
      ...CLEAN,
      threads: [{ isResolved: false }],
    });
    assert.equal(result.code, 0);
    assert.deepEqual(
      result.writes,
      [`DELETE /repos/${REPO}/issues/9/labels/${LABEL}`],
      scope
    );
    assert.match(result.text, /#9 not converged: .*, remove label: written/);
  }
  // With neither left, as after the App's handoff, the label stays.
  const result = await sweepOne([LABEL], [LABEL], CLEAN);
  assert.deepEqual(result.writes, []);
  assert.match(
    result.text,
    /#9 skipped \(no deep-review label, and not an ai-loop PR the App opened\)/
  );
});

test('ai-loop leaves a PR the App did not open alone, deep-review or not', async () => {
  // claude-pr-loop.yml drives the machine User's PRs and hands them off with
  // needs-human-review, so this label stays off them while it does.
  for (const data of [CLEAN, { ...CLEAN, threads: [{ isResolved: false }] }]) {
    for (const labels of [
      ['ai-loop'],
      ['ai-loop', LABEL],
      ['ai-loop', 'deep-review'],
      ['ai-loop', 'deep-review', LABEL],
    ]) {
      const result = await sweepOne(labels, labels, data, MACHINE_USER);
      assert.equal(result.code, 0);
      assert.deepEqual(result.writes, [], labels.join(','));
    }
  }
  const named = await sweepOne(
    ['ai-loop', 'deep-review'],
    ['ai-loop', 'deep-review'],
    CLEAN,
    MACHINE_USER
  );
  assert.match(
    named.text,
    /#9 skipped \(ai-loop PR the App did not open, which claude-pr-loop\.yml hands off\)/
  );
  // That loop's handoff takes ai-loop off, and deep-review alone then brings
  // the PR in like any other.
  const result = await sweepOne(
    ['deep-review'],
    ['deep-review'],
    CLEAN,
    MACHINE_USER
  );
  assert.deepEqual(result.writes, [`POST /repos/${REPO}/issues/9/labels`]);
});

test('a targeted run names an out-of-scope PR', async () => {
  const routes = sweepRoutes();
  routes[`GET /repos/${REPO}/pulls/4`] = response(
    200,
    pr({ number: 4, labels: [] })
  );
  const { fetchImpl, calls } = fakeFetch(routes);
  const lines = [];
  const code = await run({
    argv: [`--repo=${REPO}`, '--pr=4'],
    env: { GITHUB_TOKEN: 't' },
    fetchImpl,
    log: line => lines.push(line),
  });
  assert.equal(code, 0);
  assert.deepEqual(lines, [
    'review-converged: repo=allxsmith/bestax pr=4',
    'review-converged: #4 skipped (no deep-review label, and not an ai-loop PR the App opened)',
  ]);
  assert.equal(repoReads(calls), 1);
});

test('a failed default-branch read fails the run before any PR is read', async () => {
  for (const answer of [
    response(500, 'boom'),
    response(200, { name: 'bestax' }),
    response(200, { default_branch: '' }),
  ]) {
    const routes = sweepRoutes();
    routes[`GET /repos/${REPO}`] = answer;
    const { fetchImpl, calls } = fakeFetch(routes);
    const lines = [];
    await assert.rejects(
      run({
        argv: [`--repo=${REPO}`],
        env: { GITHUB_TOKEN: 't' },
        fetchImpl,
        log: line => lines.push(line),
      }),
      /HTTP 500|returned no default_branch/
    );
    assert.deepEqual(
      calls.map(c => `${c.method} ${c.path}`),
      [`GET /repos/${REPO}`]
    );
    assert.deepEqual(lines, []);
  }
});

test('an API error on one PR leaves its label and fails the run', async () => {
  const routes = sweepRoutes();
  routes[`GET /repos/${REPO}/pulls/1/reviews?per_page=100`] = response(
    502,
    'bad gateway'
  );
  const { fetchImpl, calls } = fakeFetch(routes);
  const lines = [];
  const code = await run({
    argv: [`--repo=${REPO}`],
    env: { GITHUB_TOKEN: 't' },
    fetchImpl,
    log: line => lines.push(line),
  });
  assert.equal(code, 1);
  const text = lines.join('\n');
  assert.match(text, /#1 error, label left as it was: ".*HTTP 502/);
  assert.deepEqual(
    writes(calls).map(c => `${c.method} ${c.path}`),
    [`DELETE /repos/${REPO}/issues/2/labels/${LABEL}`]
  );
});

test('a head that is not a commit id is an error, not a decision', async () => {
  const odd = pr({
    number: 7,
    head: { sha: '../../x', repo: { full_name: REPO } },
  });
  const { fetchImpl } = fakeFetch({
    ...REPO_ROUTE,
    [`GET /repos/${REPO}/pulls/7`]: response(200, odd),
  });
  const lines = [];
  assert.equal(
    await run({
      argv: [`--repo=${REPO}`, '--pr=7'],
      env: { GITHUB_TOKEN: 't' },
      fetchImpl,
      log: line => lines.push(line),
    }),
    1
  );
  assert.match(lines.join('\n'), /#7 error.*not a commit id/);

  const none = pr({ number: 8, head: { repo: { full_name: REPO } } });
  const missing = fakeFetch({
    ...REPO_ROUTE,
    [`GET /repos/${REPO}/pulls/8`]: response(200, none),
  });
  assert.equal(
    await run({
      argv: [`--repo=${REPO}`, '--pr=8'],
      env: { GITHUB_TOKEN: 't' },
      fetchImpl: missing.fetchImpl,
      log: () => {},
    }),
    1
  );
});

test('a long list of problems is cut short in the log', async () => {
  const many = Array.from({ length: 7 }, (_, i) => ({
    ...GREEN_RUN,
    name: `job ${i}`,
    status: 'queued',
  }));
  const routes = sweepRoutes();
  routes[`GET /repos/${REPO}/commits/${HEAD}/check-runs?per_page=100`] =
    response(200, { check_runs: many });
  const { fetchImpl } = fakeFetch(routes);
  const lines = [];
  await run({
    argv: [`--repo=${REPO}`, '--dry-run'],
    env: { GITHUB_TOKEN: 't' },
    fetchImpl,
    log: line => lines.push(line),
  });
  const line = lines.find(l => l.includes('#5 '));
  assert.match(line, /"job 4" is "queued", and 2 more, remove label/);
  assert.doesNotMatch(line, /job 5/);
});

test('run refuses to start without a token or with bad arguments', async () => {
  await assert.rejects(run({ argv: [`--repo=${REPO}`], env: {} }), UsageError);
  await assert.rejects(
    run({ argv: ['--bogus'], env: { GITHUB_TOKEN: 't' } }),
    UsageError
  );
});

/**
 * Run the script as a command. `fetchStub` is the body of a module preloaded
 * with --import that replaces the global fetch, so no request leaves. The
 * parent environment is passed on so coverage of the child is still
 * collected, with GITHUB_TOKEN set explicitly either way.
 */
function cli(args, { token = '', fetchStub } = {}) {
  const preload = fetchStub
    ? ['--import', `data:text/javascript,${encodeURIComponent(fetchStub)}`]
    : [];
  return spawnSync(process.execPath, [...preload, SCRIPT, ...args], {
    encoding: 'utf8',
    env: { ...process.env, GITHUB_TOKEN: token },
  });
}

test('the command line exits 2 on bad usage', () => {
  const bad = cli([]);
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /^review-converged: usage error: /);
  const noToken = cli([`--repo=${REPO}`]);
  assert.equal(noToken.status, 2);
  assert.match(noToken.stderr, /GITHUB_TOKEN is not set/);
});

test('the command line exits 1 when the API cannot be reached', () => {
  const result = cli([`--repo=${REPO}`], {
    token: 't',
    fetchStub:
      'globalThis.fetch = async () => { throw new Error("offline"); };',
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /^review-converged: "offline"/);
});

test('the command line exits 0 on a clean sweep', () => {
  const result = cli([`--repo=${REPO}`], {
    token: 't',
    fetchStub:
      'globalThis.fetch = async url => new Response(' +
      'url.endsWith("/repos/allxsmith/bestax") ' +
      '? \'{"default_branch":"main"}\' : "[]");',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    result.stdout,
    'review-converged: repo=allxsmith/bestax sweep\n'
  );
});

// ---------------------------------------------------------------------------
// The workflow
// ---------------------------------------------------------------------------

function workflowLines(file) {
  return readFileSync(join(ROOT, '.github/workflows', file), 'utf8').split(
    /\r?\n/
  );
}

test('the workflow job is named as the check run the script leaves out', () => {
  const lines = workflowLines('review-converged.yml');
  const jobs = yamlGet(lines, 'jobs');
  assert.ok(jobs, 'review-converged.yml has no jobs');
  const names = [...jobs.lines.join('\n').matchAll(/^ {4}name: (.+)$/gm)].map(
    m => m[1]
  );
  assert.deepEqual(names, [OWN_CHECK_NAME]);
  assert.equal(
    yamlScalar(yamlGet(lines, 'jobs', 'sync', 'name')),
    OWN_CHECK_NAME
  );
});

test('the workflow_run trigger names workflows that exist', () => {
  const lines = workflowLines('review-converged.yml');
  // A comment after the last item reads as part of it, so comments are left
  // out.
  const listed = yamlItems(
    yamlGet(lines, 'on', 'workflow_run', 'workflows')?.lines ?? []
  ).map(item =>
    item
      .filter(line => !line.trim().startsWith('#'))
      .join('\n')
      .trim()
  );
  const names = ['claude-review.yml', 'ci.yml'].map(file =>
    yamlScalar(yamlGet(workflowLines(file), 'name'))
  );
  assert.deepEqual(listed.sort(), names.sort());
});

test('the workflow_run trigger fires when a run starts and when it ends', () => {
  // `requested` is what takes the label off as soon as a push starts CI,
  // rather than leaving it on the unreviewed head until CI completes.
  const types = yamlGet(
    workflowLines('review-converged.yml'),
    'on',
    'workflow_run',
    'types'
  );
  const flow = /^\[(.*)\]$/.exec(types?.value ?? '');
  assert.ok(flow, 'workflow_run.types is not a flow list');
  assert.deepEqual(
    flow[1]
      .split(',')
      .map(type => type.trim())
      .sort(),
    ['completed', 'requested']
  );
});
