/**
 * Docusaurus plugin: keep icon-font `@font-face` rules out of cssnano's
 * `discardUnused` pass.
 *
 * Docusaurus minifies production CSS with `@docusaurus/cssnano-preset`, which
 * wraps `cssnano-preset-advanced`. That preset enables `discardUnused`, which
 * drops any `@font-face` whose family it cannot see referenced by a
 * `font-family` declaration.
 *
 * Font Awesome v7 never names its family literally in a declaration — every
 * rule resolves it through a custom property:
 *
 *   .fas { --_fa-family: var(--fa-family, var(--fa-style-family, "Font Awesome 7 Free"));
 *          font-family: var(--_fa-family); }
 *
 * `discardUnused` cannot follow that indirection, so all ten of Font Awesome's
 * `@font-face` rules are stripped from the production bundle while the class
 * rules survive. Every `<i class="fas fa-star">` then renders as a blank box:
 * the glyph is requested from a family the document never defined. The icon
 * webfonts are still emitted to `assets/fonts/`, just never referenced.
 *
 * The fix is to turn off `discardUnused` for `@font-face` only. Rather than
 * re-declare the preset (which would make `@docusaurus/cssnano-preset` a
 * direct dependency), this re-uses whichever preset Docusaurus already
 * configured and passes it our option — the preset is a function that spreads
 * its argument into `cssnano-preset-advanced`.
 *
 * Keyframes, counter-styles and namespaces are left alone; only font faces are
 * exempted. This also protects the Material Icons / Material Symbols / MDI
 * faces from regressing the same way if those packages adopt `var()`-based
 * families.
 */

const FONT_FACE_OPTIONS = { discardUnused: { fontFace: false } };

/** Identifies the css-minimizer-webpack-plugin instance in a minimizer list. */
function isCssMinimizer(minimizer) {
  return (
    minimizer &&
    typeof minimizer === 'object' &&
    minimizer.constructor &&
    minimizer.constructor.name === 'CssMinimizerPlugin'
  );
}

/**
 * Collects every cssnano options object that carries a `preset`.
 *
 * css-minimizer-webpack-plugin has moved this around between versions, and
 * Docusaurus runs two minifiers in sequence, so the preset can sit at either
 * `options.minimizerOptions` (a single object) or `options.minimizer.options`
 * (one entry per minifier — cssnano first, clean-css second). Both shapes are
 * handled so a Docusaurus upgrade degrades to a no-op instead of a crash.
 */
function findPresetHolders(minimizer) {
  const holders = [];

  const visit = value => {
    if (!value || typeof value !== 'object') {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if ('preset' in value) {
      holders.push(value);
    }
  };

  const options = minimizer.options || {};
  visit(options.minimizerOptions);
  if (options.minimizer) {
    visit(options.minimizer.options);
  }

  return holders;
}

module.exports = function preserveFontFace() {
  return {
    name: 'preserve-font-face',

    configureWebpack(config) {
      // Only the production client bundle is minified; in dev there is no
      // minimizer array to patch and the raw CSS keeps its @font-face rules.
      const minimizers = config.optimization && config.optimization.minimizer;
      if (!Array.isArray(minimizers)) {
        return {};
      }

      for (const minimizer of minimizers) {
        if (!isCssMinimizer(minimizer)) {
          continue;
        }

        // Mutating the plugin instance is what takes effect: webpack-merge
        // copies the minimizer array by reference, so the patched instance is
        // the one that ends up running.
        for (const holder of findPresetHolders(minimizer)) {
          const { preset } = holder;

          // Docusaurus sets `preset` to a resolved module path. Re-use it and
          // hand it our options; a preset already carrying options is merged.
          if (typeof preset === 'string') {
            holder.preset = [preset, FONT_FACE_OPTIONS];
          } else if (Array.isArray(preset) && preset.length > 0) {
            holder.preset = [preset[0], { ...preset[1], ...FONT_FACE_OPTIONS }];
          }
          // Any other shape (an inlined preset function, say) is left alone
          // rather than risk breaking minification.
        }
      }

      return {};
    },
  };
};
