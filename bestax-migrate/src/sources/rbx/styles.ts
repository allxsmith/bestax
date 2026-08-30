/**
 * Stylesheet migration for rbx apps.
 *
 * Same shared factory as every other source — the Bulma 0.9 → v1 rewriting is
 * identical, and it already retires the `bulma-*` extension imports, which is
 * exactly the stylesheet half of rbx's five-dependency cleanup
 * (`bulma-badge`, `bulma-divider`, `bulma-pageloader`, `bulma-tooltip`).
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
