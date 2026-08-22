import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
  afterAll,
} from '@jest/globals';
import { mkdtemp, readFile, writeFile, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const {
  telemetryConfigPath,
  resolveTelemetry,
  persistTelemetryDecision,
  markNoticed,
  sendTelemetry,
  getToolVersion,
  buildMigratePayload,
  reportMigrateRun,
} = await import('../telemetry.js');

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

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

describe('telemetryConfigPath', () => {
  it('uses XDG_CONFIG_HOME when set', () => {
    expect(telemetryConfigPath()).toBe(
      join(configHome, 'bestax', 'telemetry.json')
    );
  });

  it('falls back to ~/.config when XDG_CONFIG_HOME is unset', () => {
    delete process.env.XDG_CONFIG_HOME;
    expect(telemetryConfigPath()).toMatch(
      /[/\\]\.config[/\\]bestax[/\\]telemetry\.json$/
    );
  });
});

describe('resolveTelemetry precedence', () => {
  it('is undecided (prompt allowed) with no signals at all', async () => {
    expect(await resolveTelemetry()).toEqual({
      decision: 'undecided',
      source: 'default',
      promptAllowed: true,
    });
  });

  it.each([
    [true, 'on'],
    [false, 'off'],
  ] as const)('flag %s wins over everything', async (flag, decision) => {
    process.env.DO_NOT_TRACK = '1';
    process.env.BESTAX_TELEMETRY = flag ? '0' : '1';
    await writeConfig({ version: 1, enabled: !flag });
    expect(await resolveTelemetry(flag)).toEqual({
      decision,
      source: 'flag',
      promptAllowed: false,
    });
  });

  it('DO_NOT_TRACK beats env var and config', async () => {
    process.env.DO_NOT_TRACK = '1';
    process.env.BESTAX_TELEMETRY = '1';
    await writeConfig({ version: 1, enabled: true });
    expect(await resolveTelemetry()).toEqual({
      decision: 'off',
      source: 'dnt',
      promptAllowed: false,
    });
  });

  it.each(['0', ''])('DO_NOT_TRACK=%j is not a DNT signal', async value => {
    process.env.DO_NOT_TRACK = value;
    const resolved = await resolveTelemetry();
    expect(resolved.source).toBe('default');
  });

  it('BESTAX_TELEMETRY=1 forces on without persisting', async () => {
    process.env.BESTAX_TELEMETRY = '1';
    await writeConfig({ version: 1, enabled: false });
    expect(await resolveTelemetry()).toEqual({
      decision: 'on',
      source: 'env',
      promptAllowed: false,
    });
  });

  it('BESTAX_TELEMETRY=0 forces off', async () => {
    process.env.BESTAX_TELEMETRY = '0';
    await writeConfig({ version: 1, enabled: true });
    expect((await resolveTelemetry()).decision).toBe('off');
  });

  it('ignores junk BESTAX_TELEMETRY values', async () => {
    process.env.BESTAX_TELEMETRY = 'yes';
    expect((await resolveTelemetry()).source).toBe('default');
  });

  it.each([
    [true, 'on'],
    [false, 'off'],
  ] as const)(
    'reads enabled=%s from the config file',
    async (enabled, decision) => {
      await writeConfig({ version: 1, enabled });
      expect(await resolveTelemetry()).toEqual({
        decision,
        source: 'config',
        promptAllowed: false,
      });
    }
  );

  it('treats corrupt config as undecided', async () => {
    await writeConfig('{not json');
    expect((await resolveTelemetry()).decision).toBe('undecided');
  });

  it('treats a config without a boolean enabled as undecided', async () => {
    await writeConfig({ version: 1, enabled: 'yes' });
    expect((await resolveTelemetry()).decision).toBe('undecided');
  });

  it('treats a non-object config as undecided', async () => {
    await writeConfig('null');
    expect((await resolveTelemetry()).decision).toBe('undecided');
  });
});

describe('persistTelemetryDecision', () => {
  it('writes the config schema', async () => {
    await persistTelemetryDecision(true, 'bestax-migrate@1.0.0');
    const config = await readConfigFile();
    expect(config.version).toBe(1);
    expect(config.enabled).toBe(true);
    expect(config.decidedBy).toBe('bestax-migrate@1.0.0');
    expect(typeof config.decidedAt).toBe('string');
  });

  it('preserves the noticed map of the sibling CLI', async () => {
    await writeConfig({
      version: 1,
      noticed: { 'create-bestax': '2026-01-01T00:00:00.000Z' },
    });
    await persistTelemetryDecision(false, 'bestax-migrate@1.0.0');
    const config = await readConfigFile();
    expect(config.enabled).toBe(false);
    expect(config.noticed).toEqual({
      'create-bestax': '2026-01-01T00:00:00.000Z',
    });
  });

  it('stays silent when the config dir is unwritable', async () => {
    const blocker = join(configHome, 'blocker');
    await writeFile(blocker, 'file, not a dir', 'utf-8');
    process.env.XDG_CONFIG_HOME = blocker;
    await expect(
      persistTelemetryDecision(true, 'bestax-migrate@1.0.0')
    ).resolves.toBeUndefined();
  });
});

describe('markNoticed', () => {
  it('records the first notice and returns true', async () => {
    expect(await markNoticed('bestax-migrate')).toBe(true);
    const config = await readConfigFile();
    expect(config.version).toBe(1);
    const noticed = config.noticed as Record<string, string>;
    expect(new Date(noticed['bestax-migrate']).getTime()).not.toBeNaN();
  });

  it('returns false once the notice is recorded', async () => {
    expect(await markNoticed('bestax-migrate')).toBe(true);
    expect(await markNoticed('bestax-migrate')).toBe(false);
  });

  it('preserves every other config field and sibling notices', async () => {
    await writeConfig({
      version: 1,
      enabled: true,
      decidedAt: '2026-01-01T00:00:00.000Z',
      decidedBy: 'create-bestax@1.0.0',
      noticed: { 'create-bestax': '2026-01-01T00:00:00.000Z' },
    });
    expect(await markNoticed('bestax-migrate')).toBe(true);
    const config = await readConfigFile();
    expect(config.enabled).toBe(true);
    expect(config.decidedBy).toBe('create-bestax@1.0.0');
    const noticed = config.noticed as Record<string, string>;
    expect(noticed['create-bestax']).toBe('2026-01-01T00:00:00.000Z');
    expect(noticed['bestax-migrate']).toBeDefined();
  });

  it('returns true without throwing when the config dir is unwritable', async () => {
    // The notice is shown this run and may simply repeat later.
    const blocker = join(configHome, 'blocker');
    await writeFile(blocker, 'file, not a dir', 'utf-8');
    process.env.XDG_CONFIG_HOME = blocker;
    await expect(markNoticed('bestax-migrate')).resolves.toBe(true);
  });
});

describe('sendTelemetry', () => {
  it('POSTs JSON to the default endpoint', async () => {
    await sendTelemetry({ v: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as FetchArgs;
    expect(url).toBe('https://bestax.io/api/t');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'content-type': 'application/json' });
    expect(init.body).toBe('{"v":1}');
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('honors BESTAX_TELEMETRY_ENDPOINT', async () => {
    process.env.BESTAX_TELEMETRY_ENDPOINT = 'http://127.0.0.1:8787/api/t';
    await sendTelemetry({ v: 1 });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://127.0.0.1:8787/api/t');
  });

  it('resolves silently when fetch rejects', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await expect(sendTelemetry({ v: 1 })).resolves.toBeUndefined();
  });

  it('ignores non-2xx responses', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 400 }));
    await expect(sendTelemetry({ v: 1 })).resolves.toBeUndefined();
  });
});

describe('getToolVersion', () => {
  it('reads the package version', () => {
    expect(getToolVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });
});

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
    const payload = buildMigratePayload(baseStats) as Record<string, unknown>;

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
    expect(Object.keys(payload.props as object).sort()).toEqual([
      'changedBucket',
      'changedCount',
      'cssMode',
      'deps',
      'dry',
      'source',
    ]);
    const props = payload.props as Record<string, unknown>;
    expect(props.source).toBe('react-bulma-components');
    expect(props.cssMode).toBe('bestax');
    expect(props.dry).toBe(false);
    expect(props.deps).toBe(true);
    expect(props.changedCount).toBe(3);
    expect(props.changedBucket).toBe('1-9');
    expect(payload.todosByRule).toEqual([
      { rule: 'unsupported-file', count: 2 },
    ]);
  });

  it('omits todosByRule entirely when there are no TODOs', () => {
    const payload = buildMigratePayload({
      ...baseStats,
      todosByRule: [],
    }) as Record<string, unknown>;
    expect('todosByRule' in payload).toBe(false);
  });

  it.each([
    [0, '0'],
    [1, '1-9'],
    [9, '1-9'],
    [10, '10-49'],
    [49, '10-49'],
    [50, '50-199'],
    [199, '50-199'],
    [200, '200+'],
  ] as const)('buckets changedCount=%d as %s', (changedCount, bucket) => {
    const payload = buildMigratePayload({
      ...baseStats,
      changedCount,
    }) as { props: Record<string, unknown> };
    expect(payload.props.changedBucket).toBe(bucket);
    expect(payload.props.changedCount).toBe(changedCount);
  });

  it('caps changedCount at 10000', () => {
    const payload = buildMigratePayload({
      ...baseStats,
      changedCount: 123456,
    }) as { props: Record<string, unknown> };
    expect(payload.props.changedCount).toBe(10000);
    expect(payload.props.changedBucket).toBe('200+');
  });

  it('sends at most 20 rules and caps each count', () => {
    const todosByRule = Array.from({ length: 25 }, (_, i) => ({
      rule: `rule-${i}`,
      count: i === 0 ? 250000 : i,
    }));
    const payload = buildMigratePayload({ ...baseStats, todosByRule }) as {
      todosByRule: Array<{ rule: string; count: number }>;
    };
    expect(payload.todosByRule).toHaveLength(20);
    expect(payload.todosByRule[0]).toEqual({ rule: 'rule-0', count: 100000 });
    expect(payload.todosByRule[19]).toEqual({ rule: 'rule-19', count: 19 });
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
    expect(body.props.changedBucket).toBe('10-49');
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
