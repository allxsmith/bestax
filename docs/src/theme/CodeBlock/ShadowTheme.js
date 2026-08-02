import React from 'react';
import * as BestaxBulma from '@allxsmith/bestax-bulma';

/**
 * Carries the live preview's "write these CSS variables into the shadow root"
 * callback down to the `Theme` component running inside the example.
 *
 * Lives in its own module so the code block (which puts `SmartTheme` in the
 * react-live scope) and the lazily loaded shadow preview share one context
 * identity without the former pulling in the latter's stylesheet payload.
 */
export const ShadowThemeContext = React.createContext(null);

/**
 * Builds a `:host { … }` rule from a `{ '--bulma-x': value }` map.
 * Returns an empty string for an empty map, so the sheet clears cleanly.
 */
export function hostRule(themeVars) {
  const declarations = Object.entries(themeVars)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n');

  return declarations ? `:host {\n${declarations}\n}` : '';
}

/**
 * Theme replacement for `isRoot` theming inside a shadow root.
 *
 * The library's `Theme` writes `isRoot` variables to `:root`, which a shadow
 * tree never sees, so global theming is routed through ShadowThemeContext to
 * the preview's own stylesheet instead.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render.
 * @param {Object} [props.bulmaVars] - Bulma CSS variable overrides (key-value pairs).
 * @param {boolean} [props.isRoot] - If true, applies global theming to the shadow DOM root.
 * @returns {React.ReactNode} The rendered children.
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
export default function SmartTheme({ isRoot = false, children, ...props }) {
  const { Theme: RegularTheme } = BestaxBulma;

  if (isRoot) {
    // Use ShadowTheme for global theming in shadow DOM
    return (
      <ShadowTheme isRoot={isRoot} {...props}>
        {children}
      </ShadowTheme>
    );
  }

  // Use regular Theme component for local theming
  return (
    <RegularTheme isRoot={isRoot} {...props}>
      {children}
    </RegularTheme>
  );
}
