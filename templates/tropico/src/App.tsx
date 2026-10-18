import { useEffect, type ReactNode } from 'react';
import ContactPage from './pages/ContactPage.tsx';
import FruitsPage from './pages/FruitsPage.tsx';
import HomePage from './pages/HomePage.tsx';
import ServicesPage from './pages/ServicesPage.tsx';
import { usePage, type Page } from './router.ts';
import SiteFooter from './SiteFooter.tsx';
import SiteNavbar from './SiteNavbar.tsx';

/** Each page, by the name router.ts gives its address. */
const pages: Record<Page, ReactNode> = {
  home: <HomePage />,
  fruits: <FruitsPage />,
  services: <ServicesPage />,
  contact: <ContactPage />,
};

/**
 * The site: every page shares the navbar and the footer, and the address
 * picks what goes between them. To add a page, give it a path in router.ts
 * and a component here.
 */
function App() {
  const page = usePage();

  // A new page starts at its top, as opening another HTML file does.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  return (
    <>
      <SiteNavbar page={page} />
      <main>{pages[page]}</main>
      <SiteFooter />
    </>
  );
}

export default App;
