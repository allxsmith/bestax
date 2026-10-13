#!/usr/bin/env node
/**
 * Freeze the component-comparison matrix for one edition of "The State of
 * React".
 *
 * The live matrix in src/data/componentComparison.js changes with every
 * edition, so a post that rendered it directly would change after it was
 * published. Each edition instead renders a frozen copy of the data it was
 * written against: this script writes that copy to
 * src/data/state-of-react/<YYYY-MM>.json, and the edition post imports it (and
 * the previous edition's copy, to show what changed). Rows are positional, so
 * the snapshot records its column order (`libs`, library ids by position) and
 * the component resolves cells through that, not the live order. It also
 * carries the live `corrections` list, so the edition's changes table can mark
 * a cell the previous edition had wrong as a correction, not a release.
 *
 * Usage:
 *   pnpm --filter @allxsmith/bestax-docs snapshot:comparison <YYYY-MM> [--force]
 *
 * An existing snapshot is left alone unless --force is passed, because a
 * published edition's snapshot is what that post shows.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Load the live matrix module. It is ESM in a package without "type":
 * "module", so importing it by path makes Node warn on every run; it imports
 * nothing, so load its source as a data: URL instead.
 */
export async function loadLiveData() {
  const source = readFileSync(
    resolve(docsRoot, 'src/data/componentComparison.js'),
    'utf8'
  );
  return import(
    `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
  );
}

/** Library ids in row position order: the column list a snapshot records. */
export function columnOrder(libs) {
  return [...libs].sort((a, b) => a.idx - b.idx).map(lib => lib.id);
}

/**
 * Serialize a snapshot with one matrix row per line, so a diff between two
 * editions' files reads row by row. `libs` is the column order from
 * columnOrder(); a row whose length doesn't match it is refused.
 * `corrections` is the live list as it stands, one corrected or renamed row
 * per line; the edition's changes table reads it to tell a fix from a release.
 */
export function serializeSnapshot({
  reviewed,
  libs,
  categories,
  corrections = [],
}) {
  for (const cat of categories) {
    for (const row of cat.rows) {
      if (row.length !== libs.length + 1) {
        throw new Error(
          `row "${row[0]}" has ${row.length - 1} cells for ${libs.length} libraries`
        );
      }
    }
  }
  const cats = categories.map(cat => {
    const rows = cat.rows.map(row => `        ${JSON.stringify(row)}`);
    return [
      '    {',
      `      "heading": ${JSON.stringify(cat.heading)},`,
      '      "rows": [',
      rows.join(',\n'),
      '      ]',
      '    }',
    ].join('\n');
  });
  // A fix's `renamed` or `cells`, one row per line.
  const byRow = (key, rows) => {
    const lines = Object.entries(rows).map(
      ([row, value]) =>
        `        ${JSON.stringify(row)}: ${JSON.stringify(value)}`
    );
    if (lines.length === 0) return `      ${JSON.stringify(key)}: {}`;
    return [
      `      ${JSON.stringify(key)}: {`,
      lines.join(',\n'),
      '      }',
    ].join('\n');
  };
  const fixes = corrections.map(fix =>
    [
      '    {',
      `      "edition": ${JSON.stringify(fix.edition)},`,
      `      "pr": ${JSON.stringify(fix.pr)},`,
      ...(fix.renamed ? [`${byRow('renamed', fix.renamed)},`] : []),
      byRow('cells', fix.cells),
      '    }',
    ].join('\n')
  );
  return [
    '{',
    `  "reviewed": ${JSON.stringify(reviewed)},`,
    `  "libs": ${JSON.stringify(libs)},`,
    '  "categories": [',
    cats.join(',\n'),
    '  ],',
    fixes.length > 0
      ? ['  "corrections": [', fixes.join(',\n'), '  ]'].join('\n')
      : '  "corrections": []',
    '}',
    '',
  ].join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const edition = args.find(a => !a.startsWith('--'));
  if (!edition || !/^\d{4}-\d{2}$/.test(edition)) {
    console.error(
      'usage: snapshot-comparison.mjs <YYYY-MM> [--force]  (e.g. 2026-09)'
    );
    process.exit(1);
  }
  const out = resolve(docsRoot, 'src/data/state-of-react', `${edition}.json`);
  if (existsSync(out) && !force) {
    console.error(
      `snapshot-comparison: ${out} already exists. A published edition's ` +
        'snapshot is what that post shows; pass --force to overwrite a draft.'
    );
    process.exit(1);
  }
  const data = await loadLiveData();
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(
    out,
    serializeSnapshot({
      reviewed: data.lastReviewed,
      libs: columnOrder(data.libs),
      categories: data.categories,
      corrections: data.corrections,
    })
  );
  console.log(`snapshot-comparison: wrote ${out} (${data.lastReviewed})`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
