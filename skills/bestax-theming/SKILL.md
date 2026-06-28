---
name: bestax-theming
description: Customize colors, branding, dark mode, and visual tokens of an app built with @allxsmith/bestax-bulma. Use when changing the primary/brand color, recoloring components, overriding Bulma --bulma-* CSS variables, setting fonts/radius/spacing tokens, or adding light/dark mode.
license: MIT
---

# Theming @allxsmith/bestax-bulma

`@allxsmith/bestax-bulma` wraps Bulma 1.x, which is themed through `--bulma-*` CSS custom
properties. Theme an app by overriding the right variables — no component re-styling required.

## Use when

- Setting a brand/primary color or recoloring `link`/`info`/`success`/`warning`/`danger`.
- Adjusting global tokens — radius, fonts, sizes, weights.
- Adding light/dark mode.

## Approach

Recolor a brand color by overriding its **hue/saturation/lightness trio** — Bulma derives every
shade, light/dark, and invert variant from `--bulma-<color>-h` / `-s` / `-l`. Override the trio and
the whole palette follows.

Choose an override path:

- **`Theme` component (runtime, preferred).** Exported from the package. Pass named HSL props
  (`primaryH`, `primaryS`, `primaryL`, …) and/or `bulmaVars={{ '--bulma-*': '…' }}` for everything
  else. Add `isRoot` to inject the variables globally at `:root` (once, at the app root); omit it to
  scope the variables to the wrapped subtree.
- **Plain CSS.** Set `:root { --bulma-primary-h: …; }` (or any selector) directly.
- **Build-time Sass.** `@use 'bulma/sass' with ($primary: #1e6b99)` when compiling Bulma's Sass.

For **dark mode**, pass `colorMode` to `Theme` (`'light' | 'dark' | 'system'`). It writes Bulma's
`data-theme` attribute on `<html>`, flipping the light/dark scheme — global, even on a scoped
`Theme`; `'system'` follows the OS `prefers-color-scheme`. Drive it from state on the app-root
`Theme`: `<Theme isRoot colorMode={mode}>`.

Reach for the helper props (`color` / `textColor` / `bgColor` / `colorShade`, `textSize`,
`textWeight`, `fontFamily`) to apply themed colors and type to individual components.

## Quick start

```tsx
import { Theme, Button } from '@allxsmith/bestax-bulma';

// Global brand theme at the app root.
<Theme isRoot primaryH="265" primaryS="65%" primaryL="55%">
  <App />
</Theme>;

// Themed components recolor automatically.
<Button color="primary">Save</Button>;
```

## References

- `references/css-variables.md` — the `--bulma-*` variable map (colors, scheme/text/border, radius,
  fonts, sizes, weights, dark mode) and all three override mechanisms.
- `references/themeable-components.md` — which components take `color`/`size` props, the real
  accepted values, and the shared helper props.

## Examples

- `examples/theme-config.tsx` — a custom brand theme at the app root, plus a scoped override.
- `examples/dark-mode.tsx` — a light/dark toggle using Bulma's `data-theme`.

## Checklist

- [ ] Recolor brand colors via the HSL trio (`*-h` / `*-s` / `*-l`), not by hard-coding hex on components.
- [ ] Apply a global theme once with `<Theme isRoot>` (or `:root`); use scoped `<Theme>` for one-off sections.
- [ ] Set non-color tokens (radius, fonts, sizes) through `bulmaVars` or `:root`.
- [ ] Implement dark mode with `data-theme` on `<html>`; do not expect a shipped dark-mode component.
- [ ] Pass `color`/`textColor`/`bgColor` (not custom CSS) to color individual components.
