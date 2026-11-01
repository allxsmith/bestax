/**
 * Holds the live-role checks to `lookup_role`, and the deep review's reads
 * after its role check to `api_pages` (#1258).
 *
 * The steps that re-verify a user's role used to read a failed API call as
 * role `none`. When harden-runner dropped a job's first connections, the run
 * logged that the user lacked access and skipped its work. Each step now
 * calls `lookup_role`, which retries and then fails the step ("When the agent
 * drops a job's first connections" under rule 10 in `.github/CLAUDE.md`). The
 * deep review's dedupe and focus steps read their pages through `api_pages`,
 * which retries the same way. Both functions are hand-copied into every step
 * that uses them, so this reads the workflows and checks:
 *
 * - every step that looks up a role does it through `lookup_role`, and no
 *   permission call there falls back to a role on error;
 * - every copy of each function matches the first;
 * - the step's timeout, or its job's, outlasts the worst case of the
 *   functions it calls;
 * - each step that checks the triggering user, run under bash with a stub
 *   `gh`, `timeout` and `sleep` on PATH, handles a role from the API as it
 *   did before, reads a 404 as no access, retries a call that fails or is
 *   rate-limited and then answers, and fails with an `::error::` and no
 *   decision when the call never answers or GitHub refuses it;
 * - the deep review's dedupe and focus steps retry their reads and fail
 *   rather than decide when the API never answers.
 *
 * It reads the workflows with the conformance check's YAML reader, as the
 * other workflow tests do, since the root declares no YAML dependency.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  yamlGet,
  yamlItems,
  yamlMap,
  yamlScalar,
} from './check-conformance.mjs';

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const WORKFLOWS = path.join(repoRoot, '.github', 'workflows');

/** A shell script with its comment lines removed. */
const shellCode = script =>
  (script ?? '')
    .split('\n')
    .filter(line => !/^\s*#/.test(line))
    .join('\n');

const scalar = (map, key) => yamlScalar(map.get(key) ?? null);

/** The definition of shell function `name` in `code`, through its `}`. */
const definition = (code, name) =>
  new RegExp(`^([ \\t]*)${name}\\(\\) \\{\\n[\\s\\S]*?\\n\\1\\}$`, 'm').exec(
    code
  )?.[0] ?? null;

const lookupRole = code => definition(code, 'lookup_role');
const apiPages = code => definition(code, 'api_pages');

/** Every step of every workflow, with its script and timeouts. */
function workflowSteps() {
  const steps = [];
  const files = fs
    .readdirSync(WORKFLOWS)
    .filter(file => /\.ya?ml$/.test(file))
    .sort();
  for (const file of files) {
    const lines = fs
      .readFileSync(path.join(WORKFLOWS, file), 'utf8')
      .split(/\r?\n/);
    for (const [id, job] of yamlMap(yamlGet(lines, 'jobs')?.lines ?? [])) {
      const jobSteps = yamlItems(yamlGet(job.lines, 'steps')?.lines ?? []).map(
        yamlMap
      );
      for (const step of jobSteps) {
        const script = scalar(step, 'run');
        steps.push({
          name: `${file}:${id}:${scalar(step, 'name')}`,
          script,
          code: shellCode(script),
          stepTimeout: Number(scalar(step, 'timeout-minutes')) || null,
          jobTimeout: Number(yamlScalar(yamlGet(job.lines, 'timeout-minutes'))),
        });
      }
    }
  }
  return steps;
}

const steps = workflowSteps();
/** Every step that looks up a user's role. */
const roleSteps = steps.filter(
  ({ code }) => code.includes('/permission') || /lookup_role "/.test(code)
);
/** The role steps that check the user who triggered the run. */
const senderSteps = roleSteps.filter(({ code }) =>
  /^\s*lookup_role "\$SENDER"$/m.test(code)
);
/** Every step that reads pages through `api_pages`. */
const pageSteps = steps.filter(({ code }) => apiPages(code));

const step = name => {
  const found = steps.find(s => s.name === name);
  assert.ok(found, `no step named ${name}`);
  return found;
};
const DEDUPE = 'claude-review.yml:review:Skip if already reviewed';
const FOCUS = 'claude-review.yml:review:Extract focus steer';

test('the workflows have role lookups to check', () => {
  assert.ok(senderSteps.length > 0, 'no step calls lookup_role "$SENDER"');
  assert.ok(
    roleSteps.some(s => s.name === FOCUS),
    'the focus step looks up no role'
  );
});

test('every role lookup goes through lookup_role and keeps no fallback', () => {
  const problems = [];
  for (const { name, code } of roleSteps) {
    const fn = lookupRole(code);
    if (!fn) {
      problems.push(`${name}: no lookup_role definition`);
      continue;
    }
    if (!/^\s*lookup_role "\$[A-Z]+"$/m.test(code)) {
      problems.push(`${name}: does not call lookup_role`);
    }
    // A permission call outside the function, such as the fallback this
    // replaced: an error read as a role.
    if (code.replace(fn, '').includes('/permission')) {
      problems.push(`${name}: calls the permission API outside lookup_role`);
    }
  }
  assert.deepEqual(problems, []);
});

test('the deep review reads its pages through api_pages', () => {
  for (const name of [DEDUPE, FOCUS]) {
    const { code } = step(name);
    const fn = apiPages(code);
    assert.ok(fn, `${name}: no api_pages definition`);
    assert.doesNotMatch(
      code.replace(fn, '').replace(lookupRole(code) ?? '', ''),
      /gh api/,
      `${name}: calls gh api outside its functions`
    );
  }
});

/** Every copy of `fn` in `list` matches the first, up to indentation. */
function assertCopiesEqual(list, fn) {
  const dedent = text => {
    const lines = text.split('\n');
    const indent = Math.min(
      ...lines.filter(l => l.trim()).map(l => l.length - l.trimStart().length)
    );
    return lines.map(l => l.slice(indent)).join('\n');
  };
  const [first, ...rest] = list;
  const reference = dedent(fn(first.code));
  for (const s of rest) {
    assert.equal(
      dedent(fn(s.code)),
      reference,
      `${s.name} differs from ${first.name}`
    );
  }
}

test('every copy of lookup_role is the same', () => {
  assertCopiesEqual(roleSteps, lookupRole);
});

test('every copy of api_pages is the same', () => {
  assert.ok(pageSteps.length >= 2, 'expected api_pages in two steps');
  assertCopiesEqual(pageSteps, apiPages);
});

/** The longest `fn` can run: its waits, plus every try's call timing out. */
function worstCase(fn) {
  const delays = /for delay in ([\d ]+); do/
    .exec(fn)[1]
    .trim()
    .split(/\s+/)
    .map(Number);
  const perCall = Number(/timeout (\d+) gh api/.exec(fn)[1]);
  assert.equal(delays.at(-1), 0, 'the last delay is the 0 that ends the loop');
  return delays.reduce((sum, d) => sum + d, 0) + delays.length * perCall;
}

test("a step's timeout outlasts its functions' worst case", () => {
  assert.equal(worstCase(lookupRole(roleSteps[0].code)), 155);
  for (const { name, code, stepTimeout, jobTimeout } of new Set([
    ...roleSteps,
    ...pageSteps,
  ])) {
    // One call of each: a step whose every lookup needs most of its
    // retries can outlast this, which fails it the same way.
    const worst = [lookupRole(code), apiPages(code)]
      .filter(Boolean)
      .reduce((sum, fn) => sum + worstCase(fn), 0);
    const limit = (stepTimeout ?? jobTimeout) * 60;
    assert.ok(
      limit > worst,
      `${name}: ${limit}s allowed, but its functions can take ${worst}s`
    );
  }
});

/** A directory holding stub `gh`, `timeout` and `sleep` commands. */
function stubs() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'role-lookup-'));
  const write = (name, body) =>
    fs.writeFileSync(path.join(dir, name), `#!/bin/sh\n${body}`, {
      mode: 0o755,
    });
  // A failed call prints a body as gh does for an HTTP error, so a retry
  // that kept it would show up in ROLE. With GH_STATUS set, a failed role
  // lookup is that HTTP status, worded as gh words one, rather than a
  // dropped connection.
  write(
    'gh',
    String.raw`echo "gh $*" >> "$STUB_LOG"
fails() {
  n=$(($(cat "$1" 2>/dev/null || echo 0) + 1))
  echo "$n" > "$1"
  [ "$n" -le "$2" ]
}
case "$*" in
  *"/collaborators/"*"/permission"*)
    if fails "$STUB_COUNT" "$GH_FAILS"; then
      echo '{"message":"stub"}'
      if [ -n "$GH_STATUS" ]; then
        echo "gh: stub (HTTP $GH_STATUS)" >&2
      else
        echo 'dial tcp 192.0.2.1:443: connect: connection refused' >&2
      fi
      exit 1
    fi
    echo "$GH_ROLE" ;;
  *"--paginate"*)
    if fails "$STUB_PAGE_COUNT" "$GH_PAGE_FAILS"; then
      echo 'dial tcp 192.0.2.1:443: connect: connection refused' >&2
      exit 1
    fi
    printf '%s\n' "$STUB_PAGES" ;;
esac
exit 0
`
  );
  write('timeout', 'echo "timeout $1" >> "$STUB_LOG"\nshift\nexec "$@"\n');
  write('sleep', 'echo "sleep $1" >> "$STUB_LOG"\n');
  return dir;
}

/**
 * Runs a step's script with `alice` as the sender of a `deep-review` label
 * event. The stub `gh` fails `fails` role lookups (as HTTP `status`, or a
 * dropped connection) before it answers `role`, and fails `pageFails` page
 * reads before it prints `pages`.
 */
function runStep(
  script,
  {
    role = 'admin',
    fails = 0,
    status = '',
    pageFails = 0,
    pages = '',
    action = 'labeled',
  } = {}
) {
  const dir = stubs();
  const log = path.join(dir, 'log');
  const output = path.join(dir, 'output');
  fs.writeFileSync(log, '');
  fs.writeFileSync(output, '');
  const run = spawnSync('bash', ['-c', script], {
    encoding: 'utf8',
    env: {
      PATH: `${dir}:${process.env.PATH}`,
      STUB_LOG: log,
      STUB_COUNT: path.join(dir, 'count'),
      STUB_PAGE_COUNT: path.join(dir, 'page-count'),
      GH_FAILS: String(fails),
      GH_STATUS: status,
      GH_ROLE: role,
      GH_PAGE_FAILS: String(pageFails),
      STUB_PAGES: pages,
      GITHUB_OUTPUT: output,
      GH_TOKEN: 'stub',
      REPO: 'owner/repo',
      SENDER: 'alice',
      ACTION: action,
      LABEL: 'deep-review',
      PR: '7',
      NUMBER: '7',
      IS_PR: 'false',
    },
  });
  const calls = fs.readFileSync(log, 'utf8').split('\n').filter(Boolean);
  return {
    status: run.status,
    stdout: run.stdout,
    stderr: run.stderr,
    output: fs.readFileSync(output, 'utf8'),
    calls,
    lookups: calls.filter(c => /^gh api .*\/permission/.test(c)),
    reads: calls.filter(c => /^gh api --paginate/.test(c)),
    sleeps: calls.filter(c => c.startsWith('sleep ')).map(c => c.slice(6)),
  };
}

/** Whether every call matching `pattern` ran under `timeout seconds`. */
const timed = (run, pattern, seconds) =>
  run.calls.every(
    (c, i) => !pattern.test(c) || run.calls[i - 1] === `timeout ${seconds}`
  );

/** The output a step records its decision in, or null when it has none. */
const decisionKey = code =>
  code.includes('"allowed=')
    ? 'allowed'
    : code.includes('out run ')
      ? 'run'
      : null;

/** Whether a run went on as allowed or stopped, for a step with no output. */
const closed = run => run.calls.some(c => c.startsWith('gh pr close'));

for (const { name, script, code } of senderSteps) {
  const key = decisionKey(code);
  const turnedAway = (run, role) => {
    assert.equal(run.status, 0, run.stdout + run.stderr);
    assert.match(
      run.stdout,
      new RegExp(`alice lacks (?:write/)?triage access \\(${role}\\)`)
    );
    assert.doesNotMatch(run.stdout, /::error::/);
    assert.deepEqual(run.sleeps, []);
    if (key) {
      assert.match(run.output, new RegExp(`^${key}=false$`, 'm'));
      assert.doesNotMatch(run.output, new RegExp(`^${key}=true$`, 'm'));
    } else {
      assert.ok(!closed(run));
    }
  };
  const allowed = (run, role) => {
    assert.equal(run.status, 0, run.stdout + run.stderr);
    assert.match(run.stdout, new RegExp(`alice has ${role} access`));
    if (key) assert.match(run.output, new RegExp(`^${key}=true$`, 'm'));
    else assert.ok(closed(run));
  };
  const undecided = run => {
    assert.notEqual(run.status, 0);
    assert.doesNotMatch(run.stdout, /lacks (?:write\/)?triage access/);
    if (key) assert.doesNotMatch(run.output, new RegExp(`^${key}=`, 'm'));
    else assert.ok(!closed(run));
  };

  test(`${name}: a triage+ role is allowed`, () => {
    const run = runStep(script, { role: 'admin' });
    allowed(run, 'admin');
    assert.equal(run.lookups.length, 1);
    assert.deepEqual(run.sleeps, []);
  });

  for (const role of ['read', 'none']) {
    test(`${name}: role ${role} is turned away as before`, () => {
      turnedAway(runStep(script, { role }), role);
    });
  }

  test(`${name}: a 404 reads as no access, without a retry`, () => {
    const run = runStep(script, { fails: 99, status: '404' });
    turnedAway(run, 'none');
    assert.equal(run.lookups.length, 1);
  });

  test(`${name}: a failed call is retried and the answer used`, () => {
    const run = runStep(script, { role: 'maintain', fails: 2 });
    allowed(run, 'maintain');
    assert.equal(run.lookups.length, 3);
    assert.deepEqual(run.sleeps, ['5', '10']);
    assert.ok(
      timed(run, /^gh api .*\/permission/, 10),
      'every lookup runs under timeout'
    );
  });

  test(`${name}: a rate limit is retried like a dropped connection`, () => {
    const run = runStep(script, { role: 'write', fails: 2, status: '403' });
    allowed(run, 'write');
    assert.deepEqual(run.sleeps, ['5', '10']);
  });

  test(`${name}: a call that never answers fails the step and decides nothing`, () => {
    const run = runStep(script, { role: 'admin', fails: 99 });
    undecided(run);
    assert.match(
      run.stdout,
      /^::error::Could not look up alice's role because every GitHub API call failed/m
    );
    assert.deepEqual(run.sleeps, ['5', '10', '20', '30', '30']);
    assert.equal(run.lookups.length, 6);
  });

  test(`${name}: any other refusal fails the step at once`, () => {
    const run = runStep(script, { fails: 99, status: '401' });
    undecided(run);
    assert.match(
      run.stdout,
      /^::error::GitHub refused the role lookup for alice \(HTTP 401\)/m
    );
    assert.deepEqual(run.sleeps, []);
    assert.equal(run.lookups.length, 1);
  });
}

const MARKER_REVIEW = JSON.stringify([
  { user: { login: 'claude[bot]' }, body: '<!-- claude-deep-review -->\nok' },
]);

test('dedupe: retries the reviews read, the first call on an opened event', () => {
  const run = runStep(step(DEDUPE).script, {
    action: 'opened',
    pageFails: 2,
    pages: MARKER_REVIEW,
  });
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.equal(run.reads.length, 3);
  assert.deepEqual(run.sleeps, ['5', '10']);
  assert.ok(
    timed(run, /^gh api --paginate/, 30),
    'every read runs under timeout'
  );
  assert.match(run.output, /^reviewed=true$/m);
  assert.match(run.output, /^skip=true$/m);
});

test('dedupe: a read that never answers fails the step and decides nothing', () => {
  const run = runStep(step(DEDUPE).script, { action: 'opened', pageFails: 99 });
  assert.notEqual(run.status, 0);
  assert.match(
    run.stdout,
    /^::error::Could not read repos\/owner\/repo\/pulls\/7\/reviews\?per_page=100 because every GitHub API call failed/m
  );
  assert.equal(run.reads.length, 6);
  assert.doesNotMatch(run.output, /^(?:reviewed|skip)=/m);
});

// What gh's --jq makes of one maintainer's steer comment. A misread that
// skipped the author or the comment would drop the fresh request.
const STEER = JSON.stringify({
  login: 'alice',
  body: 'deep-review: fresh look at the parser',
});
// A steer that isn't fresh, for the run that reads one: the step strips a
// fresh token with GNU sed's -z, which the runner has and macOS doesn't.
const FOCUSED = JSON.stringify({
  login: 'alice',
  body: 'deep-review: look at the parser',
});

test('focus: reads a verified steer after retrying its reads', () => {
  const run = runStep(step(FOCUS).script, {
    role: 'maintain',
    fails: 2,
    pageFails: 1,
    pages: FOCUSED,
  });
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.deepEqual(run.sleeps, ['5', '5', '10']);
  assert.match(run.stdout, /using steer by alice \(maintain\)/);
  assert.match(run.output, /^block<<FOCUS_/m);
  assert.match(run.output, /look at the parser/);
});

test('focus: a 404 author is skipped as untrusted', () => {
  const run = runStep(step(FOCUS).script, {
    fails: 99,
    status: '404',
    pages: STEER,
  });
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.match(run.stdout, /ignoring steer by alice \(none/);
  assert.deepEqual(run.sleeps, []);
  assert.doesNotMatch(run.output, /^block<</m);
  assert.doesNotMatch(run.output, /^fresh=true$/m);
});

test('focus: a role lookup that never answers fails the step, not the author', () => {
  const run = runStep(step(FOCUS).script, { fails: 99, pages: STEER });
  assert.notEqual(run.status, 0);
  assert.match(run.stdout, /^::error::Could not look up alice's role/m);
  assert.doesNotMatch(run.stdout, /ignoring steer/);
  assert.doesNotMatch(run.output, /^block<</m);
  assert.doesNotMatch(run.output, /^fresh=true$/m);
});

test('focus: a comment read that never answers fails the step, not the steer', () => {
  const run = runStep(step(FOCUS).script, { pageFails: 99, pages: STEER });
  assert.notEqual(run.status, 0);
  assert.match(
    run.stdout,
    /^::error::Could not read repos\/owner\/repo\/issues\/7\/comments\?per_page=100/m
  );
  assert.doesNotMatch(run.stdout, /unfocused review/);
  assert.doesNotMatch(run.output, /^block<</m);
  assert.equal(run.lookups.length, 0);
});
