/**
 * Per-file coverage floors for the root `scripts/` suite (#724).
 *
 * Every package's suite holds a coverage threshold in its config; the scripts
 * here had none, so a drop in what their tests reach went unnoticed. During
 * #716 it was a manual coverage run that kept locating real gaps (an exported
 * installer nothing called, a default nothing could reach), each behind a
 * green suite. `pnpm test:scripts` runs the suite with Vitest's coverage on,
 * which prints the table, and loads this module as a second reporter that
 * fails the run when:
 *
 * - a file sits below its floor on lines, branches or functions;
 * - a file the suite loaded has no row, so a new script is measured the day
 *   it lands instead of whenever someone thinks to look;
 * - a row names a file no test loaded, so deleting a test sibling cannot
 *   quietly take its script out of the gate.
 *
 * Coverage only sees files a test imports or a child process of a test runs:
 * the root config names no `include`, which would report every script with
 * none at all. A script that nothing loads appears in neither the report nor
 * this check, so the missing-row rule cannot point at a new script that
 * shipped without a test.
 *
 * Per file rather than Vitest's own `coverage.thresholds` because a single
 * threshold judges the total. These files run from fully covered parsers to
 * CLI entry points whose `main()` calls GitHub or rewrites files in the repo,
 * and the total is dominated by the largest of them: a small script can lose
 * most of its coverage without moving it. The thresholds also take a glob per
 * file, but they could not fail a row that no test loads.
 *
 * A floor is where the file stood when its row was written, rounded down to a
 * whole percent, with an allowance on branches only: a branch floor sits
 * `SLACK.branches` covered branches lower. Which branches a run covers can
 * turn on timing or on the machine (a lock two tests race for, a retry, a
 * test skipped as root), and rounding down alone leaves less than a branch of
 * margin on any count under a hundred. Lines and functions get none, as an
 * allowance there would cost the most on the small files: two functions of
 * six is a third of the file. A metric at 100% keeps a floor of 100 whatever
 * the allowance, since one new function nothing calls is exactly what the
 * gate should catch.
 *
 * No covered metric gets a floor of 0. Where the branch allowance would take
 * one there, its floor is 1, the smallest bar there is: it fails only if the
 * tests stop reaching that metric at all. So a row of 0 means the file itself
 * measured 0 (or under 1%): no bar yet, and not a number standing in for one.
 *
 * A floor is not a target, and nothing raises it for you: the gate is there
 * so a drop gets looked at. When the uncovered code is a branch that only a
 * test asserting nothing could reach, lowering the row in the same change,
 * with the reason in the PR, is the right fix. That test is not.
 *
 * Floors are judged only on a passing run. A failing test stops short of code
 * it would have covered, so a red run's numbers would pile coverage failures
 * on top of the one that matters. It also keeps a checkout without
 * `bulma-ui/dist` reading the way it always has: the suites that need the
 * build fail and say to build first, and this adds one line saying it did not
 * check.
 *
 * A reporter fails a run by setting `process.exitCode`, which Vitest leaves
 * set. The test sibling runs a real Vitest against this module for that
 * reason: if an upgrade stops honoring it, that test goes red rather than the
 * gate going quiet.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const FLOORS_FILE = join(HERE, 'coverage-floors.json');

/** The metrics a row holds, each as Istanbul's file summary names it. */
const METRICS = ['lines', 'branches', 'functions'];

/** The fields of a summary metric this module reads. */
const FIELDS = ['pct', 'covered', 'total'];

/**
 * How many covered units below the measured count a row allows, per metric.
 * See the header for why only branches get one.
 */
const SLACK = { lines: 0, branches: 2, functions: 0 };

const TAG = '[coverage-floors]';
const TABLE = 'scripts/coverage-floors.json';

const pct = n => `${n.toFixed(2)}%`;

/** A row's key: the file's path from the repo root, with forward slashes. */
const keyOf = (root, path) => relative(root, path).split(sep).join('/');

/**
 * The floor a metric would get from `covered` of `total` with `slack`
 * covered units allowed: 100 when fully covered (Istanbul reports an empty
 * metric as 100% too), otherwise the percentage with `slack` fewer covered,
 * rounded down. When that comes out at 0 for a metric that covers something,
 * the floor is 1, provided `slack` more never-run units still clear it; only a
 * coverage under 1% after that noise gets a 0.
 */
export function floorFor(covered, total, slack = 0) {
  if (covered >= total) return 100;
  const floor = Math.floor((100 * (covered - slack)) / total);
  if (floor > 0) return floor;
  return covered > 0 && 100 * covered >= total + slack ? 1 : 0;
}

/** The row a file would get from this run. */
export function measuredRow(file) {
  return Object.fromEntries(
    METRICS.map(name => [
      name,
      floorFor(file[name].covered, file[name].total, SLACK[name]),
    ])
  );
}

/** One row in the table's own layout, so a failure message can be pasted in. */
function formatRow(key, row) {
  const cells = METRICS.map(name => `"${name}": ${row[name]}`);
  return `${JSON.stringify(key)}: { ${cells.join(', ')} }`;
}

/**
 * The files of a run's coverage map (an Istanbul `CoverageMap`, which Vitest
 * hands a reporter's `onCoverage`), each as its path and its summary's
 * metrics.
 */
export function filesOf(coverageMap) {
  return coverageMap.files().map(path => ({
    path,
    ...coverageMap.fileCoverageFor(path).toSummary().data,
  }));
}

/**
 * Every way `files` (from `filesOf`) disagrees with `floors` (the table,
 * keyed by path from `root`). Empty when all is well.
 */
export function checkFloors(files, floors, root) {
  const problems = [];
  const measured = new Set();
  for (const file of files) {
    const key = keyOf(root, file.path);
    measured.add(key);
    // Every comparison below is false against a missing or NaN figure, so a
    // field Istanbul renamed would read as a pass on every file at once.
    // Anything this module reads from the summary must be a real number first.
    const unusable = METRICS.flatMap(name =>
      FIELDS.filter(field => !Number.isFinite(file[name]?.[field])).map(
        field => `${name}.${field}`
      )
    );
    if (unusable.length) {
      problems.push(
        `${key}: the run reported no usable ` +
          `${unusable.map(field => `"${field}"`).join(', ')}, so this file ` +
          "was not checked. This module reads Istanbul's file summary by " +
          'field name.'
      );
      continue;
    }
    const floor = floors[key];
    if (!floor) {
      const now = METRICS.map(name => `${name} ${pct(file[name].pct)}`);
      problems.push(
        `${key} has no floor. It measures ${now.join(', ')}; add this row:\n` +
          `    ${formatRow(key, measuredRow(file))}`
      );
      continue;
    }
    for (const name of METRICS) {
      if (typeof floor[name] !== 'number') {
        problems.push(`${key}: its row has no number for "${name}".`);
      } else if (file[name].pct < floor[name]) {
        problems.push(
          `${key}: ${name} ${pct(file[name].pct)} is below its floor of ${floor[name]}%.`
        );
      }
    }
  }
  for (const key of Object.keys(floors)) {
    if (!measured.has(key)) {
      problems.push(
        `${key} has a floor, but no test loaded it. Delete the row if the ` +
          'file is gone; otherwise a test that imported it has stopped.'
      );
    }
  }
  return problems;
}

/**
 * A Vitest reporter judging the run's coverage against `floors`. `fail` and
 * `write` are injectable so the sibling can drive it without touching the
 * exit code or the output of the process running the tests.
 */
export class FloorsReporter {
  constructor({
    floors = JSON.parse(readFileSync(FLOORS_FILE, 'utf8')),
    root = REPO,
    fail = () => {
      process.exitCode = 1;
    },
    write = text => process.stdout.write(text),
  } = {}) {
    Object.assign(this, { floors, root, fail, write });
    this.coverage = undefined;
  }

  onCoverage(coverageMap) {
    this.coverage = coverageMap;
  }

  onTestRunEnd(testModules, unhandledErrors, reason) {
    if (reason !== 'passed') {
      this.write(
        `${TAG} Not checked: tests failed, and a failing test stops ` +
          'short of code it would have covered.\n'
      );
      return;
    }
    if (!this.coverage) {
      this.fail();
      this.write(
        `${TAG} The run reported no coverage. Run it with --coverage, ` +
          'as `pnpm test:scripts` does.\n'
      );
      return;
    }

    const files = filesOf(this.coverage);
    const problems = checkFloors(files, this.floors, this.root);
    if (!problems.length) {
      this.write(
        `${TAG} Every measured file (${files.length}) is at or above its ` +
          `floor in ${TABLE}.\n`
      );
      return;
    }
    this.fail();
    this.write(
      [
        `${TAG} Coverage no longer matches ${TABLE}:`,
        ...problems.map(problem => `  ${problem}`),
        `${TAG} A floor is where a file stood when its row was written, not a ` +
          'target. Cover what the table above lists as uncovered, or, where ' +
          'only a test asserting nothing could reach it, lower the row in the ' +
          'same change and say why.',
        '',
      ].join('\n')
    );
  }
}

export default FloorsReporter;
