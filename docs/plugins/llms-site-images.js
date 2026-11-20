/**
 * Docusaurus plugin: runs docusaurus-plugin-llms, then says, in what it wrote,
 * that a live example's site images stand for the reader's own.
 *
 * The LLM plugin writes the per-page `.md` twins and `llms-full.txt` from the
 * source markdown, so a live example's `'/img/logo.svg'` reaches an agent as
 * written, and in the app the agent copies it into, it names a file that app
 * does not have. Once the plugin has written its files, this puts a note above
 * the first `jsx` or `tsx` example on each page that uses such a path, saying
 * it stands for a picture the reader's app serves (`noteSiteImagesInFences` in
 * `src/theme/CodeBlock/sandbox/site-images.mjs`, which says why the path is
 * not pointed at bestax.io instead). The site's own pages are unchanged.
 *
 * It wraps the LLM plugin rather than sitting beside it because Docusaurus
 * runs every plugin's `postBuild` at once, so a plugin of its own could run
 * before the files exist (scripts/check-generated-markers.mjs has the detail).
 * It takes the LLM plugin's options, unchanged.
 */

const { existsSync } = require('fs');
const { readdir, readFile, writeFile } = require('fs/promises');
const path = require('path');
const llms = require('docusaurus-plugin-llms').default;

/**
 * Where the LLM plugin writes what this notes: the twins, under the docs
 * pages' own route, and the full concatenation, at the build's root.
 * scripts/check-generated-markers.mjs reads them at the same paths, and fails
 * the build when either is missing.
 */
const TWINS_DIR = 'docs';
const FULL_TXT = 'llms-full.txt';

/**
 * What `llms-full.txt` puts between two pages: a rule, then the next page's
 * title as a `## ` heading, the page's own headings a level down. Each page is
 * noted on its own, so a fence one page leaves open cannot hide the next
 * page's examples.
 */
const PAGE_BREAK = '\n\n---\n\n## ';

/**
 * Notes every `.md` under `outDir/docs`, each one page, and each page of
 * `outDir/llms-full.txt`.
 *
 * @param {string} outDir The build directory.
 */
async function noteSiteImagesIn(outDir) {
  const { noteSiteImagesInFences } =
    await import('../src/theme/CodeBlock/sandbox/site-images.mjs');
  const twinsDir = path.join(outDir, TWINS_DIR);
  const twins = existsSync(twinsDir)
    ? (await readdir(twinsDir, { recursive: true }))
        .filter(rel => rel.endsWith('.md'))
        .map(rel => path.join(twinsDir, rel))
    : [];
  const full = path.join(outDir, FULL_TXT);
  const files = existsSync(full) ? [...twins, full] : twins;
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    let noted;
    if (file === full) {
      const pages = text.split(PAGE_BREAK);
      if (pages.length === 1 && twins.length > 1) {
        throw new Error(
          `llms-site-images: ${FULL_TXT} holds no PAGE_BREAK between the ` +
            'pages it joins, so docusaurus-plugin-llms joins them another ' +
            'way now. Update PAGE_BREAK to match.'
        );
      }
      noted = pages.map(noteSiteImagesInFences).join(PAGE_BREAK);
    } else {
      noted = noteSiteImagesInFences(text);
    }
    if (noted !== text) await writeFile(file, noted);
  }
}

/**
 * `plugin` with `noteSiteImagesIn` run after its own `postBuild`.
 *
 * @param {import('@docusaurus/types').Plugin} plugin The LLM plugin.
 */
function afterLlms(plugin) {
  if (typeof plugin.postBuild !== 'function') {
    throw new Error(
      'llms-site-images: docusaurus-plugin-llms no longer writes its files ' +
        'in postBuild, so there is nothing to run after. Find where it writes ' +
        'them now and move the note there.'
    );
  }
  return {
    ...plugin,
    async postBuild(props) {
      await plugin.postBuild(props);
      await noteSiteImagesIn(props.outDir);
    },
  };
}

module.exports = function llmsSiteImages(context, options) {
  return afterLlms(llms(context, options));
};
module.exports.afterLlms = afterLlms;
