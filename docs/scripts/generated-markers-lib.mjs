/**
 * The `<!-- bestax:generated <id> -->` marker pattern and the function that
 * strips it, with no side effects, so both strip-generated-markers.mjs and
 * scripts/gen-skills-repo.mjs can import it. That script runs main() on
 * import, which a guard on process.argv cannot reliably skip: node gives the
 * main module its real path while argv keeps a symlinked one.
 */
export const MARKER =
  /^[ \t]*<!--[ \t]*\/?bestax:generated[ \t][^>]*-->[ \t]*\r?\n?/gm;

/**
 * `src` with every marker line removed. Removing a marker line leaves the
 * blank line that followed it, which would open a gap mid-paragraph, so runs
 * of 3+ newlines collapse back to 2. scripts/gen-skills-repo.mjs strips the
 * README it publishes to allxsmith/bestax-skills with this too.
 */
export function stripGeneratedMarkers(src) {
  return src.replace(MARKER, '').replace(/\n{3,}/g, '\n\n');
}
