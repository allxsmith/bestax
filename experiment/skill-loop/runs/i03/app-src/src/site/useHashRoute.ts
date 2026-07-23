import { useEffect, useState } from 'react';
import { ROUTES, type Route } from './content';

const parse = (hash: string): Route => {
  const name = hash.replace(/^#\/?/, '') || 'home';
  return (ROUTES as readonly string[]).includes(name) ? (name as Route) : 'home';
};

/** Hash routing — links stay real anchors (`href="#/pricing"`), so the navbar
 *  and footer need no click handlers and the back button works. */
export function useHashRoute(): Route {
  const [route, setRoute] = useState(() => parse(window.location.hash));

  useEffect(() => {
    const onChange = () => {
      setRoute(parse(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}
