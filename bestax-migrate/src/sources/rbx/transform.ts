/**
 * The rbx (v2) → @allxsmith/bestax-bulma transform.
 *
 * Passes, in order:
 *   1. resolve imports (named/namespace) and `const { Item } = Card`-style
 *      destructuring into canonical rbx component paths
 *   2. per-element: structural special → rename → responsive flattening →
 *      component prop map → universal helper props → badge/tooltip wrapping
 *   3. rewrite imports: drop rbx, add one merged bestax-bulma import; keep a
 *      trimmed rbx import (with a TODO) only for components that have no
 *      bestax equivalent (Generic, Tile, List, …)
 *
 * Anything unsafe gets a `// TODO(bestax-migrate)` comment on the enclosing
 * statement plus an entry in the run report.
 *
 * The pass that has no react-bulma-components counterpart is the last one.
 * rbx exposes badges and tooltips as *helper props on any element*, backed by
 * the bulma-badge / bulma-tooltip extensions; bestax has real `Badge` and
 * `Tooltip` components. So `<Button tooltip="hi" />` is a wrapping rewrite,
 * not a rename.
 */

import type { API, FileInfo } from 'jscodeshift';
import type { TransformOptions } from '../../types.js';
import {
  BADGE_PROPS,
  MAPPING,
  TOOLTIP_PROPS,
  UNIVERSAL_PROPS,
  resolveMapping,
} from './mapping.js';
import {
  addTodo,
  attributesOf,
  findAttr,
  jsxNameParts,
  literalValueOf,
  removeAttr,
  renameElement,
  type TransformContext,
} from '../_shared/jsx-utils.js';
import { applyPropAction, applyUniversalProps } from '../_shared/props.js';
import {
  collectBoundNames,
  makeAliasRegistry,
  makeReserve,
  nameOf,
  prefersTabs,
  resolvesToBinding,
} from '../_shared/imports.js';
import { flattenResponsiveProps, RESPONSIVE_KINDS } from './responsive.js';
import { runSpecial } from './specials.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

const RBX = 'rbx';
const BESTAX = '@allxsmith/bestax-bulma';
const BULMA_CSS = 'bulma/css/bulma.min.css';
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

/**
 * The four Bulma extensions rbx pinned. An app that imported their CSS
 * directly no longer needs to: bestax ships Badge/Tooltip/Loading/Divider.
 */
const RBX_EXTENSION_CSS = /^bulma-(badge|divider|pageloader|tooltip)(\/|$)/;

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

  // ---- 1. Collect rbx imports -------------------------------------------
  /** local identifier → imported rbx name ('*' for namespace imports). */
  const imports = new Map<string, string>();
  /** local identifier → canonical rbx path (from destructuring). */
  const aliases = new Map<string, string[]>();

  const rbxImportPaths: any[] = [];
  /** Whether any rbx import declaration carried a (broken) default binding. */
  let sawDefaultImport = false;
  /**
   * Whether a namespace binding (`import * as rbx`) is still referenced as a
   * VALUE after the JSX pass. JSX names like `<rbx.Box>` are rewritten away,
   * but `as={rbx.Block}` or a bare `String(rbx)` are not — and pruning the
   * import under them leaves `rbx is not defined`.
   */
  let namespaceStillReferenced = false;

  root.find(j.ImportDeclaration).forEach(path => {
    const source = String(path.node.source.value);
    if (source === RBX) {
      rbxImportPaths.push(path);
      for (const spec of path.node.specifiers ?? []) {
        if (spec.type === 'ImportSpecifier' && spec.local) {
          imports.set(nameOf(spec.local), nameOf(spec.imported));
        } else if (spec.type === 'ImportNamespaceSpecifier' && spec.local) {
          imports.set(nameOf(spec.local), '*');
        } else if (spec.type === 'ImportDefaultSpecifier') {
          // rbx has no default export, so this binding is already broken —
          // but it may still be referenced, and dropping it turns a bad
          // import into `X is not defined`. Flag it and keep it.
          sawDefaultImport = true;
          addTodo(
            ctx,
            path,
            'imports',
            'rbx has no default export; convert to named imports first'
          );
        }
      }
    } else if (source.startsWith(`${RBX}/`) && source.endsWith('.css')) {
      // rbx/index.css — handled by the CSS pass below.
    } else if (source.startsWith(`${RBX}/`)) {
      // Deep imports reach rbx internals with no bestax counterpart —
      // `rbx/base/theme` (the ThemeContext its customisation guide teaches)
      // is the common one.
      addTodo(
        ctx,
        path,
        'imports',
        `\`${source}\` reaches into rbx's internals; bestax's equivalents are its \`Theme\` and \`ConfigProvider\` helpers (https://bestax.io/docs/api/helpers/theme)`
      );
    }
  });

  // ---- 1a. Stylesheet imports (mode-driven) -----------------------------
  // `bestax` (default): everything converges on the recommended combined
  // bundle. `bulma`: plain Bulma v1 CSS plus the separate extras file.
  // `keep`: only the dead rbx CSS import is retargeted.
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
      .some(p => {
        const v = String(p.node.source.value);
        return (
          (v.startsWith(`${RBX}/`) && v.endsWith('.css')) ||
          BULMA_CSS_SPECIFIERS.has(v)
        );
      });

  root.find(j.ImportDeclaration).forEach(path => {
    const source = String(path.node.source.value);
    const isRbxCss = source.startsWith(`${RBX}/`) && source.endsWith('.css');
    const isBulmaCss = BULMA_CSS_SPECIFIERS.has(source);
    const isExtrasCss = EXTRAS_CSS_SPECIFIERS.has(source);
    // The four extensions rbx pinned; bestax covers all of them.
    const isExtensionCss =
      RBX_EXTENSION_CSS.test(source) && source.endsWith('.css');
    if (!isRbxCss && !isBulmaCss && !isExtrasCss && !isExtensionCss) return;

    if (isExtensionCss) {
      // Kept, with a TODO, rather than dropped. The rbx JSX that needed this
      // stylesheet becomes bestax components that carry their own styles, so
      // for THAT markup it is dead -- but an app can also use the extension's
      // classes directly (`has-tooltip-*`, `is-divider`) outside anything rbx
      // rendered, and bestax's components style none of that. Deleting the
      // import on the strength of a component mapping is the best-guess
      // rewrite this package refuses to make, and it would contradict the
      // manifest pass, which reports the same extensions rather than removing
      // them for exactly this reason.
      addTodo(
        ctx,
        path,
        'css',
        `kept \`${source}\`: bestax ships Badge, Tooltip, Loading and Divider with their own styles, so this is only still needed by markup outside rbx that uses the extension's classes directly — drop the import once nothing does`
      );
      return;
    }

    if (cssMode === 'bestax') {
      if (isRbxCss || isBulmaCss) {
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
        // bulma/rbx import that becomes bestax.css has not been visited yet —
        // previously the extras survived alongside it and double-loaded.
        path.prune();
        ctx.dirty = true;
      }
    } else if (cssMode === 'bulma') {
      if (isRbxCss) {
        path.node.source = j.stringLiteral(BULMA_CSS);
        ctx.dirty = true;
      }
      if ((isRbxCss || isBulmaCss) && !sawBestaxCss) {
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
    } else if (isRbxCss) {
      // keep: minimal fix — rbx's CSS carries Bulma 0.7.5.
      path.node.source = j.stringLiteral(BULMA_CSS);
      addTodo(
        ctx,
        path,
        'css',
        `replaced rbx's CSS import with '${BULMA_CSS}'; install bulma@^1 (see https://bestax.io/docs/guides/getting-started/installation)`
      );
    }
  });

  if (imports.size === 0 && !ctx.dirty) {
    return undefined;
  }

  // The scope each binding was collected in, so a reference can be checked
  // against the binding it actually resolves to rather than matched by name.
  const programScope: unknown = root.find(j.Program).paths()[0]?.scope;
  const { register: registerAlias, aliasAt, anyAlias } = makeAliasRegistry();

  // ---- 1b. Resolve `const { Item } = Card` destructuring -----------------
  root.find(j.VariableDeclarator).forEach(path => {
    const node = path.node;
    if (node.id?.type !== 'ObjectPattern' || node.init?.type !== 'Identifier')
      return;
    const base = node.init.name;
    const baseAlias = aliasAt(base, path);
    const imported = imports.get(base) ?? baseAlias?.join('.');
    if (!imported || imported === '*') return;
    if (!imports.has(base) && !baseAlias) return;
    const basePath = imports.has(base)
      ? [imports.get(base) as string]
      : (baseAlias as string[]);

    let allResolved = true;
    for (const prop of node.id.properties) {
      if (
        (prop.type === 'ObjectProperty' || prop.type === 'Property') &&
        prop.key?.type === 'Identifier' &&
        prop.value?.type === 'Identifier'
      ) {
        const owner = (path.scope as unknown as { path?: { node?: unknown } })
          ?.path?.node;
        const target = [...basePath, prop.key.name];
        registerAlias(owner, prop.value.name, target);
        aliases.set(prop.value.name, target);
        // Pruning the declaration is only safe if every use of the alias will
        // actually be rewritten. For a name the table cannot map, the JSX is
        // left as written -- so dropping `const { Header } = Panel` left
        // `<Header/>` referencing nothing at all.
        // A `special` handler rewrites the element without naming a plain
        // target (`Form.Label` becomes a bare <label>), so it counts as
        // resolved just as a target does. Requiring `target` alone kept every
        // declaration that mentioned one.
        const targetMapping = resolveMapping(target);
        if (
          !targetMapping ||
          targetMapping.status === 'todo' ||
          !(targetMapping.target || targetMapping.special)
        ) {
          allResolved = false;
        }
      } else {
        allResolved = false;
      }
    }
    if (allResolved) {
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
    } else {
      addTodo(
        ctx,
        path,
        'imports',
        `could not resolve every name destructured from \`${base}\`; migrate the leftovers by hand`
      );
    }
  });

  /** Resolve a JSX name into a canonical rbx component path, or null. */
  function resolveJsxPath(name: any, at?: unknown): string[] | null {
    const parts = jsxNameParts(name);
    if (!parts) return null;
    const [head, ...rest] = parts;
    const alias = aliasAt(head, at);
    if (alias) return [...alias, ...rest];
    // An alias exists under this name but not for THIS reference's binding,
    // so the reference is not ours to rewrite.
    if (anyAlias(head) && !imports.has(head)) return null;
    const imported = imports.get(head);
    if (imported === undefined) return null;
    if (imported === '*') return rest.length > 0 ? rest : null;
    return [imported, ...rest];
  }

  ctx.resolve = resolveJsxPath;

  // ---- 1c. Collect local bindings so new imports never collide -----------
  const bound = collectBoundNames(j, root, RBX);
  // Seed the reserved set with the local names of rbx imports that CANNOT be
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
    const parts = resolveJsxPath(path.node.openingElement.name, path);
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
        ctx.needed.set(nameOf(spec.imported), nameOf(spec.local));
        preExistingImports.add(nameOf(spec.imported));
      }
    }
  }

  /**
   * Move one family of rbx helper props onto a wrapping bestax component.
   * Returns the wrapper element, or null when the element carries none of
   * them. Props with no bestax counterpart are dropped with a TODO rather
   * than guessed at.
   */
  function buildWrapper(
    path: any,
    element: any,
    child: any,
    propMap: Record<string, string | null>,
    componentName: string,
    triggerProp: string
  ): any | null {
    const present = attributesOf(element).filter(
      (a: any) => a.name.name in propMap
    );
    if (present.length === 0) return null;

    // The trigger prop is what carries the content; without it the rest are
    // modifiers with nothing to modify.
    if (!findAttr(element, triggerProp)) {
      for (const attr of present) removeAttr(element, attr);
      addTodo(
        ctx,
        path,
        `prop:${triggerProp}`,
        `\`${present
          .map((a: any) => a.name.name)
          .join(
            '`, `'
          )}\` set without \`${triggerProp}\`; bestax's \`<${componentName}>\` needs content — dropped`
      );
      ctx.dirty = true;
      return null;
    }

    const wrapperAttrs: any[] = [];
    for (const attr of present) {
      const name: string = attr.name.name;
      const target = propMap[name];
      removeAttr(element, attr);
      if (target === null) {
        addTodo(
          ctx,
          path,
          `prop:${name}`,
          `bestax's \`<${componentName}>\` has no \`${name}\` equivalent; restyle by hand`
        );
        continue;
      }
      attr.name = j.jsxIdentifier(target);
      // rbx types both `badge` and `tooltip` as `number | string`. bestax's
      // `Badge.content` is a ReactNode and takes either, but `Tooltip.label`
      // is `string` — so a numeric tooltip has to be stringified or it fails
      // to typecheck after migration.
      if (target === 'label') {
        const literal = literalValueOf(attr);
        if (literal.kind === 'number') {
          attr.value = j.stringLiteral(String(literal.value));
        } else if (literal.kind === 'expression') {
          addTodo(
            ctx,
            path,
            `prop:${name}`,
            "`tooltip` is `number | string` in rbx but bestax's `label` takes a string; wrap a dynamic value in String(...) if it can be numeric"
          );
        }
      }
      wrapperAttrs.push(attr);
    }

    // `key` is only meaningful in the parent's child position, and the
    // wrapper is what becomes the array member now. Leaving it on the inner
    // element gives React a keyless child: a console warning, and index-based
    // reconciliation that mis-reuses DOM on reorder.
    const keyAttr = findAttr(child, 'key');
    if (keyAttr) {
      removeAttr(child, keyAttr);
      wrapperAttrs.unshift(keyAttr);
    }

    const local = ctx.reserve(componentName);
    const wrapper = j.jsxElement(
      j.jsxOpeningElement(j.jsxIdentifier(local), wrapperAttrs, false),
      j.jsxClosingElement(j.jsxIdentifier(local)),
      [child]
    );
    ctx.dirty = true;
    return wrapper;
  }

  // ---- 2. Transform JSX elements ----------------------------------------
  root.find(j.JSXElement).forEach(path => {
    const element = path.node;
    const rbxPath = resolveJsxPath(element.openingElement.name, path);
    if (!rbxPath) return;
    // Resolve by BINDING, not by name. `function F({ Card })` shadows the
    // import with the caller's object, and rewriting its JSX to bestax's
    // `Card.FooterItem` changed which component rendered.
    const jsxHead = jsxNameParts(element.openingElement.name)?.[0];
    if (
      jsxHead &&
      !resolvesToBinding(
        path,
        jsxHead,
        anyAlias(jsxHead) ? undefined : programScope
      )
    ) {
      return;
    }

    const mapping = resolveMapping(rbxPath);
    const dotted = rbxPath.join('.');

    if (!mapping) {
      ctx.retained.add(rbxPath[0]);
      addTodo(
        ctx,
        path,
        'unknown-component',
        `\`${dotted}\` is not a known rbx v2 export; migrate it by hand`
      );
      return;
    }

    if (mapping.status === 'todo') {
      ctx.retained.add(rbxPath[0]);
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

    // Rename to the bestax name, aliasing the import root on collision.
    const [targetRoot, ...targetRest] = target.split('.');
    const localTarget = [ctx.reserve(targetRoot), ...targetRest].join('.');
    const currentParts = jsxNameParts(element.openingElement.name);
    if (!currentParts || currentParts.join('.') !== localTarget) {
      renameElement(j, element, localTarget);
      ctx.dirty = true;
    }

    // Breakpoint objects: the universal `responsive` prop, plus the Column
    // and Column.Group per-breakpoint shapes.
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

    // ---- 2a. badge/tooltip helper props → wrapping components ------------
    // Last, so the inner element is already fully migrated. Both families are
    // read off `element` — the props live there whichever wrapper is built
    // first — while each wrapper takes the current outermost node as its
    // child. Tooltip ends up outside Badge when both are present: the badge
    // is positioned against the element it decorates, and the tooltip covers
    // the pair.
    let wrapped: any = element;
    const badge = buildWrapper(
      path,
      element,
      wrapped,
      BADGE_PROPS,
      'Badge',
      'badge'
    );
    if (badge) wrapped = badge;
    const tooltip = buildWrapper(
      path,
      element,
      wrapped,
      TOOLTIP_PROPS,
      'Tooltip',
      'tooltip'
    );
    if (tooltip) wrapped = tooltip;
    if (wrapped !== element) path.replace(wrapped);
  });

  // ---- 2b. Value references to rbx components ---------------------------
  // Components can be referenced as plain values too (`as={Block}`, passed to
  // helpers, …). JSX usages were renamed above; map the leftover identifier
  // references so the pruned rbx import doesn't strand them.
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
    // A name bound by `const { Footer } = Card` is in `aliases`, not
    // `imports` — and the destructuring pass has already deleted the
    // declaration that bound it. Skipping those left `Footer.Item` in the
    // output with its `Card` import pruned: a reference to nothing.
    const aliasPath = aliasAt(name, path);
    const imported = aliasPath ? aliasPath[0] : imports.get(name);
    if (imported === undefined) return;
    // Resolve by BINDING, not by name: a local that shadows the import is a
    // different object, and rewriting it repoints the code at bestax's
    // component.
    if (!resolvesToBinding(path, name, aliasPath ? undefined : programScope)) {
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
    // A namespace binding in a real value position. `rbx.Button` is still a
    // mappable component reference, so fall through to the member-expression
    // branch below with an empty prefix (the namespace itself is not part of
    // the rbx path). Anything else — a bare `rbx` — just pins the import.
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
      const memberPath = isNamespace ? [] : [...(aliasPath ?? [imported])];
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
      if (
        memberMapping &&
        memberMapping.status !== 'todo' &&
        memberMapping.target &&
        !memberMapping.special
      ) {
        if (memberMapping.target === dotted) {
          if (isNamespace) {
            // `rbx.Button` → `Button`: the namespace prefix has to go, so
            // rebuild the chain from the target rather than renaming the
            // namespace identifier in place (there is no MAPPING['*'] root
            // to rename it to).
            const [root, ...rest] = memberMapping.target.split('.');
            let rebuilt: any = j.identifier(ctx.reserve(root));
            for (const part of rest) {
              rebuilt = j.memberExpression(rebuilt, j.identifier(part));
            }
            outer.replace(rebuilt);
            ctx.dirty = true;
            return;
          }
          if (aliasPath) {
            // A destructured alias stands for MORE than one segment of the
            // chain (`const { Header } = Card` makes `Header` mean
            // `Card.Header`), so renaming the identifier drops every segment
            // but the last: `Header.Title` became `Card.Title`. Rebuild the
            // whole chain from the target instead.
            const [aliasRoot, ...aliasRest] = memberMapping.target.split('.');
            let rebuilt: any = j.identifier(ctx.reserve(aliasRoot));
            for (const part of aliasRest) {
              rebuilt = j.memberExpression(rebuilt, j.identifier(part));
            }
            outer.replace(rebuilt);
            ctx.dirty = true;
            return;
          }
          const rootMapping = MAPPING[imported];
          if (rootMapping?.target) {
            const local = ctx.reserve(rootMapping.target);
            if (local !== name) path.node.name = local;
            ctx.dirty = true;
          }
          return;
        }
        if (!memberMapping.target.includes('.')) {
          // Flat target (Column.Group → Columns): swap the whole chain.
          const local = ctx.reserve(memberMapping.target);
          outer.replace(j.identifier(local));
          ctx.dirty = true;
          return;
        }
        // Dotted target that differs from the source chain
        // (Card.Footer.Item → Card.FooterItem): rebuild the chain against the
        // bestax path rather than flagging something the table can answer.
        const [targetRoot, ...targetRest] = memberMapping.target.split('.');
        const rootLocal = ctx.reserve(targetRoot);
        let rebuilt: any = j.identifier(rootLocal);
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
      // Resolve through the alias path when there is one: `const { Footer } =
      // Card` makes `{ Footer }` mean `Card.Footer`, not `Card`. Reading the
      // root's mapping here emitted `{ Footer: Card }` — the wrong component
      // under the right key.
      const shorthandMapping = aliasPath
        ? resolveMapping(aliasPath)
        : MAPPING[imported];
      if (
        shorthandMapping &&
        shorthandMapping.status !== 'todo' &&
        shorthandMapping.target &&
        !shorthandMapping.special
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
    const mapping = aliasPath ? resolveMapping(aliasPath) : MAPPING[imported];
    if (
      mapping &&
      mapping.status !== 'todo' &&
      mapping.target &&
      !mapping.special
    ) {
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
      .filter(([imported]) => !preExistingImports.has(imported))
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

    let inserted = false;
    // A retained rbx specifier must never collide with a bestax import local
    // (possible when one component is both JSX-migrated and value-retained).
    const bestaxLocals = new Set(ctx.needed.values());
    for (const path of rbxImportPaths) {
      const node = path.node;
      const keepSpecifiers = (node.specifiers ?? []).filter((spec: any) => {
        // `import * as rbx` reaches every export at once, so it has to
        // survive whenever ANY component is retained — the JSX still says
        // `<rbx.Tile>`, and pruning the import leaves `rbx is not defined`.
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
          existingBestax.node.specifiers = [
            ...(existingBestax.node.specifiers ?? []),
            ...bestaxImport.specifiers!,
          ];
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
        // already carries its own "rbx has no default export" TODO.
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
