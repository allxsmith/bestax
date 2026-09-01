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
  addTodo,
  findAttr,
  literalValueOf,
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

/** Parse an icon-font <i className="..."> into bestax Icon name/library/variant. */
export function parseIconClasses(
  className: string
): { name: string; library?: string; variant?: string } | null {
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
