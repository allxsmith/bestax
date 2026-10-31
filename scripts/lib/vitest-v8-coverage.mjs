/**
 * Vitest's V8 coverage provider, for the root `scripts/` suite, with one fix:
 * a script a test's child process ran stays apart from the same script run in
 * a test worker until both are converted.
 *
 * Many tests here run a script the way CI does, `node scripts/<name>.mjs`, so
 * its `main()` only ever runs in a child process, and the coverage floors
 * (`scripts/coverage-floors.mjs`) count what those children run.
 * `coverage.autoAttachSubprocess` collects it, but the provider merges each
 * script's raw V8 counts across the run by URL before converting them. A test
 * worker runs a script as Vite transformed it and a child process runs the
 * file as written, so the two sets of byte offsets describe different text,
 * and their merge was converted against the file as written: every file that
 * one test imported and another spawned lost most of its coverage.
 *
 * This marks each count a child process took with a query on its URL, so the
 * provider merges and converts the two kinds separately, and the coverage map
 * merges what comes out by source location. The query reaches no file path,
 * as `fileURLToPath` drops it. A child's count is one whose
 * `isExtendedContext` is set, which is how the provider itself tells them
 * apart.
 *
 * `coverage-floors.test.mjs` runs a fixture where one test imports a module
 * and another spawns it, and wants both halves counted. When a Vitest upgrade
 * fixes the merge, or renames what this reads, that test says so.
 */
import v8 from '@vitest/coverage-v8';
import { V8CoverageProvider } from '@vitest/coverage-v8/dist/provider.js';

/** The query that keeps a child process's counts apart. */
export const SUBPROCESS_QUERY = '?subprocess';

class SubprocessAwareProvider extends V8CoverageProvider {
  readCoverageFiles({ onFileRead, ...rest }) {
    return super.readCoverageFiles({
      ...rest,
      onFileRead(coverage) {
        for (const script of coverage.result) {
          if (script.isExtendedContext) script.url += SUBPROCESS_QUERY;
        }
        onFileRead(coverage);
      },
    });
  }
}

export default {
  ...v8,
  getProvider: () => new SubprocessAwareProvider(),
};
