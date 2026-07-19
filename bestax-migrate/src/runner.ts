/**
 * In-process transform runner shared by the CLI, the fixture tests, and the
 * kitchen-sink e2e. jscodeshift's worker-based Runner API is deliberately not
 * used: it spawns CJS child processes (fragile from an ESM package) and hides
 * per-file results, which the report needs.
 */

import jscodeshift from 'jscodeshift';
import type { API } from 'jscodeshift';
import type { TodoCollector, Transform } from './types.js';

const j = jscodeshift.withParser('tsx');

/** A jscodeshift `api` object for direct transform invocation. */
export function makeApi(): API {
  return {
    j,
    jscodeshift: j,
    stats: () => {},
    report: () => {},
  };
}

export interface RunResult {
  /** Transformed source, or null when the file needed no changes. */
  output: string | null;
}

export function runTransform(
  transform: Transform,
  path: string,
  source: string,
  collector?: TodoCollector,
  options: Record<string, unknown> = {}
): RunResult {
  const result = transform({ path, source }, makeApi(), {
    collector,
    ...options,
  });
  if (result === undefined || result === null || result === source) {
    return { output: null };
  }
  return { output: result };
}
