/**
 * Prop-level conversion: applies a PropAction to a single attribute, plus the
 * universal modifier-prop pass shared by every mapped component.
 */

import type { ASTPath } from 'jscodeshift';
import type { PropAction } from '../../types.js';
import { UNIVERSAL_PROPS } from './mapping.js';
import {
  addAttr,
  addTodo,
  attributesOf,
  findAttr,
  literalValueOf,
  makeAttr,
  removeAttr,
  type TransformContext,
} from './jsx-utils.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Add a converted attribute unless the target name is already present — two
 * RBC props can map onto one bestax prop (e.g. `textTransform` + `italic`),
 * and a silent duplicate would be invalid JSX.
 */
function addConverted(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  originalName: string,
  name: string,
  value: string | undefined
): void {
  if (findAttr(element, name)) {
    addTodo(
      ctx,
      path,
      `prop:${originalName}`,
      `\`${originalName}\` maps to \`${name}${value === undefined ? '' : `="${value}"`}\`, but \`${name}\` is already set on this element; reconcile by hand`
    );
    return;
  }
  addAttr(element, makeAttr(ctx.j, name, value));
}

/** Apply one PropAction to `attr` on `element`. */
export function applyPropAction(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  attr: any,
  action: PropAction
): void {
  const { j } = ctx;
  const originalName: string = attr.name.name;

  if (action.drop) {
    removeAttr(element, attr);
    ctx.dirty = true;
    return;
  }
  if (action.todo) {
    addTodo(
      ctx,
      path,
      `prop:${originalName}`,
      `\`${originalName}\` — ${action.todo}`
    );
    return;
  }

  const literal = literalValueOf(attr);

  if (
    action.valueTodo &&
    literal.kind === 'string' &&
    action.valueTodo[literal.value]
  ) {
    addTodo(
      ctx,
      path,
      `prop:${originalName}`,
      `\`${originalName}="${literal.value}"\` — ${action.valueTodo[literal.value]}`
    );
    return;
  }

  if (action.valueToProp) {
    if (literal.kind === 'string') {
      const mapped = action.valueMap?.[literal.value];
      if (mapped) {
        removeAttr(element, attr);
        for (const name of mapped.split(' ')) {
          addConverted(ctx, path, element, originalName, name, undefined);
        }
        ctx.dirty = true;
      }
      // Unmapped literal values are intentionally left untouched.
    } else {
      addTodo(
        ctx,
        path,
        `prop:${originalName}`,
        `\`${originalName}\` has a dynamic value; map it to the matching bestax boolean prop by hand`
      );
    }
    return;
  }

  if (action.booleanToProp) {
    const { name, value } = action.booleanToProp;
    if (literal.kind === 'boolean' && literal.value === true) {
      removeAttr(element, attr);
      addConverted(ctx, path, element, originalName, name, value);
      ctx.dirty = true;
    } else if (literal.kind === 'boolean' && literal.value === false) {
      removeAttr(element, attr);
      ctx.dirty = true;
    } else if (value === undefined) {
      // Pure boolean rename — a dynamic expression can carry over.
      attr.name = j.jsxIdentifier(name);
      ctx.dirty = true;
    } else {
      addTodo(
        ctx,
        path,
        `prop:${originalName}`,
        `\`${originalName}\` has a dynamic value; set \`${name}="${value}"\` conditionally by hand`
      );
    }
    return;
  }

  let renamedTo = originalName;
  if (action.rename) {
    attr.name = j.jsxIdentifier(action.rename);
    renamedTo = action.rename;
    ctx.dirty = true;
  }

  if (action.numberToString) {
    if (literal.kind === 'number') {
      attr.value = j.stringLiteral(String(literal.value));
      ctx.dirty = true;
    } else if (literal.kind === 'expression') {
      addTodo(
        ctx,
        path,
        `prop:${originalName}`,
        `\`${renamedTo}\` takes a string in bestax-bulma ('${originalName}={4}' → '${renamedTo}="4"'); convert the dynamic value`
      );
    }
    return;
  }

  if (action.valueMap) {
    if (literal.kind === 'string') {
      const mapped = action.valueMap[literal.value];
      if (mapped && mapped !== literal.value) {
        attr.value = j.stringLiteral(mapped);
        ctx.dirty = true;
      }
    } else if (literal.kind === 'expression') {
      addTodo(
        ctx,
        path,
        `prop:${originalName}`,
        `\`${renamedTo}\` values differ in bestax-bulma (${Object.entries(
          action.valueMap
        )
          .filter(([from, to]) => from !== to)
          .map(([from, to]) => `'${from}'→'${to}'`)
          .join(', ')}); convert the dynamic value`
      );
    }
  }
}

/**
 * Apply the universal RBC modifier-prop conversions to every attribute that
 * was not already handled by the component's own prop map.
 */
export function applyUniversalProps(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  handled: Set<string>
): void {
  for (const attr of [...attributesOf(element)]) {
    const name: string = attr.name.name;
    if (handled.has(name)) continue;
    const action = UNIVERSAL_PROPS[name];
    if (!action) continue;
    applyPropAction(ctx, path, element, attr, action);
  }
}
