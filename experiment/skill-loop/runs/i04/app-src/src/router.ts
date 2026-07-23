import { createContext, useContext } from 'react';

/** Every page this site can show. */
export const ROUTES = [
  'home',
  'product',
  'benchmarks',
  'pricing',
  'docs',
  'company',
  'waitlist',
] as const;

export type Route = (typeof ROUTES)[number];

export const ROUTE_TITLES: Record<Route, string> = {
  home: 'Home',
  product: 'Product',
  benchmarks: 'Benchmarks',
  pricing: 'Pricing',
  docs: 'Docs',
  company: 'Company',
  waitlist: 'Get access',
};

/**
 * Minimal in-app router. This project has no routing library installed, so the
 * current page lives in App state and pages navigate through this context.
 */
export interface RouterValue {
  route: Route;
  navigate: (route: Route) => void;
}

export const RouterContext = createContext<RouterValue>({
  route: 'home',
  navigate: () => {},
});

export function useRouter(): RouterValue {
  return useContext(RouterContext);
}
