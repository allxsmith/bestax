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
        // Generated from the library's own TSDoc by scripts/gen-eslint-meta.mjs.
        // Its correctness is gated by gen:eslint-meta:check, not by tests here.
        'src/generated/**',
      ],
      reporter: ['text', 'lcov'],
      thresholds: { branches: 78, functions: 95, lines: 95, statements: 95 },
    },
  },
});
