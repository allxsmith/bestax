/**
 * Prop-level conversion: applies a PropAction to a single attribute, plus the
 * universal modifier-prop pass shared by every mapped component.
 *
 * Source-agnostic — the universal table is passed in by the caller rather than
 * imported, so each source keeps its own `UNIVERSAL_PROPS` in its `mapping.ts`
 * while sharing this interpreter.
 */

import type { ASTPath } from 'jscodeshift';
import type { PropAction } from '../../types.js';
import {
  addAttr,
  addTodo,
  attributesOf,
  findAttr,
  literalValueOf,
  makeAttr,
  removeAttr,
  resolveBooleanish,
  type TransformContext,
} from './jsx-utils.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Add a converted attribute unless the target name is already present — two
 * source props can map onto one bestax prop (e.g. RBC's `textTransform` +
 * `italic`), and a silent duplicate would be invalid JSX.
 */
export function addConverted(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  originalName: string,
  name: string,
  value: string | undefined
): void {
  addAttrOnce(ctx, path, element, originalName, makeAttr(ctx.j, name, value));
}

/**
 * The same refusal for an attribute the caller has already built — a numeric
 * `size={6}` or a reused expression node, which `makeAttr` cannot express.
 */
export function addAttrOnce(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  originalName: string,
  attr: any
): void {
  const name: string = attr.name.name;
  if (findAttr(element, name)) {
    const value = attr.value;
    const rendered =
      value == null
        ? ''
        : value.type === 'StringLiteral'
          ? `="${value.value}"`
          : '={…}';
    addTodo(
      ctx,
      path,
      `prop:${originalName}`,
      `\`${originalName}\` maps to \`${name}${rendered}\`, but \`${name}\` is already set on this element; reconcile by hand`
    );
    return;
  }
  addAttr(element, attr);
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
    const resolved = resolveBooleanish(attr);
    if (resolved === 'truthy') {
      removeAttr(element, attr);
      addConverted(ctx, path, element, originalName, name, value);
      ctx.dirty = true;
    } else if (resolved === 'falsy') {
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
 * Apply the source library's universal modifier-prop conversions to every
 * attribute that was not already handled by the component's own prop map.
 * `universalProps` is the calling source's `UNIVERSAL_PROPS` table.
 */
export function applyUniversalProps(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  handled: Set<string>,
  universalProps: Record<string, PropAction>
): void {
  for (const attr of [...attributesOf(element)]) {
    const name: string = attr.name.name;
    if (handled.has(name)) continue;
    const action = universalProps[name];
    if (!action) continue;
    applyPropAction(ctx, path, element, attr, action);
  }
}
