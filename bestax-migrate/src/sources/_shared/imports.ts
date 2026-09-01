/**
 * Import-rewriting mechanics shared by every source transform: collecting the
 * names a file already binds, and handing out non-colliding local names for
 * the bestax imports a transform wants to add.
 *
 * Source-agnostic: nothing here knows which library is being migrated.
 */

import type { ASTPath, Collection, JSCodeshift } from 'jscodeshift';
import type { TransformContext } from './jsx-utils.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

export const nameOf = (node: any): string =>
  typeof node === 'string' ? node : String(node?.name ?? '');

/**
 * Every identifier the file already binds — variables, function and class
 * declarations, parameters (including destructured ones), and imports other
 * than the source library's own (those are pruned by the caller).
 *
 * Importing a bestax component under a name the file already uses would
 * redeclare it, so these names drive the aliasing in `makeReserve`.
 */
export function collectBoundNames(
  j: JSCodeshift,
  root: Collection<any>,
  skipImportSource: string
): Set<string> {
  const bound = new Set<string>();

  const collectPattern = (node: any): void => {
    if (!node) return;
    switch (node.type) {
      case 'Identifier':
        bound.add(node.name);
        break;
      case 'ObjectPattern':
        for (const prop of node.properties ?? []) {
          collectPattern(prop.value ?? prop.argument);
        }
        break;
      case 'ArrayPattern':
        for (const el of node.elements ?? []) collectPattern(el);
        break;
      case 'RestElement':
        collectPattern(node.argument);
        break;
      case 'AssignmentPattern':
        collectPattern(node.left);
        break;
    }
  };

  root.find(j.VariableDeclarator).forEach(path => collectPattern(path.node.id));
  root.find(j.FunctionDeclaration).forEach(path => {
    if (path.node.id) bound.add(nameOf(path.node.id));
    for (const param of path.node.params ?? []) collectPattern(param);
  });
  root
    .find(j.ClassDeclaration)
    .forEach(path => path.node.id && bound.add(nameOf(path.node.id)));
  // TypeScript declaration forms that occupy a name an import would collide
  // with. An `enum Button` next to a generated `import { Button }` is a
  // duplicate-identifier build break, and the alias pass could not see it.
  // Interfaces and type aliases share the declaration space with an imported
  // binding of the same name too, so they reserve as well — an unnecessary
  // alias costs nothing, a missed one does not compile.
  for (const kind of [
    'TSEnumDeclaration',
    'TSModuleDeclaration',
    'TSInterfaceDeclaration',
    'TSTypeAliasDeclaration',
  ]) {
    root.find(j[kind as 'TSEnumDeclaration']).forEach((path: ASTPath<any>) => {
      const id = path.node.id;
      if (id && (id.type === 'Identifier' || id.type === 'StringLiteral')) {
        bound.add(nameOf(id));
      }
    });
  }
  root.find(j.FunctionExpression).forEach(path => {
    for (const param of path.node.params ?? []) collectPattern(param);
  });
  root.find(j.ArrowFunctionExpression).forEach(path => {
    for (const param of path.node.params ?? []) collectPattern(param);
  });
  root.find(j.ImportDeclaration).forEach(path => {
    if (String(path.node.source.value) === skipImportSource) return;
    for (const spec of path.node.specifiers ?? []) {
      if (spec.local) bound.add(nameOf(spec.local));
    }
  });

  return bound;
}

/**
 * Build the `ctx.reserve` implementation: register a bestax import by its
 * exported name and get back the local name to write in JSX — the plain name
 * when it is free, otherwise `Bulma<Name>` (then `Bulma<Name>2`, …).
 */
export function makeReserve(
  ctx: TransformContext,
  bound: Set<string>
): (importedName: string) => string {
  return (importedName: string): string => {
    const existing = ctx.needed.get(importedName);
    if (existing) return existing;
    let local = importedName;
    if (bound.has(local)) {
      local = `Bulma${importedName}`;
      let suffix = 2;
      const locals = new Set(ctx.needed.values());
      while (bound.has(local) || locals.has(local)) {
        local = `Bulma${importedName}${suffix}`;
        suffix += 1;
      }
    }
    ctx.needed.set(importedName, local);
    return local;
  };
}

/**
 * Tab-indented sources keep tabs when reprinted, so recast's output does not
 * drift from the untouched lines around it.
 */
export function prefersTabs(source: string): boolean {
  let tabs = 0;
  let spaces = 0;
  for (const line of source.split('\n')) {
    if (line.startsWith('\t')) tabs += 1;
    else if (line.startsWith(' ')) spaces += 1;
  }
  return tabs > spaces;
}
