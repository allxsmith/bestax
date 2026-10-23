// The visitor's light or dark choice. The inline script in index.html writes
// `data-theme` on <html> before the first paint, from the saved choice or
// else the OS preference, and the app starts from what it wrote.

export type ColorMode = 'light' | 'dark';

/** The key the index.html script reads the saved choice from. */
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

/** The scheme the index.html script wrote, or the same choice without it. */
export function initialColorMode(): ColorMode {
  const written = document.documentElement.getAttribute('data-theme');
  if (isColorMode(written)) return written;
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
