/**
 * The ref-forwarding roster, held to the library.
 *
 * Five shipped surfaces tell a migrating user which components accept a `ref`:
 * three skill references, which an agent reads as instructions, and two codemod
 * TODO strings, which land in the user's own source. #661 gave `Link`, `Avatar`,
 * `Menu.Item` and `Navbar.Item` a forwarded ref and none of the five learned
 * about it, so each went on telling users to drop a ref that works — the same
 * class of wrong guidance #597 fixed for the batch before (#666).
 *
 * The roster is read off the library at RUNTIME rather than parsed out of its
 * source: `forwardRef` stamps its result with `react.forward_ref`, so this asks
 * the same question React does when it decides whether a ref can be given. A
 * component that gains or loses one therefore fails here until every surface
 * has been updated, which is what #666 asked for and what a hand-kept list
 * cannot promise.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as bulma from '@allxsmith/bestax-bulma';
import { MAPPING as RBX_MAPPING } from '../sources/rbx/mapping.js';
import { UNIVERSAL_PROPS as RBC_UNIVERSAL } from '../sources/react-bulma-components/mapping.js';

const ROOT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);
const REFERENCES = path.join(ROOT, 'skills/bestax-migrate/references');

/**
 * The components each surface names one by one. Held to the library below, so
 * it cannot fall behind quietly — a new ref-forwarding component fails the
 * first test until it is placed in this bucket or the next one.
 */
const NAMED_INDIVIDUALLY = [
  'Avatar',
  'Button',
  'Carousel',
  'CarouselItem',
  'Dialog',
  'Dropdown',
  'Link',
  'LinkButton',
  'Menu.Item',
  'Modal',
  'Navbar',
  'Navbar.Burger',
  'Navbar.Dropdown',
  'Navbar.Item',
  'Navbar.Link',
  'Sidebar',
  'Toast',
] as const;

/**
 * The rest, which every surface summarises as "the form controls" instead of
 * listing. Naming them would bury the handful a reader is actually looking for
 * under every input and its `*Base` internal, and the summary is accurate:
 * these all live in `bulma-ui/src/form/`.
 */
const SUMMARISED_AS_FORM_CONTROLS = [
  'Autocomplete',
  'Checkbox',
  'Control',
  'DateInput',
  'DateInputBase',
  'DateTimeInput',
  'DateTimeInputBase',
  'File',
  'Input',
  'InputBase',
  'NumberInput',
  'Radio',
  'Rate',
  'Select',
  'SelectBase',
  'Slider',
  'Switch',
  'TagInput',
  'TextArea',
  'TextAreaBase',
  'TimeInput',
  'TimeInputBase',
] as const;

/** What `React.forwardRef` stamps on the object it returns. */
const FORWARD_REF = Symbol.for('react.forward_ref');

function forwardsRef(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { $$typeof?: unknown }).$$typeof === FORWARD_REF
  );
}

/**
 * Every exported name that forwards a ref, grouped by component IDENTITY.
 * Several are exported twice — `Menu.Item` is also `MenuItem`, `Button` is also
 * `Buttons.Button` — and the guidance need only name one of each, so the tests
 * below ask about groups rather than names.
 */
function forwardRefGroups(): string[][] {
  const groups = new Map<unknown, string[]>();
  const add = (name: string, value: unknown): void => {
    if (!forwardsRef(value)) return;
    const seen = groups.get(value);
    if (seen) seen.push(name);
    else groups.set(value, [name]);
  };
  for (const [name, value] of Object.entries(bulma)) {
    add(name, value);
    if (
      value === null ||
      (typeof value !== 'object' && typeof value !== 'function')
    ) {
      continue;
    }
    for (const [key, sub] of Object.entries(value)) {
      // `$$typeof` and `render` are forwardRef's own fields, not statics.
      if (key === '$$typeof' || key === 'render' || key === 'displayName')
        continue;
      add(`${name}.${key}`, sub);
    }
  }
  return [...groups.values()];
}

/** One `##` section of a reference, heading included. */
function section(file: string, heading: string): string {
  const text = fs.readFileSync(path.join(REFERENCES, file), 'utf8');
  const start = text.indexOf(`\n${heading}\n`);
  if (start === -1) throw new Error(`${file} has no "${heading}" section`);
  const rest = text.slice(start + 1);
  const end = rest.slice(heading.length).search(/\n## /);
  return end === -1 ? rest : rest.slice(0, heading.length + end);
}

/**
 * The TODO text the codemod writes into the user's source. rbx's lives on a
 * `MAPPING` entry (`forwardRefAs` is an rbx export with no counterpart) and
 * RBC's on a universal prop action, so this reads the field both share.
 */
function todo(entry: { todo?: string }, label: string): string {
  if (!entry?.todo) throw new Error(`${label} carries no TODO string`);
  return entry.todo;
}

const SURFACES: Array<[string, string]> = [
  ['rbx prop-map', section('rbx/prop-map.md', '## Refs')],
  ['bloomer prop-map', section('bloomer/prop-map.md', '## Refs')],
  [
    'react-bulma-components unmappables',
    section('react-bulma-components/unmappables.md', '## `domRef`'),
  ],
  [
    'the rbx `forwardRefAs` TODO',
    todo(RBX_MAPPING.forwardRefAs, 'rbx `forwardRefAs`'),
  ],
  [
    'the react-bulma-components `domRef` TODO',
    todo(RBC_UNIVERSAL.domRef, 'RBC `domRef`'),
  ],
];

describe('the ref-forwarding roster', () => {
  const groups = forwardRefGroups();
  const declared = new Set<string>([
    ...NAMED_INDIVIDUALLY,
    ...SUMMARISED_AS_FORM_CONTROLS,
  ]);

  it('accounts for every component the library forwards a ref from', () => {
    const unplaced = groups
      .filter(names => !names.some(name => declared.has(name)))
      .map(names => names.join(' = '))
      .sort();
    expect(unplaced).toEqual([]);
  });

  it('claims no component that forwards no ref', () => {
    const real = new Set(groups.flat());
    expect([...declared].filter(name => !real.has(name)).sort()).toEqual([]);
  });

  it('names each bucket only once', () => {
    const overlap = SUMMARISED_AS_FORM_CONTROLS.filter(name =>
      (NAMED_INDIVIDUALLY as readonly string[]).includes(name)
    );
    expect(overlap).toEqual([]);
  });
});

describe('every surface that names the roster', () => {
  it.each(SURFACES)('%s names each component individually', (_label, text) => {
    const missing = NAMED_INDIVIDUALLY.filter(
      name => !text.includes(`\`${name}\``)
    );
    expect(missing).toEqual([]);
  });

  it.each(SURFACES)('%s summarises the form controls', (_label, text) => {
    expect(text).toContain('form controls');
  });
});
