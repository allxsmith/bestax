---
name: bestax-theming
description: Customize colors, branding, dark mode, and visual tokens of an app built with @allxsmith/bestax-bulma. Use when changing the primary/brand color, recoloring components, overriding Bulma --bulma-* CSS variables, setting fonts/radius/spacing tokens, adding light/dark mode, or configuring the app-wide icon library / class prefix via ConfigProvider.
license: MIT
---

# Theming @allxsmith/bestax-bulma

`@allxsmith/bestax-bulma` wraps Bulma 1.x, which is themed through `--bulma-*` CSS custom
properties. Theme an app by overriding the right variables — no component re-styling required.

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

## Contrast rules (dark mode is on by default)

When nothing sets a `data-theme` attribute (omitting `colorMode` preserves an existing one, but
apps that never configured it have none), Bulma follows the visitor's OS: `--bulma-text`,
`--bulma-scheme-main`, etc. flip on a dark-mode machine even if the design never intended a dark
theme. Custom fixed tokens (`--my-canvas: #f6f4ec`) do **not** flip — producing near-white Bulma
text on the author's fixed light background. Apply exactly one of these rules whenever custom
color tokens or fixed-color surfaces exist:

- **Single-mode design → pin the scheme.** `<Theme isRoot colorMode="light">` (or `"dark"`), so
  an OS preference can never invert text out from under the fixed palette.
- **Both modes → no exposed fixed tokens.** Derive custom tokens from scheme variables
  (`--my-canvas: var(--bulma-scheme-main)`) — or flip them yourself under **both** dark-mode
  paths: `[data-theme='dark']` **and** `@media (prefers-color-scheme: dark)` scoped to
  `:root:not([data-theme])`, since `colorMode="system"` removes the attribute (snippets in
  `references/css-variables.md`). Alternating/tinted section bands are this case:
  `background: var(--bulma-scheme-main-bis)` (then `-ter`), never `bgColor="light"` —
  `light`/`white`/grey helper backgrounds are fixed colors that fight dark mode.
- **Fixed-color surface → fixed-color content.** On a surface that never changes (a dark hero,
  a brand banner), pin the content's colors too: solid/filled buttons and explicit text colors,
  never scheme-derived defaults or thin outlines that depend on the flipping scheme.

Reach for the helper props (`color` / `textColor` / `bgColor` / `colorShade`, `textSize`,
`textWeight`, `fontFamily`) to apply themed colors and type to individual components.
Variant flags are component-specific — never carry one over by analogy: `isLight` exists on
`Button`, `LinkButton`, and `Notification` **only** (`Tag` has none); the per-component
truth table is `references/themeable-components.md`.

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

## App-wide config (icons & class prefix)

`ConfigProvider` sets app-wide options once at the root, separate from `Theme`. Wrap the app so
you don't repeat the same prop on every component:

```tsx
import { ConfigProvider } from '@allxsmith/bestax-bulma';

// Set the icon library once — <Icon> no longer needs a `library` prop.
<ConfigProvider iconLibrary="fa">
  <App />
</ConfigProvider>;
// now <Icon name="check" /> resolves as Font Awesome; no per-icon library="fa".
```

- `iconLibrary` — `'fa' | 'mdi' | 'ion' | 'material-icons' | 'material-symbols'`. `Icon` reads it
  (`library || iconLibrary || 'fa'`), so set it here instead of on each `<Icon>`.
- `classPrefix` — namespaces every Bulma class (e.g. `bulma-`) to avoid collisions with other CSS.

Nest `Theme` and `ConfigProvider` together at the root (order doesn't matter).

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
- [ ] Set the icon library once with `<ConfigProvider iconLibrary="…">` at the root, not `library` on every `<Icon>`.
