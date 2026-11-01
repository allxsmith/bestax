/**
 * Building blocks shared by every source's structural handlers: picking a
 * target from an align-style prop, stripping Bulma modifier props off an
 * element on its way to becoming plain HTML, merging a consumed `className`,
 * and reading an icon-font class string.
 *
 * Source-agnostic. `makeStripModifierProps` is a factory precisely because
 * the modifier vocabulary is the one thing here that differs per source.
 */

import type { ASTPath } from 'jscodeshift';
import type { PropAction } from '../../types.js';
import { addAttrOnce } from './props.js';
import {
  LINK_ATTRS,
  elementTakesLinkAttr,
  nestOrClick,
  tagRejectsHref,
} from './polymorphic.js';
import {
  addAttr,
  addTodo,
  attrSource,
  attributesOf,
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

export type SpecialHandler = (
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any
) => SpecialResult;

/** Pick a target based on a literal align-style prop, removing the prop. */
export function alignTarget(
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
 * Build the modifier-prop filter for one source: it needs that source's own
 * universal-prop and breakpoint tables to know what counts as a modifier.
 *
 * The returned function filters Bulma modifier props out of an attribute list
 * bound for a plain HTML element (they only exist on bestax components),
 * leaving a TODO when any were dropped.
 */
export function makeStripModifierProps(
  universalProps: Record<string, PropAction>,
  responsiveBreakpoints: Record<string, string | null>,
  refProp?: string
) {
  return function stripModifierProps(
    ctx: TransformContext,
    path: ASTPath<any>,
    attrs: any[],
    where: string
  ): any[] {
    const kept: any[] = [];
    const dropped: string[] = [];
    for (const attr of attrs) {
      const name = attr?.name?.name;
      // Both sources keep their ref escape hatch (`innerRef`, `domRef`) in
      // the universal table so an unmapped one is flagged rather than passed
      // through in silence. Neither is a Bulma modifier, and the intrinsic
      // tag this rewrite produces takes a real `ref` — so it is renamed onto
      // the tag here. Dropping it would delete a working ref and tell the
      // user to "restyle with classes", which is advice for a modifier.
      // The same collision `applyPropAction` guards: with a `ref` already on
      // the element the rename would emit two, which does not compile.
      if (refProp && name === refProp) {
        if (attrs.some(other => other?.name?.name === 'ref')) {
          addTodo(
            ctx,
            path,
            `prop:${refProp}`,
            `${where}: \`${refProp}\` maps to \`ref\`, but \`ref\` is already set on this element, so \`${refProp}\` was dropped — reconcile by hand`
          );
          continue;
        }
        attr.name = ctx.j.jsxIdentifier('ref');
        ctx.dirty = true;
        kept.push(attr);
        continue;
      }
      if (name && (universalProps[name] || name in responsiveBreakpoints)) {
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
  };
}

/**
 * Consume the element's `className` so a plain-element rewrite can merge it
 * with its hard-coded Bulma class instead of dropping it. A dynamic value
 * can't be merged safely — keep the base class and leave a TODO.
 */
export function mergeClassName(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  base: string | undefined,
  where: string
): string | undefined {
  const attr = findAttr(element, 'className');
  if (!attr) return base;
  const literal = literalValueOf(attr);
  removeAttr(element, attr);
  if (literal.kind === 'string') {
    return base ? `${base} ${literal.value}` : literal.value;
  }
  addTodo(
    ctx,
    path,
    'prop:className',
    base
      ? `dynamic ${where} className; merge it with the \`${base}\` class by hand`
      : `dynamic ${where} className; re-apply it to the emitted element by hand`
  );
  return base;
}

/** What an icon-font class string says about a bestax `Icon`. */
export interface ParsedIconClasses {
  name: string;
  library?: string;
  variant?: string;
  /** Recognised modifier classes (`fa-spin`, `fa-2x`, `mdi-48px`) — bestax's `features`. */
  features: string[];
  /**
   * Tokens that are neither the icon, its style, nor a modifier the library
   * documents — an app's own class. bestax's Icon has nowhere to put them
   * on the glyph, so a caller that wants exact markup keeps the child.
   */
  leftovers: string[];
}

/**
 * Parse an icon-font class string (`fas fa-home fa-spin`, `mdi mdi-account`)
 * into bestax Icon props. Returns null when no icon name can be read.
 */
export function parseIconClasses(className: string): ParsedIconClasses | null {
  const tokens = className.trim().split(/\s+/);
  const faVariant: Record<string, string> = {
    fas: 'solid',
    far: 'regular',
    fab: 'brands',
    fal: 'light',
    fad: 'duotone',
    fat: 'thin',
    // Font Awesome 6 spells the style out, and has been the default since
    // 2022 — matching only the v5 short forms meant the common case fell
    // through to the "migrate this icon by hand" TODO.
    'fa-solid': 'solid',
    'fa-regular': 'regular',
    'fa-brands': 'brands',
    'fa-light': 'light',
    'fa-duotone': 'duotone',
    'fa-thin': 'thin',
  };
  const faStyle = tokens.find(t => faVariant[t]);
  // Every `fa-*` that is a MODIFIER rather than an icon name — including
  // v6's spelled-out style and family words, which are `fa-` prefixed and
  // would otherwise be read as the icon (`fa-solid fa-home` → name="solid").
  // The old list
  // covered only sizing and spin, so a class string that puts a modifier
  // first — `fas fa-rotate-90 fa-home`, which Font Awesome's own docs show —
  // yielded name="rotate-90". Ordering is not guaranteed, so the filter has
  // to be exhaustive rather than positional.
  const FA_MODIFIER =
    /^fa-(?:solid|regular|brands|light|duotone|thin|sharp|classic|2xs|xs|sm|lg|xl|2xl|\d{1,2}x|fw|ul|li|border|inverse|stack|stack-1x|stack-2x|pull-(?:left|right)|spin|spin-pulse|spin-reverse|pulse|beat|fade|beat-fade|bounce|flash|shake|swap-opacity|rotate-(?:90|180|270|by)|flip-(?:horizontal|vertical|both))$/;
  const faName = tokens.find(t => /^fa-/.test(t) && !FA_MODIFIER.test(t));
  if (faStyle && faName) {
    // The style word itself (`fa-solid`) is not a feature; `fa` is FA4's
    // style token and, when it accompanies a v5+ style, harmless.
    const features = tokens.filter(t => FA_MODIFIER.test(t) && !faVariant[t]);
    const leftovers = tokens.filter(
      t => t !== faStyle && t !== faName && t !== 'fa' && !features.includes(t)
    );
    return {
      name: faName.replace(/^fa-/, ''),
      library: 'fa',
      variant: faVariant[faStyle],
      features,
      leftovers,
    };
  }
  if (tokens.includes('mdi')) {
    // MDI's documented modifiers: sizes, spin, rotation, flips, light/dark,
    // inactive. Any other `mdi-*` token is the icon — whichever comes first,
    // since `mdi mdi-24px mdi-account` is as legal as the other order.
    const MDI_MODIFIER =
      /^mdi-(?:(?:18|24|36|48)px|spin|rotate-(?:45|90|135|180|225|270|315)|flip-[hv]|light|dark|inactive)$/;
    const mdiName = tokens.find(
      t => /^mdi-/.test(t) && t !== 'mdi' && !MDI_MODIFIER.test(t)
    );
    if (mdiName) {
      const features = tokens.filter(t => MDI_MODIFIER.test(t));
      const leftovers = tokens.filter(
        t => t !== 'mdi' && t !== mdiName && !features.includes(t)
      );
      return {
        name: mdiName.replace(/^mdi-/, ''),
        library: 'mdi',
        features,
        leftovers,
      };
    }
  }
  return null;
}

/**
 * Write a parsed icon onto a bestax `Icon`-shaped element: `name`, then
 * `library`/`variant` when known, then `features` — one string, or an array
 * literal when there are several — and make the element self-closing.
 */
export function applyIconProps(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  parsed: ParsedIconClasses
): void {
  const { j } = ctx;
  // The source forwarded HTML props, so the element may already carry a
  // `name` (or any of these): the existing one is kept and the clash named,
  // rather than writing a duplicate attribute.
  const once = (attr: any) =>
    addAttrOnce(ctx, path, element, 'className', attr);
  once(makeAttr(j, 'name', parsed.name));
  if (parsed.library) once(makeAttr(j, 'library', parsed.library));
  if (parsed.variant) once(makeAttr(j, 'variant', parsed.variant));
  if (parsed.features.length === 1) {
    once(makeAttr(j, 'features', parsed.features[0]));
  } else if (parsed.features.length > 1) {
    once(
      j.jsxAttribute(
        j.jsxIdentifier('features'),
        j.jsxExpressionContainer(
          j.arrayExpression(parsed.features.map(f => j.stringLiteral(f)))
        )
      )
    );
  }
  element.children = [];
  element.openingElement.selfClosing = true;
  element.closingElement = null;
  ctx.dirty = true;
}

/**
 * Turn a literal modifier prop into an `is-*` class fragment for an element
 * on its way to becoming plain HTML. Returns the class (or undefined) and
 * always removes the attribute.
 */
export function modifierClass(
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
 * A source that puts `as` (or its own name for it) on every component can
 * land, through a handler that picks its target from a prop value, on a
 * bestax component that has no `as` — Media.Item resolves to
 * Left/Content/Right where only Left declares one. Opting into `as` in the
 * mapping table cannot express that, so the target has to be checked after
 * it is picked.
 */
export function restrictAsToTargets(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  target: string | undefined,
  allowed: string[],
  prop = 'as'
): void {
  const asAttr = findAttr(element, prop);
  if (!asAttr || (target && allowed.includes(target))) return;
  removeAttr(element, asAttr);
  addTodo(
    ctx,
    path,
    `prop:${prop}`,
    `bestax's \`${target}\` has no \`as\` prop (of the targets this can resolve to, only ${allowed
      .map(a => `\`${a}\``)
      .join(' / ')} does); render the tag directly or restructure`
  );
  ctx.dirty = true;
}

/** The sizes bestax's Title and SubTitle turn into a heading level. */
const TITLE_SIZES = ['1', '2', '3', '4', '5', '6'];

/** Bulma's seven sizes, all of which `textSize` takes. */
const TEXT_SIZES = [...TITLE_SIZES, '7'];

/** What a source's title handler tells `keepTitleLevel` about it. */
export interface TitleSource {
  /** The source component, for the TODO (`Heading`, `Subtitle`). */
  where: string;
  /** The bestax component it becomes: `Title` or `SubTitle`. */
  target: string;
  /** The source's size prop: `isSize` in bloomer, `size` elsewhere. */
  size: string;
  /** The source's element prop: `tag`, `renderAs` or `as`. */
  tag: string;
  /** The element the source rendered when no tag was given. */
  level: string;
}

/**
 * Carry a title's size across without changing its heading level.
 *
 * Every source library rendered a title at the element its tag prop named,
 * or at its own default, whatever the size. bestax's `Title` and `SubTitle`
 * render the heading their `size` names unless `as="p"`, so `<Title size={4}>`
 * is an <h4>. A size therefore stays `size` only where that renders the
 * element the source did: a <p>, or the <hN> the size names, at a size bestax
 * takes. Anywhere else it moves to the `textSize` helper, which sets the same
 * font size and leaves the level to `as`. Any other size gets a TODO.
 *
 * bestax defaults to an <h1>, so a source whose default is another level gets
 * it written out as `as`, unless the size already renders it or a spread may
 * name the element.
 *
 * Returns the props it consumed, for the handler's `handledProps`.
 */
export function keepTitleLevel(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  source: TitleSource
): string[] {
  const { j } = ctx;
  const tagAttr = findAttr(element, source.tag) ?? findAttr(element, 'as');
  const spread = (element.openingElement.attributes ?? []).some(
    (a: any) => a.type === 'JSXSpreadAttribute'
  );
  // The element the source rendered, where the codemod can see it. A spread
  // names the element only where the source spells its tag prop `as`, the
  // name bestax reads: a `tag` or `renderAs` inside one never reaches `as`.
  let rendered: string | undefined;
  if (tagAttr) {
    const literal = literalValueOf(tagAttr);
    if (literal.kind === 'string') rendered = literal.value;
  } else if (!spread || source.tag !== 'as') {
    rendered = source.level;
  }

  const handled: string[] = [];
  let sizeRendersLevel = false;
  const sizeAttr = findAttr(element, source.size);
  if (sizeAttr) {
    const literal = literalValueOf(sizeAttr);
    const size =
      literal.kind === 'string' || literal.kind === 'number'
        ? String(literal.value)
        : undefined;
    const movable = size !== undefined && TEXT_SIZES.includes(size);
    const textSize = findAttr(element, 'textSize');
    // A size the codemod cannot read is still safe beside a <p>; a literal
    // has to be one bestax's `size` takes, or its class goes.
    const takes =
      size === undefined
        ? literal.kind === 'expression'
        : TITLE_SIZES.includes(size);
    if (takes && (rendered === 'p' || rendered === `h${size}`)) {
      // `size` renders this element too, so the prop map carries it as is.
      sizeRendersLevel = true;
    } else if (movable && !textSize) {
      sizeAttr.name = j.jsxIdentifier('textSize');
      sizeAttr.value = j.stringLiteral(size);
      handled.push(source.size);
      ctx.dirty = true;
    } else {
      const level = `bestax's \`${source.target}\` renders the heading its \`size\` names unless \`as="p"\``;
      addTodo(
        ctx,
        path,
        `prop:${source.size}`,
        !takes
          ? `bestax's \`${source.target}\` takes a \`size\` from 1 to 6 and renders no size class for this one; drop it, or set a \`textSize\` from '1' to '7' instead`
          : textSize
            ? `\`${source.where}\` sets a size and \`textSize\` both, and ${level}; to keep the level, drop \`size\` and let \`textSize\` set the font size`
            : `\`${source.where}\` kept its element at every size, but ${level}; to keep the level, carry the size with \`textSize\`, which takes '1' to '7' as strings`
      );
      // Written as bestax's prop either way, so the prop map adds nothing.
      sizeAttr.name = j.jsxIdentifier('size');
      handled.push(source.size);
    }
  }

  if (!tagAttr && rendered && source.level !== 'h1' && !sizeRendersLevel) {
    addAttr(element, makeAttr(j, 'as', source.level));
    ctx.dirty = true;
  }
  return handled;
}

/**
 * Strip the link attributes a plain element cannot carry.
 *
 * Exported because not every source reaches plain markup through
 * `replaceWithPlain`: react-bulma-components builds six of its replacements
 * by hand, and they bypassed this entirely -- `<Form.Help href="/x">` became
 * `<p className="help" href="/x">`, which does not compile.
 */
export function dropLinkAttrsForPlainTag(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  tag: string,
  where: string
): void {
  // An `href` only belongs on the anchor. The source component put it on
  // whatever tag it rendered, where the browser ignored it; a plain element
  // is typed as itself, so carrying it here is a type error for an attribute
  // that never navigated anywhere.
  // A plain rewrite can legitimately produce an `<area>` or a `<link>`, and
  // React types an `href` onto both. The anchor-only rule that applies to
  // bestax components does not apply here -- there is no component in the way
  // to disagree about what it forwards.
  //
  // The message deliberately does not add "it navigated nowhere in the source
  // either", the way the polymorphic path does. That holds only where `tag`
  // came from the source -- bloomer's call sites all pass one -- while rbx and
  // react-bulma-components hard-code the plain tag and ignore the source's
  // element prop, so there the element really did change.
  const href = tagRejectsHref(tag) ? findAttr(element, 'href') : undefined;
  if (href) {
    const was = attrSource(ctx.j, href);
    removeAttr(element, href);
    addTodo(
      ctx,
      path,
      'prop:href',
      `${where} became a plain <${tag}>, which takes no \`href\` — make it an <a>, or ${nestOrClick(tag)}${was ? ` — it read \`${was}\`` : ''}`
    );
    ctx.dirty = true;
  }
  // Its siblings are judged against the same tag, each on its own, so a
  // `referrerPolicy` on an `<img>` survives.
  for (const name of LINK_ATTRS) {
    if (elementTakesLinkAttr(name, tag)) continue;
    const attr = findAttr(element, name);
    if (!attr) continue;
    const was = attrSource(ctx.j, attr);
    removeAttr(element, attr);
    addTodo(
      ctx,
      path,
      `prop:${name}`,
      `${where} became a plain <${tag}>, which takes no \`${name}\`${was ? ` — it read \`${was}\`` : ''}; ${nestOrClick(tag, true)}, or change the element`
    );
    ctx.dirty = true;
  }
}

/**
 * Flag a `Heading` label that became a plain element carrying `heading`.
 *
 * Each library source has a `Heading` that rendered Bulma 0.9's `.heading`
 * label, and bestax has no component for it, so it stays plain markup with
 * the class. Bulma v1 has no rule for `.heading`, so the class styles nothing
 * there. One rule and one message keep the sources agreeing about that
 * (#1370), and the props it names are the ones bestax's Level page spells the
 * label with.
 */
export function flagDroppedHeading(
  ctx: TransformContext,
  path: ASTPath<any>,
  tag: string
): void {
  addTodo(
    ctx,
    path,
    'component:Heading',
    `Bulma v1 dropped the \`.heading\` styles, so the \`heading\` class on this plain <${tag}> styles nothing; restyle it with bestax helpers (e.g. \`<Paragraph textSize="7" textTransform="uppercase" textWeight="semibold" mb="1">\`) or a \`.heading\` rule of your own`
  );
}

/** Attribute filter a source applies before an element becomes plain HTML. */
export type AttrStrip = (
  ctx: TransformContext,
  path: ASTPath<any>,
  attrs: any[],
  where: string
) => any[];

/**
 * The two structural rewrites every source needs, bound to that source's own
 * attribute strip (its modifier vocabulary is the one thing that differs):
 * replacing an element with plain HTML, and folding a wrapper onto the single
 * child it exists to wrap.
 */
export function makeStructuralHelpers(strip: AttrStrip) {
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
    dropLinkAttrsForPlainTag(ctx, path, element, tag, where);
    const kept = new Set(strip(ctx, path, attributesOf(element), where));
    // Spread attributes pass through untouched, in their original places:
    // they are the caller's own props, and a plain element takes them as
    // readily as the component did, with the same JSX precedence. The Bulma
    // class the element exists for is written right AFTER the last spread,
    // so a `className` inside a spread cannot override it — the source
    // merged such a className with its own; a plain element cannot, so the
    // spread is named.
    const all = element.openingElement.attributes ?? [];
    const spreads = all.filter((a: any) => a.type === 'JSXSpreadAttribute');
    const ordered = all.filter(
      (a: any) => a.type === 'JSXSpreadAttribute' || kept.has(a)
    );
    if (spreads.length > 0 && merged) {
      addTodo(
        ctx,
        path,
        'plain-element',
        `${where} became a plain <${tag}> with \`className="${merged}"\`; a \`className\` inside its spread prop(s) would have been merged with that class by the source, and is overridden here — merge it by hand`
      );
    }
    path.replace(
      plainElement(ctx.j, tag, merged, ordered, element.children ?? [])
    );
    ctx.dirty = true;
    return { replaced: true };
  }

  /**
   * A wrapper that owns the modifiers, where bestax's component renders that
   * wrapper itself: move the wrapper's (already-converted) attributes onto
   * its single child and replace the wrapper with it — otherwise both would
   * rename to the same bestax component and nest, which is invalid.
   *
   * Returns null when the element isn't the single-JSX-child shape, or the
   * child is not one of the components this wrapper exists to wrap (a
   * ratio-box `<iframe>`, a native `<select>`), so the caller can keep the
   * wrapper.
   */
  function collapseOntoChild(
    ctx: TransformContext,
    path: ASTPath<any>,
    element: any,
    where: string,
    expected: string | string[]
  ): SpecialResult | null {
    const children = (element.children ?? []).filter(
      (c: any) => !(c.type === 'JSXText' && c.value.trim() === '')
    );
    if (children.length !== 1 || children[0].type !== 'JSXElement') {
      return null;
    }
    const child = children[0];
    const childPath = ctx.resolve?.(child.openingElement?.name);
    const accepted = Array.isArray(expected) ? expected : [expected];
    if (!childPath || !accepted.includes(childPath.join('.'))) return null;

    // Spreads have no name to collide on; they move across as written — as
    // one block, in source order, placed FIRST so the child's own explicit
    // props still win over them, the same rule the named branch keeps.
    const spreads = (element.openingElement.attributes ?? []).filter(
      (a: any) => a.type === 'JSXSpreadAttribute'
    );
    for (const spread of spreads) removeAttr(element, spread);
    if (spreads.length > 0) {
      child.openingElement.attributes = [
        ...spreads,
        ...(child.openingElement.attributes ?? []),
      ];
    }
    for (const attr of [...(element.openingElement.attributes ?? [])]) {
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

  return { replaceWithPlain, collapseOntoChild };
}
