/**
 * Hold the valid value constants page to the tuples it documents.
 *
 * The page spells each tuple's values out by hand, and nothing compared them
 * with the library, so a value added to or dropped from a tuple left the page
 * wrong with every check green. A public tuple could also go without a row at
 * all, which is how `validTableColors` sat undocumented. This reads the page's
 * tables and the package's own exports and holds each to the other.
 *
 * A row may summarise its tuple instead of listing it: a range, a family such
 * as "the greys", or a value the prop accepts beyond the tuple. Those rows are
 * named in SUMMARISED with the reason, and what they say is not checked. The
 * test fails if one of them starts listing its values plainly, so an exemption
 * cannot outlive its reason.
 *
 * The page also says which tuples the `./constants` subpath serves: the
 * helper tuples in its Constants table, and not the ones in the sections its
 * "not on this subpath" sentence links to. Both halves are read from the page
 * and held to what the subpath actually exports, so a tuple moved into or out
 * of the constants module cannot leave that prose wrong.
 *
 * The exports are read from the built package, which is what a consumer
 * imports, rather than by following the source's re-exports. So this needs the
 * build, and asserts that rather than skipping: `node --test` exits 0 on a
 * skip, and a guard that can be skipped silently guards nothing.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const PKG_DIR = join(REPO, 'bulma-ui');
const PAGE_REL = 'docs/docs/api/helpers/valid-values.md';
const PAGE = join(REPO, ...PAGE_REL.split('/'));

/** Rows whose Values cell describes the tuple rather than listing it. */
const SUMMARISED = new Map([
  ['validColors', 'names the greys and the -bis/-ter shades as families'],
  ['validColorShades', 'elides the numeric steps'],
  ['validSizes', 'gives the spacing steps as a range'],
  ['validTextSizes', 'gives the steps as a range'],
  ['validDisplays', "adds 'none', which the props accept beyond the tuple"],
  ['validFlexGrowShrink', 'gives the steps as a range'],
]);

/** A Values cell that is nothing but backticked, quoted literals. */
const LITERAL_LIST = /^`'[^'`]*'`(?:, `'[^'`]*'`)*$/;

/**
 * The string tuples an entry of the package exports, by name: the root by
 * default, or a subpath such as `/constants`.
 */
function exportedTuples(subpath = '') {
  assert.ok(
    existsSync(join(PKG_DIR, 'dist')),
    'bulma-ui/dist is absent, so the tuples cannot be read. Run ' +
      '`pnpm --filter @allxsmith/bestax-bulma build` first, or the whole ' +
      'gate with `pnpm all`.'
  );
  // By specifier, through the package's own export map, so this reads what a
  // consumer's require() gets.
  const pkg = createRequire(join(PKG_DIR, 'package.json'))(
    `@allxsmith/bestax-bulma${subpath}`
  );
  return new Map(
    Object.entries(pkg).filter(
      ([, value]) =>
        Array.isArray(value) && value.every(v => typeof v === 'string')
    )
  );
}

/** A `##` heading's anchor, as the docs site builds it. */
const slug = heading =>
  heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');

/**
 * Every page table row that names a constant, in page order, with the anchor
 * of the section it sits in. A list rather than a map, so a second row for the
 * same constant is seen rather than overwriting the first.
 */
function pageRows() {
  const rows = [];
  let section = '';
  readFileSync(PAGE, 'utf8')
    .split(/\r?\n/)
    .forEach((line, i) => {
      const heading = /^## (.*)$/.exec(line)?.[1];
      if (heading) section = slug(heading);
      if (!line.startsWith('|')) return;
      // An escaped pipe belongs to its cell.
      const cells = line
        .split(/(?<!\\)\|/)
        .slice(1, -1)
        .map(c => c.trim());
      const name = /^`(\w+)`$/.exec(cells[0] ?? '')?.[1];
      if (name) rows.push({ name, cell: cells[1] ?? '', line: i + 1, section });
    });
  return rows;
}

/** The section anchors the page's "not on this subpath" sentence links to. */
function sectionsOffSubpath() {
  const paragraph = readFileSync(PAGE, 'utf8')
    .split(/\r?\n\s*\r?\n/)
    .find(p => /not on this subpath/.test(p));
  assert.ok(
    paragraph,
    `${PAGE_REL} no longer says which constants are "not on this subpath", ` +
      'so this test cannot hold that claim. Update it with the wording.'
  );
  const anchors = [...paragraph.matchAll(/\]\(#([\w-]+)\)/g)].map(m => m[1]);
  assert.ok(anchors.length > 0, 'the subpath sentence links to no section');
  return anchors;
}

describe(PAGE_REL, () => {
  it('has one row per constant', () => {
    const seen = new Map();
    for (const row of pageRows()) {
      const first = seen.get(row.name);
      assert.ok(
        !first,
        `${PAGE_REL} has two rows for \`${row.name}\`, at lines ${first?.line} ` +
          `and ${row.line}. Keep one.`
      );
      seen.set(row.name, row);
    }
  });

  it('has a row for every tuple the package exports', () => {
    const rows = new Set(pageRows().map(r => r.name));
    const missing = [...exportedTuples().keys()].filter(n => !rows.has(n));
    assert.deepEqual(
      missing,
      [],
      `${PAGE_REL} has no row for ${missing.join(', ')}. Add one, in the ` +
        'Constants table for a helper tuple or in a section of its own for a ' +
        "component's tuple."
    );
  });

  it('lists each tuple exactly, unless the row is a named summary', () => {
    const tuples = exportedTuples();
    for (const { name, cell } of pageRows()) {
      assert.ok(
        tuples.has(name),
        `${PAGE_REL} has a row for \`${name}\`, which the package does not ` +
          'export as a tuple. Remove the row, or fix its name.'
      );
      const listed = LITERAL_LIST.test(cell);
      if (SUMMARISED.has(name)) {
        assert.ok(
          !listed,
          `\`${name}\`'s row now lists its values plainly, so remove it ` +
            'from SUMMARISED in this test and let the row be checked.'
        );
        continue;
      }
      assert.ok(
        listed,
        `\`${name}\`'s row does not list its values as \`'a'\`, \`'b'\`. ` +
          'List every value, or add it to SUMMARISED in this test with the ' +
          'reason it summarises.'
      );
      assert.deepEqual(
        [...cell.matchAll(/`'([^'`]*)'`/g)].map(m => m[1]),
        [...tuples.get(name)],
        `\`${name}\`'s row in ${PAGE_REL} does not match the tuple. Copy ` +
          'the values from the source, in its order.'
      );
    }
  });

  it('names only summaries that have a row', () => {
    const rows = new Set(pageRows().map(r => r.name));
    const stale = [...SUMMARISED.keys()].filter(n => !rows.has(n));
    assert.deepEqual(
      stale,
      [],
      `SUMMARISED names ${stale.join(', ')}, which has no row in ` +
        `${PAGE_REL}. Remove the entry.`
    );
  });

  it('says truly which tuples the ./constants subpath serves', () => {
    const served = exportedTuples('/constants');
    const rows = pageRows();
    const unserved = rows
      .filter(r => r.section === 'constants' && !served.has(r.name))
      .map(r => r.name);
    assert.deepEqual(
      unserved,
      [],
      `${PAGE_REL} lists ${unserved.join(', ')} in its Constants table, ` +
        'which the page says the ./constants subpath serves, but the subpath ' +
        'does not export it. Move the row to a section of its own and link ' +
        'that section from the "not on this subpath" sentence.'
    );
    for (const anchor of sectionsOffSubpath()) {
      const named = rows.filter(r => r.section === anchor);
      assert.ok(
        named.length > 0,
        `the "not on this subpath" sentence links #${anchor}, which has no ` +
          'constant rows under it'
      );
      const onSubpath = named.filter(r => served.has(r.name)).map(r => r.name);
      assert.deepEqual(
        onSubpath,
        [],
        `${PAGE_REL} says the #${anchor} constants are not on the ` +
          `./constants subpath, but it exports ${onSubpath.join(', ')}. ` +
          'Correct the sentence and move the row to the Constants table.'
      );
    }
  });
});
