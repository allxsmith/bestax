import { mkdir, readFile, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { detectPackageManager } from './package-manager.js';

/**
 * Anonymous opt-in telemetry (disclosure: https://bestax.io/docs/guides/telemetry).
 *
 * A near-identical copy lives in bestax-migrate/src/telemetry.ts — both CLIs
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

// --- create-bestax specific (the sibling copy has its own payload builder) ---

export interface ScaffoldChoices {
  template: string;
  bulmaFlavor: string;
  iconLibrary: string;
  skills: boolean;
}

export function buildScaffoldPayload(choices: ScaffoldChoices): object {
  return {
    v: 1,
    tool: 'create-bestax',
    event: 'scaffold',
    toolVersion: getToolVersion(),
    nodeMajor: Number(process.versions.node.split('.')[0]),
    platform: process.platform,
    props: {
      template: choices.template,
      bulmaFlavor: choices.bulmaFlavor,
      iconLibrary: choices.iconLibrary,
      skills: choices.skills,
      packageManager: detectPackageManager(),
    },
  };
}

export interface ReportScaffoldOptions {
  /** True only when a consent question could actually be answered (TTY, not -y). */
  interactive: boolean;
  /** Owns all consent UI (notice, question, ack); null means cancelled. */
  promptConsent: () => Promise<boolean | null>;
}

export async function reportScaffold(
  choices: ScaffoldChoices,
  flag: boolean | undefined,
  options: ReportScaffoldOptions
): Promise<void> {
  const resolved = await resolveTelemetry(flag);
  let decision = resolved.decision;

  if (resolved.source === 'flag') {
    // Flags are the scripted equivalent of the prompt: decided once, remembered.
    await persistTelemetryDecision(
      decision === 'on',
      `create-bestax@${getToolVersion()}`
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
        `create-bestax@${getToolVersion()}`
      );
      decision = answer ? 'on' : 'off';
    }
  }

  if (decision === 'on') {
    await sendTelemetry(buildScaffoldPayload(choices));
  }
}
