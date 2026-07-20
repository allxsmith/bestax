/**
 * In-process transform runner shared by the CLI, the fixture tests, and the
 * kitchen-sink e2e. jscodeshift's worker-based Runner API is deliberately not
 * used: it spawns CJS child processes (fragile from an ESM package) and hides
 * per-file results, which the report needs.
 */

import { parse, type ParserOptions } from '@babel/parser';
import jscodeshift from 'jscodeshift';
import type { API } from 'jscodeshift';
import type { TodoCollector, Transform } from './types.js';

/**
 * jscodeshift's stock `tsx` parser options plus `deprecatedImportAssert`,
 * so files using the legacy `import x from 'y' assert { type: 'json' }`
 * syntax (still emitted by many tools) parse instead of crashing the run.
 */
const PARSER_OPTIONS: ParserOptions = {
  sourceType: 'module',
  allowImportExportEverywhere: true,
  allowReturnOutsideFunction: true,
  startLine: 1,
  tokens: true,
  plugins: [
    'jsx',
    'asyncGenerators',
    'decoratorAutoAccessors',
    'bigInt',
    'classPrivateMethods',
    'classPrivateProperties',
    'classProperties',
    'decorators-legacy',
    'doExpressions',
    'dynamicImport',
    'exportDefaultFrom',
    'exportNamespaceFrom',
    'functionBind',
    'functionSent',
    'importAttributes',
    'deprecatedImportAssert',
    'importMeta',
    'nullishCoalescingOperator',
    'numericSeparator',
    'objectRestSpread',
    'optionalCatchBinding',
    'optionalChaining',
    ['pipelineOperator', { proposal: 'minimal' }],
    'throwExpressions',
    'typescript',
  ],
};

const j = jscodeshift.withParser({
  parse: (code: string) => parse(code, PARSER_OPTIONS),
});

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
