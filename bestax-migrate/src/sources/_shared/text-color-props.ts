import type { ASTPath } from 'jscodeshift';
import { findAttr, type TransformContext } from './jsx-utils.js';
import { applyPropAction } from './props.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The bestax targets whose props have no `textColor`, by the name the
 * mappings and structural handlers use as their `target`.
 * react-bulma-components and rbx pass `textColor` through on every
 * component, which is right everywhere else.
 *
 * bulma-ui declares `textColor` per component, so this is a hand copy.
 * `e2e/text-color-props.test.ts` holds it, and every target the two sources
 * name, to the library's types.
 */
export const NO_TEXT_COLOR: ReadonlySet<string> = new Set([
  'Breadcrumb',
  'Divider',
  'Dropdown',
  'Dropdown.Divider',
  'Dropdown.Item',
  'File',
  'Hero',
  'Input',
  'Loading',
  'Menu',
  'Menu.Item',
  'Menu.Label',
  'Menu.List',
  'Message.Body',
  'Message.Header',
  'Modal.Background',
  'Modal.Card',
  'Modal.Card.Body',
  'Modal.Card.Foot',
  'Modal.Card.Head',
  'Modal.Card.Title',
  'Modal.Close',
  'Modal.Content',
  'Navbar.Divider',
  'Navbar.Dropdown',
  'Navbar.DropdownMenu',
  'Pagination.Ellipsis',
  'Pagination.Next',
  'Pagination.Previous',
  'Panel',
  'Panel.Block',
  'Panel.Heading',
  'Panel.Tabs',
  'Progress',
  'Select',
  'Table',
  'Table.Tbody',
  'Table.Td',
  'Table.Tfoot',
  'Table.Th',
  'Table.Thead',
  'Table.Tr',
  'Tabs',
  'Tabs.Item',
  'Tag',
  'Tags',
  'TextArea',
]);

/** The TODO a target that takes no `textColor` gets. */
export const NO_TEXT_COLOR_TODO =
  'this bestax component takes no `textColor` prop; move the color to a `has-text-*` class in `className`';

/**
 * Leave a TODO on the element's `textColor` where `target` takes no such
 * prop, and mark it handled so the universal pass leaves it alone. A
 * component's own prop map runs first and wins, as it does for every prop.
 */
export function applyTextColor(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  target: string,
  handled: Set<string>
): void {
  if (handled.has('textColor') || !NO_TEXT_COLOR.has(target)) return;
  const attr = findAttr(element, 'textColor');
  if (!attr) return;
  handled.add('textColor');
  applyPropAction(ctx, path, element, attr, { todo: NO_TEXT_COLOR_TODO });
}
