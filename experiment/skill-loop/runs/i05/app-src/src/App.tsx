import { useState } from 'react';
import type React from 'react';
import { ConfigProvider, Theme } from '@allxsmith/bestax-bulma';
import { SiteNavbar } from './site/layout/SiteNavbar';
import { SiteFooter } from './site/layout/SiteFooter';
import { Home } from './site/pages/Home';
import { Benchmarks } from './site/pages/Benchmarks';
import { Models } from './site/pages/Models';
import { Pricing } from './site/pages/Pricing';
import { Safety } from './site/pages/Safety';
import { Contact } from './site/pages/Contact';
import { useRoute, type RoutePath } from './site/routes';

const PAGES: Record<RoutePath, () => React.JSX.Element> = {
  '/': Home,
  '/benchmarks': Benchmarks,
  '/models': Models,
  '/pricing': Pricing,
  '/safety': Safety,
  '/contact': Contact,
};

function App() {
  const route = useRoute();
  const [isDark, setIsDark] = useState(false);
  const Page = PAGES[route];

  return (
    // The Netadyne palette is derived entirely from these HSL trios, so every
    // color="primary" / color="link" on the site recolors with them.
    <ConfigProvider iconLibrary="fa">
      <Theme
        isRoot
        colorMode={isDark ? 'dark' : 'light'}
        primaryH="258"
        primaryS="82%"
        primaryL="56%"
        linkH="192"
        linkS="88%"
        linkL="42%"
        infoH="205"
        infoS="80%"
        infoL="48%"
        successH="158"
        successS="72%"
        successL="38%"
      >
        <SiteNavbar
          current={route}
          isDark={isDark}
          onToggleScheme={() => setIsDark(dark => !dark)}
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
