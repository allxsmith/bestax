/**
 * The page's light or dark scheme, which the toggle switches.
 *
 * Before the first paint, a script in index.html writes `data-theme` on
 * `<html>` from the visitor's saved choice, or from their OS preference when
 * there is none, so a returning visitor never sees the other scheme flash
 * first. The app starts from what that script wrote, and `Theme colorMode`
 * keeps the attribute in step from then on. Both read and write the choice
 * under the same storage key.
 */
export type ColorMode = 'light' | 'dark';

const STORAGE_KEY = 'theme';

const isColorMode = (value: unknown): value is ColorMode =>
  value === 'light' || value === 'dark';

function savedColorMode(): ColorMode | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isColorMode(saved) ? saved : null;
  } catch {
    // A browser can block storage, in a private window or an embedded
    // preview.
    return null;
  }
}

/**
 * The scheme index.html picked. Without its script, the same choice: the
 * saved one, or the OS preference.
 */
export function initialColorMode(): ColorMode {
  const picked = document.documentElement.getAttribute('data-theme');
  if (isColorMode(picked)) return picked;
  return (
    savedColorMode() ??
    (window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light')
  );
}

/** Remember the visitor's choice for their next visit. */
export function saveColorMode(mode: ColorMode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Storage is blocked, so the choice lasts until the page reloads.
  }
}
