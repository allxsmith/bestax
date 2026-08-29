/**
 * Docusaurus publishes `<folder>/<folder>.md` as that folder's own route: the
 * duplicated trailing segment collapses, so `docs/api/grid/grid.md` serves at
 * `/docs/api/grid` and never at `/docs/api/grid/grid`.
 *
 * Generators that build a docs URL out of a file path have to collapse it too,
 * or they emit a 404 for exactly the pages named after their category. Two
 * pages qualify today (`grid`, `columns`), and both shipped dead links into the
 * MCP index, the component catalog and the migrate skill before #597.
 *
 * The site's own `onBrokenLinks: 'throw'` cannot catch this: these URLs are
 * absolute and live in other packages, so nothing resolves them at build time.
 */

/**
 * Collapse a duplicated trailing path segment.
 *
 *   docsRoute('grid/grid')       // 'grid'
 *   docsRoute('components/card') // 'components/card'
 *
 * Only the last pair collapses, matching Docusaurus: the rule is about a file
 * named after its own directory, not about repeated names further up the path.
 *
 * @param {string} slug Route-ish path with no extension, `/`-separated.
 * @returns {string} The path Docusaurus actually serves.
 */
export function docsRoute(slug) {
  const parts = String(slug).split('/').filter(Boolean);
  const n = parts.length;
  if (n >= 2 && parts[n - 1] === parts[n - 2]) parts.pop();
  return parts.join('/');
}
