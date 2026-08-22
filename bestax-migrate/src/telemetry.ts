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
    changedBucket: string;
    changedCount: number;
  };
  todosByRule?: Array<{ rule: string; count: number }>;
}

function changedBucket(changedCount: number): string {
  if (changedCount <= 0) return '0';
  if (changedCount <= 9) return '1-9';
  if (changedCount <= 49) return '10-49';
  if (changedCount <= 199) return '50-199';
  return '200+';
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
      changedBucket: changedBucket(stats.changedCount),
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
