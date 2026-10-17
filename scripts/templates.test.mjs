/**
 * Every project under templates/ holds to scripts/lib/templates.mjs, whose
 * header lists the rules, and the root lint reaches each one's sources.
 *
 * Three parts. The first runs the rules over this repo, one test per
 * template plus one for the tree. With no templates it checks only that
 * NOTICE keeps its Templates section and that nothing (a data entry, a
 * screenshot, a NOTICE line) names a folder that is not there. The docs data
 * file may not exist yet: the Templates page adds it (#1120), and until then
 * the rules pass so long as there is no template to need it.
 *
 * The second proves each rule on a fixture, a small tree shaped like this
 * repo in scripts/fixtures/templates-repo, holding one complete template
 * with its data entry, screenshot and NOTICE line. That tree passes as it
 * is, and each case copies it, breaks one thing, and checks the rule for
 * that thing fails. The fixture lives outside templates/, so the first part
 * never sees it.
 *
 * The third is about the lint. The root `pnpm lint` runs ESLint over every
 * template's `src/` with `--no-error-on-unmatched-pattern`, so it passes with
 * no templates. The flag would also pass a template whose files were all
 * ignored, so this asks ESLint itself, the way `pnpm lint` runs it, whether
 * each template source is linted and with `no-bulma-component-class` at
 * error. It then lints the fixture's sources as if they sat in templates/:
 * they pass, and a raw Bulma component class fails. templates/eslint.config.js
 * loads the ESLint plugin's build, so that part needs it built first, like
 * eslint-plugin-docs.test.mjs.
 */
import assert from 'node:assert/strict';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { ESLint } from 'eslint';
import {
  DATA_FILE,
  NOTICE_FILE,
  REQUIRED_DIRS,
  REQUIRED_FILES,
  SCREENSHOTS_DIR,
  TEMPLATES_DIR,
  checkTemplates,
  copyrightHolder,
  noticeLines,
  readTemplateData,
  templateSlugs,
} from './lib/templates.mjs';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const FIXTURE = join(REPO, 'scripts', 'fixtures', 'templates-repo');
const SLUG = 'example';
const TEMPLATE = `${TEMPLATES_DIR}/${SLUG}`;
/** The fixture's version and holder, so the real repo's never move it. */
const OPTIONS = { libraryVersion: '5.1.0', holder: 'Alex Smith' };
const RULE = '@allxsmith/bestax/no-bulma-component-class';

/** Every problem in a report, the template's and the tree's together. */
const allProblems = report => [
  ...Object.values(report.templates).flat(),
  ...report.tree,
];

/** Copy the fixture, let `mutate` break it, and return the report. */
async function checkMutated(mutate) {
  const root = mkdtempSync(join(tmpdir(), 'templates-'));
  try {
    cpSync(FIXTURE, root, { recursive: true });
    const at = path => join(root, path);
    await mutate({
      at,
      write: (path, text) => {
        mkdirSync(dirname(at(path)), { recursive: true });
        writeFileSync(at(path), text);
      },
      edit: (path, fn) =>
        writeFileSync(at(path), fn(readFileSync(at(path), 'utf8'))),
      json: (path, fn) => {
        const value = JSON.parse(readFileSync(at(path), 'utf8'));
        fn(value);
        writeFileSync(at(path), JSON.stringify(value, null, 2));
      },
      remove: path => rmSync(at(path), { recursive: true, force: true }),
    });
    return await checkTemplates(root, OPTIONS);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

/** Assert that breaking the fixture with `mutate` reports `expected`. */
async function assertReports(mutate, expected) {
  const problems = allProblems(await checkMutated(mutate));
  assert.ok(
    problems.some(problem => expected.test(problem)),
    `expected a problem matching ${expected}, got:\n${problems.join('\n')}`
  );
}

const PKG = `${TEMPLATE}/package.json`;
const LICENSE = `${TEMPLATE}/LICENSE`;
const README = `${TEMPLATE}/README.md`;
const SHA = '0123456789abcdef0123456789abcdef01234567';
const SOURCE = 'https://github.com/example/bulma-example-template';

describe('the template projects in this repo', async () => {
  const report = await checkTemplates();

  it('names a folder for every data entry, screenshot and NOTICE line', () => {
    assert.deepEqual(report.tree, []);
  });

  for (const slug of report.slugs) {
    it(`${TEMPLATES_DIR}/${slug}`, () => {
      assert.deepEqual(report.templates[slug], []);
    });
  }
});

describe('the template rules, on a fixture', () => {
  it('pass the fixture as it is', async () => {
    const report = await checkTemplates(FIXTURE, OPTIONS);
    assert.deepEqual(report.slugs, [SLUG]);
    assert.deepEqual(allProblems(report), []);
  });

  it('pass a tree with no templates and no docs data yet', async () => {
    const report = await checkMutated(({ remove, write, edit }) => {
      remove(TEMPLATE);
      remove(DATA_FILE);
      remove(SCREENSHOTS_DIR);
      edit(NOTICE_FILE, text =>
        text.replace(/^templates\/example .*$/m, '').trimEnd()
      );
      // Files and dot-folders beside the templates are not templates.
      write(`${TEMPLATES_DIR}/CLAUDE.md`, '# guide\n');
      write(`${TEMPLATES_DIR}/.cache/state`, '');
    });
    assert.deepEqual(report.slugs, []);
    assert.deepEqual(allProblems(report), []);
  });

  it('pass a tree with no templates/ folder at all', async () => {
    const report = await checkMutated(({ remove }) => {
      remove(TEMPLATES_DIR);
      remove(DATA_FILE);
      remove(SCREENSHOTS_DIR);
    });
    assert.deepEqual(report.slugs, []);
  });

  describe('the files', () => {
    for (const file of REQUIRED_FILES) {
      it(`fail a template with no ${file}`, () =>
        assertReports(
          ({ remove }) => remove(`${TEMPLATE}/${file}`),
          new RegExp(`${TEMPLATE} has no ${file.replaceAll('.', '\\.')}\\.$`)
        ));
    }
    for (const sub of REQUIRED_DIRS) {
      it(`fail a template with no ${sub}/ folder`, () =>
        assertReports(
          ({ remove }) => remove(`${TEMPLATE}/${sub}`),
          new RegExp(`has no ${sub}/ folder`)
        ));
    }
    it('fail a folder name that is not a kebab-case slug', () =>
      assertReports(
        ({ at }) =>
          renameSync(at(TEMPLATE), at(`${TEMPLATES_DIR}/Example_Template`)),
        /Example_Template is not a kebab-case slug/
      ));
  });

  describe('the manifest', () => {
    it('fail one that cannot be parsed', () =>
      assertReports(
        ({ write }) => write(PKG, '{ "private": true,'),
        /package\.json could not be read as JSON/
      ));
    it('fail one that is not private', () =>
      assertReports(
        ({ json }) => json(PKG, pkg => delete pkg.private),
        /is not `"private": true`/
      ));
    for (const spec of ['workspace:^', 'link:../react', 'file:../react']) {
      const protocol = spec.slice(0, spec.indexOf(':') + 1);
      it(`fail a ${protocol} specifier`, () =>
        assertReports(
          ({ json }) => json(PKG, pkg => (pkg.dependencies.react = spec)),
          new RegExp(`not a registry range\\. \`${protocol}\` only means`)
        ));
    }
    it('fail a catalog: specifier', () =>
      assertReports(
        ({ json }) => json(PKG, pkg => (pkg.devDependencies.vite = 'catalog:')),
        /vite "catalog:" in devDependencies, which is not a registry range/
      ));
    it('fail a git specifier', () =>
      assertReports(
        ({ json }) =>
          json(PKG, pkg => (pkg.dependencies.react = 'github:facebook/react')),
        /not a registry range\. StackBlitz installs/
      ));
    for (const section of ['dependencies', 'devDependencies']) {
      it(`fail bulma in ${section}`, () =>
        assertReports(
          ({ json }) => json(PKG, pkg => (pkg[section].bulma = '^1.0.4')),
          new RegExp(`has bulma in ${section}`)
        ));
    }
    it('fail a manifest without the library', () =>
      assertReports(
        ({ json }) =>
          json(PKG, pkg => delete pkg.dependencies['@allxsmith/bestax-bulma']),
        /has no @allxsmith\/bestax-bulma in dependencies/
      ));
    it('fail the library only as a devDependency', () =>
      assertReports(
        ({ json }) =>
          json(PKG, pkg => {
            delete pkg.dependencies['@allxsmith/bestax-bulma'];
            pkg.devDependencies['@allxsmith/bestax-bulma'] = '^5.0.0';
          }),
        /has no @allxsmith\/bestax-bulma in dependencies/
      ));
    it('fail a library range the current version does not satisfy', () =>
      assertReports(
        ({ json }) =>
          json(
            PKG,
            pkg => (pkg.dependencies['@allxsmith/bestax-bulma'] = '^4.0.0')
          ),
        /"\^4\.0\.0", which the library's current version, 5\.1\.0, does not/
      ));
    for (const name of ['eslint', '@eslint/js', 'globals']) {
      it(`fail ${name} left from the scaffold`, () =>
        assertReports(
          ({ json }) =>
            json(PKG, pkg => (pkg.devDependencies[name] = '^1.0.0')),
          new RegExp(`has ${name} in devDependencies\\. A template carries`)
        ));
    }
    it('fail a lint script left from the scaffold', () =>
      assertReports(
        ({ json }) => json(PKG, pkg => (pkg.scripts.lint = 'eslint .')),
        /has a lint script/
      ));
  });

  describe('the sources', () => {
    for (const path of ['eslint.config.js', 'src/eslint.config.mjs']) {
      it(`fail an ESLint config at ${path}`, () =>
        assertReports(
          ({ write }) => write(`${TEMPLATE}/${path}`, 'export default [];\n'),
          new RegExp(`${path.replace(/\./g, '\\.')} would replace`)
        ));
    }
    it('pass an ESLint config inside node_modules or dist', async () => {
      const report = await checkMutated(({ write }) => {
        write(`${TEMPLATE}/node_modules/x/eslint.config.js`, '');
        write(`${TEMPLATE}/dist/eslint.config.js`, '');
      });
      assert.deepEqual(allProblems(report), []);
    });
    it('fail a TODO(bestax-migrate) left in src/', () =>
      assertReports(
        ({ edit }) =>
          edit(
            `${TEMPLATE}/src/App.tsx`,
            text => `${text}// TODO(bestax-migrate): family:navbar-burger\n`
          ),
        /src\/App\.tsx still has a TODO\(bestax-migrate\)/
      ));
  });

  describe('the LICENSE', () => {
    it('fail one without the upstream copyright line', () =>
      assertReports(
        ({ edit }) =>
          edit(LICENSE, text =>
            text.replace('Copyright (c) 2024 Example Author', '')
          ),
        /LICENSE has no upstream copyright line/
      ));
    it("fail one without the port's notice", () =>
      assertReports(
        ({ edit }) => edit(LICENSE, text => text.split('\n---\n')[0]),
        /LICENSE has no notice for the bestax port, a copyright line naming Alex Smith/
      ));
    it("fail one with the port's notice first", () =>
      assertReports(
        ({ edit }) =>
          edit(LICENSE, text =>
            text.split('\n---\n').reverse().join('\n---\n')
          ),
        /LICENSE puts the port's notice first/
      ));
  });

  describe('the attribution', () => {
    it('fail a template the docs data has no entry for', () =>
      assertReports(
        ({ write }) => write(DATA_FILE, 'export const templates = [];\n'),
        /has no entry with slug "example", so the Templates page has no card/
      ));
    it('fail a template while the docs data does not exist', () =>
      assertReports(
        ({ remove }) => remove(DATA_FILE),
        /docs\/src\/data\/templates\.js does not exist, so templates\/example/
      ));
    for (const field of ['source', 'sourceSha']) {
      it(`fail a data entry with no ${field}`, () =>
        assertReports(
          ({ edit }) =>
            edit(DATA_FILE, text => text.replace(`    ${field}:`, '    _:')),
          new RegExp(`entry for "example" has no ${field}`)
        ));
    }
    it('fail a README that does not name the upstream repo', () =>
      assertReports(
        ({ edit }) => edit(README, text => text.replaceAll(SOURCE, '')),
        /README\.md does not name the upstream repo/
      ));
    it('fail a README that does not name the commit', () =>
      assertReports(
        ({ edit }) => edit(README, text => text.replaceAll(SHA, 'main')),
        /README\.md does not name the commit it was ported from/
      ));
    it('fail a template with no screenshot', () =>
      assertReports(
        ({ remove }) => remove(`${SCREENSHOTS_DIR}/example.jpg`),
        /img\/templates\/example\.jpg does not exist/
      ));
    it('fail a template with no NOTICE line', () =>
      assertReports(
        ({ edit }) =>
          edit(NOTICE_FILE, text =>
            text.replace(/^templates\/example .*$/m, '')
          ),
        /NOTICE's Templates section has no line for templates\/example/
      ));
    it('fail a NOTICE line that does not link the upstream', () =>
      assertReports(
        ({ edit }) => edit(NOTICE_FILE, text => text.replace(SOURCE, '')),
        /NOTICE's line for templates\/example does not link its upstream repo/
      ));
  });

  describe('the tree', () => {
    it('fail a NOTICE without its Templates section', () =>
      assertReports(
        ({ edit }) =>
          edit(NOTICE_FILE, text => text.replace(/^Templates$/m, 'Ports')),
        /NOTICE has no "Templates" section/
      ));
    it('fail a NOTICE that does not exist', () =>
      assertReports(
        ({ remove }) => remove(NOTICE_FILE),
        /NOTICE has no "Templates" section/
      ));
    it('fail a data entry with no folder', () =>
      assertReports(
        ({ edit }) =>
          edit(DATA_FILE, text =>
            text.replace(/\];\s*$/, "  { slug: 'ghost' },\n];\n")
          ),
        /has an entry for templates\/ghost, which does not exist/
      ));
    it('fail two entries for one template', () =>
      assertReports(
        ({ edit }) =>
          edit(DATA_FILE, text =>
            text.replace(/\];\s*$/, "  { slug: 'example' },\n];\n")
          ),
        /has more than one entry for "example"/
      ));
    it('fail an entry with no slug', () =>
      assertReports(
        ({ edit }) =>
          edit(DATA_FILE, text =>
            text.replace(/\];\s*$/, "  { title: 'Nameless' },\n];\n")
          ),
        /entry at index 1 has no slug/
      ));
    it('fail a screenshot with no folder', () =>
      assertReports(
        ({ write }) => write(`${SCREENSHOTS_DIR}/ghost.jpg`, ''),
        /img\/templates\/ghost\.jpg belongs to no folder in templates\//
      ));
    it('pass a file in the screenshots folder that is not one', async () => {
      const report = await checkMutated(({ write }) =>
        write(`${SCREENSHOTS_DIR}/.gitkeep`, '')
      );
      assert.deepEqual(allProblems(report), []);
    });
    it('fail a NOTICE line with no folder', () =>
      assertReports(
        ({ edit }) =>
          edit(
            NOTICE_FILE,
            text => `${text}\ntemplates/ghost is a port of something.\n`
          ),
        /NOTICE has a line for templates\/ghost, which does not exist/
      ));
  });

  describe('reading the docs data', () => {
    it('is null while the file does not exist', async () => {
      assert.equal(await readTemplateData(join(FIXTURE, 'nowhere')), null);
    });
    it('throws on a file without a templates array', async () => {
      await assert.rejects(
        checkMutated(({ write }) =>
          write(DATA_FILE, 'export const Templates = [];\n')
        ),
        /has no `templates` array export/
      );
    });
    it('throws on a file that imports something', async () => {
      await assert.rejects(
        checkMutated(({ write }) =>
          write(
            DATA_FILE,
            "import { tags } from './tags.js';\nexport const templates = tags;\n"
          )
        ),
        /could not be loaded on its own: .*has to import nothing/
      );
    });
  });

  describe('the helpers', () => {
    it('read the holder off a copyright line', () => {
      assert.equal(
        copyrightHolder('Copyright (c) 2025 Alex Smith\n'),
        'Alex Smith'
      );
      assert.equal(
        copyrightHolder('MIT\n\n© 2019-2021, Jane Doe.\n'),
        'Jane Doe'
      );
      assert.equal(
        copyrightHolder('Copyright (c) 2026 - github.com/aldi\n'),
        'github.com/aldi'
      );
    });
    it('read the port holder from the root LICENSE', () => {
      assert.equal(
        copyrightHolder(readFileSync(join(REPO, 'LICENSE'), 'utf8')),
        'Alex Smith'
      );
    });
    it('throw on a license with no copyright line', () => {
      assert.throws(
        () => copyrightHolder('MIT License\n'),
        /no copyright line/
      );
    });
    it('read the NOTICE lines under the Templates heading only', () => {
      const lines = noticeLines(
        'templates/early is not in the section.\n\nTemplates\n\n' +
          'templates/login is a port of a login page.\n'
      );
      assert.deepEqual([...lines.keys()], ['login']);
      assert.equal(noticeLines('No section here.\n'), null);
    });
    it('list no templates for a root without the folder', () => {
      assert.deepEqual(templateSlugs(join(FIXTURE, 'nowhere')), []);
    });
  });
});

describe('the templates lint', async () => {
  // The way `pnpm lint` runs it: from the root, each file finding its config.
  const eslint = new ESLint({ cwd: REPO });
  const fixtureTemplate = join(FIXTURE, TEMPLATE);
  /** A template's TypeScript sources, the files `pnpm lint` reaches. */
  const sources = dir =>
    existsSync(join(dir, 'src'))
      ? readdirSync(join(dir, 'src'), { recursive: true })
          .filter(path => /\.tsx?$/.test(path))
          .map(path => join(dir, 'src', path))
          .sort()
      : [];
  /** Where a fixture source would sit as a real template's. */
  const asTemplate = file =>
    join(REPO, TEMPLATES_DIR, SLUG, relative(fixtureTemplate, file));

  it('lints every template source with no-bulma-component-class at error', async () => {
    const real = templateSlugs().flatMap(slug =>
      sources(join(REPO, TEMPLATES_DIR, slug))
    );
    const files = [...real, ...sources(fixtureTemplate).map(asTemplate)];
    assert.ok(files.length > 0);
    for (const file of files) {
      const at = relative(REPO, file);
      assert.equal(await eslint.isPathIgnored(file), false, `${at} is ignored`);
      const config = await eslint.calculateConfigForFile(file);
      assert.deepEqual(config?.rules?.[RULE], [2], `${at}: ${RULE}`);
    }
  });

  it("passes the fixture template's sources", async () => {
    for (const file of sources(fixtureTemplate)) {
      const [result] = await eslint.lintText(readFileSync(file, 'utf8'), {
        filePath: asTemplate(file),
      });
      assert.deepEqual(
        result.messages.map(
          m => `${m.line}:${m.column} ${m.ruleId} ${m.message}`
        ),
        [],
        relative(FIXTURE, file)
      );
    }
  });

  it('fails a raw Bulma component class', async () => {
    const file = join(fixtureTemplate, 'src', 'components', 'SiteFooter.tsx');
    const code = readFileSync(file, 'utf8').replace(
      '<Content textAlign="centered">',
      '<Content textAlign="centered">\n        <button className="button">Go</button>'
    );
    const [result] = await eslint.lintText(code, {
      filePath: asTemplate(file),
    });
    const hits = result.messages.filter(m => m.ruleId === RULE);
    assert.equal(hits.length, 1, JSON.stringify(result.messages));
    assert.equal(hits[0].severity, 2);
  });
});
