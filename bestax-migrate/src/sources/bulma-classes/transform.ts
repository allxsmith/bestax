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
 *   2. plan every element in scope; a computed className is planned from the
 *      strings in it and becomes a TODO, never a conversion
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
  renameElement,
  reprintDirectives,
  type TransformContext,
} from '../_shared/jsx-utils.js';
import {
  collectBoundNames,
  makeReserve,
  prefersTabs,
} from '../_shared/imports.js';
import { rewriteStylesheetImports } from '../_shared/css-imports.js';
import {
  BESTAX,
  buildBestaxImport,
  placeBestaxImport,
  seedBestaxImport,
} from '../_shared/bestax-import.js';
import { plan, type ElementFacts, type Plan } from './plan.js';
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
  const bestaxLocals = new Set<string>();
  root
    .find(j.ImportDeclaration, { source: { value: BESTAX } })
    .forEach((importPath: any) => {
      for (const spec of importPath.node.specifiers ?? []) {
        if (spec.local) bestaxLocals.add(spec.local.name);
      }
    });

  // `converts` is whether the element would become a component with its
  // classes written out, so it holds for a computed className too.
  const elements: Array<{ path: ASTPath<any>; plan: Plan; converts: boolean }> =
    [];
  root.find(j.JSXElement).forEach(elementPath => {
    const element = elementPath.node;
    const name = element.openingElement.name;
    if (name.type !== 'JSXIdentifier' || !INTRINSIC.test(name.name)) return;
    if (FOREIGN_ROOTS.has(name.name) || insideForeignContent(elementPath)) {
      return;
    }
    const classAttr = findAttr(element, 'className');
    if (!classAttr) return;
    const attributes = new Map<string, string | true | null>();
    for (const attr of element.openingElement.attributes ?? []) {
      if (attr.type !== 'JSXAttribute' || attr === classAttr) continue;
      attributes.set(attributeName(attr), attributeValue(attr));
    }
    const className = staticClassName(classAttr);
    const facts: ElementFacts = {
      tag: name.name,
      tokens:
        className === null
          ? classTokensOf(classAttr.value)
          : [...new Set(className.split(/\s+/).filter(Boolean))],
      attributes,
      hasSpread: (element.openingElement.attributes ?? []).some(
        (attr: any) => attr.type === 'JSXSpreadAttribute'
      ),
      hasRef: attributes.has('ref'),
      hasChildren: (element.children ?? []).some(isContent),
      onlyChildOf: onlyChildOf(elementPath, bestaxLocals),
    };
    let result = plan(facts);
    const converts = result.conversion !== null;
    if (className === null && result.conversion) {
      // The same element with a static className would convert; with a
      // computed one, only a person can turn each condition into its prop.
      const target = result.conversion.target;
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
    if (result.conversion || result.todos.length > 0) {
      elements.push({ path: elementPath, plan: result, converts });
    }
  });
  if (elements.length === 0) return print();

  // ---- 3. File-level gates ------------------------------------------------------
  // A gate speaks only when an element would convert: its TODO says what to
  // change so a re-run converts them, which is noise when a re-run could not.
  const converting = elements.some(element => element.converts);
  const block = (rule: string, message: string): void => {
    if (converting) addTodo(ctx, elements[0].path, rule, message);
    for (const element of elements) {
      element.plan = { ...element.plan, conversion: null };
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
    const conversion = result.conversion;
    if (!conversion) continue;
    const element = elementPath.node;
    const [head, ...rest] = conversion.target.split('.');
    renameElement(j, element, [ctx.reserve(head), ...rest].join('.'));
    const attrs = element.openingElement.attributes;
    for (const name of conversion.drop) {
      attrs.splice(attrs.indexOf(findAttr(element, name)), 1);
    }
    for (const name of conversion.numbers) {
      const attr = findAttr(element, name);
      attr.value = j.jsxExpressionContainer(
        j.numericLiteral(Number(attributeValue(attr)))
      );
    }
    const classAttr = findAttr(element, 'className');
    const replacement = conversion.props.map(([name, value]) =>
      makeAttr(j, name, value === true ? undefined : value)
    );
    if (conversion.className) {
      replacement.push(makeAttr(j, 'className', conversion.className));
    }
    // A comment on the className goes with whatever takes its place: the
    // first new attribute, else the next one along, else the tag name. After
    // the name it has to be a block comment: recast prints a line comment
    // there as `<// …`, which TypeScript reads as a closing tag.
    if (classAttr.comments?.length) {
      const name = element.openingElement.name;
      const carrier =
        replacement[0] ?? attrs.find((attr: any) => attr !== classAttr) ?? name;
      carrier.comments = [
        ...(carrier.comments ?? []),
        ...classAttr.comments.map((comment: any) => {
          if (carrier !== name) return comment;
          if (comment.type !== 'CommentLine') {
            return { ...comment, leading: false, trailing: true };
          }
          return {
            type: 'CommentBlock',
            value: ` ${comment.value.trim().replace(/\*\//g, '*\\/')} `,
            leading: false,
            trailing: true,
          };
        }),
      ];
    }
    attrs.splice(attrs.indexOf(classAttr), 1, ...replacement);
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
