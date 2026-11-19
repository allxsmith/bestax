import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';

/**
 * Suites that work out the cascade by matching every rule's selector against
 * what a component renders, through jsdom's `element.matches`. jsdom builds a
 * function for each selector and runs it, and inside `vmForks`'s context both
 * take far longer, so these run in plain `forks`.
 */
const SELECTOR_SUITES = [
  'src/elements/__tests__/Loader.styles.test.tsx',
  'src/form/__tests__/File.styles.test.tsx',
];

// A suite renamed or moved would match nothing here and quietly run in
// `vmForks` again, so a path that no longer exists stops the run.
for (const suite of SELECTOR_SUITES) {
  if (!existsSync(fileURLToPath(new URL(suite, import.meta.url)))) {
    throw new Error(`SELECTOR_SUITES names ${suite}, which doesn't exist`);
  }
}

export default defineConfig({
  resolve: {
    alias: {
      // Only used inside story `play` functions, which tests never invoke.
      'storybook/test': fileURLToPath(
        new URL('./src/__mocks__/storybookTest.js', import.meta.url)
      ),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // Each file gets a fresh jsdom inside a long-lived worker, rather than a
    // fresh worker, which is what most of this suite's wall time would be
    // otherwise: the default `forks` pool took nearly twice as long. The
    // SELECTOR_SUITES are the exception.
    pool: 'vmForks',
    // Jest never timed out a synchronous test; Vitest fails one that ran past
    // its timeout once it returns. The stylesheet suites compile Sass for a
    // second at a time, and several times that on a loaded runner, and
    // TreeView's screen reader suite rebuilds an accessibility tree on every
    // key press.
    testTimeout: 30_000,
    setupFiles: ['@testing-library/jest-dom/vitest'],
    projects: [
      {
        extends: true,
        test: {
          name: 'vmForks',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: [...configDefaults.exclude, ...SELECTOR_SUITES],
        },
      },
      {
        extends: true,
        test: { name: 'forks', include: SELECTOR_SUITES, pool: 'forks' },
      },
    ],
    coverage: {
      // Istanbul instruments only the files `include` names. V8's coverage
      // slows every script a test runs, Sass's own JavaScript included, and
      // the stylesheet suites took twice as long with it.
      provider: 'istanbul',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/**/__tests__/**',
        // Type-level assertions (#641). They are checked by `tsc --noEmit`, never
        // run — and the JSX in them would otherwise instrument as uncovered lines.
        'src/**/__typetests__/**',
        'src/**/*.stories.{ts,tsx}',
        'src/index.ts',
      ],
      reporter: ['text', 'lcov'],
      thresholds: {
        branches: 99,
        functions: 99,
        lines: 99,
        statements: 99,
      },
    },
  },
});
