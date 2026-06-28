// Dark mode for an app built on @allxsmith/bestax-bulma.
//
// The library ships no dark-mode component — Bulma 1.x switches schemes from the
// `data-theme` attribute (and also honors the OS `prefers-color-scheme`). Set
// `data-theme="dark"` or `"light"` high in the tree — on <html> — and every Bulma
// component re-reads its --bulma-* scheme variables automatically.
import React, { useEffect, useState } from 'react';
import { Box, Button, Title, Notification } from '@allxsmith/bestax-bulma';

type Mode = 'light' | 'dark';

// Start from the OS preference (falls back to light during SSR).
function getInitialMode(): Mode {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function DarkModeToggle() {
  const [mode, setMode] = useState<Mode>(getInitialMode);

  // Apply the mode to <html> so Bulma's [data-theme="dark"] selectors take over.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  return (
    <Box>
      <Title size="5">Theme: {mode}</Title>
      <Notification color="info">
        Components below follow the current Bulma color scheme.
      </Notification>
      <Button
        color="primary"
        onClick={() => setMode(m => (m === 'light' ? 'dark' : 'light'))}
      >
        Switch to {mode === 'light' ? 'dark' : 'light'} mode
      </Button>
    </Box>
  );
}
