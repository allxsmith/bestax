/**
 * `SPECIAL_TARGETS` and `ADDED_COMPONENTS` are hand lists of the components
 * each library source writes beside the ones its tables name, and every
 * per-target test reads the first through `targetsOf`. A component an element
 * becomes that the list leaves out is one those tests never check.
 *
 * So this runs each library source's transform over every element its
 * mapping names, bare, and over the hand-picked `PROBES` below, which set the
 * props and children its handlers pick another component by. It reads the
 * bestax components out of what the transform writes: the one the probed
 * element became, found by a class it carries, and any other. Each probe must
 * still write a component no bare element does, so one that stops reaching
 * its handler fails. A handler that picks a component by a prop no probe sets
 * goes unseen until it gets one.
 */

import jscodeshift from 'jscodeshift';
import { runTransform } from '../src/runner.js';
import { getSource, sourceNames } from '../src/sources/registry.js';
import type { ComponentMapping } from '../src/types.js';
import {
  ADDED_COMPONENTS,
  LIBRARY_MAPPINGS,
  SPECIAL_TARGETS,
  TABLE_TARGETS,
  type LibrarySource,
} from './support/source-targets.js';

/**
 * Elements that make a handler or pass write a component the element run
 * bare doesn't: one for each such component.
 */
const PROBES: Record<LibrarySource, string[]> = {
  'react-bulma-components': [
    '<Button remove />',
    '<Heading subtitle>x</Heading>',
    '<Level.Side align="right">x</Level.Side>',
    '<Media.Item align="left">x</Media.Item>',
    '<Media.Item align="right">x</Media.Item>',
    '<Menu><Menu.List title="T">x</Menu.List></Menu>',
    '<Navbar.Container align="right">x</Navbar.Container>',
    '<Navbar.Item><Navbar.Dropdown>x</Navbar.Dropdown></Navbar.Item>',
  ],
  rbx: [
    '<Button badge="1">x</Button>',
    '<Button tooltip="t">x</Button>',
    '<Level.Item align="left">x</Level.Item>',
    '<Level.Item align="right">x</Level.Item>',
    '<Media.Item align="left">x</Media.Item>',
    '<Media.Item align="right">x</Media.Item>',
    '<Navbar.Item dropdown>x</Navbar.Item>',
    '<Navbar.Segment align="end">x</Navbar.Segment>',
    '<Pagination.Step align="previous">x</Pagination.Step>',
    '<Title subtitle>x</Title>',
  ],
  bloomer: [
    '<NavbarItem hasDropdown>x</NavbarItem>',
    '<PageControl isNext>x</PageControl>',
  ],
};

/**
 * Each element a mapping table names, by its JSX name, run with a child. An
 * export spelled in lower case (`forwardRefAs`) is a helper, which JSX would
 * read as an HTML tag, so it has no element to run.
 */
function bareElements(table: Record<string, ComponentMapping>): string[] {
  const found: string[] = [];
  const walk = (name: string, entry: ComponentMapping) => {
    found.push(`<${name}>x</${name}>`);
    for (const [sub, child] of Object.entries(entry.subs ?? {}))
      walk(`${name}.${sub}`, child);
  };
  for (const [name, entry] of Object.entries(table))
    if (/^[A-Z]/.test(name)) walk(name, entry);
  return found;
}

/** The class the probed element carries, so its output can be found. */
const MARK = 'probe-element';

const j = jscodeshift.withParser('tsx');

/** What one element was migrated to. */
interface Run {
  element: string;
  /** One of `PROBES`, rather than a mapping's element run bare. */
  probe: boolean;
  /** Whether the transform changed the input at all. */
  changed: boolean;
  /**
   * The bestax components of the elements carrying the probe's class: the one
   * the probed element became, or more if a pass copied the class.
   */
  became: string[];
  /** Every bestax component in the output, the element's own included. */
  written: string[];
}

/** Read the bestax components out of a migrated module. */
function read(element: string, probe: boolean, output: string | null): Run {
  if (output === null)
    return { element, probe, changed: false, became: [], written: [] };
  const root = j(output);
  const imported = new Map<string, string>();
  root
    .find(j.ImportDeclaration, {
      source: { value: '@allxsmith/bestax-bulma' },
    })
    .forEach(p => {
      for (const s of p.node.specifiers ?? []) {
        if (s.type === 'ImportSpecifier' && s.local)
          imported.set(s.local.name, String(s.imported.name));
      }
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nameOf = (node: any): string | undefined => {
    if (node.type === 'JSXIdentifier') return imported.get(node.name);
    if (node.type !== 'JSXMemberExpression') return undefined;
    const object = nameOf(node.object);
    return object && `${object}.${node.property.name}`;
  };
  // Read the className however a pass wrote it: a string, a template or a
  // call that merges it with a class of its own.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const marked = (node: any) =>
    (node.attributes ?? []).some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: any) =>
        a.type === 'JSXAttribute' &&
        a.name.name === 'className' &&
        j(a).toSource().includes(MARK)
    );
  const written = new Set<string>();
  const became = new Set<string>();
  root.find(j.JSXOpeningElement).forEach(p => {
    const name = nameOf(p.node.name);
    if (!name) return;
    written.add(name);
    if (marked(p.node)) became.add(name);
  });
  return {
    element,
    probe,
    changed: true,
    became: [...became],
    written: [...written],
  };
}

/** Migrate every bare element of the source's mapping, and its probes. */
function runsOf(source: LibrarySource): Run[] {
  const migration = getSource(source)!;
  const from = migration.packageName ?? migration.name;
  const elements = [
    ...bareElements(LIBRARY_MAPPINGS[source]).map(e => [e, false] as const),
    ...PROBES[source].map(e => [e, true] as const),
  ];
  return elements.map(([element, probe]) => {
    const roots = [
      ...new Set([...element.matchAll(/<([A-Z]\w*)/g)].map(m => m[1])),
    ];
    const probed = element.replace(/^<([\w.]+)/, `<$1 className="${MARK}"`);
    const input = `import { ${roots.join(', ')} } from '${from}';\nexport const A = () => ${probed};\n`;
    const { output } = runTransform(migration.transform, 'probe.tsx', input, {
      add() {},
    });
    return read(element, probe, output);
  });
}

describe.each(Object.keys(LIBRARY_MAPPINGS) as LibrarySource[])(
  'the components %s writes',
  source => {
    const tables = new Set(TABLE_TARGETS[source]);
    let runs: Run[];
    beforeAll(() => {
      runs = runsOf(source);
    });
    const became = () => new Set(runs.flatMap(r => r.became));
    const written = () => new Set(runs.flatMap(r => r.written));

    it('come from inputs whose import the transform recognizes', () => {
      expect(runs.filter(r => !r.changed).map(r => r.element)).toEqual([]);
    });

    it('include one from each probe that no element run bare writes', () => {
      const bare = new Set(runs.filter(r => !r.probe).flatMap(r => r.written));
      expect(
        runs
          .filter(r => r.probe && r.written.every(name => bare.has(name)))
          .map(r => r.element)
      ).toEqual([]);
    });

    it('are each named by its tables, SPECIAL_TARGETS or ADDED_COMPONENTS', () => {
      const listed = new Set([
        ...tables,
        ...SPECIAL_TARGETS[source],
        ...ADDED_COMPONENTS[source],
      ]);
      const missing = runs.flatMap(r =>
        r.written
          .filter(name => !listed.has(name))
          .map(name => `${name}, written for ${r.element}`)
      );
      expect([...new Set(missing)]).toEqual([]);
    });

    it('include each of its SPECIAL_TARGETS as what an element became, and no table target', () => {
      expect(
        SPECIAL_TARGETS[source].filter(t => !became().has(t) || tables.has(t))
      ).toEqual([]);
    });

    it('include each of its ADDED_COMPONENTS, which no element became, and no table target', () => {
      expect(
        ADDED_COMPONENTS[source].filter(
          t => !written().has(t) || became().has(t) || tables.has(t)
        )
      ).toEqual([]);
    });
  }
);

it('lists the targets of every registered source', () => {
  expect(Object.keys(TABLE_TARGETS).sort()).toEqual(sourceNames().sort());
  expect(Object.keys(SPECIAL_TARGETS).sort()).toEqual(sourceNames().sort());
});

it('probes every registered source that migrates from a library', () => {
  const libraries = sourceNames().filter(
    name => getSource(name)!.packageName !== null
  );
  expect(Object.keys(LIBRARY_MAPPINGS).sort()).toEqual(libraries.sort());
});
