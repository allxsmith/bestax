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
        return (variable.defs ?? []).some(
          (d: any) => d.type === 'ImportBinding'
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
        for (const stmt of (node as { body?: unknown[] }).body ?? []) {
          if ((stmt as { type?: string })?.type === 'ImportDeclaration') {
            collectImport(stmt, imports);
          }
        }
      },
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
