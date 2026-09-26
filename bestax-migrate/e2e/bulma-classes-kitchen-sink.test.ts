/**
 * End-to-end gate for the bulma-classes source: copy the kitchen-sink app
 * into .e2e-tmp/, migrate every file, then check what the other sources'
 * e2es check (TODOs only where intended, every rule documented, the migrated
 * app typechecks, the manifest is right) and one thing only this source can:
 * every component renders the same HTML before and after, because the input
 * is plain JSX that runs without any library.
 *
 * Run twice: under the default `--css keep`, which leaves the app's Bulma
 * and stylesheets alone, and under `--css bestax`, which moves the app to
 * Bulma v1 (the Sass must compile) and bestax's CSS bundle.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bulmaClasses } from '../src/sources/bulma-classes/index.js';
import { runTransform } from '../src/runner.js';
import type { CssMode, TodoEntry } from '../src/types.js';
import { compileMigratedScss } from './support/compile-scss.js';
import {
  loadModules,
  normalizeHtml,
  renderExports,
} from './support/render-module.js';

const packageRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const fixtureDir = path.join(
  packageRoot,
  'fixtures',
  'bulma-classes-kitchen-sink'
);

// Scratch directories PER PROCESS, never a shared path: `pnpm all` runs two
// jest processes over this file at once (see kitchen-sink.test.ts).
const tmpRoot = path.join(packageRoot, '.e2e-tmp');
fs.mkdirSync(tmpRoot, { recursive: true });
const tmpDir = fs.mkdtempSync(
  path.join(tmpRoot, 'bulma-classes-kitchen-sink-')
);
const srcDir = path.join(tmpDir, 'src');
const bestaxDir = fs.mkdtempSync(
  path.join(tmpRoot, 'bulma-classes-kitchen-sink-bestax-')
);

interface MigratedApp {
  files: string[];
  todosByFile: Map<string, TodoEntry[]>;
  depTodos: TodoEntry[];
}

function migrateKitchenSink(tmpDir: string, cssMode: CssMode): MigratedApp {
  const srcDir = path.join(tmpDir, 'src');
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.cpSync(fixtureDir, tmpDir, { recursive: true });
  fs.renameSync(
    path.join(tmpDir, 'package.input.json'),
    path.join(tmpDir, 'package.json')
  );

  const files = fs.readdirSync(srcDir).filter(f => /\.tsx?$/.test(f));
  const todosByFile = new Map<string, TodoEntry[]>();
  for (const file of files) {
    const filePath = path.join(srcDir, file);
    const todos: TodoEntry[] = [];
    const { output } = runTransform(
      bulmaClasses.transform,
      file,
      fs.readFileSync(filePath, 'utf8'),
      { add: entry => todos.push(entry) },
      { cssMode }
    );
    if (output !== null) fs.writeFileSync(filePath, output);
    todosByFile.set(file, todos);
  }

  const scssPath = path.join(srcDir, 'styles.scss');
  const scssTodos: TodoEntry[] = [];
  const scss = bulmaClasses.transformStyles!(
    'styles.scss',
    fs.readFileSync(scssPath, 'utf8'),
    { add: entry => scssTodos.push(entry) },
    { cssMode }
  );
  if (scss !== null) fs.writeFileSync(scssPath, scss);
  todosByFile.set('styles.scss', scssTodos);

  const pkgPath = path.join(tmpDir, 'package.json');
  const depTodos: TodoEntry[] = [];
  const pkg = bulmaClasses.updateDependencies!(
    'package.json',
    JSON.parse(fs.readFileSync(pkgPath, 'utf8')),
    { add: entry => depTodos.push(entry) },
    { cssMode, bulmaReferenced: false, sourceStillImported: false }
  );
  if (pkg !== null) {
    fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  }
  return { files, todosByFile, depTodos };
}

function modulesIn(dir: string): Record<string, string> {
  return Object.fromEntries(
    fs
      .readdirSync(dir)
      .filter(f => /\.tsx?$/.test(f))
      .map(f => [
        f.replace(/\.tsx?$/, ''),
        fs.readFileSync(path.join(dir, f), 'utf8'),
      ])
  );
}

function renderAll(dir: string): Record<string, Record<string, string>> {
  const loaded = loadModules(modulesIn(dir));
  return Object.fromEntries(
    Object.entries(loaded).map(([name, exports]) => [
      name,
      Object.fromEntries(
        Object.entries(renderExports(exports)).map(([key, html]) => [
          key,
          normalizeHtml(html),
        ])
      ),
    ])
  );
}

function typecheck(dir: string): { status: number; diagnostics: string } {
  fs.writeFileSync(
    path.join(dir, 'global.d.ts'),
    "declare module '*.css';\ndeclare module '*.scss';\n"
  );
  fs.writeFileSync(
    path.join(dir, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        jsx: 'react-jsx',
        module: 'ESNext',
        target: 'ES2022',
        moduleResolution: 'bundler',
        lib: ['ES2022', 'DOM', 'DOM.Iterable'],
        skipLibCheck: true,
      },
      include: ['global.d.ts', 'src/**/*'],
    })
  );
  const result = spawnSync('pnpm', ['exec', 'tsc', '-p', dir], {
    cwd: packageRoot,
    encoding: 'utf8',
  });
  return {
    status: result.status ?? 1,
    diagnostics: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim(),
  };
}

describe('bulma-classes kitchen-sink e2e', () => {
  let app: MigratedApp;

  beforeAll(() => {
    app = migrateKitchenSink(tmpDir, 'keep');
  });

  afterAll(() => {
    if (!process.env.BESTAX_E2E_KEEP) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('converts every file', () => {
    for (const file of app.files) {
      const before = fs.readFileSync(
        path.join(fixtureDir, 'src', file),
        'utf8'
      );
      const after = fs.readFileSync(path.join(srcDir, file), 'utf8');
      expect({ file, changed: after !== before }).toEqual({
        file,
        changed: true,
      });
    }
  });

  it('leaves no TODOs outside leftovers.tsx', () => {
    for (const [file, todos] of app.todosByFile) {
      if (file === 'leftovers.tsx') continue;
      expect({ file, todos }).toEqual({ file, todos: [] });
    }
  });

  it('annotates every intentionally unsupported pattern in leftovers.tsx', () => {
    const rules = (app.todosByFile.get('leftovers.tsx') ?? []).map(t => t.rule);
    expect(rules.sort()).toEqual(
      [
        'attr:color',
        'children:Card',
        'defaults:Delete',
        'drops:Level.Item',
        'dynamic-class:Column',
        'family:navbar',
        'legacy:tile',
        'ref:Notification',
        'spread:Box',
        'tag:Section',
      ].sort()
    );
  });

  it('documents every TODO rule it emits in the skill reference', () => {
    const skillDir = path.join(packageRoot, '..', 'skills', 'bestax-migrate');
    const refsDir = path.join(skillDir, 'references', 'bulma-classes');
    const refs = [
      ...fs
        .readdirSync(refsDir)
        .filter(f => f.endsWith('.md'))
        .map(f => path.join(refsDir, f)),
      path.join(skillDir, 'SKILL.md'),
    ]
      .map(f => fs.readFileSync(f, 'utf8'))
      .join('\n');
    const backticked = new Set(
      [...refs.matchAll(/`([^`\n]+)`/g)].map(match => match[1])
    );
    // A rule is documented when the reference names it, or names its kind
    // with a placeholder (`spread:<Target>`): the kinds are what a reader
    // looks up, and the suffix is always a Bulma or bestax name.
    const documented = (rule: string): boolean => {
      const kind = rule.split(':')[0];
      return (
        backticked.has(rule) ||
        [...backticked].some(text => text.startsWith(`${kind}:<`))
      );
    };
    const emitted = new Set(
      [...app.todosByFile.values()].flat().map(todo => todo.rule)
    );
    expect(emitted.size).toBeGreaterThan(0);
    expect([...emitted].sort().filter(rule => !documented(rule))).toEqual([]);
  });

  it('renders every component the same before and after', () => {
    const before = renderAll(path.join(fixtureDir, 'src'));
    expect(Object.keys(before).sort()).toEqual(
      app.files.map(f => f.replace(/\.tsx?$/, '')).sort()
    );
    expect(renderAll(srcDir)).toEqual(before);
  });

  it('typechecks the input as plain React', () => {
    const inputDir = fs.mkdtempSync(path.join(tmpRoot, 'bulma-classes-input-'));
    try {
      fs.cpSync(path.join(fixtureDir, 'src'), path.join(inputDir, 'src'), {
        recursive: true,
      });
      expect(typecheck(inputDir)).toEqual({ status: 0, diagnostics: '' });
    } finally {
      fs.rmSync(inputDir, { recursive: true, force: true });
    }
  });

  it('typechecks the migrated output against @allxsmith/bestax-bulma', () => {
    expect(typecheck(tmpDir)).toEqual({ status: 0, diagnostics: '' });
  });

  it("keeps the app's own Bulma stylesheet and Sass", () => {
    const migrated = fs.readFileSync(path.join(srcDir, 'App.tsx'), 'utf8');
    expect(migrated).toContain("import 'bulma/css/bulma.min.css';");
    expect(migrated).not.toContain('bestax.css');
    expect(fs.readFileSync(path.join(srcDir, 'styles.scss'), 'utf8')).toBe(
      fs.readFileSync(path.join(fixtureDir, 'src', 'styles.scss'), 'utf8')
    );
  });

  it("adds bestax-bulma and leaves the app's Bulma and Sass compiler alone", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf8')
    );
    expect(pkg.dependencies).toEqual({
      '@allxsmith/bestax-bulma': '^5',
      bulma: '^0.9.4',
      react: '^18.2.0',
      'react-dom': '^18.2.0',
    });
    expect(pkg.devDependencies).toEqual({ 'node-sass': '^7.0.0' });
  });

  it('changes nothing on a second run', () => {
    for (const file of app.files) {
      const source = fs.readFileSync(path.join(srcDir, file), 'utf8');
      expect({
        file,
        output: runTransform(bulmaClasses.transform, file, source).output,
      }).toEqual({ file, output: null });
    }
  });
});

describe('bulma-classes kitchen-sink e2e, --css bestax', () => {
  const srcDir = path.join(bestaxDir, 'src');
  let app: MigratedApp;

  beforeAll(() => {
    app = migrateKitchenSink(bestaxDir, 'bestax');
  });

  afterAll(() => {
    if (!process.env.BESTAX_E2E_KEEP) {
      fs.rmSync(bestaxDir, { recursive: true, force: true });
    }
  });

  it('adopts the bestax combined CSS bundle', () => {
    const migrated = fs.readFileSync(path.join(srcDir, 'App.tsx'), 'utf8');
    expect(migrated).toContain('import "@allxsmith/bestax-bulma/bestax.css";');
    expect(migrated).not.toContain('bulma/css/bulma.min.css');
  });

  it('migrates the SCSS entry to Bulma v1 modules, and it compiles', () => {
    const scss = fs.readFileSync(path.join(srcDir, 'styles.scss'), 'utf8');
    expect(scss).toContain("@use 'bulma/sass' with (");
    expect(compileMigratedScss(scss)).toEqual({ status: 0, diagnostics: '' });
  });

  it('adds bestax-bulma and moves Bulma to v1, removing nothing else', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(bestaxDir, 'package.json'), 'utf8')
    );
    expect(pkg.dependencies).toEqual({
      '@allxsmith/bestax-bulma': '^5',
      bulma: '^1.0.4',
      react: '^18.2.0',
      'react-dom': '^18.2.0',
    });
    expect(pkg.devDependencies).toEqual({ sass: '^1.79.0' });
  });

  it('converts the same elements, and a second run changes nothing', () => {
    for (const file of app.files) {
      const source = fs.readFileSync(path.join(srcDir, file), 'utf8');
      expect({
        file,
        output: runTransform(bulmaClasses.transform, file, source, undefined, {
          cssMode: 'bestax',
        }).output,
      }).toEqual({ file, output: null });
    }
    expect(app.todosByFile.get('leftovers.tsx')?.length).toBeGreaterThan(0);
  });
});
