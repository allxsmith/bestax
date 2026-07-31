import React from 'react';
import root from 'react-shadow';
import { LivePreview } from 'react-live';
import { useColorMode } from '@docusaurus/theme-common';
import {
  shadowStyleSheets,
  colorModeVars,
} from '@site/src/components/ShadowPreview/shadowStyles';
import useShadowStyleSheets, {
  useInstanceStyleSheet,
} from '@site/src/components/ShadowPreview/useShadowStyleSheets';
import { ShadowThemeContext, hostRule } from './ShadowTheme';

/**
 * The shadow root a live example renders into.
 *
 * Kept in its own module because it is the only thing that pulls in the ~1.1 MB
 * shadow stylesheet set; `@theme/CodeBlock` loads it lazily so pages without a
 * `live` fence never download it. Nothing here server-renders anyway — a shadow
 * root only exists in the browser.
 *
 * The base sheets are adopted and shared page-wide (see useShadowStyleSheets);
 * only `themeSheet`, which holds whatever `<Theme isRoot>` in the example set,
 * belongs to this instance.
 */
export default function ShadowLivePreview() {
  const { colorMode } = useColorMode();
  const themeSheet = useInstanceStyleSheet(null);
  const styleSheets = useShadowStyleSheets(themeSheet);

  // Fallback path only: the <style> element standing in for themeSheet.
  const themeStyleRef = React.useRef(null);

  const updateShadowTheme = React.useCallback(
    themeVars => {
      const css = hostRule(themeVars);
      if (themeSheet) {
        themeSheet.replaceSync(css);
      } else if (themeStyleRef.current) {
        themeStyleRef.current.textContent = css;
      }
    },
    [themeSheet]
  );

  // Re-apply the color-mode variables whenever the site theme flips. The
  // declarative :host(.dark)/:host(.light) rules in colorModeStyles cover the
  // common case; this keeps them pinned when an example's own <Theme isRoot>
  // has already written to the instance sheet.
  React.useEffect(() => {
    updateShadowTheme(colorModeVars[colorMode] ?? colorModeVars.light);
  }, [colorMode, updateShadowTheme]);

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

  return (
    <ShadowThemeContext.Provider value={updateShadowTheme}>
      <root.div
        mode="open"
        className={`live-preview ${colorMode}`}
        data-theme={colorMode}
        styleSheets={styleSheets ?? undefined}
      >
        {/* Fallback for browsers without constructable stylesheets. */}
        {!styleSheets && (
          <>
            {shadowStyleSheets.map((styles, i) => (
              <style key={i}>{styles}</style>
            ))}
            <style ref={themeStyleRef} />
          </>
        )}
        <div data-theme={colorMode}>
          <LivePreview />
        </div>
      </root.div>
    </ShadowThemeContext.Provider>
  );
}
