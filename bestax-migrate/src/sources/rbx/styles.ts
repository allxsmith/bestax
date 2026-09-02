/**
 * Stylesheet migration for rbx apps.
 *
 * Same shared factory as every other source — the Bulma 0.9 → v1 rewriting is
 * identical.
 *
 * Note what it does NOT do: a `bulma-*` extension import in Sass is left in
 * place with a TODO, not removed. Only the JS/CSS-import side of rbx's
 * extension cleanup is automatic (transform.ts prunes
 * `bulma-badge`/`bulma-divider`/`bulma-pageloader`/`bulma-tooltip` CSS
 * imports outright, since bestax ships all four as components). A Sass
 * `@import` of one may be pulling in customisation the codemod cannot see,
 * so it is flagged for a human instead.
 *
 * rbx's own stylesheet is `rbx/rbx` (its Sass entry, usually imported as
 * `~rbx/rbx` after `~bulma/bulma`) or the prebuilt `rbx/index.css`. Both
 * carry rbx's fixes on top of a full Bulma root, so they are replaced with a
 * Bulma v1 root rather than dropped.
 */

import { makeStylesTransform } from '../_shared/make-styles-transform.js';

export const transformStyles = makeStylesTransform({
  packageName: 'rbx',
  guideUrl: 'https://bestax.io/docs/guides/getting-started/migration/rbx',
  rootStylesheetSuffixes: [
    '/rbx(?:\\.s[ac]ss)?',
    '/index(?:\\.min)?\\.css',
    '/dist/rbx(?:\\.min)?\\.css',
  ],
});
