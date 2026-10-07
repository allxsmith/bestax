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
import { ALIASES, searchAll, suggest, type HitKind } from '../search.js';

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

// The queries a builder types when it does not know the component's name, which is
// the case search_bestax exists for. "date picker" used to put DateInput 33rd, behind
// a prop whose description mentions a date picker and every --bulma-dateinput-*
// variable (#934).
describe('ranking realistic queries', () => {
  let all: ComponentRecord[];
  beforeAll(async () => {
    all = await Promise.all(catalog.components.map(c => loadComponent(c.name)));
  });
  const top = (query: string, n = 1) =>
    searchAll(query, catalog, all, skills, ALL)
      .slice(0, n)
      .map(h => `${h.kind}:${h.name}`);

  it.each([
    ['date picker', 'DateInput'],
    ['datepicker', 'DateInput'],
    ['Date-Picker', 'DateInput'],
    ['calendar', 'DateInput'],
    ['time picker', 'TimeInput'],
    ['timepicker', 'TimeInput'],
    ['datetime picker', 'DateTimeInput'],
    ['date time picker', 'DateTimeInput'],
    ['popover', 'Popover'],
    ['dropdown menu', 'Dropdown'],
    ['select', 'Select'],
    ['toggle', 'Switch'],
    ['accordion', 'Collapses'],
    ['combobox', 'Autocomplete'],
    ['typeahead', 'Autocomplete'],
    ['star rating', 'Rate'],
    ['chips', 'Taginput'],
    ['drawer', 'Sidebar'],
    ['spinner', 'Loader'],
    ['snackbar', 'Toast'],
    ['file upload', 'File'],
    ['progress bar', 'Progress'],
    ['wizard', 'Steps'],
    ['button', 'Button'],
    ['loading', 'Loading'],
    ['theme', 'Theme'],
  ])('"%s" puts %s first', (query, component) => {
    expect(top(query)).toEqual([`component:${component}`]);
  });

  it.each([
    ['date picker', ['DateInput', 'DateTimeInput']],
    ['modal dialog', ['Dialog', 'Modal']],
  ])(
    '"%s" puts every component it names ahead of anything else',
    (query, names) => {
      expect(top(query, names.length).sort()).toEqual(
        names.map(n => `component:${n}`)
      );
    }
  );

  it('ranks a matching component above a prop of the same name', () => {
    const hits = searchAll('popover', catalog, all, skills, ALL);
    const component = hits.findIndex(h => h.name === 'Popover');
    const prop = hits.findIndex(h => h.name === 'DateInput.popover');
    expect(prop).toBeGreaterThan(component);
  });

  it('still answers an exact prop name with that prop', () => {
    // No component is named closeOnEscape, so the bonus a component gets must not
    // lift one whose prose happens to mention it above the props themselves.
    const [first] = searchAll('closeOnEscape', catalog, all, skills, ALL);
    expect(first.kind).toBe('prop');
    expect(first.name).toMatch(/\.closeOnEscape$/);
  });

  it('lists examples that share a heading once', () => {
    // DateInput has several examples under one heading, and each was its own row,
    // with the same name and the same next call.
    const rows = searchAll(
      'month and year pickers',
      catalog,
      all,
      skills,
      ALL
    ).map(h => `${h.kind}:${h.name}`);
    expect(rows).toContain('example:DateInput: Month and Year Pickers');
    expect(new Set(rows).size).toBe(rows.length);
  });

  it('names only components that exist', () => {
    const names = new Set(catalog.components.map(c => c.name));
    for (const targets of Object.values(ALIASES)) {
      for (const name of targets) expect(names).toContain(name);
    }
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

  it.each([
    ['DatePicker', 'DateInput'],
    ['date-picker', 'DateInput'],
    ['TimePicker', 'TimeInput'],
    ['Toggle', 'Switch'],
    ['Accordion', 'Collapses'],
  ])('suggests %s -> %s by what it is called elsewhere', (name, expected) => {
    expect(suggest(name, names())[0]).toBe(expected);
  });

  it('suggests nothing for input that resembles nothing', () => {
    expect(suggest('zzzzzzzzzzzz', names())).toHaveLength(0);
  });

  it('caps the number of suggestions', () => {
    expect(suggest('Buton', names(), 2).length).toBeLessThanOrEqual(2);
  });
});
