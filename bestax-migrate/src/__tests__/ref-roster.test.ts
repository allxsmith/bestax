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
 * The `src/form/` wrappers every surface carves out BY NAME from its "form
 * controls" summary. Held apart from the rest of the denial bucket because the
 * carve-out sentence is rendered from this list and checked on every surface
 * below. Without that, a wrapper that GAINS a ref could be moved into the
 * summarised bucket to settle the library checks while all five surfaces went
 * on saying it forwards nothing.
 */
const CARVED_OUT_FORM_WRAPPERS = [
  'Field',
  'Field.Label',
  'Field.Body',
  'Checkboxes',
  'Radios',
] as const;

/** Everything these surfaces name as forwarding no ref, wrappers included. */
const NAMED_AS_FORWARDING_NONE: readonly string[] = [
  ...CARVED_OUT_FORM_WRAPPERS,
  'Box',
  'Card',
  'Delete',
  'Message',
  'Navbar.DropdownMenu',
  'Section',
  'Tabs',
];

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
      // `export const` is how every one of these is written today; the other
      // two forms are read so that changing how one is declared does not
      // quietly drop it out of the folder-to-bucket check.
      const declared = [
        ...text.matchAll(/^export (?:const|function) ([A-Z][A-Za-z]*)/gm),
        ...text.matchAll(/^export \{([^}]*)\}/gm),
      ];
      for (const [, captured] of declared) {
        for (const name of captured.split(',')) {
          const bare =
            name
              .trim()
              .split(/\s+as\s+/)
              .pop()
              ?.trim() ?? '';
          if (/^[A-Z][A-Za-z]*$/.test(bare)) names.add(bare);
        }
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

/**
 * The roster as a surface spells it: backticked, comma-separated, "and"
 * before the last. Rendering the fragment FROM the bucket and asserting each
 * surface carries it replaces four scanners that tried to infer polarity by
 * parsing prose; every round of review on this branch landed on one of their
 * boundaries rather than on the roster, which is the tell that the inference
 * was the risk rather than the roster.
 *
 * The fragment alone is not enough, and this is the trap the scanners existed
 * to cover: rewriting a surface to "neither does bestax: not the form
 * controls, and not `Avatar`, …" leaves both the fragment and the phrase
 * "form controls" intact while reversing what the sentence claims. So the
 * LEAD-IN is pinned with the fragment, and the carve-out with the denial that
 * follows it. What is compared is a claim, not a list of names.
 */
function oxford(names: readonly string[]): string {
  const quoted = names.map(name => `\`${name}\``);
  return `${quoted.slice(0, -1).join(', ')} and ${quoted[quoted.length - 1]}`;
}

/** Markdown wraps these fragments across lines; the prose is one sentence. */
function unwrapped(text: string): string {
  return text.replace(/\s+/g, ' ');
}

describe('every surface that names the roster', () => {
  const forwarding = `form controls, plus ${oxford(NAMED_INDIVIDUALLY)}`;
  const carveOut = `the ${oxford(CARVED_OUT_FORM_WRAPPERS)} wrappers`;
  // The three references say "wrappers around them forward nothing"; the two
  // TODO strings say "wrappers, which forward none".
  const denial = /^(?: around them forward nothing|, which forward none)/;

  it.each(SURFACES)('%s claims the roster forwards a ref', (_label, read) => {
    expect(unwrapped(read())).toContain(forwarding);
  });

  it.each(SURFACES)('%s denies the form wrappers a ref', (_label, read) => {
    const text = unwrapped(read());
    const at = text.indexOf(carveOut);
    expect(at).toBeGreaterThan(-1);
    expect(text.slice(at + carveOut.length)).toMatch(denial);
  });
});
