import { useCallback, useEffect, useState } from 'react';
import { ConfigProvider, Theme } from '@allxsmith/bestax-bulma';
import { SiteNavbar } from './components/SiteNavbar';
import { SiteFooter } from './components/SiteFooter';
import { Home } from './pages/Home';
import { Models } from './pages/Models';
import { Benchmarks } from './pages/Benchmarks';
import { Pricing } from './pages/Pricing';
import { Docs } from './pages/Docs';
import { Contact } from './pages/Contact';
import type { PageId } from './data/site';
import './App.css';

const PAGES: PageId[] = [
  'home',
  'models',
  'benchmarks',
  'pricing',
  'docs',
  'contact',
];

const TITLES: Record<PageId, string> = {
  home: 'Netadyne — Skynet, the frontier LLM',
  models: 'Models — Skynet by Netadyne',
  benchmarks: 'Benchmarks — Skynet by Netadyne',
  pricing: 'Pricing — Skynet by Netadyne',
  docs: 'Docs — Skynet by Netadyne',
  contact: 'Get API access — Skynet by Netadyne',
};

/** Read the page out of the hash so links and the back button both work. */
const pageFromHash = (): PageId => {
  const hash = window.location.hash.replace('#', '') as PageId;
  return PAGES.includes(hash) ? hash : 'home';
};

function App() {
  const [page, setPage] = useState<PageId>(pageFromHash);
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('dark');

  // Hash routing: no router dependency, but the back button still works.
  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    document.title = TITLES[page];
  }, [page]);

  const navigate = useCallback((next: PageId) => {
    window.location.hash = next;
    setPage(next);
    window.scrollTo({ top: 0 });
  }, []);

  return (
    // The whole site is themed from one HSL trio: every primary shade, light
    // and invert variant Bulma renders is derived from it.
    <Theme
      isRoot
      colorMode={colorMode}
      primaryH="187"
      primaryS="76%"
      primaryL="42%"
      linkH="255"
      linkS="72%"
      linkL="58%"
      bulmaVars={{
        '--bulma-radius-large': '0.75rem',
        '--bulma-radius': '0.5rem',
        '--bulma-body-family':
          "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
        // The active navbar item defaults to the link hue (violet here), which
        // fights the cyan brand. Pin the selected-item tint to primary.
        '--bulma-navbar-item-selected-h': '187',
        '--bulma-navbar-item-selected-s': '76%',
        '--bulma-navbar-item-selected-l': '42%',
      }}
    >
      <ConfigProvider iconLibrary="fa">
        <SiteNavbar
          page={page}
          onNavigate={navigate}
          colorMode={colorMode}
          onToggleColorMode={() =>
            setColorMode(mode => (mode === 'dark' ? 'light' : 'dark'))
          }
        />

        <main>
          {page === 'home' && <Home onNavigate={navigate} />}
          {page === 'models' && <Models onNavigate={navigate} />}
          {page === 'benchmarks' && <Benchmarks onNavigate={navigate} />}
          {page === 'pricing' && <Pricing onNavigate={navigate} />}
          {page === 'docs' && <Docs onNavigate={navigate} />}
          {page === 'contact' && <Contact />}
        </main>

        <SiteFooter onNavigate={navigate} />
      </ConfigProvider>
    </Theme>
  );
}

export default App;
