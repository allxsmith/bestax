import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/__tests__/**/*.test.ts', 'e2e/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/__testfixtures__/**', '**/.e2e-tmp/**'],
    // The e2e suites run tsc and Dart Sass synchronously, for several seconds
    // a test on a CI runner. Jest never timed out a synchronous test; Vitest
    // does, so the default here is the one the kitchen sinks already set.
    testTimeout: 120_000,
    pool: 'vmForks',
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/__tests__/**',
        'src/**/__testfixtures__/**',
        'src/index.ts', // bin entry — exercised via the e2e/CLI tests, not unit-covered
        // Byte-identical to create-bestax; covered there. Drift fails
        // `check:conformance --only=telemetry-core`.
        'src/telemetry-core.ts',
      ],
      reporter: ['text', 'lcov', 'clover', 'json'],
      thresholds: {
        branches: 78,
        functions: 95,
        lines: 95,
        statements: 95,
      },
    },
  },
});
