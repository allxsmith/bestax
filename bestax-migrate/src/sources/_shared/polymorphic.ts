/**
 * bestax's DOM props follow `as`: an element's attributes are the attributes
 * of whatever `as` renders, and a few components narrow `as` to a literal
 * union of the elements Bulma's markup allows there. Every source library
 * this package migrates from is looser — rbx and react-bulma-components take
 * any tag, bloomer took any `tag` — so a faithful prop-for-prop rename emits
 * shapes that do not compile against the library:
 *
 * - an `as` naming an element the bestax component does not offer;
 * - an `href` beside an `as` that is not an `<a>`;
 * - an `href` on a component that declares none at any `as`;
 * - `target` and its siblings on an element, or a component, without them.
 *
 * All are dropped with a TODO rather than carried, because carrying them
 * hands the user a project that does not typecheck, which is the one thing a
 * codemod must not do.
 *
 * What that costs differs by case, and each TODO says so. Dropping an `href`
 * or a `target` costs nothing the source had: they sat on a `<span>` or a
 * `<div>`, where no browser acts on them. Dropping an `as` does change the
 * element — every source here rendered the tag it was given, and bestax
 * renders its own instead — so that TODO names the tag to restore rather than
 * claiming nothing moved.
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

/**
 * Where "put an <a> inside" is not the useful advice. bloomer's navbar handler
 * already said this for its own source; the other two reached the same target
 * and got the generic line, which is the sibling drift `bestax-migrate`'s
 * CLAUDE.md warns about. Keyed by target, all three get it.
 */
const NO_HREF_HINT: Record<string, string> = {
  'Navbar.Dropdown':
    'bestax `Navbar.Dropdown` is the container and takes no `href`; put it on the `<Navbar.Link>` inside',
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
 * The elements each link attribute is valid on. Not a blanket "anchor-only"
 * list, because they are not: `referrerPolicy` is real on `<img>` and
 * `<script>`, `target` on `<form>`, `rel` on `<link>`. Treating them as one
 * set deleted working attributes from those elements.
 *
 * They still have to be checked. Dropping the `href` alone left
 * `<Navbar.Link as="span" target="_blank">`, which does not compile either --
 * and the check has to run whether or not an `href` was there to start with,
 * since that shape is just as invalid without one.
 */
const LINK_ATTR_ELEMENTS: Record<string, readonly string[]> = {
  target: ['a', 'area', 'base', 'form'],
  download: ['a', 'area'],
  hrefLang: ['a', 'area', 'link'],
  ping: ['a'],
  referrerPolicy: ['a', 'area', 'iframe', 'img', 'link', 'script'],
  media: ['a', 'area', 'link', 'source', 'style'],
};

// `type` is the other member `AnchorHTMLAttributes` adds, and it is
// deliberately absent. It is not a link attribute in any useful sense: it is
// an ordinary prop on form controls and buttons, which bestax components
// declare in their own right. This rule cannot tell "the anchor contributed
// it" from "the component owns it", and treating it as a link attribute
// stripped `type="text"` off every `<Input>` in the fixtures. So
// `<Button as="span" type="button">` still ships a type error -- one the
// source wrote rather than one the codemod created, which is the trade.

// `rel` is deliberately absent: React declares it on `HTMLAttributes`, so it
// is valid on every intrinsic and there is nothing to remove. The same point
// `bulma-ui/src/__typetests__/polymorphic.tsx` makes about it.

/**
 * The link attributes a target accepts, where its props do not follow `as`.
 *
 * Most components here either follow `as` (the element decides, above) or
 * extend `AnchorHTMLAttributes` outright (`Pagination.*`, `Panel.Block`, so
 * everything is fine). `Level.Item` is the exception that enumerates: it
 * declares `href`, `target` and `rel` and nothing else, so `download`,
 * `hrefLang`, `ping` and `referrerPolicy` are type errors there even at
 * `as="a"`.
 *
 * A target absent from `HREF_OK` needs no row: a component that takes no
 * `href` at any `as` takes none of its siblings either -- verified for
 * `Dropdown.Item`, `Card.FooterItem`, `Tabs.Item` and `Delete`, which is why
 * this is derived from that table rather than being a second list to keep.
 */
const TARGET_LINK_ATTRS: Record<string, readonly string[]> = {
  'Level.Item': ['target'],
};

/** The rows the type test holds to the library. */
export const TARGET_LINK_ATTR_TABLE: Record<string, readonly string[]> =
  TARGET_LINK_ATTRS;

/**
 * The intrinsic elements React types an `href` onto.
 *
 * Only relevant to plain markup. On a bestax component the anchor is the only
 * `as` that keeps an `href`, because the components disagree about what they
 * forward (see `ANCHOR` below) -- but a plain `<area href>` has no component
 * in the way, and it is valid.
 */
export const HREF_ELEMENTS: readonly string[] = [
  'a',
  'area',
  'base',
  'link',
  // React 19 types `href` onto `<style>` for stylesheet hoisting. Implausible
  // as the output of a Bulma rewrite, but the table is checked against the
  // library rather than against what seems likely, and it said otherwise.
  'style',
];

/** Whether `element` renders `attr` legally -- exported for the plain-markup path. */
export function elementTakesLinkAttr(name: string, element: string): boolean {
  const allowed = LINK_ATTR_ELEMENTS[name];
  return !allowed || allowed.includes(element);
}

/** The link attributes, for callers that iterate them. */
export const LINK_ATTRS: readonly string[] = Object.keys(LINK_ATTR_ELEMENTS);

/** The rows the type test holds to React. */
export const LINK_ATTR_TABLE: Record<string, readonly string[]> =
  LINK_ATTR_ELEMENTS;

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
    const was = wasWritten ? ` -- it read \`${wasWritten}\`` : '';
    addTodo(ctx, path, 'prop:href', `${why}${was}`);
    ctx.dirty = true;
  };

  const defaultEl = HREF_OK[target];
  if (!defaultEl) {
    drop(
      NO_HREF_HINT[target] ??
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
 * Drop a link attribute the rendered element does not take.
 *
 * Independent of `href`: `<Navbar.Link as="span" target="_blank">` is invalid
 * with or without one, and the sources emit both shapes. Each attribute is
 * judged against the element rather than as a group, so a `referrerPolicy` on
 * an `<img>` and a `target` on a `<form>` stay.
 */
function dropInertLinkAttrs(
  ctx: TransformContext,
  path: ASTPath<any>,
  element: any,
  target: string,
  rendered: string | undefined
): void {
  const carriesLinks = HREF_OK[target] !== undefined;
  const declared = TARGET_LINK_ATTRS[target];
  for (const name of LINK_ATTRS) {
    // Both have to allow it. A target that enumerates its props can be
    // narrower than the element, and the element can be narrower than the
    // target: `Level.Item` declares `target` but forwards it only when the
    // tag is an `<a>`, so `<Level.Item as="p" target="_blank">` was keeping
    // the same inert attribute this pass removes everywhere else.
    let keeps: boolean;
    if (!carriesLinks) keeps = false;
    else if (declared && !declared.includes(name)) keeps = false;
    // A dynamic `as` leaves the element unknown, and guessing either way is
    // worse than leaving it for the author.
    else if (rendered === undefined) keeps = true;
    else keeps = elementTakesLinkAttr(name, rendered);
    if (keeps) continue;
    const attr = findAttr(element, name);
    if (!attr) continue;
    const was = attrSource(ctx.j, attr);
    removeAttr(element, attr);
    const because = !carriesLinks
      ? `bestax \`${target}\` is not a link at any \`as\`, so it takes no \`${name}\` either`
      : declared
        ? `bestax \`${target}\` declares its own props rather than taking the element's, and \`${name}\` is not among them`
        : `\`${name}\` needs an element that takes it, and \`${target}\` renders a <${rendered}> here`;
    addTodo(
      ctx,
      path,
      `prop:${name}`,
      `${because} -- ${was ? `it read \`${was}\`; ` : ''}put it on an <a> inside, or change the element`
    );
    ctx.dirty = true;
  }
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
  // The element as it will render: the `as` if the target takes it, otherwise
  // the component's own. Unknown for a dynamic `as`, and unknown for a target
  // outside `HREF_OK` that was given no `as` -- the default element is only
  // recorded for the nine that can carry a link. So this rule reaches an
  // explicit accepted `as` on any target, plus those nine bare; elsewhere it
  // declines rather than guesses.
  const rendered =
    literal && literal.kind === 'string'
      ? acceptsAs(target, literal.value)
        ? literal.value
        : HREF_OK[target]
      : literal
        ? undefined
        : HREF_OK[target];
  dropInertLinkAttrs(ctx, path, element, target, rendered);
  restrictAsValue(ctx, path, element, target, attr, literal);
}
