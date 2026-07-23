import { useEffect, useState } from 'react';
import { ConfigProvider, Theme } from '@allxsmith/bestax-bulma';
import { SiteNavbar } from './components/SiteNavbar';
import { SiteFooter } from './components/SiteFooter';
import { Home } from './pages/Home';
import { Benchmarks } from './pages/Benchmarks';
import { Platform } from './pages/Platform';
import { Pricing } from './pages/Pricing';
import { Company } from './pages/Company';
import { Contact } from './pages/Contact';
import { useHashRoute, type Route } from './useHashRoute';

const PAGES: Record<Route, () => React.ReactElement> = {
  '/': Home,
  '/benchmarks': Benchmarks,
  '/platform': Platform,
  '/pricing': Pricing,
  '/company': Company,
  '/contact': Contact,
};

type ColorMode = 'light' | 'dark';

const STORAGE_KEY = 'netadyne-color-mode';

function App() {
  const route = useHashRoute();
  const [colorMode, setColorMode] = useState<ColorMode>(
    () => (localStorage.getItem(STORAGE_KEY) as ColorMode | null) ?? 'dark'
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, colorMode);
  }, [colorMode]);

  const Page = PAGES[route];

  return (
    // ConfigProvider sets the icon library once, so no <Icon library="fa">
    // anywhere. Theme carries the Netadyne brand as HSL trios — every shade,
    // light/dark variant, and invert follows from them.
    <ConfigProvider iconLibrary="fa">
      <Theme
        isRoot
        colorMode={colorMode}
        primaryH="258"
        primaryS="82%"
        primaryL="58%"
        linkH="196"
        linkS="88%"
        linkL="44%"
        infoH="212"
        infoS="80%"
        infoL="52%"
        successH="158"
        successS="72%"
        successL="40%"
        bulmaVars={{
          '--bulma-radius-large': '0.75rem',
          '--bulma-title-weight': '700',
        }}
      >
        <SiteNavbar
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
