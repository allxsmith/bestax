/**
 * The one difference in markup a bulma-classes conversion makes on purpose,
 * and the one normalization the render tests allow for it.
 *
 * Font Awesome's own markup hides the glyph on the `<i>`:
 * `<span class="icon"><i class="fas fa-home" aria-hidden="true"></i></span>`.
 * `Icon` renders that `<i>` bare and writes `aria-hidden` on the `.icon`, so
 * the converted markup carries the attribute one element up. The glyph is
 * hidden either way: the `.icon` holds nothing else, and no name or role of
 * its own stops the attribute hiding it. So the render tests compare both
 * sides with the attribute moved up.
 *
 * Narrow on purpose. It moves the attribute only off an `<i>` that carries
 * nothing else but a class and is empty, the only thing inside a `<span>`
 * with the `icon` class, no `aria-hidden` of its own and nothing that names
 * it or gives it a role or focus. Anything else stays as it is, so any other
 * difference still fails the comparison.
 */

import { normalizeHtml } from './render-module.js';

/** A `<span>`, its attributes, and an empty `<i>` alone inside it, hidden. */
const SHAPE =
  /<span((?: [^\s=>/]+(?:="[^"]*")?)*)><i aria-hidden="true"((?: class="[^"]*")?)><\/i><\/span>/g;

/** What makes a `.icon` more than decoration, which a hidden one can't be. */
const NAMES = new Set([
  'aria-hidden',
  'aria-label',
  'aria-labelledby',
  'role',
  'tabindex',
]);

/**
 * `html` with the `aria-hidden` of each Font Awesome `<i>` alone in an
 * unnamed `.icon` moved up onto the `.icon`. It takes and returns markup as
 * `normalizeHtml` writes it, attributes sorted.
 */
export function moveGlyphHidden(html: string): string {
  return html.replace(SHAPE, (shape, attributes: string, className: string) => {
    const given = [...attributes.matchAll(/ ([^\s=>/]+)(?:="([^"]*)")?/g)];
    const classes = given.find(([, name]) => name === 'class')?.[2] ?? '';
    if (
      !classes.split(' ').includes('icon') ||
      given.some(([, name]) => NAMES.has(name))
    ) {
      return shape;
    }
    return normalizeHtml(
      `<span${attributes} aria-hidden="true"><i${className}></i></span>`
    );
  });
}
