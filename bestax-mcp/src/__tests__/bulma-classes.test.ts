/**
 * What lookup_bulma_classes says of a class nothing converts, over every class
 * the index knows of. The check for a class Bulma 1 has no rule for runs ahead
 * of the passthrough patterns, since those reach past the stylesheet, so a v1
 * class read wrongly there would lose its group's note. These hold the order:
 * no v1 class reads as missing from v1 or as removed, every one a passthrough
 * group matches gets that group's note, and every removed one says so.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from '@jest/globals';

import { lookupClasses, type BulmaClassTable } from '../bulma-classes.js';
import { DATA_DIR } from '../data.js';

const table: BulmaClassTable = JSON.parse(
  readFileSync(join(DATA_DIR, 'bulma-classes.json'), 'utf8')
);

/** The note on a class looked up alone, when it stays in `className`. */
function noteOf(token: string): string | null {
  const [{ verdict }] = lookupClasses(table, token).rows;
  return verdict.kind === 'class' ? verdict.why : null;
}

const NOT_V1 = 'not a Bulma 1 class';
const REMOVED = 'a Bulma 0.9 class that v1 removed';

describe('the note on a class nothing converts', () => {
  it('never calls a Bulma 1 class missing from v1, or removed', () => {
    expect(table.vocabulary.length).toBeGreaterThan(1000);
    const misread = table.vocabulary.filter(token => {
      const note = noteOf(token);
      return note?.startsWith(NOT_V1) || note?.startsWith(REMOVED);
    });
    expect(misread).toEqual([]);
  });

  it("gives a v1 class a passthrough group matches that group's note", () => {
    const groups = table.passthrough.map(g => ({
      ...g,
      re: new RegExp(g.match),
    }));
    const misread: string[] = [];
    for (const token of table.vocabulary) {
      if (Object.hasOwn(table.roots, token)) continue;
      if (Object.hasOwn(table.helpers, token)) continue;
      const group = groups.find(g => g.re.test(token));
      if (group && noteOf(token) !== group.why) misread.push(token);
    }
    expect(misread).toEqual([]);
  });

  it('says a removed class was removed, or what replaced it', () => {
    expect(table.removed.length).toBeGreaterThan(0);
    for (const token of table.removed) {
      expect(noteOf(token)).toEqual(
        Object.hasOwn(table.legacy, token)
          ? table.legacy[token]
          : expect.stringContaining(REMOVED)
      );
    }
  });
});
