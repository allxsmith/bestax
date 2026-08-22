import { mkdir, readFile, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

/**
 * Anonymous opt-in telemetry (disclosure: https://bestax.io/docs/guides/telemetry).
 *
 * A near-identical copy lives in create-bestax/src/telemetry.ts — both CLIs
 * publish standalone (plain tsc, files:["dist"]), so the ~150 shared lines are
 * duplicated rather than published as a package. Keep the copies in sync.
 *
 * Privacy contract: every transmitted value is a closed-enum member, a version
 * string, or a bounded integer — never paths, project names, or free text —
 * and no identifier of any kind is generated. Undecided means off. Every
 * failure here is silent: telemetry must never affect the CLI's outcome.
 */

export type TelemetryDecision = 'on' | 'off' | 'undecided';

export type TelemetrySource = 'flag' | 'dnt' | 'env' | 'config' | 'default';

export interface ResolvedTelemetry {
  decision: TelemetryDecision;
  source: TelemetrySource;
  /** Whether a consent prompt may still be shown (nothing has decided or forbidden it). */
  promptAllowed: boolean;
}

interface TelemetryConfig {
  version: 1;
  enabled?: boolean;
  decidedAt?: string;
  decidedBy?: string;
  noticed?: Record<string, string>;
}

const DEFAULT_ENDPOINT = 'https://bestax.io/api/t';
const TIMEOUT_MS = 1500;

/** Shared across the bestax CLI family so consent is asked at most once. */
export function telemetryConfigPath(): string {
  const base = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
  return join(base, 'bestax', 'telemetry.json');
}

async function readConfig(): Promise<TelemetryConfig | null> {
  try {
    const parsed: unknown = JSON.parse(
      await readFile(telemetryConfigPath(), 'utf-8')
    );
    if (parsed !== null && typeof parsed === 'object') {
      return parsed as TelemetryConfig;
    }
  } catch {
    // Missing or corrupt config reads as "never asked".
  }
  return null;
}

function doNotTrack(): boolean {
  const dnt = process.env.DO_NOT_TRACK;
  return dnt !== undefined && dnt !== '' && dnt !== '0';
}

/**
 * Precedence: flag (persisted by the caller) → DO_NOT_TRACK → BESTAX_TELEMETRY
 * (per-run, never persisted) → config file → undecided (off).
 */
export async function resolveTelemetry(
  flag?: boolean
): Promise<ResolvedTelemetry> {
  if (flag !== undefined) {
    return {
      decision: flag ? 'on' : 'off',
      source: 'flag',
      promptAllowed: false,
    };
  }
  if (doNotTrack()) {
    return { decision: 'off', source: 'dnt', promptAllowed: false };
  }
  const env = process.env.BESTAX_TELEMETRY;
  if (env === '0' || env === '1') {
    return {
      decision: env === '1' ? 'on' : 'off',
      source: 'env',
      promptAllowed: false,
    };
  }
  const config = await readConfig();
  if (config && typeof config.enabled === 'boolean') {
    return {
      decision: config.enabled ? 'on' : 'off',
      source: 'config',
      promptAllowed: false,
    };
  }
  return { decision: 'undecided', source: 'default', promptAllowed: true };
}

export async function persistTelemetryDecision(
  enabled: boolean,
  decidedBy: string
): Promise<void> {
  try {
    const existing = await readConfig();
    const config: TelemetryConfig = {
      version: 1,
      enabled,
      decidedAt: new Date().toISOString(),
      decidedBy,
      ...(existing?.noticed ? { noticed: existing.noticed } : {}),
    };
    const filePath = telemetryConfigPath();
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  } catch {
    // An unwritable config dir must not break the CLI.
  }
}

/**
 * Records that `tool` has shown its one-time notice. Returns true when the
 * notice should be shown this run (nothing recorded it before), false when it
 * was already recorded. Never throws; a failed write still returns true — the
 * notice was shown this run and may simply repeat later, which beats crashing
 * or silently suppressing it.
 */
export async function markNoticed(tool: string): Promise<boolean> {
  try {
    const existing = await readConfig();
    if (existing?.noticed?.[tool]) return false;
    const config: TelemetryConfig = {
      version: 1,
      ...existing,
      noticed: { ...existing?.noticed, [tool]: new Date().toISOString() },
    };
    const filePath = telemetryConfigPath();
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  } catch {
    // A failed write only means the notice may show again later.
  }
  return true;
}

export async function sendTelemetry(payload: object): Promise<void> {
  try {
    await fetch(process.env.BESTAX_TELEMETRY_ENDPOINT || DEFAULT_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // Fire-and-forget: the response (or its absence) is never surfaced.
  }
}

export function getToolVersion(): string {
  try {
    const dir = dirname(fileURLToPath(import.meta.url));
    const packageJson = JSON.parse(
      readFileSync(join(dir, '..', 'package.json'), 'utf-8')
    ) as { version?: string };
    return packageJson.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

// --- bestax-migrate specific (the sibling copy has its own payload builder) ---

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

function changedBucket(changedCount: number): string {
  if (changedCount <= 0) return '0';
  if (changedCount <= 9) return '1-9';
  if (changedCount <= 49) return '10-49';
  if (changedCount <= 199) return '50-199';
  return '200+';
}

export function buildMigratePayload(stats: MigrateRunStats): object {
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

export interface ReportMigrateOptions {
  /** True only when a consent question could actually be answered (TTY in and out). */
  interactive: boolean;
  /** Owns all consent UI (notice, question, ack); null means cancelled. */
  promptConsent: () => Promise<boolean | null>;
}

export async function reportMigrateRun(
  stats: MigrateRunStats,
  flag: boolean | undefined,
  options: ReportMigrateOptions
): Promise<void> {
  const resolved = await resolveTelemetry(flag);
  let decision = resolved.decision;

  if (resolved.source === 'flag') {
    // Flags are the scripted equivalent of the prompt: decided once, remembered.
    await persistTelemetryDecision(
      decision === 'on',
      `bestax-migrate@${getToolVersion()}`
    );
  } else if (
    decision === 'undecided' &&
    resolved.promptAllowed &&
    options.interactive
  ) {
    const answer = await options.promptConsent();
    if (answer !== null) {
      await persistTelemetryDecision(
        answer,
        `bestax-migrate@${getToolVersion()}`
      );
      decision = answer ? 'on' : 'off';
    }
  }

  if (decision === 'on') {
    await sendTelemetry(buildMigratePayload(stats));
  }
}
