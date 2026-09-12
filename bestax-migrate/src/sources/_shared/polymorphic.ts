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
  attrSource,
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
 * The targets that accept an `as` beyond a narrowed union -- generic over
 * `React.ElementType`, so any tag is valid. Every other target either narrows
 * `as` (the table above) or declares none at all.
 *
 * That last group is why this set has to exist. An earlier pass flags an `as`
 * a component cannot take and leaves the attribute in place as the marker for
 * its TODO, so reading the element off whatever `as` is present would believe
 * a prop the component never had -- and `<Panel.Block as="span" href="/x">`
 * would lose the `href` that compiles and keep the `as` that does not.
 */
const AS_ANY = new Set(['Button', 'Menu.Item', 'Navbar.Item', 'Navbar.Link']);

/**
 * Where an `href` can live, by bestax target -- the value is the element the
 * component renders when no `as` is given. An `href` survives only where that
 * element is the anchor, or where `as="a"` names one; a target absent from
 * this table takes no `href` at any `as`, which is most of them.
 *
 * Stated this way round on purpose. The source libraries put an `href` on
 * anything, and a table of what cannot take one is a list nobody can keep
 * complete -- the first version of this rule named four targets and missed
 * `Tabs.Item`, `Media.Left`, `Card.Image` and ninety more. Note the two
 * `Pagination` controls: a source reaches them through a `special`, not a
 * `target:` line, so a table built by reading the mappings alone misses them.
 *
 * The default element is here rather than a bare "takes an href" flag because
 * typechecking cannot answer the question on its own. `Level.Item` declares
 * `href` on its props at every `as`, so `<Level.Item href="/x">` compiles --
 * but it renders a <div> and forwards `href` only when the tag is an `<a>`
 * (`bulma-ui/src/layout/Level.tsx:227`), so the attribute is dropped at
 * runtime. A table built from the types alone calls that supported; it is the
 * same dead attribute this pass exists to remove.
 */
const HREF_OK: Record<string, string> = {
  Button: 'button',
  'Level.Item': 'div',
  'Menu.Item': 'a',
  'Navbar.Item': 'a',
  'Navbar.Link': 'a',
  'Pagination.Link': 'a',
  'Pagination.Next': 'a',
  'Pagination.Previous': 'a',
  'Panel.Block': 'a',
};

/** The targets whose `as` this pass may believe. */
export function declaresAs(target: string): boolean {
  return target in AS_UNIONS || AS_ANY.has(target);
}

/** Whether `target` renders `value` when told `as={value}`. */
function acceptsAs(target: string, value: string): boolean {
  const union = AS_UNIONS[target];
  return union ? union.includes(value) : AS_ANY.has(target);
}

/** The rows the type test holds to the library. */
export const HREF_TABLE: Record<string, string> = HREF_OK;
export const AS_ANY_TARGETS: readonly string[] = [...AS_ANY].sort();

/**
 * The `as` value that keeps an `href`. Only the anchor, and not because it is
 * the only intrinsic React types an `href` onto -- `area`, `link` and `base`
 * carry one too, and a target generic over `as` accepts them.
 *
 * They are excluded because the components disagree about what they forward,
 * so no shared set is right. `Menu.Item` strips `href` unless the tag is an
 * `<a>` or a custom component (`bulma-ui/src/components/Menu.tsx:212-222`),
 * while `Button` routes everything but `'button'` through its anchor path and
 * would forward it. Keeping `href` beside `as="area"` therefore typechecks on
 * both and does nothing on one of them, which is the silently-dead attribute
 * this pass exists to remove. Dropping it is announced and the TODO quotes
 * the value; keeping it is not. No source here emits `as="area"` anyway, and
 * an `<area href>` outside a `<map>` navigates nowhere regardless.
 */
const ANCHOR = 'a';

/**
 * Attributes that exist only on the anchor family. They are as inert as the
 * `href` beside them once the element is not a link, and just as much a type
 * error, so they leave together -- dropping the `href` alone left
 * `<Navbar.Link as="span" target="_blank">`, which still does not compile.
 */
const ANCHOR_ONLY = [
  'target',
  'rel',
  'download',
  'hrefLang',
  'ping',
  'referrerPolicy',
];

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
  target: string,
  attr: any,
  literal: ReturnType<typeof literalValueOf> | undefined
): void {
  const allowed = AS_UNIONS[target];
  if (!allowed || !attr || !literal) return;
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
 * Drop an `href` the element cannot take.
 *
 * The element is read from the `as` the target actually declares, never from
 * whatever attribute happens to be spelled `as`, and from the value as it was
 * written -- `restrictAsValue` may be about to remove it, and an element this
 * pass has already forgotten cannot be judged.
 */
function dropInertHref(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  target: string,
  literal: ReturnType<typeof literalValueOf> | undefined
): void {
  const href = findAttr(element, 'href');
  if (!href) return;
  const wasWritten = attrSource(ctx.j, href);
  const drop = (why: string): void => {
    removeAttr(element, href);
    const alsoWent: string[] = [];
    for (const name of ANCHOR_ONLY) {
      const attr = findAttr(element, name);
      if (!attr) continue;
      removeAttr(element, attr);
      alsoWent.push(`\`${name}\``);
    }
    const tail = alsoWent.length
      ? ` (${alsoWent.join(', ')} went with it -- the anchor is what carried them)`
      : '';
    const was = wasWritten ? ` -- it read \`${wasWritten}\`` : '';
    addTodo(ctx, path, 'prop:href', `${why}${tail}${was}`);
    ctx.dirty = true;
  };

  const defaultEl = HREF_OK[target];
  if (!defaultEl) {
    drop(
      `bestax \`${target}\` takes no \`href\` at any \`as\` -- navigate in \`onClick\`, or put an <a> inside it`
    );
    return;
  }

  // A dynamic `as` may well be an anchor at runtime; guessing either way is
  // worse than leaving the pair for the author, who can read the expression.
  if (literal && literal.kind !== 'string') return;

  // An `as` naming a tag the target does not render is dropped by
  // `restrictAsValue`, so what renders is the component's own default -- the
  // same element as if no `as` had been written at all.
  const rendered =
    literal && literal.kind === 'string' && acceptsAs(target, literal.value)
      ? literal.value
      : undefined;

  if (rendered === undefined) {
    if (defaultEl === ANCHOR) return;
    drop(
      `bestax \`${target}\` renders a <${defaultEl}> unless \`as\` says otherwise, and only its <a> form carries an \`href\` -- set \`as="a"\` to make this a link, or navigate in \`onClick\``
    );
    return;
  }
  if (rendered === ANCHOR) return;
  // Which remedy is right depends on what the target renders with no `as`.
  // "drop the `as`" is only a link on the targets whose bare element is the
  // anchor; on `Button` it gives a <button> that will not compile, and on
  // `Level.Item` a <div> that compiles and quietly is not a link.
  const remedy =
    defaultEl === ANCHOR
      ? 'drop the `as` to make this a link, or put an <a> inside'
      : `set \`as="a"\` to make this a link -- dropping the \`as\` gives you a <${defaultEl}> -- or put an <a> inside`;
  drop(
    `\`href\` on \`as="${rendered}"\`: bestax gives an element the attributes of the tag \`as\` names, and a <${rendered}> takes no \`href\` (it navigated nowhere in the source either) -- ${remedy}`
  );
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
  // Read the `as` once, before either rule can remove it, and only where the
  // target declares one at all.
  const attr = declaresAs(target) ? findAttr(element, 'as') : undefined;
  const literal = attr ? literalValueOf(attr) : undefined;
  dropInertHref(ctx, path, element, target, literal);
  restrictAsValue(ctx, path, element, target, attr, literal);
}
