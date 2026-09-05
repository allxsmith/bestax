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
import {
  addAttr,
  addTodo,
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
  responsiveBreakpoints: Record<string, string | null>
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
  element: any,
  parsed: ParsedIconClasses
): void {
  const { j } = ctx;
  addAttr(element, makeAttr(j, 'name', parsed.name));
  if (parsed.library) addAttr(element, makeAttr(j, 'library', parsed.library));
  if (parsed.variant) addAttr(element, makeAttr(j, 'variant', parsed.variant));
  if (parsed.features.length === 1) {
    addAttr(element, makeAttr(j, 'features', parsed.features[0]));
  } else if (parsed.features.length > 1) {
    addAttr(
      element,
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
    const kept = new Set(strip(ctx, path, attributesOf(element), where));
    // Spread attributes pass through untouched, in place: they are the
    // caller's own props, and a plain element takes them as readily as the
    // component did. `attributesOf` filters them out, so dropping them here
    // lost `{...rest}` with no TODO.
    const rest = (element.openingElement.attributes ?? []).filter(
      (a: any) => a.type === 'JSXSpreadAttribute' || kept.has(a)
    );
    path.replace(
      plainElement(ctx.j, tag, merged, rest, element.children ?? [])
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

    for (const attr of [...(element.openingElement.attributes ?? [])]) {
      if (attr.type === 'JSXSpreadAttribute') {
        // A spread has no name to collide on; it moves across as written.
        removeAttr(element, attr);
        addAttr(child, attr);
        continue;
      }
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
