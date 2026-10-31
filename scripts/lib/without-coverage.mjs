/**
 * The environment to start a child process in with node's coverage off.
 *
 * The root suite runs under node's test coverage, and node hands it to every
 * child: it copies NODE_V8_COVERAGE into the environment of any child whose
 * environment lacks the key. So deleting the key does nothing, and it is set
 * empty instead, which leaves coverage off. A child started this way is not
 * slowed by the instrumentation, and nothing it runs counts toward the
 * scripts/ coverage floors.
 *
 * Not for a nested `node --test` that runs coverage of its own: it fails with
 * the variable empty (coverage-floors.test.mjs starts one, and deletes it).
 */
export function withoutCoverage(env = process.env) {
  return { ...env, NODE_V8_COVERAGE: '' };
}
