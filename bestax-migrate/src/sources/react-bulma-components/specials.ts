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
  resolveBooleanish,
  type TransformContext,
} from '../_shared/jsx-utils.js';
import {
  alignTarget,
  makeStripModifierProps,
  mergeClassName,
  parseIconClasses,
  type SpecialHandler,
  type SpecialResult,
} from '../_shared/specials-utils.js';

export type { SpecialResult };

/* eslint-disable @typescript-eslint/no-explicit-any */

const stripModifierProps = makeStripModifierProps(
  UNIVERSAL_PROPS,
  RESPONSIVE_BREAKPOINTS
);

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

  /**
   * `<Button remove />` (or any truthy literal) is Bulma's delete
   * cross → bestax `<Delete />`. A falsy literal just drops the prop; only a
   * genuine expression can render as either one depending on runtime state, so
   * it's a TODO instead of a silent guess.
   */
  button(ctx, path, element) {
    const attr = findAttr(element, 'remove');
    if (!attr) return {};
    const resolved = resolveBooleanish(attr);
    if (resolved !== 'expression') {
      // A statically-known value always renders the same at runtime: truthy
      // (`remove`, `remove={true}`, `remove="true"`) → `<Delete />`; falsy
      // (`remove={false}`, `remove=""`, `remove={0}`) → just drop the prop.
      removeAttr(element, attr);
      ctx.dirty = true;
      return resolved === 'truthy' ? { target: 'Delete' } : {};
    }
    addTodo(
      ctx,
      path,
      'prop:remove',
      '`remove` has a dynamic value; this can render as either a Button or a Delete cross — split the branch by hand'
    );
    return {};
  },

  /**
   * Heading → Title / SubTitle / plain `.heading` paragraph, matching RBC's
   * `title: !subtitle && !heading` / `subtitle: subtitle` — the *value* of
   * each prop picks the target, not merely whether it was passed. Any
   * statically-known literal resolves to a fixed truthiness at codemod time
   * (a bare prop and `heading={true}`/`heading="heading"` are all truthy;
   * `heading={false}`/`heading=""`/`heading={0}` are falsy and equivalent to
   * the prop being absent), exactly as RBC evaluates the prop at runtime —
   * this mirrors the Button `remove` handler so the two don't contradict each
   * other on string/number literals. Only a genuine expression can't be
   * resolved: it's left in place with a TODO and a conservative
   * (Title/SubTitle, never the structural plain-element rewrite) fallback so
   * the branch can be split by hand. The subtitle class is applied
   * independently of heading in RBC, so a dynamic `subtitle` blocks the
   * structural `heading` collapse — collapsing would silently drop it.
   */
  heading(ctx, path, element) {
    const headingAttr = findAttr(element, 'heading');
    const subtitleAttr = findAttr(element, 'subtitle');
    const headingResolved = headingAttr
      ? resolveBooleanish(headingAttr)
      : undefined;
    const subtitleResolved = subtitleAttr
      ? resolveBooleanish(subtitleAttr)
      : undefined;
    const headingDynamic = headingResolved === 'expression';
    const subtitleDynamic = subtitleResolved === 'expression';
    // A resolvable literal (boolean/string/number) collapses to its runtime
    // truthiness; an expression stays dynamic.
    const headingTruthy = headingResolved === 'truthy';
    const subtitleTruthy = subtitleResolved === 'truthy';

    // Dynamic values can't be resolved to a target: leave the prop on the
    // element (so its expression survives for hand-splitting) plus a TODO.
    if (subtitleDynamic) {
      addTodo(
        ctx,
        path,
        'prop:subtitle',
        '`subtitle` has a dynamic value; pick between Title / SubTitle by hand'
      );
    }
    if (headingDynamic) {
      addTodo(
        ctx,
        path,
        'prop:heading',
        '`heading` has a dynamic value; when truthy it renders a plain `<p className="heading">` instead of Title/SubTitle — resolve by hand'
      );
    }

    // A truthy literal `heading` collapses to a plain `.heading` paragraph —
    // but only when `subtitle` isn't a dynamic value the collapse would drop.
    // A truthy *literal* `subtitle` is safe to collapse: RBC applies its class
    // independently, so it rides along on the paragraph as `heading subtitle`
    // (dropping it would be the same silent loss the dynamic guard prevents).
    if (headingTruthy && !subtitleDynamic) {
      removeAttr(element, headingAttr);
      const className = mergeClassName(
        ctx,
        path,
        element,
        subtitleTruthy ? 'heading subtitle' : 'heading',
        'Heading'
      );
      const rest = stripModifierProps(
        ctx,
        path,
        attributesOf(element).filter(
          a => !['size', 'weight', 'spaced', 'subtitle'].includes(a.name.name)
        ),
        'Heading'
      );
      const replacement = plainElement(
        ctx.j,
        'p',
        className,
        rest,
        element.children ?? []
      );
      path.replace(replacement);
      ctx.dirty = true;
      return { replaced: true };
    }

    // A resolvable literal `heading` that didn't collapse (falsy, or truthy
    // but blocked by a dynamic subtitle) behaves as if the prop were absent —
    // drop it. A dynamic `heading` stays put (its TODO is already filed above).
    if (headingAttr && !headingDynamic) {
      removeAttr(element, headingAttr);
      ctx.dirty = true;
    }

    if (subtitleAttr && !subtitleDynamic) {
      removeAttr(element, subtitleAttr);
      ctx.dirty = true;
      return { target: subtitleTruthy ? 'SubTitle' : 'Title' };
    }
    // Dynamic subtitle (attr kept) or no subtitle → conservative Title.
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
      // This handler owns `multiline` end-to-end; without this, the mapping's
      // fallback `multiline: { drop: true }` prop action would silently strip
      // a dynamic `multiline` the moment kind/align themselves are dynamic.
      return { handledProps: ['multiline'] };
    }

    // `multiline` is a value, not just presence: a falsy literal drops it
    // (same as it being absent) and a dynamic value must survive on the
    // element — so, unlike `kind`/`align`, it's only stripped once resolved.
    const multilineResolved = multilineAttr
      ? resolveBooleanish(multilineAttr)
      : null;
    const multilineDynamic = multilineResolved === 'expression';
    const multilineTruthy = multilineResolved === 'truthy';

    const kindOrAlignPresent = Boolean(kindAttr || alignAttr);
    for (const attr of [kindAttr, alignAttr]) {
      if (attr) removeAttr(element, attr);
    }
    if (multilineAttr && !multilineDynamic) {
      removeAttr(element, multilineAttr);
    }
    if (kindOrAlignPresent || (multilineAttr && !multilineDynamic)) {
      ctx.dirty = true;
    }

    const alignValue =
      align && align.kind === 'string'
        ? { center: 'centered', right: 'right' }[align.value]
        : undefined;

    if (multilineDynamic) {
      addTodo(
        ctx,
        path,
        'prop:multiline',
        '`multiline` has a dynamic value; resolve the bestax `grouped`/`hasAddons` combination by hand'
      );
    }

    if (kind && kind.kind === 'string' && kind.value === 'addons') {
      addAttr(element, makeAttr(ctx.j, 'hasAddons', alignValue));
      if (multilineTruthy) {
        addTodo(
          ctx,
          path,
          'prop:multiline',
          "`multiline` only combines with kind='group' in Bulma; dropped from this addons Field"
        );
      }
      return { handledProps: ['multiline'] };
    }
    // kind='group' (or a stray multiline/align without kind)
    if (multilineTruthy) {
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
    } else if (kindOrAlignPresent) {
      addAttr(element, makeAttr(ctx.j, 'grouped', alignValue));
    }
    return { handledProps: ['multiline'] };
  },

  /** Form.Label → plain <label className="label">. */
  'plain-label'(ctx, path, element) {
    const sizeAttr = findAttr(element, 'size');
    let className: string | undefined = 'label';
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
    className = mergeClassName(ctx, path, element, className, 'Form.Label');
    const rest = stripModifierProps(
      ctx,
      path,
      attributesOf(element),
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
    let className: string | undefined = 'help';
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
    className = mergeClassName(ctx, path, element, className, 'Form.Help');
    const rest = stripModifierProps(
      ctx,
      path,
      attributesOf(element),
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
    const className = mergeClassName(ctx, path, element, 'loader', 'Loader');
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
      const resolved = resolveBooleanish(activeAttr);
      if (resolved === 'truthy') {
        className = 'is-active';
      } else if (resolved === 'expression') {
        addTodo(
          ctx,
          path,
          'prop:active',
          "dynamic Panel.Tabs.Tab active; set className={active ? 'is-active' : undefined} by hand"
        );
      }
      removeAttr(element, activeAttr);
    }
    className = mergeClassName(ctx, path, element, className, 'Panel.Tabs.Tab');
    const rest = stripModifierProps(
      ctx,
      path,
      attributesOf(element),
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
      const resolved = resolveBooleanish(activeAttr);
      if (resolved === 'truthy') liClass = 'is-active';
      else if (resolved === 'expression') {
        addTodo(
          ctx,
          path,
          'prop:active',
          "dynamic Breadcrumb.Item active; set the li className={active ? 'is-active' : undefined} by hand"
        );
      }
      removeAttr(element, activeAttr);
    }
    liClass = mergeClassName(ctx, path, element, liClass, 'Breadcrumb.Item');
    const anchorAttrs = stripModifierProps(
      ctx,
      path,
      attributesOf(element),
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
      if (findAttr(element, 'className')) {
        addTodo(
          ctx,
          path,
          'prop:className',
          'Table.Container className; the container folded into `isResponsive` on its Table — re-apply the class by hand'
        );
      }
      const child = children[0];
      addAttr(child, makeAttr(ctx.j, 'isResponsive'));
      path.replace(child);
      ctx.dirty = true;
      return { replaced: true };
    }
    const className = mergeClassName(
      ctx,
      path,
      element,
      'table-container',
      'Table.Container'
    );
    const rest = stripModifierProps(
      ctx,
      path,
      attributesOf(element),
      'Table.Container'
    );
    path.replace(
      plainElement(ctx.j, 'div', className, rest, element.children ?? [])
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
