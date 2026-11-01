/**
 * Covers scripts/coverage-floors.mjs (#724).
 *
 * The unit cases hold the comparison to its three failure modes, the rule
 * that a red run is not judged, and how a new row is worked out: the branch
 * allowance for run-to-run noise, and no floor of 0 for a covered metric. The
 * end-to-end cases run a real Vitest with the reporter loaded, because the one
 * thing a unit case cannot show is that a failed floor fails the process: a
 * gate whose verdict never reaches the exit code prints its complaint and goes
 * green.
 */
import { test, vi } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import {
  checkFloors,
  FloorsReporter,
  filesOf,
  floorFor,
  measuredRow,
} from './coverage-floors.mjs';
import { fixture, here, runVitest } from './lib/nested-vitest.mjs';
import { tokenize } from './lib/shell-words.mjs';

const ROOT = join(tmpdir(), 'repo');
const REPO = join(import.meta.dirname, '..');
const TABLE = 'scripts/coverage-floors.json';

/** Istanbul's percentage for `covered` of `total`, which calls an empty metric 100. */
const percent = (covered, total) => (total ? (100 * covered) / total : 100);

const metric = ([covered, total]) => ({
  covered,
  total,
  pct: percent(covered, total),
});

/**
 * A file's summary the way `filesOf` hands one on, from a `[covered, total]`
 * pair per metric.
 */
const file = (key, lines, branches, functions) => ({
  path: join(ROOT, ...key.split('/')),
  lines: metric(lines),
  branches: metric(branches),
  functions: metric(functions),
});

/** A file at `p` percent on every metric, out of a hundred of each. */
const flat = (key, p) => file(key, [p, 100], [p, 100], [p, 100]);

const row = (lines, branches, functions) => ({ lines, branches, functions });

test('only branches get an allowance; lines and functions round down', () => {
  // 246 of 276 branches is 89.13%; with two fewer covered, 88.41%.
  assert.equal(floorFor(246, 276, 2), 88);
  // A function allowance of two would take 5 of 6 to 50 and 2 of 4 to 0,
  // letting a third of a small file go uncovered.
  assert.equal(floorFor(5, 6), 83);
  assert.equal(floorFor(2, 4), 50);
  // 46 of 48 branches: 95 with no allowance, 93 with one, 91 with two.
  assert.deepEqual(
    measuredRow(file('scripts/a.mjs', [335, 337], [46, 48], [5, 6])),
    row(99, 91, 83)
  );
});

test('a fully covered metric keeps a floor of 100', () => {
  // The allowance is for a branch one run covers and another does not. Fully
  // covered code has none, and one function nothing calls is what the floor
  // exists to catch, so it is not traded away here.
  assert.equal(floorFor(10, 10, 2), 100);
  assert.equal(floorFor(0, 0), 100, 'Istanbul calls an empty metric 100%');
  assert.equal(floorFor(9, 10, 2), 70);
});

test('a metric that covers something never gets a floor of 0', () => {
  // A floor of 0 can never fail, so writing one for a covered metric reads
  // as a bar and is not one. The allowance would take 1 of 3 there.
  assert.equal(floorFor(1, 3, 2), 1);
  assert.deepEqual(
    measuredRow(file('scripts/a.mjs', [10, 20], [1, 3], [0, 12])),
    row(50, 1, 0),
    'a metric that measured 0 is the one place a 0 belongs'
  );
  // Under 1% there is no whole-percent bar the file clears.
  assert.equal(floorFor(1, 200), 0);
  // 1 of 99 clears 1% until two never-run branches are counted.
  assert.equal(floorFor(1, 99, 2), 0);
  assert.equal(floorFor(1, 98, 2), 1);
});

test('a branch floor survives two units of noise in either direction', () => {
  // The guarantee the branch allowance exists for, written with its own
  // number rather than SLACK so that shrinking SLACK fails here. Both shapes
  // of noise are checked, branches counted and branches covered, over every
  // count a script here plausibly has.
  const noise = 2;
  for (let total = 1; total <= 600; total++) {
    for (let covered = 0; covered < total; covered++) {
      const floor = floorFor(covered, total, noise);
      const added = percent(covered, total + noise);
      const lost = percent(Math.max(0, covered - noise), total);
      const at = `${covered}/${total} (floor ${floor})`;
      // Never-run branches counted.
      assert.ok(added >= floor, `${at}: ${added} with noise counted`);
      // Covered branches lost. A floor of 1 is exempt: it is the bar that
      // exists to fail when the last covered branches go.
      assert.ok(floor <= 1 || lost >= floor, `${at}: ${lost} after losing`);
      // Only a coverage under 1% once the noise is counted gets a 0.
      assert.ok(floor > 0 || covered === 0 || added < 1, `${at}: 0 floor`);
    }
  }
});

test('a file at or above every floor passes, including exactly on one', () => {
  const files = [file('scripts/a.mjs', [90, 100], [161, 200], [1, 1])];
  assert.deepEqual(
    checkFloors(files, { 'scripts/a.mjs': row(90, 80, 100) }, ROOT),
    []
  );
});

test('each metric below its floor is named, and only that one', () => {
  const all = [1, 1];
  const files = [
    file('scripts/lines.mjs', [99, 200], all, all),
    file('scripts/branches.mjs', all, [99, 200], all),
    file('scripts/functions.mjs', all, all, [7, 8]),
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
  const measured = file('scripts/lib/new.mjs', [335, 337], [46, 48], [6, 8]);
  const [problem, ...rest] = checkFloors([measured], {}, ROOT);
  assert.deepEqual(rest, []);
  assert.match(problem, /^scripts\/lib\/new\.mjs has no floor/);
  assert.match(problem, /lines 99\.41%, branches 95\.83%, functions 75\.00%/);

  // The last line is the row itself, in the table's JSON, with the same
  // allowance the committed rows have.
  const pasted = JSON.parse(`{${problem.split('\n').at(-1)}}`);
  assert.deepEqual(pasted, { 'scripts/lib/new.mjs': row(99, 91, 75) });
});

test('a row no test loaded fails, so a lost test sibling cannot go quiet', () => {
  const problems = checkFloors(
    [flat('scripts/a.mjs', 100)],
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
    [flat('scripts/a.mjs', 0)],
    { 'scripts/a.mjs': { lines: 0, branches: 0, function: 100 } },
    ROOT
  );
  assert.deepEqual(problems, [
    'scripts/a.mjs: its row has no number for "functions".',
  ]);
});

test('a figure the run did not report fails instead of passing', () => {
  // The same hazard on the measured side: a field Istanbul renamed compares
  // false against every floor, so it would pass every file at once.
  const renamed = flat('scripts/a.mjs', 95);
  delete renamed.branches.pct;
  const nan = flat('scripts/b.mjs', 95);
  nan.lines.pct = NaN;
  const problems = checkFloors(
    [renamed, nan],
    { 'scripts/a.mjs': row(90, 90, 90), 'scripts/b.mjs': row(90, 90, 90) },
    ROOT
  );
  assert.equal(problems.length, 2);
  assert.match(problems[0], /^scripts\/a\.mjs: .*"branches\.pct"/);
  assert.match(problems[1], /^scripts\/b\.mjs: .*"lines\.pct"/);
  assert.match(problems[0], /was not checked/);
});

test('a new file with a missing count gets no made-up row', () => {
  // Without the check, a missing count works out to a floor of 0 in the row
  // offered to paste in: a bar that reads as one and is not.
  const measured = flat('scripts/new.mjs', 95);
  delete measured.functions.total;
  const problems = checkFloors([measured], {}, ROOT);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /"functions\.total"/);
  assert.doesNotMatch(problems[0], /add this row/);
});

test('a file summary is read off the coverage map', () => {
  const summary = flat('scripts/a.mjs', 90);
  const map = coverageMap(summary);
  assert.deepEqual(filesOf(map), [summary]);
});

test('the root scripts wire the gate in, and both entry points run it', () => {
  // Nothing else reads this back. Without the coverage flag the reporter
  // fails the run, but without the reporter flag the suite goes green with
  // no gate at all, and the docs promise that `pnpm test` and `pnpm all`
  // both check the floors.
  const { scripts } = JSON.parse(
    readFileSync(join(REPO, 'package.json'), 'utf8')
  );
  const words = tokenize(scripts['test:scripts'] ?? '');
  assert.ok(
    words.includes('--coverage'),
    'test:scripts no longer turns coverage on'
  );
  const reporters = words.flatMap((word, i) => {
    if (word === '--reporter') return [words[i + 1]];
    if (word.startsWith('--reporter=')) return [word.split('=')[1]];
    return [];
  });
  assert.ok(
    reporters.some(
      path =>
        resolve(REPO, path) === join(REPO, 'scripts', 'coverage-floors.mjs')
    ),
    `test:scripts no longer loads the floors reporter (it loads: ${reporters.join(', ')})`
  );
  for (const entry of ['test', 'all']) {
    assert.match(
      scripts[entry] ?? '',
      /\bpnpm (?:run )?test:scripts\b/,
      `\`${entry}\` no longer runs test:scripts`
    );
  }
});

/** A stand-in for Istanbul's coverage map, holding `summaries`. */
function coverageMap(...summaries) {
  const byPath = new Map(summaries.map(({ path, ...data }) => [path, data]));
  return {
    files: () => [...byPath.keys()],
    fileCoverageFor: path => ({
      toSummary: () => ({ data: byPath.get(path) }),
    }),
  };
}

/**
 * Drives a reporter to the end of a run, collecting its text and any
 * failure. `coverage` is what the run handed `onCoverage`, if anything.
 */
function report(floors, { coverage, reason = 'passed' }) {
  let failed = 0;
  let text = '';
  const reporter = new FloorsReporter({
    floors,
    root: ROOT,
    fail: () => failed++,
    write: chunk => (text += chunk),
  });
  if (coverage) reporter.onCoverage(coverage);
  reporter.onTestRunEnd([], [], reason);
  return { text, failed };
}

test('a green run inside its floors passes and says it checked', () => {
  const { text, failed } = report(
    { 'scripts/a.mjs': row(90, 90, 90) },
    { coverage: coverageMap(flat('scripts/a.mjs', 95)) }
  );
  assert.equal(failed, 0);
  assert.match(text, /Every measured file \(1\) is at or above its floor/);
});

test('a green run below a floor fails once and names the file', () => {
  const { text, failed } = report(
    { 'scripts/a.mjs': row(90, 90, 90) },
    {
      coverage: coverageMap(
        file('scripts/a.mjs', [95, 100], [95, 100], [60, 100])
      ),
    }
  );
  assert.equal(failed, 1);
  assert.match(text, /scripts\/a\.mjs: functions 60\.00% is below/);
});

test('a red run is not judged, whatever its coverage', () => {
  // Vitest reports no coverage for a failing run unless asked to
  // (`coverage.reportOnFailure`), and the floors hold the same line either way.
  const { text, failed } = report(
    { 'scripts/a.mjs': row(90, 90, 90) },
    { coverage: coverageMap(flat('scripts/a.mjs', 0)), reason: 'failed' }
  );
  assert.equal(failed, 0);
  assert.match(text, /Not checked: tests failed/);
});

test('a green run with no coverage at all fails', () => {
  const { text, failed } = report({}, {});
  assert.equal(failed, 1);
  assert.match(text, /--coverage/);
});

test('by default it reads the table, writes to stdout and sets the exit code', () => {
  const reporter = new FloorsReporter();
  assert.deepEqual(
    reporter.floors,
    JSON.parse(readFileSync(join(REPO, TABLE), 'utf8'))
  );
  assert.equal(reporter.root, REPO);

  const written = [];
  vi.spyOn(process.stdout, 'write').mockImplementation(text => {
    written.push(text);
    return true;
  });
  reporter.write('checked\n');
  assert.deepEqual(written, ['checked\n']);

  // The run's own code is put back before Vitest reads it.
  const before = process.exitCode;
  try {
    reporter.fail();
    assert.equal(process.exitCode, 1);
  } finally {
    process.exitCode = before;
  }
});

/**
 * Runs a real Vitest over a two-function fixture, one function called, with
 * the reporter loaded through a subclass that sets `floors`. Vitest takes a
 * reporter by path only, so the subclass is a file of the fixture, and it
 * reads its root from the run's working directory, the fixture's.
 */
function runFixture(floors, { failTest = false } = {}) {
  const dir = fixture({
    'lib.mjs': 'export const used = () => 1;\nexport const unused = () => 2;\n',
    'lib.test.mjs': [
      "import { used } from './lib.mjs';",
      "test('calls one of the two', () => {",
      '  if (used() !== 1) throw new Error("used() changed");',
      failTest ? '  throw new Error("asked to fail");' : '',
      '});',
      '',
    ].join('\n'),
    'floors.mjs':
      `import { FloorsReporter } from ${JSON.stringify(here('../coverage-floors.mjs'))};\n` +
      'export default class extends FloorsReporter {\n' +
      '  constructor() {\n' +
      `    super({ floors: ${JSON.stringify(floors)}, root: process.cwd() });\n` +
      '  }\n' +
      '}\n',
    'vitest.config.mjs': `export default ${JSON.stringify({
      test: {
        globals: true,
        include: ['lib.test.mjs'],
        coverage: {
          provider: 'custom',
          customProviderModule: here('./vitest-v8-coverage.mjs'),
          exclude: ['lib.test.mjs', 'floors.mjs', 'vitest.config.mjs'],
          reporter: [],
        },
      },
    })};\n`,
  });
  try {
    return runVitest(dir, [
      '--coverage',
      '--reporter=default',
      '--reporter=./floors.mjs',
    ]);
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
