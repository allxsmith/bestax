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
import { describe, expect, it } from 'vitest';

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
      if (Object.hasOwn(table.replaced, token)) continue;
      expect(noteOf(token)).toEqual(
        Object.hasOwn(table.legacy, token)
          ? table.legacy[token]
          : expect.stringContaining(REMOVED)
      );
    }
  });

  it('converts a removed helper as the v1 one that replaced it, and says so where it stays', () => {
    const replaced = Object.entries(table.replaced);
    expect(replaced.length).toBeGreaterThan(0);
    for (const [token, v1] of replaced) {
      expect(table.removed).toContain(token);
      // On a component, the prop of the v1 helper.
      const [{ verdict }] = lookupClasses(table, token, 'p').rows;
      expect(verdict).toEqual({
        kind: 'prop',
        writes: [table.helpers[v1].write],
        condition: expect.stringContaining(`its v1 class, \`${v1}\``),
      });
      // Wherever it stays, whatever kept it, what to write instead: a tag
      // bestax has no component for, a wrapper that folds bare, and a live
      // class for the same prop, written before it or after.
      const v1Prop = table.helpers[v1].write.prop;
      const live = `${v1Prop}-2`;
      for (const [classes, tag] of [
        [token, 'div'],
        [`table-container ${token}`, 'div'],
        [`box ${live} ${token}`, 'div'],
        [`box ${token} ${live}`, 'div'],
      ]) {
        const { rows } = lookupClasses(table, classes, tag);
        expect({
          classes,
          verdict: rows.find(row => row.token === token)?.verdict,
        }).toEqual({
          classes,
          verdict: { kind: 'class', why: table.legacy[token] },
        });
      }
      // The live class keeps its prop whichever comes first.
      for (const classes of [`box ${live} ${token}`, `box ${token} ${live}`]) {
        const { rows } = lookupClasses(table, classes, 'div');
        expect(rows.find(row => row.token === live)?.verdict).toEqual({
          kind: 'prop',
          writes: [{ prop: v1Prop, value: '2' }],
        });
      }
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

// What styles a class Bulma 1 has no rule for, where the index knows: bestax's own
// stylesheet, an icon font's, a Bulma extension's (#1236).
describe('the note on a class another stylesheet styles', () => {
  const elsewhere = table.elsewhere.map(group => ({
    ...group,
    re: new RegExp(group.match),
  }));

  it("gives each group's classes that group's note, and a v1 class its own", () => {
    for (const [token, group] of [
      ['fa-moon', 0],
      ['fab', 0],
      ['mdi-home', 1],
      ['is-facebook', 2],
      ['is-x', 2],
      ['has-text-github', 3],
      ['has-background-youtube-dark', 3],
      ['has-text-x-light', 3],
      ['is-covered', 4],
    ] as const) {
      expect({ token, note: noteOf(token) }).toEqual({
        token,
        note: table.elsewhere[group].why,
      });
    }
    // Font Awesome 4's `fa` is a v1 class, Bulma styling it inside `.icon`, so
    // the group's pattern takes it for the glyph answer and its note stays.
    expect(table.vocabulary).toContain('fa');
    expect(noteOf('fa')).toBe(table.roots.fa.why);
    // Each group's classes are none of Bulma 1's but that one.
    const v1 = table.vocabulary.filter(
      token => token !== 'fa' && elsewhere.some(group => group.re.test(token))
    );
    expect(v1).toEqual([]);
  });

  it("names the component a root class of bestax's own stylesheet belongs to", () => {
    const own = Object.entries(table.ownClasses);
    expect(own).toContainEqual(['carousel', 'Carousel']);
    for (const [token, component] of own) {
      // None is Bulma 1's, and no other stylesheet's note can claim it.
      expect(table.vocabulary).not.toContain(token);
      expect(elsewhere.filter(group => group.re.test(token))).toEqual([]);
      expect(noteOf(token)).toContain(`bestax \`${component}\`'s own class`);
    }
  });

  it('answers a bare <i> naming a glyph as one, and nothing else', () => {
    expect(lookupClasses(table, 'fas fa-home', 'i').element.kind).toBe('glyph');
    expect(lookupClasses(table, 'fa fa-home').element.kind).toBe('glyph');
    // With no tag, only classes that are all a glyph's.
    expect(lookupClasses(table, 'fas fa-home mt-2').element.kind).not.toBe(
      'glyph'
    );
    expect(lookupClasses(table, 'fas fa-home', 'span').element.kind).not.toBe(
      'glyph'
    );
    // A helper beside it on the <i> stays, saying why.
    const { rows } = lookupClasses(table, 'fas fa-home mt-2', 'i');
    expect(rows.find(row => row.token === 'mt-2')?.verdict).toEqual({
      kind: 'class',
      why: 'the codemod converts no bare <i>, so its classes stay',
    });
  });

  it('answers each plain tag a table part renders with that part', () => {
    for (const [tag, { target }] of Object.entries(table.byHand)) {
      expect(lookupClasses(table, 'p-2', tag).element).toMatchObject({
        kind: 'by-hand',
        target,
        tag,
      });
    }
  });
});
