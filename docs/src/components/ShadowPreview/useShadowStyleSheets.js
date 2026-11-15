import { useEffect, useMemo, useState } from 'react';
import {
  fenceStylesheetsIn,
  getSharedStyleSheets,
  loadFenceStylesheet,
  supportsConstructableStyleSheets,
} from './shadowStyles';

const NONE = [];

/**
 * Creates one CSSStyleSheet owned by the calling component, kept in sync with
 * `css`. Returns `null` when constructable stylesheets are unavailable, which
 * is the signal to fall back to a `<style>` child.
 *
 * Pass `css` as `null` for a sheet whose contents are written imperatively
 * later (the live preview's theme variables work this way).
 *
 * @param {string|null} css
 * @returns {CSSStyleSheet|null}
 */
export function useInstanceStyleSheet(css) {
  return useMemo(() => {
    if (!supportsConstructableStyleSheets()) {
      return null;
    }
    const sheet = new CSSStyleSheet();
    if (css != null) {
      sheet.replaceSync(css);
    }
    return sheet;
  }, [css]);
}

/**
 * The library stylesheets an example's code imports beyond the shared set
 * (FENCE_STYLESHEETS in shadowStyles.js), once they have loaded, each as
 * `loadFenceStylesheet` gives it. Empty for code that imports none, while
 * they load, and if a load fails, so the preview renders on the shared set.
 *
 * @param {string} code
 * @returns {{ css: string | null, sheet: CSSStyleSheet | null }[]}
 */
export function useFenceStyles(code) {
  const key = useMemo(() => fenceStylesheetsIn(code).join('\n'), [code]);
  const [loaded, setLoaded] = useState({ key: '', styles: NONE });

  useEffect(() => {
    if (!key) {
      return undefined;
    }
    let current = true;
    Promise.all(key.split('\n').map(loadFenceStylesheet)).then(
      styles => current && setLoaded({ key, styles }),
      () => current && setLoaded({ key, styles: NONE })
    );
    return () => {
      current = false;
    };
  }, [key]);

  return loaded.key === key ? loaded.styles : NONE;
}

/**
 * Builds the `adoptedStyleSheets` array for one shadow root.
 *
 * The expensive base sheets come from `getSharedStyleSheets()` and are the same
 * objects in every preview on the page — adopting is a pointer copy, so N
 * previews cost one parse instead of N. The example's own library sheets
 * (`useFenceStyles`) follow them, then the instance sheet (so it wins the
 * cascade), because react-shadow assigns the array wholesale —
 * `root.adoptedStyleSheets = styleSheets` — rather than merging.
 *
 * The returned identity is stable across renders, which matters: it is a
 * dependency of react-shadow's attach effect.
 *
 * @param {CSSStyleSheet|null} [instanceSheet]
 * @param {CSSStyleSheet[]} [fenceSheets] from `useFenceStyles`, stable while
 *   the example's imports are
 * @returns {CSSStyleSheet[]|null} the array to adopt, or `null` when
 *   constructable stylesheets are unavailable (SSR, Safari < 16.4) and the
 *   caller should render `<style>` children instead.
 */
export default function useShadowStyleSheets(
  instanceSheet,
  fenceSheets = NONE
) {
  const shared = getSharedStyleSheets();

  return useMemo(() => {
    if (!shared) {
      return null;
    }
    if (!instanceSheet && fenceSheets.length === 0) {
      return shared;
    }
    return [
      ...shared,
      ...fenceSheets,
      ...(instanceSheet ? [instanceSheet] : []),
    ];
  }, [shared, instanceSheet, fenceSheets]);
}
