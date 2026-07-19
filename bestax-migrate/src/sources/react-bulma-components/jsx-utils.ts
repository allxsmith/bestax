/**
 * Small AST helpers shared by the react-bulma-components transform passes.
 * All functions operate on the babel/tsx AST that jscodeshift's `tsx` parser
 * produces, via the `j` builder API.
 */

import type { JSCodeshift } from 'jscodeshift';
import type { ASTPath } from 'jscodeshift';
import type { TodoCollector } from '../../types.js';

/* eslint-disable @typescript-eslint/no-explicit-any -- recast/babel AST nodes
   are structurally typed; the jscodeshift typings do not cover every JSX node
   shape we manipulate, so this module works on `any` nodes at the edges. */

export interface TransformContext {
  j: JSCodeshift;
  file: string;
  collector: TodoCollector | undefined;
  /** RBC top-level import names that must survive the import rewrite. */
  retained: Set<string>;
  /** bestax-bulma root names to import. */
  needed: Set<string>;
  /**
   * Target overrides set by a parent's structural handler for child elements
   * it has contextual knowledge about (e.g. a Navbar.Dropdown inside a
   * Navbar.Item becomes Navbar.DropdownMenu).
   */
  overrides: WeakMap<object, string>;
  /** Resolves a JSX name node to its canonical RBC path (set by transform). */
  resolve?: (name: any) => string[] | null;
  dirty: boolean;
}

/** Flatten a JSXIdentifier / JSXMemberExpression chain into name parts. */
export function jsxNameParts(name: any): string[] | null {
  if (!name) return null;
  if (name.type === 'JSXIdentifier') return [name.name];
  if (name.type === 'JSXMemberExpression') {
    const object = jsxNameParts(name.object);
    if (!object) return null;
    return [...object, name.property.name];
  }
  return null;
}

/** Build a JSXIdentifier / JSXMemberExpression chain from a dotted name. */
export function buildJsxName(j: JSCodeshift, dotted: string): any {
  const parts = dotted.split('.');
  let node: any = j.jsxIdentifier(parts[0]);
  for (const part of parts.slice(1)) {
    node = j.jsxMemberExpression(node, j.jsxIdentifier(part));
  }
  return node;
}

/** Rename both the opening and (when present) closing element. */
export function renameElement(
  j: JSCodeshift,
  element: any,
  dotted: string
): void {
  element.openingElement.name = buildJsxName(j, dotted);
  if (element.closingElement) {
    element.closingElement.name = buildJsxName(j, dotted);
  }
}

/** Non-spread attributes of an element. */
export function attributesOf(element: any): any[] {
  return (element.openingElement.attributes ?? []).filter(
    (a: any) => a.type === 'JSXAttribute'
  );
}

export function findAttr(element: any, name: string): any | undefined {
  return attributesOf(element).find((a: any) => a.name.name === name);
}

export function removeAttr(element: any, attr: any): void {
  const attrs = element.openingElement.attributes ?? [];
  const index = attrs.indexOf(attr);
  if (index !== -1) attrs.splice(index, 1);
}

export function addAttr(element: any, attr: any): void {
  element.openingElement.attributes = element.openingElement.attributes ?? [];
  element.openingElement.attributes.push(attr);
}

export type LiteralValue =
  | { kind: 'boolean'; value: boolean }
  | { kind: 'string'; value: string }
  | { kind: 'number'; value: number }
  | { kind: 'expression' };

/** Extract the literal value of a JSX attribute, if it has one. */
export function literalValueOf(attr: any): LiteralValue {
  if (attr.value == null) return { kind: 'boolean', value: true };
  const v = attr.value;
  if (v.type === 'StringLiteral') {
    return { kind: 'string', value: v.value };
  }
  if (v.type === 'JSXExpressionContainer') {
    const e = v.expression;
    if (e.type === 'StringLiteral') return { kind: 'string', value: e.value };
    if (e.type === 'NumericLiteral') return { kind: 'number', value: e.value };
    if (e.type === 'BooleanLiteral') return { kind: 'boolean', value: e.value };
    return { kind: 'expression' };
  }
  return { kind: 'expression' };
}

/** Create `name` (bare boolean) or `name="value"` attribute. */
export function makeAttr(j: JSCodeshift, name: string, value?: string): any {
  return j.jsxAttribute(
    j.jsxIdentifier(name),
    value === undefined ? null : j.stringLiteral(value)
  );
}

/**
 * Attach a `// TODO(bestax-migrate): ...` leading comment to the closest
 * enclosing statement (comments inside JSX children are not valid JS, so the
 * statement is the nearest place a line comment can live), and mirror the
 * entry into the report collector with the element's original line number.
 */
export function addTodo(
  ctx: TransformContext,
  path: ASTPath<any>,
  rule: string,
  message: string
): void {
  const { j } = ctx;
  let statement: ASTPath<any> | null = null;
  let current: ASTPath<any> | null = path;
  while (current && current.node) {
    if (
      /Statement$|Declaration$/.test(current.node.type) &&
      current.node.type !== 'Program'
    ) {
      statement = current;
      break;
    }
    current = current.parent;
  }
  // A comment on the declaration inside `export const x = …` prints between
  // `export` and `const`; hoist it to the export statement itself.
  if (
    statement?.parent?.node &&
    /^Export(Named|Default)Declaration$/.test(statement.parent.node.type)
  ) {
    statement = statement.parent;
  }
  const text = ` TODO(bestax-migrate): ${message}`;
  if (statement) {
    const node = statement.node;
    node.comments = node.comments ?? [];
    const exists = node.comments.some((c: any) => c.value === text);
    if (!exists) {
      const comment = j.commentLine(text, true, false);
      node.comments.push(comment);
    }
  }
  ctx.collector?.add({
    file: ctx.file,
    line: path.node?.loc?.start?.line ?? null,
    rule,
    message,
  });
  ctx.dirty = true;
}

/** Build a plain HTML element (used where bestax has no component). */
export function plainElement(
  j: JSCodeshift,
  tag: string,
  className: string | undefined,
  attrs: any[],
  children: any[],
  selfClosing = false
): any {
  const allAttrs = [...attrs];
  if (className) {
    allAttrs.unshift(makeAttr(j, 'className', className));
  }
  const opening = j.jsxOpeningElement(
    j.jsxIdentifier(tag),
    allAttrs,
    selfClosing
  );
  const closing = selfClosing
    ? null
    : j.jsxClosingElement(j.jsxIdentifier(tag));
  return j.jsxElement(opening, closing, selfClosing ? [] : children);
}
