import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { ConfigProvider, Theme } from '@allxsmith/bestax-bulma';
import { SiteNav } from './components/SiteNav';
import { SiteFooter } from './components/SiteFooter';
import { Home } from './pages/Home';
import { Benchmarks } from './pages/Benchmarks';
import { Models } from './pages/Models';
import { Pricing } from './pages/Pricing';
import { Docs } from './pages/Docs';
import { Safety } from './pages/Safety';
import { Contact } from './pages/Contact';
import { ROUTES, type PageId } from './routes';
import './site.css';

const PAGES: Record<
  PageId,
  (props: { onNavigate: (p: PageId) => void }) => ReactElement
> = {
  home: Home,
  benchmarks: Benchmarks,
  models: Models,
  pricing: Pricing,
  docs: Docs,
  safety: Safety,
  contact: Contact,
};

const isPageId = (value: string): value is PageId =>
  ROUTES.some(route => route.id === value);

const pageFromHash = (): PageId => {
  const hash = window.location.hash.replace('#', '');
  return isPageId(hash) ? hash : 'home';
};

function App() {
  const [page, setPage] = useState<PageId>(pageFromHash);
  const [isDark, setIsDark] = useState(true);

  // Back/forward buttons and shared links both resolve through the hash.
  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((next: PageId) => {
    window.location.hash = next;
    setPage(next);
    window.scrollTo({ top: 0 });
  }, []);

  const Page = PAGES[page];

  return (
    <ConfigProvider iconLibrary="mdi">
      <Theme
        isRoot
        colorMode={isDark ? 'dark' : 'light'}
        primaryH="258"
        primaryS="82%"
        primaryL="60%"
        linkH="258"
        linkS="82%"
        linkL="60%"
        infoH="192"
        infoS="80%"
        infoL="48%"
        bulmaVars={{
          '--bulma-radius': '0.5rem',
          '--bulma-radius-large': '0.875rem',
          '--bulma-block-spacing': '1.25rem',
        }}
      >
        <SiteNav
          current={page}
          onNavigate={navigate}
          isDark={isDark}
          onToggleScheme={() => setIsDark(dark => !dark)}
        />
        <main>
          <Page onNavigate={navigate} />
        </main>
        <SiteFooter onNavigate={navigate} />
      </Theme>
    </ConfigProvider>
  );
}

export default App;
