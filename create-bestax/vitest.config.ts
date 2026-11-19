import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
    pool: 'vmForks',
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/__tests__/**',
        'src/index.ts', // Exclude the main entry point
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
