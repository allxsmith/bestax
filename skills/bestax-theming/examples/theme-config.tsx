// Custom brand theme for an app built on @allxsmith/bestax-bulma.
// Copy this to your app and adjust the HSL values to your brand.
//
// Bulma 1.x builds each color from a hue/saturation/lightness trio
// (--bulma-<color>-h / -s / -l). Overriding the trio recolors the color
// itself, and its shades and variants take the new hue and saturation at the
// lightnesses the stylesheet was built with.
// The <Theme> component writes those CSS variables for you:
//   - isRoot          -> inject the variables globally at :root (use once, at the app root)
//   - without isRoot  -> wrap children in a <div> and scope the variables to it
//
// Of those built lightnesses, the label on a solid color
// (--bulma-<color>-invert-l) and the color's text on the page
// (--bulma-<color>-on-scheme-l, which for `link` is every link) were picked
// for contrast. A color that reads lighter or darker than the stylesheet's
// own needs those set in your CSS too, which Theme does not do;
// references/css-variables.md ("Colors") says how.
import type { ReactNode } from 'react';
import {
  Theme,
  Button,
  Notification,
  Box,
  Title,
} from '@allxsmith/bestax-bulma';

// 1) Global brand theme at the app root.
//    Hue is unitless; saturation and lightness are percentages.
export function ThemedApp({ children }: { children: ReactNode }) {
  return (
    <Theme
      isRoot
      // Brand primary (HSL trio) — recolors every `is-primary` / `has-text-primary`.
      primaryH="265"
      primaryS="65%"
      primaryL="55%"
      // Anything without a named prop goes through `bulmaVars`, keyed by the real
      // --bulma-* variable names (string values).
      bulmaVars={{
        '--bulma-radius': '0.75rem',
        '--bulma-radius-large': '1.25rem',
        // 'Inter' must actually be loaded (index.html <link> or an @fontsource
        // import) — declaring the family var alone falls back to system-ui.
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
    <Theme primaryH="16" primaryS="85%" primaryL="40%">
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
