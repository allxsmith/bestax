import type { ComponentType } from 'react';
import ContactPage from './pages/ContactPage.tsx';
import FruitsPage from './pages/FruitsPage.tsx';
import HomePage from './pages/HomePage.tsx';
import ServicesPage from './pages/ServicesPage.tsx';
import { useRoute, type Route } from './router.ts';
import SiteFooter from './sections/SiteFooter.tsx';
import SiteNavbar from './sections/SiteNavbar.tsx';

const pages: Record<Route, ComponentType> = {
  home: HomePage,
  fruits: FruitsPage,
  services: ServicesPage,
  contact: ContactPage,
};

/**
 * Every page has the same navbar and footer, with the page the address's hash
 * names between them (`src/router.ts`).
 */
function App() {
  const route = useRoute();
  const Page = pages[route];
  return (
    <>
      <SiteNavbar route={route} />
      <main>
        <Page />
      </main>
      <SiteFooter />
    </>
  );
}

export default App;
