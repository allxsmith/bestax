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
import { SOURCES } from '../sources/registry.js';
import type { MigrateRunStats } from '../telemetry.js';
import type { DepsOptions, MigrationSource } from '../types.js';

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

/**
 * Runs `program` and hands back the exit code it left, restoring the
 * process's own: a code left set would become the test run's.
 */
async function exitCodeOf(
  program: ReturnType<typeof createCLI>,
  args: string[]
): Promise<typeof process.exitCode> {
  const original = process.exitCode;
  process.exitCode = undefined;
  try {
    await program.parseAsync(['node', 'bestax-migrate', ...args]);
    return process.exitCode;
  } finally {
    process.exitCode = original;
  }
}

async function runCli(args: string[]): Promise<{
  logs: string[];
  errors: string[];
  exitCode: typeof process.exitCode;
}> {
  const logs: string[] = [];
  const errors: string[] = [];
  const program = createCLI({
    log: m => logs.push(m),
    error: m => errors.push(m),
  });
  program.exitOverride();
  const exitCode = await exitCodeOf(program, args);
  return { logs, errors, exitCode };
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

  it('takes a named file of an extension it is told to, wherever a walk would not', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bestax-collect-'));
    tempDirs.push(dir);
    fs.writeFileSync(path.join(dir, 'a.html'), '');
    fs.writeFileSync(path.join(dir, 'b.html'), '');
    const named = path.join(dir, 'a.html');
    expect(collectFiles([named, dir], ['tsx'], ['html'])).toEqual([named]);
    expect(collectFiles([named], ['tsx'])).toEqual([]);
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

describe('the source-still-imported warning', () => {
  /** A project whose ONLY remaining rbx reference is the given file/content. */
  function projectWith(name: string, content: string): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bestax-migrate-deep-'));
    tempDirs.push(dir);
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'src', name), content);
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      `${JSON.stringify({ name: 'a', dependencies: { rbx: '^2.2.0' } }, null, 2)}\n`
    );
    return dir;
  }

  it.each([
    [
      'a retained DEEP import',
      'App.tsx',
      "import { ThemeContext } from 'rbx/base/theme';\nexport const A = 1;\n",
    ],
    ['an indented-Sass import', 'a.sass', '@import "~rbx/rbx"\n'],
  ])('fires for %s', async (_label, file, content) => {
    // These are the two forms the transforms deliberately PRESERVE, so if one
    // is the last reference the package must not be removed silently.
    const dir = projectWith(file, content);
    const { logs } = await runCli(['rbx', path.join(dir, 'src'), '--dry']);
    expect(logs.join('\n')).toMatch(
      /still import it for components with no bestax/
    );
  });

  it('fires for a bindingless side-effect import', async () => {
    // `import 'rbx';` has nothing to rewrite, so the transform leaves the
    // file alone — but the reference is still live, and removing the
    // package from the manifest would strand it.
    const dir = projectWith('App.tsx', "import 'rbx';\nexport const A = 1;\n");
    const { logs } = await runCli(['rbx', path.join(dir, 'src'), '--dry']);
    expect(logs.join('\n')).toMatch(
      /still import it for components with no bestax/
    );
  });

  it('fires for an unsupported file that imports the source', async () => {
    // .vue/.astro files are reported but never rewritten, so the reference
    // survives the run and the package must not be removed under it.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bestax-migrate-unsup-'));
    tempDirs.push(dir);
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'src', 'App.vue'),
      "<script>import { Box } from 'rbx';</script>\n"
    );
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      `${JSON.stringify({ name: 'a', dependencies: { rbx: '^2.2.0' } }, null, 2)}\n`
    );
    const { logs } = await runCli(['rbx', path.join(dir, 'src'), '--dry']);
    expect(logs.join('\n')).toMatch(
      /still import it for components with no bestax/
    );
  });

  it('does not fire for a lookalike package name', async () => {
    const dir = projectWith(
      'App.tsx',
      "import { X } from 'rbx-other';\nexport const A = 1;\n"
    );
    const { logs } = await runCli(['rbx', path.join(dir, 'src'), '--dry']);
    expect(logs.join('\n')).not.toMatch(/still import it for components/);
  });
});

describe('the bulma-classes source', () => {
  const box =
    'export default function A() {\n  return <div className="box">x</div>;\n}\n';
  const manifest = (pkg: object) => `${JSON.stringify(pkg, null, 2)}\n`;

  function project(files: Record<string, string>): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bestax-migrate-bc-'));
    tempDirs.push(dir);
    for (const [file, content] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
      fs.writeFileSync(path.join(dir, file), content);
    }
    return dir;
  }

  function nextApp(): string {
    return project({
      'app/page.tsx': box,
      'components/Card.tsx': box,
      'components/Widget.tsx': `'use client';\n${box}`,
      'pages/about.tsx': box,
      'docs/intro.mdx': '# Intro\n\n<div className="box">x</div>\n',
      'docs/computed.mdx': '<div className={cn("button", x)}>x</div>\n',
      'docs/data.mdx': '<div data-class="button">x</div>\n',
      'widgets/Card.vue':
        '<template>\n  <div class="box">x</div>\n</template>\n',
      'package.json': manifest({
        name: 'a',
        dependencies: { next: '^14.0.0', bulma: '^1.0.2', react: '^18.2.0' },
      }),
    });
  }

  it('finds a Next.js app below the directory it runs from', async () => {
    const dir = project({
      'package.json': manifest({ name: 'root', private: true }),
      'apps/web/package.json': manifest({
        name: 'web',
        dependencies: { next: '^14.0.0', react: '^18.2.0' },
      }),
      'apps/web/app/page.tsx': box,
    });
    const { logs } = await runCli(['bulma-classes', dir]);
    expect(
      fs.readFileSync(path.join(dir, 'apps/web/app/page.tsx'), 'utf8')
    ).not.toContain('<Box>');
    expect(logs.join('\n')).toContain('rsc');
  });

  it('leaves a package whose JSX is not React alone', async () => {
    const dir = project({
      'package.json': manifest({
        name: 'p',
        dependencies: { preact: '^10.0.0', bulma: '^1.0.2' },
      }),
      'tsconfig.json':
        '{\n  // Preact renders the JSX\n  "compilerOptions": { "jsxImportSource": "preact" }\n}\n',
      'src/Card.tsx': box,
    });
    const { logs } = await runCli(['bulma-classes', dir]);
    expect(
      fs.readFileSync(path.join(dir, 'src/Card.tsx'), 'utf8')
    ).not.toContain('<Box>');
    expect(logs.join('\n')).toContain('jsx-runtime');
  });

  it('leaves possible Next.js server components alone and converts the rest', async () => {
    const dir = nextApp();
    const { logs } = await runCli(['bulma-classes', dir]);
    const read = (file: string) =>
      fs.readFileSync(path.join(dir, file), 'utf8');
    // A component outside app/ is a server component when a server page
    // renders it, so only 'use client' and the Pages Router are safe.
    for (const file of ['app/page.tsx', 'components/Card.tsx']) {
      expect(read(file)).toContain('TODO(bestax-migrate)');
      expect(read(file)).not.toContain('<Box>');
    }
    expect(read('components/Widget.tsx')).toContain('<Box>');
    expect(read('pages/about.tsx')).toContain('<Box>');
    expect(logs.join('\n')).toContain('rsc');
  });

  it('reports an .mdx file with markup it would convert', async () => {
    const { logs } = await runCli(['bulma-classes', nextApp(), '--dry']);
    const text = logs.join('\n');
    expect(text).toMatch(/unsupported-file[\s\S]*intro\.mdx:3/);
    // The strings inside a computed className count; a data- attribute
    // named like one does not.
    expect(text).toContain('computed.mdx:1');
    expect(text).not.toContain('data.mdx');
    // Vue cannot render bestax's React components, so it is not flagged.
    expect(text).not.toContain('Card.vue');
  });

  it('adds bestax-bulma and keeps Bulma', async () => {
    const dir = nextApp();
    await runCli(['bulma-classes', dir]);
    const pkg = JSON.parse(
      fs.readFileSync(path.join(dir, 'package.json'), 'utf8')
    );
    expect(pkg.dependencies).toEqual({
      next: '^14.0.0',
      bulma: '^1.0.2',
      react: '^18.2.0',
      '@allxsmith/bestax-bulma': '^5',
    });
  });

  describe('the stylesheet', () => {
    const entry = `import 'bulma/css/bulma.min.css';\n${box}`;
    const scss = "$primary: #8a4d76;\n@import 'bulma/bulma';\n";
    const bulma09App = () =>
      project({
        'src/index.tsx': entry,
        'src/styles.scss': scss,
        'package.json': manifest({
          name: 'a',
          dependencies: { bulma: '^0.9.4', react: '^18.2.0' },
          devDependencies: { 'node-sass': '^9.0.0' },
        }),
      });

    it("keeps the app's Bulma and its stylesheets by default", async () => {
      const dir = bulma09App();
      const { logs } = await runCli(['bulma-classes', dir]);
      const index = fs.readFileSync(path.join(dir, 'src/index.tsx'), 'utf8');
      expect(index).toContain("import 'bulma/css/bulma.min.css';");
      expect(index).toContain('<Box>');
      expect(fs.readFileSync(path.join(dir, 'src/styles.scss'), 'utf8')).toBe(
        scss
      );
      const pkg = JSON.parse(
        fs.readFileSync(path.join(dir, 'package.json'), 'utf8')
      );
      expect(pkg.dependencies).toEqual({
        bulma: '^0.9.4',
        react: '^18.2.0',
        '@allxsmith/bestax-bulma': '^5',
      });
      expect(pkg.devDependencies).toEqual({ 'node-sass': '^9.0.0' });
      expect(logs.join('\n')).toContain('left bulma ^0.9.4');
    });

    it('moves the app to Bulma v1 under --css bestax', async () => {
      const dir = bulma09App();
      await runCli(['bulma-classes', dir, '--css', 'bestax']);
      expect(
        fs.readFileSync(path.join(dir, 'src/index.tsx'), 'utf8')
      ).toContain('@allxsmith/bestax-bulma/bestax.css');
      expect(
        fs.readFileSync(path.join(dir, 'src/styles.scss'), 'utf8')
      ).toContain('@use');
      const pkg = JSON.parse(
        fs.readFileSync(path.join(dir, 'package.json'), 'utf8')
      );
      expect(pkg.dependencies.bulma).toMatch(/^\^1\./);
      expect(pkg.devDependencies).not.toHaveProperty('node-sass');
      expect(pkg.devDependencies).toHaveProperty('sass');
    });
  });
});

describe('HTML pages', () => {
  const page = (body: string) =>
    `<!DOCTYPE html>\n<html lang="en">\n<head><title>T</title></head>\n<body>\n${body}\n</body>\n</html>\n`;
  const bulmaPage = page(
    '  <section class="section"><div class="box">x</div></section>'
  );
  // Vite's shell: no Bulma component class, so nothing to convert.
  const shell = page('  <div id="root"></div>');

  function site(files: Record<string, string>): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bestax-migrate-html-'));
    tempDirs.push(dir);
    for (const [file, content] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
      fs.writeFileSync(path.join(dir, file), content);
    }
    return dir;
  }

  async function failingCli(args: string[]): Promise<string[]> {
    const errors: string[] = [];
    const program = createCLI({ log: () => {}, error: m => errors.push(m) });
    program.exitOverride();
    await expect(
      program.parseAsync(['node', 'bestax-migrate', ...args])
    ).rejects.toThrow();
    return errors;
  }

  it('converts a named page into a module beside it, and leaves the page alone', async () => {
    const dir = site({ 'pages/about.html': bulmaPage });
    const named = path.join(dir, 'pages', 'about.html');
    const { logs } = await runCli(['bulma-classes', named, '--no-deps']);
    const written = fs.readFileSync(
      path.join(dir, 'pages', 'about.jsx'),
      'utf8'
    );
    expect(written).toContain('export default function AboutPage() {');
    expect(written).toContain('<Section>');
    expect(fs.readFileSync(named, 'utf8')).toBe(bulmaPage);
    const text = logs.join('\n');
    expect(text).toContain(`Wrote ${path.join(dir, 'pages', 'about.jsx')}`);
    // The report names the page and its line.
    expect(text).toContain(`${named}:2`);
    expect(text).toContain('html-document:lang');
    expect(text).toMatch(/1 transformed/);
  });

  it("names the folder walk's top index.html the home page, and a section's after its folder", async () => {
    const dir = site({
      'index.html': bulmaPage,
      'about.html': bulmaPage,
      'docs/index.html': bulmaPage,
      'docs/api.html': bulmaPage,
    });
    await runCli(['bulma-classes', dir, '-e', 'html', '--no-deps']);
    const exported = (file: string) =>
      /export default function (\w+)/.exec(
        fs.readFileSync(path.join(dir, file), 'utf8')
      )?.[1];
    expect(exported('index.jsx')).toBe('HomePage');
    expect(exported(path.join('docs', 'index.jsx'))).toBe('DocsPage');
    expect(exported('about.jsx')).toBe('AboutPage');
  });

  it('writes .tsx where the package says TypeScript', async () => {
    const dir = site({
      'package.json': JSON.stringify({
        name: 'a',
        devDependencies: { typescript: '^5.0.0' },
      }),
      'index.html': bulmaPage,
    });
    await runCli(['bulma-classes', path.join(dir, 'index.html'), '--no-deps']);
    expect(fs.existsSync(path.join(dir, 'index.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'index.jsx'))).toBe(false);
  });

  it('walks pages only under -e html, and says so for the Bulma ones it skipped', async () => {
    const dir = site({
      'pages/home.html': bulmaPage,
      'pages/legacy.htm': bulmaPage,
      'index.html': shell,
    });
    const { logs } = await runCli(['bulma-classes', dir, '--no-deps']);
    const text = logs.join('\n');
    expect(text).toContain('html-file:not-included (2)');
    expect(text).toContain(`${path.join(dir, 'pages', 'home.html')}:5`);
    expect(text).not.toContain(path.join(dir, 'index.html'));
    expect(fs.existsSync(path.join(dir, 'pages', 'home.jsx'))).toBe(false);

    const walked = await runCli([
      'bulma-classes',
      '-e',
      'html,htm',
      dir,
      '--no-deps',
    ]);
    expect(walked.logs.join('\n')).not.toContain('not-included');
    expect(fs.existsSync(path.join(dir, 'pages', 'home.jsx'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'pages', 'legacy.jsx'))).toBe(true);
    // Vite's shell has no Bulma component class, so nothing is written.
    expect(fs.existsSync(path.join(dir, 'index.jsx'))).toBe(false);
  });

  it('tells a .htm page left out of an -e html walk the extension it needs', async () => {
    const dir = site({
      'pages/home.html': bulmaPage,
      'pages/legacy.htm': bulmaPage,
    });
    const { logs } = await runCli([
      'bulma-classes',
      '-e',
      'html',
      dir,
      '--no-deps',
    ]);
    const text = logs.join('\n');
    // `-e` matches an extension exactly: html took home.html, not legacy.htm.
    expect(fs.existsSync(path.join(dir, 'pages', 'home.jsx'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'pages', 'legacy.jsx'))).toBe(false);
    expect(text).toContain('html-file:not-included (1)');
    expect(text).toContain(`${path.join(dir, 'pages', 'legacy.htm')}:5`);
    expect(text).toContain("it doesn't list `htm`");
    expect(text).toContain('(`-e htm` for the pages alone)');
    expect(text).not.toContain('`-e html`');
  });

  it('never writes over a module already there, so a second run changes nothing', async () => {
    const dir = site({ 'home.html': bulmaPage });
    const named = path.join(dir, 'home.html');
    await runCli(['bulma-classes', named, '--no-deps']);
    const first = fs.readFileSync(path.join(dir, 'home.jsx'), 'utf8');
    const { logs } = await runCli(['bulma-classes', named, '--no-deps']);
    const text = logs.join('\n');
    expect(text).toContain('html-file:exists');
    expect(text).toMatch(/0 transformed/);
    expect(fs.readFileSync(path.join(dir, 'home.jsx'), 'utf8')).toBe(first);
  });

  it('says what it would write under --dry, and prints the module under --print', async () => {
    const dir = site({ 'home.html': bulmaPage });
    const named = path.join(dir, 'home.html');
    const { logs } = await runCli([
      'bulma-classes',
      named,
      '--dry',
      '--print',
      '--no-deps',
    ]);
    const text = logs.join('\n');
    expect(text).toContain('export default function HomePage() {');
    expect(text).toContain(`Would write ${path.join(dir, 'home.jsx')}`);
    expect(fs.existsSync(path.join(dir, 'home.jsx'))).toBe(false);
  });

  it("reads the module's stylesheet import for the manifest, as it reads a JSX file's", async () => {
    const linked = (css: string) => {
      const dir = site({
        'package.json': JSON.stringify({
          name: 'a',
          dependencies: { react: '^18.2.0' },
        }),
        'home.html': bulmaPage.replace(
          '</head>',
          '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@1.0.4/css/bulma.min.css"></head>'
        ),
      });
      return { dir, css };
    };
    const run = async ({ dir, css }: { dir: string; css: string }) => {
      await runCli([
        'bulma-classes',
        path.join(dir, 'home.html'),
        '--css',
        css,
      ]);
      return {
        module: fs.readFileSync(path.join(dir, 'home.jsx'), 'utf8'),
        deps: JSON.parse(
          fs.readFileSync(path.join(dir, 'package.json'), 'utf8')
        ).dependencies,
      };
    };
    // The module imports bulma/…, so the app declares `bulma`.
    const bulma = await run(linked('bulma'));
    expect(bulma.module).toContain('import "bulma/css/bulma.min.css";');
    expect(bulma.deps.bulma).toMatch(/^\^1\./);
    // bestax's bundle arrives with bestax-bulma, so no `bulma` is added.
    const bestax = await run(linked('bestax'));
    expect(bestax.module).toContain(
      'import "@allxsmith/bestax-bulma/bestax.css";'
    );
    expect(bestax.deps).not.toHaveProperty('bulma');
  });

  it('refuses a server template', async () => {
    const dir = site({
      'home.html': page('<div class="box">{{ name }}</div>'),
    });
    const { logs } = await runCli([
      'bulma-classes',
      path.join(dir, 'home.html'),
      '--no-deps',
    ]);
    expect(logs.join('\n')).toContain('html-file:template-syntax');
    expect(fs.existsSync(path.join(dir, 'home.jsx'))).toBe(false);
  });

  it('reports a page that fails to convert and carries on', async () => {
    const pages: MigrationSource = {
      name: 'fake-pages',
      label: 'Fake pages',
      packageName: null,
      transform: () => undefined,
      htmlExtensions: ['html'],
      transformHtml: file => {
        if (file.endsWith('a.html')) throw new Error('cannot read it');
        return { outputPath: file.replace(/html$/, 'jsx'), output: 'x\n' };
      },
    };
    SOURCES[pages.name] = pages;
    try {
      const dir = site({ 'a.html': bulmaPage, 'b.html': bulmaPage });
      const { logs, errors, exitCode } = await runCli([
        'fake-pages',
        path.join(dir, 'a.html'),
        path.join(dir, 'b.html'),
      ]);
      expect(errors.join('\n')).toContain('a.html: cannot read it');
      expect(fs.readFileSync(path.join(dir, 'b.jsx'), 'utf8')).toBe('x\n');
      expect(logs.join('\n')).toContain('1 transformed, 1 failed');
      expect(exitCode).toBe(1);
    } finally {
      delete SOURCES[pages.name];
    }
  });

  it('refuses a page, or -e html, for a source that reads no HTML', async () => {
    const dir = site({ 'home.html': bulmaPage });
    const named = await failingCli([
      'react-bulma-components',
      path.join(dir, 'home.html'),
    ]);
    expect(named.join('\n')).toMatch(/reads no HTML pages[\s\S]*bulma-classes/);
    const walked = await failingCli(['rbx', '-e', 'tsx,html', dir]);
    expect(walked.join('\n')).toContain('reads no HTML pages (html)');
    expect(fs.existsSync(path.join(dir, 'home.jsx'))).toBe(false);
  });
});

describe('a source with no package', () => {
  const seen: DepsOptions[] = [];
  const markupSource: MigrationSource = {
    name: 'fake-markup',
    label: 'Fake markup source',
    packageName: null,
    transform: () => undefined,
    updateDependencies: (_file, _pkg, _collector, options) => {
      seen.push(options);
      return null;
    },
  };

  beforeEach(() => {
    SOURCES[markupSource.name] = markupSource;
    seen.length = 0;
  });
  afterEach(() => {
    delete SOURCES[markupSource.name];
  });

  it('never reads its name as an import, in parsed or unparseable files', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bestax-migrate-nopkg-'));
    tempDirs.push(dir);
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'src', 'App.tsx'),
      "import 'fake-markup';\nexport const A = 1;\n"
    );
    fs.writeFileSync(
      path.join(dir, 'src', 'App.vue'),
      "<script>import { Box } from 'fake-markup';</script>\n"
    );
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      `${JSON.stringify({ name: 'a' }, null, 2)}\n`
    );
    const { logs } = await runCli([
      'fake-markup',
      path.join(dir, 'src'),
      '--dry',
    ]);
    expect(seen).toHaveLength(1);
    expect(seen[0].sourceStillImported).toBe(false);
    expect(logs.join('\n')).not.toContain('unsupported-file');
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

  it('still writes under --print without --dry, as its help says', async () => {
    const dir = makeTempProject();
    const before = fs.readFileSync(path.join(dir, 'src', 'App.tsx'), 'utf8');
    const { logs } = await runCli([
      'react-bulma-components',
      path.join(dir, 'src'),
      '--print',
    ]);
    const after = fs.readFileSync(path.join(dir, 'src', 'App.tsx'), 'utf8');
    expect(after).not.toBe(before);
    expect(logs.join('\n')).toContain(after.trim());
    const print = createCLI().options.find(option => option.long === '--print');
    expect(print?.description).toContain('still writes them unless --dry');
  });

  it('reports files that fail to parse, continues, and exits 1', async () => {
    const dir = makeTempProject();
    const broken = path.join(dir, 'src', 'broken.tsx');
    fs.writeFileSync(broken, 'const = <<>;\n');
    const { logs, errors, exitCode } = await runCli([
      'react-bulma-components',
      path.join(dir, 'src'),
    ]);
    expect(errors.join('\n')).toContain(`✖ ${broken}: `);
    const text = logs.join('\n');
    expect(text).toContain('3 transformed, 1 failed');
    expect(text).toContain(`failed (1)\n    ${broken} — `);
    expect(text).toContain('fix each one and run the codemod on it again');
    expect(fs.readFileSync(broken, 'utf8')).toBe('const = <<>;\n');
    expect(fs.readFileSync(path.join(dir, 'src', 'App.tsx'), 'utf8')).toContain(
      '@allxsmith/bestax-bulma'
    );
    expect(exitCode).toBe(1);
  });

  it('exits 1 under --dry too, and 0 once every file migrates', async () => {
    const dir = makeTempProject();
    const broken = path.join(dir, 'src', 'broken.tsx');
    fs.writeFileSync(broken, 'const = <<>;\n');
    const dry = await runCli([
      'react-bulma-components',
      path.join(dir, 'src'),
      '--dry',
    ]);
    expect(dry.exitCode).toBe(1);
    fs.writeFileSync(broken, 'export const fixed = 1;\n');
    const { logs, exitCode } = await runCli([
      'react-bulma-components',
      path.join(dir, 'src'),
    ]);
    expect(logs.join('\n')).not.toContain('failed');
    expect(exitCode).toBeUndefined();
  });

  it('exits 1 for a package.json it cannot read, after the sources', async () => {
    const dir = makeTempProject();
    fs.writeFileSync(path.join(dir, 'package.json'), '{ not json\n');
    const { logs, errors, exitCode } = await runCli([
      'react-bulma-components',
      path.join(dir, 'src'),
    ]);
    expect(errors.join('\n')).toContain(
      `✖ ${path.join(dir, 'package.json')}: `
    );
    expect(logs.join('\n')).toContain('2 transformed, 1 failed');
    expect(logs.join('\n')).not.toContain('Updated ');
    expect(exitCode).toBe(1);
  });

  it('documents its exit codes in --help', () => {
    const program = createCLI();
    let help = '';
    program.configureOutput({ writeOut: text => (help += text) });
    program.exitOverride();
    expect(() => program.parse(['node', 'bestax-migrate', '--help'])).toThrow();
    expect(help).toContain('Exit codes:');
    expect(help).toMatch(/^ {2}1 +a file could not be parsed or transformed/m);
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

describe('a run with a failed file', () => {
  it('ends at its report: no nudge, no prompt and no telemetry', async () => {
    setTTY(process.stdout, true);
    const dir = makeTempProject();
    fs.writeFileSync(path.join(dir, 'src', 'broken.tsx'), 'const = <<>;\n');
    const { logs, exitCode } = await runCli([
      'react-bulma-components',
      path.join(dir, 'src'),
      '--telemetry',
    ]);
    expect(exitCode).toBe(1);
    expect(logs.join('\n')).not.toContain('star us on GitHub');
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
    expect(text).toContain('Never file paths, file contents, or code.');
    expect(text).toContain('https://bestax.io/docs/guides/telemetry');
    expect(text).toContain('https://github.com/allxsmith/bestax/issues');
  });

  it('a SIGINT at the question cancels, exits 130, and persists nothing', async () => {
    // PassThrough streams never emit SIGINT (only real TTY input does), so
    // capture the interface via the injectable factory and emit it directly —
    // exercising the real handler: exitCode 130, question aborted to null.
    const { createInterface } = await import('node:readline/promises');
    const originalExitCode = process.exitCode;
    const input = new PassThrough();
    const output = new PassThrough();
    output.resume();
    let captured: ReturnType<typeof createInterface> | undefined;
    const capture: typeof createInterface = ((opts: unknown) => {
      captured = createInterface(opts as Parameters<typeof createInterface>[0]);
      return captured;
    }) as typeof createInterface;

    const pending = promptTelemetryConsent(makeIo(), input, output, capture);
    await new Promise(resolve => setImmediate(resolve));
    captured?.emit('SIGINT');

    await expect(pending).resolves.toBeNull();
    expect(process.exitCode).toBe(130);
    process.exitCode = originalExitCode;
    expect(
      fs.existsSync(path.join(process.env.XDG_CONFIG_HOME as string, 'bestax'))
    ).toBe(false);
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
