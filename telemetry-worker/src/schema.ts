/**
 * Telemetry schema: the enum allowlists and the payload → Analytics Engine
 * data-point mapping.
 *
 * Enum sets must stay in sync with create-bestax/src/constants.ts and
 * bestax-migrate/src/sources/registry.ts — new values must land HERE FIRST or
 * they are silently dropped (fail closed).
 */

import type { AnalyticsEngineDataPoint } from './types.ts';

export const TOOLS = ['create-bestax', 'bestax-migrate'] as const;
export type Tool = (typeof TOOLS)[number];

// One run event per tool; `migrate_todo` points are derived, never sent as an
// event by the CLIs.
export const EVENT_FOR_TOOL = {
  'create-bestax': 'scaffold',
  'bestax-migrate': 'migrate',
} as const;

// create-bestax/src/constants.ts → TEMPLATES
const TEMPLATE_VALUES = ['vite', 'vite-ts'] as const;
// create-bestax/src/constants.ts → BULMA_FLAVORS
const BULMA_FLAVOR_VALUES = [
  'complete',
  'prefixed',
  'no-helpers',
  'no-helpers-prefixed',
  'no-dark-mode',
] as const;
// create-bestax/src/constants.ts → ICON_LIBRARIES
const ICON_LIBRARY_VALUES = [
  'none',
  'fontawesome',
  'mdi',
  'ionicons',
  'material-icons',
  'material-symbols',
] as const;
// bestax-migrate/src/sources/registry.ts → SOURCES
const MIGRATE_SOURCE_VALUES = ['react-bulma-components'] as const;
// bestax-migrate/src/cli.ts → CSS_MODES
const CSS_MODE_VALUES = ['bestax', 'bulma', 'keep'] as const;
const PACKAGE_MANAGER_VALUES = ['npm', 'pnpm', 'yarn', 'bun'] as const;
const PLATFORM_VALUES = [
  'aix',
  'darwin',
  'freebsd',
  'linux',
  'netbsd',
  'openbsd',
  'sunos',
  'win32',
  'android',
  'haiku',
] as const;

export type Template = (typeof TEMPLATE_VALUES)[number];
export type BulmaFlavor = (typeof BULMA_FLAVOR_VALUES)[number];
export type IconLibrary = (typeof ICON_LIBRARY_VALUES)[number];
export type MigrateSource = (typeof MIGRATE_SOURCE_VALUES)[number];
export type CssMode = (typeof CSS_MODE_VALUES)[number];
export type PackageManager = (typeof PACKAGE_MANAGER_VALUES)[number];
export type Platform = (typeof PLATFORM_VALUES)[number];

export const TEMPLATES: ReadonlySet<string> = new Set(TEMPLATE_VALUES);
export const BULMA_FLAVORS: ReadonlySet<string> = new Set(BULMA_FLAVOR_VALUES);
export const ICON_LIBRARIES: ReadonlySet<string> = new Set(ICON_LIBRARY_VALUES);
export const MIGRATE_SOURCES: ReadonlySet<string> = new Set(
  MIGRATE_SOURCE_VALUES
);
export const CSS_MODES: ReadonlySet<string> = new Set(CSS_MODE_VALUES);
export const PACKAGE_MANAGERS: ReadonlySet<string> = new Set(
  PACKAGE_MANAGER_VALUES
);
export const PLATFORMS: ReadonlySet<string> = new Set(PLATFORM_VALUES);

export const MAX_TODO_RULES = 20;
export const MAX_CHANGED_COUNT = 100000;
// A count above this is a pathological run; cap every stored double — the run
// event's changedCount and each migrate_todo count alike — so one outlier
// cannot dominate SUM(double1 * _sample_interval) aggregates.
export const CHANGED_COUNT_DOUBLE_CAP = 10000;

// changedBucket (blob9 on the migrate run event) is derived HERE, not sent on
// the wire. Single boundary definition: ascending lower bounds; each label is
// derived ('0', '1-9', '10-49', '50-199', '200+'), so the buckets cannot
// drift from the boundaries.
const CHANGED_BUCKET_BOUNDS = [0, 1, 10, 50, 200] as const;

export function changedBucket(count: number): string {
  let i = 0;
  while (
    i + 1 < CHANGED_BUCKET_BOUNDS.length &&
    count >= CHANGED_BUCKET_BOUNDS[i + 1]
  ) {
    i += 1;
  }
  const lo = CHANGED_BUCKET_BOUNDS[i];
  if (i === CHANGED_BUCKET_BOUNDS.length - 1) return `${lo}+`;
  const next = CHANGED_BUCKET_BOUNDS[i + 1];
  return next - lo === 1 ? `${lo}` : `${lo}-${next - 1}`;
}

export interface CreateBestaxPayload {
  v: 1;
  tool: 'create-bestax';
  event: 'scaffold';
  toolVersion: string;
  nodeMajor: number;
  platform: Platform;
  props: {
    template: Template;
    bulmaFlavor: BulmaFlavor;
    iconLibrary: IconLibrary;
    skills: boolean;
    packageManager: PackageManager;
  };
}

export interface MigratePayload {
  v: 1;
  tool: 'bestax-migrate';
  event: 'migrate';
  toolVersion: string;
  nodeMajor: number;
  platform: Platform;
  props: {
    source: MigrateSource;
    cssMode: CssMode;
    dry: boolean;
    deps: boolean;
    changedCount: number;
  };
  todosByRule?: { rule: string; count: number }[];
}

export type TelemetryPayload = CreateBestaxPayload | MigratePayload;

/**
 * Analytics Engine layout. blobs[i] surfaces in SQL as blob{i+1}.
 *
 * | SQL     | run event (scaffold / migrate)     | migrate_todo point |
 * | ------- | ---------------------------------- | ------------------ |
 * | index1  | tool                               | 'bestax-migrate'   |
 * | blob1   | event                              | 'migrate_todo'     |
 * | blob2   | toolVersion                        | toolVersion        |
 * | blob3   | platform                           | platform           |
 * | blob4   | nodeMajor                          | nodeMajor          |
 * | blob5   | template        / source           | source             |
 * | blob6   | bulmaFlavor     / cssMode          | rule               |
 * | blob7   | iconLibrary     / dry '1'|'0'      | —                  |
 * | blob8   | skills '1'|'0'  / deps '1'|'0'     | —                  |
 * | blob9   | packageManager  / changedBucket*   | —                  |
 * | double1 | —               / changedCount     | count              |
 *
 * *changedBucket is derived server-side from the capped changedCount — it is
 * not a wire field.
 */
export function runEventPoint(
  payload: TelemetryPayload
): AnalyticsEngineDataPoint {
  const base = [
    payload.event,
    payload.toolVersion,
    payload.platform,
    String(payload.nodeMajor),
  ];
  if (payload.tool === 'create-bestax') {
    const p = payload.props;
    return {
      indexes: [payload.tool],
      blobs: [
        ...base,
        p.template,
        p.bulmaFlavor,
        p.iconLibrary,
        p.skills ? '1' : '0',
        p.packageManager,
      ],
      doubles: [],
    };
  }
  const p = payload.props;
  const cappedCount = Math.min(p.changedCount, CHANGED_COUNT_DOUBLE_CAP);
  return {
    indexes: [payload.tool],
    blobs: [
      ...base,
      p.source,
      p.cssMode,
      p.dry ? '1' : '0',
      p.deps ? '1' : '0',
      changedBucket(cappedCount),
    ],
    doubles: [cappedCount],
  };
}

export function todoPoints(
  payload: TelemetryPayload
): AnalyticsEngineDataPoint[] {
  if (payload.tool !== 'bestax-migrate' || !payload.todosByRule) return [];
  return payload.todosByRule.slice(0, MAX_TODO_RULES).map(entry => ({
    indexes: [payload.tool],
    blobs: [
      'migrate_todo',
      payload.toolVersion,
      payload.platform,
      String(payload.nodeMajor),
      payload.props.source,
      entry.rule,
    ],
    doubles: [Math.min(entry.count, CHANGED_COUNT_DOUBLE_CAP)],
  }));
}
