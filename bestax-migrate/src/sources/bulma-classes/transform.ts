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
import { plan, type ChildFacts, type ElementFacts, type Plan } from './plan.js';
import {
  REACT_RUNTIMES,
  type JsxRuntime,
  type ServerComponentRoot,
} from './project.js';
import { ruleId } from './rules.js';

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
 * A comment moved to sit after a JSX tag name. It has to be a block comment
 * there: recast prints a line comment as `<// …`, which TypeScript reads as a
 * closing tag.
 */
function afterTagName(comment: any): any {
  if (comment.type !== 'CommentLine') {
    return { ...comment, leading: false, trailing: true };
  }
  return {
    type: 'CommentBlock',
    value: ` ${comment.value.trim().replace(/\*\//g, '*\\/')} `,
    leading: false,
    trailing: true,
  };
}

/**
 * Put `props`, then what stays in `className`, where an element's
 * `className` was. A comment on the className goes with whatever takes its
 * place: the first new attribute, else the next one along, else the tag name.
 */
function writeClassName(
  j: any,
  element: any,
  props: ReadonlyArray<readonly [string, string | true]>,
  className: string | null
): void {
  const attrs = element.openingElement.attributes;
  const classAttr = findAttr(element, 'className');
  const replacement = props.map(([name, value]) =>
    makeAttr(j, name, value === true ? undefined : value)
  );
  if (className) replacement.push(makeAttr(j, 'className', className));
  if (classAttr.comments?.length) {
    const name = element.openingElement.name;
    const carrier =
      replacement[0] ?? attrs.find((attr: any) => attr !== classAttr) ?? name;
    carrier.comments = [
      ...(carrier.comments ?? []),
      ...classAttr.comments.map((comment: any) =>
        carrier === name ? afterTagName(comment) : comment
      ),
    ];
  }
  attrs.splice(attrs.indexOf(classAttr), 1, ...replacement);
}

/** A lowercase intrinsic tag: not a component, not a custom element. */
const INTRINSIC = /^[a-z][a-z0-9]*$/;

/** Subtrees whose tags are not HTML. */
const FOREIGN_ROOTS = new Set(['svg', 'math']);

/** Parents that render their only child as it is. */
const PASS_THROUGH_PARENTS = new Set(['Fragment', 'React.Fragment']);

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
  };
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
    return [...owner, ...parts.slice(1)].join('.');
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
      (child: any) => child.type !== 'JSXText' || reachesReact(child)
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
   */
  const around = (
    elementPath: ASTPath<any>
  ): { bestax: string[]; other: string[] } => {
    const bestax: string[] = [];
    const other: string[] = [];
    for (let up = elementPath.parent; up; up = up.parent) {
      if (up.node?.type !== 'JSXElement') continue;
      const target = bestaxTarget(up.node, up);
      if (target) {
        bestax.push(target);
        continue;
      }
      const parts = jsxNameParts(up.node.openingElement.name);
      const name = parts?.join('.');
      if (name && !INTRINSIC.test(name) && !name.includes('-')) {
        if (!PASS_THROUGH_PARENTS.has(name)) other.push(name);
      }
    }
    return { bestax, other };
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
      bestaxInside: bestaxInside.get(element) ?? [],
      bestaxAround: surrounding.bestax,
      componentsAround: surrounding.other,
      onlyChildOf: onlyChildOf(elementPath, bestaxLocals),
    };
    let result = plan(facts);
    const converts = result.conversion !== null || result.fold !== undefined;
    const becomes = result.conversion?.target ?? result.fold?.target;
    if (className === null && becomes) {
      // The same element with a static className would convert; with a
      // computed one, only a person can turn each condition into its prop.
      const target = becomes;
      result = {
        conversion: null,
        todos: [
          ...result.todos,
          {
            rule: ruleId('dynamic-class', target),
            message: `this \`className\` is computed, and the codemod converts static class strings only; convert this element to bestax \`${target}\` by hand, turning each condition into its prop`,
          },
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
    const [head, ...rest] = conversion.target.split('.');
    renameElement(j, element, [ctx.reserve(head), ...rest].join('.'));
    for (const name of conversion.drop) {
      const holder = findAttr(element, name) ? element : child;
      removeAttr(holder, findAttr(holder, name));
    }
    writeClassName(j, element, conversion.props, conversion.className);
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
