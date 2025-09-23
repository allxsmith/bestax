import React, { useState, useEffect } from 'react';
import OriginalCodeBlock from '@theme-init/CodeBlock';
// import LiveCodeBlock from '@theme/LiveCodeBlock';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
import root from 'react-shadow'; // Import from react-shadow
import { useColorMode } from '@docusaurus/theme-common';
import * as BestaxBulma from '@allxsmith/bestax-bulma';
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
import BrowserWindow from './BrowserWindow';

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
const colorModeStyles = `
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
const bulmaStyles = preprocessBulmaStyles(rawBulmaStyles);

const bulmaPrefixedStyles = preprocessBulmaStyles(rawBulmaPrefixedStyles);

const fontAwesomeStyles = rawFontAwesomeStyles.replace(/:root/g, ':host');

const mdiStyles = rawMDIStyles.replace(/:root/g, ':host');

// Note: ionicons now uses web components, no CSS processing needed

const materialIconsStyles = rawMaterialIconsStyles
  .replace(/:root/g, ':host')
  .replace(/@font-face\s*{[^}]*}/g, ''); // Remove @font-face rules - use fonts from document head

const materialSymbolsStyles = rawMaterialSymbolsStyles.replace(
  /:root/g,
  ':host'
);

// Add specific CSS for ionicons web components
const ioniconStyles = `
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

function isLiveCodeBlock(props) {
  return !!props.live;
}

// Helper: extract title from props.metastring if props.title is not set
function extractTitleFromMeta(metastring) {
  if (typeof metastring !== 'string') return undefined;
  const match = metastring.match(/(?:^|\s)title="([^"]+)"(?:\s|$)/);
  return match ? match[1] : undefined;
}

/**
 * Updates a style element in the shadow DOM with the provided theme variables.
 *
 * @param {HTMLStyleElement} styleElement - The style element to update within the shadow DOM.
 * @param {Object} themeVars - An object mapping CSS variable names (e.g., '--bulma-primary') to their values.
 * This function sets the text content of the style element to a :host CSS block containing the variables.
 */
function updateShadowThemeElement(styleElement, themeVars) {
  if (styleElement && styleElement.parentNode) {
    let cssVars = '';
    Object.entries(themeVars).forEach(([key, value]) => {
      cssVars += `${key}: ${value};\n`;
    });

    const cssContent = cssVars ? `:host {\n${cssVars}\n}` : '';
    styleElement.textContent = cssContent;
  }
}

// Context to provide shadow DOM theme update function
const ShadowThemeContext = React.createContext(null);

// Custom Theme component that works with shadow DOM (for isRoot={true} only)
/**
 * ShadowTheme is a React component that manages theming for components rendered inside a shadow DOM.
 * It updates CSS custom properties (variables) in the shadow DOM based on provided theme props.
 *
 * @param {Object} props - The props for the component.
 * @param {React.ReactNode} props.children - Child components to render.
 * @param {Object} [props.bulmaVars] - An object containing Bulma CSS variable overrides (key-value pairs).
 * @param {boolean} [props.isRoot] - If true, applies global theming to the shadow DOM root.
 * @param {Object} [themeProps] - Additional theme properties, each mapped to a CSS variable (--bulma-<prop>).
 * @returns {React.ReactNode} The rendered children.
 *
 * This component only applies theming when isRoot is true. It uses the ShadowThemeContext to update
 * CSS variables in the shadow DOM, supporting both Bulma variables and custom theme properties.
 */
function ShadowTheme({ children, bulmaVars, isRoot, ...themeProps }) {
  const updateShadowTheme = React.useContext(ShadowThemeContext);

  React.useEffect(() => {
    // Only handle global theming (isRoot={true}) in shadow DOM
    if (!isRoot || !updateShadowTheme) {
      return;
    }

    // Prepare the theme variables
    const themeVars = {};

    // Handle bulmaVars object
    if (bulmaVars) {
      Object.entries(bulmaVars).forEach(([key, value]) => {
        themeVars[key] = value;
      });
    }

    // Handle individual theme props
    Object.entries(themeProps).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        // Convert camelCase to kebab-case and add bulma prefix
        const cssVar = `--bulma-${key
          .replace(/([A-Z])/g, '-$1')
          .toLowerCase()}`;
        themeVars[cssVar] = value;
      }
    });

    // Update the shadow DOM theme
    updateShadowTheme(themeVars);
  }, [bulmaVars, isRoot, themeProps, updateShadowTheme]);

  // For shadow DOM global theming, don't render any wrapper
  return <>{children}</>;
}

// Smart Theme selector that chooses between regular Theme and ShadowTheme
/**
 * Selects the appropriate theme component based on the isRoot parameter.
 * If isRoot is true, uses ShadowTheme for global theming in a shadow DOM context.
 * Otherwise, uses the regular Theme component for local theming.
 *
 * @param {Object} props - The props for the theme component.
 * @param {boolean} [props.isRoot=false] - Whether to use ShadowTheme (true) or RegularTheme (false).
 * @param {React.ReactNode} props.children - The child elements to render within the theme.
 * @returns {React.ReactElement} The themed component.
 */
function SmartTheme({ isRoot = false, children, ...props }) {
  const { Theme: RegularTheme } = BestaxBulma;

  if (isRoot) {
    // Use ShadowTheme for global theming in shadow DOM
    return (
      <ShadowTheme isRoot={isRoot} {...props}>
        {children}
      </ShadowTheme>
    );
  } else {
    // Use regular Theme component for local theming
    return (
      <RegularTheme isRoot={isRoot} {...props}>
        {children}
      </RegularTheme>
    );
  }
}

// Define a transform function to remove import lines and export default statements
function transformCode(code) {
  // Split into lines, filter out those starting with 'import' or 'export default' (after trimming whitespace),
  // and rejoin. This handles single-line imports and exports; for multi-line, adjust if your examples use them.
  return code
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      return (
        !trimmed.startsWith('import') && !trimmed.startsWith('export default')
      );
    })
    .join('\n');
}

// If needed, extend the scope to include your bestax-bulma components for use in live code
const scope = {
  ...BestaxBulma,
  Theme: SmartTheme, // Override with our smart Theme selector
  React,
  useState,
  useEffect,
};

function BrowserEditor({ title }) {
  return (
    <BrowserWindow url={title}>
      <LiveEditor
        style={{
          backgroundColor: 'var(--prism-background-color)',
          font: 'var(--ifm-code-font-size) / var(--ifm-pre-line-height) var(--ifm-font-family-monospace)',
        }}
      />
    </BrowserWindow>
  );
}

export default function CodeBlockEnhancer(props) {
  const { colorMode } = useColorMode();
  const shadowRef = React.useRef();
  const [themeStyleElement, setThemeStyleElement] = React.useState(null);

  // Function to update the shadow DOM theme
  const updateShadowTheme = React.useCallback(
    themeVars => {
      if (themeStyleElement) {
        updateShadowThemeElement(themeStyleElement, themeVars);
      }
    },
    [themeStyleElement]
  );

  // Update shadow DOM class and color variables when color mode changes
  React.useEffect(() => {
    if (shadowRef.current) {
      // Update the host element class to reflect current color mode
      shadowRef.current.className = `live-preview ${colorMode}`;

      // Apply explicit color mode variables for better consistency
      if (updateShadowTheme) {
        const colorModeVars =
          colorMode === 'dark'
            ? {
                '--bulma-text-strong': 'hsl(0, 0%, 96%)',
                '--bulma-label-color': 'hsl(0, 0%, 96%)',
                '--bulma-text': 'hsl(0, 0%, 96%)',
                '--bulma-text-weak': 'hsl(0, 0%, 71%)',
                '--bulma-background': 'hsl(0, 0%, 14%)',
                '--bulma-surface': 'hsl(0, 0%, 21%)',
                '--bulma-border': 'hsl(0, 0%, 29%)',
                '--bulma-border-weak': 'hsl(0, 0%, 24%)',
              }
            : {
                '--bulma-text-strong': 'hsl(221, 14%, 21%)',
                '--bulma-label-color': 'hsl(221, 14%, 21%)',
                '--bulma-text': 'hsl(221, 14%, 31%)',
                '--bulma-text-weak': 'hsl(221, 14%, 41%)',
                '--bulma-background': 'hsl(0, 0%, 100%)',
                '--bulma-surface': 'hsl(0, 0%, 98%)',
                '--bulma-border': 'hsl(221, 14%, 86%)',
                '--bulma-border-weak': 'hsl(221, 14%, 93%)',
              };

        updateShadowTheme(colorModeVars);
      }
    }
  }, [colorMode, updateShadowTheme]);

  React.useEffect(() => {
    // Set up the shadow style element reference after component mounts
    const setupShadowStyleElement = () => {
      if (shadowRef.current && shadowRef.current.shadowRoot) {
        const styleElement =
          shadowRef.current.shadowRoot.querySelector('#theme-vars');
        if (styleElement) {
          setThemeStyleElement(styleElement);
          return styleElement;
        }
      }
      return null;
    };

    // Try immediately, and if not ready, try with a short delay
    let styleElement = setupShadowStyleElement();
    let timeoutId = null;

    if (!styleElement) {
      const SHADOW_DOM_INIT_TIMEOUT_MS = 50;
      timeoutId = setTimeout(() => {
        styleElement = setupShadowStyleElement();
      }, SHADOW_DOM_INIT_TIMEOUT_MS); // Give shadow DOM time to initialize
    }

    // Cleanup on unmount
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      setThemeStyleElement(null);
    };
  }, []);

  // Load ionicons v8 web components support in live examples
  React.useEffect(() => {
    // Load ionicons via script tags for better compatibility with shadow DOM
    if (!document.querySelector('script[src*="ionicons"]')) {
      // Load ESM version
      const esmScript = document.createElement('script');
      esmScript.type = 'module';
      esmScript.src =
        'https://unpkg.com/ionicons@8.0.13/dist/ionicons/ionicons.esm.js';
      document.head.appendChild(esmScript);

      // Load fallback version
      const fallbackScript = document.createElement('script');
      fallbackScript.setAttribute('nomodule', '');
      fallbackScript.src =
        'https://unpkg.com/ionicons@8.0.13/dist/ionicons/ionicons.js';
      document.head.appendChild(fallbackScript);
    }
  }, []);

  const liveTitle = props.title ?? extractTitleFromMeta(props.metastring);

  return isLiveCodeBlock(props) ? (
    <ShadowThemeContext.Provider value={updateShadowTheme}>
      <LiveProvider
        code={props.children}
        scope={scope} /* other props as needed */
        transformCode={transformCode}
      >
        <root.div
          mode="open"
          className={`live-preview ${colorMode}`}
          data-theme={colorMode}
          ref={shadowRef}
        >
          <style>{materialIconsStyles}</style>
          <style>{bulmaStyles}</style>
          <style>{bulmaPrefixedStyles}</style>
          <style>{fontAwesomeStyles}</style>
          <style>{mdiStyles}</style>
          <style>{ioniconStyles}</style>
          <style>{materialSymbolsStyles}</style>
          <style>{colorModeStyles}</style>
          <style id="theme-vars"></style>
          <div data-theme={colorMode}>
            <LivePreview />
          </div>
        </root.div>
        <LiveError className="live-error alert alert--danger" />
        <BrowserEditor title={liveTitle} />
      </LiveProvider>
    </ShadowThemeContext.Provider>
  ) : (
    <OriginalCodeBlock {...props} />
  );
}
