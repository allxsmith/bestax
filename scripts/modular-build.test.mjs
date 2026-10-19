/**
 * Hold the optimize skill's modular build pages to the library's SCSS.
 *
 * `skills/bestax-optimize/references/modular-build.md` is what an agent reads
 * to write an app's `styles.scss` from the library's own sources. Its
 * "Authoritative bestax extras inventory" says it lists every extras partial,
 * one line per folder of `bulma-ui/src/scss`, and nothing held it to that: a
 * partial registered after the list was written never reached it, which is
 * how `menu` and `file` went missing.
 *
 * A folder's `_index.scss` decides what ships (`bulma-ui/src/scss/CLAUDE.md`:
 * an unregistered partial ships nothing), so its `@use` list is the truth
 * here. Each inventory line is compared with the index of the folder its path
 * names, and a folder with an index but no line fails as well, so a new
 * folder is noticed too. The comparison is by set: what a line is missing and
 * what it lists that its index does not register are both named.
 *
 * Every `scss` fence in the pages that show a modular build is also compiled
 * as written, since an agent or a reader copies it into an app: the optimize
 * skill's pages, the Modular guide it acts on, and the skill's docs page. Two
 * kinds of mistake shipped in them that only a compile shows. A module Bulma
 * does not have (`bulma/sass/form/input`, where Bulma's is
 * `form/input-textarea`) stops the build with "Can't find stylesheet to
 * import". And Sass names a `@use` after the last part of its URL and refuses
 * two with the same name in one file, so a bestax partial loaded next to the
 * Bulma module it extends needs an `as` when the two end in the same name.
 * The skill's worked example had none.
 *
 * A fence compiles in a throwaway app with bulma-ui and the Bulma it declares
 * linked into its `node_modules`, with the Sass bulma-ui declares. A package
 * URL in it (`bulma/sass/base`, `@allxsmith/bestax-bulma/scss/...`) goes to
 * Node's own resolver, asked from inside that app, and Sass then finds the
 * partial or index file at the path Node answers with. So the library's
 * `exports` are read the way an app reads them, by Node and not by a copy of
 * its rules here, and a path they leave out fails as it does in an app. Sass's
 * own package importer is no substitute, since it reads only `pkg:` URLs and
 * the pages write none. Node resolves with its own conditions rather than the
 * stylesheet ones (`sass`, `style`) a Sass loader asks for, so the two agree
 * only while the library's `scss` exports name no condition but `default`,
 * which a test below holds.
 *
 * Bulma's own deprecation warnings are silenced: a compile error is what this
 * is about, and bulma-ui's `scss-deprecations` test holds the library's
 * sources to the warnings.
 */
import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, dirname, join, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { after, describe, it } from 'node:test';
import {
  fenceSpans,
  sectionBody,
  sectionSpans,
  splitLines,
} from './lib/api-page.mjs';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const SCSS = 'bulma-ui/src/scss';
const SKILL = 'skills/bestax-optimize/SKILL.md';
const REFERENCE = 'skills/bestax-optimize/references/modular-build.md';
const INVENTORY = 'Authoritative bestax extras inventory';
const GUIDE = 'docs/docs/guides/getting-started/modular.md';
const SKILL_PAGE = 'docs/docs/skills/optimize.mdx';
const BULMA_UI = join(REPO, 'bulma-ui');
const LIBRARY = '@allxsmith/bestax-bulma';

const uiRequire = createRequire(join(BULMA_UI, 'package.json'));
const sass = uiRequire('sass');
const BULMA = dirname(uiRequire.resolve('bulma/package.json'));
const { exports: EXPORTS } = JSON.parse(
  readFileSync(join(BULMA_UI, 'package.json'), 'utf8')
);

/** The pages whose `scss` fences are compiled. */
const PAGES = [
  ...readdirSync(join(REPO, 'skills/bestax-optimize'), { recursive: true })
    .map(name => `skills/bestax-optimize/${name.split(sep).join('/')}`)
    .filter(rel => rel.endsWith('.md')),
  GUIDE,
  SKILL_PAGE,
];

/** The folders of `bulma-ui/src/scss` that have an `_index.scss`. */
function indexedFolders() {
  return readdirSync(join(REPO, SCSS), { withFileTypes: true })
    .filter(
      entry =>
        entry.isDirectory() &&
        existsSync(join(REPO, SCSS, entry.name, '_index.scss'))
    )
    .map(entry => entry.name)
    .sort();
}

/** What a folder's `_index.scss` loads, by the URL each `@use` names. */
function registered(folder) {
  const src = readFileSync(join(REPO, SCSS, folder, '_index.scss'), 'utf8');
  return [...src.matchAll(/^\s*@use\s+(['"])(.+?)\1/gm)].map(m => m[2]);
}

/**
 * The inventory as a map from folder to the partial names its line lists.
 * A line is a paragraph opening with a bold label and the folder's path,
 * `**Form** (`@allxsmith/bestax-bulma/scss/form/<name>`):`, and its names are
 * the inline code after that.
 */
function inventory() {
  const src = readFileSync(join(REPO, REFERENCE), 'utf8');
  const { lines, sections } = sectionSpans(src);
  const section = sections.find(s => s.heading === INVENTORY);
  assert.ok(section, `${REFERENCE} has no "## ${INVENTORY}" section`);
  const lineHead =
    /^\*\*[^*]+\*\*\s+\(`@allxsmith\/bestax-bulma\/scss\/([a-z-]+)\/<name>`\):/;
  const out = new Map();
  for (const paragraph of sectionBody(lines, section).split(/\n\s*\n/)) {
    const head = paragraph.match(lineHead);
    if (!head) continue;
    const rest = paragraph.slice(head[0].length);
    out.set(
      head[1],
      [...rest.matchAll(/`([^`]+)`/g)].map(m => m[1])
    );
  }
  return out;
}

/**
 * `href` with the links in its folder followed. Node follows them for a file
 * it finds and not for a path it only maps, so without this a file could load
 * under two URLs, and Sass keys a module by its URL.
 */
function realHref(href) {
  const path = fileURLToPath(href);
  const folder = dirname(path);
  return existsSync(folder)
    ? pathToFileURL(join(realpathSync(folder), basename(path)))
    : new URL(href);
}

/**
 * A throwaway app with `links` (package name to folder) in its
 * `node_modules`, and a `compile` for SCSS written in it. `import.meta.resolve`
 * in the app's own module answers for a package URL; it gives the path a
 * specifier maps to even when no file is there, which is what lets Sass then
 * look for the partial. The caller removes `dir`.
 */
async function appWith(links) {
  const dir = mkdtempSync(join(tmpdir(), 'bestax-modular-build-'));
  for (const [name, target] of Object.entries(links)) {
    const link = join(dir, 'node_modules', ...name.split('/'));
    mkdirSync(dirname(link), { recursive: true });
    symlinkSync(target, link, 'junction');
  }
  const resolver = join(dir, 'resolve.mjs');
  writeFileSync(
    resolver,
    'export const resolve = specifier => import.meta.resolve(specifier);\n'
  );
  const { resolve } = await import(pathToFileURL(resolver).href);
  const packages = {
    findFileUrl(url) {
      // A URL with a scheme, or a relative one, is not a package's.
      if (/^[a-z][\w+.-]*:|^[./]/i.test(url)) return null;
      return realHref(resolve(url));
    },
  };
  const compile = code =>
    sass.compileString(code, {
      importers: [packages],
      logger: sass.Logger.silent,
    }).css;
  return { dir, compile };
}

const app = await appWith({ [LIBRARY]: BULMA_UI, bulma: BULMA });
after(() => rmSync(app.dir, { recursive: true, force: true }));
const { compile } = app;

/** Every condition an `exports` target names, at any depth. */
function conditionsOf(target) {
  if (target === null || typeof target === 'string') return [];
  if (Array.isArray(target)) return target.flatMap(conditionsOf);
  return Object.entries(target).flatMap(([condition, value]) => [
    condition,
    ...conditionsOf(value),
  ]);
}

/** A page's `scss` fences, each with the line its opening fence is on. */
function scssFences(rel) {
  const { lines } = splitLines(readFileSync(join(REPO, rel), 'utf8'));
  return fenceSpans(lines)
    .filter(({ open }) => /^ {0,3}(`{3,}|~{3,})\s*scss\b/.test(lines[open]))
    .map(({ open, close }) => ({
      code: lines.slice(open + 1, close).join('\n'),
      line: open + 1,
    }));
}

const folders = indexedFolders();
const listed = inventory();

describe('the optimize skill’s extras inventory', () => {
  it('has a line for each folder with an index, and only those', () => {
    const missing = folders.filter(folder => !listed.has(folder));
    const extra = [...listed.keys()].filter(f => !folders.includes(f));
    assert.deepEqual(
      { missing, extra },
      { missing: [], extra: [] },
      `${REFERENCE} needs an inventory line for each folder of ${SCSS} ` +
        'that has an _index.scss (missing), and none for a folder without ' +
        'one (extra)'
    );
  });

  for (const folder of folders) {
    it(`lists exactly what ${folder}/_index.scss registers`, () => {
      const index = registered(folder);
      const line = listed.get(folder) ?? [];
      const missing = index.filter(name => !line.includes(name));
      const extra = line.filter(name => !index.includes(name));
      assert.deepEqual(
        { missing, extra },
        { missing: [], extra: [] },
        `the ${folder} line in ${REFERENCE} is out of step with ` +
          `${SCSS}/${folder}/_index.scss: add what it registers and the ` +
          'line lacks (missing), and drop what the line lists that it does ' +
          'not register (extra)'
      );
    });

    it(`serves each ${folder} partial it lists at the path it gives`, () => {
      // An app writes this `@use` for each name, and it reaches the partial
      // only through the library's exports, which the line above never reads.
      const broken = [];
      for (const name of listed.get(folder) ?? []) {
        try {
          compile(`@use '${LIBRARY}/scss/${folder}/${name}';`);
        } catch (error) {
          broken.push(`${name}: ${error.message.split('\n')[0]}`);
        }
      }
      assert.deepEqual(
        broken,
        [],
        `the ${folder} line in ${REFERENCE} names partials an app cannot ` +
          `load as ${LIBRARY}/scss/${folder}/<name>`
      );
    });
  }
});

describe('the scss fences in the modular build pages', () => {
  it('finds fences in each page that shows a modular build', () => {
    // A fence this file stops finding (one nested deeper in a list, say)
    // yields no case below rather than a failing one, so each page that
    // shows one is named here. A page PAGES picks up later is not held to
    // having one.
    for (const page of [SKILL, REFERENCE, GUIDE, SKILL_PAGE]) {
      assert.ok(scssFences(page).length > 0, `no scss fence found in ${page}`);
    }
  });

  it('loads the library through its exports', () => {
    assert.match(
      compile(`@use '${LIBRARY}/scss/components/menu' as bestax-menu;`),
      /forced-colors/
    );
    assert.ok(compile(`@use '${LIBRARY}/scss';`).length > 0);
  });

  it('refuses a path the library does not export', () => {
    assert.throws(
      () => compile(`@use '${LIBRARY}/src/scss/components/menu';`),
      /not defined by "exports"/
    );
  });

  it('puts the match in place of every * in an exports target', async t => {
    // Node's rule. A target can name the match more than once, which a
    // hand-written copy of the rule in this file once missed.
    const fixture = await appWith({});
    t.after(() => rmSync(fixture.dir, { recursive: true, force: true }));
    const pkg = join(fixture.dir, 'node_modules', '@fixture', 'stars');
    mkdirSync(join(pkg, 'src', 'dark'), { recursive: true });
    writeFileSync(
      join(pkg, 'package.json'),
      JSON.stringify({
        name: '@fixture/stars',
        exports: { './themes/*': './src/*/_*.scss' },
      })
    );
    writeFileSync(join(pkg, 'src', 'dark', '_dark.scss'), '.dark { a: b; }');
    assert.match(
      fixture.compile(`@use '@fixture/stars/themes/dark';`),
      /\.dark/
    );
  });

  it('gives the library’s scss exports no condition but default', () => {
    const conditions = Object.entries(EXPORTS)
      .filter(([key]) => key === './scss' || key.startsWith('./scss/'))
      .flatMap(([, target]) => conditionsOf(target));
    assert.deepEqual(
      conditions.filter(condition => condition !== 'default'),
      [],
      'Node, which resolves these here, and a Sass loader in an app take ' +
        'different conditions, so a scss export that names a condition ' +
        'other than default can land on a different file in an app than ' +
        'it does in this test'
    );
  });

  it('fails on a bestax partial that clashes with its Bulma module', () => {
    assert.throws(
      () =>
        compile(
          `@use 'bulma/sass/components/tabs';\n` +
            `@use '${LIBRARY}/scss/components/tabs';`
        ),
      /already a module with namespace "tabs"/
    );
  });

  it('compiles the Modular guide’s Option C blocks as one stylesheet', () => {
    // A reader builds one file from the blocks under these headings, so a
    // Bulma module in one block and the bestax partial extending it in
    // another clash only once they are joined. The complete example after
    // them is a stylesheet of its own and repeats their URLs.
    const { lines } = splitLines(readFileSync(join(REPO, GUIDE), 'utf8'));
    // A heading's line number, counted from 1 like a fence's, or 0.
    const lineOf = heading => lines.indexOf(heading) + 1;
    const from = lineOf('#### Required base styles');
    const to = lineOf('#### Complete example');
    assert.ok(from > 0 && to > from, `${GUIDE} lost an Option C heading`);
    const blocks = scssFences(GUIDE).filter(
      ({ line }) => line > from && line < to
    );
    assert.ok(blocks.length > 1, `${GUIDE} has no Option C blocks to join`);
    compile(blocks.map(({ code }) => code).join('\n'));
  });

  for (const page of PAGES) {
    for (const { code, line } of scssFences(page)) {
      it(`${page}: the fence opening on line ${line} compiles`, () => {
        try {
          compile(code);
        } catch (error) {
          assert.fail(
            `${page}: the scss fence opening on line ${line} does not ` +
              'compile as written, and a reader copies it into an app.\n' +
              error.message
          );
        }
      });
    }
  }
});
