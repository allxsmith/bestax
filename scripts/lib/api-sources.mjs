/**
 * Hand-maintained data the API docs generator cannot derive from source.
 *
 * Keep these keyed by the page's frontmatter `title:` (the exported component
 * name), which is the same key `gen-component-catalog.mjs` uses.
 */

/**
 * Categories whose pages are generator-managed. Adding a category here makes
 * `check:conformance` enforce the section order and the marker pairs on every
 * page in it, so only add one in the PR that migrates it.
 */
export const MANAGED_CATEGORIES = new Set(['layout']);

/**
 * Pages that opt out of generation entirely.
 *
 * `helpers/` is structurally different — those pages document hooks and utility
 * functions with an `## API` section and a `ts` signature block rather than a
 * props table, and two of the six have no 1:1 source module at all.
 */
export const GENERATED_EXEMPT = new Set(['helpers']);

/**
 * Which SCSS partial(s) register a component's CSS variables.
 *
 * `[]` means "verified: this component registers none" and suppresses the
 * `## CSS & Sass Variables` section. A component in a managed category that is
 * MISSING from this map is a hard error — the same completeness idiom as
 * `gen-component-catalog.mjs`'s `UNDOCUMENTED_EXPORTS`, so a new component
 * cannot silently lose the section.
 *
 * `pkg: 'bulma'`   -> resolved under node_modules/bulma (stock Bulma components)
 * `pkg: 'repo'`    -> repo-relative (the "extras" in bulma-ui/src/scss)
 * `root`           -> override the auto-derived root class, needed only where
 *                     one partial serves two components (title.scss).
 */
export const SCSS_SOURCES = {
  // layout/ — all stock Bulma.
  Container: [], // has $container-offset/$container-max-width, but no register-vars
  Footer: [{ pkg: 'bulma', path: 'sass/layout/footer.scss' }],
  Hero: [{ pkg: 'bulma', path: 'sass/layout/hero.scss' }],
  Level: [{ pkg: 'bulma', path: 'sass/layout/level.scss' }],
  Media: [{ pkg: 'bulma', path: 'sass/layout/media.scss' }],
  Section: [{ pkg: 'bulma', path: 'sass/layout/section.scss' }],
};

/**
 * Pages whose `## Import` block deliberately imports more than the page's own
 * component, because the component is not usable alone (`Table` with its cell
 * elements) or is always shown with a companion.
 *
 * Seed a category's entries when migrating that category. Every `layout/` page
 * is a plain single-name import, hence the empty map today.
 */
export const IMPORT_COMPANIONS = {};
