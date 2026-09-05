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
  applyIconProps,
  makeStripModifierProps,
  makeStructuralHelpers,
  mergeClassName,
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
  RESPONSIVE_BREAKPOINTS
);

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
 * rbx's plain-element rewrites strip both the universal helper props and the
 * badge/tooltip/responsive props (which would otherwise ride onto the HTML
 * tag as unknown DOM attributes — see stripHelperComponentProps).
 */
const { replaceWithPlain, collapseOntoChild } = makeStructuralHelpers(
  (ctx, path, attrs, where) =>
    stripHelperComponentProps(
      ctx,
      path,
      stripModifierProps(ctx, path, attrs, where),
      where
    )
);

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
        // An app's own class on the <i> has no home on bestax's glyph, so
        // the child is kept (and flagged below) rather than losing it.
        if (parsed && parsed.leftovers.length === 0) {
          applyIconProps(ctx, element, parsed);
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
   * rbx's Divider rendered its children as a centred label (`div.is-divider`
   * with the text in `data-content`). bestax's Divider is a bare `<hr>` and
   * takes no children -- React rejects children on a void element at runtime,
   * so passing them through produced a crash with no TODO naming the lost
   * label. The children are left in place so nothing is discarded silently;
   * the TODO tells the user where the label has to go instead.
   */
  divider(ctx, path, element) {
    const children = (element.children ?? []).filter(
      (c: any) => !(c.type === 'JSXText' && c.value.trim() === '')
    );
    if (children.length > 0) {
      addTodo(
        ctx,
        path,
        'component:Divider',
        'rbx `Divider` rendered its children as a centred label; bestax `Divider` is a bare `<hr>` and takes no children — move the label into surrounding markup, or drop it'
      );
    }
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
    // Decide the plain-markup fallback FIRST, while the props are still rbx's
    // own — converting them to bestax booleans and then emitting a <div>
    // stranded things like `isRounded` on an intrinsic element.
    const allKids = (element.children ?? []).filter(
      (c: any) => !(c.type === 'JSXText' && c.value.trim() === '')
    );
    if (allKids.length !== 1) {
      // bestax's `Select` renders exactly one `<select>`, so a container
      // holding several has no direct equivalent. rbx's own markup — a
      // `div.select` wrapper — is valid whatever the children are.
      let cls = 'select';
      for (const prop of ['size', 'color', 'state'] as const) {
        cls = modifierClass(ctx, path, element, prop, cls, 'Select.Container');
      }
      for (const [prop, klass] of [
        ['fullwidth', 'is-fullwidth'],
        ['rounded', 'is-rounded'],
      ] as const) {
        const attr = findAttr(element, prop);
        if (!attr) continue;
        const resolved = resolveBooleanish(attr);
        if (resolved === 'truthy') {
          cls = `${cls} ${klass}`;
        } else if (resolved === 'expression') {
          // A plain element cannot carry the condition, so say so rather than
          // dropping the styling along with its expression.
          addTodo(
            ctx,
            path,
            `prop:${prop}`,
            `dynamic \`${prop}\` on a Select.Container that became plain markup; apply \`${klass}\` conditionally via className by hand`
          );
        }
        removeAttr(element, attr);
        ctx.dirty = true;
      }
      addTodo(
        ctx,
        path,
        'component:Select.Container',
        "bestax's `Select` renders a single `<select>`, so a container holding more than one has no direct equivalent; emitted the plain Bulma wrapper instead"
      );
      return replaceWithPlain(
        ctx,
        path,
        element,
        'div',
        cls,
        'Select.Container'
      );
    }

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
      return {
        target: 'Select',
        handledProps: ['fullwidth', 'rounded', 'state'],
      };
    }

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

  /**
   * rbx's Modal portals into `document.body`, closes on Escape and clips
   * document scroll, all by default. bestax matches two of those since #633 —
   * `closeOnEscape` and `lockScroll` both default to `true` — but still
   * renders inline unless `portal` is set. That last difference does not fail
   * loudly, so every conversion is still flagged, now about the portal alone.
   */
  modal(ctx, path, _element) {
    addTodo(
      ctx,
      path,
      'component:Modal',
      'bestax `Modal` closes on Escape and locks body scroll by default, matching rbx, but it renders inline: set `portal` if you relied on rbx portalling into document.body'
    );
    return {};
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
    // `up` and `hoverable` exist on bestax's NavbarDropdownProps, so when the
    // dropdown target was selected they carry straight over; discarding them
    // lost working modifiers. On a plain Navbar.Item they have no home.
    const unsupported =
      target === 'Navbar.Dropdown'
        ? ['tab', 'expanded', 'managed']
        : ['up', 'tab', 'expanded', 'hoverable', 'managed'];
    for (const prop of unsupported) {
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
    // bestax's `Navbar.Dropdown` forwards a ref, but it is the one such target
    // the `innerRef: { rename: 'ref' }` entries in mapping.ts cannot reach:
    // that table is keyed on the rbx name (`Navbar.Item`), and only this
    // handler knows which of the two targets was picked. A plain
    // `Navbar.Item` is still a function component, so the rename is
    // conditional — there, `innerRef` is left alone.
    const renamedInnerRef: string[] = [];
    if (target === 'Navbar.Dropdown') {
      const innerRefAttr = findAttr(element, 'innerRef');
      if (innerRefAttr) {
        innerRefAttr.name = ctx.j.jsxIdentifier('ref');
        renamedInnerRef.push('innerRef');
        ctx.dirty = true;
      }
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
        ...renamedInnerRef,
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
