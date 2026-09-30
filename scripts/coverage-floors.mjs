/**
 * Per-file coverage floors for the root `scripts/` suite (#724).
 *
 * Every jest package holds a coverage threshold in its config; the scripts
 * here had none, so a drop in what their tests reach went unnoticed. During
 * #716 it was a manual coverage run that kept locating real gaps (an exported
 * installer nothing called, a default nothing could reach), each behind a
 * green suite. `pnpm test:scripts` runs the suite with Node's coverage on,
 * prints the table through the spec reporter, and loads this module as a
 * second reporter that fails the run when:
 *
 * - a file sits below its floor on lines, branches or functions;
 * - a file the suite loaded has no row, so a new script is measured the day
 *   it lands instead of whenever someone thinks to look;
 * - a row names a file no test loaded, so deleting a test sibling cannot
 *   quietly take its script out of the gate.
 *
 * Coverage only sees files a test imports. A script that no test loads at
 * all appears in neither the report nor this check, so the missing-row rule
 * cannot point at a new script that shipped without a test.
 *
 * Per file rather than Node's own `--test-coverage-*` thresholds because
 * those judge the total. These files run from fully covered parsers to CLI
 * entry points whose `main()` calls GitHub or rewrites files in the repo, and
 * the total is dominated by the largest of them: a small script can lose most
 * of its coverage without moving it.
 *
 * A floor is where the file stood when its row was written, rounded down to a
 * whole percent, with an allowance on branches only. V8 counts a branch that
 * never ran in some runs and not in others, so a branch floor sits
 * `SLACK.branches` covered branches lower. Lines and functions are counted from the source and
 * from what ran, which do not move between runs, and an allowance there would
 * cost the most on the small files: two functions of six is a third of the
 * file. A metric at 100% keeps a floor of 100 whatever the allowance, since
 * one new function nothing calls is exactly what the gate should catch.
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
 * Node documents no way for a reporter to fail a run, so the default `fail`
 * sets `process.exitCode`. The test sibling runs a real `node --test` against
 * it for that reason: if a Node upgrade stops honoring it, that test goes red
 * rather than the gate going quiet.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const FLOORS_FILE = join(HERE, 'coverage-floors.json');

/**
 * Each floor's name, with the fields Node's coverage summary reports it in:
 * the percentage the floor is compared against, then the covered and total
 * counts a new row is worked out from.
 */
const METRICS = [
  ['lines', 'coveredLinePercent', 'coveredLineCount', 'totalLineCount'],
  [
    'branches',
    'coveredBranchPercent',
    'coveredBranchCount',
    'totalBranchCount',
  ],
  [
    'functions',
    'coveredFunctionPercent',
    'coveredFunctionCount',
    'totalFunctionCount',
  ],
];

/**
 * How many covered units below the measured count a row allows, per metric.
 * The branch noise moves a count by one; two leaves a unit to spare beyond
 * it, so no row sits a single unexplained branch from failing every open PR.
 * Rounding down to a whole percent alone does not do this: on any count under
 * a hundred it leaves less than one unit. Lines and functions do not drift,
 * so they get none.
 */
const SLACK = { lines: 0, branches: 2, functions: 0 };

const TAG = '[coverage-floors]';
const TABLE = 'scripts/coverage-floors.json';

const pct = n => `${n.toFixed(2)}%`;

/** A row's key: the file's path from the repo root, with forward slashes. */
const keyOf = (root, path) => relative(root, path).split(sep).join('/');

/**
 * The floor a metric would get from `covered` of `total` with `slack`
 * covered units allowed: 100 when fully covered (Node reports an empty metric
 * as 100% too), otherwise the percentage with `slack` fewer covered, rounded
 * down. When that comes out at 0 for a metric that covers something, the
 * floor is 1, provided `slack` more never-run units still clear it; only a
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
    METRICS.map(([name, , covered, total]) => [
      name,
      floorFor(file[covered], file[total], SLACK[name]),
    ])
  );
}

/** One row in the table's own layout, so a failure message can be pasted in. */
function formatRow(key, row) {
  const cells = METRICS.map(([name]) => `"${name}": ${row[name]}`);
  return `${JSON.stringify(key)}: { ${cells.join(', ')} }`;
}

/**
 * Every way `files` (Node's coverage summary entries) disagrees with
 * `floors` (the table, keyed by path from `root`). Empty when all is well.
 */
export function checkFloors(files, floors, root) {
  const problems = [];
  const measured = new Set();
  for (const file of files) {
    const key = keyOf(root, file.path);
    measured.add(key);
    const floor = floors[key];
    if (!floor) {
      const now = METRICS.map(([name, field]) => `${name} ${pct(file[field])}`);
      problems.push(
        `${key} has no floor. It measures ${now.join(', ')}; add this row:\n` +
          `    ${formatRow(key, measuredRow(file))}`
      );
      continue;
    }
    for (const [name, field] of METRICS) {
      if (typeof floor[name] !== 'number') {
        problems.push(`${key}: its row has no number for "${name}".`);
      } else if (file[field] < floor[name]) {
        problems.push(
          `${key}: ${name} ${pct(file[field])} is below its floor of ${floor[name]}%.`
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
 * A `node --test` reporter judging the run's coverage against `floors`.
 * `fail` is injectable so the sibling can drive it without touching the
 * exit code of the process running the tests.
 */
export function floorsReporter({
  floors,
  root,
  fail = () => {
    process.exitCode = 1;
  },
}) {
  return async function* coverageFloors(source) {
    let coverage;
    let summary;
    for await (const event of source) {
      if (event.type === 'test:coverage') coverage = event.data.summary;
      // Each file reports a summary of its own; the run's comes last.
      if (event.type === 'test:summary') summary = event.data;
    }

    if (summary && !summary.success) {
      yield `${TAG} Not checked: tests failed, and a failing test stops ` +
        'short of code it would have covered.\n';
      return;
    }
    if (!coverage) {
      fail();
      yield `${TAG} The run reported no coverage. Run it with ` +
        '--experimental-test-coverage, as `pnpm test:scripts` does.\n';
      return;
    }

    const problems = checkFloors(coverage.files, floors, root);
    if (!problems.length) {
      yield `${TAG} Every measured file (${coverage.files.length}) is at ` +
        `or above its floor in ${TABLE}.\n`;
      return;
    }
    fail();
    yield [
      `${TAG} Coverage no longer matches ${TABLE}:`,
      ...problems.map(problem => `  ${problem}`),
      `${TAG} A floor is where a file stood when its row was written, not a ` +
        'target. Cover what the table above lists as uncovered, or, where ' +
        'only a test asserting nothing could reach it, lower the row in the ' +
        'same change and say why.',
      '',
    ].join('\n');
  };
}

export default floorsReporter({
  floors: JSON.parse(readFileSync(FLOORS_FILE, 'utf8')),
  root: REPO,
});
