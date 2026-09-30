/**
 * Covers scripts/coverage-floors.mjs (#724).
 *
 * The unit cases hold the comparison to its three failure modes and to the
 * rule that a red run is not judged. The end-to-end cases run a real
 * `node --test` with the reporter loaded, because the one thing a unit case
 * cannot show is that a failed floor fails the process: a gate whose verdict
 * never reaches the exit code prints its complaint and goes green.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  checkFloors,
  floorsReporter,
  measuredRow,
} from './coverage-floors.mjs';

const ROOT = join(tmpdir(), 'repo');

/** A coverage summary entry the way Node reports one. */
const file = (key, lines, branches, functions) => ({
  path: join(ROOT, ...key.split('/')),
  coveredLinePercent: lines,
  coveredBranchPercent: branches,
  coveredFunctionPercent: functions,
});

const row = (lines, branches, functions) => ({ lines, branches, functions });

test('a row rounds each metric down to a whole percent', () => {
  assert.deepEqual(
    measuredRow(file('scripts/a.mjs', 89.99, 100, 0)),
    row(89, 100, 0)
  );
});

test('a file at or above every floor passes, including exactly on one', () => {
  const files = [file('scripts/a.mjs', 90, 80.5, 100)];
  assert.deepEqual(
    checkFloors(files, { 'scripts/a.mjs': row(90, 80, 100) }, ROOT),
    []
  );
});

test('each metric below its floor is named, and only that one', () => {
  const files = [
    file('scripts/lines.mjs', 49.5, 100, 100),
    file('scripts/branches.mjs', 100, 49.5, 100),
    file('scripts/functions.mjs', 100, 100, 87.5),
  ];
  const floors = {
    'scripts/lines.mjs': row(50, 50, 50),
    'scripts/branches.mjs': row(50, 50, 50),
    'scripts/functions.mjs': row(50, 50, 100),
  };
  assert.deepEqual(checkFloors(files, floors, ROOT), [
    'scripts/lines.mjs: lines 49.50% is below its floor of 50%.',
    'scripts/branches.mjs: branches 49.50% is below its floor of 50%.',
    'scripts/functions.mjs: functions 87.50% is below its floor of 100%.',
  ]);
});

test('a loaded file with no row fails, offering a row that pastes in', () => {
  const measured = file('scripts/lib/new.mjs', 99.41, 95.83, 75);
  const [problem, ...rest] = checkFloors([measured], {}, ROOT);
  assert.deepEqual(rest, []);
  assert.match(problem, /^scripts\/lib\/new\.mjs has no floor/);
  assert.match(problem, /lines 99\.41%, branches 95\.83%, functions 75\.00%/);

  // The last line is the row itself, in the table's JSON.
  const pasted = JSON.parse(`{${problem.split('\n').at(-1)}}`);
  assert.deepEqual(pasted, { 'scripts/lib/new.mjs': row(99, 95, 75) });
});

test('a row no test loaded fails, so a lost test sibling cannot go quiet', () => {
  const problems = checkFloors(
    [file('scripts/a.mjs', 100, 100, 100)],
    { 'scripts/a.mjs': row(100, 100, 100), 'scripts/gone.mjs': row(1, 1, 1) },
    ROOT
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^scripts\/gone\.mjs has a floor, but no test/);
});

test('a row missing a metric is reported instead of passing', () => {
  // `x < undefined` is false, so without the check a misspelled key would
  // switch that metric off and read as a pass.
  const problems = checkFloors(
    [file('scripts/a.mjs', 0, 0, 0)],
    { 'scripts/a.mjs': { lines: 0, branches: 0, function: 100 } },
    ROOT
  );
  assert.deepEqual(problems, [
    'scripts/a.mjs: its row has no number for "functions".',
  ]);
});

/** Drives a reporter over `events`, collecting its text and any failure. */
async function report(floors, events) {
  let failed = 0;
  const reporter = floorsReporter({ floors, root: ROOT, fail: () => failed++ });
  let text = '';
  for await (const chunk of reporter(events)) text += chunk;
  return { text, failed };
}

const coverage = (...files) => ({
  type: 'test:coverage',
  data: { summary: { files } },
});
const summary = success => ({ type: 'test:summary', data: { success } });

test('a green run inside its floors passes and says it checked', async () => {
  const { text, failed } = await report({ 'scripts/a.mjs': row(90, 90, 90) }, [
    summary(true),
    coverage(file('scripts/a.mjs', 95, 95, 95)),
    summary(true),
  ]);
  assert.equal(failed, 0);
  assert.match(text, /Every measured file \(1\) is at or above its floor/);
});

test('a green run below a floor fails once and names the file', async () => {
  const { text, failed } = await report({ 'scripts/a.mjs': row(90, 90, 90) }, [
    coverage(file('scripts/a.mjs', 95, 95, 60)),
    summary(true),
  ]);
  assert.equal(failed, 1);
  assert.match(text, /scripts\/a\.mjs: functions 60\.00% is below/);
});

test('a red run is not judged, whatever its coverage', async () => {
  // The first summary is one file's; the run's is last. Reading the first
  // would judge floors on a run whose tests failed.
  const { text, failed } = await report({ 'scripts/a.mjs': row(90, 90, 90) }, [
    summary(true),
    coverage(file('scripts/a.mjs', 0, 0, 0)),
    summary(false),
  ]);
  assert.equal(failed, 0);
  assert.match(text, /Not checked: tests failed/);
});

test('a green run with no coverage at all fails', async () => {
  const { text, failed } = await report({}, [summary(true)]);
  assert.equal(failed, 1);
  assert.match(text, /--experimental-test-coverage/);
});

/**
 * Runs a real `node --test` over a two-function fixture, one function called,
 * with the reporter loaded through a wrapper that sets `floors`.
 */
function runFixture(floors, { failTest = false } = {}) {
  // Real path, because coverage reports modules by theirs: macOS's temp
  // directory sits behind a symlink, and every key would come out `../…`.
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'coverage-floors-')));
  try {
    writeFileSync(
      join(dir, 'lib.mjs'),
      'export const used = () => 1;\nexport const unused = () => 2;\n'
    );
    writeFileSync(
      join(dir, 'lib.test.mjs'),
      [
        "import { test } from 'node:test';",
        "import { used } from './lib.mjs';",
        "test('calls one of the two', () => {",
        '  if (used() !== 1) throw new Error("used() changed");',
        failTest ? '  throw new Error("asked to fail");' : '',
        '});',
        '',
      ].join('\n')
    );
    const module = pathToFileURL(
      join(import.meta.dirname, 'coverage-floors.mjs')
    );
    writeFileSync(
      join(dir, 'floors.mjs'),
      `import { floorsReporter } from ${JSON.stringify(module.href)};\n` +
        `export default floorsReporter(${JSON.stringify({ floors, root: dir })});\n`
    );

    // A nested `node --test` that inherits NODE_TEST_CONTEXT takes itself for
    // a file of the outer run and skips running anything; the coverage
    // directory is the outer run's and has no business receiving this one's.
    // That is why the default `fail` reads as uncovered in the table even
    // though these cases run it: it only ever runs in this unmeasured process.
    const env = Object.fromEntries(
      Object.entries(process.env).filter(
        ([name]) => !['NODE_TEST_CONTEXT', 'NODE_V8_COVERAGE'].includes(name)
      )
    );
    const run = spawnSync(
      process.execPath,
      [
        '--test',
        '--experimental-test-coverage',
        '--test-coverage-include=lib.mjs',
        '--test-reporter=./floors.mjs',
        '--test-reporter-destination=stdout',
        'lib.test.mjs',
      ],
      { cwd: dir, env, encoding: 'utf8', timeout: 60_000 }
    );
    return { status: run.status, output: `${run.stdout}${run.stderr}` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('end to end: floors that hold leave the exit code at 0', () => {
  const { status, output } = runFixture({ 'lib.mjs': row(0, 0, 50) });
  assert.equal(status, 0, output);
  assert.match(output, /Every measured file \(1\) is at or above its floor/);
});

test('end to end: a floor that fails makes the run exit non-zero', () => {
  const { status, output } = runFixture({ 'lib.mjs': row(0, 0, 100) });
  assert.equal(status, 1, output);
  assert.match(
    output,
    /lib\.mjs: functions 50\.00% is below its floor of 100%/
  );
});

test('end to end: a failing test is reported as not checked', () => {
  const { status, output } = runFixture(
    { 'lib.mjs': row(0, 0, 100) },
    { failTest: true }
  );
  assert.equal(status, 1, output);
  assert.match(output, /Not checked: tests failed/);
  assert.doesNotMatch(output, /below its floor/);
});
