/**
 * A difference in markup a bulma-classes conversion makes on purpose, and
 * the normalization the render tests allow for it.
 *
 * Font Awesome 6 named its styles twice: a short name (`fab`), the only one
 * 5 has, and a long one (`fa-brands`). The bestax-icons skill writes a style
 * as `Icon`'s `variant` (`brands`), which `Icon` renders as the short name,
 * so an `<i class="fa-brands fa-github">` converts to an `Icon` that renders
 * `<i class="fab fa-github">`. Font Awesome 6 styles the two the same, and 7
 * does too but that its short names also set the classic family, which is
 * why one beside `fa-sharp`, which sets another family, keeps its long name
 * (the planner keeps it there too). So the render tests compare the two with
 * the short name restated in the raw markup.
 *
 * Narrow on purpose. Only on an `<i>`, only one of these six long names,
 * only with no `fa-sharp` beside it, and only where the converted `<i>` has
 * the short name in its place and not the long one: a conversion that drops
 * the style, or keeps both, still differs.
 */

import { normalizeHtml } from './render-module.js';

/** Font Awesome 6's long names for its styles, with their short ones. */
export const SHORT_STYLES: Readonly<Record<string, string>> = {
  'fa-solid': 'fas',
  'fa-regular': 'far',
  'fa-brands': 'fab',
  'fa-light': 'fal',
  'fa-thin': 'fat',
  'fa-duotone': 'fad',
};

/** Each opening tag, in document order. */
const OPEN_TAG = /<[a-zA-Z][\w-]*(?:\s+[^\s=>/]+(?:="[^"]*")?)*\s*\/?>/g;

function classesOf(tag: string): string[] {
  return (/\sclass="([^"]*)"/.exec(tag)?.[1] ?? '').split(/\s+/);
}

/**
 * `raw`, normalized, with the long name of a Font Awesome style written as
 * its short one on each `<i>` where `converted` has the short one in its
 * place, so the two compare equal there and nowhere else. Elements pair up
 * in document order, and a pair that doesn't line up differs anyway.
 */
export function withShortStyles(raw: string, converted: string): string {
  const rendered = [...converted.matchAll(OPEN_TAG)].map(([tag]) => tag);
  let at = 0;
  return normalizeHtml(
    raw.replace(OPEN_TAG, tag => {
      const other = rendered[at++] ?? '';
      if (!/^<i[\s>/]/.test(tag) || !/^<i[\s>/]/.test(other)) return tag;
      const classes = classesOf(tag);
      const theirs = classesOf(other);
      const long = classes.filter(token => Object.hasOwn(SHORT_STYLES, token));
      if (long.length !== 1 || classes.includes('fa-sharp')) return tag;
      const short = SHORT_STYLES[long[0]];
      if (!theirs.includes(short) || theirs.includes(long[0])) return tag;
      return tag.replace(
        /\sclass="([^"]*)"/,
        (_match, value: string) =>
          ` class="${value
            .split(/\s+/)
            .map(token => (token === long[0] ? short : token))
            .join(' ')}"`
      );
    })
  );
}
