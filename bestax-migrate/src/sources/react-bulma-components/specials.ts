/**
 * Structural handlers for conversions a rename table can't express: targets
 * chosen by prop values (Level.Side align), child rewrites (Icon <i> parsing,
 * Tabs list wrapping), element replacement (Form.Help → plain <p>), and
 * container unwrapping (Table.Container).
 *
 * A handler may return a `target` override for the rename step, or mark the
 * element `replaced` when it substituted the node itself.
 */

import type { ASTPath } from 'jscodeshift';
import { RESPONSIVE_BREAKPOINTS, UNIVERSAL_PROPS } from './mapping.js';
import {
  addAttr,
  addTodo,
  attributesOf,
  buildJsxName,
  findAttr,
  literalValueOf,
  makeAttr,
  plainElement,
  removeAttr,
  type TransformContext,
} from './jsx-utils.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface SpecialResult {
  /** Override the mapping's `target` for the rename step. */
  target?: string;
  /** The node was replaced outright — skip rename and prop passes. */
  replaced?: boolean;
  /** Prop names the handler consumed; skipped by the later prop passes. */
  handledProps?: string[];
}

type SpecialHandler = (
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any
) => SpecialResult;

/** Pick a target based on a literal align-style prop, removing the prop. */
function alignTarget(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  prop: string,
  targets: Record<string, string>,
  fallback: string
): SpecialResult {
  const attr = findAttr(element, prop);
  if (!attr) return { target: fallback };
  const literal = literalValueOf(attr);
  if (literal.kind === 'string' && targets[literal.value]) {
    removeAttr(element, attr);
    ctx.dirty = true;
    return { target: targets[literal.value] };
  }
  if (literal.kind === 'string') {
    removeAttr(element, attr);
    ctx.dirty = true;
    return { target: fallback };
  }
  addTodo(
    ctx,
    path,
    `prop:${prop}`,
    `\`${prop}\` has a dynamic value; pick between ${Object.values(targets).join(' / ')} by hand`
  );
  removeAttr(element, attr);
  ctx.dirty = true;
  return { target: fallback };
}

/**
 * Filter Bulma modifier props out of an attribute list bound for a plain HTML
 * element (they only exist on bestax components), leaving a TODO when any
 * were dropped.
 */
function stripModifierProps(
  ctx: TransformContext,
  path: ASTPath<any>,
  attrs: any[],
  where: string
): any[] {
  const kept: any[] = [];
  const dropped: string[] = [];
  for (const attr of attrs) {
    const name = attr?.name?.name;
    if (name && (UNIVERSAL_PROPS[name] || name in RESPONSIVE_BREAKPOINTS)) {
      dropped.push(name);
    } else {
      kept.push(attr);
    }
  }
  if (dropped.length > 0) {
    addTodo(
      ctx,
      path,
      'plain-element',
      `${where} became a plain element; the Bulma helper prop(s) ${dropped
        .map(d => `\`${d}\``)
        .join(', ')} were dropped — restyle with classes`
    );
  }
  return kept;
}

/** Parse an icon-font <i className="..."> into bestax Icon name/library/variant. */
function parseIconClasses(
  className: string
): { name: string; library?: string; variant?: string } | null {
  const tokens = className.trim().split(/\s+/);
  const faVariant: Record<string, string> = {
    fas: 'solid',
    far: 'regular',
    fab: 'brands',
    fal: 'light',
    fad: 'duotone',
  };
  const faStyle = tokens.find(t => faVariant[t]);
  const faName = tokens.find(
    t => /^fa-/.test(t) && !/^fa-(lg|xs|sm|\dx|fw|spin|pulse)$/.test(t)
  );
  if (faStyle && faName) {
    return {
      name: faName.replace(/^fa-/, ''),
      library: 'fa',
      variant: faVariant[faStyle],
    };
  }
  if (tokens.includes('mdi')) {
    const mdiName = tokens.find(t => /^mdi-/.test(t) && t !== 'mdi');
    if (mdiName) return { name: mdiName.replace(/^mdi-/, ''), library: 'mdi' };
  }
  return null;
}

const SPECIALS: Record<string, SpecialHandler> = {
  /**
   * RBC defaults Columns `multiline` to TRUE (Bulma and bestax default to
   * false). Absent → inject isMultiline; dynamic → `expr ?? true` so an
   * undefined value keeps falling back to the RBC default.
   */
  columns(ctx, _path, element) {
    const attr = findAttr(element, 'multiline');
    if (!attr) {
      if (!findAttr(element, 'isMultiline')) {
        addAttr(element, makeAttr(ctx.j, 'isMultiline'));
        ctx.dirty = true;
      }
      return { handledProps: ['multiline'] };
    }
    const literal = literalValueOf(attr);
    if (literal.kind === 'boolean') {
      if (literal.value) {
        attr.name = ctx.j.jsxIdentifier('isMultiline');
        attr.value = null;
      } else {
        removeAttr(element, attr);
      }
    } else if (literal.kind === 'expression') {
      attr.name = ctx.j.jsxIdentifier('isMultiline');
      attr.value = ctx.j.jsxExpressionContainer(
        ctx.j.logicalExpression(
          '??',
          attr.value.expression,
          ctx.j.booleanLiteral(true)
        )
      );
    }
    ctx.dirty = true;
    return { handledProps: ['multiline'] };
  },

  /** `<Button remove />` is Bulma's delete cross → bestax `<Delete />`. */
  button(ctx, _path, element) {
    const attr = findAttr(element, 'remove');
    if (!attr) return {};
    removeAttr(element, attr);
    ctx.dirty = true;
    return { target: 'Delete' };
  },

  /** Heading → Title / SubTitle / plain `.heading` paragraph. */
  heading(ctx, path, element) {
    const headingAttr = findAttr(element, 'heading');
    if (headingAttr) {
      removeAttr(element, headingAttr);
      const rest = stripModifierProps(
        ctx,
        path,
        attributesOf(element).filter(
          a =>
            !['size', 'weight', 'spaced', 'subtitle', 'className'].includes(
              a.name.name
            )
        ),
        'Heading'
      );
      const replacement = plainElement(
        ctx.j,
        'p',
        'heading',
        rest,
        element.children ?? []
      );
      path.replace(replacement);
      ctx.dirty = true;
      return { replaced: true };
    }
    const subtitleAttr = findAttr(element, 'subtitle');
    if (subtitleAttr) {
      removeAttr(element, subtitleAttr);
      ctx.dirty = true;
      return { target: 'SubTitle' };
    }
    return { target: 'Title' };
  },

  'level-side'(ctx, path, element) {
    return alignTarget(
      ctx,
      path,
      element,
      'align',
      { left: 'Level.Left', right: 'Level.Right' },
      'Level.Left'
    );
  },

  'media-item'(ctx, path, element) {
    return alignTarget(
      ctx,
      path,
      element,
      'align',
      { left: 'MediaLeft', right: 'MediaRight', center: 'MediaContent' },
      'MediaContent'
    );
  },

  /** RBC Image numeric sizes ({128}) become bestax "128x128" strings. */
  image(ctx, _path, element) {
    const attr = findAttr(element, 'size');
    if (!attr) return {};
    const literal = literalValueOf(attr);
    if (literal.kind === 'number') {
      attr.value = ctx.j.stringLiteral(`${literal.value}x${literal.value}`);
      ctx.dirty = true;
    }
    return {};
  },

  /**
   * RBC Card.Image takes Image props directly; bestax Card.Image is a plain
   * wrapper — move the props onto a new inner <Image>.
   */
  'card-image'(ctx, _path, element) {
    const children = (element.children ?? []).filter(
      (c: any) => !(c.type === 'JSXText' && c.value.trim() === '')
    );
    const attrs = element.openingElement.attributes ?? [];
    const imageAttrs = attrs.filter(
      (a: any) => a.type === 'JSXAttribute' && a.name.name !== 'className'
    );
    if (children.length > 0 || imageAttrs.length === 0) {
      // Already wrapping its own content — nothing to restructure.
      return {};
    }
    for (const attr of imageAttrs) {
      if (attr.name.name === 'size') {
        const literal = literalValueOf(attr);
        if (literal.kind === 'number') {
          attr.value = ctx.j.stringLiteral(`${literal.value}x${literal.value}`);
        }
      } else if (attr.name.name === 'rounded' && attr.value == null) {
        attr.name = ctx.j.jsxIdentifier('isRounded');
      }
    }
    const inner = ctx.j.jsxElement(
      ctx.j.jsxOpeningElement(
        ctx.j.jsxIdentifier(ctx.reserve('Image')),
        imageAttrs,
        true
      ),
      null,
      []
    );
    element.openingElement.attributes = attrs.filter(
      (a: any) => a.type === 'JSXAttribute' && a.name.name === 'className'
    );
    element.children = [inner];
    element.openingElement.selfClosing = false;
    // The walker's rename pass rewrites both names to the final (possibly
    // aliased) Card.Image afterwards.
    element.closingElement = ctx.j.jsxClosingElement(
      buildJsxName(ctx.j, 'Card.Image')
    );
    ctx.dirty = true;
    return {};
  },

  /**
   * A Navbar.Item that wraps an RBC Navbar.Dropdown is the Bulma
   * `navbar-item has-dropdown` container — bestax models that as
   * Navbar.Dropdown (container) + Navbar.DropdownMenu (menu). The wrapped
   * menu gets a target override consumed when its own path is visited.
   */
  'navbar-item'(ctx, path, element) {
    const dropdownChild = (element.children ?? []).find(
      (c: any) =>
        c.type === 'JSXElement' &&
        ctx.resolve?.(c.openingElement.name)?.join('.') === 'Navbar.Dropdown'
    );
    if (!dropdownChild) return {};
    ctx.overrides.set(dropdownChild, 'Navbar.DropdownMenu');
    const renderAsAttr = findAttr(element, 'renderAs');
    if (renderAsAttr) {
      // The container renders a div regardless; a literal renderAs is noise.
      if (literalValueOf(renderAsAttr).kind === 'string') {
        removeAttr(element, renderAsAttr);
      } else {
        addTodo(
          ctx,
          path,
          'prop:renderAs',
          'dynamic renderAs on a dropdown Navbar.Item; bestax Navbar.Dropdown always renders a div'
        );
        removeAttr(element, renderAsAttr);
      }
    }
    ctx.dirty = true;
    // hoverable/active are native on the bestax container — keep them as-is.
    return {
      target: 'Navbar.Dropdown',
      handledProps: ['hoverable', 'active', 'renderAs'],
    };
  },

  'navbar-container'(ctx, path, element) {
    return alignTarget(
      ctx,
      path,
      element,
      'align',
      { left: 'Navbar.Start', right: 'Navbar.End' },
      'Navbar.Start'
    );
  },

  /** Field kind/align/multiline → grouped / hasAddons values. */
  field(ctx, path, element) {
    const kindAttr = findAttr(element, 'kind');
    const alignAttr = findAttr(element, 'align');
    const multilineAttr = findAttr(element, 'multiline');
    if (!kindAttr && !alignAttr && !multilineAttr) return {};

    const kind = kindAttr ? literalValueOf(kindAttr) : null;
    const align = alignAttr ? literalValueOf(alignAttr) : null;
    if (
      (kind && kind.kind !== 'string') ||
      (align && align.kind !== 'string')
    ) {
      addTodo(
        ctx,
        path,
        'prop:kind',
        'dynamic Field kind/align; map to the bestax `grouped` / `hasAddons` props by hand'
      );
      return {};
    }

    for (const attr of [kindAttr, alignAttr, multilineAttr]) {
      if (attr) removeAttr(element, attr);
    }
    ctx.dirty = true;

    const alignValue =
      align && align.kind === 'string'
        ? { center: 'centered', right: 'right' }[align.value]
        : undefined;

    if (kind && kind.kind === 'string' && kind.value === 'addons') {
      addAttr(element, makeAttr(ctx.j, 'hasAddons', alignValue));
      if (multilineAttr) {
        addTodo(
          ctx,
          path,
          'prop:multiline',
          "`multiline` only combines with kind='group' in Bulma; dropped from this addons Field"
        );
      }
      return {};
    }
    // kind='group' (or a stray multiline/align without kind)
    if (multilineAttr) {
      addAttr(element, makeAttr(ctx.j, 'grouped', 'multiline'));
      if (alignValue) {
        addTodo(
          ctx,
          path,
          'prop:align',
          'bestax `grouped` takes one value; choose between multiline and ' +
            alignValue
        );
      }
    } else {
      addAttr(element, makeAttr(ctx.j, 'grouped', alignValue));
    }
    return {};
  },

  /** Form.Label → plain <label className="label">. */
  'plain-label'(ctx, path, element) {
    const sizeAttr = findAttr(element, 'size');
    let className = 'label';
    if (sizeAttr) {
      const literal = literalValueOf(sizeAttr);
      if (literal.kind === 'string') {
        className = `label is-${literal.value}`;
        removeAttr(element, sizeAttr);
      } else {
        addTodo(
          ctx,
          path,
          'prop:size',
          'dynamic Form.Label size; add an is-* class by hand'
        );
        removeAttr(element, sizeAttr);
      }
    }
    const rest = stripModifierProps(
      ctx,
      path,
      attributesOf(element).filter(a => a.name.name !== 'className'),
      'Form.Label'
    );
    path.replace(
      plainElement(ctx.j, 'label', className, rest, element.children ?? [])
    );
    ctx.dirty = true;
    return { replaced: true };
  },

  /** Form.Help → plain <p className="help is-{color}">. */
  'plain-help'(ctx, path, element) {
    const colorAttr = findAttr(element, 'color');
    let className = 'help';
    if (colorAttr) {
      const literal = literalValueOf(colorAttr);
      if (literal.kind === 'string') {
        className = `help is-${literal.value}`;
        removeAttr(element, colorAttr);
      } else {
        addTodo(
          ctx,
          path,
          'prop:color',
          'dynamic Form.Help color; consider the bestax Field `message`/`messageColor` props instead'
        );
        removeAttr(element, colorAttr);
      }
    }
    const rest = stripModifierProps(
      ctx,
      path,
      attributesOf(element).filter(a => a.name.name !== 'className'),
      'Form.Help'
    );
    path.replace(
      plainElement(ctx.j, 'p', className, rest, element.children ?? [])
    );
    ctx.dirty = true;
    return { replaced: true };
  },

  /** Form.InputFile filename → fileName + hasName. */
  'input-file'(ctx, _path, element) {
    const attr = findAttr(element, 'filename');
    if (attr) {
      attr.name = ctx.j.jsxIdentifier('fileName');
      addAttr(element, makeAttr(ctx.j, 'hasName'));
      ctx.dirty = true;
    }
    return {};
  },

  /** Icon children: <Icon><i className="fas fa-home"/></Icon> → name/library. */
  icon(ctx, path, element) {
    const children = (element.children ?? []).filter(
      (c: any) => !(c.type === 'JSXText' && c.value.trim() === '')
    );
    if (children.length === 0) return {};
    const child = children[0];
    const parsed =
      children.length === 1 &&
      child.type === 'JSXElement' &&
      child.openingElement.name.type === 'JSXIdentifier' &&
      child.openingElement.name.name === 'i'
        ? (() => {
            const cls = (child.openingElement.attributes ?? []).find(
              (a: any) =>
                a.type === 'JSXAttribute' && a.name.name === 'className'
            );
            const value =
              cls && cls.value && cls.value.type === 'StringLiteral'
                ? cls.value.value
                : null;
            return value ? parseIconClasses(value) : null;
          })()
        : null;
    if (!parsed) {
      addTodo(
        ctx,
        path,
        'icon-children',
        'bestax Icon renders from a `name` prop, not children; convert this icon markup by hand'
      );
      return {};
    }
    if (!findAttr(element, 'name') && !findAttr(element, 'icon')) {
      addAttr(element, makeAttr(ctx.j, 'name', parsed.name));
      if (parsed.library)
        addAttr(element, makeAttr(ctx.j, 'library', parsed.library));
      if (parsed.variant)
        addAttr(element, makeAttr(ctx.j, 'variant', parsed.variant));
    }
    element.children = [];
    if (element.closingElement) {
      element.openingElement.selfClosing = true;
      element.closingElement = null;
    }
    ctx.dirty = true;
    return {};
  },

  /** RBC Loader is a plain <div class="loader"> — keep exactly that. */
  'plain-loader'(ctx, path, element) {
    const clsAttr = findAttr(element, 'className');
    let className = 'loader';
    if (clsAttr) {
      const literal = literalValueOf(clsAttr);
      if (literal.kind === 'string') {
        className = `loader ${literal.value}`;
      } else {
        addTodo(
          ctx,
          path,
          'prop:className',
          'dynamic Loader className; merge it with the `loader` class by hand'
        );
      }
      removeAttr(element, clsAttr);
    }
    const rest = stripModifierProps(ctx, path, attributesOf(element), 'Loader');
    path.replace(
      plainElement(ctx.j, 'div', className, rest, element.children ?? [])
    );
    ctx.dirty = true;
    return { replaced: true };
  },

  /** Menu.List title="X" → a <Menu.Label>X</Menu.Label> sibling before the list. */
  'menu-list'(ctx, path, element) {
    const attr = findAttr(element, 'title');
    if (!attr) return {};
    const parent = path.parent?.node;
    if (!parent || parent.type !== 'JSXElement') {
      addTodo(
        ctx,
        path,
        'prop:title',
        'Menu.List `title` becomes a separate <Menu.Label> sibling; add it by hand'
      );
      return {};
    }
    const j = ctx.j;
    const menuLocal = ctx.reserve('Menu');
    const labelChildren =
      attr.value == null
        ? []
        : attr.value.type === 'StringLiteral'
          ? [j.jsxText(attr.value.value)]
          : [attr.value]; // JSXExpressionContainer carries over as a child
    const labelName = () =>
      j.jsxMemberExpression(
        j.jsxIdentifier(menuLocal),
        j.jsxIdentifier('Label')
      );
    const label = j.jsxElement(
      j.jsxOpeningElement(labelName(), []),
      j.jsxClosingElement(labelName()),
      labelChildren
    );
    removeAttr(element, attr);
    const index = parent.children.indexOf(element);
    if (index !== -1) {
      parent.children.splice(index, 0, label, j.jsxText('\n'));
    }
    ctx.dirty = true;
    return {};
  },

  /** Panel.Tabs.Tab → plain <a> (bestax Panel.Tabs children are anchors). */
  'panel-tab'(ctx, path, element) {
    const activeAttr = findAttr(element, 'active');
    let className: string | undefined;
    if (activeAttr) {
      const literal = literalValueOf(activeAttr);
      if (literal.kind === 'boolean' && literal.value === true) {
        className = 'is-active';
        removeAttr(element, activeAttr);
      } else if (literal.kind === 'boolean') {
        removeAttr(element, activeAttr);
      } else {
        addTodo(
          ctx,
          path,
          'prop:active',
          "dynamic Panel.Tabs.Tab active; set className={active ? 'is-active' : undefined} by hand"
        );
        removeAttr(element, activeAttr);
      }
    }
    const rest = stripModifierProps(
      ctx,
      path,
      attributesOf(element).filter(a => a.name.name !== 'className'),
      'Panel.Tabs.Tab'
    );
    path.replace(
      plainElement(ctx.j, 'a', className, rest, element.children ?? [])
    );
    ctx.dirty = true;
    return { replaced: true };
  },

  /** Breadcrumb.Item → <li className="is-active"><a href>…</a></li>. */
  'breadcrumb-item'(ctx, path, element) {
    const j = ctx.j;
    const activeAttr = findAttr(element, 'active');
    let liClass: string | undefined;
    if (activeAttr) {
      const literal = literalValueOf(activeAttr);
      if (literal.kind === 'boolean' && literal.value === true)
        liClass = 'is-active';
      else if (literal.kind !== 'boolean') {
        addTodo(
          ctx,
          path,
          'prop:active',
          "dynamic Breadcrumb.Item active; set the li className={active ? 'is-active' : undefined} by hand"
        );
      }
      removeAttr(element, activeAttr);
    }
    const anchorAttrs = stripModifierProps(
      ctx,
      path,
      attributesOf(element).filter(a => a.name.name !== 'className'),
      'Breadcrumb.Item'
    );
    const children = element.children ?? [];
    const solidChildren = children.filter(
      (c: any) => !(c.type === 'JSXText' && c.value.trim() === '')
    );
    // `<Breadcrumb.Item><a href>…</a></Breadcrumb.Item>` already carries its
    // own anchor — wrap it in the <li> directly instead of nesting anchors.
    const existingAnchor =
      solidChildren.length === 1 &&
      solidChildren[0].type === 'JSXElement' &&
      solidChildren[0].openingElement.name.type === 'JSXIdentifier' &&
      solidChildren[0].openingElement.name.name === 'a'
        ? solidChildren[0]
        : null;
    if (existingAnchor && anchorAttrs.length > 0) {
      existingAnchor.openingElement.attributes = [
        ...(existingAnchor.openingElement.attributes ?? []),
        ...anchorAttrs,
      ];
    }
    const anchor =
      existingAnchor ?? plainElement(j, 'a', undefined, anchorAttrs, children);
    path.replace(plainElement(j, 'li', liClass, [], [anchor]));
    ctx.dirty = true;
    return { replaced: true };
  },

  /** Table.Container: fold into `isResponsive` on a single Table child. */
  'table-container'(ctx, path, element) {
    const children = (element.children ?? []).filter(
      (c: any) => !(c.type === 'JSXText' && c.value.trim() === '')
    );
    if (children.length === 1 && children[0].type === 'JSXElement') {
      const child = children[0];
      addAttr(child, makeAttr(ctx.j, 'isResponsive'));
      path.replace(child);
      ctx.dirty = true;
      return { replaced: true };
    }
    const rest = stripModifierProps(
      ctx,
      path,
      attributesOf(element).filter(a => a.name.name !== 'className'),
      'Table.Container'
    );
    path.replace(
      plainElement(
        ctx.j,
        'div',
        'table-container',
        rest,
        element.children ?? []
      )
    );
    ctx.dirty = true;
    return { replaced: true };
  },

  /**
   * RBC Tabs.Tab renders its own anchor; bestax Tabs.Item is the bare <li>
   * and Bulma styles `.tabs li a` — wrap the children in an <a> unless one
   * is already there.
   */
  'tab-item'(ctx, path, element) {
    const children = element.children ?? [];
    const solid = children.filter(
      (c: any) => !(c.type === 'JSXText' && c.value.trim() === '')
    );
    if (solid.length === 0) return {};
    const alreadyAnchor =
      solid.length === 1 &&
      solid[0].type === 'JSXElement' &&
      solid[0].openingElement.name.type === 'JSXIdentifier' &&
      solid[0].openingElement.name.name === 'a';
    if (alreadyAnchor) return {};
    const anchorAttrs = stripModifierProps(
      ctx,
      path,
      attributesOf(element).filter(
        a => !['active', 'className'].includes(a.name.name)
      ),
      'Tabs.Tab'
    );
    for (const attr of attributesOf(element)) {
      if (!['active', 'className'].includes(attr.name.name)) {
        removeAttr(element, attr);
      }
    }
    element.children = [
      plainElement(ctx.j, 'a', undefined, anchorAttrs, children),
    ];
    ctx.dirty = true;
    return {};
  },

  /** RBC Tabs children sit directly under .tabs; bestax needs a Tabs.List. */
  tabs(ctx, _path, element) {
    const children = element.children ?? [];
    const hasContent = children.some(
      (c: any) => c.type !== 'JSXText' || c.value.trim() !== ''
    );
    if (!hasContent) return {};
    const j = ctx.j;
    const tabsLocal = ctx.reserve('Tabs');
    const listName = () =>
      j.jsxMemberExpression(
        j.jsxIdentifier(tabsLocal),
        j.jsxIdentifier('List')
      );
    const list = j.jsxElement(
      j.jsxOpeningElement(listName(), []),
      j.jsxClosingElement(listName()),
      children
    );
    element.children = [j.jsxText('\n'), list, j.jsxText('\n')];
    ctx.dirty = true;
    return {};
  },
};

export function runSpecial(
  name: string,
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any
): SpecialResult {
  const handler = SPECIALS[name];
  if (!handler) return {};
  return handler(ctx, path, element);
}

/** Responsive-flattening kinds keyed by mapping special names. */
export const RESPONSIVE_KINDS: Record<string, 'columns' | 'column'> = {
  columns: 'columns',
  column: 'column',
};
