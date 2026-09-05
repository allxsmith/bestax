/**
 * The bloomer (0.6) → @allxsmith/bestax-bulma transform.
 *
 * Passes, in order:
 *   1. resolve imports (named/namespace) and `const { Item } = Card`-style
 *      destructuring into canonical bloomer component paths
 *   2. per-element: structural special → rename → helper flattening
 *      (isDisplay / isHidden / Column sizes) → component prop map →
 *      universal helper props
 *   3. rewrite imports: drop bloomer, add one merged bestax-bulma import; keep
 *      a trimmed bloomer import (with a TODO) only for components that have
 *      no bestax equivalent (Tile, the Nav family, …)
 *
 * Anything unsafe gets a `// TODO(bestax-migrate)` comment on the enclosing
 * statement plus an entry in the run report.
 *
 * Next to the bloomer transform this is the plain case: bloomer has no helper
 * props that become wrapping components, no stylesheet of its own and no
 * extension packages — so there is no wrapping pass and the CSS pass only
 * ever sees the app's own Bulma import. Every bloomer export is a flat name,
 * and most of them rename onto a dotted bestax compound; the rename and
 * value-reference passes below build those from the mapping's `target`.
 */

import type { API, FileInfo } from 'jscodeshift';
import type { TransformOptions } from '../../types.js';
import {
  HELPERLESS_TARGETS,
  MAPPING,
  UNIVERSAL_PROPS,
  helperClassHint,
  resolveMapping,
} from './mapping.js';
import {
  addTodo,
  attributesOf,
  jsxNameParts,
  literalValueOf,
  removeAttr,
  renameElement,
  type TransformContext,
} from '../_shared/jsx-utils.js';
import { applyPropAction, applyUniversalProps } from '../_shared/props.js';
import {
  collectBoundNames,
  makeReserve,
  nameOf,
  prefersTabs,
  resolvesToBinding,
} from '../_shared/imports.js';
import { flattenResponsiveProps, RESPONSIVE_KINDS } from './responsive.js';
import { runSpecial } from './specials.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

const BLOOMER = 'bloomer';
const BESTAX = '@allxsmith/bestax-bulma';
const BESTAX_CSS = '@allxsmith/bestax-bulma/bestax.css';
const EXTRAS_CSS = '@allxsmith/bestax-bulma/extras.css';

const BULMA_CSS_SPECIFIERS = new Set([
  'bulma/css/bulma.css',
  'bulma/css/bulma.min.css',
]);
const BESTAX_CSS_SPECIFIERS = new Set([
  BESTAX_CSS,
  '@allxsmith/bestax-bulma/bestax.min.css',
  '@allxsmith/bestax-bulma/dist/bestax.css',
  '@allxsmith/bestax-bulma/dist/bestax.min.css',
]);
const EXTRAS_CSS_SPECIFIERS = new Set([
  EXTRAS_CSS,
  '@allxsmith/bestax-bulma/dist/extras.css',
]);

export default function transform(
  fileInfo: FileInfo,
  api: API,
  options: TransformOptions = {}
): string | undefined {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  const ctx: TransformContext = {
    j,
    file: fileInfo.path,
    collector: options.collector,
    retained: new Set<string>(),
    needed: new Map<string, string>(),
    reserve: root => root, // replaced below once local bindings are known
    overrides: new WeakMap<object, string>(),
    dirty: false,
  };

  // ---- 1. Collect bloomer imports -------------------------------------------
  /** local identifier → imported bloomer name ('*' for namespace imports). */
  const imports = new Map<string, string>();

  const sourceImportPaths: any[] = [];
  /** Whether any bloomer import declaration carried a (broken) default binding. */
  let sawDefaultImport = false;
  /**
   * Whether a namespace binding (`import * as bloomer`) is still referenced as a
   * VALUE after the JSX pass. JSX names like `<bloomer.Box>` are rewritten away,
   * but `as={bloomer.Block}` or a bare `String(bloomer)` are not — and pruning the
   * import under them leaves `bloomer is not defined`.
   */
  let namespaceStillReferenced = false;

  root.find(j.ImportDeclaration).forEach(path => {
    const source = String(path.node.source.value);
    if (source === BLOOMER) {
      sourceImportPaths.push(path);
      for (const spec of path.node.specifiers ?? []) {
        if (spec.type === 'ImportSpecifier' && spec.local) {
          imports.set(nameOf(spec.local), nameOf(spec.imported));
        } else if (spec.type === 'ImportNamespaceSpecifier' && spec.local) {
          imports.set(nameOf(spec.local), '*');
        } else if (spec.type === 'ImportDefaultSpecifier') {
          // bloomer has no default export, so this binding is already broken —
          // but it may still be referenced, and dropping it turns a bad
          // import into `X is not defined`. Flag it and keep it.
          sawDefaultImport = true;
          addTodo(
            ctx,
            path,
            'imports',
            'bloomer has no default export; convert to named imports first'
          );
        }
      }
    } else if (source.startsWith(`${BLOOMER}/`)) {
      // Deep imports (`bloomer/lib/elements/Button`) reach the compiled
      // internals; the same component is exported from the package root,
      // which is the only surface the mapping knows.
      addTodo(
        ctx,
        path,
        'imports',
        `\`${source}\` reaches into bloomer's internals; import the component from 'bloomer' first, then re-run the codemod`
      );
    }
  });

  // A barrel re-export reaches the library without an import declaration,
  // so nothing above saw it; it cannot be rewritten (a compound bestax
  // target has no single name to re-export) and must not vanish silently.
  root
    .find(j.ExportNamedDeclaration)
    .filter(p => String(p.node.source?.value ?? '') === BLOOMER)
    .forEach(p => {
      addTodo(
        ctx,
        p,
        'imports',
        `re-exports from '${BLOOMER}' were not migrated; import the components, migrate them, then re-export the bestax ones by hand`
      );
    });
  root
    .find(j.ExportAllDeclaration)
    .filter(p => String(p.node.source?.value ?? '') === BLOOMER)
    .forEach(p => {
      addTodo(
        ctx,
        p,
        'imports',
        `\`export * from '${BLOOMER}'\` was not migrated; re-export the bestax components you need by hand`
      );
    });

  // ---- 1a. Stylesheet imports (mode-driven) -----------------------------
  // `bestax` (default): everything converges on the recommended combined
  // bundle. `bulma`: plain Bulma v1 CSS plus the separate extras file.
  // `keep`: nothing to do — bloomer has no stylesheet of its own.
  const cssMode = options.cssMode ?? 'bestax';
  let sawBestaxCss = root
    .find(j.ImportDeclaration)
    .paths()
    .some(p => BESTAX_CSS_SPECIFIERS.has(String(p.node.source.value)));

  // Whether some import in this file will become bestax.css, regardless of
  // where it sits relative to an existing extras import.
  const willAdoptBestaxCss =
    cssMode === 'bestax' &&
    root
      .find(j.ImportDeclaration)
      .paths()
      .some(p => BULMA_CSS_SPECIFIERS.has(String(p.node.source.value)));

  root.find(j.ImportDeclaration).forEach(path => {
    const source = String(path.node.source.value);
    const isBulmaCss = BULMA_CSS_SPECIFIERS.has(source);
    const isExtrasCss = EXTRAS_CSS_SPECIFIERS.has(source);
    if (!isBulmaCss && !isExtrasCss) return;

    if (cssMode === 'bestax') {
      if (isBulmaCss) {
        if (sawBestaxCss) {
          path.prune(); // bestax.css already imported elsewhere in this file
        } else {
          path.node.source = j.stringLiteral(BESTAX_CSS);
          sawBestaxCss = true;
        }
        ctx.dirty = true;
      } else if (isExtrasCss && (sawBestaxCss || willAdoptBestaxCss)) {
        // bestax.css already contains the extras. `willAdoptBestaxCss` covers
        // the case where the extras import comes FIRST in the file and the
        // bulma import that becomes bestax.css has not been visited yet —
        // previously the extras survived alongside it and double-loaded.
        path.prune();
        ctx.dirty = true;
      }
    } else if (cssMode === 'bulma') {
      if (isBulmaCss && !sawBestaxCss) {
        const hasExtras = root
          .find(j.ImportDeclaration)
          .paths()
          .some(p => EXTRAS_CSS_SPECIFIERS.has(String(p.node.source.value)));
        if (!hasExtras) {
          // Themed Radio/Checkbox need the bestax extras next to plain Bulma.
          path.insertAfter(
            j.importDeclaration([], j.stringLiteral(EXTRAS_CSS))
          );
          ctx.dirty = true;
        }
      }
    }
  });

  if (imports.size === 0 && !ctx.dirty) {
    return undefined;
  }

  // The scope each binding was collected in, so a reference can be checked
  // against the binding it actually resolves to rather than matched by name.
  const programScope: unknown = root.find(j.Program).paths()[0]?.scope;

  // There is no destructuring pass: every bloomer export is a flat component
  // with no sub-components, so `const { Item } = Card` has nothing to bind.

  /** Resolve a JSX name into a canonical bloomer component path, or null. */
  function resolveJsxPath(name: any): string[] | null {
    const parts = jsxNameParts(name);
    if (!parts) return null;
    const [head, ...rest] = parts;
    const imported = imports.get(head);
    if (imported === undefined) return null;
    if (imported === '*') return rest.length > 0 ? rest : null;
    return [imported, ...rest];
  }

  ctx.resolve = resolveJsxPath;

  // ---- 1c. Collect local bindings so new imports never collide -----------
  const bound = collectBoundNames(j, root, BLOOMER);
  // Seed the reserved set with the local names of bloomer imports that CANNOT be
  // migrated, so a bestax import never claims one of them. Without this, an
  // unmappable component aliased to a name bestax also wants
  // (`import { Tile as Button }`) had its retained specifier dropped on the
  // collision — and its `<Button>` JSX then silently resolved to the bestax
  // Button. A component quietly became a different component.
  //
  // Keyed on the mapping status so only genuinely unmappable names force an
  // alias; the common case (`Button` → `Button`) stays un-aliased.
  for (const [local, imported] of imports) {
    if (imported === '*') continue;
    const entry = MAPPING[imported];
    // Unmappable roots, plus ANY aliased import. A root can be retained by an
    // unknown or `todo` child even when the root itself maps (`Icon` is
    // `partial`, but `<Icon.Unknown>` retains it), and when the local name
    // differs from the imported one that retained binding can collide with a
    // bestax local for a completely different component. An unaliased import
    // is safe: its name already means the same component on both sides.
    if (!entry || entry.status === 'todo' || local !== imported) {
      bound.add(local);
    }
  }
  // A root that DOES map can still be retained by a child the table cannot
  // (`Icon` is `partial`, but `<Icon.Unknown>` keeps the source import alive).
  // The status check above misses that case whenever the local name equals the
  // imported one, so the bestax import took the plain local, the retained
  // specifier was dropped on the collision, and `<Icon.Unknown>` silently
  // resolved to the bestax component instead.
  //
  // Scanned rather than reserved wholesale: adding every partial root to
  // `bound` would alias them in every file that uses one, whether or not
  // anything is actually retained.
  root.find(j.JSXElement).forEach(path => {
    const head = jsxNameParts(path.node.openingElement.name)?.[0];
    if (!head || !imports.has(head)) return;
    const parts = resolveJsxPath(path.node.openingElement.name);
    const mapping = parts ? resolveMapping(parts) : undefined;
    if (!mapping || mapping.status === 'todo') bound.add(head);
  });
  // The same root can be retained by a VALUE chain -- `const X = Icon.Unknown`
  // -- which only the value-reference pass discovers, after `reserve` has
  // already handed the plain local to bestax. Scan those chains here too.
  root.find(j.Identifier).forEach(path => {
    if (path.node.type !== 'Identifier') return;
    const head: string = path.node.name;
    const imported = imports.get(head);
    if (imported === undefined || imported === '*') return;
    const parent = path.parent?.node;
    // A target-less special (NavbarItem, Help, PageControl, …) used as a bare
    // value is retained by the value-reference pass, so its local must not be
    // handed to a bestax import first.
    if (
      parent?.type !== 'ImportSpecifier' &&
      parent?.type !== 'MemberExpression'
    ) {
      const bare = MAPPING[imported];
      if (bare && bare.status !== 'todo' && !bare.target) bound.add(head);
      return;
    }
    if (
      parent?.type !== 'MemberExpression' ||
      parent.object !== path.node ||
      parent.computed
    ) {
      return;
    }
    const chain = [imported];
    let outer: any = path.parent;
    while (
      outer?.node?.type === 'MemberExpression' &&
      !outer.node.computed &&
      outer.node.property?.type === 'Identifier'
    ) {
      chain.push(nameOf(outer.node.property));
      const next = outer.parent;
      if (
        next?.node?.type === 'MemberExpression' &&
        next.node.object === outer.node
      ) {
        outer = next;
      } else {
        break;
      }
    }
    const mapping = resolveMapping(chain);
    if (!mapping || mapping.status === 'todo') bound.add(head);
  });

  ctx.reserve = makeReserve(ctx, bound);
  // Names the passes actually asked for. `ctx.needed` is also seeded from an
  // existing bestax import's specifiers below (so JSX reuses their locals),
  // and that seeding alone must not turn a type-only specifier into a value
  // import nobody needed.
  const requested = new Set<string>();
  const baseReserve = ctx.reserve;
  ctx.reserve = root => {
    requested.add(root);
    return baseReserve(root);
  };

  // Merge with an existing bestax import: reuse its locals verbatim.
  // Only a declaration that already uses NAMED specifiers can absorb more of
  // them. `import * as Bestax from '…'` cannot: a namespace specifier may not
  // share a declaration with named ones, and appending to it emits a file
  // that does not parse.
  const existingBestax = root
    .find(j.ImportDeclaration, { source: { value: BESTAX } })
    .paths()
    .find(
      p =>
        // A type-only declaration cannot take a value specifier: merging a
        // component into `import type { … }` erases it at runtime.
        p.node.importKind !== 'type' &&
        (p.node.specifiers ?? []).every(
          (spec: any) => spec.type === 'ImportSpecifier'
        )
    );
  const preExistingImports = new Set<string>();
  if (existingBestax) {
    for (const spec of existingBestax.node.specifiers ?? []) {
      if (spec.type === 'ImportSpecifier' && spec.local) {
        // The local name is reused either way, so the JSX never needs an
        // alias. But an inline `type` specifier (`import { type Box }`) is
        // not a value binding: it is not counted as already imported, so the
        // component is written as a value below — onto this specifier, which
        // keeps its name, rather than as a duplicate.
        ctx.needed.set(nameOf(spec.imported), nameOf(spec.local));
        if ((spec as { importKind?: string | null }).importKind !== 'type') {
          preExistingImports.add(nameOf(spec.imported));
        }
      }
    }
  }

  // ---- 2. Transform JSX elements ----------------------------------------
  root.find(j.JSXElement).forEach(path => {
    const element = path.node;
    const sourcePath = resolveJsxPath(element.openingElement.name);
    if (!sourcePath) return;
    // Resolve by BINDING, not by name. `function F({ Card })` shadows the
    // import with the caller's object, and rewriting its JSX to bestax's
    // `Card.FooterItem` changed which component rendered.
    const jsxHead = jsxNameParts(element.openingElement.name)?.[0];
    if (jsxHead && !resolvesToBinding(path, jsxHead, programScope)) {
      return;
    }

    const mapping = resolveMapping(sourcePath);
    const dotted = sourcePath.join('.');

    if (!mapping) {
      ctx.retained.add(sourcePath[0]);
      addTodo(
        ctx,
        path,
        'unknown-component',
        `\`${dotted}\` is not a known bloomer export; migrate it by hand`
      );
      return;
    }

    if (mapping.status === 'todo') {
      ctx.retained.add(sourcePath[0]);
      addTodo(
        ctx,
        path,
        `component:${dotted}`,
        `\`${dotted}\` — ${mapping.todo ?? 'migrate by hand'}`
      );
      return;
    }

    // Structural special first — it may pick the target or replace the node.
    let target = mapping.target;
    const handled = new Set<string>();
    if (mapping.special) {
      const result = runSpecial(mapping.special, ctx, path, element);
      if (result.replaced) return;
      if (result.target) target = result.target;
      for (const prop of result.handledProps ?? []) handled.add(prop);
    }
    // A parent's structural handler may have picked this element's target.
    const override = ctx.overrides.get(element);
    if (override) target = override;

    if (!target) return;

    // Targets that extend only React's HTML attributes take none of bloomer's
    // universal helpers; each becomes a TODO naming the Bulma class rather
    // than an excess-property type error the report never mentions.
    if (HELPERLESS_TARGETS.has(target)) {
      for (const attr of [...attributesOf(element)]) {
        const name: string = attr.name.name;
        if (handled.has(name)) continue;
        const literal = literalValueOf(attr);
        const cls = helperClassHint(
          name,
          literal.kind === 'expression' ? undefined : literal.value
        );
        if (!cls) continue;
        removeAttr(element, attr);
        handled.add(name);
        // A false boolean was a no-op in bloomer; nothing to re-add.
        if (literal.kind === 'boolean' && !literal.value) continue;
        addTodo(
          ctx,
          path,
          `prop:${name}`,
          `bestax \`${target}\` takes no Bulma helper props (it extends only React's HTML attributes); add className="${cls}" by hand`
        );
      }
    }

    // Rename to the bestax name, aliasing the import root on collision.
    const [targetRoot, ...targetRest] = target.split('.');
    const localTarget = [ctx.reserve(targetRoot), ...targetRest].join('.');
    const currentParts = jsxNameParts(element.openingElement.name);
    if (!currentParts || currentParts.join('.') !== localTarget) {
      renameElement(j, element, localTarget);
      ctx.dirty = true;
    }

    // Helper shapes: `isDisplay` / `isHidden` on every element, plus the
    // Column size and offset objects.
    const kind = mapping.special
      ? (RESPONSIVE_KINDS[mapping.special] ?? 'generic')
      : 'generic';
    flattenResponsiveProps(ctx, path, element, kind);

    // Component-specific prop actions, then the universal helper pass.
    if (mapping.props) {
      for (const attr of [...attributesOf(element)]) {
        const name = attr.name.name;
        const action = mapping.props[name];
        if (!action || handled.has(name)) continue;
        handled.add(name);
        applyPropAction(ctx, path, element, attr, action);
      }
    }
    applyUniversalProps(ctx, path, element, handled, UNIVERSAL_PROPS);
  });

  // ---- 2b. Value references to bloomer components ---------------------------
  // Components can be referenced as plain values too (`as={Block}`, passed to
  // helpers, …). JSX usages were renamed above; map the leftover identifier
  // references so the pruned bloomer import doesn't strand them.
  // A shorthand property's key and value are the SAME node, so the walker
  // reaches it twice. The first visit rewrites it and detaches the original;
  // the second then matched neither key nor value and fell through to the
  // generic "referenced as a value" branch, emitting a spurious TODO and
  // marking the root retained when it was not.
  const handledValueRefs = new WeakSet<object>();

  root.find(j.Identifier).forEach(path => {
    // find(Identifier) also matches JSXIdentifier (a subtype) — JSX names
    // were already handled by the element walker above.
    if (path.node.type !== 'Identifier') return;
    if (handledValueRefs.has(path.node)) return;
    const name = path.node.name;
    const imported = imports.get(name);
    if (imported === undefined) return;
    // Resolve by BINDING, not by name: a local that shadows the import is a
    // different object, and rewriting it repoints the code at bestax's
    // component.
    if (!resolvesToBinding(path, name, programScope)) {
      return;
    }
    const parentNode = path.parent?.node;
    const parentType = parentNode?.type;
    if (
      parentType === 'ImportSpecifier' ||
      parentType === 'ImportDefaultSpecifier' ||
      parentType === 'ImportNamespaceSpecifier' ||
      parentType === 'JSXOpeningElement' ||
      parentType === 'JSXClosingElement' ||
      parentType === 'JSXMemberExpression'
    ) {
      return;
    }
    // A namespace binding in a real value position. `bloomer.Button` is still a
    // mappable component reference, so fall through to the member-expression
    // branch below with an empty prefix (the namespace itself is not part of
    // the bloomer path). Anything else — a bare `bloomer` — just pins the import.
    const isNamespace = imported === '*';
    if (
      isNamespace &&
      !(
        parentType === 'MemberExpression' &&
        parentNode.object === path.node &&
        !parentNode.computed
      )
    ) {
      namespaceStillReferenced = true;
      addTodo(
        ctx,
        path,
        'value-reference',
        `\`${name}\` is the library's namespace import used as a plain value (destructured, or passed around); nothing reached through it was migrated — reference its components as \`${name}.Component\` or import them by name, then re-run`
      );
      return;
    }
    // Members, keys and signatures name a thing; they do not reference the
    // import. An export specifier does, and is handled on its own: a flat
    // target keeps the public name (\`export { SubTitle as Subtitle }\`), a
    // dotted one cannot be re-exported under a member name and is flagged.
    if (parentType === 'ExportSpecifier') {
      if (parentNode.local !== path.node) return;
      const exportedName = nameOf(parentNode.exported ?? parentNode.local);
      const mapping = MAPPING[imported];
      if (
        mapping &&
        mapping.status !== 'todo' &&
        mapping.target &&
        !mapping.target.includes('.')
      ) {
        const local = ctx.reserve(mapping.target);
        // Replace the node: recast reprints a specifier whose identifiers were

        // swapped in place in its original shorthand form, dropping the `as`.

        path.parent.replace(
          j.exportSpecifier.from({
            local: j.identifier(local),

            exported: j.identifier(exportedName),
          })
        );
        ctx.dirty = true;
        return;
      }
      ctx.retained.add(imported);
      addTodo(
        ctx,
        path,
        'value-reference',
        `\`${name}\` is re-exported; ${mapping?.target ? `its bestax counterpart \`${mapping.target}\` is a member of \`${mapping.target.split('.')[0]}\` and cannot be re-exported under this name` : 'it has no bestax counterpart to re-export'} — migrate the consumers by hand`
      );
      return;
    }
    if (
      parentType === 'TSEnumMember' ||
      ((parentType === 'ObjectMethod' ||
        parentType === 'ClassMethod' ||
        parentType === 'ClassProperty' ||
        parentType === 'PropertyDefinition' ||
        parentType === 'MethodDefinition' ||
        parentType === 'TSPropertySignature' ||
        parentType === 'TSMethodSignature') &&
        parentNode.key === path.node &&
        !parentNode.computed)
    ) {
      return;
    }
    // Non-reference positions: member property names and object keys.
    if (
      parentType === 'MemberExpression' &&
      parentNode.property === path.node &&
      !parentNode.computed
    ) {
      return;
    }
    // Member-expression value references (`Card.Header`, `Tag.Group` used as
    // expressions): resolve the full chain; when the bestax target is the same
    // dotted chain the runtime compound still exists — only flag (or rewrite,
    // for flat single-name targets) when it differs.
    if (
      parentType === 'MemberExpression' &&
      parentNode.object === path.node &&
      !parentNode.computed
    ) {
      // Walk the full chain: `Card.Footer.Item` is one path, not
      // `Card.Footer` with a stray `.Item`. Resolving only the first level
      // left the tail pointing at a compound bestax does not have
      // (bestax exposes `Card.FooterItem`).
      const memberPath = isNamespace ? [] : [imported];
      let outer: any = path.parent;
      while (
        outer?.node?.type === 'MemberExpression' &&
        !outer.node.computed &&
        outer.node.property?.type === 'Identifier'
      ) {
        memberPath.push(nameOf(outer.node.property));
        const next = outer.parent;
        if (
          next?.node?.type === 'MemberExpression' &&
          next.node.object === outer.node
        ) {
          outer = next;
        } else {
          break;
        }
      }
      const memberMapping = resolveMapping(memberPath);
      const dotted = memberPath.join('.');
      // Only a namespace chain can resolve: a flat bloomer component has no
      // members of its own, so `Box.anything` is never a component reference.
      if (
        isNamespace &&
        memberMapping &&
        memberMapping.status !== 'todo' &&
        memberMapping.target &&
        !memberMapping.special
      ) {
        // `B.CardHeaderTitle` → `Card.Header.Title`: the namespace prefix has
        // to go and the target may be dotted, so rebuild the whole chain from
        // the target rather than renaming anything in place.
        const [targetRoot, ...targetRest] = memberMapping.target.split('.');
        let rebuilt: any = j.identifier(ctx.reserve(targetRoot));
        for (const part of targetRest) {
          rebuilt = j.memberExpression(rebuilt, j.identifier(part));
        }
        outer.replace(rebuilt);
        ctx.dirty = true;
        return;
      }
      addTodo(
        ctx,
        outer,
        'value-reference',
        `\`${isNamespace ? `${name}.` : ''}${dotted}\` is referenced as a value; migrate this usage by hand`
      );
      if (isNamespace) namespaceStillReferenced = true;
      else ctx.retained.add(imported);
      return;
    }
    if (
      (parentType === 'ObjectProperty' || parentType === 'Property') &&
      parentNode.key === path.node &&
      !parentNode.shorthand
    ) {
      return;
    }
    // A shorthand property is both the key and the reference. Renaming the
    // node in place rewrote the object's PUBLIC key
    // (`{ Textarea }` → `{ TextArea }`), so expand it instead: the key keeps
    // the name callers use, the value points at the migrated binding.
    if (
      (parentType === 'ObjectProperty' || parentType === 'Property') &&
      parentNode.shorthand
    ) {
      const shorthandMapping = MAPPING[imported];
      if (
        shorthandMapping &&
        shorthandMapping.status !== 'todo' &&
        shorthandMapping.target
      ) {
        const [root, ...rest] = shorthandMapping.target.split('.');
        const local = ctx.reserve(root);
        let value: any = j.identifier(local);
        for (const part of rest) {
          value = j.memberExpression(value, j.identifier(part));
        }
        if (rest.length > 0 || local !== name) {
          // ast-types keeps DISTINCT key and value nodes even when
          // `shorthand` is true, so both positions are visited. Mark both, or
          // the second visit sees a node that matches neither the (new) key
          // nor the (new) value and falls through to the generic branch.
          handledValueRefs.add(parentNode.key);
          handledValueRefs.add(parentNode.value);
          parentNode.shorthand = false;
          parentNode.key = j.identifier(name);
          parentNode.value = value;
          ctx.dirty = true;
        }
      } else {
        // Mark both positions before reporting: the key and the value are
        // distinct nodes, so an unmarked branch reports the same property
        // twice. The AST comment dedupes, which hid this in the output while
        // the report still double-counted it.
        handledValueRefs.add(parentNode.key);
        handledValueRefs.add(parentNode.value);
        ctx.retained.add(imported);
        addTodo(
          ctx,
          path,
          'value-reference',
          `\`${name}\` is referenced as a value; migrate this usage by hand`
        );
      }
      return;
    }
    const mapping = MAPPING[imported];
    // A special that has a `target` only adjusts props on the JSX path; it
    // never changes the target, so a value reference points at the same
    // bestax component (`const Old = Icon` → bestax's Icon). Only a
    // target-less special (NavbarItem, Help, …) has nothing to rename to.
    if (mapping && mapping.status !== 'todo' && mapping.target) {
      const [root, ...rest] = mapping.target.split('.');
      const local = ctx.reserve(root);
      if (rest.length > 0) {
        // A dotted target needs a member expression, not a rename. Without
        // this, a destructured alias used as a bare value
        // (`const { Content } = Card; const V = Content`) fell through to the
        // TODO branch and was left referencing a binding the destructuring
        // pass had already deleted.
        let value: any = j.identifier(local);
        for (const part of rest) {
          value = j.memberExpression(value, j.identifier(part));
        }
        path.replace(value);
      } else if (local !== name) {
        path.node.name = local;
      }
      ctx.dirty = true;
    } else {
      ctx.retained.add(imported);
      addTodo(
        ctx,
        path,
        'value-reference',
        `\`${name}\` is referenced as a value; migrate this usage by hand`
      );
    }
  });

  // ---- 3. Rewrite imports -----------------------------------------------
  if (imports.size > 0) {
    const retainedNames = [...ctx.retained].sort((a, b) => a.localeCompare(b));

    const freshNames = [...ctx.needed.entries()]
      .filter(
        ([imported]) =>
          requested.has(imported) && !preExistingImports.has(imported)
      )
      .sort((a, b) => a[0].localeCompare(b[0]));
    const bestaxImport =
      freshNames.length > 0
        ? j.importDeclaration(
            freshNames.map(([imported, local]) =>
              j.importSpecifier(j.identifier(imported), j.identifier(local))
            ),
            j.stringLiteral(BESTAX)
          )
        : null;

    /**

     * A pruned declaration takes its comments with it — a licence header, an

     * eslint directive. Hand them to what replaces it, or to the next statement.

     */

    const carryComments = (node: any, importPath: any): void => {
      const comments = node.comments ?? [];

      if (comments.length === 0) return;

      const body: any[] = importPath.parent?.node?.body ?? [];

      const index = body.indexOf(node);

      const carrier =
        bestaxImport ??
        existingBestax?.node ??
        (index >= 0 ? body[index + 1] : undefined);

      if (!carrier) return;

      carrier.comments = [...comments, ...(carrier.comments ?? [])];

      node.comments = [];
    };

    let inserted = false;
    // A retained bloomer specifier must never collide with a bestax import local
    // (possible when one component is both JSX-migrated and value-retained).
    const bestaxLocals = new Set(ctx.needed.values());
    for (const path of sourceImportPaths) {
      const node = path.node;
      const keepSpecifiers = (node.specifiers ?? []).filter((spec: any) => {
        // `import * as bloomer` reaches every export at once, so it has to
        // survive whenever ANY component is retained — the JSX still says
        // `<bloomer.Tile>`, and pruning the import leaves `bloomer is not defined`.
        if (spec.type === 'ImportNamespaceSpecifier') {
          return ctx.retained.size > 0 || namespaceStillReferenced;
        }
        // Keep a default binding rather than stranding its references.
        if (spec.type === 'ImportDefaultSpecifier') return sawDefaultImport;
        return (
          spec.type === 'ImportSpecifier' &&
          ctx.retained.has(nameOf(spec.imported)) &&
          !bestaxLocals.has(nameOf(spec.local))
        );
      });
      if (!inserted) {
        if (existingBestax && bestaxImport) {
          const current = existingBestax.node.specifiers ?? [];
          const appended: any[] = [];
          for (const fresh of bestaxImport.specifiers!) {
            // A type-only specifier for the same name becomes the value
            // import (a value import carries the type too); appending a
            // second `Box` beside `type Box` would be a duplicate identifier.
            const typeOnly: any = current.find(
              (spec: any) =>
                spec.type === 'ImportSpecifier' &&
                spec.importKind === 'type' &&
                nameOf(spec.imported) === nameOf((fresh as any).imported)
            );
            if (typeOnly) {
              typeOnly.importKind = null;
            } else {
              appended.push(fresh);
            }
          }
          existingBestax.node.specifiers = [...current, ...appended];
        } else if (bestaxImport) {
          path.insertBefore(bestaxImport);
        }
        inserted = true;
      }
      const droppedOnCollision = (node.specifiers ?? []).filter(
        (spec: any) =>
          spec.type === 'ImportSpecifier' &&
          ctx.retained.has(nameOf(spec.imported)) &&
          bestaxLocals.has(nameOf(spec.local))
      );
      for (const spec of droppedOnCollision) {
        addTodo(
          ctx,
          path,
          'imports',
          `\`${nameOf(spec.imported)}\` is retained but its local name \`${nameOf(spec.local)}\` is also a bestax import in this file; rename one of them by hand — its JSX would otherwise resolve to the bestax component`
        );
      }
      if (keepSpecifiers.length > 0) {
        node.specifiers = keepSpecifiers;
        // Only when named/namespace bindings are being retained. An import
        // kept solely for a broken default binding has no names to list, and
        // already carries its own "bloomer has no default export" TODO.
        if (retainedNames.length > 0) {
          node.comments = node.comments ?? [];
          const text = ` TODO(bestax-migrate): ${retainedNames.join(', ')} ${
            retainedNames.length === 1 ? 'has' : 'have'
          } no bestax-bulma equivalent yet — migrate and remove this import`;
          if (!node.comments.some((c: any) => c.value === text)) {
            node.comments.push(j.commentLine(text, true, false));
          }
        }
      } else {
        carryComments(node, path);
        path.prune();
      }
      ctx.dirty = true;
    }
  }

  // Flush the deferred stylesheet notes onto the first node that survived the
  // import rewrite, so the drop is visible in the file and not only the report.
  if (!ctx.dirty) return undefined;
  // Double quotes match the dominant JSX-attribute convention; users run
  // their own formatter afterwards anyway. Tab-indented sources keep tabs so
  // reprinted nodes don't drift from the untouched lines around them.
  return root.toSource({
    quote: 'double',
    useTabs: prefersTabs(fileInfo.source),
  });
}
