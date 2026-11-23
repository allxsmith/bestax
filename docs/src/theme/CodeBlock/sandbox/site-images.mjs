/**
 * A live example's pictures from the docs site's `static/img`, wherever the
 * example is read away from the site.
 *
 * On the page a root-relative path such as `'/img/logo.svg'` resolves against
 * the site. Copied anywhere else it resolves against that place's own address,
 * which has no `img` folder. Two kinds of place take the examples away, and
 * each finds the paths by the one matcher here, so they agree on which count:
 *
 * - A StackBlitz or CodeSandbox project (`example.mjs`) is a demo a reader
 *   opens and throws away, so it loads the pictures from the site the docs
 *   build names (`withSiteImages`, given `siteConfig.url`), and a picture a
 *   pull request adds shows in its sandboxes once it's deployed there.
 * - The copies agents read, the per-page `.md` twins and `llms-full.txt`
 *   (`docs/plugins/llms-site-images.js`) and the bestax-mcp index
 *   (`scripts/gen-mcp-index.mjs`), keep the path and say it stands for a
 *   picture the reader's app serves (`SITE_IMAGES_NOTE`, placed by
 *   `noteSiteImagesInFences` in markdown). An agent copies the code into an
 *   app, where a bestax.io address would tie the app to a file the site may
 *   rename, the rule skills/CLAUDE.md gives for a skill's example.
 *
 * The site's own pages keep the root-relative paths, so a preview deployment
 * shows its own pictures there.
 *
 * Dependency-free on purpose: the docs bundle, the docs build and the MCP
 * generator all load it. A change here that changes bestax-mcp's index ships
 * its regenerated index in a `bestax-mcp`-scoped commit of its own, or the
 * package never releases it (root CLAUDE.md, "Commits").
 */

/**
 * A path into the site's `static/img`, where it opens a string or a CSS
 * `url(`, which is where the page's own examples write one. A regex literal or
 * text that only mentions `/img/` does not count.
 */
const SITE_IMAGE = /(?<=['"`]|\burl\(\s*)\/img\//;

/**
 * What the copies agents read say about such a path: one sentence, which
 * reads the same as a note above an example and as a comment in one, where the
 * MCP server prints it.
 */
export const SITE_IMAGES_NOTE =
  'A path under /img/ here stands for a picture your own app serves, ' +
  'such as a file in its public/img/ folder.';

/**
 * Whether `code` loads a picture from the site's `static/img`.
 *
 * @param {string} code
 * @returns {boolean}
 */
export function hasSiteImages(code) {
  return SITE_IMAGE.test(code);
}

/**
 * The example's `/img/...` paths resolved against `pageUrl`, as the page
 * resolved them.
 *
 * @param {string} code
 * @param {string} pageUrl An address on the docs site, such as the page the
 *   example came from. A root-relative path resolves against its origin.
 * @returns {string}
 */
export function withSiteImages(code, pageUrl) {
  const images = new URL('/img/', pageUrl).href;
  return code.replace(new RegExp(SITE_IMAGE.source, 'g'), images);
}

/**
 * The fences whose code is an example: the languages the live examples are
 * written in, and the ones the MCP index takes a page's examples from.
 */
const EXAMPLE_LANGUAGE = /^(?:jsx|tsx)$/;

/** A line that can open or close a fence, at any indent, as in a list item. */
const FENCE_LINE = /^([ \t]*)(`{3,}|~{3,})(.*)$/;

/**
 * The markdown with `SITE_IMAGES_NOTE` above its first `jsx` or `tsx` fence
 * that loads a picture from the site, at that fence's indent, once. A caller
 * whose markdown is read in parts notes each part. Prose, and a fence in any
 * other language, which may show the reader's own files, are not read. A fence
 * closes on a run of its own character at least as long, with nothing after
 * it, indented at most three more than the run that opened it, and one never
 * closed runs to the end.
 *
 * @param {string} markdown
 * @returns {string}
 */
export function noteSiteImagesInFences(markdown) {
  if (!hasSiteImages(markdown)) return markdown;
  const out = [];
  let fence = null;
  let noted = false;
  const close = () => {
    if (fence.example && !noted && hasSiteImages(fence.code.join('\n'))) {
      const note = `${fence.indent}> ${SITE_IMAGES_NOTE}`;
      const before = out[fence.at - 1];
      out.splice(
        fence.at,
        0,
        ...(before?.trim() ? ['', note, ''] : [note, ''])
      );
      noted = true;
    }
    fence = null;
  };
  for (const line of markdown.split('\n')) {
    const marker = line.match(FENCE_LINE);
    if (!fence) {
      // A backtick fence's info string cannot hold a backtick, so a line that
      // has one after the run is inline code, not a fence.
      if (marker && !(marker[2][0] === '`' && marker[3].includes('`'))) {
        fence = {
          indent: marker[1],
          run: marker[2],
          example: EXAMPLE_LANGUAGE.test(marker[3].trim().split(/\s+/)[0]),
          at: out.length,
          code: [],
        };
      }
      out.push(line);
    } else if (
      marker &&
      marker[1].length <= fence.indent.length + 3 &&
      marker[2][0] === fence.run[0] &&
      marker[2].length >= fence.run.length &&
      !marker[3].trim()
    ) {
      out.push(line);
      close();
    } else {
      fence.code.push(line);
      out.push(line);
    }
  }
  if (fence) close();
  return out.join('\n');
}
