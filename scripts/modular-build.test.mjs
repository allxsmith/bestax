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
 * Sass and Bulma are the ones bulma-ui declares, and `@allxsmith/bestax-bulma`
 * resolves through bulma-ui's `exports`, the way an app's bundler finds it, so
 * a fence naming a path the package does not export fails here as it would
 * there. Bulma's own deprecation warnings are silenced: a compile error is
 * what this is about, and bulma-ui's `scss-deprecations` test holds the
 * library's sources to the warnings.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, it } from 'node:test';
import {
  fenceSpans,
  sectionBody,
  sectionSpans,
  splitLines,
} from './lib/api-page.mjs';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const SCSS = 'bulma-ui/src/scss';
const REFERENCE = 'skills/bestax-optimize/references/modular-build.md';
const INVENTORY = 'Authoritative bestax extras inventory';
const GUIDE = 'docs/docs/guides/getting-started/modular.md';
const BULMA_UI = join(REPO, 'bulma-ui');
const LIBRARY = '@allxsmith/bestax-bulma';

const uiRequire = createRequire(join(BULMA_UI, 'package.json'));
const sass = uiRequire('sass');
/** The folder Bulma is installed in, so `bulma/sass/...` loads from it. */
const BULMA_PARENT = dirname(dirname(uiRequire.resolve('bulma/package.json')));
const { exports: EXPORTS } = JSON.parse(
  readFileSync(join(BULMA_UI, 'package.json'), 'utf8')
);

/** The pages whose `scss` fences are compiled. */
const PAGES = [
  ...readdirSync(join(REPO, 'skills/bestax-optimize'), { recursive: true })
    .map(name => `skills/bestax-optimize/${name.split(sep).join('/')}`)
    .filter(rel => rel.endsWith('.md')),
  GUIDE,
  'docs/docs/skills/optimize.mdx',
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
 * The file an `exports` key sends a subpath of the library to: an exact key,
 * or else the `*` pattern with the longest prefix, as Node resolves them.
 */
function exportTarget(subpath) {
  const pick = value => (typeof value === 'string' ? value : value?.default);
  if (subpath in EXPORTS) return pick(EXPORTS[subpath]);
  const [key] = Object.keys(EXPORTS)
    .filter(k => {
      const [prefix, suffix] = k.split('*');
      return (
        suffix !== undefined &&
        subpath.length >= prefix.length + suffix.length &&
        subpath.startsWith(prefix) &&
        subpath.endsWith(suffix)
      );
    })
    .sort((a, b) => b.indexOf('*') - a.indexOf('*'));
  if (key === undefined) return undefined;
  const [prefix, suffix] = key.split('*');
  const star = subpath.slice(prefix.length, subpath.length - suffix.length);
  return pick(EXPORTS[key])?.replace('*', star);
}

/** Loads `@allxsmith/bestax-bulma` and its subpaths from bulma-ui. */
const libraryImporter = {
  findFileUrl(url) {
    if (url !== LIBRARY && !url.startsWith(`${LIBRARY}/`)) return null;
    const target = exportTarget(`.${url.slice(LIBRARY.length)}`);
    return target === undefined ? null : pathToFileURL(join(BULMA_UI, target));
  },
};

/** Compile SCSS the way an app that installed Bulma and the library would. */
function compile(code) {
  return sass.compileString(code, {
    loadPaths: [BULMA_PARENT],
    importers: [libraryImporter],
    logger: sass.Logger.silent,
  }).css;
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
  }
});

describe('the scss fences in the modular build pages', () => {
  it('finds fences in the skill reference and the Modular guide', () => {
    for (const page of [REFERENCE, GUIDE]) {
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
