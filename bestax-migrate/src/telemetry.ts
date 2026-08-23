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
    .slice(0, 20)
    .map(({ rule, count }) => ({ rule, count: Math.min(count, 100000) }));
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
      changedCount: Math.min(stats.changedCount, 10000),
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
