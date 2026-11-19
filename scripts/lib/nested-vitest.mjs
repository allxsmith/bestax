/**
 * Runs Vitest in a directory of its own, for the tests that need a real run:
 * the floors reporter's exit code and the coverage provider's counts.
 *
 * The directory is a fixture outside the repo, so it cannot import `vitest`
 * or a provider by name. Its config sets `globals: true`, so its tests need no
 * import, and names its provider and reporter by absolute path, as `here`
 * resolves them. The run starts with the outer suite's coverage off
 * (`withoutCoverage`), so the outer report holds none of this run's own
 * modules.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, realpathSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { withoutCoverage } from './without-coverage.mjs';

const require = createRequire(import.meta.url);

/** Vitest's own entry point, as the repo's install has it. */
export const VITEST = join(
  dirname(require.resolve('vitest/package.json')),
  'vitest.mjs'
);

/** An absolute path to `file` beside this module, for a fixture's config. */
export const here = file =>
  fileURLToPath(new URL(file, new URL('./', import.meta.url)));

/**
 * A new fixture directory holding `files` (name to contents). Its real path,
 * because coverage reports modules by theirs: macOS's temp directory sits
 * behind a symlink.
 */
export function fixture(files) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'nested-vitest-')));
  for (const [name, text] of Object.entries(files)) {
    writeFileSync(join(dir, name), text);
  }
  return dir;
}

/** Runs `vitest run` with `args` in `dir`, and returns its status and output. */
export function runVitest(dir, args = []) {
  const run = spawnSync(process.execPath, [VITEST, 'run', ...args], {
    cwd: dir,
    env: withoutCoverage(),
    encoding: 'utf8',
    timeout: 120_000,
  });
  return { status: run.status, output: `${run.stdout}${run.stderr}` };
}
