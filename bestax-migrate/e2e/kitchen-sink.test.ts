/**
 * End-to-end gate: copy the source-only react-bulma-components kitchen-sink
 * app into .e2e-tmp/, run the codemod on every file, then typecheck the
 * MIGRATED output against the real @allxsmith/bestax-bulma types (workspace
 * dependency — bulma-ui must be built first; turbo orders this).
 *
 * react-bulma-components itself is never installed: the input app is never
 * typechecked, and leftovers.tsx — the file that exercises everything the
 * codemod intentionally refuses to convert — is excluded from the output
 * typecheck and asserted through its TODO annotations instead.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reactBulmaComponents } from '../src/sources/react-bulma-components/index.js';
import { runTransform } from '../src/runner.js';
import type { TodoEntry } from '../src/types.js';

const packageRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const fixtureDir = path.join(packageRoot, 'fixtures', 'kitchen-sink');
const tmpDir = path.join(packageRoot, '.e2e-tmp', 'kitchen-sink');

interface MigratedApp {
  todosByFile: Map<string, TodoEntry[]>;
  files: string[];
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
    const { output } = runTransform(
      reactBulmaComponents.transform,
      file,
      source,
      {
        add: entry => todos.push(entry),
      }
    );
    if (output !== null) fs.writeFileSync(filePath, output);
    todosByFile.set(file, todos);
  }

  // Stylesheets and the manifest go through their dedicated transforms.
  const scssPath = path.join(srcDir, 'styles.scss');
  const scssTodos: TodoEntry[] = [];
  const scssOut = reactBulmaComponents.transformStyles!(
    'styles.scss',
    fs.readFileSync(scssPath, 'utf8'),
    { add: entry => scssTodos.push(entry) },
    { cssMode: 'bestax' }
  );
  if (scssOut !== null) fs.writeFileSync(scssPath, scssOut);
  todosByFile.set('styles.scss', scssTodos);

  const pkgPath = path.join(tmpDir, 'package.json');
  const pkgTodos: TodoEntry[] = [];
  const pkgNext = reactBulmaComponents.updateDependencies!(
    'package.json',
    JSON.parse(fs.readFileSync(pkgPath, 'utf8')),
    { add: entry => pkgTodos.push(entry) },
    { cssMode: 'bestax', bulmaReferenced: true }
  );
  if (pkgNext !== null) {
    fs.writeFileSync(pkgPath, `${JSON.stringify(pkgNext, null, 2)}\n`);
  }

  return { todosByFile, files };
}

describe('kitchen-sink e2e', () => {
  let app: MigratedApp;

  beforeAll(() => {
    app = migrateKitchenSink();
  });

  it('migrates every kitchen-sink file', () => {
    expect(app.files.sort()).toEqual([
      'App.tsx',
      'columns.tsx',
      'components.tsx',
      'elements.tsx',
      'form.tsx',
      'helpers.tsx',
      'layout.tsx',
      'leftovers.tsx',
    ]);
    for (const file of app.files) {
      const migrated = fs.readFileSync(path.join(tmpDir, 'src', file), 'utf8');
      // Only leftovers.tsx may keep its (trimmed, TODO-annotated) RBC import.
      if (file !== 'leftovers.tsx') {
        expect(migrated).not.toContain('react-bulma-components');
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
    expect(migrated).not.toContain('bulma/css');
  });

  it('migrates the SCSS entry to Bulma v1 modules with folded variables', () => {
    const scss = fs.readFileSync(
      path.join(tmpDir, 'src', 'styles.scss'),
      'utf8'
    );
    expect(scss).toContain("@use 'bulma/sass' with (");
    expect(scss).toContain('$primary: #1e6b99,');
    expect(scss).toContain("$family-primary: 'Nunito', sans-serif");
    expect(scss).toContain("@use '@allxsmith/bestax-bulma/scss/extras';");
    expect(scss).not.toContain('@import');
    expect(scss).toContain('.app-shell');
  });

  it('migrates the package.json dependency set', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf8')
    );
    expect(pkg.dependencies['react-bulma-components']).toBeUndefined();
    expect(pkg.dependencies['@allxsmith/bestax-bulma']).toBe('^5');
    expect(pkg.dependencies.bulma).toBe('^1.0.4');
    expect(pkg.devDependencies['node-sass']).toBeUndefined();
    expect(pkg.devDependencies.sass).toBe('^1.79.0');
    expect(pkg.dependencies.react).toBe('^18.2.0');
  });

  it('annotates every intentionally unsupported pattern in leftovers.tsx', () => {
    const todos = app.todosByFile.get('leftovers.tsx') ?? [];
    const rules = new Set(todos.map(t => t.rule));
    expect(rules).toContain('component:Element');
    expect(rules).toContain('component:Tile');
    expect(rules).toContain('responsive');
    expect(rules).toContain('prop:colorVariant');
    expect(rules).toContain('prop:value');
    expect(rules).toContain('prop:delta');
    expect(todos.length).toBeGreaterThanOrEqual(10);
    const migrated = fs.readFileSync(
      path.join(tmpDir, 'src', 'leftovers.tsx'),
      'utf8'
    );
    expect(migrated).toContain('TODO(bestax-migrate)');
    // Unmappable components keep a trimmed, TODO-annotated RBC import.
    expect(migrated).toMatch(
      /import \{ Element, Tile \} from 'react-bulma-components';/
    );
  });

  it('typechecks the migrated output against @allxsmith/bestax-bulma', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'global.d.ts'),
      "declare module '*.css';\n"
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
