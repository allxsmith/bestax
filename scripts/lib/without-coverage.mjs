/**
 * The environment to start a child process in with coverage off.
 *
 * The root suite runs under V8 coverage that follows child processes
 * (`coverage.autoAttachSubprocess`), and Node hands it to every child: it
 * copies NODE_V8_COVERAGE into the environment of any child whose environment
 * lacks the key. So deleting the key does nothing, and it is set empty
 * instead, which leaves coverage off. A child started this way is not slowed
 * by the instrumentation, and nothing it runs counts toward the scripts/
 * coverage floors.
 */
export function withoutCoverage(env = process.env) {
  return { ...env, NODE_V8_COVERAGE: '' };
}
