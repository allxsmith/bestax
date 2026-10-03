import React from 'react';
import { useIsHydrated } from './useIsHydrated';

/**
 * Props for the ClientOnly component.
 */
export interface ClientOnlyProps {
  /**
   * Content to render once the page has hydrated. A function is called only
   * then, so an inline expression that reads `window`, `document` or
   * `localStorage` never runs on the server.
   */
  children?: React.ReactNode | (() => React.ReactNode);
  /**
   * Rendered on the server and during hydration instead of `children`, such
   * as a placeholder the same size as the content so the layout doesn't
   * shift when it arrives.
   * @defaultValue null
   */
  fallback?: React.ReactNode;
}

/**
 * Renders its children only in the browser, after hydration, and a `fallback` until then, so content that depends on browser-only state doesn't cause a hydration mismatch.
 *
 * The server render and the hydrating client render both show `fallback`,
 * which keeps them identical; the children replace it in the commit that
 * follows. In an app without server rendering the children show on the first
 * render.
 *
 * @function
 * @param {ClientOnlyProps} props - Props for the ClientOnly component.
 * @returns The children once hydrated, otherwise the fallback.
 *
 * @example
 * // The server's time zone is not the reader's.
 * <ClientOnly fallback={<Skeleton variant="lines" lines={1} />}>
 *   {() => (
 *     <p>Times are shown in {Intl.DateTimeFormat().resolvedOptions().timeZone}.</p>
 *   )}
 * </ClientOnly>
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const hydrated = useIsHydrated();
  if (!hydrated) return <>{fallback}</>;
  return <>{typeof children === 'function' ? children() : children}</>;
}
