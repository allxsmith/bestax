// INTERNAL: deliberately not exported from src/index.ts.
import { useState } from 'react';
import { useClientLayoutEffect } from './useClientLayoutEffect';

/**
 * The media queries Bulma's `fullhd`, `widescreen`, `desktop` and `tablet`
 * mixins open with, widest first, at Bulma's default breakpoints. A
 * stylesheet lays a component out with those mixins; these tell its script
 * which layout that is. A theme that moves Bulma's breakpoints moves the
 * stylesheet's switch but not these. Narrower than the last one is `mobile`.
 */
const VIEWPORT_QUERIES = [
  'screen and (min-width: 1408px)',
  'screen and (min-width: 1216px)',
  'screen and (min-width: 1024px)',
  'screen and (min-width: 769px), print',
];

/** `useBulmaViewport`'s answer below the tablet breakpoint. */
export const MOBILE = VIEWPORT_QUERIES.length;

/** Where Bulma's `widescreen`, `desktop` and `tablet` sit in `VIEWPORT_QUERIES`. */
const VIEWPORT_INDEX = {
  widescreen: 1,
  desktop: 2,
  tablet: 3,
} as const;

/**
 * Which of Bulma's viewports the window is in: the index of the widest
 * `VIEWPORT_QUERIES` entry that matches, `MOBILE` below them all, or `-1`
 * when that isn't known (on the server, before the first layout effect, and
 * whenever `enabled` is off, so a caller that needs no answer subscribes to
 * nothing). It's read in a layout effect, so the first paint after hydration
 * already has it.
 *
 * @function useBulmaViewport
 * @param enabled - Whether the caller needs the viewport at all.
 * @returns The viewport, as described above.
 */
export function useBulmaViewport(enabled: boolean): number {
  const [viewport, setViewport] = useState(-1);

  useClientLayoutEffect(() => {
    if (!enabled || typeof window.matchMedia !== 'function') return undefined;
    const lists = VIEWPORT_QUERIES.map(query => window.matchMedia(query));
    const update = () => {
      const index = lists.findIndex(list => list.matches);
      setViewport(index < 0 ? MOBILE : index);
    };
    update();
    lists.forEach(list => list.addEventListener('change', update));
    return () =>
      lists.forEach(list => list.removeEventListener('change', update));
  }, [enabled]);

  return enabled ? viewport : -1;
}

/**
 * Whether the window is at or past one of Bulma's breakpoints, at its default
 * width, through the one media query Bulma's mixin for it opens with, so a
 * caller re-renders only when the window crosses that breakpoint. `null`
 * until it's known: on the server, and before the first layout effect. Where
 * `matchMedia` isn't there, it's `true`, the wide layout a server renders.
 *
 * @function useBulmaBreakpoint
 * @param breakpoint - The breakpoint: `tablet`, `desktop` or `widescreen`.
 * @returns Whether the window is at or past it, or `null`.
 */
export function useBulmaBreakpoint(
  breakpoint: keyof typeof VIEWPORT_INDEX
): boolean | null {
  const [atOrPast, setAtOrPast] = useState<boolean | null>(null);

  useClientLayoutEffect(() => {
    const list =
      typeof window.matchMedia === 'function'
        ? window.matchMedia(VIEWPORT_QUERIES[VIEWPORT_INDEX[breakpoint]])
        : null;
    const update = () => setAtOrPast(list ? list.matches : true);
    update();
    list?.addEventListener('change', update);
    return () => list?.removeEventListener('change', update);
  }, [breakpoint]);

  return atOrPast;
}
