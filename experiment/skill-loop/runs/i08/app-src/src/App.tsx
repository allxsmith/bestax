import { useState } from 'react';
import { ConfigProvider, Theme } from '@allxsmith/bestax-bulma';
import { SiteFooter } from './components/SiteFooter';
import { SiteNav } from './components/SiteNav';
import { Access } from './pages/Access';
import { Benchmarks } from './pages/Benchmarks';
import { Home } from './pages/Home';
import { Platform } from './pages/Platform';
import { Pricing } from './pages/Pricing';
import { useRoute } from './routes';
import './App.css';

const PAGES = {
  '/': Home,
  '/benchmarks': Benchmarks,
  '/platform': Platform,
  '/pricing': Pricing,
  '/access': Access,
};

function App() {
  const route = useRoute();
  // Skynet's brand is dark-first; the navbar toggle switches schemes. Every
  // surface here is scheme-derived, so both modes hold their contrast.
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('dark');
  const Page = PAGES[route];

  return (
    <ConfigProvider iconLibrary="fa">
      <Theme
        isRoot
        colorMode={colorMode}
        primaryH="187"
        primaryS="82%"
        primaryL="42%"
        linkH="200"
        linkS="80%"
        linkL="48%"
        bulmaVars={{ '--bulma-radius-large': '0.75rem' }}
      >
        <SiteNav
          current={route}
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
