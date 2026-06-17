import root from 'react-shadow';
import clsx from 'clsx';
import { useColorMode } from '@docusaurus/theme-common';
import { shadowStyleSheets } from './shadowStyles';

/**
 * Renders children inside a shadow root loaded with the full Bulma /
 * bestax-bulma style set, isolated from the site's Infima styling.
 * Same pipeline as the docs live examples, minus the code editor and
 * the imperative Theme machinery (colorModeStyles' :host(.dark/.light)
 * rules handle theme switching declaratively).
 */
export default function ShadowPreview({ children, className, extraStyles }) {
  const { colorMode } = useColorMode();

  return (
    <root.div
      mode="open"
      className={clsx('live-preview', colorMode, className)}
      data-theme={colorMode}
    >
      {shadowStyleSheets.map((styles, i) => (
        <style key={i}>{styles}</style>
      ))}
      {extraStyles && <style>{extraStyles}</style>}
      <div data-theme={colorMode}>{children}</div>
    </root.div>
  );
}
