/**
 * The skill's component map is a SHIPPED product surface — served through the
 * MCP index and bundled into create-bestax — so an agent follows it as
 * instructions. When it disagrees with `MAPPING`, it does not merely mislead:
 * it reproduces whatever bug the code was changed to fix.
 *
 * That is not hypothetical: the rbx `Loader` fix changed the code and left
 * three doc surfaces teaching the old mapping, so following the skill
 * recreated the bug the commit had just removed.
 *
 * `mapping-coverage.test.ts` holds `MAPPING` to bloomer's export surface. This
 * holds the shipped table to `MAPPING`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BLOOMER_EXPORTS, MAPPING } from '../mapping.js';
import type { ComponentMapping } from '../../../types.js';

const DOC = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../../skills/bestax-migrate/references/bloomer/component-map.md'
);

/**
 * Prettier rewrites markdown emphasis to underscores when it formats the
 * shipped file, so compare on a normalised form rather than the literal
 * asterisks the generator emits.
 */
const norm = (cell: string): string => cell.replace(/[*_]/g, '');

/** How the generated table renders one entry's target column. */
function renderTarget(entry: ComponentMapping): string {
  if (entry.status === 'todo') return '— *(see unmappables)*';
  if (entry.target) return `\`${entry.target}\``;
  return entry.special ? '*structural*' : '*namespace*';
}

/** Every dotted path the table is expected to carry, in MAPPING order. */
function expectedRows(): Array<[string, string, string]> {
  const rows: Array<[string, string, string]> = [];
  const walk = (entry: ComponentMapping, dotted: string): void => {
    rows.push([dotted, renderTarget(entry), entry.status]);
    for (const [name, sub] of Object.entries(entry.subs ?? {})) {
      walk(sub, `${dotted}.${name}`);
    }
  };
  for (const name of Object.keys(BLOOMER_EXPORTS).sort()) {
    if (MAPPING[name]) walk(MAPPING[name], name);
  }
  return rows;
}

describe('the shipped bloomer component map matches MAPPING', () => {
  // Only the FIRST table — the later "value-chosen targets" table is also
  // three columns and would otherwise be parsed as mapping rows.
  const full = fs.readFileSync(DOC, 'utf8');
  const text = full.slice(0, full.indexOf('## The renames worth memorising'));

  /** Parse that table's data rows into [rbx, target, status]. */
  const parsed = text
    .split('\n')
    .filter(l => /^\|\s*`[A-Za-z]/.test(l))
    .map(l =>
      l
        .replace(/^\||\|$/g, '')
        .split('|')
        .map(c => c.trim())
    )
    .filter(cells => cells.length === 3)
    .map(cells => [cells[0].replace(/`/g, ''), cells[1], cells[2]] as const);

  it('lists every mapping entry, and nothing else', () => {
    const expected = expectedRows().map(r => r[0]);
    const actual = parsed.map(r => r[0]);
    expect(actual).toEqual(expected);
  });

  it('renders the right target and status for each', () => {
    const expected = expectedRows();
    for (const [dotted, target, status] of expected) {
      const row = parsed.find(r => r[0] === dotted);
      expect({ dotted, row: row && norm(row[1]) }).toEqual({
        dotted,
        row: norm(target),
      });
      expect({ dotted, status: row?.[2] }).toEqual({ dotted, status });
    }
  });
});
