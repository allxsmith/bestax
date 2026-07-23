import { useCallback, useEffect, useState } from 'react';
import { Theme } from '@allxsmith/bestax-bulma';
import SiteNavbar from './site/SiteNavbar';
import SiteFooter from './site/SiteFooter';
import HomePage from './pages/HomePage';
import BenchmarksPage from './pages/BenchmarksPage';
import PricingPage from './pages/PricingPage';
import DocsPage from './pages/DocsPage';
import ContactPage from './pages/ContactPage';
import type { PageId } from './site/content';
import './App.css';

const STORAGE_KEY = 'netadyne-color-mode';

const readStoredMode = (): 'light' | 'dark' =>
  localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';

function App() {
  const [page, setPage] = useState<PageId>('home');
  // Dark is the house look; the toggle is real, so no fixed color tokens are
  // exposed anywhere — bands and the hero backdrop derive from --bulma-scheme-*.
  const [colorMode, setColorMode] = useState<'light' | 'dark'>(readStoredMode);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, colorMode);
  }, [colorMode]);

  const navigate = useCallback((next: PageId) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <Theme
      isRoot
      colorMode={colorMode}
      primaryH="258"
      primaryS="80%"
      primaryL="60%"
      linkH="190"
      linkS="88%"
      linkL="46%"
      infoH="199"
      infoS="90%"
      infoL="52%"
      successH="158"
      successS="72%"
      successL="42%"
      bulmaVars={{
        '--bulma-radius': '0.5rem',
        '--bulma-radius-large': '0.875rem',
        '--bulma-family-primary':
          "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
        '--bulma-family-code':
          "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
      }}
    >
      <SiteNavbar
        page={page}
        onNavigate={navigate}
        colorMode={colorMode}
        onToggleColorMode={() =>
          setColorMode(mode => (mode === 'dark' ? 'light' : 'dark'))
        }
      />

      {page === 'home' && <HomePage onNavigate={navigate} />}
      {page === 'benchmarks' && <BenchmarksPage onNavigate={navigate} />}
      {page === 'pricing' && <PricingPage onNavigate={navigate} />}
      {page === 'docs' && <DocsPage onNavigate={navigate} />}
      {page === 'contact' && <ContactPage />}

      <SiteFooter onNavigate={navigate} />
    </Theme>
  );
}

export default App;
