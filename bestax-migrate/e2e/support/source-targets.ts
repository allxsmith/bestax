/**
 * Every bestax component react-bulma-components and rbx can turn an element
 * into: each `target` their mapping tables name, and the ones their
 * structural handlers pick. A test that holds a per-target table to bestax's
 * types runs over this list.
 */

import { MAPPING as RBC } from '../../src/sources/react-bulma-components/mapping.js';
import { MAPPING as RBX } from '../../src/sources/rbx/mapping.js';
import type { ComponentMapping } from '../../src/types.js';

/** Every `target` a mapping table names, its subcomponents' included. */
function targetsOf(table: Record<string, ComponentMapping>): string[] {
  const found: string[] = [];
  const walk = (entry: ComponentMapping) => {
    if (entry.target) found.push(entry.target);
    for (const sub of Object.values(entry.subs ?? {})) walk(sub);
  };
  Object.values(table).forEach(walk);
  return found;
}

/**
 * Targets a structural handler picks that no mapping entry names as its
 * own: the `align` and side props' parts, the navbar dropdown's, the
 * pagination arrows rbx's links can become, and the headings.
 */
export const SPECIAL_TARGETS = [
  'Level.Item',
  'Level.Left',
  'Level.Right',
  'Media.Content',
  'Media.Left',
  'Media.Right',
  'MediaContent',
  'MediaLeft',
  'MediaRight',
  'Navbar.Dropdown',
  'Navbar.DropdownMenu',
  'Navbar.End',
  'Navbar.Start',
  'Pagination.Next',
  'Pagination.Previous',
  'SubTitle',
  'Title',
];

/** The targets above and the mapping tables', once each, sorted. */
export const SOURCE_TARGETS: readonly string[] = [
  ...new Set([...targetsOf(RBC), ...targetsOf(RBX), ...SPECIAL_TARGETS]),
].sort();
