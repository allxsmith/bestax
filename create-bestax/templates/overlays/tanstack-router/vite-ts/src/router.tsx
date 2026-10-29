import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import Layout from './Layout.tsx';
import App from './App.tsx';
import About from './pages/About.tsx';

// The routes, code-based. App, the starter page, is the home page. To add a
// page, write it in src/pages, add a route for it here and to the routeTree,
// and link to it from the navbar in src/Layout.tsx.
const rootRoute = createRootRoute({ component: Layout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: App,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: About,
});

const routeTree = rootRoute.addChildren([indexRoute, aboutRoute]);

export const router = createRouter({ routeTree });

// Registers the routes, so every Link and NavbarLink checks its `to`.
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
