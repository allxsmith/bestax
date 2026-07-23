import { useState } from 'react';
import { ConfigProvider, Theme } from '@allxsmith/bestax-bulma';
import { SiteFooter } from './components/SiteFooter';
import { SiteNav } from './components/SiteNav';
import { BenchmarksPage } from './pages/BenchmarksPage';
import { CompanyPage } from './pages/CompanyPage';
import { ContactPage } from './pages/ContactPage';
import { HomePage } from './pages/HomePage';
import { PlatformPage } from './pages/PlatformPage';
import { PricingPage } from './pages/PricingPage';
import { SkynetPage } from './pages/SkynetPage';
import type { Route } from './site/content';
import { useHashRoute } from './site/useHashRoute';
import './App.css';

const PAGES: Record<Route, () => React.JSX.Element> = {
  home: HomePage,
  skynet: SkynetPage,
  benchmarks: BenchmarksPage,
  platform: PlatformPage,
  pricing: PricingPage,
  company: CompanyPage,
  contact: ContactPage,
};

function App() {
  const route = useHashRoute();
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('dark');
  const Page = PAGES[route];

  return (
    // Netadyne brand: a cold indigo primary against a cyan link accent. The
    // scheme is always pinned (never 'system') so the palette can't be flipped
    // out from under the page by an OS preference.
    <ConfigProvider iconLibrary="fa">
      <Theme
        isRoot
        colorMode={colorMode}
        primaryH="248"
        primaryS="72%"
        primaryL="58%"
        linkH="192"
        linkS="86%"
        linkL="46%"
        infoH="192"
        infoS="86%"
        infoL="46%"
      >
        <SiteNav
          route={route}
          colorMode={colorMode}
          onToggleColorMode={() =>
            setColorMode(mode => (mode === 'dark' ? 'light' : 'dark'))
          }
        />
        <main>
          <Page />
        </main>
        <SiteFooter />
      </Theme>
    </ConfigProvider>
  );
}

export default App;
