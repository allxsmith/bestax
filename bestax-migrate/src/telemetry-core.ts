import { mkdir, readFile, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

/**
 * Shared CLI telemetry kernel (disclosure: https://bestax.io/docs/guides/telemetry).
 *
 * Copied byte-for-byte into create-bestax and bestax-migrate — both publish
 * standalone, so this cannot be a workspace package. `check:conformance
 * --only=telemetry-core` fails if the copies diverge. Edit this file in
 * create-bestax and copy it over the migrate one.
 *
 * No identifier of any kind is generated. Undecided means off. Every failure
 * here is silent: telemetry must never affect the CLI's outcome.
 */

export type TelemetryDecision = 'on' | 'off' | 'undecided';

export type TelemetrySource = 'flag' | 'dnt' | 'env' | 'config' | 'default';

export interface ResolvedTelemetry {
  decision: TelemetryDecision;
  source: TelemetrySource;
}

interface TelemetryConfig {
  version: 1;
  enabled?: boolean;
  decidedAt?: string;
  decidedBy?: string;
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
    };
  }
  if (doNotTrack()) {
    return { decision: 'off', source: 'dnt' };
  }
  const env = process.env.BESTAX_TELEMETRY;
  if (env === '0' || env === '1') {
    return {
      decision: env === '1' ? 'on' : 'off',
      source: 'env',
    };
  }
  const config = await readConfig();
  if (config && typeof config.enabled === 'boolean') {
    return {
      decision: config.enabled ? 'on' : 'off',
      source: 'config',
    };
  }
  return { decision: 'undecided', source: 'default' };
}

export async function persistTelemetryDecision(
  enabled: boolean,
  decidedBy: string
): Promise<void> {
  try {
    const config: TelemetryConfig = {
      version: 1,
      enabled,
      decidedAt: new Date().toISOString(),
      decidedBy,
    };
    const filePath = telemetryConfigPath();
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  } catch {
    // An unwritable config dir must not break the CLI.
  }
}

export async function sendTelemetry(payload: unknown): Promise<void> {
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

export interface ReportRunOptions {
  /** True only when a consent question could actually be answered. */
  interactive: boolean;
  /** Owns all consent UI (notice, question, ack); null means cancelled. */
  promptConsent: () => Promise<boolean | null>;
}

export async function reportRun(
  flag: boolean | undefined,
  toolName: string,
  options: ReportRunOptions,
  payload: unknown
): Promise<void> {
  const resolved = await resolveTelemetry(flag);
  let decision = resolved.decision;

  if (resolved.source === 'flag') {
    // Flags are the scripted equivalent of the prompt: decided once, remembered.
    await persistTelemetryDecision(
      decision === 'on',
      `${toolName}@${getToolVersion()}`
    );
  } else if (decision === 'undecided' && options.interactive) {
    const answer = await options.promptConsent();
    if (answer !== null) {
      await persistTelemetryDecision(answer, `${toolName}@${getToolVersion()}`);
      decision = answer ? 'on' : 'off';
    }
  }

  if (decision === 'on') {
    await sendTelemetry(payload);
  }
}
