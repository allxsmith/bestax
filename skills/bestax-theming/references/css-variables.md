# Bulma CSS variables & override mechanisms

`@allxsmith/bestax-bulma` wraps **Bulma 1.x**, which is themed entirely through `--bulma-*` CSS
custom properties. Every color, font, size, and radius resolves from one of these variables, so
theming means overriding the right `--bulma-*` values.

## How to override (three paths)

### 1. The `Theme` component (runtime, recommended)

`Theme` is exported from the package and writes `--bulma-*` variables for you.

- `isRoot` → injects the variables globally at `:root` (use once, at the app root).
- without `isRoot` → wraps children in a `<div>` and scopes the variables to that subtree.
- Named props set the color/scheme HSL channels and common values (see "Theme props" below).
- `bulmaVars` sets any other variable, keyed by its real `--bulma-*` name:

```tsx
<Theme
  isRoot
  primaryH="265"
  primaryS="65%"
  primaryL="55%"
  bulmaVars={{
    '--bulma-radius': '0.75rem',
    '--bulma-family-primary': "'Inter', sans-serif",
  }}
>
  <App />
</Theme>
```

> Note: the type of the `bulmaVars` keys is not exported — pass it as an object literal (TypeScript
> still checks the keys against the allowed `--bulma-*` names).

### 2. Plain CSS

Set the variables yourself on any selector. `:root` themes the whole document; a class scopes it.

```css
:root {
  --bulma-primary-h: 265;
  --bulma-primary-s: 65%;
  --bulma-primary-l: 55%;
  --bulma-radius: 0.75rem;
}
```

### 3. Build-time Sass

If compiling Bulma's Sass yourself, set the SCSS variables before the CSS variables are generated:

```scss
@use 'bulma/sass' with (
  $primary: #1e6b99,
  $link: #485fc7
);
```

(The library itself ships `$primary: #1e6b99` — HSL `202 / 67% / 36%` — this way.)

## Colors — override the H/S/L trio to recolor

Bulma derives a color's entire palette (shades, light/dark/invert variants) from three channels.
Override the trio; the rest follows automatically. For each color `<c>` ∈ `primary`, `link`,
`info`, `success`, `warning`, `danger`:

| Variable        | Meaning                    | `Theme` prop             |
| --------------- | -------------------------- | ------------------------ |
| `--bulma-<c>-h` | hue (unitless, e.g. `265`) | `<c>H` (e.g. `primaryH`) |
| `--bulma-<c>-s` | saturation (`%`)           | `<c>S`                   |
| `--bulma-<c>-l` | lightness (`%`)            | `<c>L`                   |

Read-only derived values (set automatically; reference if you need them): `--bulma-<c>` (the
resolved color), `--bulma-<c>-invert`, `--bulma-<c>-light`, `--bulma-<c>-dark`, `--bulma-<c>-rgb`,
and numeric shades `--bulma-<c>-00` … `--bulma-<c>-95`.

## Scheme, text, background, border (light/dark surfaces)

| Variable                                                                    | Role                                                  |
| --------------------------------------------------------------------------- | ----------------------------------------------------- |
| `--bulma-scheme-h`, `--bulma-scheme-s`                                      | scheme hue/saturation (`Theme`: `schemeH`, `schemeS`) |
| `--bulma-scheme-main`, `--bulma-scheme-main-bis`, `--bulma-scheme-main-ter` | page/surface backgrounds (main + subtle steps)        |
| `--bulma-background`                                                        | secondary background                                  |
| `--bulma-text`, `--bulma-text-strong`, `--bulma-text-weak`                  | body / emphasized / muted text                        |
| `--bulma-border`, `--bulma-border-weak`                                     | borders                                               |

## Radius, typography

| Variable                                                                      | Default                           | `Theme` prop    |
| ----------------------------------------------------------------------------- | --------------------------------- | --------------- |
| `--bulma-radius-small` / `--bulma-radius` / `--bulma-radius-large`            | 0.25 / 0.375 / 0.75rem            | via `bulmaVars` |
| `--bulma-radius-rounded`                                                      | 9999px                            | via `bulmaVars` |
| `--bulma-family-primary` / `--bulma-family-secondary` / `--bulma-family-code` | sans / sans / mono                | via `bulmaVars` |
| `--bulma-size-1` … `--bulma-size-7`                                           | 3rem … 0.75rem                    | via `bulmaVars` |
| `--bulma-size-small` / `-normal` / `-medium` / `-large`                       | 0.75 / 1 / 1.25 / 1.5rem          | via `bulmaVars` |
| `--bulma-weight-light/normal/medium/semibold/bold/extrabold`                  | 300 / 400 / 500 / 600 / 700 / 800 | via `bulmaVars` |

## Extras component variables (Avatar / Avatars / Badge)

These are registered on the component's **own selector** (`.avatar`, `.avatars`, `.badge` —
`.bestax-avatar` etc. with the prefixed CSS flavor), not on `:root`. A value set on a wrapping
ancestor — including `Theme`'s `bulmaVars` on a wrapping `Theme` — is only _inherited_ and
always loses to the component-level declaration, so it will NOT take effect. Working overrides
target the component's own element instead: redeclare on the component's own class in your CSS
(mind the class prefix), e.g. `.avatar { --bulma-avatar-size: 3.5rem; }`, or pass a
`className` and scope the override under it
(`.avatar.big-avatar { --bulma-avatar-size: 3.5rem; }`), or set it via the component's `style`
prop. Several default to core theme vars above, so they already flow through a custom theme.

| Variable                                                          | Default                          |
| ----------------------------------------------------------------- | -------------------------------- |
| `--bulma-avatar-size`                                             | `48px`                           |
| `--bulma-avatar-background` / `--bulma-avatar-color`              | `background` / `text`            |
| `--bulma-avatar-weight`                                           | `weight-semibold`                |
| `--bulma-avatar-rounded-radius`                                   | `radius-large`                   |
| `--bulma-avatars-ring-color` / `--bulma-avatars-ring-width`       | `scheme-main` / `2px`            |
| `--bulma-avatars-spacing`                                         | `0.75rem` (`sm` 0.5 / `lg` 1rem) |
| `--bulma-badge-height` / `--bulma-badge-min-width`                | `1.25em` / `1.25em`              |
| `--bulma-badge-padding` / `--bulma-badge-font-size`               | `0 0.4em` / `0.7rem`             |
| `--bulma-badge-radius`                                            | `radius-rounded`                 |
| `--bulma-badge-ring-color` / `--bulma-badge-ring-width`           | `scheme-main` / `2px`            |
| `--bulma-badge-dot-size`                                          | `0.65em`                         |
| `--bulma-badge-inset-circle` / `--bulma-badge-animation-duration` | `12%` / `1.4s`                   |

## Dark mode (`Theme colorMode`)

Drive the light/dark scheme with the `Theme` component's **`colorMode`** prop —
`'light' | 'dark' | 'system'`:

```tsx
<Theme isRoot colorMode={mode}>
  <App />
</Theme>
```

`colorMode` writes Bulma's **`data-theme`** attribute on `<html>`, so it is always **global** (even
on a scoped `Theme`). `'system'` removes the attribute, so Bulma falls back to the OS
`@media (prefers-color-scheme: dark)`. Omitting `colorMode` leaves the current setting untouched.

Under the hood this is Bulma 1.x's own mechanism — `[data-theme="dark"]` / `.theme-dark` selectors
(plus the `prefers-color-scheme` media query). Setting the attribute by hand still works
(`document.documentElement.setAttribute('data-theme', 'dark')`); `colorMode` just does it for you.

Under dark mode Bulma flips the scheme/text/border/background lightness variables (e.g.
`--bulma-scheme-main-l` 100% → 9%, `--bulma-text-l` 29% → 71%). Your brand color overrides from
`Theme isRoot` or `:root` still apply on top, because they set the hue/saturation/lightness
channels directly.

### The single-mode contrast trap

Because the OS preference applies whenever no `data-theme` attribute is set — the default state
of every app that never configured `colorMode` — a light-only design silently breaks for any
dark-mode visitor: Bulma's text goes near-white while author-defined fixed tokens stay light —
white text on cream. The failure is invisible unless the author's own OS is in dark mode.

**If the design is single-mode, pin the scheme** so text can't flip out from under the palette:

```tsx
<Theme isRoot colorMode="light">
  <App />
</Theme>
```

**If both modes are supported, never expose a fixed custom token to the flip** — derive it from
scheme variables, or flip it yourself:

```css
/* Preferred: track the scheme automatically. */
:root {
  --my-canvas: var(--bulma-scheme-main);
  --my-ink: var(--bulma-text);
}
/* Or, when custom values must be kept, provide the dark pair for BOTH
   ways dark mode arrives — the explicit attribute (colorMode="dark")… */
[data-theme='dark'] {
  --my-canvas: #14251b;
  --my-ink: #eef3e7;
}

/* …and the OS preference, which applies when no data-theme is set
   (colorMode="system" removes the attribute): */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --my-canvas: #14251b;
    --my-ink: #eef3e7;
  }
}
```

Deriving from scheme variables is preferred precisely because it covers both dark-mode paths
with no extra selector.

The same reasoning applies to **fixed-color surfaces** inside either kind of page (a dark hero,
a brand banner): content sitting on a surface that never flips must use pinned colors — filled
buttons and explicit text colors — not scheme-derived defaults (see the layout skill's hero CTA
rule).

## `Theme` props (named)

Color trios: `primaryH/primaryS/primaryL`, `linkH/linkS/linkL`, `infoH/S/L`, `successH/S/L`,
`warningH/S/L`, `dangerH/S/L`. Scheme: `schemeH`, `schemeS`, `lightL`, `darkL`, `lightInvertL`,
`darkInvertL`, `softL`, `boldL`, `softInvertL`, `boldInvertL`. Interaction deltas:
`hoverBackgroundLDelta`, `activeBackgroundLDelta`, `hoverBorderLDelta`, `activeBorderLDelta`,
`hoverColorLDelta`, `activeColorLDelta`, `hoverShadowADelta`, `activeShadowADelta`. Everything else:
`bulmaVars={{ '--bulma-…': '…' }}`. All values are strings.
