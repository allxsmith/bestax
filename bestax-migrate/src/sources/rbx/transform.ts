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
import { MAPPING, UNIVERSAL_PROPS, resolveMapping } from './mapping.js';
import {
  addTodo,
  attributesOf,
  findAttr,
  jsxNameParts,
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

/** rbx badge helper props → bestax `<Badge>` props. */
const BADGE_PROPS: Record<string, string | null> = {
  badge: 'content',
  badgeColor: 'color',
  // bestax's Badge has no outline, pill or size variants.
  badgeOutlined: null,
  badgeRounded: null,
  badgeSize: null,
};

/** rbx tooltip helper props → bestax `<Tooltip>` props. */
const TOOLTIP_PROPS: Record<string, string | null> = {
  tooltip: 'label',
  tooltipActive: 'active',
  tooltipColor: 'color',
  tooltipMultiline: 'multiline',
  tooltipPosition: 'position',
  // A breakpoint→position object; bestax has one position for all viewports.
  tooltipResponsive: null,
};

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
          // rbx has no default export; leave it and flag it.
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
      // Always dead once the components are migrated, in every css mode.
      path.prune();
      addTodo(
        ctx,
        path,
        'css',
        `dropped \`${source}\`: bestax ships Badge, Tooltip, Loading and Divider, so rbx's Bulma extensions are no longer needed`
      );
      ctx.dirty = true;
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
      } else if (isExtrasCss && sawBestaxCss) {
        // bestax.css already contains the extras.
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
          path.insertAfter(j.importDeclaration([], j.stringLiteral(EXTRAS_CSS)));
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

  // ---- 1b. Resolve `const { Item } = Card` destructuring -----------------
  root.find(j.VariableDeclarator).forEach(path => {
    const node = path.node;
    if (node.id?.type !== 'ObjectPattern' || node.init?.type !== 'Identifier')
      return;
    const base = node.init.name;
    const imported = imports.get(base) ?? aliases.get(base)?.join('.');
    if (!imported || imported === '*') return;
    const basePath = imports.has(base)
      ? [imports.get(base) as string]
      : aliases.get(base)!;

    let allResolved = true;
    for (const prop of node.id.properties) {
      if (
        (prop.type === 'ObjectProperty' || prop.type === 'Property') &&
        prop.key?.type === 'Identifier' &&
        prop.value?.type === 'Identifier'
      ) {
        aliases.set(prop.value.name, [...basePath, prop.key.name]);
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
  function resolveJsxPath(name: any): string[] | null {
    const parts = jsxNameParts(name);
    if (!parts) return null;
    const [head, ...rest] = parts;
    if (aliases.has(head)) return [...aliases.get(head)!, ...rest];
    const imported = imports.get(head);
    if (imported === undefined) return null;
    if (imported === '*') return rest.length > 0 ? rest : null;
    return [imported, ...rest];
  }

  ctx.resolve = resolveJsxPath;

  // ---- 1c. Collect local bindings so new imports never collide -----------
  const bound = collectBoundNames(j, root, RBX);
  ctx.reserve = makeReserve(ctx, bound);

  // Merge with an existing bestax import: reuse its locals verbatim.
  const existingBestax = root
    .find(j.ImportDeclaration, { source: { value: BESTAX } })
    .paths()[0];
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
          .join('`, `')}\` set without \`${triggerProp}\`; bestax's \`<${componentName}>\` needs content — dropped`
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
      // `badge={3}` is a number in rbx; bestax renders any ReactNode, so the
      // node carries over untouched under its new name.
      attr.name = j.jsxIdentifier(target);
      wrapperAttrs.push(attr);
    }

    const local = ctx.reserve(componentName);
    const wrapper = j.jsxElement(
      j.jsxOpeningElement(j.jsxIdentifier(local), wrapperAttrs, false),
      j.jsxClosingElement(j.jsxIdentifier(local)),
      [element]
    );
    ctx.dirty = true;
    return wrapper;
  }

  // ---- 2. Transform JSX elements ----------------------------------------
  root.find(j.JSXElement).forEach(path => {
    const element = path.node;
    const rbxPath = resolveJsxPath(element.openingElement.name);
    if (!rbxPath) return;

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
    // Last, so the inner element is already fully migrated. Tooltip goes
    // outside Badge when both are present: the badge is positioned against
    // the element it decorates, and the tooltip covers the pair.
    let wrapped: any = element;
    const badge = buildWrapper(path, element, BADGE_PROPS, 'Badge', 'badge');
    if (badge) wrapped = badge;
    const tooltip = buildWrapper(
      path,
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
  root.find(j.Identifier).forEach(path => {
    // find(Identifier) also matches JSXIdentifier (a subtype) — JSX names
    // were already handled by the element walker above.
    if (path.node.type !== 'Identifier') return;
    const name = path.node.name;
    const imported = imports.get(name);
    if (imported === undefined || imported === '*') return;
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
      const memberPath = [imported, nameOf(parentNode.property)];
      const memberMapping = resolveMapping(memberPath);
      const dotted = memberPath.join('.');
      if (
        memberMapping &&
        memberMapping.status !== 'todo' &&
        memberMapping.target &&
        !memberMapping.special
      ) {
        if (memberMapping.target === dotted) {
          const rootMapping = MAPPING[imported];
          if (rootMapping?.target) {
            const local = ctx.reserve(rootMapping.target);
            if (local !== name) path.node.name = local;
            ctx.dirty = true;
          }
          return;
        }
        if (!memberMapping.target.includes('.')) {
          // Flat target (Column.Group → Columns): swap the member expression.
          const local = ctx.reserve(memberMapping.target);
          path.parent.replace(j.identifier(local));
          ctx.dirty = true;
          return;
        }
      }
      addTodo(
        ctx,
        path.parent,
        'value-reference',
        `\`${dotted}\` is referenced as a value; migrate this usage by hand`
      );
      ctx.retained.add(imported);
      return;
    }
    if (
      (parentType === 'ObjectProperty' || parentType === 'Property') &&
      parentNode.key === path.node &&
      !parentNode.shorthand
    ) {
      return;
    }
    const mapping = MAPPING[imported];
    if (
      mapping &&
      mapping.status !== 'todo' &&
      mapping.target &&
      !mapping.target.includes('.')
    ) {
      const local = ctx.reserve(mapping.target);
      if (local !== name) path.node.name = local;
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
      const keepSpecifiers = (node.specifiers ?? []).filter(
        (spec: any) =>
          spec.type === 'ImportSpecifier' &&
          ctx.retained.has(nameOf(spec.imported)) &&
          !bestaxLocals.has(nameOf(spec.local))
      );
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
      if (keepSpecifiers.length > 0) {
        node.specifiers = keepSpecifiers;
        node.comments = node.comments ?? [];
        const text = ` TODO(bestax-migrate): ${retainedNames.join(', ')} ${
          retainedNames.length === 1 ? 'has' : 'have'
        } no bestax-bulma equivalent yet — migrate and remove this import`;
        if (!node.comments.some((c: any) => c.value === text)) {
          node.comments.push(j.commentLine(text, true, false));
        }
      } else {
        path.prune();
      }
      ctx.dirty = true;
    }
  }

  if (!ctx.dirty) return undefined;
  // Double quotes match the dominant JSX-attribute convention; users run
  // their own formatter afterwards anyway. Tab-indented sources keep tabs so
  // reprinted nodes don't drift from the untouched lines around them.
  return root.toSource({
    quote: 'double',
    useTabs: prefersTabs(fileInfo.source),
  });
}
