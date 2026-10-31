/**
 * Every ported template under templates/ is a complete project StackBlitz
 * can open on its own, credits its upstream, and has its docs entry and
 * screenshot, and every entry and screenshot has its template (#1120, #1121).
 *
 * The checks live in lib/templates.mjs and take a root, so most of this file
 * builds a small fixture repository and breaks one thing at a time. A
 * template is what git tracks, as it is for the mirror's generator, so each
 * fixture is a git repository with its files staged, which is all
 * `git ls-files` reads. The first test runs the checks over the repo, which
 * passes with no template in it.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, it } from 'vitest';
import {
  LICENSES,
  LOCAL_INSTALL_FILES,
  bestaxRangeProblem,
  checkTemplates,
  contrast,
  entryProblems,
  importSpecifiers,
  importedPackage,
  isHttpsUrl,
  isRegistrySpecifier,
  scriptCommands,
  tagProblems,
  templatePaths,
  templatesProblems,
  trackedTemplates,
} from './lib/templates.mjs';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const VERSION = '5.34.3';

const TAGS = {
  favorite: { label: 'Favorite', description: 'Picks', color: '#e64980' },
  form: { label: 'Form', description: 'A form', color: '#0c8599' },
};

const ENTRY = {
  slug: 'login',
  title: 'Login',
  description: 'A sign-in page.',
  author: { name: 'Aldi Duzha', url: 'https://github.com/aldi' },
  source: 'https://github.com/aldi/bulma-login-template',
  sourceSha: 'a'.repeat(40),
  demo: 'https://aldi.github.io/bulma-login-template/',
  license: 'MIT',
  copyright: 'Copyright (c) 2018 Aldi Duzha',
  tags: ['form'],
};

const PACKAGE = {
  name: 'login',
  private: true,
  version: '0.0.0',
  type: 'module',
  scripts: {
    dev: 'vite',
    build: 'tsc -b && vite build',
    preview: 'vite preview',
  },
  dependencies: {
    '@allxsmith/bestax-bulma': '^5.0.0',
    '@fortawesome/fontawesome-free': '^7.2.0',
    react: '^19.2.3',
    'react-dom': '^19.2.3',
  },
  devDependencies: {
    '@types/react': '^19.2.17',
    '@vitejs/plugin-react': '^6.0.3',
    typescript: '^6.0.3',
    vite: '^8.1.0',
  },
};

/** What a scaffold's sources import, so the dependency check has work. */
const SOURCES = {
  'src/main.tsx': [
    "import { StrictMode } from 'react';",
    "import { createRoot } from 'react-dom/client';",
    "import '@allxsmith/bestax-bulma/bestax.css';",
    "import '@fortawesome/fontawesome-free/css/all.min.css';",
    "import './index.css';",
    "import App from './App.tsx';",
    '',
  ].join('\n'),
  'src/App.tsx': [
    'import {',
    '  Button,',
    '  Section,',
    "} from '@allxsmith/bestax-bulma';",
    '',
    '/* Not an import: import x from "commented-out"; */',
    'export default function App() {',
    '  return null;',
    '}',
    '',
  ].join('\n'),
  'src/index.css': '',
  'vite.config.ts': [
    "import { defineConfig } from 'vite';",
    "import react from '@vitejs/plugin-react';",
    'export default defineConfig({ plugins: [react()] });',
    '',
  ].join('\n'),
};

const roots = [];
afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function write(root, path, content) {
  const file = join(root, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

const git = (root, ...args) =>
  execFileSync('git', ['-c', 'init.defaultBranch=main', '-C', root, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

/** Stage every addition and deletion, as `git add` vets a file. */
const stage = root => git(root, 'add', '--all');

/** A template folder that passes, for `entry`, with `pkg` as its manifest. */
function writeTemplate(root, entry = ENTRY, pkg = PACKAGE) {
  const dir = `templates/${entry.slug}`;
  for (const file of [
    'index.html',
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.node.json',
    'public/bestax.svg',
  ]) {
    write(root, `${dir}/${file}`, '');
  }
  for (const [file, content] of Object.entries(SOURCES)) {
    write(root, `${dir}/${file}`, content);
  }
  write(root, `${dir}/package.json`, JSON.stringify(pkg));
  write(
    root,
    `${dir}/LICENSE`,
    `MIT License\n\n${entry.copyright}\n\nCopyright (c) Alex Smith\n`
  );
  write(
    root,
    `${dir}/README.md`,
    `Ported from ${entry.source} at ${entry.sourceSha}.\n`
  );
  write(root, `docs/static/img/templates/${entry.slug}.jpg`, '');
}

/**
 * A repository laid out like this one: the data file, bulma-ui's manifest,
 * and a passing template folder and screenshot per entry unless `folders` is
 * false, all staged.
 */
function tree({
  templates = [ENTRY],
  tags = TAGS,
  version = VERSION,
  folders = true,
} = {}) {
  const root = mkdtempSync(join(tmpdir(), 'templates-'));
  roots.push(root);
  git(root, 'init', '--quiet');
  write(root, 'bulma-ui/package.json', JSON.stringify({ version }));
  write(
    root,
    'docs/src/data/templates.js',
    `export const Tags = ${JSON.stringify(tags)};\n` +
      `export const templates = ${JSON.stringify(templates)};\n`
  );
  if (folders) {
    for (const entry of templates) writeTemplate(root, entry);
  }
  stage(root);
  return root;
}

const problemsOf = (root, overrides = {}) =>
  templatesProblems({
    root,
    tags: TAGS,
    templates: [ENTRY],
    bestaxVersion: VERSION,
    tracked: trackedTemplates(root),
    ...overrides,
  });

/** Assert exactly one problem, matching `pattern`. */
function assertOne(problems, pattern) {
  assert.equal(problems.length, 1, problems.join('\n'));
  assert.match(problems[0], pattern);
}

describe('the repo', () => {
  it('holds every template, entry and screenshot to the rules', async () => {
    assert.deepEqual(await checkTemplates(REPO), []);
  });

  it('ignores what a local install writes, in its root .gitignore', () => {
    // The root file, not a template's own, which ships to the mirror.
    for (const name of LOCAL_INSTALL_FILES) {
      const path = `templates/any-template/${name}`;
      const [source] = git(REPO, 'check-ignore', '--verbose', path).split(':');
      assert.equal(source, '.gitignore', `${path} is ignored at the root`);
    }
  });
});

describe('a tree of templates', () => {
  it('passes with nothing in it', async () => {
    assert.deepEqual(await checkTemplates(tree({ templates: [] })), []);
  });

  it('passes with a complete template', async () => {
    assert.deepEqual(await checkTemplates(tree()), []);
  });

  it('reports an entry with no folder', () => {
    const root = tree({ folders: false });
    write(root, 'docs/static/img/templates/login.jpg', '');
    assertOne(problemsOf(root), /no templates\/login\/ folder that git tracks/);
  });

  it('reports a folder with no entry', () => {
    const root = tree();
    writeTemplate(root, { ...ENTRY, slug: 'stray' });
    stage(root);
    const problems = problemsOf(root);
    assert.ok(
      problems.some(p => /templates\/stray\/ has no entry/.test(p)),
      problems.join('\n')
    );
  });

  it('reports a missing screenshot, and one that belongs to nothing', () => {
    const root = tree();
    rmSync(join(root, 'docs/static/img/templates/login.jpg'));
    write(root, 'docs/static/img/templates/gone.jpg', '');
    const problems = problemsOf(root);
    assert.equal(problems.length, 2, problems.join('\n'));
    assert.match(problems[0], /no docs\/static\/img\/templates\/login\.jpg/);
    assert.match(problems[1], /gone\.jpg belongs to no template/);
  });

  it('reports a slug listed twice', () => {
    assertOne(
      problemsOf(tree(), { templates: [ENTRY, ENTRY] }),
      /listed twice/
    );
  });

  it('reports a malformed slug once, by its entry', () => {
    const root = tree({ folders: false });
    writeTemplate(root, { ...ENTRY, slug: '_sample' });
    stage(root);
    assertOne(
      problemsOf(root, { templates: [{ ...ENTRY, slug: '_sample' }] }),
      /`slug` must be lowercase words/
    );
  });

  it('reports a list that is not an array', () => {
    assertOne(problemsOf(tree(), { templates: {} }), /must be an array/);
  });

  it('reads what git tracks, as the mirror does, and nothing else', () => {
    const root = tree();
    // None of this is tracked, so none of it is a template's yet: a folder
    // being drafted, a local install's lockfile, an image not yet added.
    writeTemplate(root, { ...ENTRY, slug: 'draft' });
    rmSync(join(root, 'docs/static/img/templates/draft.jpg'));
    write(root, 'templates/login/package-lock.json', '{}');
    write(root, 'templates/login/public/hero.jpg', '');
    assert.deepEqual(problemsOf(root), []);
  });

  it('splits the listing into templates the way the generator does', () => {
    const { slugs, files } = templatePaths([
      'templates/CLAUDE.md',
      'templates/eslint.config.js',
      'templates/login/src/App.tsx',
      'templates/hotel/index.html',
    ]);
    assert.deepEqual(slugs, ['hotel', 'login']);
    assert.deepEqual(
      files.map(f => [f.path, f.source]),
      [
        ['hotel/index.html', 'templates/hotel/index.html'],
        ['login/src/App.tsx', 'templates/login/src/App.tsx'],
      ]
    );
  });
});

describe('a template folder', () => {
  const withPackage = pkg => {
    const root = tree({ folders: false });
    writeTemplate(root, ENTRY, pkg);
    stage(root);
    return problemsOf(root);
  };

  it('needs every project file, as git tracks it', () => {
    const root = tree();
    rmSync(join(root, 'templates/login/vite.config.ts'));
    rmSync(join(root, 'templates/login/public'), { recursive: true });
    stage(root);
    const problems = problemsOf(root);
    assert.equal(problems.length, 2, problems.join('\n'));
    assert.match(problems[0], /missing public\/, as git tracks it/);
    assert.match(problems[1], /missing vite\.config\.ts, as git tracks it/);
  });

  it('refuses a tracked file that is gone, a link, or a directory', () => {
    const root = tree();
    symlinkSync('/etc/hosts', join(root, 'templates/login/public/hosts'));
    stage(root);
    rmSync(join(root, 'templates/login/index.html'));
    rmSync(join(root, 'templates/login/src/index.css'));
    mkdirSync(join(root, 'templates/login/src/index.css'));
    const problems = problemsOf(root);
    assert.equal(problems.length, 3, problems.join('\n'));
    assert.match(problems[0], /index\.html is tracked but missing on disk/);
    assert.match(problems[1], /public\/hosts is a symbolic link/);
    assert.match(problems[2], /src\/index\.css is tracked but not a regular/);
  });

  it('refuses a tracked lockfile and ESLint config', () => {
    const root = tree();
    write(root, 'templates/login/package-lock.json', '{}');
    write(root, 'templates/login/eslint.config.js', '');
    stage(root);
    const problems = problemsOf(root);
    assert.equal(problems.length, 2, problems.join('\n'));
    assert.ok(problems.some(p => /eslint\.config\.js; ESLint/.test(p)));
    assert.ok(problems.some(p => /package-lock\.json; a template/.test(p)));
  });

  it('refuses what a local pnpm install writes, when it is forced in', () => {
    const root = tree();
    // The root .gitignore's rules, so `git add` skips them as it does here.
    write(
      root,
      '.gitignore',
      LOCAL_INSTALL_FILES.map(name => `templates/*/${name}\n`).join('')
    );
    write(root, 'templates/login/pnpm-lock.yaml', 'lockfileVersion: 9\n');
    write(root, 'templates/login/pnpm-workspace.yaml', 'packages: []\n');
    stage(root);
    assert.deepEqual(problemsOf(root), [], 'ignored, so not a template file');
    git(root, 'add', '--force', 'templates/login');
    const problems = problemsOf(root);
    assert.equal(problems.length, 2, problems.join('\n'));
    assert.ok(problems.some(p => /pnpm-lock\.yaml; a template/.test(p)));
    assert.ok(
      problems.some(p => /carries pnpm-workspace\.yaml, which a local/.test(p))
    );
  });

  it('needs a package.json that parses to an object', () => {
    const root = tree();
    write(root, 'templates/login/package.json', '{');
    assertOne(problemsOf(root), /package\.json is not valid JSON/);
    write(root, 'templates/login/package.json', '[]');
    assertOne(problemsOf(root), /package\.json is not a JSON object/);
  });

  it('is private', () => {
    assertOne(withPackage({ ...PACKAGE, private: false }), /"private": true/);
  });

  it('keeps the scripts it is run by', () => {
    assertOne(
      withPackage({ ...PACKAGE, scripts: { dev: 'vite', build: 'vite' } }),
      /needs a "preview" script/
    );
  });

  it('drops the lint script and the lint packages', () => {
    const problems = withPackage({
      ...PACKAGE,
      scripts: { ...PACKAGE.scripts, lint: 'eslint .' },
      devDependencies: { ...PACKAGE.devDependencies, eslint: '^10.0.0' },
    });
    assert.equal(problems.length, 2, problems.join('\n'));
    assert.match(problems[0], /keeps the scaffold's "lint" script/);
    assert.match(problems[1], /keeps the lint package eslint/);
  });

  it('takes registry ranges only', () => {
    for (const spec of ['workspace:^', 'catalog:', 'link:../x', 'file:../x']) {
      const problems = withPackage({
        ...PACKAGE,
        devDependencies: { ...PACKAGE.devDependencies, vite: spec },
      });
      assert.equal(problems.length, 1, problems.join('\n'));
      assert.ok(
        problems[0].includes(`devDependencies.vite is "${spec}"`),
        problems[0]
      );
    }
  });

  it('drops bulma', () => {
    assertOne(
      withPackage({
        ...PACKAGE,
        dependencies: { ...PACKAGE.dependencies, bulma: '^1.0.4' },
      }),
      /still depends on bulma/
    );
  });

  it('depends on a bestax range that installs a published release', () => {
    const rest = Object.fromEntries(
      Object.entries(PACKAGE.dependencies).filter(
        ([name]) => name !== '@allxsmith/bestax-bulma'
      )
    );
    // Its import is what the dependency check sees too.
    const missing = withPackage({ ...PACKAGE, dependencies: rest });
    assert.ok(
      missing.some(p => /must depend on @allxsmith\/bestax-bulma/.test(p)),
      missing.join('\n')
    );
    const withRange = range =>
      withPackage({
        ...PACKAGE,
        dependencies: { ...rest, '@allxsmith/bestax-bulma': range },
      });
    for (const range of ['^5.34.3', '^5.0.0', '^4.0.0']) {
      assert.deepEqual(withRange(range), [], range);
    }
    assertOne(withRange('^5.99.0'), /newer than 5\.34\.3/);
    assertOne(withRange('^3.0.0'), /two or more majors behind 5\.34\.3/);
    for (const range of ['5.0.0', '~5.0.0']) {
      assertOne(withRange(range), /give it a caret range, \^5\.34\.3/);
    }
  });

  it("carries the upstream's copyright line and names its source", () => {
    const root = tree();
    write(root, 'templates/login/LICENSE', 'MIT License\n');
    write(root, 'templates/login/README.md', 'A port.\n');
    const problems = problemsOf(root);
    assert.equal(problems.length, 3, problems.join('\n'));
    assert.match(problems[0], /LICENSE does not carry .*Aldi Duzha/);
    assert.match(problems[1], /does not name the upstream repository/);
    assert.match(problems[2], /does not name the upstream commit/);
  });
});

describe('the packages a template needs', () => {
  const without = (section, name) => ({
    ...PACKAGE,
    [section]: Object.fromEntries(
      Object.entries(PACKAGE[section]).filter(([key]) => key !== name)
    ),
  });
  const withPackage = pkg => {
    const root = tree({ folders: false });
    writeTemplate(root, ENTRY, pkg);
    stage(root);
    return problemsOf(root);
  };

  it('include a runtime package its sources import', () => {
    assertOne(
      withPackage(without('dependencies', 'react')),
      /does not declare react, and templates\/login\/src\/main\.tsx imports 'react'/
    );
  });

  it('include a package only a stylesheet import names', () => {
    assertOne(
      withPackage(without('dependencies', '@fortawesome/fontawesome-free')),
      /does not declare @fortawesome\/fontawesome-free, and .*'@fortawesome\/fontawesome-free\/css\/all\.min\.css'/
    );
  });

  it('include the build tools its scripts run', () => {
    assertOne(
      withPackage(without('devDependencies', 'typescript')),
      /does not declare typescript, and the "build" script runs tsc/
    );
  });

  it('include the plugin vite.config.ts imports', () => {
    assertOne(
      withPackage(without('devDependencies', '@vitejs/plugin-react')),
      /does not declare @vitejs\/plugin-react, and templates\/login\/vite\.config\.ts imports/
    );
  });

  it('refuse a command no row maps to a package', () => {
    assertOne(
      withPackage({
        ...PACKAGE,
        scripts: { ...PACKAGE.scripts, dev: 'npx vite' },
      }),
      /"dev" script runs npx, which no row in SCRIPT_BINARIES/
    );
  });

  it('are read from imports, without comments, paths or builtins', () => {
    assert.deepEqual(
      importSpecifiers(
        [
          "import a from 'a';",
          'import {',
          '  b,',
          "} from '@scope/b/sub';",
          "import './side.css';",
          "import type { C } from 'c';",
          "export * from 'd';",
          "export { e } from 'e/deep';",
          "const f = await import('f');",
          "/* import g from 'g'; */",
          'const notAnImport = \'import h from "h"\';',
        ].join('\n')
      ),
      ['a', '@scope/b/sub', './side.css', 'c', 'd', 'e/deep', 'f']
    );
    assert.equal(importedPackage('@scope/b/sub'), '@scope/b');
    assert.equal(importedPackage('e/deep'), 'e');
    for (const specifier of [
      './x',
      '/vite.svg',
      'node:fs',
      'fs',
      'virtual:x',
    ]) {
      assert.equal(importedPackage(specifier), null, specifier);
    }
  });

  it('are read from scripts command by command', () => {
    assert.deepEqual(scriptCommands('tsc -b && vite build'), ['tsc', 'vite']);
    assert.deepEqual(scriptCommands('NODE_ENV=production vite build'), [
      'vite',
    ]);
    assert.deepEqual(scriptCommands('vite; tsc || vite | vite'), [
      'vite',
      'tsc',
      'vite',
      'vite',
    ]);
  });
});

describe('an entry', () => {
  it('passes with every field', () => {
    assert.deepEqual(entryProblems(ENTRY, TAGS), []);
  });

  it('is an object', () => {
    assert.deepEqual(entryProblems(null, TAGS), [
      'every template entry must be an object',
    ]);
  });

  it('has no unknown field', () => {
    assertOne(
      entryProblems({ ...ENTRY, sourceSHA: 'x' }, TAGS),
      /unknown field `sourceSHA`/
    );
  });

  it('needs its text fields', () => {
    const problems = entryProblems(
      { ...ENTRY, title: '', description: ' ' },
      TAGS
    );
    assert.equal(problems.length, 2, problems.join('\n'));
  });

  it("names the upstream's license from the allowlist", () => {
    for (const license of LICENSES) {
      assert.deepEqual(entryProblems({ ...ENTRY, license }, TAGS), [], license);
    }
    for (const license of ['mit', 'Apache 2', 'GPL-3.0', 'TODO', undefined]) {
      assertOne(
        entryProblems({ ...ENTRY, license }, TAGS),
        /`license` must be the upstream's SPDX identifier, one of MIT/
      );
    }
  });

  it('needs an author with a name and an https URL', () => {
    const problems = entryProblems(
      { ...ENTRY, author: { url: 'http://example.com' } },
      TAGS
    );
    assert.equal(problems.length, 2, problems.join('\n'));
    assert.match(problems[0], /author\.name/);
    assert.match(problems[1], /`author\.url` must be an https URL/);
  });

  it('needs https URLs, a full SHA and a copyright line', () => {
    const problems = entryProblems(
      {
        ...ENTRY,
        source: 'github.com/aldi/x',
        demo: 'ftp://example.com',
        sourceSha: 'abc1234',
        copyright: 'MIT License',
      },
      TAGS
    );
    assert.equal(problems.length, 4, problems.join('\n'));
  });

  it('takes known tags, at least one, each once', () => {
    assertOne(entryProblems({ ...ENTRY, tags: [] }, TAGS), /at least one/);
    assertOne(
      entryProblems({ ...ENTRY, tags: ['form', 'blog'] }, TAGS),
      /unknown tag `blog`/
    );
    assertOne(
      entryProblems({ ...ENTRY, tags: ['form', 'form'] }, TAGS),
      /lists a tag twice/
    );
    assertOne(entryProblems({ ...ENTRY, tags: ['form'] }, null), /unknown/);
  });
});

describe('the tags', () => {
  it('pass when complete', () => {
    assert.deepEqual(tagProblems(TAGS), []);
  });

  it('are a non-empty object', () => {
    assertOne(tagProblems({}), /at least one tag/);
    assertOne(tagProblems(null), /at least one tag/);
  });

  it('each need a lowercase key, a label and a description', () => {
    const problems = tagProblems({ Form: { color: '#0c8599' } });
    assert.equal(problems.length, 3, problems.join('\n'));
  });

  it('each need a color a swatch can show in both themes', () => {
    assertOne(
      tagProblems({ form: { ...TAGS.form, color: 'teal' } }),
      /#rrggbb/
    );
    // Pale yellow vanishes on the light background, navy on the dark ones.
    assertOne(
      tagProblems({ form: { ...TAGS.form, color: '#ffe066' } }),
      /against #ffffff/
    );
    const dark = tagProblems({ form: { ...TAGS.form, color: '#1a237e' } });
    assert.equal(dark.length, 2, dark.join('\n'));
  });

  it('computes contrast the way WCAG does', () => {
    assert.equal(contrast('#000000', '#ffffff'), 21);
    assert.equal(contrast('#777777', '#777777'), 1);
  });
});

describe('bestaxRangeProblem', () => {
  it('takes a floor at or below the current release, in its major', () => {
    assert.equal(bestaxRangeProblem('^5.0.0', '5.34.3'), null);
    assert.equal(bestaxRangeProblem('^5.34.3', '5.34.3'), null);
  });

  it('refuses a floor newer than the current release', () => {
    assert.match(bestaxRangeProblem('^5.34.4', '5.34.3'), /newer than/);
    assert.match(bestaxRangeProblem('^6.0.0', '5.34.3'), /newer than/);
  });

  it('tolerates one major behind, and refuses two or more', () => {
    // The release commit that raises the major is gated by no PR, so the
    // templates sweep onto it in a later change rather than all going red.
    assert.equal(bestaxRangeProblem('^5.34.3', '6.0.0'), null);
    assert.equal(bestaxRangeProblem('^5.0.0', '6.2.1'), null);
    assert.match(bestaxRangeProblem('^4.9.9', '6.0.0'), /two or more majors/);
    assert.match(bestaxRangeProblem('^1.0.0', '6.0.0'), /two or more majors/);
  });

  it('reads only a caret range', () => {
    for (const range of ['~5.0.0', '5.0.0', '^5', '>=5', undefined]) {
      assert.match(
        bestaxRangeProblem(range, '5.34.3'),
        /give it a caret range, \^5\.34\.3/,
        String(range)
      );
    }
  });
});

describe('specifiers and URLs', () => {
  it('takes a range or a tag as a registry specifier', () => {
    for (const spec of ['^1.2.3', '>=1 <2', '1.x', 'latest', '*']) {
      assert.ok(isRegistrySpecifier(spec), spec);
    }
    for (const spec of [
      'workspace:*',
      'npm:react@19',
      'git+https://github.com/a/b.git',
      'github:a/b',
      'a/b',
      './local',
      '',
      undefined,
    ]) {
      assert.ok(!isRegistrySpecifier(spec), String(spec));
    }
  });

  it('takes absolute https URLs only', () => {
    assert.ok(isHttpsUrl('https://github.com/aldi'));
    for (const url of ['http://a.b', 'https://', 'not a url', 7]) {
      assert.ok(!isHttpsUrl(url), String(url));
    }
  });
});
