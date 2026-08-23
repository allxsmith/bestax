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

const {
  telemetryConfigPath,
  resolveTelemetry,
  persistTelemetryDecision,
  sendTelemetry,
  getToolVersion,
} = await import('../telemetry-core.js');
const { buildScaffoldPayload, reportScaffold } =
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
  it('is undecided with no signals at all', async () => {
    expect(await resolveTelemetry()).toEqual({
      decision: 'undecided',
      source: 'default',
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
    });
  });

  it('DO_NOT_TRACK beats env var and config', async () => {
    process.env.DO_NOT_TRACK = '1';
    process.env.BESTAX_TELEMETRY = '1';
    await writeConfig({ version: 1, enabled: true });
    expect(await resolveTelemetry()).toEqual({
      decision: 'off',
      source: 'dnt',
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
  it('writes the config schema and reports success', async () => {
    await expect(
      persistTelemetryDecision(true, 'create-bestax@1.0.0')
    ).resolves.toBe(true);
    const config = await readConfigFile();
    expect(config.version).toBe(1);
    expect(config.enabled).toBe(true);
    expect(config.decidedBy).toBe('create-bestax@1.0.0');
    expect(typeof config.decidedAt).toBe('string');
  });

  it('stays silent when the config dir is unwritable, and says so', async () => {
    const blocker = join(configHome, 'blocker');
    await writeFile(blocker, 'file, not a dir', 'utf-8');
    process.env.XDG_CONFIG_HOME = blocker;
    await expect(
      persistTelemetryDecision(true, 'create-bestax@1.0.0')
    ).resolves.toBe(false);
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

describe('buildScaffoldPayload', () => {
  it('contains exactly the allowlisted fields and nothing else', () => {
    const payload = buildScaffoldPayload({
      template: 'vite-ts',
      bulmaFlavor: 'complete',
      iconLibrary: 'none',
      skills: true,
    }) as Record<string, unknown>;

    expect(Object.keys(payload).sort()).toEqual([
      'event',
      'nodeMajor',
      'platform',
      'props',
      'tool',
      'toolVersion',
      'v',
    ]);
    expect(payload.v).toBe(1);
    expect(payload.tool).toBe('create-bestax');
    expect(payload.event).toBe('scaffold');
    expect(payload.nodeMajor).toBe(Number(process.versions.node.split('.')[0]));
    expect(payload.platform).toBe(process.platform);
    expect(Object.keys(payload.props as object).sort()).toEqual([
      'bulmaFlavor',
      'iconLibrary',
      'packageManager',
      'skills',
      'template',
    ]);
    const props = payload.props as Record<string, unknown>;
    expect(props.template).toBe('vite-ts');
    expect(props.skills).toBe(true);
    expect(['npm', 'pnpm', 'yarn', 'bun']).toContain(props.packageManager);
  });
});

describe('reportScaffold', () => {
  const choices = {
    template: 'vite',
    bulmaFlavor: 'prefixed',
    iconLibrary: 'mdi',
    skills: false,
  };

  it('a flag under DO_NOT_TRACK applies to this run only, never persisted', async () => {
    // A copied command containing --telemetry must not enable telemetry
    // beyond the run it was typed for when the user has opted out globally.
    process.env.DO_NOT_TRACK = '1';
    const promptConsent = jest.fn<() => Promise<boolean | null>>();
    await reportScaffold(choices, true, { interactive: true, promptConsent });
    expect(promptConsent).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await expect(readConfigFile()).rejects.toThrow();

    fetchMock.mockClear();
    await reportScaffold(choices, false, { interactive: true, promptConsent });
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(readConfigFile()).rejects.toThrow();
  });

  it('tells onDecided whether the prompted decision was saved', async () => {
    const onDecided = jest.fn<(enabled: boolean, persisted: boolean) => void>();
    const promptYes = jest
      .fn<() => Promise<boolean | null>>()
      .mockResolvedValue(true);
    await reportScaffold(choices, undefined, {
      interactive: true,
      promptConsent: promptYes,
      onDecided,
    });
    expect(onDecided).toHaveBeenCalledWith(true, true);

    onDecided.mockClear();
    const blocker = join(configHome, 'blocker');
    await writeFile(blocker, 'file, not a dir', 'utf-8');
    process.env.XDG_CONFIG_HOME = blocker;
    const promptNo = jest
      .fn<() => Promise<boolean | null>>()
      .mockResolvedValue(false);
    await reportScaffold(choices, undefined, {
      interactive: true,
      promptConsent: promptNo,
      onDecided,
    });
    expect(onDecided).toHaveBeenCalledWith(false, false);
  });

  it('surfaces a failed flag persistence through onDecided', async () => {
    // With an opposite value already saved and the config unwritable,
    // --no-telemetry would apply to this run only and the next family run
    // would silently re-enable — the caller must get to warn about that.
    const blocker = join(configHome, 'blocker');
    await writeFile(blocker, 'file, not a dir', 'utf-8');
    process.env.XDG_CONFIG_HOME = blocker;
    const onDecided = jest.fn<(enabled: boolean, persisted: boolean) => void>();
    const promptConsent = jest.fn<() => Promise<boolean | null>>();
    await reportScaffold(choices, false, {
      interactive: false,
      promptConsent,
      onDecided,
    });
    expect(onDecided).toHaveBeenCalledWith(false, false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not call onDecided when a flag persists cleanly', async () => {
    const onDecided = jest.fn<(enabled: boolean, persisted: boolean) => void>();
    const promptConsent = jest.fn<() => Promise<boolean | null>>();
    await reportScaffold(choices, true, {
      interactive: false,
      promptConsent,
      onDecided,
    });
    expect(onDecided).not.toHaveBeenCalled();
    expect((await readConfigFile()).enabled).toBe(true);
  });

  it('does not call onDecided on a cancel', async () => {
    const onDecided = jest.fn<(enabled: boolean, persisted: boolean) => void>();
    const promptConsent = jest
      .fn<() => Promise<boolean | null>>()
      .mockResolvedValue(null);
    await reportScaffold(choices, undefined, {
      interactive: true,
      promptConsent,
      onDecided,
    });
    expect(onDecided).not.toHaveBeenCalled();
  });

  it('flag=true persists and sends without prompting', async () => {
    const promptConsent = jest.fn<() => Promise<boolean | null>>();
    await reportScaffold(choices, true, { interactive: true, promptConsent });
    expect(promptConsent).not.toHaveBeenCalled();
    expect((await readConfigFile()).enabled).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchMock.mock.calls[0] as FetchArgs)[1].body) as {
      props: Record<string, unknown>;
    };
    expect(body.props.template).toBe('vite');
  });

  it('flag=false persists off and sends nothing', async () => {
    const promptConsent = jest.fn<() => Promise<boolean | null>>();
    await reportScaffold(choices, false, { interactive: true, promptConsent });
    expect(promptConsent).not.toHaveBeenCalled();
    expect((await readConfigFile()).enabled).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('prompts when undecided and interactive; yes persists and sends', async () => {
    const promptConsent = jest
      .fn<() => Promise<boolean | null>>()
      .mockResolvedValue(true);
    await reportScaffold(choices, undefined, {
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
    await reportScaffold(choices, undefined, {
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
    await reportScaffold(choices, undefined, {
      interactive: true,
      promptConsent,
    });
    await expect(readConfigFile()).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never prompts when not interactive', async () => {
    const promptConsent = jest.fn<() => Promise<boolean | null>>();
    await reportScaffold(choices, undefined, {
      interactive: false,
      promptConsent,
    });
    expect(promptConsent).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never prompts under DO_NOT_TRACK', async () => {
    process.env.DO_NOT_TRACK = '1';
    const promptConsent = jest.fn<() => Promise<boolean | null>>();
    await reportScaffold(choices, undefined, {
      interactive: true,
      promptConsent,
    });
    expect(promptConsent).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends without prompting when the config already says on', async () => {
    await writeConfig({ version: 1, enabled: true });
    const promptConsent = jest.fn<() => Promise<boolean | null>>();
    await reportScaffold(choices, undefined, {
      interactive: true,
      promptConsent,
    });
    expect(promptConsent).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
