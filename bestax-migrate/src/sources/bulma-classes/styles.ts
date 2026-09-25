/**
 * Stylesheet migration for an app that styled plain markup with Bulma. There
 * is no source package, so the shared factory only rewrites the app's own
 * Bulma 0.9 imports and variable overrides into Bulma v1's `@use` form.
 *
 * Only when asked. Under the default `--css keep` the app keeps its Bulma
 * version (see deps.ts), and v1's `@use 'bulma/sass'` against a Bulma 0.9
 * install would break the app's Sass build, so the pass leaves every
 * stylesheet alone.
 */

import type { StylesTransform } from '../../types.js';
import { makeStylesTransform } from '../_shared/make-styles-transform.js';

const toBulmaV1 = makeStylesTransform({
  guideUrl:
    'https://bestax.io/docs/guides/getting-started/migration/bulma-classes',
  rootStylesheetSuffixes: [],
});

export const transformStyles: StylesTransform = (
  filePath,
  source,
  collector,
  options
) =>
  (options.cssMode ?? 'keep') === 'keep'
    ? null
    : toBulmaV1(filePath, source, collector, options);
