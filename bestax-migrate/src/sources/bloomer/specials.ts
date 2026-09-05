/**
 * Structural handlers for bloomer → bestax conversions a rename table cannot
 * express: targets chosen by a prop's value (PageControl `isNext`, NavbarItem
 * `hasDropdown`), wrappers bestax renders itself (Page, whose Pagination.Link
 * child renders its own <li>), replacement with plain HTML where bestax has
 * no component (Help, Label, Heading, BreadcrumbItem, PanelTab, TabLink,
 * HeroVideo), and the two props whose bloomer shape has no single bestax
 * prop (Icon's className, Control's hasIcons).
 *
 * A handler may return a `target` override for the rename step, or mark the
 * element `replaced` when it substituted the node itself.
 */

import type { ASTPath } from 'jscodeshift';
import { RENDER_TODO, RESPONSIVE_PROPS, UNIVERSAL_PROPS } from './mapping.js';
import {
  addAttr,
  addTodo,
  attributesOf,
  findAttr,
  literalValueOf,
  makeAttr,
  removeAttr,
  resolveBooleanish,
  type TransformContext,
} from '../_shared/jsx-utils.js';
import { applyPropAction } from '../_shared/props.js';
import {
  applyIconProps,
  makeStripModifierProps,
  makeStructuralHelpers,
  modifierClass,
  parseIconClasses,
  restrictAsToTargets,
  type SpecialHandler,
  type SpecialResult,
} from '../_shared/specials-utils.js';

export type { SpecialResult };

/* eslint-disable @typescript-eslint/no-explicit-any */

const stripModifierProps = makeStripModifierProps(
  UNIVERSAL_PROPS,
  RESPONSIVE_PROPS
);

/**
 * Before an element becomes intrinsic HTML: `render` gets its own hint
 * rather than the generic "helper props dropped" one (it is not a helper,
 * and the universal table's TODO would otherwise leave a function prop on a
 * DOM element), then the helper props go.
 */
const { replaceWithPlain, collapseOntoChild } = makeStructuralHelpers(
  (ctx, path, attrs, where) => {
    const kept: any[] = [];
    for (const attr of attrs) {
      if (attr?.name?.name === 'render') {
        addTodo(ctx, path, 'prop:render', `\`render\` — ${RENDER_TODO.todo}`);
      } else {
        kept.push(attr);
      }
    }
    return stripModifierProps(ctx, path, kept, where);
  }
);

/**
 * bloomer rendered every component through `React.createElement(tag, …)`, so
 * a plain-element rewrite can honour a literal `tag` instead of dropping it.
 */
function plainTag(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  fallback: string,
  where: string
): string {
  const attr = findAttr(element, 'tag');
  if (!attr) return fallback;
  const literal = literalValueOf(attr);
  removeAttr(element, attr);
  ctx.dirty = true;
  if (literal.kind === 'string') return literal.value;
  addTodo(
    ctx,
    path,
    'prop:tag',
    `dynamic ${where} \`tag\`; it became a plain <${fallback}> — render the tag yourself`
  );
  return fallback;
}

/** A booleanish modifier prop → an `is-*` class fragment, always removed. */
function booleanClass(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  prop: string,
  cls: string,
  where: string
): string | undefined {
  const attr = findAttr(element, prop);
  if (!attr) return undefined;
  const resolved = resolveBooleanish(attr);
  removeAttr(element, attr);
  ctx.dirty = true;
  if (resolved === 'truthy') return cls;
  if (resolved === 'expression') {
    addTodo(
      ctx,
      path,
      `prop:${prop}`,
      `dynamic ${where} \`${prop}\`; set className={${prop} ? '${cls}' : undefined} by hand`
    );
  }
  return undefined;
}

const join = (...parts: Array<string | undefined>): string | undefined => {
  const kept = parts.filter((p): p is string => Boolean(p));
  return kept.length > 0 ? kept.join(' ') : undefined;
};

/**
 * Some bloomer components rendered their default `tag` (usually a <div>) and
 * switched to an <a> whenever `href` was set, whatever `tag` said: Button,
 * Delete, LevelItem, DropdownItem, NavbarItem, PanelBlock, CardFooterItem
 * (and the Nav family). bestax's defaults differ per component, so this
 * keeps bloomer's markup for those either way:
 *
 * - with a literal `href`, a surviving `tag` (which the mapping turns into
 *   `as`) would undo the anchor on targets that already render one, so it is
 *   dropped; where the target defaults to something else, `as="a"` is set
 *   (`setAs`). A dynamic `href` was a runtime decision bloomer made and
 *   bestax cannot: it is flagged, not guessed;
 * - without `href` or `tag`, a target that defaults to an <a> gets
 *   `as={bareAs}` so bloomer's <div> stays a <div>.
 */
function anchorWhenHref(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  options: { setAs?: boolean; bareAs?: string } = {}
): string[] {
  const handled: string[] = [];
  const tagAttr = findAttr(element, 'tag');
  const hrefAttr = findAttr(element, 'href');
  // bloomer chose the element with `props.href ? 'a' : tag`, so an empty or
  // false `href` kept the default element. It selected nothing, and bestax
  // types `href` as a string where it exists at all, so it is dropped.
  const hrefLiteral = hrefAttr ? literalValueOf(hrefAttr) : undefined;
  const hrefFalsy =
    hrefLiteral !== undefined &&
    hrefLiteral.kind !== 'expression' &&
    !hrefLiteral.value;
  if (hrefAttr && hrefFalsy) {
    removeAttr(element, hrefAttr);
    handled.push('href');
    ctx.dirty = true;
  }
  if (hrefAttr && !hrefFalsy) {
    const literal = hrefLiteral!;
    if (literal.kind === 'expression') {
      addTodo(
        ctx,
        path,
        'prop:href',
        `bloomer rendered an <a> only when \`href\` had a value, and this one is dynamic; set \`as\` conditionally by hand${tagAttr ? ' (the `tag` was kept as `as` for the other case)' : ''}`
      );
      return handled;
    }
    if (tagAttr) {
      removeAttr(element, tagAttr);
      handled.push('tag');
      ctx.dirty = true;
    }
    if (options.setAs && !findAttr(element, 'as')) {
      addAttr(element, makeAttr(ctx.j, 'as', 'a'));
      ctx.dirty = true;
    }
  } else if (options.bareAs && !tagAttr && !findAttr(element, 'as')) {
    addAttr(element, makeAttr(ctx.j, 'as', options.bareAs));
    ctx.dirty = true;
  }
  return handled;
}

/** Font Awesome 4 spelled its one style as a bare `fa` token. */
const FA4_CLASSES = /(?:^|\s)fa(?:\s|$)/;

/**
 * Turn an icon-font class string into bestax `Icon` props when the parser
 * can read every token (Font Awesome 5/6 and MDI, modifiers included —
 * those become `features`); otherwise render it the way bloomer did — an <i>
 * child carrying the classes — which bestax's `Icon` accepts as a custom
 * node, and say why that may still need attention.
 */
function iconFromClasses(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  classes: string | { dynamic: any },
  where: string
): void {
  const { j } = ctx;
  if (typeof classes === 'string') {
    const parsed = parseIconClasses(classes);
    // An app's own class on the glyph has no home on bestax's Icon props;
    // keeping the child keeps it.
    if (parsed && parsed.leftovers.length === 0) {
      applyIconProps(ctx, path, element, parsed);
      return;
    }
  }
  const classValue =
    typeof classes === 'string'
      ? j.stringLiteral(classes)
      : j.jsxExpressionContainer(classes.dynamic);
  const child = j.jsxElement(
    j.jsxOpeningElement(
      j.jsxIdentifier('i'),
      [
        j.jsxAttribute(j.jsxIdentifier('className'), classValue),
        makeAttr(j, 'aria-hidden', 'true'),
      ],
      true
    ),
    null,
    []
  );
  element.children = [child];
  element.openingElement.selfClosing = false;
  element.closingElement = j.jsxClosingElement(element.openingElement.name);
  ctx.dirty = true;
  const fa4 = typeof classes === 'string' && FA4_CLASSES.test(classes);
  addTodo(
    ctx,
    path,
    `component:${where}`,
    fa4
      ? `kept the Font Awesome 4 classes on an <i> child, as bloomer rendered them; bestax's optional Font Awesome peer is 6.7+, where many v4 names changed (brand icons moved to \`variant="brands"\`) — keep FA4 loaded, or switch to \`name\`/\`library\`/\`variant\` (\`<Icon name="home" library="fa" variant="solid" />\`)`
      : `kept the icon classes on an <i> child, as bloomer rendered them; bestax renders that child unchanged, so make sure the icon font is still loaded — or switch to \`name\`/\`library\`/\`variant\` (\`<Icon name="home" library="fa" variant="solid" />\`), with any modifier classes in \`features\``
  );
}

/**
 * bloomer's Icon and PanelIcon both put the icon-font classes on their own
 * `className` and rendered `<span class="…"><i class={className}/></span>`,
 * ignoring children. Consume that className into bestax props or a child.
 */
function iconFromElement(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  where: string
): void {
  const { j } = ctx;
  /**
   * bestax's Icon needs a `name` or a child; with neither, bloomer rendered
   * an empty glyph (`<i class="undefined">`). An empty `<i>` child keeps the
   * element typechecking and the markup as it was while the TODO stands.
   */
  const inertChild = (): void => {
    element.children = [
      j.jsxElement(
        j.jsxOpeningElement(
          j.jsxIdentifier('i'),
          [makeAttr(j, 'aria-hidden', 'true')],
          true
        ),
        null,
        []
      ),
    ];
    element.openingElement.selfClosing = false;
    element.closingElement = j.jsxClosingElement(element.openingElement.name);
    ctx.dirty = true;
  };
  const classAttr = findAttr(element, 'className');
  const solid = (element.children ?? []).filter(
    (c: any) => !(c.type === 'JSXText' && c.value.trim() === '')
  );
  if (classAttr) {
    if (solid.length > 0) {
      // bloomer drew the glyph from `className` and never rendered these;
      // the classes win, and the removed markup is named.
      addTodo(
        ctx,
        path,
        `component:${where}`,
        `removed the children of this ${where}: bloomer never rendered them (the glyph came from \`className\`), and bestax's Icon takes either classes or a child — restore them by hand if they mattered`
      );
    }
    const literal = literalValueOf(classAttr);
    removeAttr(element, classAttr);
    ctx.dirty = true;
    if (literal.kind === 'string') {
      iconFromClasses(ctx, path, element, literal.value, where);
    } else if (literal.kind === 'expression') {
      iconFromClasses(
        ctx,
        path,
        element,
        { dynamic: classAttr.value.expression },
        where
      );
    } else {
      // A bare `className`, or a boolean/number: never icon classes, and
      // `classAttr.value` may be null — no expression to carry over.
      inertChild();
      addTodo(
        ctx,
        path,
        'prop:className',
        `\`className\` on ${where} was not an icon-class string (bloomer read the icon-font classes from it); bestax's needs a \`name\` (plus \`library\`/\`variant\`) or a child node — set one by hand`
      );
    }
    return;
  }
  if (solid.length === 0) {
    inertChild();
    addTodo(
      ctx,
      path,
      `component:${where}`,
      `no icon classes to carry over (bloomer read them from \`className\`); bestax's needs a \`name\` (plus \`library\`/\`variant\`) or a child node — an empty <i> child keeps it compiling until you set one`
    );
    return;
  }
  // bloomer drew the glyph from `className` and never rendered its children;
  // bestax renders them. They are kept — dropping markup is worse — but that
  // is a change the user has to see.
  addTodo(
    ctx,
    path,
    `component:${where}`,
    `bloomer's ${where} never rendered its children (the glyph came from \`className\`); bestax renders them, so check this is what you want to show, or replace them with \`name\`/\`library\`/\`variant\``
  );
}

const SPECIALS: Record<string, SpecialHandler> = {
  /**
   * `isLink` is Bulma's `is-link` colour and collides with `isColor`, and an
   * `href` made bloomer render an <a> — bestax's Button renders a <button>
   * unless `as` says otherwise.
   */
  button(ctx, path, element) {
    const linkAttr = findAttr(element, 'isLink');
    if (linkAttr) {
      const resolved = resolveBooleanish(linkAttr);
      removeAttr(element, linkAttr);
      ctx.dirty = true;
      if (resolved === 'truthy') {
        if (findAttr(element, 'isColor') || findAttr(element, 'color')) {
          addTodo(
            ctx,
            path,
            'prop:isLink',
            '`isLink` alongside `isColor`; bestax `Button` has one `color`, so pick `color="link"` or the other colour by hand'
          );
        } else {
          addAttr(element, makeAttr(ctx.j, 'color', 'link'));
        }
      } else if (resolved === 'expression') {
        addTodo(
          ctx,
          path,
          'prop:isLink',
          'dynamic `isLink`; set `color="link"` conditionally by hand'
        );
      }
    }
    const handled = anchorWhenHref(ctx, path, element, { setAs: true });
    return { handledProps: ['isLink', ...handled] };
  },

  /**
   * bloomer's Heading is Bulma's `.heading` label (small caps), which Bulma
   * v1 no longer styles and bestax has no component for. It becomes the
   * plain element bloomer rendered, and the TODO says the styling is gone.
   */
  heading(ctx, path, element) {
    addTodo(
      ctx,
      path,
      'component:Heading',
      'Bulma v1 dropped the `.heading` styles, so this plain <p className="heading"> renders unstyled; restyle it with bestax helpers (e.g. `textSize="7" textTransform="uppercase" textWeight="semibold"`) or your own class'
    );
    const tag = plainTag(ctx, path, element, 'p', 'Heading');
    return replaceWithPlain(ctx, path, element, tag, 'heading', 'Heading');
  },

  /**
   * bloomer's Icon put the icon-font classes on its own `className` and
   * rendered `<span class="icon"><i class={className}/></span>`, ignoring
   * children. `isAlign` is Bulma's `.icon.is-left`, which bestax's Icon has
   * no prop for — it goes on the container's className.
   */
  icon(ctx, path, element) {
    const alignAttr = findAttr(element, 'isAlign');
    let alignClass: string | undefined;
    if (alignAttr) {
      const literal = literalValueOf(alignAttr);
      removeAttr(element, alignAttr);
      ctx.dirty = true;
      if (
        literal.kind === 'string' &&
        (literal.value === 'left' || literal.value === 'right')
      ) {
        alignClass = `is-${literal.value}`;
      } else if (literal.kind === 'expression') {
        addTodo(
          ctx,
          path,
          'prop:isAlign',
          'dynamic Icon `isAlign`; bestax `Icon` has no align prop — set className={align ? `is-${align}` : undefined} by hand'
        );
      }
    }

    iconFromElement(ctx, path, element, 'Icon');

    if (alignClass) {
      addAttr(element, makeAttr(ctx.j, 'className', alignClass));
    }
    return { handledProps: ['className', 'isAlign'] };
  },

  /** bloomer's PanelIcon is its Icon in panel clothing: same className API. */
  'panel-icon'(ctx, path, element) {
    iconFromElement(ctx, path, element, 'PanelIcon');
    return { handledProps: ['className'] };
  },

  /**
   * bloomer's `hasIcons` is `true` (both sides), a side, or an array of
   * sides; bestax has one boolean per side.
   */
  'control-icons'(ctx, path, element) {
    const attr = findAttr(element, 'hasIcons');
    if (!attr) return {};
    const { j } = ctx;
    const side = (value: unknown): void => {
      if (value === 'left' || value === 'right') {
        const name = value === 'left' ? 'hasIconsLeft' : 'hasIconsRight';
        if (!findAttr(element, name)) addAttr(element, makeAttr(j, name));
      } else {
        addTodo(
          ctx,
          path,
          'prop:hasIcons',
          `\`hasIcons\` value ${JSON.stringify(value)} is not "left" or "right"; set \`hasIconsLeft\`/\`hasIconsRight\` by hand`
        );
      }
    };
    const literal = literalValueOf(attr);
    if (literal.kind === 'boolean') {
      if (literal.value) {
        side('left');
        side('right');
      }
    } else if (literal.kind === 'string') {
      side(literal.value);
    } else if (
      attr.value?.type === 'JSXExpressionContainer' &&
      attr.value.expression?.type === 'ArrayExpression'
    ) {
      for (const item of attr.value.expression.elements ?? []) {
        if (item?.type === 'StringLiteral') side(item.value);
        else {
          addTodo(
            ctx,
            path,
            'prop:hasIcons',
            '`hasIcons` entry has a dynamic value; set `hasIconsLeft`/`hasIconsRight` conditionally by hand'
          );
        }
      }
    } else {
      addTodo(
        ctx,
        path,
        'prop:hasIcons',
        'dynamic `hasIcons`; set `hasIconsLeft`/`hasIconsRight` conditionally by hand'
      );
    }
    removeAttr(element, attr);
    ctx.dirty = true;
    return { handledProps: ['hasIcons'] };
  },

  /**
   * bloomer's Image takes a fixed size and a ratio as two props and emits
   * both classes; bestax's `size` carries either one.
   */
  image(ctx, path, element) {
    const { j } = ctx;
    const RATIOS: Record<string, string> = {
      square: 'square',
      '1:1': '1by1',
      '4:3': '4by3',
      '3:2': '3by2',
      '16:9': '16by9',
      '2:1': '2by1',
    };
    const sizeAttr = findAttr(element, 'isSize');
    if (sizeAttr) {
      sizeAttr.name = j.jsxIdentifier('size');
      ctx.dirty = true;
    }
    const ratioAttr = findAttr(element, 'isRatio');
    if (ratioAttr) {
      const literal = literalValueOf(ratioAttr);
      if (sizeAttr) {
        removeAttr(element, ratioAttr);
        addTodo(
          ctx,
          path,
          'prop:isRatio',
          'both `isSize` and `isRatio` were set; bestax `Image` has one `size` prop for either, and Bulma applies only one of the two classes — kept the fixed size, restore the ratio by hand if that is the one you wanted'
        );
      } else if (literal.kind === 'string' && RATIOS[literal.value]) {
        ratioAttr.name = j.jsxIdentifier('size');
        ratioAttr.value = j.stringLiteral(RATIOS[literal.value]);
      } else {
        removeAttr(element, ratioAttr);
        addTodo(
          ctx,
          path,
          'prop:isRatio',
          literal.kind === 'string'
            ? `\`isRatio="${literal.value}"\` is not a ratio bloomer's helpers know; set bestax's \`size\` ("16by9", "4by3", …) by hand`
            : 'dynamic `isRatio`; set bestax\'s `size` ("16by9", "4by3", …) by hand'
        );
      }
      ctx.dirty = true;
    }
    return { handledProps: ['isSize', 'isRatio'] };
  },

  /** bestax has no Help component; Bulma's markup is a plain <p class="help">. */
  help(ctx, path, element) {
    const className = modifierClass(
      ctx,
      path,
      element,
      'isColor',
      'help',
      'Help'
    );
    const tag = plainTag(ctx, path, element, 'p', 'Help');
    return replaceWithPlain(ctx, path, element, tag, className, 'Help');
  },

  /** bestax has no standalone Label; Bulma's markup is <label class="label">. */
  label(ctx, path, element) {
    const className = modifierClass(
      ctx,
      path,
      element,
      'isSize',
      'label',
      'Label'
    );
    const tag = plainTag(ctx, path, element, 'label', 'Label');
    return replaceWithPlain(ctx, path, element, tag, className, 'Label');
  },

  /**
   * bestax's Breadcrumb renders the <ul> and takes plain <li> children —
   * exactly what bloomer's BreadcrumbItem rendered (its children carried the
   * <a>).
   */
  'breadcrumb-item'(ctx, path, element) {
    const cls = booleanClass(
      ctx,
      path,
      element,
      'isActive',
      'is-active',
      'BreadcrumbItem'
    );
    const tag = plainTag(ctx, path, element, 'li', 'BreadcrumbItem');
    return replaceWithPlain(ctx, path, element, tag, cls, 'BreadcrumbItem');
  },

  /**
   * bloomer's Dropdown owns both the trigger and the menu as children;
   * bestax's takes a `label` and renders the trigger and menu itself, so the
   * shape differs enough that a mechanical rewrite would be a guess.
   */
  dropdown(ctx, path, _element) {
    addTodo(
      ctx,
      path,
      'component:Dropdown',
      'bestax `Dropdown` takes a `label` and renders its own trigger and menu; move the `<DropdownTrigger>` content into `label`, keep the `<DropdownItem>`s as direct children, and drop the `DropdownMenu`/`DropdownContent` wrappers'
    );
    return {};
  },

  /**
   * bestax's Menu.Item renders its own <li><a>; bloomer's MenuLink was the
   * <a> alone, so its docs (and apps) wrap it in a literal <li>. That <li>
   * folds onto the item, carrying its attributes, or the list nests.
   */
  'menu-link'(ctx, path, element) {
    const parentPath = path.parent;
    const parent = parentPath?.node;
    if (
      parent?.type === 'JSXElement' &&
      parent.openingElement?.name?.type === 'JSXIdentifier' &&
      parent.openingElement.name.name === 'li'
    ) {
      const siblings = (parent.children ?? []).filter(
        (c: any) => !(c.type === 'JSXText' && c.value.trim() === '')
      );
      if (siblings.length === 1 && siblings[0] === element) {
        // Spreads first, as one block in source order, so the link's own
        // props still win over them.
        const spreads = (parent.openingElement.attributes ?? []).filter(
          (a: any) => a.type === 'JSXSpreadAttribute'
        );
        if (spreads.length > 0) {
          element.openingElement.attributes = [
            ...spreads,
            ...(element.openingElement.attributes ?? []),
          ];
        }
        for (const attr of [...(parent.openingElement.attributes ?? [])]) {
          if (attr.type === 'JSXSpreadAttribute') continue;
          const name =
            attr.type === 'JSXAttribute' ? attr.name.name : undefined;
          if (name && findAttr(element, name)) {
            addTodo(
              ctx,
              path,
              'prop:' + name,
              `the <li> around this MenuLink and the link both set \`${name}\`; the link's value was kept — reconcile by hand`
            );
            continue;
          }
          addAttr(element, attr);
        }
        parentPath.replace(element);
        ctx.dirty = true;
      } else {
        addTodo(
          ctx,
          path,
          'component:MenuLink',
          'bestax `Menu.Item` renders its own <li>, and this MenuLink shares its <li> with other content — remove the <li> or move the siblings by hand'
        );
      }
    }
    return {};
  },

  /**
   * bestax's Breadcrumb renders its own <ul>; bloomer's was the bare <nav>,
   * so its docs wrote the <ul>. It folds away, or the lists nest.
   */
  breadcrumb(ctx, path, element) {
    const solid = (element.children ?? []).filter(
      (c: any) => !(c.type === 'JSXText' && c.value.trim() === '')
    );
    const ul = solid[0];
    if (
      solid.length === 1 &&
      ul.type === 'JSXElement' &&
      ul.openingElement?.name?.type === 'JSXIdentifier' &&
      ul.openingElement.name.name === 'ul'
    ) {
      const attrs = ul.openingElement.attributes ?? [];
      if (attrs.length > 0) {
        addTodo(
          ctx,
          path,
          'component:Breadcrumb',
          'bestax `Breadcrumb` renders its own <ul>, so the attributes on this one were dropped with it — re-apply them to the Breadcrumb by hand'
        );
      }
      element.children = ul.children ?? [];
      ctx.dirty = true;
    }
    return {};
  },

  /** bestax's Level.Item renders a <div> unless `as="a"`. */
  'level-item'(ctx, path, element) {
    return {
      handledProps: anchorWhenHref(ctx, path, element, { setAs: true }),
    };
  },

  /** bloomer's default DropdownItem was a <div>; bestax's Dropdown.Item is an <a>. */
  'dropdown-item'(ctx, path, element) {
    return {
      handledProps: anchorWhenHref(ctx, path, element, { bareAs: 'div' }),
    };
  },

  /**
   * bestax's Panel.Block is always an <a>; bloomer's was a <div> unless
   * `href` was set (a checkbox label, a search box). Only the anchor case
   * is the bestax component — the rest stays the plain block it was.
   */
  'panel-block'(ctx, path, element) {
    // The same rule as anchorWhenHref: bloomer chose the anchor with
    // `props.href ? 'a' : tag`, so an empty or false href is no anchor.
    const hrefAttr = findAttr(element, 'href');
    const hrefLiteral = hrefAttr ? literalValueOf(hrefAttr) : undefined;
    const anchored =
      hrefAttr !== undefined &&
      (hrefLiteral!.kind === 'expression' || Boolean(hrefLiteral!.value));
    if (hrefAttr && !anchored) {
      // A falsy href selected nothing in bloomer and cannot sit on a <div>.
      removeAttr(element, hrefAttr);
      ctx.dirty = true;
    }
    if (anchored) {
      return { handledProps: anchorWhenHref(ctx, path, element) };
    }
    const cls = join(
      'panel-block',
      booleanClass(ctx, path, element, 'isActive', 'is-active', 'PanelBlock'),
      booleanClass(ctx, path, element, 'isWrapped', 'is-wrapped', 'PanelBlock')
    );
    const tag = plainTag(ctx, path, element, 'div', 'PanelBlock');
    return replaceWithPlain(ctx, path, element, tag, cls, 'PanelBlock');
  },

  /**
   * bloomer's Modal was an inert shell: no Escape handling, no scroll lock,
   * no portal. bestax's closes on Escape and locks body scroll by default
   * (#633) and renders inline unless `portal` is set — so every conversion
   * changes behaviour, and this says how.
   */
  modal(ctx, path, _element) {
    addTodo(
      ctx,
      path,
      'component:Modal',
      "bestax `Modal` closes on Escape (calling `onClose`) and locks body scroll by default, which bloomer's never did: pass `onClose`, or set `closeOnEscape={false}` / `lockScroll={false}` to keep bloomer's behaviour; it renders inline unless `portal` is set"
    );
    return {};
  },

  /**
   * bloomer's NavbarItem carries `hasDropdown`, which bestax splits into the
   * Navbar.Dropdown container (`navbar-item has-dropdown`) and Navbar.Item.
   */
  'navbar-item'(ctx, path, element) {
    let target = 'Navbar.Item';
    const dropdownAttr = findAttr(element, 'hasDropdown');
    if (dropdownAttr) {
      const resolved = resolveBooleanish(dropdownAttr);
      removeAttr(element, dropdownAttr);
      ctx.dirty = true;
      if (resolved === 'truthy') {
        target = 'Navbar.Dropdown';
      } else if (resolved === 'expression') {
        addTodo(
          ctx,
          path,
          'prop:hasDropdown',
          'dynamic NavbarItem `hasDropdown`; pick between `<Navbar.Item>` and `<Navbar.Dropdown>` by hand'
        );
      }
    }
    // `hoverable` exists on bestax's Navbar.Dropdown, not on Navbar.Item.
    const hoverAttr = findAttr(element, 'isHoverable');
    if (hoverAttr) {
      if (target === 'Navbar.Dropdown') {
        hoverAttr.name = ctx.j.jsxIdentifier('hoverable');
      } else {
        removeAttr(element, hoverAttr);
        addTodo(
          ctx,
          path,
          'prop:isHoverable',
          'bestax `Navbar.Item` has no `hoverable` prop (only `Navbar.Dropdown` does); restructure or add className="is-hoverable"'
        );
      }
      ctx.dirty = true;
    }
    // bloomer's default NavbarItem was a <div>; bestax's Navbar.Item is an <a>.
    // The dropdown container has neither `href` nor `as`.
    let handled: string[] = [];
    if (target === 'Navbar.Item') {
      handled = anchorWhenHref(ctx, path, element, { bareAs: 'div' });
    } else {
      const hrefAttr = findAttr(element, 'href');
      if (hrefAttr) {
        removeAttr(element, hrefAttr);
        ctx.dirty = true;
        addTodo(
          ctx,
          path,
          'prop:href',
          'bestax `Navbar.Dropdown` is the container and takes no `href`; put it on the `<Navbar.Link>` inside'
        );
      }
    }
    restrictAsToTargets(ctx, path, element, target, ['Navbar.Item'], 'tag');
    return {
      target,
      handledProps: ['hasDropdown', 'isHoverable', ...handled],
    };
  },

  /**
   * bloomer's NavbarDropdown is the MENU (`div.navbar-dropdown`); bestax
   * calls that `Navbar.DropdownMenu` and reserves `Navbar.Dropdown` for the
   * container — which is what `<NavbarItem hasDropdown>` becomes.
   */
  'navbar-dropdown'(ctx, path, element) {
    const boxedAttr = findAttr(element, 'isBoxed');
    if (boxedAttr) {
      applyPropAction(ctx, path, element, boxedAttr, { toClass: 'is-boxed' });
    }
    return { target: 'Navbar.DropdownMenu', handledProps: ['isBoxed'] };
  },

  /** bestax's `align` is `'centered' | 'right'`; left is Bulma's default. */
  pagination(ctx, path, element) {
    const attr = findAttr(element, 'isAlign');
    if (!attr) return {};
    const literal = literalValueOf(attr);
    if (literal.kind === 'string' && literal.value === 'left') {
      removeAttr(element, attr);
    } else {
      attr.name = ctx.j.jsxIdentifier('align');
      if (literal.kind === 'expression') {
        addTodo(
          ctx,
          path,
          'prop:isAlign',
          'dynamic Pagination `isAlign`; bestax `align` takes "centered" or "right" only — map "left" (the default) to undefined by hand'
        );
      }
    }
    ctx.dirty = true;
    return { handledProps: ['isAlign'] };
  },

  /** bloomer's PageControl is the previous link unless `isNext` says otherwise. */
  'page-control'(ctx, path, element) {
    const nextAttr = findAttr(element, 'isNext');
    const prevAttr = findAttr(element, 'isPrevious');
    const resolved = nextAttr ? resolveBooleanish(nextAttr) : 'falsy';
    if (nextAttr) removeAttr(element, nextAttr);
    if (prevAttr) removeAttr(element, prevAttr);
    ctx.dirty = true;
    let target = 'Pagination.Previous';
    if (resolved === 'truthy') {
      target = 'Pagination.Next';
    } else if (resolved === 'expression') {
      addTodo(
        ctx,
        path,
        'prop:isNext',
        'dynamic PageControl `isNext`; pick between `<Pagination.Previous>` and `<Pagination.Next>` by hand'
      );
    }
    return { target, handledProps: ['isNext', 'isPrevious'] };
  },

  /**
   * bloomer's Page is the bare <li> around a PageLink or PageEllipsis;
   * bestax's Pagination.Link and Pagination.Ellipsis render their own <li>,
   * so the wrapper folds onto its child.
   */
  page(ctx, path, element) {
    const isLink = (node: any): boolean =>
      node?.type === 'JSXElement' &&
      ['PageLink', 'PageEllipsis'].includes(
        ctx.resolve?.(node.openingElement?.name)?.join('.') ?? ''
      );
    const solid = (element.children ?? []).filter(
      (c: any) => !(c.type === 'JSXText' && c.value.trim() === '')
    );
    // Exactly the shape collapseOntoChild folds: one JSX child, and it is
    // the link. A link reached any other way (in an expression, beside a
    // sibling) still renders its own <li>, so the plain <li> this becomes
    // would nest one — said, not silently produced.
    const foldable = solid.length === 1 && isLink(solid[0]);
    if (!foldable) {
      const nested = ctx
        .j(element)
        .find(ctx.j.JSXElement)
        .paths()
        .some(p => p.node !== element && isLink(p.node));
      if (nested) {
        addTodo(
          ctx,
          path,
          'component:Page',
          "bestax's `Pagination.Link` and `Pagination.Ellipsis` render their own <li>, and this Page wraps one in a way the codemod cannot fold (an expression, or beside other children) — remove the wrapper by hand"
        );
      }
    }
    if (foldable) {
      // The child renders the <li> itself and puts its props on the <a> (or
      // the ellipsis <span>), so whatever else sat on this <li> — a class, an
      // id, a helper prop — lands on a different element after the fold.
      // It is moved rather than lost, and named.
      const moved = attributesOf(element)
        .map((a: any): string =>
          a.name.type === 'JSXNamespacedName'
            ? `${a.name.namespace.name}:${a.name.name.name}`
            : a.name.name
        )
        .filter(n => n !== 'tag' && n !== 'key');
      if (moved.length > 0) {
        addTodo(
          ctx,
          path,
          'component:Page',
          `${moved.map(n => `\`${n}\``).join(', ')} sat on the Page's <li>; bestax's \`Pagination.Link\` and \`Pagination.Ellipsis\` render their own <li> and put props on the element inside it, so ${moved.length === 1 ? 'it now applies' : 'they now apply'} there — move ${moved.length === 1 ? 'it' : 'them'} by hand if the <li> is what you styled`
        );
      }
      // The child renders the <li> itself, so a `tag` on the wrapper has
      // nothing left to apply to. bloomer's default is the same <li>; anything
      // else is a change bestax cannot express.
      const tagAttr = findAttr(element, 'tag');
      if (tagAttr) {
        const literal = literalValueOf(tagAttr);
        removeAttr(element, tagAttr);
        ctx.dirty = true;
        if (!(literal.kind === 'string' && literal.value === 'li')) {
          addTodo(
            ctx,
            path,
            'prop:tag',
            'bestax `Pagination.Link` and `Pagination.Ellipsis` render their own <li>, so the `tag` on this Page has nowhere to go; restyle the item by hand if it mattered'
          );
        }
      }
    }
    const collapsed = collapseOntoChild(ctx, path, element, 'Page', [
      'PageLink',
      'PageEllipsis',
    ]);
    if (collapsed) return collapsed;
    const tag = plainTag(ctx, path, element, 'li', 'Page');
    return replaceWithPlain(ctx, path, element, tag, undefined, 'Page');
  },

  /** bestax's Panel.Tabs takes plain anchors. */
  'panel-tab'(ctx, path, element) {
    const cls = booleanClass(
      ctx,
      path,
      element,
      'isActive',
      'is-active',
      'PanelTab'
    );
    const tag = plainTag(ctx, path, element, 'a', 'PanelTab');
    return replaceWithPlain(ctx, path, element, tag, cls, 'PanelTab');
  },

  /** bestax's Tabs.Item is the <li>; the anchor inside it is plain markup. */
  'tab-link'(ctx, path, element) {
    const tag = plainTag(ctx, path, element, 'a', 'TabLink');
    return replaceWithPlain(ctx, path, element, tag, undefined, 'TabLink');
  },

  /** Bulma v1 still ships `.hero-video`; bestax's Hero has no part for it. */
  'hero-video'(ctx, path, element) {
    const cls = join(
      'hero-video',
      booleanClass(
        ctx,
        path,
        element,
        'isTransparent',
        'is-transparent',
        'HeroVideo'
      )
    );
    const tag = plainTag(ctx, path, element, 'div', 'HeroVideo');
    return replaceWithPlain(ctx, path, element, tag, cls, 'HeroVideo');
  },

  /**
   * bloomer's Subtitle defaulted to an <h2>; bestax's SubTitle defaults to an
   * <h1>. Keeping the heading level is what a screen reader hears.
   */
  subtitle(ctx, _path, element) {
    if (!findAttr(element, 'tag') && !findAttr(element, 'as')) {
      addAttr(element, makeAttr(ctx.j, 'as', 'h2'));
      ctx.dirty = true;
    }
    return {};
  },

  /** Marks the element for the column size pass in responsive.ts. */
  column() {
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
  if (!handler) {
    throw new Error(
      `bloomer mapping names an unknown special handler: ${name}`
    );
  }
  return handler(ctx, path, element);
}

export const SPECIAL_NAMES = Object.keys(SPECIALS);
