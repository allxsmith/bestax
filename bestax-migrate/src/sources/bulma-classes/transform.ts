/**
 * Raw Bulma classes on plain JSX → @allxsmith/bestax-bulma components.
 *
 * Unlike the library sources there is no import to anchor on: a file is in
 * scope when a lowercase JSX element carries a `className` with a Bulma class
 * `class-map.ts` knows. Each such element goes through `plan()`, which
 * converts it only when the component renders exactly the same markup.
 *
 * Passes, in order:
 *   1. the shared stylesheet-import pass (a no-op under the default `keep`)
 *   2. plan every element in scope, children before parents; a computed
 *      className is planned from the strings in it and becomes a TODO, never
 *      a conversion
 *   3. file-level gates: a non-React JSX runtime, CommonJS, styled-jsx, and a
 *      Next.js server component (bestax's components are client components)
 *   4. TODOs in reading order; conversions innermost first
 *   5. write the bestax import, after the file's last import
 */

import type { API, ASTPath, FileInfo } from 'jscodeshift';
import path from 'node:path';
import type { TransformOptions } from '../../types.js';
import {
  addTodo,
  findAttr,
  forgetJsxParens,
  jsxNameParts,
  literalValueOf,
  makeAttr,
  removeAttr,
  renameElement,
  reprintDirectives,
  type TransformContext,
} from '../_shared/jsx-utils.js';
import {
  collectBoundNames,
  makeReserve,
  prefersTabs,
  resolvesToBinding,
} from '../_shared/imports.js';
import { rewriteStylesheetImports } from '../_shared/css-imports.js';
import {
  BESTAX,
  buildBestaxImport,
  placeBestaxImport,
  seedBestaxImport,
} from '../_shared/bestax-import.js';
import {
  plan,
  type ChildFacts,
  type Conversion,
  type ElementFacts,
  type Plan,
} from './plan.js';
import {
  REACT_RUNTIMES,
  type JsxRuntime,
  type ServerComponentRoot,
} from './project.js';
import { ROOTS, rootFor } from './class-map.js';
import { ruleId } from './rules.js';

/**
 * A part imported under its flat export (`MenuList`, `FieldLabel`) is the
 * component the table names with a dot (`Menu.List`, `Field.Label`), which
 * is the spelling every plan compares against.
 */
const FLAT_PARTS: ReadonlyMap<string, string> = new Map(
  Object.values(ROOTS)
    .map(entry => entry.target)
    .filter((target): target is string => target?.includes('.') ?? false)
    .map((target): [string, string] => [target.replace(/\./g, ''), target])
);

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Modules whose element factory is React's, for the classic
 * `/** @jsx … *\/` pragma: React itself, and the `jsx` of Emotion and
 * theme-ui, which wraps it.
 */
const REACT_PRAGMA_SOURCES = new Set([
  'react',
  '@emotion/react',
  '@emotion/core',
  'theme-ui',
  '@theme-ui/core',
]);

/** A pragma line, the way Babel reads one: at the start of a comment line. */
const JSX_IMPORT_SOURCE = /^\s*\*?\s*@jsxImportSource\s+(\S+)/m;
const JSX_FACTORY = /^\s*\*?\s*@jsx\s+(\S+)/m;

/**
 * File-level comments that must stay above everything else: type-checker and
 * linter directives, JSX pragmas, licence markers. Not the next-line ones.
 */
const HEADER_PRAGMA =
  /^[\s*]*(?:@ts-(?:no)?check|@flow|@noflow|eslint-disable(?!-)|@jsx|@jsxImportSource|@jsxRuntime|@license|@preserve)\b/;

/** Directives that act on the line after them, so must stay above it. */
const NEXT_LINE_DIRECTIVE =
  /^[\s*]*(?:eslint-disable-next-line|@ts-expect-error|@ts-ignore|prettier-ignore)\b/;

/**
 * A comment moved into a JSX tag, before or after a node there. It has to be
 * a block comment: after a tag name recast prints a line comment as `<// …`,
 * which TypeScript reads as a closing tag, and before an attribute it would
 * run on into it.
 */
function asBlock(comment: any, trailing: boolean): any {
  const placed = { leading: !trailing, trailing };
  if (comment.type !== 'CommentLine') return { ...comment, ...placed };
  return {
    type: 'CommentBlock',
    value: ` ${comment.value.trim().replace(/\*\//g, '*\\/')} `,
    ...placed,
  };
}

/** A comment moved to sit after a JSX tag name. */
function afterTagName(comment: any): any {
  return asBlock(comment, true);
}

/**
 * Put `replacement` where an element's `className` was. A comment on the
 * className, and any `carried` from inside it, goes with whatever takes its
 * place: the first new attribute, else the next one along, else the tag
 * name. A className kept in `replacement` keeps its own.
 */
function spliceClassName(
  element: any,
  replacement: any[],
  carried: readonly any[] = []
): void {
  const attrs = element.openingElement.attributes;
  const classAttr = findAttr(element, 'className');
  const kept = replacement.includes(classAttr);
  const moving = [...(kept ? [] : (classAttr.comments ?? [])), ...carried];
  if (moving.length > 0) {
    const name = element.openingElement.name;
    const carrier =
      replacement[0] ?? attrs.find((attr: any) => attr !== classAttr) ?? name;
    carrier.comments = [
      ...(carrier.comments ?? []),
      ...moving.map((comment: any) =>
        carrier === name ? afterTagName(comment) : comment
      ),
    ];
  }
  attrs.splice(attrs.indexOf(classAttr), 1, ...replacement);
}

/** Put `props`, then what stays in `className`, where `className` was. */
function writeClassName(
  j: any,
  element: any,
  props: ReadonlyArray<readonly [string, string | true]>,
  className: string | null
): void {
  const replacement = props.map(([name, value]) =>
    makeAttr(j, name, value === true ? undefined : value)
  );
  if (className) replacement.push(makeAttr(j, 'className', className));
  spliceClassName(element, replacement);
}

/**
 * The same, for a `className` a joiner builds: the classes a prop now
 * renders leave the call, each condition that became a prop moves onto it,
 * and what is left stays in the call (a plain string when nothing in it is
 * conditional, no `className` when nothing is left). Returns whether the
 * call is gone.
 */
function writeJoined(
  j: any,
  element: any,
  conversion: Conversion,
  joined: Joined
): boolean {
  const { call, statics, parts } = joined;
  const kept = new Set(conversion.className?.split(' ') ?? []);
  const carried: any[] = [];
  const remove = (list: any[], node: any) => list.splice(list.indexOf(node), 1);
  for (const node of statics) {
    const classes = classesIn(staticText(node)!);
    const remaining = classes.filter(token => kept.has(token));
    if (remaining.length === classes.length) continue;
    if (remaining.length === 0) {
      carried.push(...commentsWithin(node));
      remove(call.arguments, node);
      continue;
    }
    const literal = j.stringLiteral(remaining.join(' '));
    literal.comments = node.comments;
    call.arguments[call.arguments.indexOf(node)] = literal;
  }
  const conditions = (conversion.conditional ?? []).map(([prop, token]) => {
    const part = parts.find(
      found => found.tokens.length === 1 && found.tokens[0] === token
    )!;
    carried.push(...commentsWithin(part.node, part.condition));
    if (part.object) {
      remove(part.object.properties, part.node);
      if (part.object.properties.length === 0) {
        carried.push(...commentsWithin(part.object));
        remove(call.arguments, part.object);
      }
    } else {
      remove(call.arguments, part.node);
    }
    const value = part.negate
      ? j.unaryExpression('!', part.condition)
      : part.condition;
    return j.jsxAttribute(
      j.jsxIdentifier(prop),
      j.jsxExpressionContainer(value)
    );
  });
  const classAttr = findAttr(element, 'className');
  let rest: any[] = [classAttr];
  const gone = call.arguments.every((arg: any) => staticText(arg) !== null);
  if (gone) {
    carried.push(...commentsWithin(classAttr.value));
    const classes = call.arguments.flatMap((arg: any) =>
      classesIn(staticText(arg)!)
    );
    rest =
      classes.length > 0 ? [makeAttr(j, 'className', classes.join(' '))] : [];
  }
  spliceClassName(
    element,
    [
      ...conversion.props.map(([name, value]) =>
        makeAttr(j, name, value === true ? undefined : value)
      ),
      ...conditions,
      ...rest,
    ],
    carried.map(comment => asBlock(comment, false))
  );
  return gone;
}

/** A lowercase intrinsic tag: not a component, not a custom element. */
const INTRINSIC = /^[a-z][a-z0-9]*$/;

/** Subtrees whose tags are not HTML. */
const FOREIGN_ROOTS = new Set(['svg', 'math']);

/** Parents that render their only child as it is. */
const PASS_THROUGH_PARENTS = new Set(['Fragment', 'React.Fragment']);

/**
 * Class joiners whose arguments the codemod can read exactly, by package and
 * export: a string adds its classes, and an object key, `a && 'x'` or
 * `a ? 'x' : ''` adds them when the condition is truthy. Not `clsx/lite`,
 * which ignores objects, `classnames/dedupe`, where a later key can take a
 * class back, or `classnames/bind`, which looks names up in a CSS module.
 */
const JOINERS: Readonly<Record<string, readonly string[]>> = {
  clsx: ['default', 'clsx'],
  classnames: ['default'],
};

/** A string literal's or an expression-free template's text, else null. */
function staticText(node: any): string | null {
  if (node?.type === 'StringLiteral') return node.value;
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0].value.cooked ?? null;
  }
  return null;
}

function classesIn(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/** A joiner argument that adds nothing: `''`, `null`, `undefined`, `false`. */
function addsNothing(node: any): boolean {
  if (staticText(node)?.trim() === '') return true;
  if (node.type === 'NullLiteral') return true;
  if (node.type === 'BooleanLiteral') return node.value === false;
  return node.type === 'Identifier' && node.name === 'undefined';
}

/**
 * Whether evaluating an expression can't change anything: names, literals,
 * property reads, and operators over those. A call, an assignment, `new` or
 * `delete` can. (So can a getter; a property read is taken as a read.)
 */
function sideEffectFree(node: any): boolean {
  switch (node?.type) {
    case 'Identifier':
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
    case 'NullLiteral':
    case 'BigIntLiteral':
    case 'ThisExpression':
      return true;
    case 'TemplateLiteral':
      return node.expressions.every(sideEffectFree);
    case 'MemberExpression':
    case 'OptionalMemberExpression':
      return (
        sideEffectFree(node.object) &&
        (!node.computed || sideEffectFree(node.property))
      );
    case 'UnaryExpression':
      return node.operator !== 'delete' && sideEffectFree(node.argument);
    case 'BinaryExpression':
    case 'LogicalExpression':
      return sideEffectFree(node.left) && sideEffectFree(node.right);
    case 'ConditionalExpression':
      return [node.test, node.consequent, node.alternate].every(sideEffectFree);
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
    case 'TSNonNullExpression':
    case 'TSTypeAssertion':
    case 'ParenthesizedExpression':
      return sideEffectFree(node.expression);
    default:
      return false;
  }
}

/** Classes a joiner adds when a condition holds, and where they are written. */
interface JoinedPart {
  tokens: string[];
  condition: any;
  /** The classes are added when the condition is falsy (`a ? '' : 'x'`). */
  negate: boolean;
  /** The argument, or the object property, that adds them. */
  node: any;
  /** The object `node` is a property of. */
  object?: any;
}

/** A `className` a joiner builds, read argument by argument. */
interface Joined {
  call: any;
  /** The classes it always adds. */
  tokens: string[];
  /** The arguments that add them. */
  statics: any[];
  parts: JoinedPart[];
}

/**
 * A `className={joiner(…)}` whose every argument the codemod can read, or
 * undefined: an argument it can't (a variable, a call, a spread, an array)
 * could add any class.
 */
function readJoiner(
  value: any,
  isJoiner: (callee: any) => boolean
): Joined | undefined {
  const call =
    value?.type === 'JSXExpressionContainer' ? value.expression : null;
  if (call?.type !== 'CallExpression' || !isJoiner(call.callee)) {
    return undefined;
  }
  const statics: any[] = [];
  const parts: JoinedPart[] = [];
  for (const arg of call.arguments) {
    if (staticText(arg) !== null) {
      statics.push(arg);
    } else if (arg.type === 'ObjectExpression') {
      for (const property of arg.properties) {
        const plain =
          (property.type === 'ObjectProperty' ||
            property.type === 'Property') &&
          !property.computed &&
          !property.method &&
          (property.kind === undefined || property.kind === 'init');
        const key = !plain
          ? undefined
          : property.key.type === 'Identifier'
            ? property.key.name
            : staticText(property.key);
        if (key == null) return undefined;
        parts.push({
          tokens: classesIn(key),
          condition: property.value,
          negate: false,
          node: property,
          object: arg,
        });
      }
    } else if (
      arg.type === 'LogicalExpression' &&
      arg.operator === '&&' &&
      staticText(arg.right) !== null
    ) {
      parts.push({
        tokens: classesIn(staticText(arg.right)!),
        condition: arg.left,
        negate: false,
        node: arg,
      });
    } else if (
      arg.type === 'ConditionalExpression' &&
      staticText(arg.consequent) !== null &&
      addsNothing(arg.alternate)
    ) {
      parts.push({
        tokens: classesIn(staticText(arg.consequent)!),
        condition: arg.test,
        negate: false,
        node: arg,
      });
    } else if (
      arg.type === 'ConditionalExpression' &&
      staticText(arg.alternate) !== null &&
      addsNothing(arg.consequent)
    ) {
      parts.push({
        tokens: classesIn(staticText(arg.alternate)!),
        condition: arg.test,
        negate: true,
        node: arg,
      });
    } else {
      return undefined;
    }
  }
  const tokens = [
    ...new Set(statics.flatMap(node => classesIn(staticText(node)!))),
  ];
  return { call, tokens, statics, parts };
}

/**
 * Every comment on a node and inside it, except inside `keep` (a condition
 * that moves, taking its comments with it).
 */
function commentsWithin(node: any, keep?: any): any[] {
  const found: any[] = [];
  const visit = (current: any) => {
    if (!current || typeof current !== 'object' || current === keep) return;
    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }
    if (typeof current.type !== 'string') return;
    found.push(...(current.comments ?? []));
    for (const [key, child] of Object.entries(current)) {
      if (key !== 'comments' && key !== 'loc' && key !== 'original') {
        visit(child);
      }
    }
  };
  visit(node);
  return found;
}

/**
 * The static text of a `className`, or null when it is computed. A string
 * literal, `{'…'}`, and a template literal with no expressions are static.
 */
function staticClassName(attr: any): string | null {
  const value = attr.value;
  if (!value) return null;
  if (value.type === 'StringLiteral') return value.value;
  if (value.type !== 'JSXExpressionContainer') return null;
  const expression = value.expression;
  if (expression.type === 'StringLiteral') return expression.value;
  if (
    expression.type === 'TemplateLiteral' &&
    expression.expressions.length === 0
  ) {
    return expression.quasis[0].value.cooked ?? null;
  }
  return null;
}

/**
 * The class names a computed `className` can produce: its strings, template
 * text and object keys (`cx('box', { 'is-active': on })`). A string used as a
 * computed member (`styles['box']`) is a lookup key, not a class.
 */
function classTokensOf(node: any): string[] {
  const out: string[] = [];
  const visit = (current: any, parent: any, key: string) => {
    if (!current || typeof current !== 'object') return;
    if (current.type === 'StringLiteral') {
      const lookupKey =
        parent?.type === 'MemberExpression' &&
        parent.computed &&
        key === 'property';
      if (!lookupKey) out.push(current.value);
    } else if (current.type === 'TemplateElement') {
      out.push(current.value.cooked ?? '');
    } else if (
      (current.type === 'ObjectProperty' || current.type === 'Property') &&
      !current.computed &&
      current.key?.type === 'Identifier'
    ) {
      out.push(current.key.name);
    }
    for (const [childKey, child] of Object.entries(current)) {
      if (childKey === 'loc' || childKey === 'comments') continue;
      if (Array.isArray(child)) {
        for (const item of child) visit(item, current, childKey);
      } else if (child && typeof (child as any).type === 'string') {
        visit(child, current, childKey);
      }
    }
  };
  visit(node, null, '');
  return [...new Set(out.flatMap(text => text.split(/\s+/)).filter(Boolean))];
}

/** A string attribute's value, `true` for a bare one, else null. */
function attributeValue(attr: any): string | true | null {
  const literal = literalValueOf(attr);
  if (literal.kind === 'string') return literal.value;
  return literal.kind === 'boolean' && literal.value ? true : null;
}

function attributeName(attr: any): string {
  return attr.name.type === 'JSXNamespacedName'
    ? `${attr.name.namespace.name}:${attr.name.name.name}`
    : attr.name.name;
}

/** An element's attributes but `className`, as the planner reads them. */
function attributesBesides<T>(
  element: any,
  classAttr: any,
  read: (attr: any) => T
): Map<string, T> {
  const attributes = new Map<string, T>();
  for (const attr of element.openingElement.attributes ?? []) {
    if (attr.type !== 'JSXAttribute' || attr === classAttr) continue;
    attributes.set(attributeName(attr), read(attr));
  }
  return attributes;
}

/** A child's attribute as `ChildFacts` reads it: a number literal is that number. */
function childAttributeValue(attr: any): string | number | true | null {
  const literal = literalValueOf(attr);
  return literal.kind === 'number' ? literal.value : attributeValue(attr);
}

function hasSpread(element: any): boolean {
  return (element.openingElement.attributes ?? []).some(
    (attr: any) => attr.type === 'JSXSpreadAttribute'
  );
}

/** The comments inside an element's tags, on the tags and their names. */
function tagComments(element: any): any[] {
  const { openingElement, closingElement } = element;
  return [
    openingElement,
    openingElement.name,
    closingElement,
    closingElement?.name,
  ].flatMap((node: any) => node?.comments ?? []);
}

/** Every comment in the file (recast hangs them on the nodes). */
function commentsOf(root: any, j: any): any[] {
  const comments = new Set<any>();
  root.find(j.Node).forEach((nodePath: any) => {
    for (const comment of nodePath.node.comments ?? []) comments.add(comment);
  });
  return [...comments];
}

/**
 * The JSX runtime a file names for itself: `'react'`, another runtime's
 * name, or null when it names none.
 */
function fileJsxRuntime(root: any, j: any): string | null {
  const comments = commentsOf(root, j).map(comment => comment.value);
  const importSource = comments
    .map(text => text.match(JSX_IMPORT_SOURCE)?.[1])
    .find(Boolean);
  if (importSource) {
    return REACT_RUNTIMES.has(importSource) ? 'react' : importSource;
  }
  const factory = comments
    .map(text => text.match(JSX_FACTORY)?.[1])
    .find(Boolean);
  if (!factory) return null;
  // The module the factory is imported from names the runtime (`h` from
  // preact is preact); a factory the file does not import is named as written.
  const local = factory.split('.')[0];
  const source = root
    .find(j.ImportDeclaration)
    .paths()
    .map((importPath: any) => importPath.node)
    .find((node: any) =>
      (node.specifiers ?? []).some((spec: any) => spec.local?.name === local)
    )?.source.value;
  if (source === undefined) {
    return factory === 'React.createElement' ? 'react' : factory;
  }
  return REACT_PRAGMA_SOURCES.has(String(source)) ? 'react' : String(source);
}

/** The runtime the innermost package around this file declares, if any. */
function projectJsxRuntime(file: string, runtimes: unknown): string | null {
  if (!Array.isArray(runtimes)) return null;
  const resolved = path.resolve(file);
  const found = (runtimes as JsxRuntime[])
    .filter(entry => resolved.startsWith(`${entry.dir}${path.sep}`))
    .sort((a, b) => b.dir.length - a.dir.length)[0];
  return found ? found.runtime : null;
}

/** Whether a file is CommonJS: `require` or `module.exports`, no ES modules. */
function isCommonJs(root: any, j: any): boolean {
  const esModule =
    root.find(j.ImportDeclaration).length > 0 ||
    root.find(j.ExportNamedDeclaration).length > 0 ||
    root.find(j.ExportDefaultDeclaration).length > 0 ||
    root.find(j.ExportAllDeclaration).length > 0;
  if (esModule) return false;
  const requires =
    root.find(j.CallExpression, {
      callee: { type: 'Identifier', name: 'require' },
    }).length > 0;
  const moduleExports =
    root.find(j.MemberExpression, {
      object: { type: 'Identifier', name: 'module' },
      property: { name: 'exports' },
    }).length > 0 ||
    root.find(j.AssignmentExpression, {
      left: { type: 'MemberExpression', object: { name: 'exports' } },
    }).length > 0;
  return requires || moduleExports;
}

/** Whether the file scopes styles with styled-jsx (`<style jsx>`). */
function usesStyledJsx(root: any, j: any): boolean {
  return (
    root
      .find(j.JSXOpeningElement, { name: { name: 'style' } })
      .filter((openingPath: any) =>
        Boolean(findAttr(openingPath.parent.node, 'jsx'))
      ).length > 0
  );
}

/** Whether a Next.js App Router may render this file as a server component. */
function mayBeServerComponent(file: string, roots: unknown): boolean {
  if (!Array.isArray(roots)) return false;
  const resolved = path.resolve(file);
  const inside = (dir: string) => resolved.startsWith(`${dir}${path.sep}`);
  return (roots as ServerComponentRoot[]).some(
    root => inside(root.dir) && !root.except.some(inside)
  );
}

/** Whether a JSX child is real content, not whitespace or a comment. */
function isContent(child: any): boolean {
  if (child.type === 'JSXText') return child.value.trim().length > 0;
  if (child.type === 'JSXExpressionContainer') {
    return child.expression.type !== 'JSXEmptyExpression';
  }
  return true;
}

/**
 * Whether a JSX child reaches React at all. JSX drops a comment, and text
 * made only of spaces and tabs split by a line break; it keeps the rest.
 * `<div>  </div>` has a child, which `Card` would wrap, and so does an
 * `&nbsp;` on its own line: `trim()` would drop it, and JSX does not.
 */
function reachesReact(child: any): boolean {
  if (child.type !== 'JSXText') return isContent(child);
  return /[^ \t\r\n]/.test(child.value) || !/[\r\n]/.test(child.value);
}

/** Whitespace React drops, which nothing is lost with. A comment is kept. */
function dropped(child: any): boolean {
  return child.type === 'JSXText' && !reachesReact(child);
}

/** A plain HTML child as the planner reads it; nothing for a component. */
function childFacts(child: any): ChildFacts | undefined {
  const name = child.openingElement.name;
  if (name.type !== 'JSXIdentifier' || !INTRINSIC.test(name.name)) {
    return undefined;
  }
  const classAttr = findAttr(child, 'className');
  const className = classAttr && staticClassName(classAttr);
  return {
    tag: name.name,
    ...(classAttr && {
      tokens:
        className === null
          ? null
          : [...new Set(className.split(/\s+/).filter(Boolean))],
    }),
    attributes: attributesBesides(child, classAttr, childAttributeValue),
    hasSpread: hasSpread(child),
    isEmpty: (child.children ?? []).every(dropped),
  };
}

/**
 * An element's children as plain HTML elements, when that is every one
 * React renders; undefined when one is anything else.
 */
function childElementsOf(element: any): ChildFacts[] | undefined {
  const children: ChildFacts[] = [];
  for (const child of element.children ?? []) {
    if (dropped(child)) continue;
    const found = child.type === 'JSXElement' ? childFacts(child) : undefined;
    if (!found) return undefined;
    children.push(found);
  }
  return children;
}

function insideForeignContent(elementPath: ASTPath<any>): boolean {
  let current: any = elementPath.parent;
  while (current) {
    const name = current.node?.openingElement?.name;
    if (name?.type === 'JSXIdentifier' && FOREIGN_ROOTS.has(name.name)) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

/**
 * The component this element is the only child of, when that component is
 * not a bestax one or a fragment: `Link` for `<Link><a className="button">`.
 */
function onlyChildOf(
  elementPath: ASTPath<any>,
  bestaxLocals: ReadonlySet<string>
): string | undefined {
  const parent = elementPath.parent?.node;
  if (parent?.type !== 'JSXElement') return undefined;
  const parts = jsxNameParts(parent.openingElement.name);
  if (!parts || INTRINSIC.test(parts.join('.'))) return undefined;
  const name = parts.join('.');
  if (PASS_THROUGH_PARENTS.has(name) || bestaxLocals.has(parts[0])) {
    return undefined;
  }
  const content = (parent.children ?? []).filter(isContent);
  return content.length === 1 && content[0] === elementPath.node
    ? name
    : undefined;
}

export default function transform(
  fileInfo: FileInfo,
  api: API,
  options: TransformOptions = {}
): string | undefined {
  const source = fileInfo.source;
  // Cheap pre-filter: no className and no stylesheet import, nothing to do.
  if (!source.includes('className') && !source.includes('bulma')) {
    return undefined;
  }
  const j = api.jscodeshift;
  const root = j(source);

  const ctx: TransformContext = {
    j,
    file: fileInfo.path,
    collector: options.collector,
    retained: new Set<string>(),
    needed: new Map<string, string>(),
    reserve: name => name, // replaced below once local bindings are known
    overrides: new WeakMap<object, string>(),
    dirty: false,
  };
  const print = (): string | undefined => {
    if (!ctx.dirty) return undefined;
    forgetJsxParens(j, root);
    reprintDirectives(j, root);
    return root.toSource({ quote: 'double', useTabs: prefersTabs(source) });
  };

  // ---- 1. Stylesheet imports ------------------------------------------------
  // The default is `keep`: the app's own Bulma stylesheet already styles
  // every class a converted element renders.
  rewriteStylesheetImports(ctx, root, options.cssMode ?? 'keep');

  // ---- 2. Plan the elements in scope ----------------------------------------
  // Each local bestax name, with the component path it stands for: `Card`
  // for `import { Card as C }`, nothing for a namespace (`B.Card`).
  const bestaxNames = new Map<string, string[]>();
  root
    .find(j.ImportDeclaration, { source: { value: BESTAX } })
    .forEach((importPath: any) => {
      for (const spec of importPath.node.specifiers ?? []) {
        if (!spec.local) continue;
        bestaxNames.set(
          spec.local.name,
          spec.type === 'ImportSpecifier' ? [spec.imported.name] : []
        );
      }
    });
  const bestaxLocals = new Set(bestaxNames.keys());

  // Children are planned before their parents (reverse document order), so
  // a parent can see what its children become: `Card` converts only beside
  // a child that is one of its parts.
  const planned = new Map<object, Plan>();
  const programScope: unknown = root.find(j.Program).paths()[0]?.scope;
  // The joiners the file imports, by local name, and the elements whose
  // joiner call converts.
  const joinerLocals = new Set<string>();
  root.find(j.ImportDeclaration).forEach((importPath: any) => {
    const node = importPath.node;
    const exported = Object.hasOwn(JOINERS, node.source.value)
      ? JOINERS[node.source.value]
      : undefined;
    if (!exported || node.importKind === 'type') return;
    for (const spec of node.specifiers ?? []) {
      const name =
        spec.type === 'ImportDefaultSpecifier'
          ? 'default'
          : spec.type === 'ImportSpecifier' && spec.importKind !== 'type'
            ? (spec.imported.name ?? spec.imported.value)
            : undefined;
      if (name && exported.includes(name)) joinerLocals.add(spec.local.name);
    }
  });
  /** Whether a callee is one of those joiners where it is called. */
  const isJoiner = (callee: any, scopePath: ASTPath<any>): boolean =>
    callee?.type === 'Identifier' &&
    joinerLocals.has(callee.name) &&
    resolvesToBinding(scopePath, callee.name, programScope);
  const joins = new Map<object, Joined>();
  /** Joiners a rewritten className no longer calls. */
  const unjoined = new Set<string>();
  /**
   * The bestax component an element already is, when its name is the bestax
   * import and not a local that shadows it; `scopePath` is where the name is
   * looked up.
   */
  const bestaxTarget = (
    element: any,
    scopePath: ASTPath<any>
  ): string | undefined => {
    const parts = jsxNameParts(element.openingElement.name);
    const owner = parts && bestaxNames.get(parts[0]);
    if (!owner || !resolvesToBinding(scopePath, parts[0], programScope)) {
      return undefined;
    }
    const name = [...owner, ...parts.slice(1)].join('.');
    return FLAT_PARTS.get(name) ?? name;
  };
  const childTargets = (elementPath: ASTPath<any>): string[] =>
    (elementPath.node.children ?? []).flatMap((child: any) => {
      if (child.type !== 'JSXElement') return [];
      const target =
        planned.get(child)?.conversion?.target ??
        planned.get(child)?.fold?.target ??
        // A direct child is looked up in the element's own scope, the child's.
        bestaxTarget(child, elementPath);
      return target ? [target] : [];
    });
  /**
   * The one element an element holds, when it holds nothing else: no text
   * React renders, and no comment, which folding the element would drop.
   */
  const soleChild = (element: any): any => {
    const content = (element.children ?? []).filter(
      (child: any) => !dropped(child)
    );
    return content.length === 1 && content[0].type === 'JSXElement'
      ? content[0]
      : undefined;
  };
  // For each element, the bestax components already in the file inside it:
  // `Field` and `Control` change how bestax's form controls render.
  const bestaxInside = new Map<object, string[]>();
  root.find(j.JSXElement).forEach(elementPath => {
    const target = bestaxTarget(elementPath.node, elementPath);
    if (!target) return;
    for (let up = elementPath.parent; up; up = up.parent) {
      if (up.node?.type !== 'JSXElement') continue;
      bestaxInside.set(up.node, [...(bestaxInside.get(up.node) ?? []), target]);
    }
  });
  /**
   * The components around an element: the bestax ones already in the file,
   * and the rest (not an HTML tag, not a fragment), which could render one.
   * And the classes on the HTML elements around it, computed ones included.
   */
  const around = (
    elementPath: ASTPath<any>
  ): { bestax: string[]; other: string[]; classes: string[] } => {
    const bestax: string[] = [];
    const other: string[] = [];
    const classes: string[] = [];
    for (let up = elementPath.parent; up; up = up.parent) {
      if (up.node?.type !== 'JSXElement') continue;
      const target = bestaxTarget(up.node, up);
      if (target) {
        bestax.push(target);
        continue;
      }
      const parts = jsxNameParts(up.node.openingElement.name);
      const name = parts?.join('.');
      if (name && INTRINSIC.test(name)) {
        const classAttr = findAttr(up.node, 'className');
        if (!classAttr) continue;
        const className = staticClassName(classAttr);
        classes.push(
          ...(className === null
            ? classTokensOf(classAttr.value)
            : className.split(/\s+/).filter(Boolean))
        );
      } else if (name && !name.includes('-')) {
        if (!PASS_THROUGH_PARENTS.has(name)) other.push(name);
      }
    }
    return { bestax, other, classes };
  };

  // `converts` is whether the element would become a component with its
  // classes written out, so it holds for a computed className too.
  const elements: Array<{ path: ASTPath<any>; plan: Plan; converts: boolean }> =
    [];
  const candidates = root.find(j.JSXElement).paths();
  for (const elementPath of [...candidates].reverse()) {
    const element = elementPath.node;
    const name = element.openingElement.name;
    if (name.type !== 'JSXIdentifier' || !INTRINSIC.test(name.name)) continue;
    if (FOREIGN_ROOTS.has(name.name) || insideForeignContent(elementPath)) {
      continue;
    }
    const classAttr = findAttr(element, 'className');
    if (!classAttr) continue;
    const attributes = attributesBesides(element, classAttr, attributeValue);
    const className = staticClassName(classAttr);
    const surrounding = around(elementPath);
    const sole = soleChild(element);
    const facts: ElementFacts = {
      tag: name.name,
      tokens:
        className === null
          ? classTokensOf(classAttr.value)
          : [...new Set(className.split(/\s+/).filter(Boolean))],
      attributes,
      hasSpread: hasSpread(element),
      hasRef: attributes.has('ref'),
      hasChildren: (element.children ?? []).some(reachesReact),
      childTargets: childTargets(elementPath),
      soleChildTarget: planned.get(sole)?.conversion?.target,
      soleChild: sole && childFacts(sole),
      childElements: childElementsOf(element),
      bestaxInside: bestaxInside.get(element) ?? [],
      bestaxAround: surrounding.bestax,
      componentsAround: surrounding.other,
      classesAround: surrounding.classes,
      onlyChildOf: onlyChildOf(elementPath, bestaxLocals),
    };
    // A joiner call the codemod can read converts exactly: its fixed classes
    // as for a static className, and each condition on a flag as its prop.
    const joined =
      className === null
        ? readJoiner(classAttr.value, callee => isJoiner(callee, elementPath))
        : undefined;
    let exact: Plan | undefined;
    if (joined) {
      exact = plan({
        ...facts,
        tokens: joined.tokens,
        conditional: joined.parts.map(part => part.tokens),
        impure: joined.parts.flatMap((part, index) =>
          sideEffectFree(part.condition) ? [] : [index]
        ),
      });
      if (exact.conversion) joins.set(element, joined);
      else exact = undefined;
    }
    let result = exact ?? plan(facts);
    const converts = result.conversion !== null || result.fold !== undefined;
    const becomes = result.conversion?.target ?? result.fold?.target;
    if (className === null && !exact && becomes) {
      // The same element with a static className would convert; with one
      // computed any other way, only a person can turn each condition into
      // its prop.
      const target = becomes;
      // A call it could read says what stopped it instead.
      const conditionalRoot = joined?.parts
        .flatMap(part => part.tokens)
        .find(token => rootFor(token)?.target === target);
      const message = !joined
        ? `this \`className\` is computed, and the codemod reads only a \`clsx\` or \`classnames\` call of class strings and conditional classes; convert this element to bestax \`${target}\` by hand, turning each condition into its prop`
        : conditionalRoot
          ? `this \`className\` adds \`.${conditionalRoot}\` only under a condition, so whether this element is a bestax \`${target}\` at all depends on it; convert it by hand if it always is, turning each condition into its prop`
          : `this \`className\` is computed, and the codemod can't write every class it adds onto bestax \`${target}\` as it is; convert this element by hand, turning each condition into its prop`;
      result = {
        conversion: null,
        todos: [
          ...result.todos,
          { rule: ruleId('dynamic-class', target), message },
        ],
      };
    }
    if (result.fold) {
      // The wrapper's props join its child's conversion, which has not been
      // applied yet: conversions are applied after every element is planned.
      const inner = planned.get(soleChild(element)!)!.conversion!;
      inner.props.push(...result.fold.props);
      inner.numbers.push(...result.fold.numbers);
    }
    planned.set(element, result);
    if (result.conversion || result.fold || result.todos.length > 0) {
      elements.unshift({ path: elementPath, plan: result, converts });
    }
  }
  if (elements.length === 0) return print();

  // ---- 3. File-level gates ------------------------------------------------------
  // A gate speaks only when an element would convert: its TODO says what to
  // change so a re-run converts them, which is noise when a re-run could not.
  const converting = elements.some(element => element.converts);
  const block = (rule: string, message: string): void => {
    if (converting) addTodo(ctx, elements[0].path, rule, message);
    for (const element of elements) {
      element.plan = { ...element.plan, conversion: null, fold: undefined };
    }
  };
  const runtime =
    fileJsxRuntime(root, j) ??
    projectJsxRuntime(fileInfo.path, options.jsxRuntimes);
  const program = root.find(j.Program).paths()[0].node;
  if (runtime !== null && runtime !== 'react') {
    block(
      'jsx-runtime',
      `this file's JSX renders through \`${runtime}\`, not React, and bestax-bulma components are React components; convert it by hand if it does run on React`
    );
    // Every element TODO is advice about bestax components (rules.test.ts
    // holds each to naming one), and this file cannot use them.
    for (const element of elements) {
      element.plan = { ...element.plan, todos: [] };
    }
  } else if (isCommonJs(root, j)) {
    block(
      'imports',
      'this file is CommonJS (`require` or `module.exports`), and the codemod adds an ES `import` for the bestax components; move the file to ES modules, then re-run'
    );
  } else if (usesStyledJsx(root, j)) {
    block(
      'styled-jsx',
      'this component scopes its styles with styled-jsx, which adds its scoping class to plain elements and not to an imported component, so a converted element would lose its scoped styles; move those styles out of `<style jsx>`, or scope them with `:global()`, then re-run'
    );
  } else if (
    mayBeServerComponent(fileInfo.path, options.serverComponentRoots) &&
    !program.directives?.some((d: any) => d.value.value === 'use client')
  ) {
    block(
      'rsc',
      "this file is in a Next.js App Router project and has no `'use client'`, so it may render as a server component, and bestax-bulma's components are client components; add `'use client'` if the file can be one, then re-run"
    );
  }

  // ---- 4. TODOs in reading order; conversions innermost first ------------------
  const bound = collectBoundNames(j, root, BESTAX);
  // Any name the file already says anywhere forces an alias for the new
  // import: a function expression's own name, a method's parameter, a browser
  // global (`Notification.requestPermission()`). An alias costs nothing;
  // shadowing one of those renders the wrong thing or recurses.
  root.find(j.Identifier).forEach(identifierPath => {
    bound.add(identifierPath.node.name);
  });
  root.find(j.JSXIdentifier).forEach(identifierPath => {
    if (/^[A-Z]/.test(identifierPath.node.name)) {
      bound.add(identifierPath.node.name);
    }
  });
  ctx.reserve = makeReserve(ctx, bound);
  const bestaxImportState = seedBestaxImport(ctx, root);

  for (const { path: elementPath, plan: result } of elements) {
    for (const todo of result.todos) {
      addTodo(ctx, elementPath, todo.rule, todo.message);
    }
  }
  for (const { path: elementPath, plan: result } of [...elements].reverse()) {
    if (result.fold) {
      // The child inside has converted already (innermost first), with the
      // wrapper's props on it; the wrapper itself goes, its comments with the
      // child: one on the wrapper moves to the child, and one inside the
      // wrapper's tags moves inside the child's opening tag.
      const wrapper = elementPath.node;
      const inner = soleChild(wrapper);
      const inTags = [
        ...tagComments(wrapper),
        ...(wrapper.openingElement.attributes ?? []).flatMap(
          (attr: any) => attr.comments ?? []
        ),
      ];
      if (inTags.length) {
        const name = inner.openingElement.name;
        name.comments = [...(name.comments ?? []), ...inTags.map(afterTagName)];
      }
      if (wrapper.comments?.length) {
        inner.comments = [...wrapper.comments, ...(inner.comments ?? [])];
      }
      elementPath.replace(inner);
      ctx.dirty = true;
      continue;
    }
    const conversion = result.conversion;
    if (!conversion) continue;
    const element = elementPath.node;
    // A target that renders the element's only child itself is written in
    // that child's place, so the child's children stay where they are.
    const child = conversion.absorbs ? soleChild(element) : undefined;
    // The element's tags go, and so do the child's tag names: their comments
    // move to the name that stays. The child's tags themselves stay, and
    // keep their own.
    const inTags = child
      ? [
          ...tagComments(element),
          ...[child.openingElement.name, child.closingElement?.name].flatMap(
            (node: any) => node?.comments ?? []
          ),
        ]
      : [];
    if (child) {
      // Renamed before the drops below, which name each attribute as the
      // component is given it.
      const { renames, drop } = conversion.absorbs!;
      for (const name of drop) removeAttr(child, findAttr(child, name));
      for (const [from, to] of renames) {
        findAttr(child, from).name = j.jsxIdentifier(to);
      }
    }
    // A target that renders the element's children itself takes their place:
    // they go, and so does the closing tag, their comments and its own moving
    // to the name that stays.
    const gone = conversion.rendersChildren
      ? [
          ...(element.children ?? [])
            .filter((node: any) => node.type === 'JSXElement')
            .flatMap((node: any) => [
              ...(node.comments ?? []),
              ...tagComments(node),
            ]),
          ...[element.closingElement, element.closingElement?.name].flatMap(
            (node: any) => node?.comments ?? []
          ),
        ]
      : [];
    const [head, ...rest] = conversion.target.split('.');
    renameElement(j, element, [ctx.reserve(head), ...rest].join('.'));
    for (const name of conversion.drop) {
      const holder = findAttr(element, name) ? element : child;
      removeAttr(holder, findAttr(holder, name));
    }
    const joined = joins.get(element);
    if (!joined) {
      writeClassName(j, element, conversion.props, conversion.className);
    } else if (writeJoined(j, element, conversion, joined)) {
      unjoined.add(joined.call.callee.name);
    }
    if (conversion.rendersChildren) {
      element.children = [];
      element.openingElement.selfClosing = true;
      element.closingElement = null;
      if (gone.length) {
        const name = element.openingElement.name;
        name.comments = [...(name.comments ?? []), ...gone.map(afterTagName)];
      }
    }
    let written = element;
    if (child) {
      child.openingElement.name = element.openingElement.name;
      if (child.closingElement) {
        child.closingElement.name = element.closingElement.name;
      }
      if (findAttr(child, 'className')) {
        writeClassName(j, child, conversion.absorbs!.props, null);
      }
      child.openingElement.attributes = [
        ...(element.openingElement.attributes ?? []),
        ...(child.openingElement.attributes ?? []),
      ];
      // A comment on the element moves to the component in its place.
      if (inTags.length) {
        const name = child.openingElement.name;
        name.comments = [...(name.comments ?? []), ...inTags.map(afterTagName)];
      }
      if (element.comments?.length) {
        child.comments = [...element.comments, ...(child.comments ?? [])];
      }
      elementPath.replace(child);
      written = child;
    }
    // After the splice, so a prop the conversion wrote is found as well as
    // an attribute the element already had.
    for (const name of conversion.numbers) {
      const attr = findAttr(written, name);
      attr.value = j.jsxExpressionContainer(
        j.numericLiteral(Number(attributeValue(attr)))
      );
    }
    ctx.dirty = true;
  }

  // A joiner import only these rewrites stopped using goes too, so the file
  // gains no unused import; one the file already left unused stays.
  for (const name of unjoined) {
    const referenced = root
      .find(j.Identifier, { name })
      .filter(
        (identifierPath: any) =>
          identifierPath.parent.node.type !== 'ImportSpecifier' &&
          identifierPath.parent.node.type !== 'ImportDefaultSpecifier'
      );
    if (referenced.size() > 0) continue;
    root.find(j.ImportDeclaration).forEach((importPath: any) => {
      const node = importPath.node;
      const specifiers = node.specifiers ?? [];
      const spec = specifiers.find((found: any) => found.local?.name === name);
      if (!spec) return;
      specifiers.splice(specifiers.indexOf(spec), 1);
      if (specifiers.length > 0) return;
      // The declaration goes with its last name; its comments (a file
      // header, a directive) stay, on the statement beside it.
      const index = program.body.indexOf(node);
      const neighbour = program.body[index + 1] ?? program.body[index - 1];
      if (node.comments?.length && neighbour) {
        neighbour.comments = [...node.comments, ...(neighbour.comments ?? [])];
      }
      program.body.splice(index, 1);
    });
  }

  // ---- 5. The bestax import ---------------------------------------------------
  const body: any[] = program.body;
  placeBestaxImport(
    bestaxImportState,
    buildBestaxImport(ctx, bestaxImportState),
    {
      insertBefore: (node: any) => {
        let last = -1;
        body.forEach((statement, index) => {
          if (statement.type === 'ImportDeclaration') last = index;
        });
        if (last === -1 && body.length > 0) {
          // A file header stays at the top: the source's own leading comments
          // up to the last file-level directive (`@ts-nocheck`) or the last
          // one set off by a blank line. The scan stops at a next-line
          // directive and at a TODO this run wrote, since both belong to the
          // statement below them.
          const first = body[0];
          const leading = (first.comments ?? []).filter(
            (comment: any) => comment.leading
          );
          let end = -1;
          for (let index = 0; index < leading.length; index += 1) {
            const comment = leading[index];
            if (
              typeof comment.end !== 'number' ||
              NEXT_LINE_DIRECTIVE.test(comment.value)
            ) {
              break;
            }
            const next = leading[index + 1];
            const nextStart =
              typeof next?.start === 'number' ? next.start : first.start;
            if (
              HEADER_PRAGMA.test(comment.value) ||
              /\n\s*\n/.test(source.slice(comment.end, nextStart))
            ) {
              end = index;
            }
          }
          const header = leading.slice(0, end + 1);
          if (header.length > 0) {
            first.comments = first.comments.filter(
              (comment: any) => !header.includes(comment)
            );
            node.comments = header;
          }
        }
        body.splice(last + 1, 0, node);
      },
    }
  );

  return print();
}
