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

> `--bulma-family-*` only selects the family — also load the font itself (a `<link>` in
> `index.html` or an `@fontsource/*` package import), or the browser silently falls back to
> the system font.

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

## Extras component variables

Every "Beyond Bulma" extra registers its own `--bulma-<component>-*` variables. They are
registered on the component's **own selector** (`.avatar`, `.dialog`, `.tooltip`, … —
`.bestax-avatar` etc. with the prefixed CSS flavor), not on `:root`. A value set on a wrapping
ancestor — including `Theme`'s `bulmaVars` on a wrapping `Theme` — is only _inherited_ and
always loses to the component-level declaration, so it will NOT take effect. Working overrides
target the component's own element instead: redeclare on the component's own class in your CSS
(mind the class prefix), e.g. `.avatar { --bulma-avatar-size: 3.5rem; }`, or pass a
`className` and scope the override under it
(`.avatar.big-avatar { --bulma-avatar-size: 3.5rem; }`), or set it via the component's `style`
prop. Several default to core theme vars above, so they already flow through a custom theme.

### Avatar / Avatars / Badge

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

The remaining extras register the variables below — names only; each default lives in the
component's SCSS partial under `bulma-ui/src/scss/` as a `$<name> !default` variable. The same
own-selector override rule applies.

### Autocomplete

`--bulma-autocomplete-border-color`, `--bulma-autocomplete-border-hover-color`,
`--bulma-autocomplete-dropdown-background`, `--bulma-autocomplete-dropdown-offset`,
`--bulma-autocomplete-dropdown-padding-y`, `--bulma-autocomplete-dropdown-radius`,
`--bulma-autocomplete-dropdown-shadow`, `--bulma-autocomplete-dropdown-z-index`,
`--bulma-autocomplete-empty-color`, `--bulma-autocomplete-header-footer-color`,
`--bulma-autocomplete-header-footer-padding`, `--bulma-autocomplete-header-footer-size`,
`--bulma-autocomplete-icon-hover-color`, `--bulma-autocomplete-item-color`,
`--bulma-autocomplete-item-disabled-color`, `--bulma-autocomplete-item-disabled-opacity`,
`--bulma-autocomplete-item-hover-background`, `--bulma-autocomplete-item-hover-color`,
`--bulma-autocomplete-item-large-padding`, `--bulma-autocomplete-item-medium-padding`,
`--bulma-autocomplete-item-padding`, `--bulma-autocomplete-item-small-padding`,
`--bulma-autocomplete-loader-active-color`, `--bulma-autocomplete-loader-border-color`,
`--bulma-autocomplete-loader-duration`, `--bulma-autocomplete-scrollbar-thumb`,
`--bulma-autocomplete-scrollbar-thumb-hover`, `--bulma-autocomplete-scrollbar-track`,
`--bulma-autocomplete-scrollbar-width`

### Carousel

`--bulma-carousel-arrow-background`, `--bulma-carousel-arrow-background-hover`,
`--bulma-carousel-arrow-color`, `--bulma-carousel-arrow-disabled-opacity`,
`--bulma-carousel-arrow-icon-size`, `--bulma-carousel-arrow-icon-size-mobile`,
`--bulma-carousel-arrow-offset`, `--bulma-carousel-arrow-offset-mobile`,
`--bulma-carousel-arrow-radius`, `--bulma-carousel-arrow-size`,
`--bulma-carousel-arrow-size-mobile`, `--bulma-carousel-fade-duration`,
`--bulma-carousel-indicator-background`, `--bulma-carousel-indicator-background-active`,
`--bulma-carousel-indicator-background-hover`, `--bulma-carousel-indicator-bar-height`,
`--bulma-carousel-indicator-bar-height-mobile`, `--bulma-carousel-indicator-bar-width`,
`--bulma-carousel-indicator-bar-width-mobile`, `--bulma-carousel-indicator-circle-size`,
`--bulma-carousel-indicator-gap`, `--bulma-carousel-indicator-gap-mobile`,
`--bulma-carousel-indicator-line-height`, `--bulma-carousel-indicator-line-height-mobile`,
`--bulma-carousel-indicator-line-radius`, `--bulma-carousel-indicator-line-width`,
`--bulma-carousel-indicator-line-width-mobile`, `--bulma-carousel-indicator-size`,
`--bulma-carousel-indicator-size-mobile`, `--bulma-carousel-overlay-arrow-background`,
`--bulma-carousel-overlay-arrow-background-hover`, `--bulma-carousel-overlay-arrow-color`,
`--bulma-carousel-overlay-indicator-background`,
`--bulma-carousel-overlay-indicator-background-active`,
`--bulma-carousel-overlay-indicator-background-hover`, `--bulma-carousel-transition-duration`

### Checkbox

`--bulma-checkbox-active-color`, `--bulma-checkbox-background`, `--bulma-checkbox-border-color`,
`--bulma-checkbox-border-width`, `--bulma-checkbox-check-color`,
`--bulma-checkbox-focus-shadow-size`, `--bulma-checkbox-indeterminate-color`,
`--bulma-checkbox-label-gap`, `--bulma-checkbox-radius`, `--bulma-checkbox-size`,
`--bulma-checkbox-transition-duration`

### Collapse

`--bulma-collapse-border-color`, `--bulma-collapse-group-gap`, `--bulma-collapse-header-weight`,
`--bulma-collapse-margin-bottom`, `--bulma-collapse-radius`,
`--bulma-collapse-trigger-icon-margin`, `--bulma-collapse-trigger-icon-size`

### DateInput

`--bulma-dateinput-cell-color`, `--bulma-dateinput-cell-disabled-color`,
`--bulma-dateinput-cell-hover-bg`, `--bulma-dateinput-cell-other-month-color`,
`--bulma-dateinput-cell-radius`, `--bulma-dateinput-cell-selected-bg`,
`--bulma-dateinput-cell-selected-color`, `--bulma-dateinput-cell-size`,
`--bulma-dateinput-cell-today-color`, `--bulma-dateinput-day-name-color`,
`--bulma-dateinput-day-name-size`, `--bulma-dateinput-header-padding`,
`--bulma-dateinput-min-width`, `--bulma-dateinput-nav-button-size`

### DateTimeInput

`--bulma-datetimeinput-gap`, `--bulma-datetimeinput-time-card-background`,
`--bulma-datetimeinput-time-card-border-color`, `--bulma-datetimeinput-time-card-padding`,
`--bulma-datetimeinput-time-card-radius`, `--bulma-datetimeinput-time-card-shadow`,
`--bulma-datetimeinput-time-overlay-background`, `--bulma-datetimeinput-time-overlay-blur`

### Dialog

`--bulma-dialog-animation-duration`, `--bulma-dialog-background`, `--bulma-dialog-body-color`,
`--bulma-dialog-body-line-height`, `--bulma-dialog-body-padding`, `--bulma-dialog-border-color`,
`--bulma-dialog-footer-gap`, `--bulma-dialog-footer-padding`, `--bulma-dialog-header-padding`,
`--bulma-dialog-icon-margin`, `--bulma-dialog-icon-size`, `--bulma-dialog-max-width`,
`--bulma-dialog-radius`, `--bulma-dialog-shadow`, `--bulma-dialog-title-color`,
`--bulma-dialog-title-size`, `--bulma-dialog-title-weight`, `--bulma-dialog-width`

### LinkButton

`--bulma-link-button-ghost-color`, `--bulma-link-button-ghost-hover-color`,
`--bulma-link-button-transition-duration`, `--bulma-link-button-underline-offset`

### Loading

`--bulma-loading-animation-duration`, `--bulma-loading-cancel-background`,
`--bulma-loading-cancel-border-color`, `--bulma-loading-cancel-color`,
`--bulma-loading-cancel-hover-border-color`, `--bulma-loading-cancel-hover-color`,
`--bulma-loading-cancel-radius`, `--bulma-loading-cancel-size`, `--bulma-loading-content-gap`,
`--bulma-loading-icon-border-width`, `--bulma-loading-icon-border-width-large`,
`--bulma-loading-icon-border-width-medium`, `--bulma-loading-icon-border-width-small`,
`--bulma-loading-icon-size`, `--bulma-loading-icon-size-large`,
`--bulma-loading-icon-size-medium`, `--bulma-loading-icon-size-small`,
`--bulma-loading-icon-spin-color`, `--bulma-loading-overlay-background`,
`--bulma-loading-overlay-fullpage-opacity`, `--bulma-loading-overlay-opacity`,
`--bulma-loading-overlay-opacity-dark`, `--bulma-loading-overlay-opacity-light`,
`--bulma-loading-overlay-opacity-opaque`, `--bulma-loading-text-color`,
`--bulma-loading-text-size`

### Numberinput

`--bulma-numberinput-disabled-opacity`, `--bulma-numberinput-rounded-button-size`,
`--bulma-numberinput-stepper-border-color`, `--bulma-numberinput-stepper-button-color`,
`--bulma-numberinput-stepper-button-hover-bg`, `--bulma-numberinput-stepper-button-hover-color`,
`--bulma-numberinput-stepper-width`

### Picker popover (DateInput / TimeInput / DateTimeInput)

`--bulma-picker-popover-animation-duration`, `--bulma-picker-popover-background`,
`--bulma-picker-popover-border-color`, `--bulma-picker-popover-offset`,
`--bulma-picker-popover-padding`, `--bulma-picker-popover-radius`,
`--bulma-picker-popover-shadow`, `--bulma-picker-popover-z-index`,
`--bulma-picker-trigger-color`, `--bulma-picker-trigger-hover-color`,
`--bulma-picker-trigger-width`

### Radio

`--bulma-radio-active-color`, `--bulma-radio-background`, `--bulma-radio-border-color`,
`--bulma-radio-border-width`, `--bulma-radio-dot-color`, `--bulma-radio-focus-shadow-size`,
`--bulma-radio-label-gap`, `--bulma-radio-size`, `--bulma-radio-transition-duration`

### Rate

`--bulma-rate-color-active`, `--bulma-rate-color-hover`, `--bulma-rate-color-inactive`,
`--bulma-rate-disabled-opacity`, `--bulma-rate-font-icon-size`,
`--bulma-rate-font-icon-size-large`, `--bulma-rate-font-icon-size-medium`,
`--bulma-rate-font-icon-size-small`, `--bulma-rate-gap`, `--bulma-rate-icon-size`,
`--bulma-rate-icon-size-large`, `--bulma-rate-icon-size-medium`, `--bulma-rate-icon-size-small`,
`--bulma-rate-pop-scale`, `--bulma-rate-score-color`, `--bulma-rate-score-weight`,
`--bulma-rate-spaced-gap`, `--bulma-rate-text-color`, `--bulma-rate-text-size`,
`--bulma-rate-transition-duration`

### Reveal

`--bulma-reveal-duration`, `--bulma-reveal-easing`, `--bulma-reveal-flip-angle`,
`--bulma-reveal-offset`, `--bulma-reveal-offset-large`, `--bulma-reveal-scale`

### Sidebar

`--bulma-sidebar-background`, `--bulma-sidebar-close-color`,
`--bulma-sidebar-close-hover-background`, `--bulma-sidebar-close-line-width`,
`--bulma-sidebar-close-radius`, `--bulma-sidebar-close-size`, `--bulma-sidebar-content-padding`,
`--bulma-sidebar-footer-border-color`, `--bulma-sidebar-footer-margin-top`,
`--bulma-sidebar-footer-padding`, `--bulma-sidebar-header-border-color`,
`--bulma-sidebar-header-margin-bottom`, `--bulma-sidebar-header-padding`,
`--bulma-sidebar-menu-item-active-background`, `--bulma-sidebar-menu-item-active-color`,
`--bulma-sidebar-menu-item-hover-background`, `--bulma-sidebar-menu-item-padding`,
`--bulma-sidebar-menu-item-radius`, `--bulma-sidebar-overlay-background`,
`--bulma-sidebar-scrollbar-color`, `--bulma-sidebar-scrollbar-color-hover`,
`--bulma-sidebar-scrollbar-width`, `--bulma-sidebar-shadow`,
`--bulma-sidebar-static-border-color`, `--bulma-sidebar-title-color`,
`--bulma-sidebar-title-size`, `--bulma-sidebar-title-weight`,
`--bulma-sidebar-transition-duration`, `--bulma-sidebar-width`

### Slider

`--bulma-slider-disabled-opacity`, `--bulma-slider-fill-color`,
`--bulma-slider-output-background`, `--bulma-slider-output-color`,
`--bulma-slider-output-font-size`, `--bulma-slider-output-font-weight`, `--bulma-slider-radius`,
`--bulma-slider-thumb-border`, `--bulma-slider-thumb-color`, `--bulma-slider-thumb-shadow`,
`--bulma-slider-thumb-size`, `--bulma-slider-thumb-size-large`,
`--bulma-slider-thumb-size-medium`, `--bulma-slider-thumb-size-small`,
`--bulma-slider-tick-color`, `--bulma-slider-tick-height`, `--bulma-slider-tick-label-color`,
`--bulma-slider-tick-label-font-size`, `--bulma-slider-tick-opacity`,
`--bulma-slider-tick-width`, `--bulma-slider-track-color`, `--bulma-slider-track-height`,
`--bulma-slider-track-height-large`, `--bulma-slider-track-height-medium`,
`--bulma-slider-track-height-small`, `--bulma-slider-transition-duration`,
`--bulma-slider-vertical-height`

### Steps

`--bulma-steps-animation-duration`, `--bulma-steps-content-margin-top`,
`--bulma-steps-default-color`, `--bulma-steps-divider-height`, `--bulma-steps-marker-background`,
`--bulma-steps-marker-font-size`, `--bulma-steps-marker-font-weight`,
`--bulma-steps-marker-size`, `--bulma-steps-marker-size-large`,
`--bulma-steps-marker-size-medium`, `--bulma-steps-marker-size-small`,
`--bulma-steps-navigation-margin-top`, `--bulma-steps-title-active-color`,
`--bulma-steps-title-active-weight`, `--bulma-steps-title-color`, `--bulma-steps-title-size`,
`--bulma-steps-title-weight`, `--bulma-steps-vertical-content-margin-left`,
`--bulma-steps-vertical-padding`

### Switch

`--bulma-switch-active-color`, `--bulma-switch-background`, `--bulma-switch-border-width`,
`--bulma-switch-circle-color`, `--bulma-switch-circle-shadow`, `--bulma-switch-focus-shadow`,
`--bulma-switch-height`, `--bulma-switch-label-gap`, `--bulma-switch-padding`,
`--bulma-switch-radius`, `--bulma-switch-thin-circle-size`, `--bulma-switch-thin-height`,
`--bulma-switch-transition-duration`, `--bulma-switch-width`

### Tabs

`--bulma-tabs-content-padding`, `--bulma-tabs-vertical-border-color`,
`--bulma-tabs-vertical-border-width`, `--bulma-tabs-vertical-min-width`

### Taginput

`--bulma-taginput-background`, `--bulma-taginput-border-color`, `--bulma-taginput-border-radius`,
`--bulma-taginput-dropdown-max-height`, `--bulma-taginput-height`, `--bulma-taginput-min-height`,
`--bulma-taginput-padding`, `--bulma-taginput-tag-gap`, `--bulma-taginput-transition-duration`

### TimeInput

`--bulma-timeinput-footer-padding`, `--bulma-timeinput-separator-color`,
`--bulma-timeinput-separator-size`, `--bulma-timeinput-wheel-bg`,
`--bulma-timeinput-wheel-color`, `--bulma-timeinput-wheel-dim-color`,
`--bulma-timeinput-wheel-gap`, `--bulma-timeinput-wheel-hover-bg`,
`--bulma-timeinput-wheel-item-height`, `--bulma-timeinput-wheel-mask`,
`--bulma-timeinput-wheel-radius`, `--bulma-timeinput-wheel-selected-bg`,
`--bulma-timeinput-wheel-selected-color`, `--bulma-timeinput-wheel-width`

### Toast

`--bulma-toast-action-hover-opacity`, `--bulma-toast-action-radius`,
`--bulma-toast-action-weight`, `--bulma-toast-animation-duration`, `--bulma-toast-background`,
`--bulma-toast-color`, `--bulma-toast-gap`, `--bulma-toast-max-width`,
`--bulma-toast-message-size`, `--bulma-toast-min-width`, `--bulma-toast-padding`,
`--bulma-toast-radius`, `--bulma-toast-shadow`

### Tooltip

`--bulma-tooltip-arrow-margin`, `--bulma-tooltip-arrow-size`, `--bulma-tooltip-background`,
`--bulma-tooltip-color`, `--bulma-tooltip-dashed-color`, `--bulma-tooltip-font-size`,
`--bulma-tooltip-font-weight`, `--bulma-tooltip-line-height`, `--bulma-tooltip-max-width`,
`--bulma-tooltip-multiline-width`, `--bulma-tooltip-padding`, `--bulma-tooltip-radius`,
`--bulma-tooltip-z-index`

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
