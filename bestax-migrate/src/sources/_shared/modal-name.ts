/**
 * Asks for a name on a converted `Modal`.
 *
 * bestax's `Modal` is a `role="dialog"` while it's open, and a dialog with no
 * name is announced as just "dialog". Only its legacy `modalCardTitle` names
 * it on its own, and no conversion writes that, so a `Modal` that writes no
 * `aria-label` or `aria-labelledby` gets a `name:Modal` TODO asking for one.
 * A spread could hold either, so a `Modal` with one gets no TODO. Both rules
 * are `name:Table`'s: an attribute the author wrote counts whatever its value,
 * since the codemod doesn't second-guess one or guess at a dynamic value.
 *
 * Every library source calls this after its prop passes, with the target the
 * element became, so it reads the attributes the converted element ends up
 * with. That also reaches an element a special retargets onto `Modal` (rbx's
 * `Modal.Container`), and needs no special on react-bulma-components'
 * `Modal`, where one would change how a value reference to it converts.
 */

import type { ASTPath } from 'jscodeshift';
import { addTodo, findAttr, type TransformContext } from './jsx-utils.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** The attributes that name a `Modal`'s dialog. */
const MODAL_NAMES = ['aria-label', 'aria-labelledby'];

export function askForModalName(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  target: string
): void {
  if (target !== 'Modal') return;
  const spread = (element.openingElement.attributes ?? []).some(
    (attr: any) => attr.type === 'JSXSpreadAttribute'
  );
  if (spread || MODAL_NAMES.some(name => findAttr(element, name))) return;
  addTodo(
    ctx,
    path,
    'name:Modal',
    "bestax `Modal` is a dialog while it's open, and this one has no `aria-label` or `aria-labelledby` to name it: give it an `aria-label`, or an `aria-labelledby` pointing at the `id` of its title, such as its `Modal.Card.Title` when it has one"
  );
}
