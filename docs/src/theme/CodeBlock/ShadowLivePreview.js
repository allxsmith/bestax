import React from 'react';
import root from 'react-shadow';
import { LivePreview } from 'react-live';
import { useColorMode } from '@docusaurus/theme-common';
import useBaseUrl from '@docusaurus/useBaseUrl';
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

  // Load ionicons v8 web components support in live examples.
  // Served from this origin by plugins/local-ionicons.js; script tags rather
  // than an import because the Stencil bundle resolves its own lazy chunks and
  // per-icon SVGs relative to the loader's URL.
  const esmUrl = useBaseUrl('/ionicons/ionicons.esm.js');
  const nomoduleUrl = useBaseUrl('/ionicons/ionicons.js');

  React.useEffect(() => {
    if (!document.querySelector('script[src*="ionicons"]')) {
      // Load ESM version
      const esmScript = document.createElement('script');
      esmScript.type = 'module';
      esmScript.src = esmUrl;
      document.head.appendChild(esmScript);

      // Load fallback version
      const fallbackScript = document.createElement('script');
      fallbackScript.setAttribute('nomodule', '');
      fallbackScript.src = nomoduleUrl;
      document.head.appendChild(fallbackScript);
    }
  }, [esmUrl, nomoduleUrl]);

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
