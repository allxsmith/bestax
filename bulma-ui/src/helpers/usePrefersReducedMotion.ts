// INTERNAL: deliberately not exported from src/index.ts.
import { useEffect, useState } from 'react';

/**
 * Detects the user's `prefers-reduced-motion` preference, for motion that
 * runs in script, where a stylesheet's media query can't reach it. Always
 * `false` on the server and on the very first client render, so SSR output
 * and the initial hydration pass always agree.
 *
 * @function
 * @returns {boolean} Whether the user has requested reduced motion.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // An effect, so it only ever runs in the browser.
  useEffect(() => {
    if (!window.matchMedia) return undefined;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the live media query on mount
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}
