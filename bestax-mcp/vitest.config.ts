import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
    pool: 'vmForks',
    // Jest never timed out a synchronous test; Vitest fails one that ran past
    // its timeout once it returns. The planner sweeps take a second or two,
    // and several times that on a loaded runner.
    testTimeout: 30_000,
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/__tests__/**',
        'src/index.ts', // bin entry — a stdio bootstrap, exercised by running it
      ],
      reporter: ['text', 'lcov'],
      thresholds: {
        branches: 78,
        functions: 95,
        lines: 95,
        statements: 95,
      },
    },
  },
});
