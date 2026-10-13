/**
 * Holds `disable-sudo-and-containers` to its check in every workflow (#1014).
 *
 * Rule 10 in `.github/CLAUDE.md` says a block job sets the flag unless a step
 * needs sudo or Docker, that a job leaving it off says why above its
 * harden-runner, and that a job setting it proves the setting took in its
 * assertion step. Both halves are hand-copied YAML, so this reads the
 * workflows and checks they agree:
 *
 * - a block job that sets the flag asserts `agent.json` records it, then
 *   tests sudo and `docker.sock` once the agent reports `Initialized`, and
 *   each of those arms fails the step;
 * - a block job that leaves it off carries none of them, and its comment
 *   above harden-runner names the flag.
 *
 * It matches each arm whole, from its `if` to its `fi`, so a dropped `!` or
 * `exit 1` fails here rather than leaving a check that logs and lets the job
 * go on. It reads the workflows with the conformance check's YAML reader, as
 * the other workflow tests do, since the root declares no YAML dependency.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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

const HARDEN_RUNNER = 'step-security/harden-runner@';
const ASSERT_STEP = 'Assert egress policy is enforced';
const FLAG = 'disable-sudo-and-containers';

/**
 * Block jobs that leave the flag off with no comment yet, and why. An entry
 * whose job now sets the flag, or no longer exists, fails the test, so none
 * outlives its reason.
 */
const PENDING = new Map([]);

/** Each arm's opening line, as a regex source. */
const ARMS = {
  'agent.json records the flag': String.raw`if ! jq -e '\.disable_sudo_and_containers == true' /home/agent/agent\.json; then`,
  'sudo is closed': String.raw`if sudo -n true 2>/dev/null; then`,
  'docker.sock is closed': String.raw`if \[ -w /var/run/docker\.sock \]; then`,
};

/** The body every arm must have: an error that ends the step, then `fi`. */
const ARM_BODY = String.raw`\n[ \t]*(?:echo "::error::[^"\n]+"\n[ \t]*exit 1|fail "[^"\n]+")\n[ \t]*fi\n`;

const INITIALIZED = `if grep -q '^Initialized' /home/agent/agent.status`;

/** A shell script with its comment lines removed. */
const shellCode = script =>
  (script ?? '')
    .split('\n')
    .filter(line => !/^\s*#/.test(line))
    .join('\n');

const scalar = (map, key) => yamlScalar(map.get(key) ?? null);

/**
 * The comment lines directly above the step whose `uses:` line is at `at`
 * in `lines`, which are a job's lines.
 */
function commentAbove(lines, at) {
  let start = at;
  while (start > 0 && !/^\s*-(\s|$)/.test(lines[start])) start--;
  const comment = [];
  for (let k = start - 1; k >= 0 && /^\s*#/.test(lines[k]); k--) {
    comment.unshift(lines[k]);
  }
  return comment.join('\n');
}

/** Every job whose harden-runner sets `egress-policy: block`. */
function blockJobs() {
  const jobs = [];
  const files = fs
    .readdirSync(WORKFLOWS)
    .filter(file => /\.ya?ml$/.test(file))
    .sort();
  for (const file of files) {
    const lines = fs
      .readFileSync(path.join(WORKFLOWS, file), 'utf8')
      .split(/\r?\n/);
    for (const [id, job] of yamlMap(yamlGet(lines, 'jobs')?.lines ?? [])) {
      const steps = yamlItems(yamlGet(job.lines, 'steps')?.lines ?? []).map(
        yamlMap
      );
      const hardenRunner = steps.find(step =>
        (scalar(step, 'uses') ?? '').startsWith(HARDEN_RUNNER)
      );
      if (!hardenRunner) continue;
      const inputs = yamlMap(hardenRunner.get('with')?.lines ?? []);
      if (scalar(inputs, 'egress-policy') !== 'block') continue;
      const assertion = steps.find(
        step => scalar(step, 'name') === ASSERT_STEP
      );
      const usesAt = job.lines.findIndex(line =>
        new RegExp(`^\\s*(-\\s+)?uses:\\s*${HARDEN_RUNNER}`).test(line)
      );
      jobs.push({
        name: `${file}:${id}`,
        flag: scalar(inputs, FLAG) === 'true',
        assertion: Boolean(assertion),
        code: shellCode(assertion && scalar(assertion, 'run')),
        comment: commentAbove(job.lines, usesAt),
      });
    }
  }
  return jobs;
}

/** What is wrong with a job that sets the flag, or an empty list. */
function flaggedProblems({ code }) {
  const problems = [];
  const at = {};
  for (const [what, head] of Object.entries(ARMS)) {
    const match = new RegExp(`^[ \\t]*${head}${ARM_BODY}`, 'm').exec(code);
    if (!match) problems.push(`no arm that fails the step when not "${what}"`);
    else at[what] = match.index;
    if (
      match &&
      /\bfail "/.test(match[0]) &&
      !/fail\(\) \{[^}]*\bexit 1\b/.test(code)
    ) {
      problems.push(`"${what}" calls fail, which does not exit 1`);
    }
  }
  if (problems.length) return problems;
  const initialized = code.indexOf(INITIALIZED);
  const loop = code.indexOf('for _ in');
  if (at['agent.json records the flag'] > loop) {
    problems.push('the agent.json arm runs inside or after the poll');
  }
  if (
    initialized < 0 ||
    !(
      initialized < at['sudo is closed'] &&
      at['sudo is closed'] < at['docker.sock is closed']
    )
  ) {
    problems.push(
      'the sudo and docker.sock arms do not follow Initialized, in that order'
    );
  }
  const afterDocker = code.slice(at['docker.sock is closed']);
  if (!/\n[ \t]*fi\n[ \t]*exit 0\n/.test(afterDocker)) {
    problems.push('the step does not exit 0 right after the docker.sock arm');
  }
  return problems;
}

/** What is wrong with a job that leaves the flag off, or an empty list. */
function unflaggedProblems({ name, code, comment }) {
  const problems = [];
  for (const marker of [
    'disable_sudo_and_containers',
    'sudo -n',
    'docker.sock',
  ]) {
    if (code.includes(marker))
      problems.push(`checks "${marker}" without the flag`);
  }
  if (!PENDING.has(name) && !comment.includes(FLAG)) {
    problems.push(
      `the comment above harden-runner does not say why ${FLAG} is off`
    );
  }
  return problems;
}

const jobs = blockJobs();

test('the workflows have block jobs both with and without the flag', () => {
  assert.ok(
    jobs.some(job => job.flag),
    'no block job sets the flag'
  );
  assert.ok(
    jobs.some(job => !job.flag),
    'no block job leaves the flag off'
  );
});

test('every block job has the assertion step', () => {
  assert.deepEqual(
    jobs.filter(job => !job.assertion).map(job => job.name),
    []
  );
});

test('a block job that sets the flag checks it, and each check fails the step', () => {
  const problems = jobs
    .filter(job => job.flag)
    .flatMap(job => flaggedProblems(job).map(p => `${job.name}: ${p}`));
  assert.deepEqual(problems, []);
});

test('a block job that leaves the flag off checks none of it and says why', () => {
  const problems = jobs
    .filter(job => !job.flag)
    .flatMap(job => unflaggedProblems(job).map(p => `${job.name}: ${p}`));
  assert.deepEqual(problems, []);
});

test('every PENDING entry still names a block job that leaves the flag off', () => {
  const byName = new Map(jobs.map(job => [job.name, job]));
  const stale = [...PENDING.keys()].filter(
    name => !byName.has(name) || byName.get(name).flag
  );
  assert.deepEqual(stale, [], 'remove these from PENDING');
});
