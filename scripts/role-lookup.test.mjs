/**
 * Holds the live-role checks to `lookup_role` (#1258).
 *
 * The steps that re-verify the triggering user's role used to read a failed
 * API call as role `none`. When harden-runner dropped a job's first
 * connections, the run logged that the user lacked access and skipped its
 * work. Each step now calls `lookup_role`, which retries and then fails the
 * step ("When the agent drops a job's first connections" under rule 10 in
 * `.github/CLAUDE.md`). The function is hand-copied into every step, so this
 * reads the workflows and checks:
 *
 * - every step that looks up `$SENDER`'s role does it through `lookup_role`,
 *   and no permission call there falls back to a role on error;
 * - every copy of `lookup_role` matches the first;
 * - the step's timeout, or its job's, outlasts the function's worst case;
 * - each step, run under bash with a stub `gh`, `timeout` and `sleep` on
 *   PATH, handles a role from the API as it did before, retries a call that
 *   fails and then answers, and fails with an `::error::` and no decision
 *   when the call never answers.
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

/**
 * Steps that still look the role up the old way, and why. An entry whose step
 * now calls `lookup_role`, or no longer exists, fails the test, so none
 * outlives its reason.
 */
const PENDING = new Map([
  [
    'claude-review.yml:review:Check labeler permission',
    'a PR whose copy of claude-review.yml differs from the default branch is not deep-reviewed, so this step changes in a PR of its own',
  ],
]);

/** A shell script with its comment lines removed. */
const shellCode = script =>
  (script ?? '')
    .split('\n')
    .filter(line => !/^\s*#/.test(line))
    .join('\n');

const scalar = (map, key) => yamlScalar(map.get(key) ?? null);

/** The `lookup_role` definition in `code`, from its first line to its `}`. */
const lookupRole = code =>
  /^([ \t]*)lookup_role\(\) \{\n[\s\S]*?\n\1\}$/m.exec(code)?.[0] ?? null;

/** Every step that looks up the triggering user's role. */
function roleSteps() {
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
        const code = shellCode(script);
        if (
          !code.includes('collaborators/$SENDER/permission') &&
          !code.includes('lookup_role "$SENDER"')
        ) {
          continue;
        }
        steps.push({
          name: `${file}:${id}:${scalar(step, 'name')}`,
          script,
          code,
          stepTimeout: Number(scalar(step, 'timeout-minutes')) || null,
          jobTimeout: Number(yamlScalar(yamlGet(job.lines, 'timeout-minutes'))),
        });
      }
    }
  }
  return steps;
}

const steps = roleSteps();
const current = steps.filter(step => !PENDING.has(step.name));

test('the workflows have role lookups to check', () => {
  assert.ok(current.length > 0, 'no step calls lookup_role');
});

test('every role lookup goes through lookup_role and keeps no fallback', () => {
  const problems = [];
  for (const { name, code } of current) {
    if (!lookupRole(code)) problems.push(`${name}: no lookup_role definition`);
    if (!/^\s*lookup_role "\$SENDER"$/m.test(code)) {
      problems.push(`${name}: does not call lookup_role "$SENDER"`);
    }
    // The fallback this replaced: an error read as a role.
    if (/\/permission"[^\n]*(?:\\\n[^\n]*)?\|\|/.test(code)) {
      problems.push(`${name}: a permission call falls back on error`);
    }
  }
  assert.deepEqual(problems, []);
});

test('every PENDING entry names a step that still needs the change', () => {
  for (const [name] of PENDING) {
    const step = steps.find(s => s.name === name);
    assert.ok(step, `PENDING names ${name}, which no longer exists`);
    assert.equal(
      lookupRole(step.code),
      null,
      `${name} now calls lookup_role, so drop its PENDING entry`
    );
  }
});

test('every copy of lookup_role is the same', () => {
  const [first, ...rest] = current;
  const dedent = text => {
    const lines = text.split('\n');
    const indent = Math.min(
      ...lines.filter(l => l.trim()).map(l => l.length - l.trimStart().length)
    );
    return lines.map(l => l.slice(indent)).join('\n');
  };
  const reference = dedent(lookupRole(first.code));
  for (const step of rest) {
    assert.equal(
      dedent(lookupRole(step.code)),
      reference,
      `${step.name} differs from ${first.name}`
    );
  }
});

test("a step's timeout outlasts lookup_role's worst case", () => {
  const fn = lookupRole(current[0].code);
  const delays = /for delay in ([\d ]+); do/
    .exec(fn)[1]
    .trim()
    .split(/\s+/)
    .map(Number);
  const perCall = Number(/timeout (\d+) gh api/.exec(fn)[1]);
  assert.equal(delays.at(-1), 0, 'the last delay is the 0 that ends the loop');
  const worst = delays.reduce((sum, d) => sum + d, 0) + delays.length * perCall;
  for (const { name, stepTimeout, jobTimeout } of current) {
    const limit = (stepTimeout ?? jobTimeout) * 60;
    assert.ok(
      limit > worst,
      `${name}: ${limit}s allowed, but lookup_role can take ${worst}s`
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
  // that kept it would show up in ROLE.
  write(
    'gh',
    String.raw`echo "gh $*" >> "$STUB_LOG"
case "$*" in
  *"/collaborators/"*"/permission"*)
    n=$(($(cat "$STUB_COUNT" 2>/dev/null || echo 0) + 1))
    echo "$n" > "$STUB_COUNT"
    if [ "$n" -le "$GH_FAILS" ]; then
      echo '{"message":"stub"}'
      echo 'dial tcp 192.0.2.1:443: connect: connection refused' >&2
      exit 1
    fi
    echo "$GH_ROLE" ;;
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
 * event, and the stub `gh` failing `fails` times before it answers `role`.
 */
function runStep(script, { role = 'admin', fails = 0 } = {}) {
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
      GH_FAILS: String(fails),
      GH_ROLE: role,
      GITHUB_OUTPUT: output,
      GH_TOKEN: 'stub',
      REPO: 'owner/repo',
      SENDER: 'alice',
      ACTION: 'labeled',
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
    sleeps: calls.filter(c => c.startsWith('sleep ')).map(c => c.slice(6)),
  };
}

/** The output a step records its decision in, or null when it has none. */
const decisionKey = code =>
  code.includes('"allowed=')
    ? 'allowed'
    : code.includes('out run ')
      ? 'run'
      : null;

/** Whether a run went on as allowed or stopped, for a step with no output. */
const closed = run => run.calls.some(c => c.startsWith('gh pr close'));

for (const { name, script, code } of current) {
  const key = decisionKey(code);

  test(`${name}: a triage+ role is allowed`, () => {
    const run = runStep(script, { role: 'admin' });
    assert.equal(run.status, 0, run.stdout + run.stderr);
    assert.match(run.stdout, /alice has admin access/);
    assert.equal(run.lookups.length, 1);
    assert.deepEqual(run.sleeps, []);
    if (key) assert.match(run.output, new RegExp(`^${key}=true$`, 'm'));
    else assert.ok(closed(run));
  });

  for (const role of ['read', 'none']) {
    test(`${name}: role ${role} is turned away as before`, () => {
      const run = runStep(script, { role });
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
    });
  }

  test(`${name}: a failed call is retried and the answer used`, () => {
    const run = runStep(script, { role: 'maintain', fails: 2 });
    assert.equal(run.status, 0, run.stdout + run.stderr);
    assert.match(run.stdout, /alice has maintain access/);
    assert.equal(run.lookups.length, 3);
    assert.deepEqual(run.sleeps, ['5', '10']);
    assert.ok(
      run.calls.every(
        (c, i) =>
          !/^gh api .*\/permission/.test(c) || run.calls[i - 1] === 'timeout 10'
      ),
      'every lookup runs under timeout'
    );
    if (key) assert.match(run.output, new RegExp(`^${key}=true$`, 'm'));
    else assert.ok(closed(run));
  });

  test(`${name}: a call that never answers fails the step and decides nothing`, () => {
    const run = runStep(script, { role: 'admin', fails: 99 });
    assert.notEqual(run.status, 0);
    assert.match(
      run.stdout,
      /^::error::Could not look up alice's role because every GitHub API call failed/m
    );
    assert.doesNotMatch(run.stdout, /lacks (?:write\/)?triage access/);
    assert.deepEqual(run.sleeps, ['5', '10', '20', '30', '30']);
    assert.equal(run.lookups.length, 6);
    if (key) assert.doesNotMatch(run.output, new RegExp(`^${key}=`, 'm'));
    else assert.ok(!closed(run));
  });
}
