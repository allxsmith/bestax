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
import { RESPONSIVE_BREAKPOINTS, UNIVERSAL_PROPS } from './mapping.js';
import {
  addAttr,
  addTodo,
  attributesOf,
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
  const rest = stripModifierProps(ctx, path, attributesOf(element), where);
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
  where: string
): SpecialResult | null {
  const children = (element.children ?? []).filter(
    (c: any) => !(c.type === 'JSXText' && c.value.trim() === '')
  );
  if (children.length !== 1 || children[0].type !== 'JSXElement') return null;
  const child = children[0];

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
    const collapsed = collapseOntoChild(ctx, path, element, 'Image.Container');
    if (collapsed) return collapsed;
    // No single child to fold into — keep the container as the Image itself.
    return { target: 'Image', handledProps: ['size'] };
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
      const kindAttr = findAttr(element, 'kind');
      if (kindAttr) removeAttr(element, kindAttr);
      const existing = findAttr(element, 'grouped');
      if (existing) removeAttr(element, existing);
      addAttr(element, makeAttr(ctx.j, 'grouped', 'multiline'));
      ctx.dirty = true;
      return { handledProps: ['multiline', 'kind'] };
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
      removeAttr(element, disabledAttr);
      className = `${className} is-disabled`;
      ctx.dirty = true;
    }
    return replaceWithPlain(ctx, path, element, 'label', className, 'Label');
  },

  /**
   * rbx wraps <Select> in <Select.Container>, which owns the modifiers; the
   * bestax Select renders its own wrapper, so the container collapses onto it.
   */
  'select-container'(ctx, path, element) {
    const fullwidthAttr = findAttr(element, 'fullwidth');
    if (fullwidthAttr) {
      const resolved = resolveBooleanish(fullwidthAttr);
      removeAttr(element, fullwidthAttr);
      if (resolved === 'truthy') {
        addAttr(element, makeAttr(ctx.j, 'isFullwidth'));
      }
      ctx.dirty = true;
    }
    const roundedAttr = findAttr(element, 'rounded');
    if (roundedAttr) {
      const resolved = resolveBooleanish(roundedAttr);
      removeAttr(element, roundedAttr);
      if (resolved === 'truthy') {
        addAttr(element, makeAttr(ctx.j, 'isRounded'));
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
    const collapsed = collapseOntoChild(ctx, path, element, 'Select.Container');
    if (collapsed) return collapsed;
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
    const anchorAttrs = stripModifierProps(
      ctx,
      path,
      attributesOf(element),
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
    return alignTarget(
      ctx,
      path,
      element,
      'align',
      { left: 'Level.Left', right: 'Level.Right' },
      'Level.Item'
    );
  },

  /** rbx Media.Item align=content|left|right → bestax Media.{Content,Left,Right}. */
  'media-item'(ctx, path, element) {
    return alignTarget(
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
    const dropdownAttr = findAttr(element, 'dropdown');
    if (dropdownAttr) {
      const resolved = resolveBooleanish(dropdownAttr);
      removeAttr(element, dropdownAttr);
      ctx.dirty = true;
      if (resolved === 'truthy') {
        return { target: 'Navbar.Dropdown', handledProps: ['dropdown'] };
      }
      if (resolved === 'expression') {
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
    return {
      handledProps: [
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

  /** rbx Navbar.Dropdown boxed → bestax has no boxed variant. */
  'navbar-dropdown'(ctx, path, element) {
    const boxedAttr = findAttr(element, 'boxed');
    if (boxedAttr) {
      removeAttr(element, boxedAttr);
      addTodo(
        ctx,
        path,
        'prop:boxed',
        'bestax `Navbar.Dropdown` has no `boxed` prop; add className="is-boxed"'
      );
      ctx.dirty = true;
    }
    return { target: 'Navbar.Dropdown', handledProps: ['boxed'] };
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
