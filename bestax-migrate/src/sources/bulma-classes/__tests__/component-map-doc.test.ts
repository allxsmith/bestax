/**
 * The skill's bulma-classes component map is a shipped product surface (it
 * reaches agents through the MCP index and the create-bestax bundle), so it
 * must say what the table does. This holds its two tables to `ROOTS` and
 * `WRAPPERS`, and its lists of families and left-alone classes to the
 * table's `todo` and `plain` roots.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOTS, WRAPPERS, type RootEntry } from '../class-map.js';

const DOC = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../../skills/bestax-migrate/references/bulma-classes/component-map.md'
);

const doc = fs.readFileSync(DOC, 'utf8');

/** The table rows under a heading, as arrays of trimmed cells. */
function rowsUnder(heading: string): string[][] {
  const start = doc.indexOf(`## ${heading}`);
  const end = doc.indexOf('\n## ', start + 1);
  return doc
    .slice(start, end === -1 ? undefined : end)
    .split('\n')
    .filter(line => line.startsWith('|') && !/^\|\s*-/.test(line))
    .slice(1)
    .map(line =>
      line
        .split('|')
        .slice(1, -1)
        .map(cell => cell.trim())
    );
}

function tagsCell(entry: RootEntry): string {
  if (entry.as === 'any') return `\`<${entry.tag}>\`, any tag via \`as\``;
  if (entry.as) {
    return `${entry.as.map(tag => `\`<${tag}>\``).join(', ')} via \`as\``;
  }
  return `\`<${entry.tag}>\` only`;
}

describe('the shipped bulma-classes component map matches the table', () => {
  it('lists every mapped root, with its target and tags', () => {
    const expected = Object.entries(ROOTS)
      .filter(([, entry]) => entry.status === 'mapped')
      .map(([root, entry]) => [
        `\`.${root}\``,
        `\`${entry.target}\``,
        tagsCell(entry),
      ]);
    expect(rowsUnder('Components')).toEqual(expected);
  });

  it('lists every wrapper it folds, with the props that render it', () => {
    expect(rowsUnder('Wrappers a component renders')).toEqual(
      Object.entries(ROOTS)
        .filter(([, entry]) => entry.status === 'fold')
        .map(([root, entry]) => [
          `\`.${root}\``,
          `\`${[entry.target, ...(entry.folds ?? []).map(write => write.prop)].join(' ')}\``,
        ])
    );
  });

  it('lists every plain-tag wrapper', () => {
    expect(rowsUnder('Plain tags with helper classes')).toEqual(
      Object.entries(WRAPPERS).map(([tag, target]) => [
        `\`<${tag}>\``,
        `\`${target}\``,
      ])
    );
  });

  it('names every class it leaves alone', () => {
    const section = doc.slice(doc.indexOf('## Classes left alone'));
    for (const [root, entry] of Object.entries(ROOTS)) {
      if (entry.status !== 'plain') continue;
      expect({ root, named: section.includes(`\`.${root}\``) }).toEqual({
        root,
        named: true,
      });
    }
  });

  it('gives every family it leaves as markup a recipe', () => {
    const unmappables = fs.readFileSync(
      path.join(path.dirname(DOC), 'unmappables.md'),
      'utf8'
    );
    for (const [root, entry] of Object.entries(ROOTS)) {
      if (entry.status !== 'todo' || entry.part) continue;
      expect({
        root,
        documented: unmappables.includes(`\`family:${root}\``),
      }).toEqual({ root, documented: true });
    }
  });
});
