/**
 * Flattens bloomer's three-shape helper props into bestax-bulma's flat
 * per-viewport props. Every bloomer component takes these (they come from the
 * `withHelpersModifiers` HOC), and none of them has a bestax prop of the same
 * name — so the attribute is always removed, whatever could be converted, and
 * each entry that could not be carried over gets its own TODO. A leftover
 * would not be a harmless no-op: bestax has no `isDisplay`, so it is an
 * excess-property type error on every migrated component.
 *
 *   1. `isDisplay` — a display, optionally suffixed with a viewport; an array
 *      of those; or an object keyed by display whose values are viewports:
 *        <Box isDisplay="flex-tablet" />            → displayTablet="flex"
 *        <Box isDisplay={['flex', 'block-mobile']} /> → display="flex" displayMobile="block"
 *        <Box isDisplay={{ flex: ['default', 'desktop'] }} />
 *                                                   → display="flex" displayDesktop="flex"
 *   2. `isHidden` — a boolean, a viewport, or an array of viewports:
 *        <Box isHidden />                → visibility="hidden"
 *        <Box isHidden="touch" />        → visibilityTouch="hidden"
 *        <Box isHidden={['mobile', 'desktop-only']} />
 *                                        → visibilityMobile="hidden" visibilityDesktopOnly="hidden"
 *   3. Column `isSize` / `isOffset` — a number, a fraction, a width word, or
 *      an object keyed by breakpoint:
 *        <Column isSize="1/2" isOffset={2} />         → size="half" offset={2}
 *        <Column isSize={{ default: 4, mobile: 8 }} /> → size={4} sizeMobile={8}
 *        <Column isSize="narrow" />                   → isNarrow
 *
 * bestax declares every one of Bulma's nine viewports for `display*` and
 * `visibility*` (including `-only` and `touch`), so those convert one-to-one.
 * Column sizes exist for the five breakpoints Bulma sizes columns at, plus
 * `isNarrowTouch` — `sizeTouch`/`offsetTouch` do not exist and become TODOs.
 */

import type { ASTPath } from 'jscodeshift';
import { COLUMN_SIZE_MAP } from './mapping.js';
import { VIEWPORT_SUFFIX } from '../_shared/viewports.js';
import {
  addTodo,
  arrayExpressionOf,
  attrValue,
  findAttr,
  literalOf,
  literalValueOf,
  makeAttr,
  objectExpressionOf,
  propKey,
  removeAttr,
  type TransformContext,
} from '../_shared/jsx-utils.js';
import { addAttrOnce, addConverted } from '../_shared/props.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type ResponsiveKind = 'generic' | 'column';

/** Which specials opt their element into the extra breakpoint shapes. */
export const RESPONSIVE_KINDS: Record<string, ResponsiveKind> = {
  column: 'column',
};

/** Longest alternatives first, so `inline-block` is not read as `inline`. */
const DISPLAY_RE =
  /^(inline-block|inline-flex|inline|flex|block)(?:-(mobile|tablet-only|tablet|touch|desktop-only|desktop|widescreen-only|widescreen|fullhd))?$/;

const DISPLAYS = new Set([
  'flex',
  'block',
  'inline',
  'inline-block',
  'inline-flex',
]);

/** The breakpoints bestax's `size*`/`offset*` Column props exist for. */
const COLUMN_VIEWPORTS: Record<string, string> = {
  mobile: 'Mobile',
  tablet: 'Tablet',
  desktop: 'Desktop',
  widescreen: 'Widescreen',
  fullhd: 'Fullhd',
};

/** Non-whitespace children of an array literal, or null for a non-array. */
function arrayItems(node: any): any[] | null {
  if (node?.type !== 'ArrayExpression') return null;
  return (node.elements ?? []).filter((e: any) => e != null);
}

// ---- 1. isDisplay ----------------------------------------------------------

function flattenDisplay(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any
): void {
  const attr = findAttr(element, 'isDisplay');
  if (!attr) return;
  const { j } = ctx;

  const todo = (message: string) =>
    addTodo(ctx, path, 'prop:isDisplay', message);

  /** `display` + optional viewport → `display<Suffix>="…"`. */
  const emit = (display: string, viewport: string | undefined): void => {
    if (viewport === undefined || viewport === 'default') {
      addConverted(ctx, path, element, 'isDisplay', 'display', display);
      return;
    }
    const suffix = VIEWPORT_SUFFIX[viewport];
    if (suffix === undefined) {
      todo(
        `\`isDisplay\` names \`${viewport}\`, which is not a Bulma viewport; set the matching \`display*\` prop by hand`
      );
      return;
    }
    addConverted(ctx, path, element, 'isDisplay', `display${suffix}`, display);
  };

  /** A `'flex-tablet'`-style string. */
  const fromString = (value: string): void => {
    const m = DISPLAY_RE.exec(value);
    if (!m) {
      todo(
        `\`isDisplay="${value}"\` is not a display bloomer's helpers produce; set \`display\` (and a viewport suffix) by hand`
      );
      return;
    }
    emit(m[1], m[2]);
  };

  /** One node inside an array or object form. */
  const fromNode = (node: any, describe: string, display?: string): void => {
    const literal = literalOf(node);
    if (typeof literal === 'string') {
      if (display) emit(display, literal);
      else fromString(literal);
      return;
    }
    todo(
      `\`isDisplay\` ${describe} has a dynamic value; set the matching \`display*\` prop conditionally by hand`
    );
  };

  const value = attr.value;
  const literal = literalValueOf(attr);
  if (literal.kind === 'string') {
    fromString(literal.value);
  } else if (arrayExpressionOf(value)) {
    for (const item of arrayItems(arrayExpressionOf(value)) ?? []) {
      fromNode(item, 'entry');
    }
  } else if (objectExpressionOf(value)) {
    for (const prop of objectExpressionOf(value).properties) {
      const key = propKey(prop);
      if (!key || !DISPLAYS.has(key)) {
        todo(
          `\`isDisplay.${String(key)}\` is not a display bloomer's helpers know; convert it by hand`
        );
        continue;
      }
      const items = arrayItems(prop.value);
      if (items) {
        for (const item of items) fromNode(item, `\`${key}\` entry`, key);
      } else {
        fromNode(prop.value, `\`${key}\``, key);
      }
    }
  } else {
    todo(
      'dropped `isDisplay`: it must be a string, array or object literal to flatten to bestax `display*` props, and bestax has no `isDisplay` — reapply it by hand'
    );
  }

  removeAttr(element, attr);
  ctx.dirty = true;
  void j;
}

// ---- 2. isHidden -----------------------------------------------------------

function flattenHidden(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any
): void {
  const attr = findAttr(element, 'isHidden');
  if (!attr) return;

  const todo = (message: string) =>
    addTodo(ctx, path, 'prop:isHidden', message);

  const emit = (viewport: string): void => {
    const suffix = VIEWPORT_SUFFIX[viewport];
    if (suffix === undefined) {
      todo(
        `\`isHidden="${viewport}"\` is not a Bulma viewport; set the matching \`visibility*="hidden"\` prop by hand`
      );
      return;
    }
    addConverted(
      ctx,
      path,
      element,
      'isHidden',
      `visibility${suffix}`,
      'hidden'
    );
  };

  const literal = literalValueOf(attr);
  if (literal.kind === 'boolean') {
    if (literal.value) {
      addConverted(ctx, path, element, 'isHidden', 'visibility', 'hidden');
    }
    // `isHidden={false}` is a no-op — drop it.
  } else if (literal.kind === 'string') {
    emit(literal.value);
  } else if (arrayExpressionOf(attr.value)) {
    for (const item of arrayItems(arrayExpressionOf(attr.value)) ?? []) {
      const value = literalOf(item);
      if (typeof value === 'string') emit(value);
      else {
        todo(
          '`isHidden` entry has a dynamic value; set the matching `visibility*="hidden"` prop conditionally by hand'
        );
      }
    }
  } else {
    todo(
      '`isHidden` has a dynamic value; set `visibility="hidden"` (or a per-viewport `visibility*`) conditionally by hand'
    );
  }

  removeAttr(element, attr);
  ctx.dirty = true;
}

// ---- 3. Column isSize / isOffset ------------------------------------------

function flattenColumnSizes(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any
): void {
  const { j } = ctx;
  for (const [prop, base] of [
    ['isSize', 'size'],
    ['isOffset', 'offset'],
  ] as const) {
    const attr = findAttr(element, prop);
    if (!attr) continue;

    const todo = (message: string) =>
      addTodo(ctx, path, `prop:${prop}`, message);

    /** One size value, for the unsuffixed prop or a breakpoint's. */
    const convert = (node: any, suffix: string, where: string): void => {
      const literal = literalOf(node);
      if (typeof literal === 'number') {
        // Column sizes take numbers; reuse the node.
        addAttrOnce(
          ctx,
          path,
          element,
          prop,
          j.jsxAttribute(
            j.jsxIdentifier(`${base}${suffix}`),
            attrValue(j, node)
          )
        );
      } else if (typeof literal === 'string') {
        if (literal === 'narrow') {
          if (base === 'size') {
            addAttrOnce(
              ctx,
              path,
              element,
              prop,
              makeAttr(j, `isNarrow${suffix}`)
            );
          } else {
            todo(`\`${where}="narrow"\` is not an offset; drop it`);
          }
        } else if (COLUMN_SIZE_MAP[literal]) {
          addAttrOnce(
            ctx,
            path,
            element,
            prop,
            makeAttr(j, `${base}${suffix}`, COLUMN_SIZE_MAP[literal])
          );
        } else if (/^(?:[1-9]|1[0-2])$/.test(literal)) {
          addAttrOnce(
            ctx,
            path,
            element,
            prop,
            makeAttr(j, `${base}${suffix}`, literal)
          );
        } else {
          todo(
            `\`${where}="${literal}"\` is not a column size bloomer's helpers know (1–12, a fraction like "1/2", "full" or "narrow"); set \`${base}${suffix}\` by hand`
          );
        }
      } else {
        todo(
          `\`${where}\` has a dynamic value; set \`${base}${suffix}\` by hand (bestax takes numbers or the named sizes: "half", "one-third", …)`
        );
      }
    };

    const objectExpr = objectExpressionOf(attr.value);
    if (objectExpr) {
      for (const bpProp of objectExpr.properties) {
        const key = propKey(bpProp);
        if (key === 'default') {
          convert(bpProp.value, '', `${prop}.default`);
        } else if (key !== undefined && COLUMN_VIEWPORTS[key]) {
          convert(bpProp.value, COLUMN_VIEWPORTS[key], `${prop}.${key}`);
        } else if (key === 'touch') {
          // bestax's Column has `isNarrowTouch` but no `sizeTouch`/`offsetTouch`.
          const literal = literalOf(bpProp.value);
          if (base === 'size' && literal === 'narrow') {
            addAttrOnce(ctx, path, element, prop, makeAttr(j, 'isNarrowTouch'));
          } else {
            todo(
              `bestax \`Column\` has no \`${base}Touch\` prop (Bulma keeps the \`is-*-touch\` classes); add the class by hand`
            );
          }
        } else {
          todo(
            `\`${prop}.${String(key)}\` is not a breakpoint bloomer's helpers know; convert it by hand`
          );
        }
      }
    } else {
      convert(
        attr.value?.type === 'JSXExpressionContainer'
          ? attr.value.expression
          : attr.value,
        '',
        prop
      );
    }

    removeAttr(element, attr);
    ctx.dirty = true;
  }
}

/** Run every helper-flattening pass that applies to this element. */
export function flattenResponsiveProps(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  kind: ResponsiveKind
): void {
  flattenDisplay(ctx, path, element);
  flattenHidden(ctx, path, element);
  if (kind === 'column') flattenColumnSizes(ctx, path, element);
}
