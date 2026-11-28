/**
 * Import-rewriting mechanics shared by every source transform: collecting the
 * names a file already binds, and handing out non-colliding local names for
 * the bestax imports a transform wants to add.
 *
 * Source-agnostic: nothing here knows which library is being migrated.
 */

import type { ASTPath, Collection, JSCodeshift } from 'jscodeshift';
import type {
  ComponentMapping,
  TodoEntry,
  TransformOptions,
} from '../../types.js';
import { addTodo, type TransformContext } from './jsx-utils.js';

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

/**
 * True when the identifier `name` at `path` really resolves to the binding
 * the import/alias passes recorded, rather than a local that shadows it.
 *
 * Both passes key on identifier TEXT, so a nested `function F({ Card })`
 * parameter looked exactly like the source library's `Card`: its JSX was
 * rewritten to bestax's `Card.FooterItem` and the destructured parameter was
 * renamed alongside it, silently repointing the code at a different object.
 *
 * `expected` is the scope the binding was collected in — the program scope for
 * an import (they are always top-level), or the declaring scope of a
 * `const { Item } = Card` alias, which the alias pass records because it walks
 * declarators at any depth.
 */
export function resolvesToBinding(
  path: ASTPath<any>,
  name: string,
  expected: unknown
): boolean {
  if (!expected) return true;
  const declaring = (
    path as unknown as { scope?: { lookup(n: string): unknown } }
  ).scope?.lookup(name);
  // An unresolvable name keeps the old behaviour rather than silently
  // skipping work: a miss here means no rewrite at all, which is worse than
  // the shadowing case it guards against.
  return !declaring || declaring === expected;
}

/**
 * Registry of `const { Item } = Card`-style aliases, keyed by the AST node
 * that owns the declaring scope rather than by bare name. Two functions can
 * each destructure `Header` from a different component; a name-keyed map let
 * the second overwrite the first, and both declarations were then pruned
 * while both `<Header…>` references were left resolving to nothing.
 *
 * Resolution walks the reference's ANCESTORS rather than consulting
 * `scope.lookup`, because by the time references are rewritten the alias
 * pass has already pruned the declaration -- so the binding is gone from the
 * scope table, and `path.scope` objects are not identity-stable across
 * traversals either.
 *
 * Source-agnostic: every transform resolves aliases the same way, and #613
 * shipped this block duplicated in two of them.
 */
export interface AliasRegistry {
  /** Record that `local` in the scope owned by `owner` names `target`. */
  register(owner: unknown, local: string, target: string[]): void;
  /**
   * The canonical path `name` aliases at `at` (a reference's path), or
   * undefined when no alias applies to that reference.
   */
  aliasAt(name: string, at?: unknown): string[] | undefined;
  /** The node owning the scope whose alias `name` at `at` resolves to. */
  ownerAt(name: string, at: unknown): unknown;
  /** Whether ANY scope aliases `name` — regardless of the reference. */
  anyAlias(name: string): boolean;
}

export function makeAliasRegistry(): AliasRegistry {
  const aliasesByOwner = new Map<unknown, Map<string, string[]>>();
  const ownersFor = (name: string): unknown[] => {
    const owners: unknown[] = [];
    for (const [owner, perScope] of aliasesByOwner) {
      if (perScope.has(name)) owners.push(owner);
    }
    return owners;
  };
  const register = (owner: unknown, local: string, target: string[]) => {
    let perScope = aliasesByOwner.get(owner);
    if (!perScope) {
      perScope = new Map<string, string[]>();
      aliasesByOwner.set(owner, perScope);
    }
    perScope.set(local, target);
  };
  const aliasAt = (name: string, at?: unknown): string[] | undefined => {
    const owners = ownersFor(name);
    if (owners.length === 0) return undefined;
    // Without a reference location there is nothing to walk, so the only
    // owner is the best answer available. WITH one, always walk: an unrelated
    // `Header` parameter in another function must not resolve to the alias
    // merely because the alias is the only one by that name. A single-owner
    // shortcut here rewrote such a parameter to `{ Header: Card.Header }`,
    // which is not even valid syntax.
    if (at === undefined) {
      return owners.length === 1
        ? aliasesByOwner.get(owners[0])!.get(name)
        : undefined;
    }
    const owner = ownerAt(name, at);
    return owner === undefined
      ? undefined
      : aliasesByOwner.get(owner)?.get(name);
  };
  const ownerAt = (name: string, at: unknown): unknown => {
    type Anc = { parent?: Anc; node?: unknown };
    let cursor = at as Anc | undefined;
    while (cursor) {
      if (cursor.node !== undefined) {
        const hit = aliasesByOwner.get(cursor.node)?.get(name);
        if (hit) {
          // The walk finds the nearest OWNER, but a binding can intervene
          // between the reference and that owner: `function F(Header)` under
          // a module-level `const { Header } = Card` shadows the alias, and
          // resolving through it rewrote the parameter itself to
          // `F(Card.Header)`. If the scope table still binds the name
          // somewhere other than the owner, that nearer binding wins. (After
          // the alias declaration is pruned the lookup returns nothing for
          // the alias itself, which is the case this must keep allowing.)
          const declaring = (
            at as {
              scope?: {
                lookup(n: string): { path?: { node?: unknown } } | null;
              };
            }
          ).scope?.lookup(name)?.path?.node;
          if (
            declaring !== undefined &&
            declaring !== null &&
            declaring !== cursor.node
          ) {
            return undefined;
          }
          return cursor.node;
        }
      }
      cursor = cursor.parent;
    }
    return undefined;
  };
  const anyAlias = (name: string): boolean => ownersFor(name).length > 0;
  return { register, aliasAt, ownerAt, anyAlias };
}

/**
 * The flat bestax name a re-export of `mapping`'s component is written as
 * (`export { Columns as Group }`), or undefined when it has none to write.
 */
export function flatReExportTarget(
  mapping: ComponentMapping | undefined
): string | undefined {
  return mapping &&
    mapping.status !== 'todo' &&
    mapping.target &&
    !mapping.target.includes('.')
    ? mapping.target
    : undefined;
}

/**
 * What one run of a transform hands the next about its destructurings: the
 * ones to keep, and the pruned ones a use of which stayed as written. Each is
 * keyed by its declarator's offset in the source, with the names so used.
 */
export interface DestructuringRun {
  keepAt: ReadonlyMap<number, ReadonlySet<string>>;
  stranded: Map<number, Set<string>>;
}

/**
 * Run `migrate`, then again with each destructuring it pruned a use of which
 * stayed as written kept, until none is. Which uses the reference passes
 * leave is known only once they have run, after the bestax import's locals
 * are chosen from the names the file still binds, so such a declaration is
 * kept by a fresh run rather than put back. Only the last run reports.
 */
export function migrateKeepingStranded(
  options: TransformOptions,
  migrate: (
    options: TransformOptions,
    run: DestructuringRun
  ) => string | undefined
): string | undefined {
  let keepAt = new Map<number, ReadonlySet<string>>();
  for (;;) {
    const todos: TodoEntry[] = [];
    const run = { keepAt, stranded: new Map<number, Set<string>>() };
    const output = migrate(
      { ...options, collector: { add: entry => todos.push(entry) } },
      run
    );
    const more = [...run.stranded].filter(([at]) => !keepAt.has(at));
    if (more.length === 0) {
      for (const entry of todos) options.collector?.add(entry);
      return output;
    }
    keepAt = new Map([...keepAt, ...more]);
  }
}

/**
 * Whether the identifier at `ref` reads its binding: not a member, key, label
 * or private name, a JSX attribute or closing tag, the public name of an
 * export, or a name a type declares.
 */
function readsBinding(ref: ASTPath<any>): boolean {
  const node = ref.node;
  if (node.type === 'JSXIdentifier') {
    let top: any = node;
    let up: any = ref.parent;
    while (up?.node?.type === 'JSXMemberExpression' && up.node.object === top) {
      top = up.node;
      up = up.parent;
    }
    return up?.node?.type === 'JSXOpeningElement' && up.node.name === top;
  }
  const parent = ref.parent?.node;
  if (!parent) return true;
  switch (parent.type) {
    case 'ImportSpecifier':
    case 'ImportDefaultSpecifier':
    case 'ImportNamespaceSpecifier':
    case 'LabeledStatement':
    case 'BreakStatement':
    case 'ContinueStatement':
    case 'MetaProperty':
    case 'PrivateName':
      return false;
    case 'TSEnumMember':
      return parent.id !== node;
    case 'ExportSpecifier':
      return parent.local === node;
    case 'TSQualifiedName':
      return parent.left === node;
    case 'MemberExpression':
    case 'OptionalMemberExpression':
      return parent.property !== node || parent.computed;
  }
  // `interface Footer`, and a parameter's name in a type signature.
  if (
    parent.type.startsWith('TS') &&
    (parent.id === node ||
      parent.parameters?.includes(node) ||
      parent.params?.includes(node))
  ) {
    return false;
  }
  return parent.key !== node || parent.computed || Boolean(parent.shorthand);
}

/** What the destructuring pass decided about its declarations. */
export interface DestructuringPlan {
  /**
   * The nodes of each kept declaration, which the value-reference pass
   * leaves as written: the pattern's names are bindings, not references, and
   * the initialiser names the library's root, which stays imported for it.
   * Rewriting them as references wrote `{ Header: Card.Header }` into the
   * pattern and pointed the initialiser at bestax's root.
   */
  kept: WeakSet<object>;
  /** Keep the declaration at `path`, destructured from `root`, with a TODO. */
  keep(path: ASTPath<any>, root: string, message: string): void;
  /**
   * Prune the declaration at `path` in `settle`, unless a kept one reads it
   * or the run's `keepAt` names it.
   */
  prune(path: ASTPath<any>, root: string): void;
  /**
   * Keep each declaration a kept one reads (`const { Item, Bogus } = Footer`
   * reads the one that destructures `Footer`), then prune the rest. It runs
   * once every declaration is decided, before the scope tables change.
   */
  settle(): void;
  /**
   * Record that a reference pass converted the use at `node`, a JSX name or
   * an identifier, in place, where it still reads as written (`<Input />` is
   * bestax's `Input` too).
   */
  converts(node: any): void;
  /**
   * After the reference passes, put each pruned declaration a use of whose
   * names they left as written in the run's `stranded`. `ownerAt` is the
   * alias registry's.
   */
  findStranded(ownerAt: (name: string, at: unknown) => unknown): void;
}

/** A `DestructuringPlan` for the transform whose context is `ctx`. */
export function makeDestructuringPlan(
  ctx: TransformContext,
  root: Collection<any>,
  run: DestructuringRun
): DestructuringPlan {
  const kept = new WeakSet<object>();
  const keptPaths: ASTPath<any>[] = [];
  const prunable: { path: ASTPath<any>; root: string }[] = [];
  const pruned: { at: number; owner: unknown; names: Set<string> }[] = [];
  /** Every decided declaration's pattern names, which are no use of it. */
  const bound = new WeakSet<object>();
  /**
   * Once some declaration is pruned, the file's identifiers as written, less
   * those a pass then converts in place. One a pass writes is not among them.
   */
  const written = new WeakSet<object>();
  const decide = (path: ASTPath<any>) => {
    for (const prop of path.node.id.properties) {
      if (prop.key) bound.add(prop.key);
      if (prop.value) bound.add(prop.value);
    }
  };
  const keep = (path: ASTPath<any>, root: string, message: string) => {
    decide(path);
    const declarator = path.node;
    for (const prop of declarator.id.properties) {
      if (prop.value?.type !== 'Identifier') continue;
      kept.add(prop.value);
      if (prop.shorthand) kept.add(prop.key);
    }
    kept.add(declarator.init);
    ctx.retained.add(root);
    keptPaths.push(path);
    addTodo(ctx, path, 'imports', message);
  };
  const prune = (path: ASTPath<any>, root: string) => {
    const uses = run.keepAt.get(path.node.start);
    if (uses === undefined) {
      decide(path);
      prunable.push({ path, root });
    } else {
      keep(
        path,
        root,
        `kept for the uses of ${[...uses].map(name => `\`${name}\``).join(', ')} that stay as written; migrate them first`
      );
    }
  };
  const settle = () => {
    for (let i = 0; i < keptPaths.length; i++) {
      const base: string = keptPaths[i].node.init.name;
      // Every binding of the name in that scope, since its table has no
      // blocks. One kept too many costs a TODO; pruning the one it reads
      // would leave it reading nothing.
      const bindings = new Set(
        (
          (keptPaths[i] as any).scope?.lookup(base)?.getBindings()[base] ?? []
        ).map((binding: any) => binding.node)
      );
      for (let k = prunable.length - 1; k >= 0; k--) {
        const { path, root } = prunable[k];
        if (!path.node.id.properties.some((p: any) => bindings.has(p.value))) {
          continue;
        }
        prunable.splice(k, 1);
        keep(
          path,
          root,
          `kept for a destructuring of \`${base}\` that stays; migrate that one first`
        );
      }
    }
    for (const { path } of prunable) {
      pruned.push({
        at: path.node.start,
        owner: (path as any).scope?.path?.node,
        names: new Set(path.node.id.properties.map((p: any) => p.value.name)),
      });
      const declaration = path.parent;
      if (
        declaration?.node?.type === 'VariableDeclaration' &&
        declaration.node.declarations.length === 1
      ) {
        declaration.prune();
      } else {
        path.prune();
      }
      ctx.dirty = true;
    }
    if (pruned.length > 0) {
      root.find(ctx.j.Identifier).forEach(ref => written.add(ref.node));
    }
  };
  const converts = (node: any) => {
    while (node?.type === 'JSXMemberExpression') node = node.object;
    written.delete(node);
  };
  const findStranded = (ownerAt: (name: string, at: unknown) => unknown) => {
    if (pruned.length === 0) return;
    root.find(ctx.j.Identifier).forEach(ref => {
      const name: string = ref.node.name;
      if (!written.has(ref.node) || bound.has(ref.node)) return;
      if (!pruned.some(p => p.names.has(name)) || !readsBinding(ref)) return;
      const owner = ownerAt(name, ref);
      for (const p of pruned) {
        if (p.owner !== owner || !p.names.has(name)) continue;
        const names = run.stranded.get(p.at) ?? new Set<string>();
        run.stranded.set(p.at, names.add(name));
      }
    });
  };
  return { kept, keep, prune, settle, converts, findStranded };
}
