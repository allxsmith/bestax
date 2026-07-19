/**
 * The react-bulma-components (v4) → @allxsmith/bestax-bulma transform.
 *
 * Passes, in order:
 *   1. resolve imports (named/namespace) and `const { X } = Form`-style
 *      destructuring into canonical RBC component paths
 *   2. per-element: structural special → rename → responsive flattening →
 *      component prop map → universal modifier props
 *   3. rewrite imports: drop RBC, add one merged bestax-bulma import; keep a
 *      trimmed RBC import (with a TODO) only for components that have no
 *      bestax equivalent (Element, Tile)
 *
 * Anything unsafe gets a `// TODO(bestax-migrate)` comment on the enclosing
 * statement plus an entry in the run report.
 */

import type { API, FileInfo } from 'jscodeshift';
import type { TransformOptions } from '../../types.js';
import { resolveMapping } from './mapping.js';
import {
  addTodo,
  attributesOf,
  jsxNameParts,
  renameElement,
  type TransformContext,
} from './jsx-utils.js';
import { applyPropAction, applyUniversalProps } from './props.js';
import { flattenResponsiveProps } from './responsive.js';
import { RESPONSIVE_KINDS, runSpecial } from './specials.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

const RBC = 'react-bulma-components';
const BESTAX = '@allxsmith/bestax-bulma';
const BULMA_CSS = 'bulma/css/bulma.min.css';

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
    needed: new Set<string>(),
    overrides: new WeakMap<object, string>(),
    dirty: false,
  };

  // ---- 1. Collect RBC imports -------------------------------------------
  /** local identifier → imported RBC name ('*' for namespace imports). */
  const imports = new Map<string, string>();
  /** local identifier → canonical RBC path (from destructuring). */
  const aliases = new Map<string, string[]>();

  const rbcImportPaths: any[] = [];
  const nameOf = (node: any): string =>
    typeof node === 'string' ? node : String(node?.name ?? '');

  root.find(j.ImportDeclaration).forEach(path => {
    const source = String(path.node.source.value);
    if (source === RBC) {
      rbcImportPaths.push(path);
      for (const spec of path.node.specifiers ?? []) {
        if (spec.type === 'ImportSpecifier' && spec.local) {
          imports.set(nameOf(spec.local), nameOf(spec.imported));
        } else if (spec.type === 'ImportNamespaceSpecifier' && spec.local) {
          imports.set(nameOf(spec.local), '*');
        } else if (spec.type === 'ImportDefaultSpecifier') {
          // RBC has no default export; leave it and flag it.
          addTodo(
            ctx,
            path,
            'imports',
            'react-bulma-components has no default export; convert to named imports first'
          );
        }
      }
    } else if (source.startsWith(`${RBC}/`) && source.endsWith('.css')) {
      // v3-era bundled CSS import.
      path.node.source = j.stringLiteral(BULMA_CSS);
      addTodo(
        ctx,
        path,
        'css',
        `replaced the react-bulma-components CSS import with '${BULMA_CSS}'; install bulma@^1 (see https://bestax.io/docs/guides/getting-started/installation)`
      );
    } else if (source.startsWith(`${RBC}/`)) {
      addTodo(
        ctx,
        path,
        'imports',
        'deep react-bulma-components import paths are a v3 pattern; move to v4 named root imports first'
      );
    }
  });

  if (imports.size === 0 && !ctx.dirty) {
    return undefined;
  }

  // ---- 1b. Resolve `const { Input, Field: F } = Form` destructuring -----
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

  /** Resolve a JSX name into a canonical RBC component path, or null. */
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

  // ---- 2. Transform JSX elements ----------------------------------------
  root.find(j.JSXElement).forEach(path => {
    const element = path.node;
    const rbcPath = resolveJsxPath(element.openingElement.name);
    if (!rbcPath) return;

    const mapping = resolveMapping(rbcPath);
    const dotted = rbcPath.join('.');

    if (!mapping) {
      ctx.retained.add(rbcPath[0]);
      addTodo(
        ctx,
        path,
        'unknown-component',
        `\`${dotted}\` is not a known react-bulma-components v4 export; migrate it by hand`
      );
      return;
    }

    if (mapping.status === 'todo') {
      ctx.retained.add(rbcPath[0]);
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

    // Rename to the bestax name and register the import root.
    const currentParts = jsxNameParts(element.openingElement.name);
    if (!currentParts || currentParts.join('.') !== target) {
      renameElement(j, element, target);
      ctx.dirty = true;
    }
    ctx.needed.add(target.split('.')[0]);

    // Responsive breakpoint objects (with Columns/Column extensions).
    const kind = mapping.special
      ? (RESPONSIVE_KINDS[mapping.special] ?? 'generic')
      : 'generic';
    flattenResponsiveProps(ctx, path, element, kind);

    // Component-specific prop actions, then the universal modifier pass.
    if (mapping.props) {
      for (const attr of [...attributesOf(element)]) {
        const name = attr.name.name;
        const action = mapping.props[name];
        if (!action || handled.has(name)) continue;
        handled.add(name);
        applyPropAction(ctx, path, element, attr, action);
      }
    }
    applyUniversalProps(ctx, path, element, handled);
  });

  // ---- 3. Rewrite imports -----------------------------------------------
  if (imports.size > 0) {
    const retainedNames = [...ctx.retained].sort((a, b) => a.localeCompare(b));

    // Merge with an existing bestax import if the file already has one.
    const existingBestax = root
      .find(j.ImportDeclaration, { source: { value: BESTAX } })
      .paths()[0];
    if (existingBestax) {
      for (const spec of existingBestax.node.specifiers ?? []) {
        if (spec.type === 'ImportSpecifier')
          ctx.needed.delete(nameOf(spec.imported));
      }
    }

    const freshNames = [...ctx.needed].sort((a, b) => a.localeCompare(b));
    const bestaxImport =
      freshNames.length > 0
        ? j.importDeclaration(
            freshNames.map(name =>
              j.importSpecifier(j.identifier(name), j.identifier(name))
            ),
            j.stringLiteral(BESTAX)
          )
        : null;

    let inserted = false;
    for (const path of rbcImportPaths) {
      const node = path.node;
      const keepSpecifiers = (node.specifiers ?? []).filter(
        (spec: any) =>
          spec.type === 'ImportSpecifier' &&
          ctx.retained.has(nameOf(spec.imported))
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
  // their own formatter afterwards anyway.
  return root.toSource({ quote: 'double' });
}
