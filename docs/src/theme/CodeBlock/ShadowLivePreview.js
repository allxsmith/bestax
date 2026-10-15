import React from 'react';
import root from 'react-shadow';
import { LivePreview } from 'react-live';
import { useColorMode } from '@docusaurus/theme-common';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { ConfigProvider } from '@allxsmith/bestax-bulma';
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
export default function ShadowLivePreview({ forcedColorMode }) {
  const { colorMode: siteColorMode } = useColorMode();
  // An example window can pin its own palette, e.g. the dark example window.
  const colorMode = forcedColorMode ?? siteColorMode;
  const themeSheet = useInstanceStyleSheet(null);
  const styleSheets = useShadowStyleSheets(themeSheet);

  // Fallback path only: the <style> element standing in for themeSheet.
  const themeStyleRef = React.useRef(null);

  // Where an example's portaled content goes: Popover's appendToBody panel,
  // or a Portal with no container. Left to the library's default it would
  // land in document.body, outside this shadow root and so outside the
  // stylesheets above. This element sits inside the root instead, and the
  // ConfigProvider around the preview makes it the default. A ConfigProvider
  // the example nests replaces this one's settings rather than adding to
  // them, so an example that portals must not nest one without a
  // portalContainer of its own (docs/CLAUDE.md, on live examples).
  const [portalTarget, setPortalTarget] = React.useState(null);

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
  // Served from this origin by plugins/local-ionicons.js; a script tag rather
  // than an import because the Stencil bundle resolves its own lazy chunks and
  // per-icon SVGs relative to the loader's URL. v8's dist only ships the ESM
  // loader (no legacy/nomodule bundle), so there is nothing to fall back to.
  const esmUrl = useBaseUrl('/ionicons/ionicons.esm.js');

  React.useEffect(() => {
    if (!document.querySelector('script[src*="ionicons"]')) {
      const esmScript = document.createElement('script');
      esmScript.type = 'module';
      esmScript.src = esmUrl;
      document.head.appendChild(esmScript);
    }
  }, [esmUrl]);

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
          <ConfigProvider portalContainer={portalTarget ?? undefined}>
            <LivePreview />
          </ConfigProvider>
          <div ref={setPortalTarget} />
        </div>
      </root.div>
    </ShadowThemeContext.Provider>
  );
}
