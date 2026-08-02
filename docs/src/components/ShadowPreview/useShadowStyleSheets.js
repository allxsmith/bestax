import { useMemo } from 'react';
import {
  getSharedStyleSheets,
  supportsConstructableStyleSheets,
} from './shadowStyles';

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
 * Builds the `adoptedStyleSheets` array for one shadow root.
 *
 * The expensive base sheets come from `getSharedStyleSheets()` and are the same
 * objects in every preview on the page — adopting is a pointer copy, so N
 * previews cost one parse instead of N. The instance sheet is appended after
 * them (so it wins the cascade), because react-shadow assigns the array
 * wholesale — `root.adoptedStyleSheets = styleSheets` — rather than merging.
 *
 * The returned identity is stable across renders, which matters: it is a
 * dependency of react-shadow's attach effect.
 *
 * @param {CSSStyleSheet|null} [instanceSheet]
 * @returns {CSSStyleSheet[]|null} the array to adopt, or `null` when
 *   constructable stylesheets are unavailable (SSR, Safari < 16.4) and the
 *   caller should render `<style>` children instead.
 */
export default function useShadowStyleSheets(instanceSheet) {
  const shared = getSharedStyleSheets();

  return useMemo(() => {
    if (!shared) {
      return null;
    }
    return instanceSheet ? [...shared, instanceSheet] : shared;
  }, [shared, instanceSheet]);
}
