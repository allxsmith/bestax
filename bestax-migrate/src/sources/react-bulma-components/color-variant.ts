import type { ASTPath } from 'jscodeshift';
import {
  findAttr,
  literalValueOf,
  removeAttr,
  type TransformContext,
} from '../_shared/jsx-utils.js';
import { addConverted } from '../_shared/props.js';
import { IS_LIGHT_TARGETS } from './mapping.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * react-bulma-components renders `colorVariant` as the `is-light` or
 * `is-dark` class, whatever else the element sets. On a target in
 * `IS_LIGHT_TARGETS`, a literal `light` becomes a bare `isLight`, which
 * renders `is-light`, in place of any `isLight` the element already has
 * (Notification's own `light`, converted before this runs). Anything else is
 * left to the universal `colorVariant` TODO: another value, a dynamic one,
 * one a later spread could override, and another target, a Button that
 * becomes `Delete` included.
 */
export function applyColorVariant(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  target: string,
  handled: Set<string>
): void {
  if (!IS_LIGHT_TARGETS.includes(target)) return;
  const attr = findAttr(element, 'colorVariant');
  if (!attr) return;
  const literal = literalValueOf(attr);
  if (literal.kind !== 'string' || literal.value !== 'light') return;
  const attrs: any[] = element.openingElement.attributes;
  if (
    attrs
      .slice(attrs.indexOf(attr) + 1)
      .some(a => a.type === 'JSXSpreadAttribute')
  ) {
    return;
  }
  handled.add('colorVariant');
  removeAttr(element, attr);
  const isLight = findAttr(element, 'isLight');
  if (isLight) removeAttr(element, isLight);
  addConverted(ctx, path, element, 'colorVariant', 'isLight', undefined);
  ctx.dirty = true;
}
