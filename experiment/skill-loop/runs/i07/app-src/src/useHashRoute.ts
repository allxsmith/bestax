import { useEffect, useState } from 'react';

/** Routes the site knows about. Anything else falls back to `/`. */
export const ROUTES = [
  '/',
  '/benchmarks',
  '/platform',
  '/pricing',
  '/company',
  '/contact',
] as const;

export type Route = (typeof ROUTES)[number];

function normalize(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/';
  return (ROUTES as readonly string[]).includes(path) ? (path as Route) : '/';
}

/**
 * Minimal hash router — the site ships no routing dependency, so nav links are
 * plain `href="#/pricing"` anchors and this hook turns the hash into a route.
 */
export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() =>
    normalize(window.location.hash)
  );

  useEffect(() => {
    const onHashChange = () => {
      setRoute(normalize(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return route;
}
