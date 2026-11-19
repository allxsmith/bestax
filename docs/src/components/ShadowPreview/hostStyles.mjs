/**
 * The text rewrites that ready a stylesheet for a preview's shadow root.
 *
 * Plain functions over CSS text, apart from shadowStyles.js and its
 * `raw-loader` imports, so scripts/host-styles.test.mjs can run them over the
 * built bestax.css.
 */

/**
 * Scopes custom properties to the shadow host, the only place they reach the
 * preview from.
 *
 * @param {string} rawStyles
 * @returns {string}
 */
export function toHost(rawStyles) {
  return rawStyles.replace(/:root/g, ':host');
}

/**
 * Readies bestax.css for a shadow root: `:root` becomes `:host`, and Bulma's
 * scheme variables, which it declares in `@media (prefers-color-scheme)` as a
 * lone `:root` rule, move onto the host's `.dark`/`.light` class, so the
 * reader's OS setting doesn't pick a preview's palette.
 *
 * Only those variable blocks move. A scheme rule of the extras' own, such as
 * Switch's light-scheme circle, keeps its media query, as it does in an app.
 * The patterns match the compiled shape of Bulma's blocks, so
 * scripts/host-styles.test.mjs fails if a build stops producing it.
 *
 * @param {string} rawStyles
 * @returns {string}
 */
export function preprocessBulmaStyles(rawStyles) {
  let processedStyles = toHost(rawStyles);

  processedStyles = processedStyles.replace(
    /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*(:host\s*\{[^{}]*\})\s*\}/g,
    ':host(.dark) { $1 }'
  );

  processedStyles = processedStyles.replace(
    /@media\s*\(prefers-color-scheme:\s*light\)\s*\{\s*(:host\s*\{[^{}]*\})\s*\}/g,
    ':host(.light) { $1 }'
  );

  return processedStyles;
}
