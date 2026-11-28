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
import { releaseRaise } from './bestax-floor.js';
import {
  addAttr,
  addTodo,
  attrSource,
  attributesOf,
  findAttr,
  jsxNameParts,
  jsxStringValue,
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

/**
 * Merge a Bulma class into the element's `className`: appended to a string
 * literal, written fresh when there is none, and a TODO when the existing
 * value is dynamic (the class cannot be spliced into an expression safely).
 */
export function mergeClass(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  cls: string,
  originalName: string
): void {
  const { j } = ctx;
  const existing = findAttr(element, 'className');
  if (!existing) {
    addAttr(element, makeAttr(j, 'className', cls));
    return;
  }
  const literal = literalValueOf(existing);
  if (literal.kind === 'string') {
    const classes = literal.value.split(/\s+/).filter(Boolean);
    if (!classes.includes(cls)) classes.push(cls);
    existing.value = jsxStringValue(j, classes.join(' '));
    return;
  }
  addTodo(
    ctx,
    path,
    `prop:${originalName}`,
    `\`${originalName}\` becomes the \`${cls}\` class, but \`className\` is dynamic here; add \`${cls}\` to it by hand`
  );
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
  if (action.toClass) {
    const resolved = resolveBooleanish(attr);
    if (resolved === 'expression') {
      addTodo(
        ctx,
        path,
        `prop:${originalName}`,
        `\`${originalName}\` has a dynamic value; bestax has no prop for it — add the \`${action.toClass}\` class conditionally by hand`
      );
      return;
    }
    removeAttr(element, attr);
    ctx.dirty = true;
    if (resolved === 'truthy') {
      mergeClass(ctx, path, element, action.toClass, originalName);
    }
    return;
  }
  if (action.toClassPrefix) {
    const value = literalValueOf(attr);
    if (value.kind !== 'string') {
      addTodo(
        ctx,
        path,
        `prop:${originalName}`,
        `\`${originalName}\` has a dynamic value; bestax has no prop for it — add the \`${action.toClassPrefix}<value>\` class by hand`
      );
      return;
    }
    removeAttr(element, attr);
    ctx.dirty = true;
    mergeClass(
      ctx,
      path,
      element,
      `${action.toClassPrefix}${value.value}`,
      originalName
    );
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

  // A number literal is keyed by its string form (`delta={0}` by `'0'`).
  const todoKey =
    literal.kind === 'string' || literal.kind === 'number'
      ? String(literal.value)
      : undefined;
  if (
    action.valueTodo &&
    todoKey !== undefined &&
    Object.hasOwn(action.valueTodo, todoKey)
  ) {
    const written =
      literal.kind === 'number'
        ? `${originalName}={${todoKey}}`
        : `${originalName}="${todoKey}"`;
    addTodo(
      ctx,
      path,
      `prop:${originalName}`,
      `\`${written}\` — ${action.valueTodo[todoKey]}`
    );
    return;
  }

  if (action.allowed) {
    if (literal.kind === 'string' && action.allowed.includes(literal.value)) {
      return;
    }
    const values = action.allowed.map(v => `'${v}'`).join(', ');
    // Several of these can land on one statement, so say which element.
    const parts = jsxNameParts(element.openingElement?.name);
    const on = parts ? ` on \`<${parts.join('.')}>\`` : '';
    let written: string | undefined;
    if (literal.kind === 'string') {
      written = `${originalName}="${literal.value}"`;
    } else if (literal.kind === 'number') {
      written = `${originalName}={${literal.value}}`;
    } else if (literal.kind === 'boolean') {
      written = literal.value ? originalName : `${originalName}={false}`;
    }
    addTodo(
      ctx,
      path,
      `prop:${originalName}`,
      written === undefined
        ? `\`${originalName}\`${on} has a dynamic value, and bestax-bulma takes only ${values}; make sure it can only be one of those`
        : `\`${written}\`${on} is not a value bestax-bulma takes (${values}); use one of those or drop it`
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
  if (
    action.rename &&
    action.rename !== originalName &&
    findAttr(element, action.rename)
  ) {
    // Two source props can converge on one bestax prop (`isSize` and
    // `isFullHeight` both on `size`); renaming over the one already written
    // produced a duplicate attribute, which is invalid JSX.
    addTodo(
      ctx,
      path,
      `prop:${originalName}`,
      `\`${originalName}\` maps to \`${action.rename}\`, but \`${action.rename}\` is already set on this element; reconcile by hand`
    );
    return;
  }
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
 * bestax targets that extend only React's HTML attributes, with no
 * `BulmaClassesProps`, so a source's universal helpers have no prop to land
 * on there. A source writes each as the Bulma class it stood for instead,
 * from its own `helperClassHint`.
 */
export const HELPERLESS_TARGETS: ReadonlySet<string> = new Set([
  'Pagination.Previous',
  'Pagination.Next',
  'Pagination.Ellipsis',
  'Navbar.Dropdown',
  'Navbar.DropdownMenu',
  'Navbar.Divider',
  'Panel.Heading',
  'Panel.Tabs',
  'Panel.Block',
  'Tabs.Item',
  'Message.Header',
  'Message.Body',
  'Modal.Background',
  'Modal.Content',
  'Modal.Card',
  'Modal.Card.Head',
  'Modal.Card.Title',
  'Modal.Card.Body',
  'Modal.Card.Foot',
  'Modal.Close',
]);

/**
 * Targets whose `className` cannot be used either: `Dropdown.Divider` is a
 * bare `React.FC` that declares no props at all and renders its own `<hr>`
 * regardless. A helper on one of these is named, never converted.
 */
export const NO_CLASSNAME_TARGETS: ReadonlySet<string> = new Set([
  'Dropdown.Divider',
]);

/**
 * On a `HELPERLESS_TARGETS` or `NO_CLASSNAME_TARGETS` element, write each of
 * the source's helpers as the Bulma class it stood for (`classOf`, the
 * source's `helperClassHint`), as bestax renders it on a part that takes the
 * prop, and add it to `handled` so the universal pass leaves it alone. Where
 * no `className` can carry the class, it is named in a TODO instead: a
 * dynamic value, a value helper given none, a dynamic `className`, a spread
 * that could replace the `className`, a target that takes no props at all,
 * and below `since`, the release a CLASSNAME_SINCE target keeps its own class
 * beside a `className` from. A literal that wrote no class, which `classOf`
 * gives null for, goes quietly. On
 * a target that takes no props, the rest is marked handled for
 * `dropPropsTargetIgnores`, apart from what `keepForLater` names.
 * `isBreakpoints` names the source's breakpoint-object props, which
 * stand for several classes, so each of those is named in a TODO.
 */
export function writeHelpersAsClasses(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  target: string,
  handled: Set<string>,
  {
    classOf,
    isBreakpoints,
    since,
    keepForLater = () => false,
  }: {
    classOf: (
      name: string,
      value: string | number | boolean | undefined
    ) => string | null;
    isBreakpoints: (name: string) => boolean;
    since?: string;
    keepForLater?: (name: string) => boolean;
  }
): void {
  const noProps = NO_CLASSNAME_TARGETS.has(target);
  // Why a class can't be written, and what to do about it.
  const refusal = (what: string): string | undefined =>
    noProps
      ? `bestax \`${target}\` takes no props at all, so ${what} cannot be set on it: wrap it, or restyle by hand`
      : since
        ? `${releaseRaise(target, since)}, so ${what} isn't set on it: declare \`@allxsmith/bestax-bulma\` at \`^${since}\` or later and re-run, or restyle by hand`
        : undefined;
  const takesNone = `bestax \`${target}\` takes no Bulma helper props (it extends only React's HTML attributes)`;
  // A spread after the `className`, or anywhere when there is none, can
  // carry a `className` of its own that replaces the class written here.
  const attributes: any[] = element.openingElement.attributes ?? [];
  const classAt = attributes.indexOf(findAttr(element, 'className'));
  const spread = attributes.some(
    (a: any, i: number) => a.type === 'JSXSpreadAttribute' && i > classAt
  );
  for (const attr of [...attributesOf(element)]) {
    const name: string = attr.name.name;
    if (handled.has(name)) continue;
    // Quoted wherever it goes, since what decided the class leaves the file.
    const quoted = (): string => `\`${attrSource(ctx.j, attr) || name}\``;
    if (isBreakpoints(name)) {
      removeAttr(element, attr);
      handled.add(name);
      addTodo(
        ctx,
        path,
        `prop:${name}`,
        refusal(`the classes ${quoted()} stood for`) ??
          `${takesNone}; add the classes ${quoted()} stood for to \`className\` by hand`
      );
      continue;
    }
    // A helper has a class with no value given; `classOf` gives null for a
    // literal that wrote no class (`hidden={false}`).
    const hint = classOf(name, undefined);
    if (hint === null) continue;
    removeAttr(element, attr);
    handled.add(name);
    const literal = literalValueOf(attr);
    const cls =
      literal.kind === 'expression' ? hint : classOf(name, literal.value);
    if (cls === null) continue;
    const refused = refusal(
      literal.kind === 'expression'
        ? `the \`${cls}\` class ${quoted()} stood for`
        : `the \`${cls}\` class this became`
    );
    if (refused) {
      addTodo(ctx, path, `prop:${name}`, refused);
    } else if (literal.kind === 'expression') {
      addTodo(
        ctx,
        path,
        `prop:${name}`,
        `${takesNone}; ${quoted()} stood for the \`${cls}\` class, so add it to \`className\` by hand where that value set it`
      );
    } else if (cls.includes('<')) {
      // A placeholder (`is-pulled-<side>`): the helper took a value and was
      // given none, so there is no class to write.
      addTodo(
        ctx,
        path,
        `prop:${name}`,
        `${takesNone}, and \`${name}\` carries no value here; add the \`${cls}\` class it takes to \`className\` by hand, with the value you meant`
      );
    } else if (spread) {
      addTodo(
        ctx,
        path,
        `prop:${name}`,
        `${takesNone}; add the \`${cls}\` class to the \`className\` its spread may carry, by hand`
      );
    } else {
      mergeClass(ctx, path, element, cls, name);
    }
  }
  // On a target that takes no props, what the later passes would only flag
  // (`as`, a ref, a color) is left to `dropPropsTargetIgnores`, which removes
  // it and names it once, apart from what `keepForLater` names for a pass that
  // can still use it.
  if (noProps) {
    for (const attr of attributesOf(element)) {
      const name: string = attr.name.name;
      if (!keepForLater(name)) handled.add(name);
    }
  }
}

/**
 * On a `NO_CLASSNAME_TARGETS` element, once every other pass has taken what
 * it can, remove what is left and name it in one TODO under `rule`, since
 * the target would fail the typecheck on it and drop it at runtime. `key`
 * stays: it belongs to the list around the element. A spread can't be taken
 * apart, so it stays, with a TODO saying the target drops what it carries
 * (bloomer keeps its own element beside a spread, so it never reaches that).
 */
export function dropPropsTargetIgnores(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  target: string,
  rule: string
): void {
  const nameOf = (attr: any): string =>
    attr.name.type === 'JSXNamespacedName'
      ? `${attr.name.namespace.name}:${attr.name.name.name}`
      : attr.name.name;
  const left = attributesOf(element).filter((a: any) => nameOf(a) !== 'key');
  const why = `bestax \`${target}\` declares no props and renders its own element`;
  if (left.length > 0) {
    for (const attr of left) removeAttr(element, attr);
    ctx.dirty = true;
    const [them, were] = left.length === 1 ? ['it', 'was'] : ['them', 'were'];
    addTodo(
      ctx,
      path,
      rule,
      `${why}, so ${left.map(a => `\`${nameOf(a)}\``).join(', ')} ${were} removed; put ${them} on a wrapping element if you need ${them}`
    );
  }
  if (
    (element.openingElement.attributes ?? []).some(
      (a: any) => a.type === 'JSXSpreadAttribute'
    )
  ) {
    addTodo(
      ctx,
      path,
      rule,
      `${why}, so it drops whatever this spread carries; put that on a wrapping element if you need it`
    );
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
