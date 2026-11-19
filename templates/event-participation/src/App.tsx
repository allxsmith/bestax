import { useState } from 'react';
import { Container, Hero, Theme } from '@allxsmith/bestax-bulma';
import {
  initialColorMode,
  saveColorMode,
  type ColorMode,
} from './colorMode.ts';
import EventIntro from './EventIntro.tsx';
import ParticipationForm from './ParticipationForm.tsx';
import SiteFooter from './SiteFooter.tsx';
import ThemeToggle from './ThemeToggle.tsx';

function App() {
  const [mode, setMode] = useState<ColorMode>(initialColorMode);

  const changeMode = (next: ColorMode) => {
    setMode(next);
    saveColorMode(next);
  };

  return (
    <Theme isRoot colorMode={mode}>
      <Hero size="fullheight" color="dark">
        {/* The drifting gold lights behind the page, drawn in index.css. */}
        <div className="bokeh" aria-hidden="true">
          {Array.from({ length: 12 }, (_, light) => (
            <span key={light} />
          ))}
        </div>
        <ThemeToggle mode={mode} onChange={changeMode} />
        <Hero.Body>
          <Container as="main" textAlign="centered">
            <EventIntro />
            <ParticipationForm />
          </Container>
        </Hero.Body>
        <SiteFooter />
      </Hero>
    </Theme>
  );
}

export default App;
