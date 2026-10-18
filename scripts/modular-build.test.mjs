/**
 * Hold the optimize skill's modular build reference to the library's SCSS.
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
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { sectionBody, sectionSpans } from './lib/api-page.mjs';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const SCSS = 'bulma-ui/src/scss';
const REFERENCE = 'skills/bestax-optimize/references/modular-build.md';
const INVENTORY = 'Authoritative bestax extras inventory';

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
