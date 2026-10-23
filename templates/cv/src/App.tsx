import { useState } from 'react';
import { Column, Columns, Theme } from '@allxsmith/bestax-bulma';
import Intro from './Intro.tsx';
import SocialLinks from './SocialLinks.tsx';
import ThemeToggle from './ThemeToggle.tsx';
import {
  initialColorMode,
  saveColorMode,
  type ColorMode,
} from './colorMode.ts';

function App() {
  // The scheme index.html wrote before the first paint; Theme keeps
  // `data-theme` on <html> in step with it from here on.
  const [mode, setMode] = useState<ColorMode>(initialColorMode);

  const toggle = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    saveColorMode(next);
  };

  return (
    <Theme isRoot colorMode={mode}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <main id="main-content">
        <Columns mt="0">
          <Column size="6" className="left">
            <ThemeToggle mode={mode} onToggle={toggle} />
            <Intro />
            <SocialLinks />
          </Column>
          {/* The photo, a background image from src/index.css. */}
          <Column size="6" className="right" />
        </Columns>
      </main>
    </Theme>
  );
}

export default App;
