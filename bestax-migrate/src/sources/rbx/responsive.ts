/**
 * Flattens rbx's breakpoint objects into bestax-bulma's flat per-viewport
 * props. rbx has three distinct shapes and this module handles all of them:
 *
 *   1. the universal `responsive` helper prop, nested two levels deep —
 *      breakpoint → helper → `{ value, only }`:
 *        <Generic responsive={{ tablet: { display: { value: "flex" } } }} />
 *          → displayTablet="flex"
 *   2. Column's per-breakpoint sizing props:
 *        <Column tablet={{ size: 6, narrow: true }} />
 *          → sizeTablet={6} isNarrowTablet
 *   3. Column.Group's per-breakpoint gap prop:
 *        <Column.Group tablet={{ gapSize: 4 }} />
 *          → gapTablet={4}
 *
 * `touch` has no bestax viewport and `only` has no `-only` prop, so both get a
 * TODO rather than a guess. Non-object or dynamic values get a TODO too.
 *
 * rbx's value unions for display/textAlign/textSize are identical to bestax's,
 * so unlike the react-bulma-components flattener there is no value mapping
 * here — only the shape changes.
 */

import type { ASTPath } from 'jscodeshift';
import { RESPONSIVE_BREAKPOINTS } from './mapping.js';
import {
  addAttr,
  addTodo,
  attributesOf,
  attrValue,
  literalOf,
  makeAttr,
  objectExpressionOf,
  propKey,
  removeAttr,
  type TransformContext,
} from '../_shared/jsx-utils.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type ResponsiveKind = 'generic' | 'column' | 'column-group';

/** Which specials opt their element into the extra breakpoint shapes. */
export const RESPONSIVE_KINDS: Record<string, ResponsiveKind> = {
  column: 'column',
  'column-group': 'column-group',
};

/**
 * One `{ value, only }` cell of the universal `responsive` prop. Returns the
 * inner `value` node, or undefined when the cell isn't the expected shape.
 * `only: true` is reported as a TODO by the caller.
 */
function readCell(
  cell: any
): { value: any; only: boolean | 'dynamic' } | undefined {
  const obj =
    cell?.type === 'ObjectExpression'
      ? cell
      : cell?.type === 'JSXExpressionContainer' &&
          cell.expression?.type === 'ObjectExpression'
        ? cell.expression
        : null;
  if (!obj) return undefined;
  let value: any;
  let only: boolean | 'dynamic' = false;
  for (const prop of obj.properties) {
    const key = propKey(prop);
    if (key === 'value') {
      value = prop.value;
    } else if (key === 'only') {
      // A dynamic `only` is a third state, not `false`: collapsing it to
      // false silently converted `{ value: 'flex', only: cond }` into an
      // unconditional `displayTablet="flex"`, dropping the conditional
      // `-only` behaviour with no TODO.
      const literal = literalOf(prop.value);
      only = typeof literal === 'boolean' ? literal : 'dynamic';
    }
  }
  return value === undefined ? undefined : { value, only };
}

/**
 * Pass 1 — the universal `responsive={{ <breakpoint>: { … } }}` prop.
 *
 * The whole prop always goes, even when some cells could not be converted.
 * bestax has an unrelated `responsive` prop (`'mobile' | 'narrow'`), so a
 * partially-emptied rbx object left behind is not a harmless leftover — it is
 * a guaranteed type error on every migrated component. Each cell that could
 * not be carried over gets its own TODO naming it, which is where that
 * information belongs.
 */
function flattenResponsiveHelper(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any
): void {
  const { j } = ctx;
  const attr = attributesOf(element).find(
    (a: any) => a.name.name === 'responsive'
  );
  if (!attr) return;

  const objectExpr = objectExpressionOf(attr.value);
  if (!objectExpr) {
    // Still remove it. bestax's `responsive` is an unrelated string union
    // (`'mobile' | 'narrow'`), so leaving a dynamic rbx value behind is a
    // guaranteed type error, not a leftover — the same contract the
    // convertible path keeps.
    addTodo(
      ctx,
      path,
      'responsive',
      'dropped the `responsive` prop: it must be an inline object literal to flatten to bestax per-viewport props, and bestax has its own unrelated `responsive` prop, so it could not be left in place — reapply it by hand'
    );
    removeAttr(element, attr);
    ctx.dirty = true;
    return;
  }

  const remainingBreakpoints: string[] = [];
  for (const bpProp of objectExpr.properties) {
    const breakpoint = propKey(bpProp);
    if (breakpoint === undefined || !(breakpoint in RESPONSIVE_BREAKPOINTS)) {
      remainingBreakpoints.push(String(breakpoint));
      addTodo(
        ctx,
        path,
        'responsive',
        `\`responsive.${String(breakpoint)}\` is not a breakpoint bestax knows; convert it by hand`
      );
      continue;
    }

    const suffix = RESPONSIVE_BREAKPOINTS[breakpoint];
    if (suffix === null) {
      remainingBreakpoints.push(breakpoint);
      addTodo(
        ctx,
        path,
        'responsive',
        `no bestax-bulma helper variants for the \`${breakpoint}\` breakpoint; restyle with CSS or drop it`
      );
      continue;
    }

    const cells = objectExpressionOf(bpProp.value) ?? bpProp.value;
    if (cells?.type !== 'ObjectExpression') {
      remainingBreakpoints.push(breakpoint);
      addTodo(
        ctx,
        path,
        'responsive',
        `\`responsive.${breakpoint}\` must be an inline object literal to flatten; convert it by hand`
      );
      continue;
    }

    const remainingCells: any[] = [];
    for (const cellProp of cells.properties) {
      const helper = propKey(cellProp);
      const cell = readCell(cellProp.value);
      if (!helper || !cell) {
        remainingCells.push(cellProp);
        addTodo(
          ctx,
          path,
          'responsive',
          `\`responsive.${breakpoint}.${String(helper)}\` is not the \`{ value }\` shape rbx documents; convert it by hand`
        );
        continue;
      }
      if (cell.only) {
        remainingCells.push(cellProp);
        addTodo(
          ctx,
          path,
          'responsive',
          cell.only === 'dynamic'
            ? `\`responsive.${breakpoint}.${helper}.only\` has a dynamic value; Bulma's \`-only\` classes have no bestax prop, so apply it with className by hand`
            : `\`responsive.${breakpoint}.${helper}.only\` (Bulma's \`-only\` classes) has no bestax prop; use className`
        );
        continue;
      }

      const literal = literalOf(cell.value);
      if (helper === 'hide') {
        if (literal === true) {
          addAttr(element, makeAttr(j, `visibility${suffix}`, 'hidden'));
        } else if (literal !== false) {
          remainingCells.push(cellProp);
          addTodo(
            ctx,
            path,
            'responsive',
            `\`responsive.${breakpoint}.hide\` has a dynamic value; set \`visibility${suffix}="hidden"\` conditionally by hand`
          );
          continue;
        }
        // hide: { value: false } is a no-op — drop it.
      } else if (helper === 'display' || helper === 'textAlign') {
        // rbx's displays and textAlignments are bestax's unions verbatim.
        if (typeof literal === 'string') {
          addAttr(element, makeAttr(j, `${helper}${suffix}`, literal));
        } else {
          remainingCells.push(cellProp);
          addTodo(
            ctx,
            path,
            'responsive',
            `\`responsive.${breakpoint}.${helper}\` has a dynamic value; set \`${helper}${suffix}\` by hand`
          );
          continue;
        }
      } else if (helper === 'textSize') {
        if (literal !== undefined && typeof literal !== 'boolean') {
          // bestax text sizes are strings; rbx's are numbers.
          addAttr(element, makeAttr(j, `textSize${suffix}`, String(literal)));
        } else {
          remainingCells.push(cellProp);
          addTodo(
            ctx,
            path,
            'responsive',
            `\`responsive.${breakpoint}.textSize\` has a dynamic value; set \`textSize${suffix}\` by hand`
          );
          continue;
        }
      } else {
        remainingCells.push(cellProp);
        addTodo(
          ctx,
          path,
          'responsive',
          `\`responsive.${breakpoint}.${helper}\` could not be flattened to a bestax per-viewport prop`
        );
        continue;
      }
    }

    if (remainingCells.length > 0) {
      remainingBreakpoints.push(breakpoint);
    }
  }

  if (remainingBreakpoints.length > 0) {
    addTodo(
      ctx,
      path,
      'responsive',
      `dropped the \`responsive\` prop; the ${remainingBreakpoints
        .map(b => `\`${b}\``)
        .join(
          ', '
        )} settings above could not be converted and bestax's own \`responsive\` prop is unrelated (\`'mobile' | 'narrow'\`)`
    );
  }
  removeAttr(element, attr);
  ctx.dirty = true;
}

/**
 * Pass 2 — Column / Column.Group per-breakpoint props, which sit directly on
 * the element (`<Column tablet={{ size: 6 }} />`) rather than under
 * `responsive`.
 */
function flattenColumnBreakpoints(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  kind: 'column' | 'column-group'
): void {
  const { j } = ctx;
  for (const attr of [...attributesOf(element)]) {
    const name: string = attr.name.name;
    if (!(name in RESPONSIVE_BREAKPOINTS)) continue;

    // bestax's viewport-suffixed helper props have no `touch` variant — but
    // Column is the one exception: `isNarrowTouch` does exist. So the column
    // pass resolves `touch` itself rather than taking the shared table's
    // `null`, and only the keys that genuinely have no counterpart
    // (`sizeTouch`, `offsetTouch`, `gapTouch`) become TODOs.
    const suffix = name === 'touch' ? 'Touch' : RESPONSIVE_BREAKPOINTS[name];
    const touchOnlyNarrow = name === 'touch';

    const objectExpr = objectExpressionOf(attr.value);
    if (suffix === null || !objectExpr) {
      // Nothing can be salvaged from this attribute, and leaving it behind is
      // not harmless: `ColumnProps` spreads unrecognised props onto the
      // `<div>`, so a leftover is both a TS excess-property error and a React
      // unknown-attribute warning. Drop it and say so — the same contract
      // `flattenResponsiveHelper` keeps.
      addTodo(
        ctx,
        path,
        'responsive',
        objectExpr
          ? `dropped \`${name}\`: bestax has no column variants for the \`${name}\` breakpoint — restyle with CSS`
          : `dropped \`${name}\`: it must be an inline object literal to flatten to bestax per-viewport props — convert it by hand`
      );
      removeAttr(element, attr);
      ctx.dirty = true;
      continue;
    }

    const unconverted: string[] = [];
    for (const prop of objectExpr.properties) {
      const key = propKey(prop);
      const literal = literalOf(prop.value);

      if (
        kind === 'column' &&
        (key === 'size' || key === 'offset') &&
        !touchOnlyNarrow
      ) {
        // Column sizes take numbers and named strings alike; reuse the node.
        addAttr(
          element,
          j.jsxAttribute(
            j.jsxIdentifier(`${key}${suffix}`),
            attrValue(j, prop.value)
          )
        );
      } else if (kind === 'column' && key === 'narrow') {
        if (literal === true) {
          addAttr(element, makeAttr(j, `isNarrow${suffix}`));
        } else if (literal !== false) {
          unconverted.push(`${key} (dynamic value)`);
        }
      } else if (
        kind === 'column-group' &&
        key === 'gapSize' &&
        !touchOnlyNarrow
      ) {
        // bestax `gap*` supersedes the deprecated `gapSize*`, same 0-8 scale.
        addAttr(
          element,
          j.jsxAttribute(
            j.jsxIdentifier(`gap${suffix}`),
            attrValue(j, prop.value)
          )
        );
      } else {
        unconverted.push(String(key));
      }
    }

    if (unconverted.length > 0) {
      addTodo(
        ctx,
        path,
        'responsive',
        `dropped \`${name}.${unconverted.join('`, `' + name + '.')}\`: no bestax per-viewport equivalent — set it by hand`
      );
    }
    removeAttr(element, attr);
    ctx.dirty = true;
  }
}

/** Run every breakpoint pass that applies to this element. */
export function flattenResponsiveProps(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  kind: ResponsiveKind
): void {
  flattenResponsiveHelper(ctx, path, element);
  if (kind === 'column' || kind === 'column-group') {
    flattenColumnBreakpoints(ctx, path, element, kind);
  }
}
