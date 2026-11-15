import type { ASTPath } from 'jscodeshift';
import { COLORS } from '../bulma-classes/class-map.js';
import {
  findAttr,
  literalValueOf,
  type TransformContext,
} from './jsx-utils.js';
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

/**
 * The targets in `NO_TEXT_COLOR` whose `color` prop is the text color helper
 * (`Table` and its `Thead`, `Tbody` and `Tfoot`, `Menu` and its parts, and
 * `Dropdown` and its `Item`, but not `Table.Tr`, `Td` or `Th`, whose `color`
 * is their own modifier),
 * rendering `has-text-<color>` as a source's `textColor` did, so `textColor`
 * becomes `color` there. A component's own `color` can share the helper's
 * type and mean something else (Hero's renders `is-<color>`), so
 * `e2e/text-color-props.test.ts` renders each one to check.
 */
export const TEXT_COLOR_VIA_COLOR: ReadonlySet<string> = new Set([
  'Dropdown',
  'Dropdown.Item',
  'Menu',
  'Menu.Item',
  'Menu.Label',
  'Menu.List',
  'Table',
  'Table.Tbody',
  'Table.Tfoot',
  'Table.Thead',
]);

/** The TODO a target that takes no `textColor` gets. */
export const NO_TEXT_COLOR_TODO =
  'this bestax component takes no `textColor` prop; move the color to a `has-text-*` class in `className`';

/**
 * The values the rename writes into `color`: bestax's color names, which the
 * bulma-classes tests hold to its own, and the two keywords. The e2e checks
 * every listed target's `color` takes all of them.
 */
export const HELPER_COLORS: readonly string[] = [
  ...COLORS,
  'inherit',
  'current',
];

/** The TODO where `color` carries the text color but the element already sets it. */
export const COLOR_TAKEN_TODO =
  'this bestax component takes no `textColor` prop, and its `color`, which renders `has-text-*` here, is set on this element or may come from a spread; reconcile the two by hand';

/** The TODO where `color` carries the text color but may not take this value. */
export const COLOR_VALUE_TODO =
  "this bestax component takes no `textColor` prop; its `color` renders `has-text-*` for bestax's color names, with `colorShade` for a shade, so use those, or move the color to a `has-text-*` class in `className`";

/**
 * Handle the element's `textColor` where `target` takes no such prop: rename
 * it to `color` where that is the target's text color helper, the element
 * sets no `color` of its own (nor has a spread that could) and the value is
 * one of bestax's color names,
 * and leave a TODO otherwise. Either way it's marked handled, so the
 * universal pass leaves it alone. Should a component's own prop map ever
 * claim `textColor`, it wins, as it does for every prop.
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
  if (!TEXT_COLOR_VIA_COLOR.has(target)) {
    applyPropAction(ctx, path, element, attr, { todo: NO_TEXT_COLOR_TODO });
    return;
  }
  const spread = element.openingElement.attributes.some(
    (a: any) => a.type === 'JSXSpreadAttribute'
  );
  if (spread || findAttr(element, 'color')) {
    applyPropAction(ctx, path, element, attr, { todo: COLOR_TAKEN_TODO });
    return;
  }
  const literal = literalValueOf(attr);
  const known =
    literal.kind === 'string' && HELPER_COLORS.includes(literal.value);
  applyPropAction(
    ctx,
    path,
    element,
    attr,
    known ? { rename: 'color' } : { todo: COLOR_VALUE_TODO }
  );
}
