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

/**
 * The components these surfaces name as forwarding NO ref — the roster's other
 * half, and the reason the surface checks below are not presence tests alone.
 * Every one of these is already a backtick-quoted name inside a section those
 * tests read, so a bare "is the name there?" check is pre-satisfied for it: the
 * day one gains a ref, moving it up into a bucket above would turn every surface
 * assertion green on the very sentences telling a user it has none and to
 * restructure their markup. That is #666 repeating itself with the guard #666
 * asked for reporting nothing, so this list is held to the library too.
 */
const NAMED_AS_FORWARDING_NONE = [
  'Box',
  'Card',
  'Checkboxes',
  'Delete',
  'Field',
  'Field.Body',
  'Field.Label',
  'Message',
  'Navbar.DropdownMenu',
  'Radios',
  'Section',
  'Tabs',
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

/** The library export a backtick-quoted name refers to, if it names one. */
function libraryExport(name: string): unknown {
  const [head, sub] = name.split('.');
  const root = (bulma as Record<string, unknown>)[head];
  if (!sub) return root;
  if (
    root === null ||
    (typeof root !== 'object' && typeof root !== 'function')
  ) {
    return undefined;
  }
  return (root as Record<string, unknown>)[sub];
}

/**
 * Every component name a surface quotes in backticks, filtered to the ones the
 * library actually exports. The rest are source-library names — rbx's
 * `Modal.Container`, the `domRef` prop itself — which say nothing about what
 * bestax forwards.
 */
function bestaxNamesIn(text: string): string[] {
  const quoted = text.matchAll(/`([A-Z][A-Za-z]*(?:\.[A-Z][A-Za-z]*)?)`/g);
  const names = new Set<string>();
  for (const [, name] of quoted) {
    if (libraryExport(name) !== undefined) names.add(name);
  }
  return [...names].sort();
}

/**
 * The roster a surface states POSITIVELY: the run of backtick-quoted names that
 * follows its "form controls" summary, joined only by commas, "and" and "plus".
 * Every surface writes it the same way — "the form controls, plus `Avatar`, ...
 * `Sidebar` and `Toast`" — so the run ends at the first thing that is
 * not another name, which is exactly where the sentence turns to the
 * components that forward nothing.
 *
 * Reading the run, rather than asking whether a name appears ANYWHERE in the
 * section, is what makes the surface checks below polarity checks. Both prose
 * lists live in the same section, so a presence test stays green when a name is
 * moved from one to the other — #666 recurring with the guard silent.
 */
function forwardingRunIn(text: string): string[] {
  const summary = 'form controls';
  const start = text.indexOf(summary);
  if (start === -1) throw new Error('surface carries no form-control summary');
  const separator = /(?:[\s,]|\band\b|\bplus\b)*/y;
  const name = /`([A-Z][A-Za-z]*(?:\.[A-Z][A-Za-z]*)?)`/y;
  const names: string[] = [];
  let at = start + summary.length;
  for (;;) {
    separator.lastIndex = at;
    separator.exec(text);
    name.lastIndex = separator.lastIndex;
    const hit = name.exec(text);
    if (!hit) return names;
    names.push(hit[1]);
    at = name.lastIndex;
  }
}

/**
 * Every component `bulma-ui/src/form/` exports, which is the claim the
 * summarised bucket's own comment makes. Read off the folder rather than off
 * `index.ts`, because that file spells the re-export three different ways and
 * the claim is about where the component LIVES: a form control moved out of
 * this folder, or a new forwarder parked in that bucket without being one, is
 * what this catches.
 *
 * Sub-folders count — `_pickerInternals/` is still `src/form/` — while stories
 * and tests do not: their exports are fixtures, not components, and counting
 * them would let the folder "contain" a name no component in it defines.
 */
function formFolderExports(): Set<string> {
  const names = new Set<string>();
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== '__tests__') walk(full);
        continue;
      }
      if (!/\.tsx?$/.test(entry.name)) continue;
      if (/\.(?:stories|test)\.tsx?$/.test(entry.name)) continue;
      const text = fs.readFileSync(full, 'utf8');
      for (const [, name] of text.matchAll(
        /^export const ([A-Z][A-Za-z]*)/gm
      )) {
        names.add(name);
      }
    }
  };
  walk(path.join(ROOT, 'bulma-ui/src/form'));
  return names;
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

/**
 * Read lazily, one thunk per surface. `section()` and `todo()` both throw, and
 * at module scope a renamed heading took the whole suite down with
 * `Tests: 0 total` — including the library-vs-roster checks, which are the part
 * #666 actually asked for. Deferring the read into each test turns that back
 * into one red surface against a suite that still reports on the rest.
 */
const SURFACES: Array<[string, () => string]> = [
  ['rbx prop-map', () => section('rbx/prop-map.md', '## Refs')],
  ['bloomer prop-map', () => section('bloomer/prop-map.md', '## Refs')],
  [
    'react-bulma-components unmappables',
    () => section('react-bulma-components/unmappables.md', '## `domRef`'),
  ],
  [
    'the rbx `forwardRefAs` TODO',
    () => todo(RBX_MAPPING.forwardRefAs, 'rbx `forwardRefAs`'),
  ],
  [
    'the react-bulma-components `domRef` TODO',
    () => todo(RBC_UNIVERSAL.domRef, 'RBC `domRef`'),
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
    const counts = new Map<string, number>();
    for (const name of [
      ...NAMED_INDIVIDUALLY,
      ...SUMMARISED_AS_FORM_CONTROLS,
      ...NAMED_AS_FORWARDING_NONE,
    ]) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    const repeated = [...counts].filter(([, n]) => n > 1).map(([name]) => name);
    expect(repeated).toEqual([]);
  });

  it('claims nothing forwards no ref that in fact forwards one', () => {
    const real = new Set(groups.flat());
    expect(NAMED_AS_FORWARDING_NONE.filter(name => real.has(name))).toEqual([]);
  });

  it('denies only components the library still exports', () => {
    const gone = NAMED_AS_FORWARDING_NONE.filter(
      name => libraryExport(name) === undefined
    );
    expect(gone).toEqual([]);
  });

  // The other direction, and the one that was missing: a form control that
  // forwards a ref has to be IN the summarised bucket, or "the form controls"
  // promises a reader something the library does not do. `Field`, its `Label`
  // and `Body`, `Checkboxes` and `Radios` live in the folder and forward
  // nothing, which is why the surfaces carve them out by name rather than
  // leaving the summary to cover the whole folder.
  it('summarises every form control that forwards a ref', () => {
    const inFolder = formFolderExports();
    const summarised = new Set<string>(SUMMARISED_AS_FORM_CONTROLS);
    const unplaced = groups
      .filter(names => names.some(name => inFolder.has(name)))
      .filter(names => !names.some(name => summarised.has(name)))
      .map(names => names.join(' = '))
      .sort();
    expect(unplaced).toEqual([]);
  });

  it('summarises as form controls only what lives in `src/form/`', () => {
    const inFolder = formFolderExports();
    expect(inFolder.size).toBeGreaterThan(0);
    const strays = SUMMARISED_AS_FORM_CONTROLS.filter(
      name => !inFolder.has(name)
    );
    expect(strays).toEqual([]);
  });
});

describe('every surface that names the roster', () => {
  // Not "does the name appear" but "does it appear on the forwarding side".
  // Compared unordered, so the prose stays free to list the roster however reads
  // best; what is pinned is which names the sentence claims forward a ref.
  it.each(SURFACES)('%s forwards exactly the named roster', (_label, read) => {
    expect(forwardingRunIn(read()).sort()).toEqual(
      [...NAMED_INDIVIDUALLY].sort()
    );
  });

  it.each(SURFACES)('%s summarises the form controls', (_label, read) => {
    expect(read()).toContain('form controls');
  });

  // The check above pins the forwarding side of each surface; this one covers
  // the rest of the section, where the components that forward nothing are
  // named. Every bestax name a surface quotes has to be accounted for in one of
  // the three buckets, so a component cannot be written about on either side
  // without the roster being told which side it belongs on.
  it.each(SURFACES)('%s quotes no undeclared component', (_label, read) => {
    const declared = new Set<string>([
      ...NAMED_INDIVIDUALLY,
      ...SUMMARISED_AS_FORM_CONTROLS,
      ...NAMED_AS_FORWARDING_NONE,
    ]);
    const undeclared = bestaxNamesIn(read()).filter(
      name => !declared.has(name)
    );
    expect(undeclared).toEqual([]);
  });
});
