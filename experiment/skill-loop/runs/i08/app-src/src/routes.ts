import { useEffect, useState } from 'react';

export type Route = '/' | '/benchmarks' | '/platform' | '/pricing' | '/access';

export const ROUTES: { path: Route; label: string; inNav: boolean }[] = [
  { path: '/', label: 'Overview', inNav: true },
  { path: '/benchmarks', label: 'Benchmarks', inNav: true },
  { path: '/platform', label: 'Platform', inNav: true },
  { path: '/pricing', label: 'Pricing', inNav: true },
  { path: '/access', label: 'Request access', inNav: false },
];

const isRoute = (value: string): value is Route =>
  ROUTES.some(r => r.path === value);

const currentRoute = (): Route => {
  const path = window.location.hash.replace(/^#/, '') || '/';
  return isRoute(path) ? path : '/';
};

/**
 * Minimal hash router — the site has five static pages and no data loading,
 * so a router dependency would outweigh what it buys.
 */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(currentRoute);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(currentRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return route;
}
