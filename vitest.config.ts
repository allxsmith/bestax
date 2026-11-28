import { defineConfig } from 'vitest/config';

// The root `scripts/` suite. Each package's suite has a config of its own in
// its directory; this one reads `scripts/` only.
export default defineConfig({
  test: {
    include: ['scripts/*.test.mjs'],
    // A test here runs a build, tsc or a workflow step under bash, for as long
    // as that takes on the runner. node:test, which the suite was written for,
    // had no timeout either.
    testTimeout: 0,
    hookTimeout: 0,
    // A spy lasts for its test, as node:test's `t.mock` did.
    restoreMocks: true,
    coverage: {
      // Turned on by `pnpm test:scripts`, which also loads the floors reporter
      // (scripts/coverage-floors.mjs) that judges it. V8 rather than Istanbul,
      // because many tests run a script in a child process the way CI does,
      // and only V8 follows one. Since @vitest/coverage-v8 5.1.1 the stock
      // provider keeps a child's counts apart from a worker's
      // (vitest-dev/vitest#11812), so it needs no wrapper.
      provider: 'v8',
      autoAttachSubprocess: true,
      // No `include`, so a file is in the report only if a test or its child
      // loaded it, which is what the floors' missing-row rules read. This
      // keeps out what the tests load from the packages.
      exclude: ['**/*.test.mjs', '!(scripts)/**'],
      reporter: ['text'],
    },
  },
});
