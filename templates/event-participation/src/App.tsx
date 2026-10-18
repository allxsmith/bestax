import { useState } from 'react';
import { Container, Hero, Theme } from '@allxsmith/bestax-bulma';
import {
  initialColorMode,
  saveColorMode,
  type ColorMode,
} from './colorMode.ts';
import Invitation from './Invitation.tsx';
import ParticipationForm from './ParticipationForm.tsx';
import SiteFooter from './SiteFooter.tsx';
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
      <Hero size="fullheight" color="dark">
        {/* The drifting lights behind the page, drawn by src/index.css. */}
        <div className="bokeh" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => (
            <span key={index} />
          ))}
        </div>
        <ThemeToggle isDark={mode === 'dark'} onToggle={toggleMode} />
        <Hero.Body>
          <Container textAlign="centered">
            <main>
              <Invitation />
              <ParticipationForm />
            </main>
          </Container>
        </Hero.Body>
        <SiteFooter />
      </Hero>
    </Theme>
  );
}

export default App;
