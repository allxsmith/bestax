import { useEffect, useState } from 'react';

/**
 * The original is four HTML pages that link to each other. Here each page is
 * a component, and the address's hash names the one to show (`#/fruits`), so
 * the app needs no router package and every page opens from a static host or
 * a sandbox's preview as it is.
 */
export const routes = {
  home: '#/',
  fruits: '#/fruits',
  services: '#/services',
  contact: '#/contact',
} as const;

export type Route = keyof typeof routes;

/** The page a hash names, or the home page for any other. */
export function routeOf(hash: string): Route {
  const found = (Object.keys(routes) as Route[]).find(
    route => routes[route] === hash
  );
  return found ?? 'home';
}

/**
 * The page the address names, following it as links and the browser's back
 * and forward buttons change the hash. Each change to another page starts at
 * the top, as a new page in the original does.
 */
export function useRoute(): Route {
  const [route, setRoute] = useState(() => routeOf(window.location.hash));
  useEffect(() => {
    const onHashChange = () => {
      setRoute(routeOf(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return route;
}
