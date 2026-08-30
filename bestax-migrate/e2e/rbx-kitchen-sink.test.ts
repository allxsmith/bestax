/**
 * End-to-end gate: copy the source-only rbx kitchen-sink app into .e2e-tmp/,
 * run the codemod on every file, then typecheck the MIGRATED output against
 * the real @allxsmith/bestax-bulma types (workspace dependency — bulma-ui
 * must be built first; turbo orders this).
 *
 * rbx itself is never installed: the input app is never typechecked, and
 * leftovers.tsx — the file that exercises everything the codemod
 * intentionally refuses to convert — is excluded from the output typecheck
 * and asserted through its TODO annotations instead.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rbx } from '../src/sources/rbx/index.js';
import { runTransform } from '../src/runner.js';
import type { TodoEntry } from '../src/types.js';
import { compileMigratedScss } from './support/compile-scss.js';

const packageRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const fixtureDir = path.join(packageRoot, 'fixtures', 'rbx-kitchen-sink');

// One scratch directory PER PROCESS, not one shared path — see the comment in
// kitchen-sink.test.ts for why (`pnpm all` runs two jest processes over this
// file concurrently). BESTAX_E2E_KEEP=1 leaves it behind for inspection.
const tmpRoot = path.join(packageRoot, '.e2e-tmp');
fs.mkdirSync(tmpRoot, { recursive: true });
const tmpDir = fs.mkdtempSync(path.join(tmpRoot, 'rbx-kitchen-sink-'));

interface MigratedApp {
  todosByFile: Map<string, TodoEntry[]>;
  files: string[];
  /**
   * package.json entries are tracked separately: every `deps` entry is a
   * report line describing what the updater changed, not a problem the user
   * has to fix, so they must not count against the "no TODOs" assertion.
   */
  depTodos: TodoEntry[];
}

function migrateKitchenSink(): MigratedApp {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.cpSync(fixtureDir, tmpDir, { recursive: true });

  const srcDir = path.join(tmpDir, 'src');
  const files = fs.readdirSync(srcDir).filter(f => /\.(tsx?|jsx?)$/.test(f));
  const todosByFile = new Map<string, TodoEntry[]>();

  for (const file of files) {
    const filePath = path.join(srcDir, file);
    const source = fs.readFileSync(filePath, 'utf8');
    const todos: TodoEntry[] = [];
    const { output } = runTransform(rbx.transform, file, source, {
      add: entry => todos.push(entry),
    });
    if (output !== null) fs.writeFileSync(filePath, output);
    todosByFile.set(file, todos);
  }

  const scssPath = path.join(srcDir, 'styles.scss');
  const scssTodos: TodoEntry[] = [];
  const scssOut = rbx.transformStyles!(
    'styles.scss',
    fs.readFileSync(scssPath, 'utf8'),
    { add: entry => scssTodos.push(entry) },
    { cssMode: 'bestax' }
  );
  if (scssOut !== null) fs.writeFileSync(scssPath, scssOut);
  todosByFile.set('styles.scss', scssTodos);

  const pkgPath = path.join(tmpDir, 'package.json');
  const pkgTodos: TodoEntry[] = [];
  const pkgNext = rbx.updateDependencies!(
    'package.json',
    JSON.parse(fs.readFileSync(pkgPath, 'utf8')),
    { add: entry => pkgTodos.push(entry) },
    { cssMode: 'bestax', bulmaReferenced: true }
  );
  if (pkgNext !== null) {
    fs.writeFileSync(pkgPath, `${JSON.stringify(pkgNext, null, 2)}\n`);
  }

  return { todosByFile, files, depTodos: pkgTodos };
}

describe('rbx kitchen-sink e2e', () => {
  let app: MigratedApp;

  beforeAll(() => {
    app = migrateKitchenSink();
  });

  afterAll(() => {
    if (!process.env.BESTAX_E2E_KEEP) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('migrates every kitchen-sink file', () => {
    expect(app.files.sort()).toEqual([
      'App.tsx',
      'components.tsx',
      'elements.tsx',
      'form.tsx',
      'grid.tsx',
      'helpers.tsx',
      'layout.tsx',
      'leftovers.tsx',
    ]);
    for (const file of app.files) {
      const migrated = fs.readFileSync(path.join(tmpDir, 'src', file), 'utf8');
      // Only leftovers.tsx may keep its (trimmed, TODO-annotated) rbx import.
      if (file !== 'leftovers.tsx') {
        expect({ file, hasRbx: /from ["']rbx["']/.test(migrated) }).toEqual({
          file,
          hasRbx: false,
        });
      }
    }
  });

  it('leaves no TODOs outside leftovers.tsx', () => {
    for (const [file, todos] of app.todosByFile) {
      if (file === 'leftovers.tsx') continue;
      expect({ file, todos }).toEqual({ file, todos: [] });
    }
  });

  it('adopts the bestax combined CSS bundle in App.tsx', () => {
    const migrated = fs.readFileSync(
      path.join(tmpDir, 'src', 'App.tsx'),
      'utf8'
    );
    expect(migrated).toContain('import "@allxsmith/bestax-bulma/bestax.css";');
    expect(migrated).not.toContain('rbx/index.css');
  });

  it('turns rbx helper props into wrapping Badge and Tooltip components', () => {
    const migrated = fs.readFileSync(
      path.join(tmpDir, 'src', 'helpers.tsx'),
      'utf8'
    );
    expect(migrated).toContain('<Badge content="4" color="danger">');
    expect(migrated).toContain('<Tooltip label="Help" position="right"');
    // And the flattened breakpoint objects.
    expect(migrated).toContain('visibilityMobile="hidden"');
    expect(migrated).toContain('displayTablet="flex"');
  });

  it('migrates the SCSS entry to Bulma v1 modules', () => {
    const scss = fs.readFileSync(
      path.join(tmpDir, 'src', 'styles.scss'),
      'utf8'
    );
    expect(scss).toContain("@use 'bulma/sass' with (");
    expect(scss).not.toContain('~rbx/rbx');
  });

  it('compiles the migrated SCSS entry with Dart Sass', () => {
    const scss = fs.readFileSync(
      path.join(tmpDir, 'src', 'styles.scss'),
      'utf8'
    );
    const { status, diagnostics } = compileMigratedScss(scss);
    expect({ status, diagnostics }).toEqual({ status: 0, diagnostics: '' });
  });

  it('deletes rbx and all four Bulma extensions from package.json', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf8')
    );
    expect(pkg.dependencies.rbx).toBeUndefined();
    expect(pkg.dependencies['bulma-badge']).toBeUndefined();
    expect(pkg.dependencies['bulma-divider']).toBeUndefined();
    expect(pkg.dependencies['bulma-pageloader']).toBeUndefined();
    expect(pkg.dependencies['bulma-tooltip']).toBeUndefined();
    expect(pkg.dependencies['@allxsmith/bestax-bulma']).toBe('^5');
    expect(pkg.dependencies.bulma).toBe('^1.0.4');
    expect(pkg.devDependencies['node-sass']).toBeUndefined();
    expect(pkg.devDependencies.sass).toBe('^1.79.0');
  });

  it('reports the five-dependency deletion and the React 16 peer gap', () => {
    const messages = app.depTodos.map(t => `${t.rule}: ${t.message}`);
    expect(
      messages.some(m =>
        /^deps: removed 5 dependencies \(rbx, bulma-badge, bulma-divider, bulma-pageloader, bulma-tooltip\)/.test(
          m
        )
      )
    ).toBe(true);
    expect(messages.some(m => m.startsWith('peer-deps: react ^16.8.6'))).toBe(
      true
    );
  });

  it('annotates every intentionally unsupported pattern in leftovers.tsx', () => {
    const todos = app.todosByFile.get('leftovers.tsx') ?? [];
    const rules = new Set(todos.map(t => t.rule));
    expect(rules).toContain('component:Tile');
    expect(rules).toContain('component:List');
    expect(rules).toContain('component:Generic');
    expect(rules).toContain('component:Fieldset');
    expect(rules).toContain('component:Numeric');
    expect(rules).toContain('component:Highlight');
    expect(rules).toContain('component:Icon');
    expect(rules).toContain('component:File.Label');
    expect(rules).toContain('component:Dropdown');
    expect(todos.length).toBeGreaterThanOrEqual(10);
    const migrated = fs.readFileSync(
      path.join(tmpDir, 'src', 'leftovers.tsx'),
      'utf8'
    );
    expect(migrated).toContain('TODO(bestax-migrate)');
    // Unmappable components keep a trimmed, TODO-annotated rbx import.
    expect(migrated).toMatch(/from ["']rbx["']/);
  });

  it('typechecks the migrated output against @allxsmith/bestax-bulma', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'global.d.ts'),
      "declare module '*.css';\ndeclare module '*.scss';\n"
    );
    fs.writeFileSync(
      path.join(tmpDir, 'tsconfig.json'),
      JSON.stringify(
        {
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
          include: ['src/**/*', 'global.d.ts'],
          exclude: ['src/leftovers.tsx'],
        },
        null,
        2
      )
    );
    const result = spawnSync('pnpm', ['exec', 'tsc', '-p', tmpDir], {
      cwd: packageRoot,
      encoding: 'utf8',
    });
    const diagnostics = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim();
    expect({ status: result.status, diagnostics }).toEqual({
      status: 0,
      diagnostics: '',
    });
  }, 120000);
});
