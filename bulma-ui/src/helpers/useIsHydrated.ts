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
 * Only a component that hydrates ever sees `false` on the client. One that
 * mounts later (after a route change, or in an app with no server rendering)
 * gets `true` on its first render, so it pays for no extra render. It
 * subscribes to nothing, so no later render flips it back.
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
