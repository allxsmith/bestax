import root from 'react-shadow';
import clsx from 'clsx';
import { useColorMode } from '@docusaurus/theme-common';
import { shadowStyleSheets } from './shadowStyles';
import useShadowStyleSheets, {
  useInstanceStyleSheet,
} from './useShadowStyleSheets';

/**
 * Renders children inside a shadow root loaded with the full Bulma /
 * bestax-bulma style set, isolated from the site's Infima styling.
 * Same pipeline as the docs live examples, minus the code editor and
 * the imperative Theme machinery (colorModeStyles' :host(.dark/.light)
 * rules handle theme switching declaratively).
 *
 * The base sheets are adopted, not inlined, so every preview on the page
 * shares one parsed copy; see useShadowStyleSheets.
 */
export default function ShadowPreview({ children, className, extraStyles }) {
  const { colorMode } = useColorMode();
  const extraSheet = useInstanceStyleSheet(extraStyles ?? null);
  const styleSheets = useShadowStyleSheets(extraStyles ? extraSheet : null);

  return (
    <root.div
      mode="open"
      className={clsx('live-preview', colorMode, className)}
      data-theme={colorMode}
      styleSheets={styleSheets ?? undefined}
    >
      {/* Fallback for browsers without constructable stylesheets. */}
      {!styleSheets && (
        <>
          {shadowStyleSheets.map((styles, i) => (
            <style key={i}>{styles}</style>
          ))}
          {extraStyles && <style>{extraStyles}</style>}
        </>
      )}
      <div data-theme={colorMode}>{children}</div>
    </root.div>
  );
}
