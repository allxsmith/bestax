import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
  afterAll,
} from '@jest/globals';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const { getToolVersion } = await import('../telemetry-core.js');
const { buildMigratePayload, reportMigrateRun } =
  await import('../telemetry.js');

const ENV_KEYS = [
  'XDG_CONFIG_HOME',
  'DO_NOT_TRACK',
  'BESTAX_TELEMETRY',
  'BESTAX_TELEMETRY_ENDPOINT',
] as const;
const savedEnv: Record<string, string | undefined> = {};
const originalFetch = globalThis.fetch;

let configHome: string;
let fetchMock: jest.Mock;

type FetchArgs = [
  string,
  {
    method: string;
    headers: Record<string, string>;
    body: string;
    signal: AbortSignal;
  },
];

async function writeConfig(data: unknown): Promise<void> {
  await mkdir(join(configHome, 'bestax'), { recursive: true });
  await writeFile(
    join(configHome, 'bestax', 'telemetry.json'),
    typeof data === 'string' ? data : JSON.stringify(data),
    'utf-8'
  );
}

async function readConfigFile(): Promise<Record<string, unknown>> {
  return JSON.parse(
    await readFile(join(configHome, 'bestax', 'telemetry.json'), 'utf-8')
  ) as Record<string, unknown>;
}

beforeEach(async () => {
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
  configHome = await mkdtemp(join(tmpdir(), 'bestax-telemetry-'));
  process.env.XDG_CONFIG_HOME = configHome;
  fetchMock = jest.fn(async () => new Response(null, { status: 204 }));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(async () => {
  // ~80 scratch dirs per run otherwise outlive the suite in the OS tmpdir.
  await rm(configHome, { recursive: true, force: true });
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

describe('getToolVersion', () => {
  it('reads the package version', () => {
    expect(getToolVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });
});

/** Production slugs the worker must accept — keep in lockstep with telemetry-worker tests. */
const PRODUCTION_RULES = [
  'prop:className',
  'prop:renderAs',
  'prop:size',
  'unsupported-file',
  'peer-deps',
  'plain-element',
  'imports',
  'responsive',
  'deps',
] as const;

describe('buildMigratePayload', () => {
  const baseStats = {
    source: 'react-bulma-components',
    cssMode: 'bestax',
    dry: false,
    deps: true,
    changedCount: 3,
    todosByRule: [{ rule: 'unsupported-file', count: 2 }],
  };

  it('contains exactly the allowlisted fields and nothing else', () => {
    const payload = buildMigratePayload(baseStats);

    expect(Object.keys(payload).sort()).toEqual([
      'event',
      'nodeMajor',
      'platform',
      'props',
      'todosByRule',
      'tool',
      'toolVersion',
      'v',
    ]);
    expect(payload.v).toBe(1);
    expect(payload.tool).toBe('bestax-migrate');
    expect(payload.event).toBe('migrate');
    expect(payload.nodeMajor).toBe(Number(process.versions.node.split('.')[0]));
    expect(payload.platform).toBe(process.platform);
    expect(Object.keys(payload.props).sort()).toEqual([
      'changedCount',
      'cssMode',
      'deps',
      'dry',
      'source',
    ]);
    expect(payload.props.source).toBe('react-bulma-components');
    expect(payload.props.cssMode).toBe('bestax');
    expect(payload.props.dry).toBe(false);
    expect(payload.props.deps).toBe(true);
    expect(payload.props.changedCount).toBe(3);
    expect(payload.todosByRule).toEqual([
      { rule: 'unsupported-file', count: 2 },
    ]);
  });

  it('omits todosByRule entirely when there are no TODOs', () => {
    const payload = buildMigratePayload({
      ...baseStats,
      todosByRule: [],
    });
    expect('todosByRule' in payload).toBe(false);
  });

  it('passes through production rule slugs including prop:className', () => {
    const payload = buildMigratePayload({
      ...baseStats,
      todosByRule: PRODUCTION_RULES.map(rule => ({ rule, count: 1 })),
    });
    expect(payload.todosByRule?.map(entry => entry.rule)).toEqual([
      ...PRODUCTION_RULES,
    ]);
  });

  // The 0/1-9/10-49/50-199/200+ bucket is derived by the ingest worker from
  // changedCount — sending it too gave the boundaries three sources of truth.
  it('caps changedCount at 10000 and sends no bucket', () => {
    const payload = buildMigratePayload({
      ...baseStats,
      changedCount: 123456,
    });
    expect(payload.props.changedCount).toBe(10000);
    expect('changedBucket' in payload.props).toBe(false);
  });

  it('sends at most 20 rules and caps each count', () => {
    const todosByRule = Array.from({ length: 25 }, (_, i) => ({
      rule: `rule-${i}`,
      count: i === 0 ? 250000 : i,
    }));
    const payload = buildMigratePayload({ ...baseStats, todosByRule });
    expect(payload.todosByRule).toHaveLength(20);
    expect(payload.todosByRule?.[0]).toEqual({ rule: 'rule-0', count: 100000 });
    expect(payload.todosByRule?.[19]).toEqual({ rule: 'rule-19', count: 19 });
  });
});

describe('reportMigrateRun', () => {
  const stats = {
    source: 'react-bulma-components',
    cssMode: 'keep',
    dry: true,
    deps: false,
    changedCount: 12,
    todosByRule: [{ rule: 'unsupported-file', count: 1 }],
  };

  it('flag=true persists and sends without prompting', async () => {
    const promptConsent = jest.fn<() => Promise<boolean | null>>();
    await reportMigrateRun(stats, true, { interactive: true, promptConsent });
    expect(promptConsent).not.toHaveBeenCalled();
    const config = await readConfigFile();
    expect(config.enabled).toBe(true);
    expect(config.decidedBy).toMatch(/^bestax-migrate@/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchMock.mock.calls[0] as FetchArgs)[1].body) as {
      props: Record<string, unknown>;
    };
    expect(body.props.source).toBe('react-bulma-components');
    expect(body.props.changedCount).toBe(12);
  });

  it('flag=false persists off and sends nothing', async () => {
    const promptConsent = jest.fn<() => Promise<boolean | null>>();
    await reportMigrateRun(stats, false, { interactive: true, promptConsent });
    expect(promptConsent).not.toHaveBeenCalled();
    expect((await readConfigFile()).enabled).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('prompts when undecided and interactive; yes persists and sends', async () => {
    const promptConsent = jest
      .fn<() => Promise<boolean | null>>()
      .mockResolvedValue(true);
    await reportMigrateRun(stats, undefined, {
      interactive: true,
      promptConsent,
    });
    expect(promptConsent).toHaveBeenCalledTimes(1);
    expect((await readConfigFile()).enabled).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('a "no" answer persists off and sends nothing', async () => {
    const promptConsent = jest
      .fn<() => Promise<boolean | null>>()
      .mockResolvedValue(false);
    await reportMigrateRun(stats, undefined, {
      interactive: true,
      promptConsent,
    });
    expect((await readConfigFile()).enabled).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('a cancel persists nothing so the user may be asked again', async () => {
    const promptConsent = jest
      .fn<() => Promise<boolean | null>>()
      .mockResolvedValue(null);
    await reportMigrateRun(stats, undefined, {
      interactive: true,
      promptConsent,
    });
    await expect(readConfigFile()).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never prompts when not interactive', async () => {
    const promptConsent = jest.fn<() => Promise<boolean | null>>();
    await reportMigrateRun(stats, undefined, {
      interactive: false,
      promptConsent,
    });
    expect(promptConsent).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never prompts under DO_NOT_TRACK', async () => {
    process.env.DO_NOT_TRACK = '1';
    const promptConsent = jest.fn<() => Promise<boolean | null>>();
    await reportMigrateRun(stats, undefined, {
      interactive: true,
      promptConsent,
    });
    expect(promptConsent).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends without prompting when the config already says on', async () => {
    await writeConfig({ version: 1, enabled: true });
    const promptConsent = jest.fn<() => Promise<boolean | null>>();
    await reportMigrateRun(stats, undefined, {
      interactive: true,
      promptConsent,
    });
    expect(promptConsent).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
