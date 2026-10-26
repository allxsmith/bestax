/**
 * Two differences in markup a bulma-classes conversion makes on purpose,
 * both about where an icon is hidden, and the normalizations the render
 * tests allow for them. The others change a class: a Bulma 0.9 class v1
 * removed, written as the v1 class that replaced it, which `withV1Classes`
 * in `render-module.ts` restates, and Font Awesome 6's long name for a style
 * written as its short one, which `font-awesome-styles.ts` restates.
 *
 * Font Awesome's own markup hides the glyph on the `<i>`:
 * `<span class="icon"><i class="fas fa-home" aria-hidden="true"></i></span>`.
 * `Icon` renders that `<i>` bare and writes `aria-hidden` on the `.icon`, so
 * the converted markup carries the attribute one element up. The glyph is
 * hidden either way: the `.icon` holds nothing else, and carries nothing
 * assistive tech reads that the move would hide with it. So the render tests
 * compare both sides with the attribute moved up.
 *
 * Narrow on purpose. It moves the attribute only off an `<i>` that carries
 * nothing else but a class and is empty, the only thing inside a `<span>`
 * with the `icon` class that carries nothing but a class, an `id`, a `style`
 * and `data-` attributes. Anything else stays as it is, so any other
 * difference still fails the comparison.
 */

import { normalizeHtml } from './render-module.js';

/** A `<span>`, its attributes, and an empty `<i>` alone inside it, hidden. */
const SHAPE =
  /<span((?: [^\s=>/]+(?:="[^"]*")?)*)><i aria-hidden="true"((?: class="[^"]*")?)><\/i><\/span>/g;

/**
 * What a `.icon` may carry and still be compared with the attribute moved
 * up: its class and attributes assistive tech doesn't read. Anything else, a
 * name, a description, a `title`, a `role`, a `tabindex` or an `aria-hidden`
 * of its own, keeps the markup as it is, as the planner keeps it.
 */
function movesBeside(name: string): boolean {
  return ['class', 'id', 'style'].includes(name) || /^data-/.test(name);
}

/**
 * `html` with the `aria-hidden` of each Font Awesome `<i>` alone in a
 * `.icon` that carries nothing else assistive tech reads moved up onto the
 * `.icon`. It takes and returns markup as
 * `normalizeHtml` writes it, attributes sorted.
 */
export function moveGlyphHidden(html: string): string {
  return html.replace(SHAPE, (shape, attributes: string, className: string) => {
    const given = [...attributes.matchAll(/ ([^\s=>/]+)(?:="([^"]*)")?/g)];
    const classes = given.find(([, name]) => name === 'class')?.[2] ?? '';
    if (
      !classes.split(' ').includes('icon') ||
      !given.every(([, name]) => movesBeside(name))
    ) {
      return shape;
    }
    return normalizeHtml(
      `<span${attributes} aria-hidden="true"><i${className}></i></span>`
    );
  });
}

/** Elements with no closing tag, which open nothing. */
const VOID = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);

/** Each tag, opening or closing, with its name and attributes. */
const TAG = /<(\/?)([a-zA-Z][\w-]*)((?:\s+[^\s=>/]+(?:="[^"]*")?)*)\s*(\/?)>/g;

/** Each opening tag, in document order. */
const OPEN_TAG = /<[a-zA-Z][\w-]*(?:\s+[^\s=>/]+(?:="[^"]*")?)*\s*\/?>/g;

function attributesOf(attributes: string): Map<string, string> {
  return new Map(
    [...attributes.matchAll(/\s+([^\s=>/]+)(?:="([^"]*)")?/g)].map(
      ([, name, value]) => [name, value ?? '']
    )
  );
}

/**
 * Whether a link or <button> names itself with its own `aria-label` or
 * `aria-labelledby`, not empty: a <button>, or an <a> with an `href`, since
 * one with none is no link, and nothing names it.
 */
function namesItself(tag: string, attributes: Map<string, string>): boolean {
  if (tag === 'a' && !attributes.has('href')) return false;
  return ['aria-label', 'aria-labelledby'].some(
    name => (attributes.get(name) ?? '').trim() !== ''
  );
}

/**
 * `raw`, normalized, with `aria-hidden="true"` written on each `.icon` that
 * sits in a link or <button> its own label names, where `converted` has the
 * attribute on the same element, so the two compare equal there and nowhere
 * else.
 *
 * The label is what assistive tech reads for the control, in place of what
 * it holds, so an icon there is decoration, and `Icon` hides it: the
 * conversion adds the attribute, and nothing assistive tech reads changes.
 *
 * Narrow on purpose, the shape `moveGlyphHidden` takes but for where the
 * attribute comes from: a `<span>` with the `icon` class that carries
 * nothing but a class, an `id`, a `style` and `data-` attributes, no
 * `aria-hidden` among them, holding a bare, empty `<i>` and nothing else,
 * whose nearest <a> or <button> around it names itself. Elements pair up in
 * document order, and a pair that doesn't line up differs anyway.
 */
export function withLabelledGlyphsHidden(
  raw: string,
  converted: string
): string {
  const hidden = [...converted.matchAll(OPEN_TAG)].map(([tag]) =>
    /\saria-hidden="true"/.test(tag)
  );
  // The <a> and <button> elements open around the tag being read: whether
  // each names itself, and null for any other element.
  const open: Array<boolean | null> = [];
  let at = 0;
  const restated = raw.replace(
    TAG,
    (
      tag: string,
      closing: string,
      name: string,
      written: string,
      selfClosing: string,
      offset: number
    ) => {
      if (closing) {
        open.pop();
        return tag;
      }
      const index = at++;
      const attributes = attributesOf(written);
      const control = [...open].reverse().find(entry => entry !== null);
      if (!selfClosing && !VOID.has(name)) {
        open.push(
          name === 'a' || name === 'button'
            ? namesItself(name, attributes)
            : null
        );
      }
      if (
        name !== 'span' ||
        !hidden[index] ||
        control !== true ||
        attributes.has('aria-hidden') ||
        !(attributes.get('class') ?? '').split(' ').includes('icon') ||
        ![...attributes.keys()].every(movesBeside) ||
        !/^<i(?: class="[^"]*")?><\/i><\/span>/.test(
          raw.slice(offset + tag.length)
        )
      ) {
        return tag;
      }
      return tag.replace(/^<span/, '<span aria-hidden="true"');
    }
  );
  return normalizeHtml(restated);
}
