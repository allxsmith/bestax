import { useEffect, useState } from 'react';

export const ROUTES = [
  { path: '/', label: 'Home' },
  { path: '/benchmarks', label: 'Benchmarks' },
  { path: '/models', label: 'Models' },
  { path: '/pricing', label: 'Pricing' },
  { path: '/safety', label: 'Safety' },
  { path: '/contact', label: 'Contact' },
] as const;

export type RoutePath = (typeof ROUTES)[number]['path'];

const read = (): RoutePath => {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const match = ROUTES.find(r => r.path === raw);
  return match ? match.path : '/';
};

/** Minimal hash router — the site is static, so no routing dependency. */
export function useRoute(): RoutePath {
  const [path, setPath] = useState<RoutePath>(read);

  useEffect(() => {
    const onChange = () => {
      setPath(read());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return path;
}

export const href = (path: RoutePath) => `#${path}`;
