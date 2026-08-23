import { jest } from '@jest/globals';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import {
  collectFiles,
  createCLI,
  findPackageJsons,
  handleTelemetry,
  promptTelemetryConsent,
} from '../cli.js';
import type { MigrateRunStats } from '../telemetry.js';

let tempDirs: string[] = [];

// Every successful CLI run now ends in the telemetry handler, so the suite
// must never touch the real ~/.config/bestax, the network, or a TTY prompt:
// XDG_CONFIG_HOME points at a scratch dir, fetch is stubbed, and both stdio
// TTY flags are pinned false (individual tests re-stub them as needed).
const ENV_KEYS = [
  'XDG_CONFIG_HOME',
  'DO_NOT_TRACK',
  'BESTAX_TELEMETRY',
  'BESTAX_TELEMETRY_ENDPOINT',
] as const;
const savedEnv: Record<string, string | undefined> = {};
const originalFetch = globalThis.fetch;
const originalStdoutTTY = Object.getOwnPropertyDescriptor(
  process.stdout,
  'isTTY'
);
const originalStdinTTY = Object.getOwnPropertyDescriptor(
  process.stdin,
  'isTTY'
);

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

function setTTY(stream: object, value: boolean): void {
  Object.defineProperty(stream, 'isTTY', {
    value,
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
  const configHome = fs.mkdtempSync(path.join(os.tmpdir(), 'bestax-cli-cfg-'));
  tempDirs.push(configHome);
  process.env.XDG_CONFIG_HOME = configHome;
  fetchMock = jest.fn(async () => new Response(null, { status: 204 }));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  setTTY(process.stdout, false);
  setTTY(process.stdin, false);
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
  if (originalStdoutTTY) {
    Object.defineProperty(process.stdout, 'isTTY', originalStdoutTTY);
  } else {
    delete (process.stdout as { isTTY?: boolean }).isTTY;
  }
  if (originalStdinTTY) {
    Object.defineProperty(process.stdin, 'isTTY', originalStdinTTY);
  } else {
    delete (process.stdin as { isTTY?: boolean }).isTTY;
  }
  for (const dir of tempDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  tempDirs = [];
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

function makeTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bestax-migrate-test-'));
  tempDirs.push(dir);
  fs.mkdirSync(path.join(dir, 'src', 'node_modules'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'src', 'App.tsx'),
    [
      "import { Button } from 'react-bulma-components';",
      'export const App = () => <Button color="primary" loading>Go</Button>;',
      '',
    ].join('\n')
  );
  fs.writeFileSync(
    path.join(dir, 'src', 'untouched.ts'),
    'export const n = 1;\n'
  );
  fs.writeFileSync(
    path.join(dir, 'src', 'ignored.css'),
    '.a { color: red; }\n'
  );
  fs.writeFileSync(
    path.join(dir, 'src', 'node_modules', 'skipped.tsx'),
    "import { Button } from 'react-bulma-components';\n"
  );
  fs.writeFileSync(
    path.join(dir, 'src', 'theme.scss'),
    "$primary: #ff6b35;\n@import 'bulma/bulma';\n"
  );
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    `${JSON.stringify(
      {
        name: 'sample-app',
        dependencies: { 'react-bulma-components': '^4.1.0', bulma: '^0.9.4' },
        devDependencies: { 'node-sass': '^7.0.0' },
      },
      null,
      2
    )}\n`
  );
  return dir;
}

async function runCli(
  args: string[]
): Promise<{ logs: string[]; errors: string[] }> {
  const logs: string[] = [];
  const errors: string[] = [];
  const program = createCLI({
    log: m => logs.push(m),
    error: m => errors.push(m),
  });
  program.exitOverride();
  await program.parseAsync(['node', 'bestax-migrate', ...args]);
  return { logs, errors };
}

describe('collectFiles', () => {
  it('walks directories, filters extensions, and skips node_modules', () => {
    const dir = makeTempProject();
    const files = collectFiles(
      [path.join(dir, 'src')],
      ['js', 'jsx', 'ts', 'tsx']
    );
    expect(files.map(f => path.basename(f)).sort()).toEqual([
      'App.tsx',
      'untouched.ts',
    ]);
  });

  it('throws for missing paths', () => {
    expect(() => collectFiles(['/definitely/not/here'], ['ts'])).toThrow(
      /no such file or directory/
    );
  });
});

describe('findPackageJsons', () => {
  it('finds the nearest manifest walking up from each target', () => {
    const dir = makeTempProject();
    expect(findPackageJsons([path.join(dir, 'src')])).toEqual([
      path.join(dir, 'package.json'),
    ]);
  });
});

describe('CLI', () => {
  it('transforms files in place and reports', async () => {
    const dir = makeTempProject();
    const { logs } = await runCli([
      'react-bulma-components',
      path.join(dir, 'src'),
    ]);
    const transformed = fs.readFileSync(
      path.join(dir, 'src', 'App.tsx'),
      'utf8'
    );
    expect(transformed).toContain('from "@allxsmith/bestax-bulma"');
    expect(transformed).toContain('isLoading');
    // App.tsx + theme.scss + package.json all change
    expect(logs.join('\n')).toContain('3 transformed');
  });

  it('leaves files untouched with --dry and prints with --print', async () => {
    const dir = makeTempProject();
    const before = fs.readFileSync(path.join(dir, 'src', 'App.tsx'), 'utf8');
    const { logs } = await runCli([
      'react-bulma-components',
      path.join(dir, 'src'),
      '--dry',
      '--print',
    ]);
    expect(fs.readFileSync(path.join(dir, 'src', 'App.tsx'), 'utf8')).toBe(
      before
    );
    expect(logs.join('\n')).toContain('@allxsmith/bestax-bulma');
    expect(logs.join('\n')).toContain('(dry run)');
  });

  it('reports files that fail to parse and continues', async () => {
    const dir = makeTempProject();
    fs.writeFileSync(path.join(dir, 'src', 'broken.tsx'), 'const = <<>;\n');
    const { logs, errors } = await runCli([
      'react-bulma-components',
      path.join(dir, 'src'),
    ]);
    expect(errors.join('\n')).toContain('broken.tsx');
    expect(logs.join('\n')).toContain('3 transformed');
  });

  it('migrates SCSS files and updates package.json dependencies', async () => {
    const dir = makeTempProject();
    await runCli(['react-bulma-components', path.join(dir, 'src')]);
    const scss = fs.readFileSync(path.join(dir, 'src', 'theme.scss'), 'utf8');
    expect(scss).toContain("@use 'bulma/sass' with (");
    expect(scss).toContain('$primary: #ff6b35');
    expect(scss).toContain("@use '@allxsmith/bestax-bulma/scss/extras';");
    const pkg = JSON.parse(
      fs.readFileSync(path.join(dir, 'package.json'), 'utf8')
    );
    expect(pkg.dependencies['react-bulma-components']).toBeUndefined();
    expect(pkg.dependencies['@allxsmith/bestax-bulma']).toBe('^5');
    expect(pkg.dependencies.bulma).toBe('^1.0.4');
    expect(pkg.devDependencies['node-sass']).toBeUndefined();
    expect(pkg.devDependencies.sass).toBe('^1.79.0');
  });

  it('honors --no-deps and --dry for the package.json step', async () => {
    const dir = makeTempProject();
    const before = fs.readFileSync(path.join(dir, 'package.json'), 'utf8');
    await runCli([
      'react-bulma-components',
      path.join(dir, 'src'),
      '--no-deps',
    ]);
    expect(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).toBe(
      before
    );
    await runCli(['react-bulma-components', path.join(dir, 'src'), '--dry']);
    expect(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).toBe(
      before
    );
  });

  it('says "Would update" for the manifest in dry mode', async () => {
    const dir = makeTempProject();
    const dry = await runCli([
      'react-bulma-components',
      path.join(dir, 'src'),
      '--dry',
    ]);
    expect(dry.logs.join('\n')).toContain('Would update');
    expect(dry.logs.join('\n')).not.toContain('Updated ');
    const wet = await runCli(['react-bulma-components', path.join(dir, 'src')]);
    expect(wet.logs.join('\n')).toContain('Updated ');
  });

  it('preserves the manifest indentation style', async () => {
    const dir = makeTempProject();
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      '{\n\t"name": "tabbed-app",\n\t"dependencies": {\n\t\t"react-bulma-components": "^4.1.0"\n\t}\n}\n'
    );
    await runCli(['react-bulma-components', path.join(dir, 'src')]);
    const raw = fs.readFileSync(path.join(dir, 'package.json'), 'utf8');
    expect(raw).toContain('\t"dependencies"');
    expect(raw).toContain('\t\t"@allxsmith/bestax-bulma"');
  });

  it('flags unparseable component formats that import the source library', async () => {
    const dir = makeTempProject();
    fs.writeFileSync(
      path.join(dir, 'src', 'Card.astro'),
      '---\nimport { Card } from "react-bulma-components";\n---\n<Card />\n'
    );
    fs.writeFileSync(
      path.join(dir, 'src', 'plain.astro'),
      '---\nconst x = 1;\n---\n<p>{x}</p>\n'
    );
    const { logs } = await runCli([
      'react-bulma-components',
      path.join(dir, 'src'),
    ]);
    const text = logs.join('\n');
    expect(text).toContain('unsupported-file');
    expect(text).toContain('Card.astro');
    expect(text).not.toContain('plain.astro');
  });

  it('threads --css keep through to the transforms', async () => {
    const dir = makeTempProject();
    fs.writeFileSync(
      path.join(dir, 'src', 'style-entry.ts'),
      "import 'bulma/css/bulma.min.css';\n"
    );
    await runCli([
      'react-bulma-components',
      path.join(dir, 'src'),
      '--css',
      'keep',
    ]);
    expect(
      fs.readFileSync(path.join(dir, 'src', 'style-entry.ts'), 'utf8')
    ).toBe("import 'bulma/css/bulma.min.css';\n");
  });

  it('rejects unknown --css modes', async () => {
    const dir = makeTempProject();
    await expect(
      runCli(['react-bulma-components', path.join(dir, 'src'), '--css', 'nope'])
    ).rejects.toThrow();
  });

  it('rejects unknown sources', async () => {
    const dir = makeTempProject();
    await expect(
      runCli(['not-a-library', path.join(dir, 'src')])
    ).rejects.toThrow();
  });

  it('rejects missing paths', async () => {
    await expect(
      runCli(['react-bulma-components', '/definitely/not/here'])
    ).rejects.toThrow();
  });
});

describe('CLI telemetry', () => {
  it('registers the --telemetry/--no-telemetry option pair', () => {
    const flags = createCLI().options.map(option => option.flags);
    expect(flags).toContain('--telemetry');
    expect(flags).toContain('--no-telemetry');
  });

  it('--no-telemetry persists off and never calls fetch', async () => {
    const dir = makeTempProject();
    await runCli([
      'react-bulma-components',
      path.join(dir, 'src'),
      '--no-telemetry',
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
    const config = JSON.parse(
      fs.readFileSync(
        path.join(
          process.env.XDG_CONFIG_HOME as string,
          'bestax',
          'telemetry.json'
        ),
        'utf8'
      )
    );
    expect(config.enabled).toBe(false);
    expect(config.decidedBy).toMatch(/^bestax-migrate@/);
  });

  it('--telemetry persists on and sends the run payload', async () => {
    const dir = makeTempProject();
    await runCli([
      'react-bulma-components',
      path.join(dir, 'src'),
      '--telemetry',
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchMock.mock.calls[0] as FetchArgs)[1].body) as {
      tool: string;
      props: Record<string, unknown>;
      todosByRule?: Array<Record<string, unknown>>;
    };
    expect(body.tool).toBe('bestax-migrate');
    expect(body.props.source).toBe('react-bulma-components');
    // Never file paths, lines, or messages — only rule names and counts.
    expect(JSON.stringify(body)).not.toContain(dir);
    for (const entry of body.todosByRule ?? []) {
      expect(Object.keys(entry).sort()).toEqual(['count', 'rule']);
    }
  });

  it('an undecided non-TTY run neither prompts, sends, nor persists', async () => {
    const dir = makeTempProject();
    await runCli(['react-bulma-components', path.join(dir, 'src')]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      fs.existsSync(
        path.join(
          process.env.XDG_CONFIG_HOME as string,
          'bestax',
          'telemetry.json'
        )
      )
    ).toBe(false);
  });

  it('never prompts when only stdout is a TTY (stdin piped must not hang)', async () => {
    setTTY(process.stdout, true);
    const dir = makeTempProject();
    await runCli(['react-bulma-components', path.join(dir, 'src')]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never prompts under DO_NOT_TRACK even on a full TTY', async () => {
    setTTY(process.stdout, true);
    setTTY(process.stdin, true);
    process.env.DO_NOT_TRACK = '1';
    const dir = makeTempProject();
    await runCli(['react-bulma-components', path.join(dir, 'src')]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('star nudge', () => {
  it('prints the GitHub star message on a TTY', async () => {
    setTTY(process.stdout, true);
    const dir = makeTempProject();
    const { logs } = await runCli([
      'react-bulma-components',
      path.join(dir, 'src'),
    ]);
    const text = logs.join('\n');
    expect(text).toContain(
      '★ If you enjoy using bestax-bulma, please star us on GitHub!'
    );
    expect(text).toContain('https://github.com/allxsmith/bestax');
  });

  it('stays silent when stdout is not a TTY', async () => {
    const dir = makeTempProject();
    const { logs } = await runCli([
      'react-bulma-components',
      path.join(dir, 'src'),
    ]);
    expect(logs.join('\n')).not.toContain('star us on GitHub');
  });
});

describe('handleTelemetry', () => {
  const stats: MigrateRunStats = {
    source: 'react-bulma-components',
    cssMode: 'bestax',
    dry: false,
    deps: true,
    changedCount: 2,
    todosByRule: [],
  };

  function makeIo(): {
    logs: string[];
    log: (m: string) => void;
    error: (m: string) => void;
  } {
    const logs: string[] = [];
    return { logs, log: m => logs.push(m), error: () => {} };
  }

  it('a "yes" from the prompt persists, acks, and sends', async () => {
    setTTY(process.stdout, true);
    setTTY(process.stdin, true);
    const io = makeIo();
    await handleTelemetry(stats, undefined, io, async () => true);
    expect(io.logs.join('\n')).toContain(
      'Thanks! Opt out anytime with --no-telemetry.'
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('a "no" from the prompt persists off, acks, and sends nothing', async () => {
    setTTY(process.stdout, true);
    setTTY(process.stdin, true);
    const io = makeIo();
    await handleTelemetry(stats, undefined, io, async () => false);
    expect(io.logs.join('\n')).toContain("No problem — we won't ask again.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('acknowledges truthfully when the choice could not be saved', async () => {
    // "We won't ask again" after a swallowed write failure would be false on
    // every future run; the ack is worded on whether the write stuck.
    setTTY(process.stdout, true);
    setTTY(process.stdin, true);
    const blocker = path.join(process.env.XDG_CONFIG_HOME as string, 'blocker');
    fs.writeFileSync(blocker, 'file, not a dir');
    process.env.XDG_CONFIG_HOME = blocker;
    const io = makeIo();
    await handleTelemetry(stats, undefined, io, async () => false);
    expect(io.logs.join('\n')).toContain("Couldn't save your choice");
    expect(io.logs.join('\n')).not.toContain("we won't ask again");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('a cancelled prompt acks nothing and persists nothing', async () => {
    setTTY(process.stdout, true);
    setTTY(process.stdin, true);
    const io = makeIo();
    await handleTelemetry(stats, undefined, io, async () => null);
    expect(io.logs).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      fs.existsSync(
        path.join(
          process.env.XDG_CONFIG_HOME as string,
          'bestax',
          'telemetry.json'
        )
      )
    ).toBe(false);
  });

  it('never throws, even when the prompt itself does', async () => {
    setTTY(process.stdout, true);
    setTTY(process.stdin, true);
    const io = makeIo();
    await expect(
      handleTelemetry(stats, undefined, io, async () => {
        throw new Error('boom');
      })
    ).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('promptTelemetryConsent', () => {
  function makeIo(): {
    logs: string[];
    log: (m: string) => void;
    error: (m: string) => void;
  } {
    const logs: string[] = [];
    return { logs, log: m => logs.push(m), error: () => {} };
  }

  it.each([
    ['y\n', true],
    ['Y\n', true],
    ['yes\n', true],
    ['YES\n', true],
    ['n\n', false],
    ['\n', false],
    ['whatever\n', false],
  ] as const)('parses %j as %s', async (line, expected) => {
    const input = new PassThrough();
    const output = new PassThrough();
    output.resume();
    const io = makeIo();
    const pending = promptTelemetryConsent(io, input, output);
    input.write(line);
    await expect(pending).resolves.toBe(expected);
  });

  it('prints the privacy notice before asking', async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    output.resume();
    const io = makeIo();
    const pending = promptTelemetryConsent(io, input, output);
    input.write('n\n');
    await pending;
    const text = io.logs.join('\n');
    expect(text).toContain(
      'Help improve bestax-migrate — share anonymous usage stats?'
    );
    expect(text).toContain(
      'Sends only rule names and counts — never file paths or code.'
    );
    expect(text).toContain('https://bestax.io/docs/guides/telemetry');
    expect(text).toContain('https://github.com/allxsmith/bestax/issues');
  });

  it('treats a closed input (Ctrl-D) as a cancel, not an answer', async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    output.resume();
    const pending = promptTelemetryConsent(makeIo(), input, output);
    input.end();
    await expect(pending).resolves.toBeNull();
  });
});
