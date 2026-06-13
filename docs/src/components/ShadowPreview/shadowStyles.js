// Shared shadow-DOM style pipeline for live previews.
// Used by the docs live examples (src/theme/CodeBlock) and homepage previews.

// Import CSS for document head (fonts get processed by Docusaurus)
import '@fortawesome/fontawesome-free/css/all.min.css';
import '@mdi/font/css/materialdesignicons.min.css';
// Note: ionicons now uses web components, no CSS import needed
import 'material-icons/iconfont/material-icons.css';
import 'material-symbols/index.css';

// Import raw CSS for shadow DOM processing
import rawBulmaStyles from '!!raw-loader!bulma/css/bulma.min.css';
import rawBulmaPrefixedStyles from '!!raw-loader!bulma/css/versions/bulma-prefixed.min.css';
import rawFontAwesomeStyles from '!!raw-loader!@fortawesome/fontawesome-free/css/all.min.css';
import rawMDIStyles from '!!raw-loader!@mdi/font/css/materialdesignicons.min.css';
// Note: ionicons now uses web components, no raw CSS needed
import rawMaterialIconsStyles from '!!raw-loader!material-icons/iconfont/material-icons.css';
import rawMaterialSymbolsStyles from '!!raw-loader!material-symbols/index.css';
import rawExtrasStyles from '!!raw-loader!@allxsmith/bestax-bulma/dist/extras.css';

// Enhanced preprocessing function for better CSS variable handling
function preprocessBulmaStyles(rawStyles) {
  let processedStyles = rawStyles.replace(/:root/g, ':host');

  // Handle dark mode variables more comprehensively with nested group matching
  processedStyles = processedStyles.replace(
    /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g,
    ':host(.dark) { $1 }'
  );

  // Handle light mode variables
  processedStyles = processedStyles.replace(
    /@media\s*\(prefers-color-scheme:\s*light\)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g,
    ':host(.light) { $1 }'
  );

  return processedStyles;
}

// Add explicit color mode variables to ensure proper dark/light mode switching
export const colorModeStyles = `
  :host(.dark) {
    --bulma-text-strong: hsl(0, 0%, 96%) !important;
    --bulma-label-color: hsl(0, 0%, 96%) !important;
    --bulma-text: hsl(0, 0%, 96%) !important;
    --bulma-text-weak: hsl(0, 0%, 71%) !important;
    --bulma-background: hsl(0, 0%, 14%) !important;
    --bulma-surface: hsl(0, 0%, 21%) !important;
    --bulma-border: hsl(0, 0%, 29%) !important;
    --bulma-border-weak: hsl(0, 0%, 24%) !important;
  }

  :host(.light), :host {
    --bulma-text-strong: hsl(221, 14%, 21%) !important;
    --bulma-label-color: hsl(221, 14%, 21%) !important;
    --bulma-text: hsl(221, 14%, 31%) !important;
    --bulma-text-weak: hsl(221, 14%, 41%) !important;
    --bulma-background: hsl(0, 0%, 100%) !important;
    --bulma-surface: hsl(0, 0%, 98%) !important;
    --bulma-border: hsl(221, 14%, 86%) !important;
    --bulma-border-weak: hsl(221, 14%, 93%) !important;
  }
`;

// Preprocess: Replace :root with :host for Shadow DOM compatibility
// Also handle color mode classes instead of media queries
export const bulmaStyles = preprocessBulmaStyles(rawBulmaStyles);

export const bulmaPrefixedStyles = preprocessBulmaStyles(
  rawBulmaPrefixedStyles
);

export const fontAwesomeStyles = rawFontAwesomeStyles.replace(
  /:root/g,
  ':host'
);

export const mdiStyles = rawMDIStyles.replace(/:root/g, ':host');

// Note: ionicons now uses web components, no CSS processing needed

export const materialIconsStyles = rawMaterialIconsStyles
  .replace(/:root/g, ':host')
  .replace(/@font-face\s*{[^}]*}/g, ''); // Remove @font-face rules - use fonts from document head

export const materialSymbolsStyles = rawMaterialSymbolsStyles.replace(
  /:root/g,
  ':host'
);

export const extrasStyles = rawExtrasStyles.replace(/:root/g, ':host');

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

// Ordered as the <style> tags should appear inside a shadow root.
export const shadowStyleSheets = [
  materialIconsStyles,
  bulmaStyles,
  bulmaPrefixedStyles,
  fontAwesomeStyles,
  mdiStyles,
  ioniconStyles,
  materialSymbolsStyles,
  extrasStyles,
  colorModeStyles,
];
