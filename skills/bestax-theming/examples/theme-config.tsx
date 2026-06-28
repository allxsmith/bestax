// Custom brand theme for an app built on @allxsmith/bestax-bulma.
// Copy this to your app and adjust the HSL values to your brand.
//
// Bulma 1.x derives every shade of a color from its hue/saturation/lightness
// trio (--bulma-<color>-h / -s / -l), so overriding the trio recolors the whole
// palette. The <Theme> component writes those CSS variables for you:
//   - isRoot          -> inject the variables globally at :root (use once, at the app root)
//   - without isRoot  -> wrap children in a <div> and scope the variables to it
import React from 'react';
import {
  Theme,
  Button,
  Notification,
  Box,
  Title,
} from '@allxsmith/bestax-bulma';

// 1) Global brand theme at the app root.
//    Hue is unitless; saturation and lightness are percentages.
export function ThemedApp({ children }: { children: React.ReactNode }) {
  return (
    <Theme
      isRoot
      // Brand primary (HSL trio) — recolors every `is-primary` / `has-text-primary`.
      primaryH="265"
      primaryS="65%"
      primaryL="55%"
      // A matching link color.
      linkH="200"
      linkS="80%"
      linkL="45%"
      // Anything without a named prop goes through `bulmaVars`, keyed by the real
      // --bulma-* variable names (string values).
      bulmaVars={{
        '--bulma-radius': '0.75rem',
        '--bulma-radius-large': '1.25rem',
        '--bulma-family-primary': "'Inter', system-ui, sans-serif",
      }}
    >
      {children}
    </Theme>
  );
}

// 2) Scoped override — theme just one section; the rest of the app is untouched.
export function PromoPanel() {
  return (
    <Theme primaryH="16" primaryS="85%" primaryL="55%">
      <Box>
        <Title size="4">Limited offer</Title>
        <Notification color="primary">
          This panel uses a warm primary; the rest of the app is unaffected.
        </Notification>
        <Button color="primary">Claim it</Button>
      </Box>
    </Theme>
  );
}
