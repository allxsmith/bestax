/**
 * Stylesheet migration for bloomer apps.
 *
 * Same shared factory as every other source — the Bulma 0.9 → v1 rewriting is
 * identical. What differs is that bloomer ships no stylesheet of its own: it
 * never depended on Bulma, and its README tells the app to install `bulma`
 * and import it directly. So there is no source root stylesheet to replace
 * (`rootStylesheetSuffixes` is empty, which the factory tolerates), and the
 * pass only ever rewrites the app's own `bulma/…` imports — which, coming
 * from the 0.6 era, are older than anything the 0.9 → v1 guide describes.
 */

import { makeStylesTransform } from '../_shared/make-styles-transform.js';

export const transformStyles = makeStylesTransform({
  packageName: 'bloomer',
  guideUrl: 'https://bestax.io/docs/guides/getting-started/migration/bloomer',
  rootStylesheetSuffixes: [],
});
