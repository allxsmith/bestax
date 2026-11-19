// Stub for `storybook/test` (see the alias in vitest.config.ts). Its exports
// are only used inside story `play` functions, which tests never invoke, so
// each is a no-op. A story a test imports that names a new export fails to
// load until it is added here.
const noop = () => {};

export const expect = noop;
export const fn = noop;
export const userEvent = noop;
export const waitFor = noop;
export const within = noop;
