/**
 * Holds the `turbo-tasks` rule's parser in scripts/check-conformance.mjs to
 * turbo's actual CLI shape (#663).
 *
 * The rule exists because `turbo run <task>` exits 0 printing "0 total" when no
 * package implements the task, so a renamed script leaves `pnpm all`, the CI
 * step and the root script green having checked nothing. A parser that misses a
 * task reintroduces exactly that, one level down — and this one shipped two
 * such holes, both found by review rather than by a test, which is what
 * `.github/CLAUDE.md` asks a sibling like this to prevent.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { turboTasksIn } from './check-conformance.mjs';

const tasksOf = (scripts, entry = 'all') =>
  [...turboTasksIn(scripts, entry).keys()].sort();

/** The packages a task is filtered to, or null when some run was unfiltered. */
const scopeOf = (scripts, task, entry = 'all') => {
  const scope = turboTasksIn(scripts, entry).get(task);
  return scope === null || scope === undefined ? scope : [...scope].sort();
};

test('reads the tasks of a plain segment', () => {
  assert.deepEqual(tasksOf({ all: 'turbo run build test lint' }), [
    'build',
    'lint',
    'test',
  ]);
});

test('stops a segment at a shell operator', () => {
  assert.deepEqual(
    tasksOf({ all: 'turbo run build && node --test "scripts/*.test.mjs"' }),
    ['build']
  );
});

test('keeps the task after an `=` flag', () => {
  // The first hole: stopping at the first flag dropped `build-storybook`.
  assert.deepEqual(
    tasksOf({ all: 'turbo run --filter=@scope/pkg build-storybook' }),
    ['build-storybook']
  );
});

test('keeps the task after a BOOLEAN flag', () => {
  // The second hole: assuming every flag without `=` takes a value ate the
  // task following `--force`, `--continue` and friends.
  for (const flag of ['--force', '--continue', '--parallel', '--no-cache']) {
    assert.deepEqual(
      tasksOf({ all: `turbo run ${flag} build` }),
      ['build'],
      `${flag} swallowed the task after it`
    );
  }
});

test('skips the value of a space-separated value flag', () => {
  assert.deepEqual(tasksOf({ all: 'turbo run --filter pkg-name build' }), [
    'build',
  ]);
});

test('an unknown value flag errs loudly rather than silently', () => {
  // Not a supported shape — the point is the DIRECTION of the mistake. An
  // unrecognised flag leaves the next token alone, so its value is demanded as
  // a task and the check fails visibly, instead of a real task vanishing.
  assert.deepEqual(tasksOf({ all: 'turbo run --mystery value build' }), [
    'build',
    'value',
  ]);
});

test('stops at the `--` passthrough marker', () => {
  assert.deepEqual(tasksOf({ all: 'turbo run build -- --flag notATask' }), [
    'build',
  ]);
});

test('follows one level of `pnpm run` indirection', () => {
  // `all` reaches `lint` this way, and `lint` runs turbo.
  assert.deepEqual(
    tasksOf({
      all: 'turbo run build && pnpm run lint',
      lint: 'turbo run lint && eslint scripts',
    }),
    ['build', 'lint']
  );
});

test('follows `pnpm <script>` without the `run` keyword', () => {
  assert.deepEqual(tasksOf({ all: 'pnpm gate', gate: 'turbo run typecheck' }), [
    'typecheck',
  ]);
});

test('does not recurse past one level', () => {
  assert.deepEqual(
    tasksOf({
      all: 'pnpm run a',
      a: 'pnpm run b',
      b: 'turbo run deep',
    }),
    []
  );
});

test('a script naming itself does not loop', () => {
  assert.deepEqual(tasksOf({ all: 'pnpm run all && turbo run build' }), [
    'build',
  ]);
});

test('an entry that runs no turbo yields nothing', () => {
  assert.deepEqual(tasksOf({ all: 'eslint .' }), []);
});

test('records the package a `--filter` narrows a task to', () => {
  // Ignoring the filter let any package's script satisfy the check — so a
  // renamed `build-storybook` in bulma-ui passed on the strength of an
  // unrelated one elsewhere, which is the fail-open this rule exists to close.
  assert.deepEqual(
    scopeOf(
      { all: 'turbo run --filter=@scope/ui build-storybook' },
      'build-storybook'
    ),
    ['@scope/ui']
  );
});

test('reads a space-separated filter value too', () => {
  assert.deepEqual(
    scopeOf({ all: 'turbo run --filter @scope/ui docs' }, 'docs'),
    ['@scope/ui']
  );
});

test('an unfiltered run of the same task wins over a filtered one', () => {
  // The unfiltered run only needs somebody to own the task; a later filtered
  // run must not narrow a demand the unfiltered one already made.
  assert.equal(
    scopeOf(
      { all: 'turbo run build && turbo run --filter=@scope/ui build' },
      'build'
    ),
    null
  );
  assert.equal(
    scopeOf(
      { all: 'turbo run --filter=@scope/ui build && turbo run build' },
      'build'
    ),
    null
  );
});

test('unions the packages of two filtered runs', () => {
  assert.deepEqual(
    scopeOf(
      { all: 'turbo run --filter=a lint && turbo run --filter=b lint' },
      'lint'
    ),
    ['a', 'b']
  );
});

test('a task with no filter anywhere has a null scope', () => {
  assert.equal(scopeOf({ all: 'turbo run test' }, 'test'), null);
});
