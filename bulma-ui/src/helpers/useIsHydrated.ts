import { useSyncExternalStore } from 'react';

// "Are we past hydration?" as a store that never changes: React reads the
// server snapshot both while server-rendering and while hydrating, and the
// client snapshot from the first post-hydration render onward.
const subscribeToNothing = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Reports whether the component has passed hydration.
 *
 * Returns `false` during server rendering and during the hydrating client
 * render, then `true` from the commit that follows. Use it to defer
 * DOM-only behaviour (such as portalling) past hydration so the first client
 * render matches the server markup instead of tripping hydration recovery.
 *
 * @function useIsHydrated
 * @returns `true` once the hydrating render has completed, otherwise `false`.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    getClientSnapshot,
    getServerSnapshot
  );
}
