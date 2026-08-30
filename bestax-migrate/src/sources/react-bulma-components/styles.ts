/**
 * Stylesheet migration for react-bulma-components apps.
 *
 * All of the work — Bulma 0.9 `@import` → v1 `@use "bulma/sass" with (…)`,
 * `$var !default` folding, `_all` partial mapping, the bestax extras — lives
 * in the shared factory. Only the package's own specifiers differ per source.
 *
 * RBC's root stylesheets are its Sass entry (`src/index`) and the bundled v3
 * CSS (`dist/react-bulma-components(.min).css`); both stand in for a whole
 * Bulma root, so they are replaced rather than dropped.
 */

import { makeStylesTransform } from '../_shared/make-styles-transform.js';

export const transformStyles = makeStylesTransform({
  packageName: 'react-bulma-components',
  guideUrl:
    'https://bestax.io/docs/guides/getting-started/migration/react-bulma-components',
  rootStylesheetSuffixes: [
    '/src/index(?:\\.s[ac]ss)?',
    '/dist/react-bulma-components(?:\\.min)?\\.css',
  ],
});
