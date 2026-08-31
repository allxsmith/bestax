/**
 * Structural handlers for rbx → bestax conversions a rename table cannot
 * express: targets chosen by a prop's value (Level.Item align, Pagination.Step
 * align), container collapsing (Select.Container, Image.Container,
 * Modal.Container), and replacement with plain HTML where bestax has no
 * component (Heading, Help, Label, Select.Option).
 *
 * The two genuinely new families relative to react-bulma-components are here
 * too, though they are driven from transform.ts rather than the mapping table
 * because they are helper *props* that can sit on any element at all:
 * `badge*` and `tooltip*` become wrapping bestax components.
 *
 * A handler may return a `target` override for the rename step, or mark the
 * element `replaced` when it substituted the node itself.
 */

import type { ASTPath } from 'jscodeshift';
import {
  BADGE_PROPS,
  RESPONSIVE_BREAKPOINTS,
  TOOLTIP_PROPS,
  UNIVERSAL_PROPS,
} from './mapping.js';
import {
  addAttr,
  addTodo,
  buildJsxName,
  attributesOf,
  findAttr,
  jsxNameParts,
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

/**
 * Turn a literal modifier prop into an `is-*` class fragment for an element
 * on its way to becoming plain HTML. Returns the class (or undefined) and
 * always removes the attribute.
 */
function modifierClass(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  prop: string,
  base: string,
  where: string
): string {
  const attr = findAttr(element, prop);
  if (!attr) return base;
  const literal = literalValueOf(attr);
  removeAttr(element, attr);
  if (literal.kind === 'string' || literal.kind === 'number') {
    return `${base} is-${literal.value}`;
  }
  addTodo(
    ctx,
    path,
    `prop:${prop}`,
    `dynamic ${where} \`${prop}\`; add the matching is-* class by hand`
  );
  return base;
}

/**
 * Also strips the universal `responsive` object: responsive.ts would have
 * consumed it, but a `replaced: true` special skips that pass too, and it is
 * deliberately absent from UNIVERSAL_PROPS so stripModifierProps misses it.
 * Left behind it is an object literal on an intrinsic element — which does
 * not compile, unlike the badge/tooltip case which merely warns.
 *
 * rbx's badge/tooltip helper props become wrapping components in
 * transform.ts, but that pass runs after the rename step — which a
 * `replaced: true` special skips. So a plain-element rewrite has to account
 * for them itself, or they ride onto the HTML tag as unknown DOM attributes.
 */
function stripHelperComponentProps(
  ctx: TransformContext,
  path: ASTPath<any>,
  attrs: any[],
  where: string
): any[] {
  const kept: any[] = [];
  const dropped: string[] = [];
  for (const attr of attrs) {
    const name = attr?.name?.name;
    if (
      name &&
      (name in BADGE_PROPS || name in TOOLTIP_PROPS || name === 'responsive')
    ) {
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
      `${where} became a plain element, so the ${dropped
        .map(d => `\`${d}\``)
        .join(
          ', '
        )} helper prop(s) were dropped — re-apply by hand (badge/tooltip as a wrapping \`<Badge>\`/\`<Tooltip>\`, responsive settings as classes)`
    );
  }
  return kept;
}

/**
 * rbx puts `as` on every component, but a handler that chooses its target from
 * a prop value can land on a bestax component that has no `as` — Media.Item
 * resolves to Left/Content/Right where only Left declares one, Level.Item to
 * Left/Right/Item where only Item does, Navbar.Item to Item/Dropdown where
 * only Item does. Opting into `as` in the mapping table cannot express that,
 * so the target has to be checked after it is picked.
 */
function restrictAsToTargets(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  target: string | undefined,
  allowed: string[]
): void {
  const asAttr = findAttr(element, 'as');
  if (!asAttr || (target && allowed.includes(target))) return;
  removeAttr(element, asAttr);
  addTodo(
    ctx,
    path,
    'prop:as',
    `bestax's \`${target}\` has no \`as\` prop (of the targets this can resolve to, only ${allowed
      .map(a => `\`${a}\``)
      .join(' / ')} does); render the tag directly or restructure`
  );
  ctx.dirty = true;
}

/** Replace the element with a plain HTML tag carrying `className`. */
function replaceWithPlain(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  tag: string,
  className: string | undefined,
  where: string
): SpecialResult {
  const merged = mergeClassName(ctx, path, element, className, where);
  const rest = stripHelperComponentProps(
    ctx,
    path,
    stripModifierProps(ctx, path, attributesOf(element), where),
    where
  );
  path.replace(plainElement(ctx.j, tag, merged, rest, element.children ?? []));
  ctx.dirty = true;
  return { replaced: true };
}

/**
 * rbx wraps several components in a `*.Container` that owns the modifiers,
 * where bestax's component renders that wrapper itself. Move the container's
 * (already-converted) attributes onto its single child and replace the
 * container with it — otherwise both would rename to the same bestax
 * component and nest, which is invalid.
 *
 * Returns null when the element isn't the single-JSX-child shape, so the
 * caller can fall back to keeping the container.
 */
function collapseOntoChild(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  where: string,
  expected: string
): SpecialResult | null {
  const children = (element.children ?? []).filter(
    (c: any) => !(c.type === 'JSXText' && c.value.trim() === '')
  );
  if (children.length !== 1 || children[0].type !== 'JSXElement') return null;
  const child = children[0];
  // The child must be the component this container exists to wrap. rbx lets
  // both of these containers hold something else — an `<iframe>` for a ratio
  // box, a native `<select>` — and folding onto that put Bulma modifier props
  // on an intrinsic element and dropped the wrapper the markup needs.
  const childPath = ctx.resolve?.(child.openingElement?.name);
  if (!childPath || childPath.join('.') !== expected) return null;

  for (const attr of [...attributesOf(element)]) {
    const name: string = attr.name.name;
    if (findAttr(child, name)) {
      addTodo(
        ctx,
        path,
        `prop:${name}`,
        `\`${where}\` folded into its child, but both set \`${name}\`; the child's value was kept — reconcile by hand`
      );
      continue;
    }
    removeAttr(element, attr);
    addAttr(child, attr);
  }

  path.replace(child);
  ctx.dirty = true;
  return { replaced: true };
}

const SPECIALS: Record<string, SpecialHandler> = {
  /**
   * rbx's `Heading` is Bulma's `.heading` label (small caps), not a title —
   * bestax has no component for it, so it becomes a plain <p>.
   */
  heading(ctx, path, element) {
    return replaceWithPlain(ctx, path, element, 'p', 'heading', 'Heading');
  },

  /**
   * rbx folds title and subtitle into one component behind a `subtitle`
   * boolean; bestax splits them into `Title` and `SubTitle`. rbx also ignores
   * `spaced` when `subtitle` is set, so a subtitle never carries isSpaced.
   */
  title(ctx, path, element) {
    const subtitleAttr = findAttr(element, 'subtitle');
    let target = 'Title';
    let isSubtitle = false;
    if (subtitleAttr) {
      const resolved = resolveBooleanish(subtitleAttr);
      if (resolved === 'expression') {
        addTodo(
          ctx,
          path,
          'prop:subtitle',
          'dynamic `subtitle`; bestax splits these into `<Title>` and `<SubTitle>` — pick one by hand'
        );
      } else if (resolved === 'truthy') {
        target = 'SubTitle';
        isSubtitle = true;
      }
      removeAttr(element, subtitleAttr);
      ctx.dirty = true;
    }

    const spacedAttr = findAttr(element, 'spaced');
    if (spacedAttr) {
      const resolved = resolveBooleanish(spacedAttr);
      // rbx ignores `spaced` on a subtitle, so a SubTitle drops it outright.
      if (isSubtitle) {
        removeAttr(element, spacedAttr);
      } else if (resolved === 'truthy') {
        removeAttr(element, spacedAttr);
        addAttr(element, makeAttr(ctx.j, 'isSpaced'));
      } else if (resolved === 'falsy') {
        removeAttr(element, spacedAttr);
      } else {
        // Dynamic: keep the expression, just rename the prop.
        spacedAttr.name = ctx.j.jsxIdentifier('isSpaced');
      }
      ctx.dirty = true;
    }

    return { target, handledProps: ['subtitle', 'spaced'] };
  },

  /**
   * bestax's Icon takes a `name` (plus `library`/`variant`) instead of an
   * icon-font <i> child. Parse the child when we can read it, otherwise keep
   * the element and explain.
   */
  icon(ctx, path, element) {
    const children = (element.children ?? []).filter(
      (c: any) => !(c.type === 'JSXText' && c.value.trim() === '')
    );
    const iChild = children.find(
      (c: any) =>
        c.type === 'JSXElement' &&
        c.openingElement?.name?.type === 'JSXIdentifier' &&
        (c.openingElement.name.name === 'i' ||
          c.openingElement.name.name === 'span')
    );
    if (children.length === 1 && iChild) {
      const classAttr = (iChild.openingElement.attributes ?? []).find(
        (a: any) => a.type === 'JSXAttribute' && a.name.name === 'className'
      );
      const literal = classAttr ? literalValueOf(classAttr) : undefined;
      if (literal?.kind === 'string') {
        const parsed = parseIconClasses(literal.value);
        if (parsed) {
          addAttr(element, makeAttr(ctx.j, 'name', parsed.name));
          if (parsed.library) {
            addAttr(element, makeAttr(ctx.j, 'library', parsed.library));
          }
          if (parsed.variant) {
            addAttr(element, makeAttr(ctx.j, 'variant', parsed.variant));
          }
          element.children = [];
          if (element.openingElement) {
            element.openingElement.selfClosing = true;
            element.closingElement = null;
          }
          ctx.dirty = true;
          return {};
        }
      }
    }
    // rbx's own docs teach `<Icon><FontAwesomeIcon icon={faHome} /></Icon>`,
    // so this is the shape most rbx code is in. There is no icon name to read
    // out of a component reference, and `name` is required on bestax's Icon.
    addTodo(
      ctx,
      path,
      'component:Icon',
      'bestax `Icon` takes a required `name` (plus optional `library`/`variant`) instead of an icon child — e.g. `<FontAwesomeIcon icon={faHome} />` becomes `<Icon name="home" library="fa" variant="solid" />`'
    );
    return {};
  },

  /**
   * rbx nests <Image> inside <Image.Container>, which carries the size; the
   * bestax Image renders the <figure> itself, so the container collapses and
   * hands its size down.
   */
  'image-container'(ctx, path, element) {
    const sizeAttr = findAttr(element, 'size');
    if (sizeAttr) {
      const literal = literalValueOf(sizeAttr);
      if (literal.kind === 'number') {
        // rbx takes a pixel dimension (64); bestax takes Bulma's `is-64x64`
        // square form, so the number becomes "NxN".
        sizeAttr.value = ctx.j.stringLiteral(
          `${literal.value}x${literal.value}`
        );
        ctx.dirty = true;
      } else if (literal.kind !== 'string') {
        addTodo(
          ctx,
          path,
          'prop:size',
          'dynamic `Image.Container` size; set `size` on the bestax `<Image>` by hand'
        );
      }
      // A string literal is already a ratio like "16by9" — pass it through.
    }
    const collapsed = collapseOntoChild(
      ctx,
      path,
      element,
      'Image.Container',
      'Image'
    );
    if (collapsed) return collapsed;
    // No single child to fold into — keep the container as the Image itself.
    return { target: 'Image', handledProps: ['size'] };
  },

  /**
   * rbx's `Loader` is Bulma's plain `.loader` spinner, which always renders.
   * bestax's `Loading` is a different thing — a dismissible overlay that
   * returns null unless `active` — so this emits the element rbx did.
   */
  loader(ctx, path, element) {
    return replaceWithPlain(ctx, path, element, 'div', 'loader', 'Loader');
  },

  /** rbx's full-screen PageLoader is bestax's Loading with isFullPage. */
  'page-loader'(ctx, _path, element) {
    if (!findAttr(element, 'isFullPage')) {
      addAttr(element, makeAttr(ctx.j, 'isFullPage'));
      ctx.dirty = true;
    }
    return { target: 'Loading' };
  },

  /**
   * rbx's Field `multiline` only means anything alongside `kind="group"`, and
   * bestax folds both into one prop: `grouped="multiline"`. So this has to
   * win over the `kind` mapping rather than sit beside it — `grouped` set
   * twice would be invalid JSX.
   */
  field(ctx, path, element) {
    const multilineAttr = findAttr(element, 'multiline');
    if (!multilineAttr) return {};
    const resolved = resolveBooleanish(multilineAttr);
    removeAttr(element, multilineAttr);
    if (resolved === 'truthy') {
      // rbx applies `is-grouped-multiline` only when kind === "group"
      // (`[`${k}-multiline`]: k === "is-grouped" && multiline === true`), so
      // consuming `kind` unconditionally dropped `has-addons` from
      // `<Field kind="addons" multiline>` and added a modifier rbx would not
      // have rendered.
      const kindAttr = findAttr(element, 'kind');
      const kindLiteral = kindAttr ? literalValueOf(kindAttr) : undefined;
      const isGroup =
        kindLiteral?.kind === 'string' && kindLiteral.value === 'group';
      // Note `!kindAttr` is NOT grouped in here: with no `kind` at all, rbx's
      // `k` is undefined, so `multiline` renders nothing and the field stays a
      // plain block. Treating it as group turned it into a flex row.
      if (isGroup) {
        if (kindAttr) removeAttr(element, kindAttr);
        const existing = findAttr(element, 'grouped');
        if (existing) removeAttr(element, existing);
        addAttr(element, makeAttr(ctx.j, 'grouped', 'multiline'));
        ctx.dirty = true;
        return { handledProps: ['multiline', 'kind'] };
      }
      // kind="addons", a dynamic kind, or no kind at all: rbx ignores
      // multiline in every one of those, so the codemod does too and leaves
      // `kind` for the mapping table.
      if (kindAttr && kindLiteral?.kind === 'expression') {
        addTodo(
          ctx,
          path,
          'prop:multiline',
          'dynamic Field `kind` alongside `multiline`; rbx applies multiline only when kind is "group" — set `grouped="multiline"` by hand if that branch is reachable'
        );
      }
      ctx.dirty = true;
      return { handledProps: ['multiline'] };
    }
    if (resolved === 'expression') {
      addTodo(
        ctx,
        path,
        'prop:multiline',
        'dynamic Field `multiline`; set `grouped="multiline"` conditionally by hand'
      );
    }
    ctx.dirty = true;
    return { handledProps: ['multiline'] };
  },

  /** bestax has no Help component; Bulma's markup is a plain <p class="help">. */
  help(ctx, path, element) {
    const className = modifierClass(
      ctx,
      path,
      element,
      'color',
      'help',
      'Help'
    );
    return replaceWithPlain(ctx, path, element, 'p', className, 'Help');
  },

  /** bestax has no standalone Label; Bulma's markup is <label class="label">. */
  label(ctx, path, element) {
    let className = modifierClass(ctx, path, element, 'size', 'label', 'Label');
    const disabledAttr = findAttr(element, 'disabled');
    if (disabledAttr) {
      // By value, not by presence: `disabled={false}` must not become a
      // permanent `is-disabled`, and a dynamic value cannot be baked into a
      // static class string.
      const resolved = resolveBooleanish(disabledAttr);
      removeAttr(element, disabledAttr);
      if (resolved === 'truthy') {
        className = `${className} is-disabled`;
      } else if (resolved === 'expression') {
        addTodo(
          ctx,
          path,
          'prop:disabled',
          "dynamic Label `disabled`; set className={disabled ? 'label is-disabled' : 'label'} by hand"
        );
      }
      ctx.dirty = true;
    }
    return replaceWithPlain(ctx, path, element, 'label', className, 'Label');
  },

  /**
   * rbx wraps <Select> in <Select.Container>, which owns the modifiers; the
   * bestax Select renders its own wrapper, so the container collapses onto it.
   */
  'select-container'(ctx, path, element) {
    // A dynamic value must not simply disappear: rename it so the condition
    // survives, rather than dropping the modifier along with its expression.
    for (const [from, to] of [
      ['fullwidth', 'isFullwidth'],
      ['rounded', 'isRounded'],
    ] as const) {
      const attr = findAttr(element, from);
      if (!attr) continue;
      const resolved = resolveBooleanish(attr);
      if (resolved === 'truthy') {
        removeAttr(element, attr);
        addAttr(element, makeAttr(ctx.j, to));
      } else if (resolved === 'falsy') {
        removeAttr(element, attr);
      } else {
        attr.name = ctx.j.jsxIdentifier(to);
      }
      ctx.dirty = true;
    }
    const stateAttr = findAttr(element, 'state');
    if (stateAttr) {
      const literal = literalValueOf(stateAttr);
      removeAttr(element, stateAttr);
      if (literal.kind === 'string') {
        const mapped: Record<string, string> = {
          focused: 'isFocused',
          hovered: 'isHovered',
          loading: 'isLoading',
        };
        if (mapped[literal.value]) {
          addAttr(element, makeAttr(ctx.j, mapped[literal.value]));
        }
      } else {
        addTodo(
          ctx,
          path,
          'prop:state',
          'dynamic `Select.Container` state; set the matching bestax boolean by hand'
        );
      }
      ctx.dirty = true;
    }
    const collapsed = collapseOntoChild(
      ctx,
      path,
      element,
      'Select.Container',
      'Select'
    );
    if (collapsed) return collapsed;

    // rbx also lets the container wrap a NATIVE <select>. bestax's Select
    // renders its own <select>, so keeping both nested one inside the other.
    // Fold the native element's attributes and options up instead.
    const kids = (element.children ?? []).filter(
      (c: any) => !(c.type === 'JSXText' && c.value.trim() === '')
    );
    const native =
      kids.length === 1 &&
      kids[0].type === 'JSXElement' &&
      kids[0].openingElement?.name?.type === 'JSXIdentifier' &&
      kids[0].openingElement.name.name === 'select'
        ? kids[0]
        : null;
    if (native) {
      for (const attr of attributesOf(native)) {
        if (!findAttr(element, attr.name.name)) addAttr(element, attr);
      }
      element.children = native.children ?? [];
      ctx.dirty = true;
    }
    // No single child to fold into — keep the container as the Select itself.
    return {
      target: 'Select',
      handledProps: ['fullwidth', 'rounded', 'state'],
    };
  },

  /** rbx's Select.Option is a plain <option>. */
  'plain-option'(ctx, path, element) {
    return replaceWithPlain(
      ctx,
      path,
      element,
      'option',
      undefined,
      'Select.Option'
    );
  },

  /** bestax Breadcrumb renders <ul>{children}</ul>; items are plain <li><a>. */
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
    // This handler builds its <a> by hand rather than going through
    // replaceWithPlain, so it has to layer the helper-prop strip itself —
    // otherwise rbx's badge*/tooltip* ride onto the intrinsic <a>.
    const anchorAttrs = stripHelperComponentProps(
      ctx,
      path,
      stripModifierProps(ctx, path, attributesOf(element), 'Breadcrumb.Item'),
      'Breadcrumb.Item'
    );
    const children = element.children ?? [];
    const anchor = plainElement(j, 'a', undefined, anchorAttrs, children);
    path.replace(plainElement(j, 'li', liClass, [], [anchor]));
    ctx.dirty = true;
    return { replaced: true };
  },

  /**
   * rbx's Dropdown owns both the trigger and the menu; bestax's takes a
   * `label` and renders the trigger itself, so the shape differs enough that
   * a mechanical rewrite would be a guess.
   */
  dropdown(ctx, path, _element) {
    addTodo(
      ctx,
      path,
      'component:Dropdown',
      'bestax `Dropdown` takes a `label` and renders its own trigger; move the `<Dropdown.Trigger>` content into `label` and drop the wrapper elements'
    );
    return {};
  },
  'dropdown-container'(ctx, path, _element) {
    addTodo(
      ctx,
      path,
      'component:Dropdown.Container',
      'bestax `Dropdown` is the container itself; drop this wrapper'
    );
    return {};
  },
  'dropdown-content'(ctx, path, _element) {
    addTodo(
      ctx,
      path,
      'component:Dropdown.Content',
      'bestax `Dropdown` renders its own menu content; drop this wrapper and keep the `<Dropdown.Item>`s'
    );
    return {};
  },
  'dropdown-menu'(ctx, path, _element) {
    addTodo(
      ctx,
      path,
      'component:Dropdown.Menu',
      'bestax `Dropdown` renders its own menu; drop this wrapper and keep the `<Dropdown.Item>`s'
    );
    return {};
  },
  'dropdown-trigger'(ctx, path, _element) {
    addTodo(
      ctx,
      path,
      'component:Dropdown.Trigger',
      'bestax `Dropdown` renders its own trigger; move this content into the `label` prop'
    );
    return {};
  },

  /** rbx Level.Item align=left|right → bestax Level.Left / Level.Right. */
  'level-item'(ctx, path, element) {
    const result = alignTarget(
      ctx,
      path,
      element,
      'align',
      { left: 'Level.Left', right: 'Level.Right' },
      'Level.Item'
    );
    restrictAsToTargets(ctx, path, element, result.target, ['Level.Item']);
    return { ...result, handledProps: ['align', 'as'] };
  },

  /**
   * rbx Media.Item align=content|left|right → bestax Media.{Content,Left,Right}.
   *
   * Only `MediaLeftProps` declares `as` ('figure' | 'div'); Content and Right
   * do not. rbx puts `as` on every component, so it has to be resolved here,
   * against the target the align value actually selected, rather than opted
   * into once in the mapping table.
   */
  'media-item'(ctx, path, element) {
    const result = alignTarget(
      ctx,
      path,
      element,
      'align',
      {
        content: 'Media.Content',
        left: 'Media.Left',
        right: 'Media.Right',
      },
      'Media.Content'
    );
    restrictAsToTargets(ctx, path, element, result.target, ['Media.Left']);
    return { ...result, handledProps: ['align', 'as'] };
  },

  /** rbx Modal.Container is the modal itself in bestax. */
  'modal-container'(_ctx, _path, _element) {
    return { target: 'Modal' };
  },

  /**
   * rbx's Navbar.Item carries `dropdown`/`up`/`tab` variants that bestax
   * splits across Navbar.Item and Navbar.Dropdown.
   */
  'navbar-item'(ctx, path, element) {
    // Resolve the target FIRST, then fall through to the cleanup loop —
    // returning early here left `<Navbar.Item dropdown up>` as
    // `<Navbar.Dropdown up>`, with `up` neither removed nor flagged.
    let target: string | undefined;
    const dropdownAttr = findAttr(element, 'dropdown');
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
          'prop:dropdown',
          'dynamic Navbar.Item `dropdown`; pick between `<Navbar.Item>` and `<Navbar.Dropdown>` by hand'
        );
      }
    }
    for (const prop of ['up', 'tab', 'expanded', 'hoverable', 'managed']) {
      const attr = findAttr(element, prop);
      if (!attr) continue;
      removeAttr(element, attr);
      addTodo(
        ctx,
        path,
        `prop:${prop}`,
        `bestax \`Navbar.Item\` has no \`${prop}\` prop; restructure or add a class by hand`
      );
      ctx.dirty = true;
    }
    restrictAsToTargets(ctx, path, element, target ?? 'Navbar.Item', [
      'Navbar.Item',
    ]);
    return {
      target,
      handledProps: [
        'as',
        'dropdown',
        'up',
        'tab',
        'expanded',
        'hoverable',
        'managed',
      ],
    };
  },

  /** rbx's Navbar.Container / Navbar.Item.Container have no bestax analogue. */
  'navbar-container'(ctx, path, _element) {
    addTodo(
      ctx,
      path,
      'component:Navbar.Container',
      'bestax `Navbar` renders its own container; drop this wrapper'
    );
    return {};
  },

  /**
   * rbx's `Navbar.Dropdown` is the MENU (`div.navbar-dropdown`); bestax calls
   * that `Navbar.DropdownMenu` and reserves `Navbar.Dropdown` for the outer
   * `navbar-item has-dropdown` container — which is what rbx's
   * `<Navbar.Item dropdown>` becomes. Targeting `Navbar.Dropdown` here nested
   * two containers and emitted no menu at all. The react-bulma-components
   * source already makes this distinction for the same reason.
   */
  'navbar-dropdown'(ctx, path, element) {
    const boxedAttr = findAttr(element, 'boxed');
    if (boxedAttr) {
      removeAttr(element, boxedAttr);
      addTodo(
        ctx,
        path,
        'prop:boxed',
        'bestax `Navbar.DropdownMenu` has no `boxed` prop; add className="is-boxed"'
      );
      ctx.dirty = true;
    }
    const alignAttr = findAttr(element, 'align');
    if (alignAttr) {
      const literal = literalValueOf(alignAttr);
      removeAttr(element, alignAttr);
      if (literal.kind === 'string' && literal.value === 'right') {
        addAttr(element, makeAttr(ctx.j, 'right'));
      } else if (literal.kind !== 'string') {
        addTodo(
          ctx,
          path,
          'prop:align',
          'dynamic `Navbar.Dropdown` align; set the bestax `right` boolean by hand'
        );
      }
      ctx.dirty = true;
    }
    return {
      target: 'Navbar.DropdownMenu',
      handledProps: ['boxed', 'align'],
    };
  },

  /** rbx Navbar.Segment align=start|end → bestax Navbar.Start / Navbar.End. */
  'navbar-segment'(ctx, path, element) {
    return alignTarget(
      ctx,
      path,
      element,
      'align',
      { start: 'Navbar.Start', end: 'Navbar.End' },
      'Navbar.Start'
    );
  },

  /** rbx Pagination.Step align=next|previous → bestax Pagination.{Next,Previous}. */
  'pagination-step'(ctx, path, element) {
    return alignTarget(
      ctx,
      path,
      element,
      'align',
      { next: 'Pagination.Next', previous: 'Pagination.Previous' },
      'Pagination.Next'
    );
  },

  /**
   * rbx's Panel.Tab is one tab inside a Panel.Tab.Group; bestax's Panel.Tabs
   * is the group and its children are plain anchors.
   */
  'panel-tab'(ctx, path, element) {
    const activeAttr = findAttr(element, 'active');
    let className: string | undefined;
    if (activeAttr) {
      const resolved = resolveBooleanish(activeAttr);
      if (resolved === 'truthy') className = 'is-active';
      else if (resolved === 'expression') {
        addTodo(
          ctx,
          path,
          'prop:active',
          "dynamic Panel.Tab active; set className={active ? 'is-active' : undefined} by hand"
        );
      }
      removeAttr(element, activeAttr);
    }
    return replaceWithPlain(ctx, path, element, 'a', className, 'Panel.Tab');
  },

  /**
   * rbx's `Tab.Group` renders `div.tabs > ul > li`; bestax's `Tabs` renders
   * only the `div.tabs` and leaves the `<ul>` to `Tabs.List`. Renaming
   * straight across put the `<li>` items directly inside the div, which is
   * not valid Bulma tabs markup. Wrap the children in a `Tabs.List`.
   */
  'tab-group'(ctx, _path, element) {
    const children = element.children ?? [];
    const solid = children.filter(
      (c: any) => !(c.type === 'JSXText' && c.value.trim() === '')
    );
    // Already wrapped by hand, or nothing to wrap.
    const alreadyList =
      solid.length === 1 &&
      solid[0].type === 'JSXElement' &&
      /(^|\.)List$/.test(
        (jsxNameParts(solid[0].openingElement?.name) ?? []).join('.')
      );
    if (solid.length === 0 || alreadyList) return { target: 'Tabs' };

    const local = ctx.reserve('Tabs');
    const listName = `${local}.List`;
    element.children = [
      ctx.j.jsxElement(
        ctx.j.jsxOpeningElement(buildJsxName(ctx.j, listName), [], false),
        ctx.j.jsxClosingElement(buildJsxName(ctx.j, listName)),
        children
      ),
    ];
    ctx.dirty = true;
    return { target: 'Tabs' };
  },

  /** Marks the element for the column breakpoint pass in responsive.ts. */
  column() {
    return {};
  },
  'column-group'() {
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
