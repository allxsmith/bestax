/**
 * bestax's DOM props follow `as`: an element's attributes are the attributes
 * of whatever `as` renders, and a few components narrow `as` to a literal
 * union of the elements Bulma's markup allows there. Every source library
 * this package migrates from is looser — rbx and react-bulma-components take
 * any tag, bloomer took any `tag` — so a faithful prop-for-prop rename can
 * emit two shapes that do not compile against the library:
 *
 * - an `as` naming an element the bestax component does not offer;
 * - an `href` beside an `as` that is not an `<a>`;
 * - an `href` on a component that declares none at any `as`.
 *
 * Both are dropped with a TODO rather than carried, and nothing renders
 * differently for it. The source component ignored an `as` it had no element
 * for, and an `href` on a `<span>` or a `<div>` navigates nowhere in any
 * browser — so what goes is a prop that never did anything, and the TODO says
 * where to put the intent instead. Carrying them across would hand the user a
 * project that does not typecheck, which is the one thing a codemod must not
 * do.
 *
 * Source-agnostic: what it knows is bestax's side of the rename, so all three
 * sources run it over every element after their prop passes.
 */

import type { ASTPath } from 'jscodeshift';
import {
  addTodo,
  findAttr,
  literalValueOf,
  removeAttr,
  type TransformContext,
} from './jsx-utils.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The bestax components whose `as` is a closed literal union, by the name the
 * mappings use as their `target`. Every other component either takes no `as`
 * (`restrictAsToTargets` handles those) or is generic over `React.ElementType`
 * and accepts any tag.
 *
 * `as-unions.test.ts` holds each row to the library's own type, so a union
 * that widens or narrows in bulma-ui fails here rather than drifting into
 * output that does not compile.
 */
const AS_UNION_TABLE = {
  Control: ['div', 'p'],
  'Dropdown.Item': ['a', 'div', 'button'],
  Footer: ['footer', 'div'],
  Image: ['figure', 'div', 'p'],
  'Level.Item': ['div', 'p', 'a'],
  Media: ['article', 'div'],
  'Media.Left': ['figure', 'div'],
  SubTitle: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'],
  Title: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'],
} as const;

export const AS_UNIONS: Record<string, readonly string[]> = AS_UNION_TABLE;

/**
 * Targets that declare no `href` at any `as`, with the recipe for the intent
 * the attribute carried. These are plain props interfaces rather than
 * polymorphic ones, so the attribute is a type error whatever `as` says --
 * `as="a"` does not rescue it.
 *
 * The source libraries put an `href` on all four, so this is the same defect
 * as the `as`-following one above and belongs beside it: keyed by bestax
 * target, it reaches every source at once. A mapping entry cannot do the job,
 * because `PropAction` can express a TODO or a drop but not both, and a TODO
 * alone leaves the attribute in the output.
 */
const NO_HREF: Record<string, string> = {
  Delete:
    'bestax `Delete` renders a <button> and has no anchor form; wrap it in an <a>, or handle the navigation in `onClick`',
  'Card.Header.Icon':
    'bestax `Card.Header.Icon` renders a <button>; put an <a> inside it, or handle the navigation in `onClick`',
  'Card.FooterItem':
    'bestax `Card.FooterItem` renders a <span> with no anchor form; put an <a> inside it',
  'Dropdown.Item':
    'bestax `Dropdown.Item` declares no `href`; navigate in `onClick`, or put an <a> inside the item',
};

/**
 * Targets whose default element takes no `href`, so one with no `as` beside
 * it has no home. Only `Button` renders a `<button>` by default among the
 * components any source can hand an `href` to; the rest default to an `<a>`,
 * or declare none at all and are in `NO_HREF`.
 */
const NO_BARE_HREF = new Set(['Button']);

/** An `as` value that gives the element an `href`. */
const ANCHOR = 'a';

/**
 * Drop an `as` the bestax target cannot render, naming the elements it can.
 *
 * A literal only. A dynamic `as` is left exactly as written, and the reason is
 * the one `rbx/mapping.ts` gives for its `AS_OK` entries: `as={SomeComponent}`
 * against a narrowed union should surface as a type error the author reads,
 * not a silent rewrite. Removing it here would delete a live reference to
 * their component and quietly render something else.
 */
function restrictAsValue(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  target: string
): void {
  const allowed = AS_UNIONS[target];
  if (!allowed) return;
  const attr = findAttr(element, 'as');
  if (!attr) return;
  const literal = literalValueOf(attr);
  if (literal.kind !== 'string' || allowed.includes(literal.value)) return;
  const offered = allowed.map(a => `\`${a}\``).join(' / ');
  removeAttr(element, attr);
  addTodo(
    ctx,
    path,
    'prop:as',
    `bestax \`${target}\` renders only ${offered}, so \`as="${literal.value}"\` cannot carry across — wrap it in a <${literal.value}> or restructure`
  );
  ctx.dirty = true;
}

/**
 * Drop an `href` the element cannot take. bestax types `href` onto an anchor
 * only, and the source rendered the same non-anchor element with an `href`
 * that did nothing — so this removes a dead attribute rather than a link.
 */
function dropInertHref(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  target: string
): void {
  const href = findAttr(element, 'href');
  if (!href) return;
  // No `as` rescues a component that declares no `href` at all, so this is
  // settled before the element is read.
  const noHref = NO_HREF[target];
  if (noHref) {
    removeAttr(element, href);
    addTodo(ctx, path, 'prop:href', noHref);
    ctx.dirty = true;
    return;
  }
  const asAttr = findAttr(element, 'as');
  if (!asAttr) {
    if (!NO_BARE_HREF.has(target)) return;
    removeAttr(element, href);
    addTodo(
      ctx,
      path,
      'prop:href',
      `bestax \`${target}\` renders a <button>, which takes no \`href\` — set \`as="a"\` to make it a link, or navigate in \`onClick\``
    );
    ctx.dirty = true;
    return;
  }
  const literal = literalValueOf(asAttr);
  // A dynamic `as` may well be an anchor at runtime; guessing either way is
  // worse than leaving the pair for the author, who can read the expression.
  if (literal.kind !== 'string' || literal.value === ANCHOR) return;
  removeAttr(element, href);
  addTodo(
    ctx,
    path,
    'prop:href',
    `\`href\` on \`as="${literal.value}"\`: bestax gives an element the attributes of the tag \`as\` names, and a <${literal.value}> takes no \`href\` (it navigated nowhere in the source either) — drop the \`as\` to make this a link, or put an <a> inside`
  );
  ctx.dirty = true;
}

/**
 * The whole-element pass each source runs after its prop passes, once the
 * bestax `target` and the final `as` are both known.
 */
export function enforcePolymorphicProps(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  target: string
): void {
  restrictAsValue(ctx, path, element, target);
  dropInertHref(ctx, path, element, target);
}
