import { getToolVersion, reportRun } from './telemetry-core.js';
import type { ReportRunOptions } from './telemetry-core.js';

/**
 * bestax-migrate payload + reporter. The kernel lives in telemetry-core.ts
 * (copied from create-bestax; `check:conformance --only=telemetry-core`).
 *
 * Envelope and props are closed enums, versions, or bounded integers.
 * `todosByRule` slugs are migrate's own rule names (including `prop:<jsxProp>`),
 * never file paths, messages, or code.
 */

/**
 * Client half of the wire-contract caps. The worker's schema.ts / validate.ts
 * (telemetry-worker) hold the other half; scripts/telemetry-contract.test.mjs
 * pins each pair equal (TODO_RULES_CAP === MAX_TODO_RULES, TODO_COUNT_CAP ===
 * MAX_CHANGED_COUNT, CHANGED_COUNT_CAP === CHANGED_COUNT_DOUBLE_CAP).
 */
export const TODO_RULES_CAP = 20;
export const TODO_COUNT_CAP = 100000;
export const CHANGED_COUNT_CAP = 10000;

export interface MigrateRunStats {
  /** Registry source name, e.g. 'react-bulma-components'. */
  source: string;
  /** 'bestax' | 'bulma' | 'keep'. */
  cssMode: string;
  dry: boolean;
  deps: boolean;
  changedCount: number;
  todosByRule: Array<{ rule: string; count: number }>;
}

export interface MigratePayload {
  v: 1;
  tool: 'bestax-migrate';
  event: 'migrate';
  toolVersion: string;
  nodeMajor: number;
  platform: string;
  props: {
    source: string;
    cssMode: string;
    dry: boolean;
    deps: boolean;
    // The 0/1-9/10-49/50-199/200+ bucket is derived by the ingest worker from
    // this count — sending it too gave the boundaries three sources of truth.
    changedCount: number;
  };
  todosByRule?: Array<{ rule: string; count: number }>;
}

export function buildMigratePayload(stats: MigrateRunStats): MigratePayload {
  const todosByRule = stats.todosByRule
    .slice(0, TODO_RULES_CAP)
    .map(({ rule, count }) => ({
      rule,
      count: Math.min(count, TODO_COUNT_CAP),
    }));
  return {
    v: 1,
    tool: 'bestax-migrate',
    event: 'migrate',
    toolVersion: getToolVersion(),
    nodeMajor: Number(process.versions.node.split('.')[0]),
    platform: process.platform,
    props: {
      source: stats.source,
      cssMode: stats.cssMode,
      dry: stats.dry,
      deps: stats.deps,
      changedCount: Math.min(stats.changedCount, CHANGED_COUNT_CAP),
    },
    ...(todosByRule.length > 0 ? { todosByRule } : {}),
  };
}

export async function reportMigrateRun(
  stats: MigrateRunStats,
  flag: boolean | undefined,
  options: ReportRunOptions
): Promise<void> {
  await reportRun(flag, 'bestax-migrate', options, buildMigratePayload(stats));
}
