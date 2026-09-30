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

/** The string tuples the package root exports, by name. */
function exportedTuples() {
  assert.ok(
    existsSync(join(PKG_DIR, 'dist')),
    'bulma-ui/dist is absent, so the tuples cannot be read. Run ' +
      '`pnpm --filter @allxsmith/bestax-bulma build` first, or the whole ' +
      'gate with `pnpm all`.'
  );
  // By specifier, through the package's own export map, so this reads what a
  // consumer's require() gets.
  const pkg = createRequire(join(PKG_DIR, 'package.json'))(
    '@allxsmith/bestax-bulma'
  );
  return new Map(
    Object.entries(pkg).filter(
      ([, value]) =>
        Array.isArray(value) && value.every(v => typeof v === 'string')
    )
  );
}

/** The Values cell of each page table row that names a constant. */
function pageRows() {
  const rows = new Map();
  for (const line of readFileSync(PAGE, 'utf8').split(/\r?\n/)) {
    if (!line.startsWith('|')) continue;
    // An escaped pipe belongs to its cell.
    const cells = line
      .split(/(?<!\\)\|/)
      .slice(1, -1)
      .map(c => c.trim());
    const name = /^`(\w+)`$/.exec(cells[0] ?? '')?.[1];
    if (name) rows.set(name, cells[1] ?? '');
  }
  return rows;
}

describe(PAGE_REL, () => {
  it('has a row for every tuple the package exports', () => {
    const rows = pageRows();
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
    for (const [name, cell] of pageRows()) {
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
    const rows = pageRows();
    const stale = [...SUMMARISED.keys()].filter(n => !rows.has(n));
    assert.deepEqual(
      stale,
      [],
      `SUMMARISED names ${stale.join(', ')}, which has no row in ` +
        `${PAGE_REL}. Remove the entry.`
    );
  });
});
