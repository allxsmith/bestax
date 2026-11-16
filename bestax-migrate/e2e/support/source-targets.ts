/**
 * Every bestax component each source can turn an element into: each `target`
 * its tables name, walked as data, and the ones its structural handlers pick.
 * A test that holds a per-target table to bestax's types runs over
 * `targetsOf` for the sources that table serves.
 *
 * The handler lists are kept by hand. `source-targets.test.ts` runs each
 * library source's transform over its elements and some hand-picked probes,
 * and fails on a component in the output that these lists leave out or file
 * under the wrong one. bulma-classes has no handlers, and its list is read
 * from its class map alone, which nothing here runs its transform against.
 */

import { MAPPING as BLOOMER } from '../../src/sources/bloomer/mapping.js';
import {
  PLACED,
  ROOTS,
  WRAPPERS,
} from '../../src/sources/bulma-classes/class-map.js';
import { MAPPING as RBC } from '../../src/sources/react-bulma-components/mapping.js';
import { MAPPING as RBX } from '../../src/sources/rbx/mapping.js';
import type { ComponentMapping } from '../../src/types.js';

/** The sources that migrate from a component library, keyed by name. */
export const LIBRARY_MAPPINGS = {
  'react-bulma-components': RBC,
  rbx: RBX,
  bloomer: BLOOMER,
} as const satisfies Record<string, Record<string, ComponentMapping>>;

export type LibrarySource = keyof typeof LIBRARY_MAPPINGS;
export type Source = LibrarySource | 'bulma-classes';

/** Every `target` a mapping table names, its subcomponents' included. */
function mappingTargets(table: Record<string, ComponentMapping>): string[] {
  const found: string[] = [];
  const walk = (entry: ComponentMapping) => {
    if (entry.target) found.push(entry.target);
    for (const sub of Object.values(entry.subs ?? {})) walk(sub);
  };
  Object.values(table).forEach(walk);
  return found;
}

/**
 * The targets each source's tables name. For bulma-classes that is its mapped
 * entries, since a `todo` family names a component only as advice for
 * converting by hand, and the components it wraps a plain tag with helper
 * classes in (`<a>` becomes `Link`).
 */
export const TABLE_TARGETS: Record<Source, readonly string[]> = {
  ...(Object.fromEntries(
    Object.entries(LIBRARY_MAPPINGS).map(([source, table]) => [
      source,
      mappingTargets(table),
    ])
  ) as Record<LibrarySource, readonly string[]>),
  'bulma-classes': [
    ...[...Object.values(ROOTS), ...Object.values(PLACED)]
      .filter(entry => entry.status === 'mapped' && entry.target)
      .map(entry => entry.target!),
    ...Object.values(WRAPPERS),
  ],
};

/**
 * Components a source's structural handlers turn an element into that its
 * tables don't name: the parts an `align` or side prop picks, the navbar
 * dropdown's, the pagination arrows, the headings, and `Delete` for
 * react-bulma-components' `<Button remove>`.
 */
export const SPECIAL_TARGETS: Record<Source, readonly string[]> = {
  'react-bulma-components': [
    'Delete',
    'Level.Left',
    'Level.Right',
    'MediaContent',
    'MediaLeft',
    'MediaRight',
    'Navbar.Dropdown',
    'Navbar.End',
    'Navbar.Start',
    'SubTitle',
    'Title',
  ],
  rbx: [
    'Level.Item',
    'Level.Left',
    'Level.Right',
    'Media.Content',
    'Media.Left',
    'Media.Right',
    'Navbar.Dropdown',
    'Navbar.DropdownMenu',
    'Navbar.End',
    'Navbar.Start',
    'Pagination.Next',
    'Pagination.Previous',
    'SubTitle',
    'Title',
  ],
  bloomer: [
    'Navbar.Dropdown',
    'Navbar.DropdownMenu',
    'Navbar.Item',
    'Pagination.Next',
    'Pagination.Previous',
  ],
  'bulma-classes': [],
};

/**
 * Components a library source writes around, beside or inside an element
 * that its tables don't name and no element becomes: the `Tabs.List` a tabs
 * handler wraps the tabs in, the `Menu.Label` react-bulma-components'
 * `Menu.List` writes from its `title`, and the `Badge` and `Tooltip` rbx
 * wraps an element in for its `badge` and `tooltip` props. The passes that
 * read the per-target tables never run on one, so `targetsOf` leaves them out.
 */
export const ADDED_COMPONENTS: Record<LibrarySource, readonly string[]> = {
  'react-bulma-components': ['Menu.Label', 'Tabs.List'],
  rbx: ['Badge', 'Tabs.List', 'Tooltip'],
  bloomer: [],
};

/** Every component an element of the named sources can become, once each, sorted. */
export function targetsOf(...sources: Source[]): string[] {
  const found = new Set<string>();
  for (const source of sources) {
    const table = TABLE_TARGETS[source];
    const special = SPECIAL_TARGETS[source];
    if (!table || !special)
      throw new Error(`no targets listed for source ${source}`);
    table.forEach(t => found.add(t));
    special.forEach(t => found.add(t));
  }
  return [...found].sort();
}
