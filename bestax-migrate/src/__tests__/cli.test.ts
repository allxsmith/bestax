import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { collectFiles, createCLI } from '../cli.js';

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
    expect(logs.join('\n')).toContain('1 transformed');
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
    expect(logs.join('\n')).toContain('1 transformed');
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
