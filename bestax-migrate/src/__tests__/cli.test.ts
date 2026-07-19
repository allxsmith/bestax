import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { collectFiles, createCLI, findPackageJsons } from '../cli.js';

function makeTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bestax-migrate-test-'));
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

function runCli(args: string[]): { logs: string[]; errors: string[] } {
  const logs: string[] = [];
  const errors: string[] = [];
  const program = createCLI({
    log: m => logs.push(m),
    error: m => errors.push(m),
  });
  program.exitOverride();
  program.parse(['node', 'bestax-migrate', ...args]);
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
    fs.rmSync(dir, { recursive: true, force: true });
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
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe('CLI', () => {
  it('transforms files in place and reports', () => {
    const dir = makeTempProject();
    const { logs } = runCli(['react-bulma-components', path.join(dir, 'src')]);
    const transformed = fs.readFileSync(
      path.join(dir, 'src', 'App.tsx'),
      'utf8'
    );
    expect(transformed).toContain('from "@allxsmith/bestax-bulma"');
    expect(transformed).toContain('isLoading');
    // App.tsx + theme.scss + package.json all change
    expect(logs.join('\n')).toContain('3 transformed');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('leaves files untouched with --dry and prints with --print', () => {
    const dir = makeTempProject();
    const before = fs.readFileSync(path.join(dir, 'src', 'App.tsx'), 'utf8');
    const { logs } = runCli([
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
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('reports files that fail to parse and continues', () => {
    const dir = makeTempProject();
    fs.writeFileSync(path.join(dir, 'src', 'broken.tsx'), 'const = <<>;\n');
    const { logs, errors } = runCli([
      'react-bulma-components',
      path.join(dir, 'src'),
    ]);
    expect(errors.join('\n')).toContain('broken.tsx');
    expect(logs.join('\n')).toContain('3 transformed');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('migrates SCSS files and updates package.json dependencies', () => {
    const dir = makeTempProject();
    runCli(['react-bulma-components', path.join(dir, 'src')]);
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
    expect(pkg.devDependencies.sass).toBe('^1.71.0');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('honors --no-deps and --dry for the package.json step', () => {
    const dir = makeTempProject();
    const before = fs.readFileSync(path.join(dir, 'package.json'), 'utf8');
    runCli(['react-bulma-components', path.join(dir, 'src'), '--no-deps']);
    expect(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).toBe(
      before
    );
    runCli(['react-bulma-components', path.join(dir, 'src'), '--dry']);
    expect(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).toBe(
      before
    );
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('threads --css keep through to the transforms', () => {
    const dir = makeTempProject();
    fs.writeFileSync(
      path.join(dir, 'src', 'style-entry.ts'),
      "import 'bulma/css/bulma.min.css';\n"
    );
    runCli(['react-bulma-components', path.join(dir, 'src'), '--css', 'keep']);
    expect(
      fs.readFileSync(path.join(dir, 'src', 'style-entry.ts'), 'utf8')
    ).toBe("import 'bulma/css/bulma.min.css';\n");
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('rejects unknown --css modes', () => {
    const dir = makeTempProject();
    expect(() =>
      runCli(['react-bulma-components', path.join(dir, 'src'), '--css', 'nope'])
    ).toThrow();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('rejects unknown sources', () => {
    const dir = makeTempProject();
    expect(() => runCli(['not-a-library', path.join(dir, 'src')])).toThrow();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('rejects missing paths', () => {
    expect(() =>
      runCli(['react-bulma-components', '/definitely/not/here'])
    ).toThrow();
  });
});
