import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['scripts/*.test.mjs'],
    // The sandbox tests build projects from the real templates, for as long
    // as that takes on the runner. node:test, which they were written for, had
    // no timeout either.
    testTimeout: 0,
  },
});
