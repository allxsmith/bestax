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

  // The fixture manifest is not named `package.json` on disk: Dependabot treats
  // any file with that name as a real manifest and opened a security-update PR
  // against this one (#615), even though it is codemod input that is never
  // installed. Restore the real name in the scratch copy so the pass under test
  // still sees a genuine manifest.
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

  it('leaves no TODOs outside leftovers.tsx, bar the Modal advisory', () => {
    // `component:Modal` fires on EVERY conversion by design: bestax matches
    // rbx on Escape-to-close and scroll locking since #633, but still renders
    // inline unless `portal` is set. The markup migrates cleanly — this file
    // still typechecks — but that one behaviour differs, and nothing else
    // would tell the user.
    for (const [file, todos] of app.todosByFile) {
      if (file === 'leftovers.tsx') continue;
      const unexpected = todos.filter(t => t.rule !== 'component:Modal');
      expect({ file, todos: unexpected }).toEqual({ file, todos: [] });
    }
    const components = app.todosByFile.get('components.tsx') ?? [];
    expect(components.every(t => t.rule === 'component:Modal')).toBe(true);
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

  it('deletes rbx, bumps Bulma, and reports the extensions', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf8')
    );
    expect(pkg.dependencies.rbx).toBeUndefined();
    // The four extensions are reported, not deleted: a manifest entry is a
    // deliberate declaration and the app's own Sass may import them.
    expect(pkg.dependencies['bulma-badge']).toBe('^3.0.1');
    expect(pkg.dependencies['bulma-tooltip']).toBe('^2.0.2');
    expect(pkg.dependencies['@allxsmith/bestax-bulma']).toBe('^5');
    expect(pkg.dependencies.bulma).toBe('^1.0.4');
    expect(pkg.devDependencies['node-sass']).toBeUndefined();
    expect(pkg.devDependencies.sass).toBe('^1.79.0');
  });

  it('reports the dependency changes and the React 16 peer gap', () => {
    const messages = app.depTodos.map(t => `${t.rule}: ${t.message}`);
    expect(
      messages.some(m => /^deps: removed rbx and bumped bulma/.test(m))
    ).toBe(true);
    expect(
      messages.some(m => /are Bulma extensions rbx depended on/.test(m))
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

  it('documents every TODO rule it emits in the skill reference', () => {
    // A rule with no recipe is a dead end for the user reading the report.
    // `component:Modal` shipped exactly that way — emitted on every Modal
    // conversion, documented nowhere — and only a reviewer caught it.
    const skillDir = path.join(packageRoot, '..', 'skills', 'bestax-migrate');
    const refsDir = path.join(skillDir, 'references', 'rbx');
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
