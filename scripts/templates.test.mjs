/**
 * Every ported template under templates/ is a complete project StackBlitz
 * can open on its own, credits its upstream, and has its docs entry and
 * screenshot, and every entry and screenshot has its template (#1120, #1121).
 *
 * The checks live in lib/templates.mjs and take a root, so most of this file
 * builds a small fixture tree and breaks one thing at a time. The first test
 * runs them over the repo, which passes with no template in it.
 */
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, it } from 'node:test';
import {
  caretAdmits,
  checkTemplates,
  contrast,
  entryProblems,
  isHttpsUrl,
  isRegistrySpecifier,
  tagProblems,
  templatesProblems,
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
    typescript: '^6.0.3',
    vite: '^8.1.0',
  },
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

/** A template folder that passes, for `entry`, with `pkg` as its manifest. */
function writeTemplate(root, entry = ENTRY, pkg = PACKAGE) {
  const dir = `templates/${entry.slug}`;
  for (const file of [
    'index.html',
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.node.json',
    'vite.config.ts',
    'src/App.tsx',
    'src/main.tsx',
    'public/bestax.svg',
  ]) {
    write(root, `${dir}/${file}`, '');
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
 * A tree laid out like the repo: the data file, bulma-ui's manifest, and a
 * passing template folder and screenshot per entry unless `folders` is false.
 */
function tree({
  templates = [ENTRY],
  tags = TAGS,
  version = VERSION,
  folders = true,
} = {}) {
  const root = mkdtempSync(join(tmpdir(), 'templates-'));
  roots.push(root);
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
  return root;
}

const problemsOf = (root, overrides = {}) =>
  templatesProblems({
    root,
    tags: TAGS,
    templates: [ENTRY],
    bestaxVersion: VERSION,
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
    assertOne(problemsOf(root), /no templates\/login\/ folder/);
  });

  it('reports a folder with no entry', () => {
    const root = tree();
    writeTemplate(root, { ...ENTRY, slug: 'stray' });
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
    assertOne(
      problemsOf(root, { templates: [{ ...ENTRY, slug: '_sample' }] }),
      /`slug` must be lowercase words/
    );
  });

  it('reports a list that is not an array', () => {
    assertOne(problemsOf(tree(), { templates: {} }), /must be an array/);
  });

  it('skips hidden folders', () => {
    const root = tree();
    mkdirSync(join(root, 'templates/.cache'));
    assert.deepEqual(problemsOf(root), []);
  });
});

describe('a template folder', () => {
  const withPackage = pkg => {
    const root = tree({ folders: false });
    writeTemplate(root, ENTRY, pkg);
    return problemsOf(root);
  };

  it('needs every project file', () => {
    const root = tree();
    rmSync(join(root, 'templates/login/vite.config.ts'));
    rmSync(join(root, 'templates/login/public'), { recursive: true });
    const problems = problemsOf(root);
    assert.equal(problems.length, 2, problems.join('\n'));
    assert.match(problems[0], /missing public\//);
    assert.match(problems[1], /missing vite\.config\.ts/);
  });

  it('refuses a lockfile and an ESLint config', () => {
    const root = tree();
    write(root, 'templates/login/package-lock.json', '{}');
    write(root, 'templates/login/eslint.config.js', '');
    const problems = problemsOf(root);
    assert.equal(problems.length, 2, problems.join('\n'));
    assert.ok(problems.some(p => /eslint\.config\.js; ESLint/.test(p)));
    assert.ok(problems.some(p => /package-lock\.json; a template/.test(p)));
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

  it('depends on a bestax range the current release satisfies', () => {
    const rest = Object.fromEntries(
      Object.entries(PACKAGE.dependencies).filter(
        ([name]) => name !== '@allxsmith/bestax-bulma'
      )
    );
    assertOne(
      withPackage({ ...PACKAGE, dependencies: rest }),
      /must depend on @allxsmith\/bestax-bulma/
    );
    for (const range of ['^4.0.0', '^5.99.0', '5.0.0', '~5.0.0']) {
      assertOne(
        withPackage({
          ...PACKAGE,
          dependencies: { ...rest, '@allxsmith/bestax-bulma': range },
        }),
        /which 5\.34\.3 does not satisfy; .* \^5\.34\.3/
      );
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
      { ...ENTRY, title: '', description: ' ', license: undefined },
      TAGS
    );
    assert.equal(problems.length, 3, problems.join('\n'));
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

describe('caretAdmits', () => {
  it('admits the same major at or above the floor', () => {
    assert.ok(caretAdmits('^5.0.0', '5.34.3'));
    assert.ok(caretAdmits('^5.34.3', '5.34.3'));
    assert.ok(!caretAdmits('^5.34.4', '5.34.3'));
    assert.ok(!caretAdmits('^4.0.0', '5.34.3'));
  });

  it('holds the minor under 1.0.0, and the patch under 0.1.0', () => {
    assert.ok(caretAdmits('^0.2.0', '0.2.5'));
    assert.ok(!caretAdmits('^0.2.0', '0.3.0'));
    assert.ok(caretAdmits('^0.0.3', '0.0.3'));
    assert.ok(!caretAdmits('^0.0.3', '0.0.4'));
  });

  it('reads only a plain caret range and a plain version', () => {
    assert.ok(!caretAdmits('~5.0.0', '5.0.0'));
    assert.ok(!caretAdmits('^5', '5.0.0'));
    assert.ok(!caretAdmits('^5.0.0', '5.1.0-beta.1'));
    assert.ok(!caretAdmits(undefined, '5.0.0'));
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
