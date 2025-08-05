import React, { useState, useEffect } from 'react';
import OriginalCodeBlock from '@theme-init/CodeBlock';
// import LiveCodeBlock from '@theme/LiveCodeBlock';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
import root from 'react-shadow'; // Import from react-shadow
import { useColorMode } from '@docusaurus/theme-common';
import * as BestaxBulma from '@allxsmith/bestax-bulma';
import rawBulmaStyles from '!!raw-loader!bulma/css/bulma.min.css';
import rawFontAwesomeStyles from '!!raw-loader!@fortawesome/fontawesome-free/css/all.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import BrowserWindow from '../../components/ BrowserWindow';

// Preprocess: Replace :root with :host for Shadow DOM compatibility
// Also handle color mode classes instead of media queries
const bulmaStyles = rawBulmaStyles
  .replace(/:root/g, ':host')
  .replace(/@media\s*\(prefers-color-scheme:\s*dark\)\s*{/g, ':host(.dark) {')
  .replace(
    /@media\s*\(prefers-color-scheme:\s*light\)\s*{/g,
    ':host(.light) {'
  );

const fontAwesomeStyles = rawFontAwesomeStyles
  .replace(/:root/g, ':host') // Fix vars like Bulma
  .replace(/url\(\.\.\/webfonts\//g, 'url(/webfonts/');

function isLiveCodeBlock(props) {
  return !!props.live;
}

// Function to update a shadow DOM style element with theme variables
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
      if (value !== undefined) {
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

// Define a transform function to remove import lines
function transformCode(code) {
  // Split into lines, filter out those starting with 'import' (after trimming whitespace),
  // and rejoin. This handles single-line imports; for multi-line, adjust if your examples use them.
  return code
    .split('\n')
    .filter(line => !line.trim().startsWith('import'))
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

  // Update shadow DOM class when color mode changes
  React.useEffect(() => {
    if (shadowRef.current) {
      // Update the host element class to reflect current color mode
      shadowRef.current.className = `live-preview ${colorMode}`;
    }
  }, [colorMode]);

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
      timeoutId = setTimeout(() => {
        styleElement = setupShadowStyleElement();
      }, 50); // Give shadow DOM time to initialize
    }

    // Cleanup on unmount
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      setThemeStyleElement(null);
    };
  }, []);

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
          <style>{bulmaStyles}</style>
          <style>{fontAwesomeStyles}</style>
          <style id="theme-vars"></style>
          <div data-theme={colorMode}>
            <LivePreview />
          </div>
        </root.div>
        <LiveError className="live-error alert alert--danger" />
        <BrowserWindow>
          <LiveEditor
            style={{
              backgroundColor: 'var(--prism-background-color)',
              font: 'var(--ifm-code-font-size) / var(--ifm-pre-line-height) var(--ifm-font-family-monospace)',
            }}
          />
        </BrowserWindow>
      </LiveProvider>
    </ShadowThemeContext.Provider>
  ) : (
    <OriginalCodeBlock {...props} />
  );
}
