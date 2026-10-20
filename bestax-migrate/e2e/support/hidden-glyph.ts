/**
 * A difference in markup a bulma-classes conversion makes on purpose, and
 * the normalization the render tests allow for it. The other is a Bulma 0.9
 * class v1 removed, written as the v1 class that replaced it, which
 * `withV1Classes` in `render-module.ts` restates.
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
