// Shared shadow-DOM style pipeline for live previews.
// Used by the docs live examples (src/theme/CodeBlock) and homepage previews.
//
// The style set is ~1.1 MB of CSS. There is one live preview per `live` code
// fence and the heaviest API page has 42 of them, so the sheets are parsed
// once at module scope into constructable CSSStyleSheets and *shared* by every
// shadow root via `adoptedStyleSheets` (see getSharedStyleSheets below).
// Emitting them as <style> children instead would reparse the whole set per
// preview — 42x on that page.

// Import CSS for document head (fonts get processed by Docusaurus)
import '@fortawesome/fontawesome-free/css/all.min.css';
import '@mdi/font/css/materialdesignicons.min.css';
// Note: ionicons now uses web components, no CSS import needed
import 'material-icons/iconfont/material-icons.css';
import 'material-symbols/index.css';

// Import raw CSS for shadow DOM processing
// The stylesheet an app installs: Bulma compiled with bestax's configuration,
// its primary color among it, plus the extras. Loading it rather than stock
// Bulma and extras.css means a preview shows exactly what
// `import '@allxsmith/bestax-bulma/bestax.css'` gives the reader.
import rawBestaxStyles from '!!raw-loader!@allxsmith/bestax-bulma/dist/bestax.css';
import rawFontAwesomeStyles from '!!raw-loader!@fortawesome/fontawesome-free/css/all.min.css';
import rawMDIStyles from '!!raw-loader!@mdi/font/css/materialdesignicons.min.css';
// Note: ionicons now uses web components, no raw CSS needed
import rawMaterialIconsStyles from '!!raw-loader!material-icons/iconfont/material-icons.css';
import rawMaterialSymbolsStyles from '!!raw-loader!material-symbols/index.css';
// Docs-only Skill Example styles (ProfileCard) — not part of the shipped CSS bundle.
import rawProfileCardStyles from '!!raw-loader!@site/src/components/SkillExamples/profilecard.css';

/** Custom properties only reach the preview when scoped to the shadow host. */
function toHost(rawStyles) {
  return rawStyles.replace(/:root/g, ':host');
}

/**
 * Drops `@font-face` from a sheet bound for a shadow root.
 *
 * These sheets are read through `raw-loader`, which — unlike Docusaurus' normal
 * CSS pipeline — does not rewrite `url()`, so the rules keep package-relative
 * paths (`url(../webfonts/fa-solid-900.woff2)`) that would resolve against the
 * page URL rather than the stylesheet.
 *
 * They are dead weight rather than a live bug: browsers do not register
 * `@font-face` declared inside a shadow tree (verified in Chromium 141 — no
 * request is issued for such a rule, and the docs previews make no failing font
 * requests either way). What actually registers the families is the plain CSS
 * imports at the top of this file, where webpack rewrites the URLs and emits
 * the webfonts to assets/fonts/; shadow content matches against those.
 *
 * This runs at module init, not build time, so the raw text still ships in the
 * chunk — it drops ~14 inert rules from the shared sheets once per page load,
 * not once per preview, since every root now adopts the same objects. The point
 * is uniformity rather than volume: `materialIconsStyles` already did exactly
 * this, with the same reasoning, and the other three sheets were simply never
 * given the same fix.
 */
function stripFontFace(rawStyles) {
  return rawStyles.replace(/@font-face\s*{[^}]*}/g, '');
}

/**
 * Readies bestax.css for a shadow root: `:root` becomes `:host`, and Bulma's
 * scheme variables, which it declares in `@media (prefers-color-scheme)` as a
 * lone `:root` rule, move onto the host's `.dark`/`.light` class, so the
 * reader's OS setting doesn't pick a preview's palette.
 *
 * Only those variable blocks move. A scheme rule of the extras' own, such as
 * Switch's light-scheme circle, keeps its media query, as it does in an app.
 */
function preprocessBulmaStyles(rawStyles) {
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

/**
 * The eight `--bulma-*` variables the previews must pin per color mode.
 *
 * Exported because the same map is needed twice: baked into `colorModeStyles`
 * below (the declarative path, used by every preview) and pushed imperatively
 * through the per-instance theme sheet when the color mode changes.
 */
export const colorModeVars = {
  dark: {
    '--bulma-text-strong': 'hsl(0, 0%, 96%)',
    '--bulma-label-color': 'hsl(0, 0%, 96%)',
    '--bulma-text': 'hsl(0, 0%, 96%)',
    '--bulma-text-weak': 'hsl(0, 0%, 71%)',
    '--bulma-background': 'hsl(0, 0%, 14%)',
    '--bulma-surface': 'hsl(0, 0%, 21%)',
    '--bulma-border': 'hsl(0, 0%, 29%)',
    '--bulma-border-weak': 'hsl(0, 0%, 24%)',
  },
  light: {
    '--bulma-text-strong': 'hsl(221, 14%, 21%)',
    '--bulma-label-color': 'hsl(221, 14%, 21%)',
    '--bulma-text': 'hsl(221, 14%, 31%)',
    '--bulma-text-weak': 'hsl(221, 14%, 41%)',
    '--bulma-background': 'hsl(0, 0%, 100%)',
    '--bulma-surface': 'hsl(0, 0%, 98%)',
    '--bulma-border': 'hsl(221, 14%, 86%)',
    '--bulma-border-weak': 'hsl(221, 14%, 93%)',
  },
};

/** Renders a `{ '--var': value }` map as declarations, one per line. */
function declarations(vars, indent = '    ') {
  return Object.entries(vars)
    .map(([key, value]) => `${indent}${key}: ${value} !important;`)
    .join('\n');
}

// Add explicit color mode variables to ensure proper dark/light mode switching
export const colorModeStyles = `
  :host(.dark) {
${declarations(colorModeVars.dark)}
  }

  :host(.light), :host {
${declarations(colorModeVars.light)}
  }
`;

// Preprocess: Replace :root with :host for Shadow DOM compatibility
// Also handle color mode classes instead of media queries
export const bestaxStyles = preprocessBulmaStyles(rawBestaxStyles);

export const fontAwesomeStyles = stripFontFace(toHost(rawFontAwesomeStyles));

export const mdiStyles = stripFontFace(toHost(rawMDIStyles));

// Note: ionicons now uses web components, no CSS processing needed

export const materialIconsStyles = stripFontFace(
  toHost(rawMaterialIconsStyles)
);

export const materialSymbolsStyles = stripFontFace(
  toHost(rawMaterialSymbolsStyles)
);

// Docs-only Skill Example (ProfileCard) styles for the shadow-DOM live previews.
export const profileCardStyles = toHost(rawProfileCardStyles);

// Add specific CSS for ionicons web components
export const ioniconStyles = `
  ion-icon {
    display: inline-block !important;
    width: 1em;
    height: 1em;
    vertical-align: middle;
    fill: currentColor;
    stroke: currentColor;
  }
  ion-icon svg {
    display: block !important;
    width: 100%;
    height: 100%;
  }
`;

// Overlays an example opens cover the docs navbar, as they would a Bulma
// navbar in an app. Each keeps its own layer on top of the navbar's, so their
// order among themselves stays the library's, and where the library puts one
// in the page's flow (a wide AppFrame's column, a static Sidebar) its own,
// more specific rule still wins. Popovers, hover cards and menus are anchored
// to the page and left alone, to scroll under the sticky navbar with what they
// belong to. Something an example portals from inside one of these overlays,
// such as an `appendToBody` panel or a toast, then sits under it, so give it a
// `portalContainer` inside the overlay. Bulma declares `--bulma-modal-z` on
// `.modal` itself, so that's where this sets it, and being the last sheet is
// what wins.
export const overlayLayerStyles = `
  .modal { --bulma-modal-z: calc(var(--ifm-z-index-fixed, 200) + 40); }
  .sidebar-background { z-index: calc(var(--ifm-z-index-fixed, 200) + 39); }
  .sidebar { z-index: calc(var(--ifm-z-index-fixed, 200) + 40); }
  .loading.is-full-page { z-index: calc(var(--ifm-z-index-fixed, 200) + 70); }
  .app-frame-backdrop { z-index: calc(var(--ifm-z-index-fixed, 200) + 39); }
  .app-frame-nav { z-index: calc(var(--ifm-z-index-fixed, 200) + 40); }
  .app-frame-skip-link:focus {
    z-index: calc(var(--ifm-z-index-fixed, 200) + 40);
  }
`;

// Ordered as the sheets should cascade inside a shadow root.
export const shadowStyleSheets = [
  materialIconsStyles,
  bestaxStyles,
  fontAwesomeStyles,
  mdiStyles,
  ioniconStyles,
  materialSymbolsStyles,
  profileCardStyles,
  colorModeStyles,
  overlayLayerStyles,
];

/** True when the browser supports constructable stylesheets. */
export function supportsConstructableStyleSheets() {
  return (
    typeof CSSStyleSheet !== 'undefined' &&
    typeof CSSStyleSheet.prototype.replaceSync === 'function'
  );
}

let sharedStyleSheets = null;

/**
 * The shared, immutable base sheets every preview adopts.
 *
 * Parsed lazily on first use and memoized for the life of the page, so N
 * previews cost one parse rather than N. Returns `null` during SSR (no
 * `CSSStyleSheet` in Node) and on browsers without constructable stylesheets
 * (Safari < 16.4) — both callers fall back to <style> children there.
 */
export function getSharedStyleSheets() {
  if (!supportsConstructableStyleSheets()) {
    return null;
  }

  if (!sharedStyleSheets) {
    sharedStyleSheets = shadowStyleSheets.map(css => {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      return sheet;
    });
  }

  return sharedStyleSheets;
}
