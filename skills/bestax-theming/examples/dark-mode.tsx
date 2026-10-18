// A light/dark toggle for an app built on @allxsmith/bestax-bulma that keeps
// the visitor's choice.
//
// Bulma reads the scheme from `data-theme` on <html>. `Theme colorMode` writes
// that attribute from an effect, which runs after a client-rendered app's
// first paint, so on its own the page shows the OS scheme for a frame and then
// flips. The scheme for that first frame comes from a script in index.html,
// which writes the saved choice, or else the OS preference, before anything
// renders. Put it inside <head> as a plain inline script, not
// `type="module"`, so it runs before the body renders:
//
//   <script>
//     // Bulma's scheme on <html> before the first paint: the saved choice,
//     // or else the OS preference. The app saves under the same key.
//     (() => {
//       let saved = null;
//       try {
//         saved = localStorage.getItem('theme');
//       } catch {
//         // Storage is blocked, so fall back to the OS preference.
//       }
//       const dark =
//         saved === 'light' || saved === 'dark'
//           ? saved === 'dark'
//           : window.matchMedia('(prefers-color-scheme: dark)').matches;
//       document.documentElement.setAttribute(
//         'data-theme',
//         dark ? 'dark' : 'light'
//       );
//     })();
//   </script>
//
// This file is the app's side: it starts from the attribute the script wrote,
// passes its state to `Theme colorMode`, which keeps the attribute in step
// with the toggle, and saves each choice under the key the script reads.
// Under a ConfigProvider `classPrefix`, colorMode also writes
// `data-<prefix>theme`, which the prefixed flavors read, so the script writes
// that attribute too.
import { useState } from 'react';
import {
  Theme,
  Box,
  Button,
  Title,
  Notification,
} from '@allxsmith/bestax-bulma';

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

/**
 * The scheme the index.html script wrote. Without the script, the same
 * choice: the saved one, or the OS preference.
 */
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

export function DarkModeToggle() {
  const [mode, setMode] = useState<ColorMode>(initialColorMode);
  const isDark = mode === 'dark';

  const toggle = () => {
    const next = isDark ? 'light' : 'dark';
    setMode(next);
    saveColorMode(next);
  };

  return (
    // Wrap the app once, at its root.
    <Theme isRoot colorMode={mode}>
      <Box>
        <Title size="5">Color scheme</Title>
        <Notification color="info">
          Components below follow the current Bulma color scheme.
        </Notification>
        {/* One setting and its state: the name stays "Dark mode", and
            aria-pressed says whether it is on. */}
        <Button aria-pressed={isDark} onClick={toggle}>
          Dark mode
        </Button>
      </Box>
    </Theme>
  );
}
