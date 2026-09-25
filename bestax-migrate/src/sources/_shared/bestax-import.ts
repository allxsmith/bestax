/**
 * The `@allxsmith/bestax-bulma` import a migrated file ends up with.
 *
 * Every source does the same three things: seed the components an existing
 * bestax import already binds (so the JSX reuses their locals), record which
 * components the passes actually ask for, and then either merge the new ones
 * into that existing import or write a fresh declaration. Where the fresh
 * declaration goes is the caller's call; a library source puts it where the
 * library's own import was.
 */

import { nameOf } from './imports.js';
import type { TransformContext } from './jsx-utils.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

export const BESTAX = '@allxsmith/bestax-bulma';

export interface BestaxImportState {
  /** The existing declaration new specifiers merge into, if any. */
  existing: any | undefined;
  /** Components the existing declaration already binds as values. */
  preExisting: Set<string>;
  /** Components the passes asked for through `ctx.reserve`. */
  requested: Set<string>;
}

/**
 * Call once `ctx.reserve` is final and before any pass reserves a name: it
 * wraps `reserve` to record requests and seeds `ctx.needed` from an existing
 * bestax import.
 */
export function seedBestaxImport(
  ctx: TransformContext,
  root: any
): BestaxImportState {
  const { j } = ctx;
  // Names the passes actually asked for. `ctx.needed` is also seeded from an
  // existing bestax import's specifiers below (so JSX reuses their locals),
  // and that seeding alone must not turn a type-only specifier into a value
  // import nobody needed.
  const requested = new Set<string>();
  const baseReserve = ctx.reserve;
  ctx.reserve = name => {
    requested.add(name);
    return baseReserve(name);
  };

  // Only a declaration made entirely of NAMED specifiers can be merged into.
  // `import * as Bulma from '@allxsmith/bestax-bulma'` matches the source too,
  // and appending named specifiers to it emitted
  // `import * as Bulma, { Box } from …` — not valid JavaScript, so the whole
  // file failed to parse after a migration that reported success.
  const existing = root
    .find(j.ImportDeclaration, { source: { value: BESTAX } })
    .paths()
    .find(
      (path: any) =>
        // A type-only declaration cannot take a value specifier: merging a
        // component into `import type { … }` erases it at runtime.
        path.node.importKind !== 'type' &&
        (path.node.specifiers ?? []).every(
          (spec: any) => spec.type === 'ImportSpecifier'
        )
    );
  const preExisting = new Set<string>();
  if (existing) {
    for (const spec of existing.node.specifiers ?? []) {
      if (spec.type === 'ImportSpecifier' && spec.local) {
        // The local name is reused either way, so the JSX never needs an
        // alias. But an inline `type` specifier (`import { type Box }`) is
        // not a value binding: it is not counted as already imported, so the
        // component is written as a value below — onto this specifier, which
        // keeps its name, rather than as a duplicate.
        ctx.needed.set(nameOf(spec.imported), nameOf(spec.local));
        if ((spec as { importKind?: string | null }).importKind !== 'type') {
          preExisting.add(nameOf(spec.imported));
        }
      }
    }
  }
  return { existing, preExisting, requested };
}

/** The fresh declaration for components not already imported, or null. */
export function buildBestaxImport(
  ctx: TransformContext,
  state: BestaxImportState
): any | null {
  const { j } = ctx;
  const freshNames = [...ctx.needed.entries()]
    .filter(
      ([imported]) =>
        state.requested.has(imported) && !state.preExisting.has(imported)
    )
    .sort((a, b) => a[0].localeCompare(b[0]));
  return freshNames.length > 0
    ? j.importDeclaration(
        freshNames.map(([imported, local]) =>
          j.importSpecifier(j.identifier(imported), j.identifier(local))
        ),
        j.stringLiteral(BESTAX)
      )
    : null;
}

/**
 * Locals that bind a bestax VALUE once the import is written. A type-only
 * specifier the seeding recorded, and nothing promoted, binds no value.
 */
export function bestaxValueLocals(
  ctx: TransformContext,
  state: BestaxImportState
): Set<string> {
  return new Set(
    [...ctx.needed.entries()]
      .filter(
        ([imported]) =>
          state.requested.has(imported) || state.preExisting.has(imported)
      )
      .map(([, local]) => local)
  );
}

/**
 * Merge `fresh` into the existing bestax import, or insert it through
 * `anchor` when there is none. An AST path is an anchor: the fresh import
 * goes before it.
 */
export function placeBestaxImport(
  state: BestaxImportState,
  fresh: any | null,
  anchor: { insertBefore(node: any): unknown }
): void {
  if (!fresh) return;
  if (!state.existing) {
    anchor.insertBefore(fresh);
    return;
  }
  const current = state.existing.node.specifiers ?? [];
  const appended: any[] = [];
  for (const spec of fresh.specifiers) {
    // A type-only specifier for the same name becomes the value
    // import (a value import carries the type too); appending a
    // second `Box` beside `type Box` would be a duplicate identifier.
    const typeOnly: any = current.find(
      (existingSpec: any) =>
        existingSpec.type === 'ImportSpecifier' &&
        existingSpec.importKind === 'type' &&
        nameOf(existingSpec.imported) === nameOf(spec.imported)
    );
    if (typeOnly) {
      typeOnly.importKind = null;
    } else {
      appended.push(spec);
    }
  }
  state.existing.node.specifiers = [...current, ...appended];
}

/**
 * A pruned declaration takes its comments with it — a licence header, an
 * eslint directive. Hand them to `carrier` (the bestax import that survives),
 * or to the next statement, or keep them where they were.
 */
export function carryPrunedComments(
  node: any,
  importPath: any,
  carrier: any | null
): void {
  const comments = node.comments ?? [];
  if (comments.length === 0) return;
  const body: any[] = importPath.parent?.node?.body ?? [];
  const index = body.indexOf(node);
  const target = carrier ?? (index >= 0 ? body[index + 1] : undefined);
  if (target) {
    target.comments = [...comments, ...(target.comments ?? [])];
  } else if (index > 0) {
    // The import was the last statement: the comments stay where they
    // were, after what precedes it.
    const previous = body[index - 1];
    previous.comments = [
      ...(previous.comments ?? []),
      ...comments.map((c: any) => ({ ...c, leading: false, trailing: true })),
    ];
  } else {
    // The import was the only statement: the comments become the file's.
    const program = importPath.parent?.node;
    if (program) program.comments = [...comments, ...(program.comments ?? [])];
  }
  node.comments = [];
}
