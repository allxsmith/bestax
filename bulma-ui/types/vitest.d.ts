/**
 * The test suite's globals: Vitest's own (`vi`, `describe`, `expect` and the
 * rest, which `vitest.config.ts` installs with `globals: true`) and the
 * jest-dom matchers its setup file adds to `expect`.
 *
 * Outside `src/` for the reason `assets.d.ts` gives: only the projects that
 * check the tests and stories read this directory, never the build's.
 */
/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
