/**
 * Resolving a JSX element back to the library export it came from.
 *
 * Every rule here must answer "is this one of ours?" before reporting, and
 * must answer it by following the import rather than by trusting the tag name
 * — a project with its own `<Box>` must not be linted against Bulma's.
 *
 * Four import shapes reach the same canonical name:
 *
 *   import { Box }          → <Box>                  → "Box"
 *   import { Box as MyBox } → <MyBox>                → "Box"
 *   import * as B           → <B.Box>                → "Box"
 *   import { Navbar }       → <Navbar.Brand>         → "Navbar.Brand"
 *                             <B.Navbar.Brand>       → "Navbar.Brand"
 *
 * The canonical name is the JSX path as the library documents it, which is
 * what `DEPRECATED_PROPS` and `TEXT_ALIAS_COLOR_ELEMENTS` are keyed by.
 */
import type { Rule } from 'eslint';

export const PACKAGE = '@allxsmith/bestax-bulma';

/** Marker for a namespace binding, which contributes no name segment. */
const NAMESPACE = Symbol('namespace');

export interface ImportedNames {
  /** local binding → the name it was imported under */
  readonly named: Map<string, string>;
  /** local binding → NAMESPACE */
  readonly namespaces: Set<string>;
}

export const emptyImports = (): ImportedNames => ({
  named: new Map(),
  namespaces: new Set(),
});

/* eslint-disable @typescript-eslint/no-explicit-any --
   ESLint's own Rule types model ESTree, which has no JSX nodes. Reaching for
   a typed JSX AST would mean a runtime dependency on @typescript-eslint/utils
   for what is a handful of well-known shapes, so these walk `any` and check
   `type` explicitly instead. */

/** Record the library's bindings from one import declaration. */
export function collectImport(node: any, into: ImportedNames): void {
  if (node?.source?.value !== PACKAGE) return;
  for (const spec of node.specifiers ?? []) {
    if (spec.type === 'ImportSpecifier') {
      into.named.set(spec.local.name, spec.imported.name);
    } else if (spec.type === 'ImportNamespaceSpecifier') {
      into.namespaces.add(spec.local.name);
    }
    // A default import is not a thing this package has; ignore it.
  }
}

/**
 * Record the library's bindings from a CommonJS `require`.
 *
 * The preset matches `.cjs`, and flat config parses those as `sourceType:
 * 'commonjs'` where `import` is a syntax error — so without this every rule
 * was permanently silent on exactly the JavaScript projects the README sells
 * the plugin to. A CJS `.js` file in a `"type": "commonjs"` package is the
 * same shape.
 *
 *   const { Box } = require('@allxsmith/bestax-bulma');   → named
 *   const { Box: MyBox } = require(…);                    → aliased
 *   const B = require(…);                                 → namespace
 */
/**
 * Does this binding pattern bind `name` anywhere inside it?
 *
 * A shadow does not have to be a plain identifier: `const { require } = shim`
 * and `const [require] = shims` bind the name just as well, and the first
 * version of the shadow guard read only `id.name` and missed both. Both
 * reviewers on #686 found that hole independently.
 */
export function patternBinds(pattern: any, name: string): boolean {
  if (!pattern || typeof pattern !== 'object') return false;
  switch (pattern.type) {
    case 'Identifier':
      return pattern.name === name;
    case 'ObjectPattern':
      return (pattern.properties ?? []).some((prop: any) =>
        prop?.type === 'RestElement'
          ? patternBinds(prop.argument, name)
          : patternBinds(prop?.value, name)
      );
    case 'ArrayPattern':
      return (pattern.elements ?? []).some((el: any) => patternBinds(el, name));
    case 'AssignmentPattern':
      return patternBinds(pattern.left, name);
    case 'RestElement':
      return patternBinds(pattern.argument, name);
    default:
      return false;
  }
}

export function isLibraryRequire(declarator: any): boolean {
  const init = declarator?.init;
  return (
    init?.type === 'CallExpression' &&
    init.callee?.name === 'require' &&
    init.arguments?.length === 1 &&
    init.arguments[0]?.value === PACKAGE
  );
}

export function collectRequire(node: any, into: ImportedNames): void {
  if (!isLibraryRequire(node)) return;
  const id = node.id;
  if (id?.type === 'Identifier') {
    into.namespaces.add(id.name);
    return;
  }
  if (id?.type !== 'ObjectPattern') return;
  for (const prop of id.properties ?? []) {
    // A rest element carries no name to bind.
    if (prop?.type !== 'Property') continue;
    const imported = prop.key?.name;
    const local = prop.value?.type === 'Identifier' ? prop.value.name : null;
    if (typeof imported === 'string' && local) into.named.set(local, imported);
  }
}

/**
 * The canonical library name for a JSX element, or null when the element did
 * not come from the library. Returns null rather than guessing.
 *
 * `bindsToImport` decides whether the root identifier really resolves to the
 * import rather than to a local that shadows it. Both tables here key on
 * identifier TEXT, so without it a file that imports `Box` from the library
 * AND declares its own `const Box` inside a function gets the local's JSX
 * linted against Bulma's rules. Default-true keeps `resolveElement` usable
 * without a scope, which the unit tests rely on.
 */
export function resolveElement(
  nameNode: any,
  imports: ImportedNames,
  bindsToImport: (name: string) => boolean = () => true
): string | null {
  const walk = (node: any): string | null | typeof NAMESPACE => {
    if (node?.type === 'JSXIdentifier') {
      const named = imports.named.get(node.name);
      if (named !== undefined) return bindsToImport(node.name) ? named : null;
      if (imports.namespaces.has(node.name)) {
        return bindsToImport(node.name) ? NAMESPACE : null;
      }
      return null;
    }
    if (node?.type === 'JSXMemberExpression') {
      const base = walk(node.object);
      if (base === null) return null;
      const segment = node.property?.name;
      if (typeof segment !== 'string') return null;
      return base === NAMESPACE ? segment : `${base}.${segment}`;
    }
    // JSXNamespacedName (`<svg:rect>`) is never one of ours.
    return null;
  };
  const resolved = walk(nameNode);
  return typeof resolved === 'string' ? resolved : null;
}

/**
 * A numeric JSX attribute value, or null.
 *
 * Every tuple the library validates against holds strings, and its membership
 * check is a plain `includes`, so `m={2}` never matches `'2'` and emits
 * nothing. That is a knowably wrong value rather than an unreadable one, and
 * `m={2}` is the natural spelling in exactly the JavaScript and JSX projects
 * this package exists for, so it must not be lumped in with the values a rule
 * declines to judge.
 */
export function numericValue(attr: any): number | null {
  const v = attr?.value;
  if (v?.type !== 'JSXExpressionContainer') return null;
  const e = v.expression;
  if (e?.type === 'Literal' && typeof e.value === 'number') return e.value;
  // `m={-1}` parses as a unary minus over a literal, not as a negative
  // literal, and the spacing scale is exactly where someone reaches for a
  // negative (see the negative-gutter pattern in #678).
  if (
    e?.type === 'UnaryExpression' &&
    (e.operator === '-' || e.operator === '+') &&
    e.argument?.type === 'Literal' &&
    typeof e.argument.value === 'number'
  ) {
    return e.operator === '-' ? -e.argument.value : e.argument.value;
  }
  return null;
}

/**
 * Attributes with only the LAST occurrence of each name kept, in source order.
 *
 * Duplicate JSX attributes are legal JavaScript and React resolves them
 * last-wins, so judging every occurrence reports a value the element does not
 * render: `<Box m="bogus" m="4" />` renders `m="4"` and was reported anyway.
 */
export function winningAttributes(opening: any): any[] {
  const attrs = attributesOf(opening);
  const lastIndex = new Map<string, number>();
  attrs.forEach((a, i) => lastIndex.set(a.name.name, i));
  return attrs.filter((a, i) => lastIndex.get(a.name.name) === i);
}

/**
 * Attributes whose VALUE is the one that renders.
 *
 * `winningAttributes` settles duplicate names; this also drops anything a
 * LATER spread could overwrite. JSX is last-wins throughout, spreads included,
 * so "an explicit attribute wins over a spread" — which this package asserted
 * in three places — holds only for a spread that comes FIRST.
 * `<Box textAlign="center" {...rest} />` renders whatever `rest.textAlign`
 * says, so the written value is not necessarily a value that renders at all.
 *
 * Only rules that judge a value need this. A rule reporting that a PROP is
 * deprecated is right either way, because the author wrote the deprecated
 * prop whether or not its value survives.
 */
export function valuesThatRender(opening: any): any[] {
  const all = (opening?.attributes ?? []) as any[];
  const lastSpread = all.reduce(
    (found, a, i) => (a?.type === 'JSXSpreadAttribute' ? i : found),
    -1
  );
  return winningAttributes(opening).filter(a => all.indexOf(a) > lastSpread);
}

/**
 * True only when the attribute's value cannot be read at all.
 *
 * This is the predicate every "say nothing" guard should use, and having three
 * rounds of review find the same defect one rule at a time is what earned it a
 * name. The rules kept conflating two different reasons to stay quiet:
 *
 *   - the value is genuinely unknown (`{mode}`, an interpolated template) —
 *     it could be anything, including the right thing, so silence is correct
 *   - the value is readable but of a type no tuple entry can ever be (`true`,
 *     `{false}`, a number) — the library drops it, so it is knowably wrong
 *
 * Only the first is unreadable. Any guard that returns early on "not a string
 * literal" swallows the second, which is how a bare `display` bought an
 * element silence on its inert flex props.
 */
export function isUnreadableValue(attr: any): boolean {
  const v = attr?.value;
  // A bare attribute is `true`, which is a value, not an absence.
  if (v === null || v === undefined) return false;
  if (v.type === 'Literal') return false;
  if (v.type === 'JSXExpressionContainer') {
    const e = v.expression;
    if (e?.type === 'Literal') return false;
    if (e?.type === 'TemplateLiteral' && e.quasis?.length === 1) return false;
    return true;
  }
  return true;
}

/**
 * True when the attribute's value is `true`, either spelling.
 *
 * `<Box mt />` and `<Box mt={true} />` are the same value, both reach the
 * library as `true`, and neither matches a tuple of strings — the bare one
 * was reported and the explicit one was not. `{false}` is deliberately not
 * included: it reads as switching the prop off, and the library skips a falsy
 * value either way, so reporting it would be noise.
 */
export function isTrueValue(attr: any): boolean {
  const v = attr?.value;
  if (v === null || v === undefined) return true;
  return (
    v.type === 'JSXExpressionContainer' &&
    v.expression?.type === 'Literal' &&
    v.expression.value === true
  );
}

/**
 * The string value of a JSX attribute, or null when it is not a plain string
 * literal. Anything computed is skipped by every rule here: a value the rule
 * cannot see is not a value it can judge.
 */
export function literalValue(attr: any): string | null {
  const v = attr?.value;
  if (!v) return null; // bare `<Box mt>` — boolean shorthand
  if (v.type === 'Literal') return typeof v.value === 'string' ? v.value : null;
  if (v.type === 'JSXExpressionContainer') {
    const e = v.expression;
    if (e?.type === 'Literal' && typeof e.value === 'string') return e.value;
    if (e?.type === 'TemplateLiteral' && e.quasis?.length === 1) {
      return e.quasis[0].value.cooked ?? null;
    }
  }
  return null;
}

/**
 * The attribute that WINS for `name`, or undefined.
 *
 * Duplicate JSX attributes are legal JavaScript (only TypeScript rejects
 * them) and React resolves them last-wins, so a first-match lookup read the
 * losing one: `<Box color="primary" color="danger" />` renders
 * `has-text-danger`, and hoisting the first to `textColor` changed that to
 * `has-text-primary`.
 */
export function namedAttr(attrs: any[], name: string): any {
  for (let i = attrs.length - 1; i >= 0; i--) {
    if (attrs[i]?.name?.name === name) return attrs[i];
  }
  return undefined;
}

/** Plain-named attributes of an opening element, skipping spreads. */
export function attributesOf(opening: any): any[] {
  return (opening?.attributes ?? []).filter(
    (a: any) => a?.type === 'JSXAttribute' && a.name?.type === 'JSXIdentifier'
  );
}

/** Does this element carry a spread, making its full prop set unknowable? */
export function hasSpread(opening: any): boolean {
  return (opening?.attributes ?? []).some(
    (a: any) => a?.type === 'JSXSpreadAttribute'
  );
}

/**
 * True when `name`, seen at `node`, resolves to an import binding rather than
 * to a local declaration that shadows it.
 *
 * An unresolvable name answers true, keeping the name-table behaviour: a miss
 * here costs a report on library code, which is less bad than going quiet.
 */
export function bindsToImportAt(
  context: Rule.RuleContext,
  node: unknown
): (name: string) => boolean {
  type ScopeLike = { variables: any[]; upper: ScopeLike | null };
  return name => {
    let scope: ScopeLike | null;
    try {
      scope = context.sourceCode.getScope(
        node as never
      ) as unknown as ScopeLike;
    } catch {
      return true;
    }
    while (scope) {
      const variable = scope.variables.find((v: any) => v.name === name);
      if (variable) {
        // An import binding, or the `const { Box } = require(…)` form, which
        // is the same binding by another spelling. Anything else is a local
        // that shadows ours.
        return (variable.defs ?? []).some(
          (d: any) =>
            d.type === 'ImportBinding' ||
            (d.type === 'Variable' && isLibraryRequire(d.node))
        );
      }
      scope = scope.upper;
    }
    return true;
  };
}

/**
 * The library name for a JSX opening element, scope-checked. This is what the
 * rules call; `resolveElement` is the name-table half of it.
 */
export function elementOf(
  context: Rule.RuleContext,
  opening: any,
  imports: ImportedNames
): string | null {
  return resolveElement(
    opening?.name,
    imports,
    bindsToImportAt(context, opening)
  );
}

/**
 * Wire an import collector into a rule's visitor, returning the shared binding
 * table. Every rule needs exactly this preamble.
 *
 * The collection happens on `Program`, walking its body, rather than in an
 * `ImportDeclaration` visitor. ESLint traverses in document order, so a
 * visitor-based collector has not seen an import that appears BELOW the JSX
 * using it, and every rule here would go silent on that file. Imports hoist,
 * so that file is legal and compiles.
 */
export function withImports(): {
  imports: ImportedNames;
  visitor: Rule.RuleListener;
} {
  const imports = emptyImports();
  return {
    imports,
    visitor: {
      Program(node: unknown) {
        // A module that declares its own `require` is not calling the
        // CommonJS one, so a call to it says nothing about our package. Read
        // straight off the program body rather than through the scope API:
        // `getScope(Program)` answers with the OUTERMOST scope, and a
        // top-level `const require` lives in a child of it, so walking `upper`
        // never saw the shadow. The collector only reads top-level
        // declarations, so a top-level binding is the only shadow that can
        // reach them.
        const body = ((node as { body?: unknown[] }).body ?? []) as any[];
        const requireShadowed = body.some(stmt => {
          if (stmt?.type === 'FunctionDeclaration') {
            return stmt.id?.name === 'require';
          }
          if (stmt?.type === 'VariableDeclaration') {
            return (stmt.declarations ?? []).some((d: any) =>
              patternBinds(d?.id, 'require')
            );
          }
          if (stmt?.type === 'ImportDeclaration') {
            return (stmt.specifiers ?? []).some(
              (sp: any) => sp?.local?.name === 'require'
            );
          }
          return false;
        });
        for (const stmt of body) {
          const s = stmt as { type?: string; declarations?: unknown[] };
          if (s?.type === 'ImportDeclaration') {
            collectImport(stmt, imports);
          } else if (s?.type === 'VariableDeclaration' && !requireShadowed) {
            for (const d of s.declarations ?? []) collectRequire(d, imports);
          }
        }
      },
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
