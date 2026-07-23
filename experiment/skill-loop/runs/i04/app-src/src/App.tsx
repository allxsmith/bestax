import { useEffect, useMemo, useState } from 'react';
import { ConfigProvider, Theme } from '@allxsmith/bestax-bulma';
import { RouterContext, type Route } from './router';
import { SiteNavbar } from './components/SiteNavbar';
import { SiteFooter } from './components/SiteFooter';
import { HomePage } from './pages/HomePage';
import { ProductPage } from './pages/ProductPage';
import { BenchmarksPage } from './pages/BenchmarksPage';
import { PricingPage } from './pages/PricingPage';
import { DocsPage } from './pages/DocsPage';
import { CompanyPage } from './pages/CompanyPage';
import { WaitlistPage } from './pages/WaitlistPage';
import './App.css';

const PAGES: Record<Route, () => React.ReactElement> = {
  home: HomePage,
  product: ProductPage,
  benchmarks: BenchmarksPage,
  pricing: PricingPage,
  docs: DocsPage,
  company: CompanyPage,
  waitlist: WaitlistPage,
};

function App() {
  const [route, setRoute] = useState<Route>('home');
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('dark');

  // Land at the top of each page the way a real navigation would.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route]);

  const router = useMemo(() => ({ route, navigate: setRoute }), [route]);
  const Page = PAGES[route];

  return (
    <ConfigProvider iconLibrary="fa">
      {/* Brand palette: violet primary, cyan link. Every shade Bulma derives
          (light/dark/invert) follows from these HSL trios. */}
      <Theme
        isRoot
        colorMode={colorMode}
        primaryH="262"
        primaryS="72%"
        primaryL="56%"
        linkH="190"
        linkS="88%"
        linkL="45%"
        infoH="205"
        infoS="85%"
        infoL="52%"
        bulmaVars={{ '--bulma-radius-large': '0.75rem' }}
      >
        <RouterContext.Provider value={router}>
          <SiteNavbar
            colorMode={colorMode}
            onToggleColorMode={() =>
              setColorMode(mode => (mode === 'dark' ? 'light' : 'dark'))
            }
          />
          <main>
            <Page />
          </main>
          <SiteFooter />
        </RouterContext.Provider>
      </Theme>
    </ConfigProvider>
  );
}

export default App;
