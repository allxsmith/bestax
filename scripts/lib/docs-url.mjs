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

// Docusaurus treats three filenames as a folder's index: `<folder>.md`,
// `index.md` and `README.md`. All three serve at the folder's own route.
// Verified locally for the index form: docs/docs/guides/llms/index.md builds to
// build/docs/guides/llms.html with no nested index.html.
const FOLDER_INDEX_NAMES = new Set(['index', 'readme']);

/**
 * Collapse a trailing folder-index segment.
 *
 *   docsRoute('grid/grid')       // 'grid'
 *   docsRoute('grid/index')      // 'grid'
 *   docsRoute('components/card') // 'components/card'
 *
 * Only the last segment collapses, matching Docusaurus: the rule is about a
 * file that indexes its own directory, not about repeated names further up the
 * path. No API page uses the index or README form today, so that half is
 * covering the shape rather than a live URL.
 *
 * @param {string} slug Route-ish path with no extension, `/`-separated.
 * @returns {string} The path Docusaurus actually serves.
 */
export function docsRoute(slug) {
  const parts = String(slug).split('/').filter(Boolean);
  const n = parts.length;
  if (n < 2) return parts.join('/');
  const last = parts[n - 1];
  if (last === parts[n - 2] || FOLDER_INDEX_NAMES.has(last.toLowerCase())) {
    parts.pop();
  }
  return parts.join('/');
}
