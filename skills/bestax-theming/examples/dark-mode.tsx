// Dark mode for an app built on @allxsmith/bestax-bulma.
//
// The Theme component drives the light/dark scheme: pass `colorMode` and it
// writes Bulma's `data-theme` attribute on <html>. This is global (even on a
// scoped Theme); `'system'` removes the attribute so Bulma follows the OS
// `prefers-color-scheme`. Wrap the app once at the root.
import React, { useState } from 'react';
import {
  Theme,
  Box,
  Button,
  Title,
  Notification,
} from '@allxsmith/bestax-bulma';

type Mode = 'light' | 'dark' | 'system';

export function DarkModeToggle() {
  const [mode, setMode] = useState<Mode>('system');

  return (
    <Theme isRoot colorMode={mode}>
      <Box>
        <Title size="5">Color mode: {mode}</Title>
        <Notification color="info">
          Components below follow the current Bulma color scheme.
        </Notification>
        <Button color="primary" onClick={() => setMode('light')}>
          Light
        </Button>
        <Button color="primary" onClick={() => setMode('dark')}>
          Dark
        </Button>
        <Button onClick={() => setMode('system')}>System</Button>
      </Box>
    </Theme>
  );
}
