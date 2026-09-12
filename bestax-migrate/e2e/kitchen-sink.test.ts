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
import { compileMigratedScss } from './support/compile-scss.js';

const packageRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const fixtureDir = path.join(packageRoot, 'fixtures', 'kitchen-sink');

// One scratch directory PER PROCESS, not one shared path. `pnpm all` runs
// `test` and `test:coverage` inside a single turbo invocation, so two jest
// processes execute this file at the same time; against a fixed
// `.e2e-tmp/kitchen-sink` they interleave each other's rmSync/cpSync and the
// suite fails claiming the codemod did nothing ("Expected substring: not
// 'react-bulma-components'") on files that migrate correctly in isolation.
// Set BESTAX_E2E_KEEP=1 to leave the directory behind for inspection.
const tmpRoot = path.join(packageRoot, '.e2e-tmp');
fs.mkdirSync(tmpRoot, { recursive: true });
const tmpDir = fs.mkdtempSync(path.join(tmpRoot, 'kitchen-sink-'));

interface MigratedApp {
  todosByFile: Map<string, TodoEntry[]>;
  /** TODOs from the manifest pass, which belongs to no source file. */
  depTodos: TodoEntry[];
  files: string[];
}

function migrateKitchenSink(): MigratedApp {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.cpSync(fixtureDir, tmpDir, { recursive: true });

  // The fixture manifest is not named `package.json` on disk: Dependabot treats
  // any file with that name as a real manifest, whatever the lockfile says, and
  // opened a security-update PR against the sibling rbx fixture's node-sass
  // (#615). This fixture has the same exposure and its own deliberately-old
  // node-sass, so both are renamed. Restore the real name in the scratch copy
  // so the pass under test still sees a genuine manifest.
  fs.renameSync(
    path.join(tmpDir, 'package.input.json'),
    path.join(tmpDir, 'package.json')
  );

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

  return { todosByFile, files, depTodos: pkgTodos };
}

describe('kitchen-sink e2e', () => {
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
    expect(scss).toContain("$family-primary: ('Nunito', sans-serif)");
    expect(scss).toContain("@use '@allxsmith/bestax-bulma/scss/extras';");
    expect(scss).not.toContain('@import');
    expect(scss).toContain('.app-shell');
  });

  it('compiles the migrated SCSS entry with Dart Sass (bestax css mode)', () => {
    const scss = fs.readFileSync(
      path.join(tmpDir, 'src', 'styles.scss'),
      'utf8'
    );
    const { status, diagnostics } = compileMigratedScss(scss);
    expect({ status, diagnostics }).toEqual({ status: 0, diagnostics: '' });
  });

  it('compiles the migrated SCSS entry with Dart Sass (bulma css mode)', () => {
    const original = fs.readFileSync(
      path.join(fixtureDir, 'src', 'styles.scss'),
      'utf8'
    );
    const scss = reactBulmaComponents.transformStyles!(
      'styles.scss',
      original,
      { add: () => {} },
      { cssMode: 'bulma' }
    );
    const { status, diagnostics } = compileMigratedScss(scss ?? original);
    expect({ status, diagnostics }).toEqual({ status: 0, diagnostics: '' });
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
    expect(rules).toContain('prop:remove');
    expect(rules).toContain('prop:subtitle');
    expect(rules).toContain('prop:heading');
    expect(rules).toContain('prop:as');
    expect(rules).toContain('prop:href');
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

  it('documents every TODO rule it emits in the skill reference', () => {
    // A rule with no recipe is a dead end for the user reading the report.
    // rbx and bloomer have had this guard for a while; RBC did not, which is
    // how `prop:as` and `prop:href` reached its output on #662 with no entry
    // in its `unmappables.md` while both siblings gained one.
    const skillDir = path.join(packageRoot, '..', 'skills', 'bestax-migrate');
    const refsDir = path.join(skillDir, 'references', 'react-bulma-components');
    const refs = [
      ...fs
        .readdirSync(refsDir)
        .filter(f => f.endsWith('.md'))
        .map(f => path.join(refsDir, f)),
      path.join(skillDir, 'SKILL.md'),
    ]
      .map(f => fs.readFileSync(f, 'utf8'))
      .join('\n');

    const emitted = new Set<string>();
    for (const todos of app.todosByFile.values()) {
      for (const todo of todos) emitted.add(todo.rule);
    }
    for (const todo of app.depTodos) emitted.add(todo.rule);
    expect(emitted.size).toBeGreaterThan(0);

    // Match documented rule TOKENS, not substrings. `refs.includes(rule)`
    // let `component:List` pass off the text of `component:List.Item`, and
    // the prop fallback matched any backticked occurrence of the word
    // anywhere in prose — so the guard could pass while the rule it was
    // meant to pin went undocumented.
    const tokens = new Set(
      [...refs.matchAll(/(?:component|prop):[A-Za-z][\w.*]*/g)].map(m => m[0])
    );
    // A prop rule may instead be written bare in a row that names the
    // component beside it (`| \`expanded\` on \`Field\` |`).
    const backticked = new Set(
      [...refs.matchAll(/`([A-Za-z][\w.-]*)`/g)].map(m => m[1])
    );

    const documented = (rule: string): boolean => {
      if (tokens.has(rule)) return true;
      if (rule.startsWith('component:')) {
        // A dotted part may be covered by its parent's section, which the
        // reference writes as `component:File.*` or as a section for the
        // parent component itself.
        const parent = rule.slice('component:'.length).split('.')[0];
        return (
          tokens.has(`component:${parent}.*`) ||
          tokens.has(`component:${parent}`)
        );
      }
      if (rule.startsWith('prop:')) {
        return backticked.has(rule.slice('prop:'.length));
      }
      return backticked.has(rule);
    };

    const undocumented = [...emitted].sort().filter(r => !documented(r));
    expect(undocumented).toEqual([]);
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
