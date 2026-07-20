/**
 * Flattens RBC's responsive breakpoint-object props into bestax-bulma's flat
 * per-viewport props:
 *
 *   <Element mobile={{ display: 'flex', textSize: 4 }} />
 *     → displayMobile="flex" textSizeMobile="4"
 *   <Columns.Column tablet={{ size: 6, narrow: true }} />
 *     → sizeTablet={6} isNarrowTablet
 *
 * touch / untilWidescreen / untilFullhd have no bestax equivalents and get a
 * TODO. Non-object or dynamic values get a TODO.
 */

import type { ASTPath } from 'jscodeshift';
import { RESPONSIVE_BREAKPOINTS } from './mapping.js';
import {
  addAttr,
  addTodo,
  attributesOf,
  makeAttr,
  removeAttr,
  type TransformContext,
} from './jsx-utils.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type ResponsiveKind = 'generic' | 'columns' | 'column';

const TEXT_ALIGN_MAP: Record<string, string> = {
  center: 'centered',
  justify: 'justified',
  left: 'left',
  right: 'right',
};

function literalOf(prop: any): string | number | boolean | undefined {
  const v = prop.value;
  if (!v) return undefined;
  if (v.type === 'StringLiteral') return v.value;
  if (v.type === 'NumericLiteral') return v.value;
  if (v.type === 'BooleanLiteral') return v.value;
  return undefined;
}

export function flattenResponsiveProps(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  kind: ResponsiveKind
): void {
  const { j } = ctx;
  for (const attr of [...attributesOf(element)]) {
    const name: string = attr.name.name;
    if (!(name in RESPONSIVE_BREAKPOINTS)) continue;

    const suffix = RESPONSIVE_BREAKPOINTS[name];
    if (suffix === null) {
      addTodo(
        ctx,
        path,
        'responsive',
        `no bestax-bulma helper variants for the \`${name}\` breakpoint; restyle with CSS or drop it`
      );
      continue;
    }

    const value = attr.value;
    const objectExpr =
      value?.type === 'JSXExpressionContainer' &&
      value.expression?.type === 'ObjectExpression'
        ? value.expression
        : null;
    if (!objectExpr) {
      addTodo(
        ctx,
        path,
        'responsive',
        `\`${name}\` must be an inline object literal to flatten to bestax per-viewport props; convert it by hand`
      );
      continue;
    }

    const remaining: any[] = [];
    for (const prop of objectExpr.properties) {
      if (prop.type !== 'ObjectProperty' && prop.type !== 'Property') {
        remaining.push(prop);
        continue;
      }
      const key = prop.key?.name ?? prop.key?.value;
      const literal = literalOf(prop);

      if (key === 'display' && typeof literal === 'string') {
        if (literal === 'hidden') {
          addAttr(element, makeAttr(j, `visibility${suffix}`, 'hidden'));
        } else if (literal === 'relative') {
          remaining.push(prop);
          addTodo(
            ctx,
            path,
            'responsive',
            `\`${name}.display: 'relative'\` has no bestax per-viewport equivalent`
          );
          continue;
        } else {
          addAttr(element, makeAttr(j, `display${suffix}`, literal));
        }
      } else if (key === 'textSize' && literal !== undefined) {
        addAttr(element, makeAttr(j, `textSize${suffix}`, String(literal)));
      } else if (key === 'textAlign' && typeof literal === 'string') {
        addAttr(
          element,
          makeAttr(j, `textAlign${suffix}`, TEXT_ALIGN_MAP[literal] ?? literal)
        );
      } else if (key === 'invisible' && literal === true) {
        addAttr(element, makeAttr(j, `visibility${suffix}`, 'invisible'));
      } else if (key === 'only') {
        remaining.push(prop);
        addTodo(
          ctx,
          path,
          'responsive',
          `\`${name}.only\` (-only helper classes) has no bestax equivalent; use className`
        );
        continue;
      } else if (kind === 'column' && (key === 'size' || key === 'offset')) {
        // Column sizes accept numbers and named strings alike; reuse the node.
        const target = `${key}${suffix}`;
        addAttr(
          element,
          j.jsxAttribute(
            j.jsxIdentifier(target),
            j.jsxExpressionContainer(prop.value)
          )
        );
      } else if (kind === 'column' && key === 'narrow' && literal === true) {
        addAttr(element, makeAttr(j, `isNarrow${suffix}`));
      } else if (kind === 'columns' && key === 'gap') {
        addAttr(
          element,
          j.jsxAttribute(
            j.jsxIdentifier(`gap${suffix}`),
            j.jsxExpressionContainer(prop.value)
          )
        );
      } else {
        remaining.push(prop);
        addTodo(
          ctx,
          path,
          'responsive',
          `\`${name}.${String(key)}\` could not be flattened to a bestax per-viewport prop`
        );
        continue;
      }
    }

    if (remaining.length === 0) {
      removeAttr(element, attr);
    } else {
      objectExpr.properties = remaining;
    }
    ctx.dirty = true;
  }
}
