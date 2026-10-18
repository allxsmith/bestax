import { useState } from 'react';
import { Column, Columns, Theme } from '@allxsmith/bestax-bulma';
import {
  initialColorMode,
  saveColorMode,
  type ColorMode,
} from './colorMode.ts';
import Intro from './Intro.tsx';
import SocialLinks from './SocialLinks.tsx';
import ThemeToggle from './ThemeToggle.tsx';

function App() {
  const [mode, setMode] = useState<ColorMode>(initialColorMode);

  const toggleMode = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    saveColorMode(next);
  };

  return (
    // index.html sets Bulma's data-theme on <html> before the first paint,
    // and colorMode keeps it in step with the toggle from then on.
    <Theme isRoot colorMode={mode}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <main id="main-content">
        <Columns mt="0">
          <Column size="6" className="left">
            <ThemeToggle isDark={mode === 'dark'} onToggle={toggleMode} />
            <Intro />
            <SocialLinks />
          </Column>
          {/* The photo, a background image set in index.css. */}
          <Column size="6" className="right" />
        </Columns>
      </main>
    </Theme>
  );
}

export default App;
