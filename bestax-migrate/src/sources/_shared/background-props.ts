import type { ASTPath } from 'jscodeshift';
import { findAttr, type TransformContext } from './jsx-utils.js';
import { applyPropAction } from './props.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The bestax targets whose props have no `bgColor`, keyed by the name the
 * mappings and structural handlers use as their `target`, and the prop that
 * renders `has-background-{color}` on each: `backgroundColor`, or null when
 * the target takes neither. Every other target takes `bgColor`, which is what
 * react-bulma-components' and rbx's `backgroundColor` becomes by default.
 *
 * bulma-ui declares these props per component, so this is a hand copy.
 * `e2e/background-props.test.ts` holds each row, and every target the two
 * sources name, to the library's types.
 */
export const BACKGROUND_PROPS: Readonly<
  Record<string, 'backgroundColor' | null>
> = {
  Dropdown: 'backgroundColor',
  'Dropdown.Item': 'backgroundColor',
  File: 'backgroundColor',
  Input: 'backgroundColor',
  Menu: 'backgroundColor',
  'Menu.Item': 'backgroundColor',
  'Menu.Label': 'backgroundColor',
  'Menu.List': 'backgroundColor',
  Select: 'backgroundColor',
  Tag: 'backgroundColor',
  TextArea: 'backgroundColor',

  Breadcrumb: null,
  Checkbox: null,
  'Dropdown.Divider': null,
  Loading: null,
  'Message.Body': null,
  'Message.Header': null,
  'Modal.Background': null,
  'Modal.Card': null,
  'Modal.Card.Body': null,
  'Modal.Card.Foot': null,
  'Modal.Card.Head': null,
  'Modal.Card.Title': null,
  'Modal.Close': null,
  'Modal.Content': null,
  'Navbar.Brand': null,
  'Navbar.Burger': null,
  'Navbar.Divider': null,
  'Navbar.Dropdown': null,
  'Navbar.DropdownMenu': null,
  'Navbar.End': null,
  'Navbar.Menu': null,
  'Navbar.Start': null,
  Notification: null,
  'Pagination.Ellipsis': null,
  'Pagination.Next': null,
  'Pagination.Previous': null,
  Panel: null,
  'Panel.Block': null,
  'Panel.Heading': null,
  'Panel.Tabs': null,
  Progress: null,
  Radio: null,
  Table: null,
  'Table.Tbody': null,
  'Table.Td': null,
  'Table.Tfoot': null,
  'Table.Th': null,
  'Table.Thead': null,
  'Table.Tr': null,
  Tabs: null,
  'Tabs.Item': null,
  Tags: null,
};

/** The TODO a target that takes no background color prop gets. */
export const NO_BACKGROUND_TODO =
  'this bestax component takes no background color prop; move the color to a `has-background-*` class in `className`';

/**
 * Handle the element's `backgroundColor` where the universal rename to
 * `bgColor` would write a prop `target` doesn't take: keep it where the
 * target takes `backgroundColor`, and leave a TODO where it takes neither.
 * Either way it's marked handled, so the universal pass leaves it alone. A
 * component's own prop map runs first and wins, as it does for every prop.
 */
export function applyBackgroundColor(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  target: string,
  handled: Set<string>
): void {
  if (handled.has('backgroundColor')) return;
  if (!Object.hasOwn(BACKGROUND_PROPS, target)) return;
  const attr = findAttr(element, 'backgroundColor');
  if (!attr) return;
  handled.add('backgroundColor');
  if (BACKGROUND_PROPS[target] === null) {
    applyPropAction(ctx, path, element, attr, { todo: NO_BACKGROUND_TODO });
  }
}
