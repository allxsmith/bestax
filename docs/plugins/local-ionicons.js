/**
 * Docusaurus plugin: serve the ionicons web components from this site instead
 * of unpkg.com.
 *
 * The live examples load ionicons v8, which ships as a Stencil bundle: a small
 * ESM loader that fetches its own lazy chunks and one SVG per icon, all
 * resolved relative to the loader's own URL. That is why it cannot simply be
 * imported through webpack — the runtime chunk names are not statically
 * analysable — and why it was originally pulled from a CDN.
 *
 * `ionicons` is already a declared dependency, so the CDN round-trip bought
 * nothing but a third-party availability and privacy dependency on every page
 * with a live preview. Copying `dist/ionicons` into the build keeps the loader's
 * relative resolution intact under /ionicons/, and the per-icon SVGs are still
 * fetched on demand — only the handful an example actually renders.
 */

const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

/**
 * Where the Stencil bundle lives inside the installed package.
 *
 * Resolved off the main entry (`<pkg>/dist/index.cjs.js`) rather than
 * `ionicons/package.json`, which the package's `exports` map does not expose.
 */
function ioniconsDistDir() {
  return path.join(path.dirname(require.resolve('ionicons')), 'ionicons');
}

module.exports = function localIonicons() {
  return {
    name: 'local-ionicons',

    configureWebpack(_config, isServer) {
      // The server build writes to a throwaway directory; emitting the assets
      // once, from the client compilation, is enough for both dev and build.
      if (isServer) {
        return {};
      }

      return {
        plugins: [
          new CopyPlugin({
            patterns: [{ from: ioniconsDistDir(), to: 'ionicons' }],
          }),
        ],
      };
    },
  };
};
