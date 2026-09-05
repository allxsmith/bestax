/**
 * End-to-end gate: copy the source-only bloomer kitchen-sink app into
 * .e2e-tmp/, run the codemod on every file, then typecheck the MIGRATED
 * output against the real @allxsmith/bestax-bulma types (workspace
 * dependency — bulma-ui must be built first; turbo orders this).
 *
 * bloomer itself is never installed: the input app is never typechecked, and
 * leftovers.tsx — the file that exercises everything the codemod
 * intentionally refuses to convert — is excluded from the output typecheck
 * and asserted through its TODO annotations instead.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bloomer } from '../src/sources/bloomer/index.js';
import { runTransform } from '../src/runner.js';
import type { TodoEntry } from '../src/types.js';
import { compileMigratedScss } from './support/compile-scss.js';

const packageRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const fixtureDir = path.join(packageRoot, 'fixtures', 'bloomer-kitchen-sink');

// One scratch directory PER PROCESS, not one shared path — see the comment in
// kitchen-sink.test.ts for why (`pnpm all` runs two jest processes over this
// file concurrently). BESTAX_E2E_KEEP=1 leaves it behind for inspection.
const tmpRoot = path.join(packageRoot, '.e2e-tmp');
fs.mkdirSync(tmpRoot, { recursive: true });
const tmpDir = fs.mkdtempSync(path.join(tmpRoot, 'bloomer-kitchen-sink-'));

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
  // any file with that name as a real manifest (#615). Restore the real name in
  // the scratch copy so the pass under test still sees a genuine manifest.
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
    const { output } = runTransform(bloomer.transform, file, source, {
      add: entry => todos.push(entry),
    });
    if (output !== null) fs.writeFileSync(filePath, output);
    todosByFile.set(file, todos);
  }

  const scssPath = path.join(srcDir, 'styles.scss');
  const scssTodos: TodoEntry[] = [];
  const scssOut = bloomer.transformStyles!(
    'styles.scss',
    fs.readFileSync(scssPath, 'utf8'),
    { add: entry => scssTodos.push(entry) },
    { cssMode: 'bestax' }
  );
  if (scssOut !== null) fs.writeFileSync(scssPath, scssOut);
  todosByFile.set('styles.scss', scssTodos);

  const pkgPath = path.join(tmpDir, 'package.json');
  const pkgTodos: TodoEntry[] = [];
  const pkgNext = bloomer.updateDependencies!(
    'package.json',
    JSON.parse(fs.readFileSync(pkgPath, 'utf8')),
    { add: entry => pkgTodos.push(entry) },
    { cssMode: 'bestax', bulmaReferenced: true, sourceStillImported: true }
  );
  if (pkgNext !== null) {
    fs.writeFileSync(pkgPath, `${JSON.stringify(pkgNext, null, 2)}\n`);
  }

  return { todosByFile, files, depTodos: pkgTodos };
}

describe('bloomer kitchen-sink e2e', () => {
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
      // Only leftovers.tsx may keep its (trimmed, TODO-annotated) bloomer import.
      if (file !== 'leftovers.tsx') {
        expect({
          file,
          hasBloomer: /from ["']bloomer["']/.test(migrated),
        }).toEqual({ file, hasBloomer: false });
      }
    }
  });

  it('leaves no TODOs outside leftovers.tsx, bar the Modal advisory', () => {
    // `component:Modal` fires on EVERY conversion by design: bloomer's Modal
    // was an inert shell, and bestax's closes on Escape and locks scroll by
    // default. The markup migrates cleanly — this file still typechecks — but
    // the behaviour differs, and nothing else would tell the user.
    for (const [file, todos] of app.todosByFile) {
      if (file === 'leftovers.tsx') continue;
      const unexpected = todos.filter(t => t.rule !== 'component:Modal');
      expect({ file, todos: unexpected }).toEqual({ file, todos: [] });
    }
    const components = app.todosByFile.get('components.tsx') ?? [];
    expect(components.map(t => t.rule)).toEqual([
      'component:Modal',
      'component:Modal',
    ]);
  });

  it('adopts the bestax combined CSS bundle in App.tsx', () => {
    const migrated = fs.readFileSync(
      path.join(tmpDir, 'src', 'App.tsx'),
      'utf8'
    );
    expect(migrated).toContain('import "@allxsmith/bestax-bulma/bestax.css";');
    expect(migrated).not.toContain('bulma/css/bulma.css');
  });

  it('flattens the three-shape helper props', () => {
    const migrated = fs.readFileSync(
      path.join(tmpDir, 'src', 'helpers.tsx'),
      'utf8'
    );
    expect(migrated).toContain('displayTablet="flex"');
    expect(migrated).toContain('visibilityTouch="hidden"');
    expect(migrated).toContain('displayDesktopOnly="flex"');
    expect(migrated).toContain('visibilityWidescreenOnly="hidden"');
    expect(migrated).toContain('float="right"');
    expect(migrated).toContain('interaction="unselectable"');
  });

  it('renames flat exports onto their dotted bestax compounds', () => {
    const migrated = fs.readFileSync(
      path.join(tmpDir, 'src', 'components.tsx'),
      'utf8'
    );
    expect(migrated).toContain('<Card.Header.Title>');
    expect(migrated).toContain('<Modal.Card.Head>');
    expect(migrated).toContain('<Navbar.Dropdown hoverable>');
    expect(migrated).toContain('<Navbar.DropdownMenu>');
    expect(migrated).toContain('<Pagination.Next href="/p2">');
    expect(migrated).toContain('<Tabs.Item active>');
    expect(migrated).toMatch(
      /import \{[^}]*\bCard\b[^}]*\bNavbar\b[^}]*\} from "@allxsmith\/bestax-bulma"/
    );
  });

  it('migrates the SCSS entry to Bulma v1 modules', () => {
    const scss = fs.readFileSync(
      path.join(tmpDir, 'src', 'styles.scss'),
      'utf8'
    );
    expect(scss).toContain("@use 'bulma/sass' with (");
    expect(scss).not.toContain('~bulma/bulma');
  });

  it('compiles the migrated SCSS entry with Dart Sass', () => {
    const scss = fs.readFileSync(
      path.join(tmpDir, 'src', 'styles.scss'),
      'utf8'
    );
    const { status, diagnostics } = compileMigratedScss(scss);
    expect({ status, diagnostics }).toEqual({ status: 0, diagnostics: '' });
  });

  it("deletes bloomer and bumps the app's own Bulma", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf8')
    );
    expect(pkg.dependencies.bloomer).toBeUndefined();
    expect(pkg.dependencies['@allxsmith/bestax-bulma']).toBe('^5');
    expect(pkg.dependencies.bulma).toBe('^1.0.4');
    expect(pkg.dependencies.react).toBe('^16.2.0');
    expect(pkg.devDependencies['node-sass']).toBeUndefined();
    expect(pkg.devDependencies.sass).toBe('^1.79.0');
  });

  it('reports the dependency changes and the React 16 peer gap', () => {
    const messages = app.depTodos.map(t => `${t.rule}: ${t.message}`);
    expect(messages).toContain('deps: removed bloomer from dependencies');
    expect(messages).toContain(
      'deps: bumped bulma to ^1.0.4 in dependencies (was pre-1.0)'
    );
    expect(messages.some(m => /still import it/.test(m))).toBe(true);
    expect(messages.some(m => m.startsWith('peer-deps: react ^16.2.0'))).toBe(
      true
    );
  });

  it('annotates every intentionally unsupported pattern in leftovers.tsx', () => {
    const todos = app.todosByFile.get('leftovers.tsx') ?? [];
    const rules = new Set(todos.map(t => t.rule));
    for (const rule of [
      'imports',
      'value-reference',
      'component:Tile',
      'component:Nav',
      'component:NavToggle',
      'component:Heading',
      'component:Dropdown',
      'component:DropdownTrigger',
      'component:DropdownMenu',
      'component:DropdownContent',
      'component:Icon',
      'prop:tag',
      'prop:render',
      'prop:isGrid',
      'prop:hasAddons',
      'prop:isAlign',
      'prop:isFullWidth',
      'prop:isLink',
      'prop:isDisplay',
      'prop:isHidden',
      'prop:hasTextColor',
    ]) {
      expect({ rule, present: rules.has(rule) }).toEqual({
        rule,
        present: true,
      });
    }
    const migrated = fs.readFileSync(
      path.join(tmpDir, 'src', 'leftovers.tsx'),
      'utf8'
    );
    expect(migrated).toContain('TODO(bestax-migrate)');
    // Unmappable components keep a trimmed, TODO-annotated bloomer import.
    expect(migrated).toMatch(/from ["']bloomer["']/);
    expect(migrated).toContain('<p className="heading">');
  });

  it('documents every TODO rule it emits in the skill reference', () => {
    // A rule with no recipe is a dead end for the user reading the report.
    const skillDir = path.join(packageRoot, '..', 'skills', 'bestax-migrate');
    const refsDir = path.join(skillDir, 'references', 'bloomer');
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

    // Match documented rule TOKENS, not substrings (see the rbx e2e for why).
    const tokens = new Set(
      [...refs.matchAll(/(?:component|prop):[A-Za-z][\w.*]*/g)].map(m => m[0])
    );
    const backticked = new Set(
      [...refs.matchAll(/`([A-Za-z][\w.-]*)`/g)].map(m => m[1])
    );

    const documented = (rule: string): boolean => {
      if (tokens.has(rule)) return true;
      if (rule.startsWith('component:')) {
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
