import { useEffect, useState } from 'react';
import { ConfigProvider, Theme } from '@allxsmith/bestax-bulma';
import { SiteNavbar } from './components/SiteNavbar';
import { SiteFooter } from './components/SiteFooter';
import { HomePage } from './pages/HomePage';
import { ModelsPage } from './pages/ModelsPage';
import { BenchmarksPage } from './pages/BenchmarksPage';
import { PricingPage } from './pages/PricingPage';
import { ContactPage } from './pages/ContactPage';
import { NAV_PAGES, type PageId } from './data/site';

/** Hash routing keeps the URL, the back button, and plain <a href> links real. */
function pageFromHash(): PageId {
  const id = window.location.hash.replace(/^#\/?/, '');
  return NAV_PAGES.some(p => p.id === id) ? (id as PageId) : 'home';
}

function App() {
  const [page, setPage] = useState<PageId>(pageFromHash);
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const onHashChange = () => {
      setPage(pageFromHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <ConfigProvider iconLibrary="fa">
      {/* One global theme: Netadyne's violet brand + the scheme the toggle owns.
          Both modes are supported, so nothing below may use fixed color tokens. */}
      <Theme
        isRoot
        colorMode={colorMode}
        primaryH="258"
        primaryS="83%"
        primaryL="62%"
        linkH="258"
        linkS="83%"
        linkL="62%"
        infoH="190"
        infoS="88%"
        infoL="48%"
        bulmaVars={{ '--bulma-radius-large': '0.75rem' }}
      >
        <SiteNavbar
          page={page}
          colorMode={colorMode}
          onToggleColorMode={() =>
            setColorMode(mode => (mode === 'dark' ? 'light' : 'dark'))
          }
        />

        {page === 'home' && <HomePage />}
        {page === 'models' && <ModelsPage />}
        {page === 'benchmarks' && <BenchmarksPage />}
        {page === 'pricing' && <PricingPage />}
        {page === 'contact' && <ContactPage />}

        <SiteFooter />
      </Theme>
    </ConfigProvider>
  );
}

export default App;
