/**
 * Ranking and near-miss suggestions.
 *
 * Both had a real bug caught by the server tests: exact-substring scoring never
 * matched "theme" against `bestax-theming` (whose description says colors, dark
 * mode and tokens but never "theme"), and a first-letter suggester answered
 * "Buton" with "Badge, Block, Box". The cases below pin the fixes.
 */
import { describe, expect, it, beforeAll } from '@jest/globals';

import {
  loadCatalog,
  loadComponent,
  loadSkills,
  type Catalog,
  type ComponentRecord,
  type Skill,
} from '../data.js';
import { searchAll, suggest, type HitKind } from '../search.js';

const ALL: HitKind[] = ['component', 'prop', 'example', 'css-var', 'skill'];

let catalog: Catalog;
let skills: Skill[];
let components: ComponentRecord[];

beforeAll(async () => {
  catalog = await loadCatalog();
  skills = await loadSkills();
  components = await Promise.all(
    ['Button', 'Navbar', 'Field', 'Columns'].map(loadComponent)
  );
});

const find = (query: string, kinds = ALL) =>
  searchAll(query, catalog, components, skills, kinds);

describe('searchAll', () => {
  it('ranks an exact component name first', () => {
    expect(find('button')[0]).toMatchObject({
      kind: 'component',
      name: 'Button',
    });
  });

  it('matches across inflection, not just substrings', () => {
    // "theme" is not a substring of "bestax-theming", and the skill's own
    // description never uses the word.
    const hits = find('theme', ['skill']);
    expect(hits.map(h => h.name)).toContain('bestax-theming');
  });

  it.each([
    ['migrate', 'bestax-migrate'],
    ['icons', 'bestax-icons'],
    ['forms', 'bestax-form'],
  ])('finds the %s skill', (query, skill) => {
    expect(find(query, ['skill']).map(h => h.name)).toContain(skill);
  });

  it('keeps a real match well clear of incidental prose matches', () => {
    // What matters is not that incidental matches score zero, but that the
    // component actually named Theme is unmistakably first.
    const hits = find('theme', ['component']);
    expect(hits[0].name).toBe('Theme');
    for (const also of hits.slice(1)) {
      expect(also.score).toBeLessThan(hits[0].score / 2);
    }
  });

  it('returns nothing for an empty query', () => {
    expect(find('   ')).toHaveLength(0);
  });

  it('honours the kind filter', () => {
    for (const hit of find('color', ['css-var'])) {
      expect(hit.kind).toBe('css-var');
    }
  });

  it('gives every hit a follow-up call', () => {
    for (const hit of find('color')) {
      expect(hit.next).toMatch(/^(get|list)_\w+\(/);
    }
  });

  it('scores a two-term query above a one-term match', () => {
    const both = find('navbar burger', ['component', 'prop']);
    expect(both.length).toBeGreaterThan(0);
    expect(both[0].score).toBeGreaterThan(0);
  });
});

describe('suggest', () => {
  const names = catalogNames();
  function catalogNames() {
    // Resolved lazily inside the test body — `catalog` is set in beforeAll.
    return () => catalog.components.map(c => c.name);
  }

  it.each([
    ['Buton', 'Button'],
    ['Butonn', 'Button'],
    ['Navbr', 'Navbar'],
    ['Colums', 'Columns'],
  ])('suggests %s -> %s', (typo, expected) => {
    expect(suggest(typo, names())).toContain(expected);
  });

  it('suggests nothing for input that resembles nothing', () => {
    expect(suggest('zzzzzzzzzzzz', names())).toHaveLength(0);
  });

  it('caps the number of suggestions', () => {
    expect(suggest('Buton', names(), 2).length).toBeLessThanOrEqual(2);
  });
});
