/**
 * What lookup_bulma_classes says of a class nothing converts, over every class
 * the index knows of. The check for a class Bulma 1 has no rule for runs ahead
 * of the passthrough patterns, since those reach past the stylesheet, so a v1
 * class read wrongly there would lose its group's note. These hold the order:
 * no v1 class reads as missing from v1 or as removed, every one a passthrough
 * group matches gets that group's note, and every removed one says so. Last,
 * a layout class beside its base meets the same gates as any other modifier.
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

describe('a layout class beside its base, behind every modifier gate', () => {
  // No entry carries `tagIn` or `needsAttr` beside `beside` yet, so a copy of
  // the table is given two that do.
  const lent: BulmaClassTable = structuredClone(table);
  Object.assign(lent.roots.field.modifiers, {
    'test-on-p': {
      writes: [{ prop: 'hasAddons', value: 'right' }],
      beside: 'has-addons',
      tagIn: ['p'],
    },
    'test-needs': {
      writes: [{ prop: 'hasAddons', value: 'centered' }],
      beside: 'has-addons',
      needsAttr: { name: 'data-test', value: 'x' },
    },
  });
  const row = (classes: string, token: string) =>
    lookupClasses(lent, classes, 'div').rows.find(
      found => found.token === token
    )!.verdict;

  it('stays a class off its tags, and leaves its base to its own flag', () => {
    expect(row('field has-addons test-on-p', 'test-on-p')).toEqual({
      kind: 'class',
      why: 'bestax `Field` renders it exactly only on <p>',
    });
    expect(row('field has-addons test-on-p', 'has-addons')).toEqual({
      kind: 'prop',
      writes: [{ prop: 'hasAddons' }],
    });
  });

  it('names the attribute it needs as well as its base', () => {
    const verdict = row('field has-addons test-needs', 'test-needs');
    expect(verdict).toMatchObject({
      kind: 'prop',
      writes: [{ prop: 'hasAddons', value: 'centered' }],
    });
    const { condition } = verdict as { condition: string };
    expect(condition).toContain('beside an `data-test` of the element');
    expect(condition).toContain('beside `has-addons`, which it renders too');
  });

  it('hedges the base the way the layout class is hedged', () => {
    // Without the attribute the layout class stays, and the base is its own
    // flag, so the base row can't say flatly that the layout's value renders it.
    expect(row('field has-addons test-needs', 'has-addons')).toEqual({
      kind: 'rendered',
      target: 'Field',
      condition:
        'from `hasAddons="centered"`, which `test-needs` sets where it converts, and otherwise from `hasAddons` on its own',
    });
    // A layout class with no gate of its own leaves nothing to hedge.
    expect(row('field has-addons has-addons-right', 'has-addons')).toEqual({
      kind: 'rendered',
      target: 'Field',
      condition: 'from `hasAddons="right"`, which `has-addons-right` sets',
    });
  });
});
