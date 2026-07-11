// Jest stub for the ESM-only `storybook/test` package — its exports are only
// used inside story `play` functions, which tests never invoke.
module.exports = new Proxy({}, { get: () => () => {} });
