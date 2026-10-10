---
title: Theme
sidebar_label: Theme
sidebar_position: 3
---

# Theme

## Overview

The `Theme` component provides a powerful way to customize Bulma's appearance using CSS custom properties (CSS variables). It allows you to override Bulma's design tokens like colors, spacing, typography, and other visual properties either globally or locally within specific component trees. The Theme component supports both CSS variable injection via props and direct CSS variable objects.

---

## Import

```tsx
import { Theme } from '@allxsmith/bestax-bulma';
```

---

## Usage

### Basic Theme Customization

```tsx
function BasicThemeCustomization() {
  return (
    <Theme primaryH="270" primaryS="100%" primaryL="50%">
      <Box p="4">
        <Button color="primary">Purple Primary Button</Button>
      </Box>
    </Theme>
  );
}
```

### Global Theme (Root Level)

```tsx
function GlobalTheme() {
  return (
    <Theme isRoot={true} primaryH="270" primaryS="100%" primaryL="50%">
      <div>
        <Button color="primary">Global Purple Theme</Button>
        <Button color="info">Info Button</Button>
      </div>
    </Theme>
  );
}
```

### Dark Mode

The `colorMode` prop sets Bulma's `data-theme` on `<html>`, flipping the light/dark scheme globally.
Use `'system'` to follow the OS preference.

A prefixed stylesheet reads Bulma's prefixed attribute instead (`data-bestax-theme` for
`bestax-prefixed.css` and `bestax-no-helpers-prefixed.css`). Under a `ConfigProvider`
`classPrefix`, `colorMode` writes that attribute as well as `data-theme`, so it works with the
prefixed builds.

:::warning Single-mode designs should pin `colorMode`

Omitting `colorMode` preserves whatever `data-theme` is already set — and when nothing has set
one (the usual case), the scheme follows the visitor's OS: Bulma's text colors flip on a
dark-mode machine even if your design is light-only, breaking contrast against any fixed custom
backgrounds. If you support only one mode, pin it (`<Theme isRoot colorMode="light">`); if you
support both, don't hardcode surface/text colors — see
[Dark Mode & Contrast](../../guides/features/css-variables.md#dark-mode--contrast).

:::

```tsx
import { useState } from 'react';

function App() {
  const [mode, setMode] = useState<'light' | 'dark' | 'system'>('system');
  return (
    <Theme isRoot colorMode={mode}>
      <Button color="primary" onClick={() => setMode('dark')}>
        Dark
      </Button>
      <Button color="primary" onClick={() => setMode('light')}>
        Light
      </Button>
      <Button onClick={() => setMode('system')}>System</Button>
    </Theme>
  );
}
```

### Local Theme (Component Level)

```tsx
function LocalTheme() {
  return (
    <div>
      <Button color="primary">Standard Primary</Button>

      <Theme primaryH="120" primaryS="100%" primaryL="40%">
        <Button color="primary">Green Primary</Button>
      </Theme>

      <Button color="primary">Standard Primary Again</Button>
    </div>
  );
}
```

### Using CSS Variables Object

```tsx
function SunsetTheme() {
  const sunsetTheme = {
    '--bulma-scheme-h': '18',
    '--bulma-scheme-s': '90%',
    '--bulma-light-l': '85%',
    '--bulma-dark-l': '20%',
    '--bulma-primary-h': '25',
    '--bulma-primary-s': '85%',
    '--bulma-primary-l': '55%',
  };

  return (
    <Theme bulmaVars={sunsetTheme} isRoot>
      <Box p="4">
        <Title>Sunset Theme</Title>
        <Button color="primary">Sunset Button</Button>
        <Button color="info">Info Button</Button>
      </Box>
    </Theme>
  );
}
```

### Advanced CSS Variables Usage

Bulma derives the body font and the control radius from these variables at `:root`, so set
typography and radius on an `isRoot` theme.

```tsx
function TypographyTheme() {
  const typographyTheme = {
    '--bulma-family-primary': '"Helvetica Neue", sans-serif',
    '--bulma-family-code': '"Fira Code", monospace',
    '--bulma-size-normal': '16px',
    '--bulma-weight-bold': '700',
  };

  return (
    <Theme isRoot bulmaVars={typographyTheme}>
      <Title>Custom Typography</Title>
      <SubTitle>With custom fonts and weights</SubTitle>
    </Theme>
  );
}
```

```tsx
function RadiusTheme() {
  // `radius` is the border radius helper, as on every component, so the radius scale goes through bulmaVars
  const radii = {
    '--bulma-radius-small': '6px',
    '--bulma-radius': '12px',
    '--bulma-radius-medium': '16px',
    '--bulma-radius-large': '20px',
  };

  return (
    <Theme isRoot bulmaVars={radii}>
      <Button color="primary">Rounder Button</Button>
    </Theme>
  );
}
```

Spacing that Bulma reads where it is used, such as the block and column gaps, works on a scoped
theme:

```tsx
function SpacingTheme() {
  const spacingTheme = {
    '--bulma-block-spacing': '2rem',
    '--bulma-column-gap': '1rem',
  };

  return (
    <Theme bulmaVars={spacingTheme}>
      <Columns>
        <Column>
          <Box>Wider column gap</Box>
          <Box>Wider block spacing</Box>
        </Column>
        <Column>
          <Box>Wider column gap</Box>
        </Column>
      </Columns>
    </Theme>
  );
}
```

### Complete Color Scheme

```tsx
function ForestTheme() {
  const forestScheme = {
    schemeH: '150', // forest green hue
    schemeS: '50%',
    lightL: '80%',
    lightInvertL: '20%',
    darkL: '18%',
    darkInvertL: '85%',
    softL: '55%',
    boldL: '35%',
    primaryH: '160',
    primaryS: '60%',
    primaryL: '45%',
    linkH: '155',
    linkS: '65%',
    linkL: '40%',
    successH: '120',
    successS: '70%',
    successL: '45%',
    warningH: '45',
    warningS: '85%',
    warningL: '55%',
    dangerH: '355',
    dangerS: '75%',
    dangerL: '50%',
    hoverBackgroundLDelta: '4%',
    activeBackgroundLDelta: '8%',
  };

  return (
    <Theme {...forestScheme} isRoot>
      <Box p="4">
        <Title>Forest Theme</Title>
        <Button color="primary">Forest Primary</Button>
        <Button color="success">Success</Button>
        <Button color="info">Info</Button>
        <Button color="warning">Warning</Button>
        <Button color="danger">Danger</Button>
      </Box>
    </Theme>
  );
}
```

### Theme with Styling

```tsx
function StyledTheme() {
  return (
    <Theme
      className="custom-theme-wrapper"
      primaryH="45"
      primaryS="100%"
      primaryL="50%"
      p="5"
      m="3"
      textAlign="centered"
    >
      <Title>Styled Theme Container</Title>
      <Button color="primary">Styled Button</Button>
    </Theme>
  );
}
```

### Nested Themes

```tsx
function NestedThemes() {
  return (
    <Theme primaryH="210" primaryS="60%" primaryL="45%" p="4">
      <Title>Outer Theme (Blue)</Title>
      <Button color="primary">Blue Primary</Button>

      <Theme primaryH="120" primaryS="70%" primaryL="40%" p="3" mt="4">
        <Title size="4">Inner Theme (Green)</Title>
        <Button color="primary">Green Primary</Button>
      </Theme>

      <Button color="primary" mt="3">
        Blue Primary Again
      </Button>
    </Theme>
  );
}
```

### Theme with ConfigProvider

```tsx
function PrefixedTheme() {
  return (
    <ConfigProvider classPrefix="bestax-">
      <Theme primaryH="300" primaryS="80%" primaryL="50%" isRoot>
        <Button color="primary">Prefixed & Themed Button</Button>
      </Theme>
    </ConfigProvider>
  );
}
```

---

## Best Practices

### Global vs Local Themes

- Use `isRoot={true}` for application-wide themes that should affect all components
- Use local themes (default `isRoot={false}`) for component-specific styling or theme variations
- Local themes inherit from parent themes and can override specific variables
- Several `isRoot` themes can be mounted at once, such as a color theme at the app root and a
  typography theme next to it. Each adds its own variables at `:root`; where two set the same
  variable, the inner or later-mounted one wins, as with nested local themes, and unmounting one
  removes only its own variables

### CSS Variable Naming

- All Bulma CSS variables follow the `--bulma-*` naming convention
- Named props exist for the scheme and color variables only (like `primaryH`); every other variable, typography and radius included, goes through `bulmaVars`
- `bulmaVars` keys are the full variable names (`'--bulma-family-primary'`), not camelCase
- `bulmaVars` also accepts the scheme surface variables — `--bulma-scheme-main`, `--bulma-scheme-main-bis`, `--bulma-scheme-main-ter`, `--bulma-scheme-invert`, `--bulma-scheme-invert-bis`, `--bulma-scheme-invert-ter` — so overriding `--bulma-scheme-main-bis`/`-ter` re-tints every scheme-background band (e.g., `<Section bgColor="scheme-main-bis">`) at once
- `bulmaVars` also accepts `--bulma-shadow` (plus `--bulma-shadow-h`/`-s`/`-l`) — the upstream token that `.box`, `.card`, `.dropdown`, and `.panel` derive their own shadow variables from. Those selectors re-declare their derived variable (e.g. `--bulma-box-shadow`) on themselves, so setting it from an ancestor `Theme` is only inherited and never wins; overriding `--bulma-shadow` itself is the one override that cascades. There is no individual `shadow` prop for this — `shadow` already names the unrelated `shadowless` helper class — so reach it through `bulmaVars`

### Performance Considerations

- Prefer setting themes at higher levels in your component tree rather than deeply nested
- CSS variables are inherited, so child themes only need to override specific variables

### Color System

- Bulma uses HSL (Hue, Saturation, Lightness) for its color system
- Hue values range from 0-360 (color wheel degrees)
- Saturation and Lightness are typically percentages (e.g., '50%')
- The scheme variables control the base color relationships

---

## API Reference

### Named Props and `bulmaVars`

`ThemeProps` has a named, camelCase prop for each scheme and color variable, listed under
[CSS Variable Props](#css-variable-props). Each converts to its CSS variable by the same rule:

```
propName → --bulma-prop-name
```

- `primaryH` → `--bulma-primary-h`
- `schemeS` → `--bulma-scheme-s`
- `lightL` → `--bulma-light-l`
- `hoverBackgroundLDelta` → `--bulma-hover-background-l-delta`

Every other variable (typography, radius, spacing, and the rest) has no named prop in
`ThemeProps` and goes through `bulmaVars`, keyed by its full `--bulma-*` name. JavaScript code
that passes one as a camelCase prop (`familyPrimary`) may still render, but it is outside the
typed API, so move it to `bulmaVars`:

```tsx
<Theme
  isRoot
  primaryH="350"
  primaryS="73%"
  primaryL="44%"
  bulmaVars={{
    '--bulma-radius': '2px',
    '--bulma-radius-small': '1px',
    '--bulma-family-primary': '"IBM Plex Sans", system-ui, sans-serif',
    '--bulma-family-code': '"IBM Plex Mono", ui-monospace, monospace',
  }}
>
  <App />
</Theme>
```

Some of those names are already helper props, so they cannot double as CSS-variable props:

- `radius` is the border radius helper, as on every other component, so `<Theme radius="radiusless">`
  adds `is-radiusless` to the wrapper. On a Theme it also sets `--bulma-radius` to `0`, so what
  is inside the Theme loses its radius too; under `isRoot` it writes that at `:root`, squaring
  everything on the page that takes its radius from it. The sizes (`small`, `normal`, `large`,
  `rounded`) add their `has-radius-*` class to the wrapper and set no variable, so they round
  the wrapper and leave what is inside alone; under `isRoot` there is no wrapper, so they do
  nothing and warn in development. Set any other `--bulma-radius` through
  `bulmaVars`. `<Theme radius="2px" />` is a type error; in JavaScript it still sets
  `--bulma-radius`, which is how the prop used to behave, but that route is deprecated and logs
  a warning in development.
- `shadow` is the `shadowless` helper. Set `--bulma-shadow` through `bulmaVars`.
- `columnGap` is the column gap helper, as on every other component, so `<Theme columnGap="2">`
  adds `is-column-gap-2` to the wrapper and sets no variable; under `isRoot` there is no wrapper,
  so it does nothing and warns in development. Set the columns gutter, `--bulma-column-gap`,
  through `bulmaVars`. Before the gap helpers, JavaScript could pass `columnGap` to set that
  variable. A string that is not a gap step (`columnGap="1rem"`) still does, through a
  deprecated route that logs a warning in development, but a gap step does not:
  `columnGap="0"`, which used to zero the gutters inside the Theme, now adds `is-column-gap-0`
  to the wrapper.

### Props vs bulmaVars

You can set the scheme and color variables in two ways:

1. **Named Props** (recommended where one exists):

   ```tsx
   <Theme primaryH="270" primaryS="100%" primaryL="50%">
     <App />
   </Theme>
   ```

2. **bulmaVars Object** (for every other variable, or when you have many to set):

   ```tsx
   <Theme
     bulmaVars={{
       '--bulma-primary-h': '270',
       '--bulma-primary-s': '100%',
       '--bulma-primary-l': '50%',
       '--bulma-block-spacing': '2rem',
     }}
   >
     <App />
   </Theme>
   ```

3. **Combined** (props take precedence over bulmaVars):
   ```tsx
   <Theme
     primaryH="270" // This takes precedence
     bulmaVars={{
       '--bulma-primary-h': '180', // This is overridden
       '--bulma-block-spacing': '2rem',
     }}
   >
     <App />
   </Theme>
   ```

### TypeScript Support

`bulmaVars` is typed as a partial record keyed by the union of every variable `Theme` accepts.
Write it as an object literal and your editor autocompletes the keys and flags a misspelled or
unsupported one as a type error. A separately declared object only has to share one valid key
to typecheck, so a typo in it is silently dropped; annotate it with
`satisfies ThemeProps['bulmaVars']` to keep the check:

```tsx
<Theme
  primaryH="270"
  bulmaVars={{
    '--bulma-block-spacing': '2rem', // start typing '--bulma-' to list the rest
  }}
>
  <App />
</Theme>
```

---

## See Also

- [ConfigProvider](./config.md) - For class prefixing and configuration
- [useBulmaClasses](./usebulmaclasses.md) - For applying Bulma helper classes
- [Bulma CSS Variables Documentation](https://bulma.io/documentation/features/css-variables/) - Official Bulma CSS variables reference

---

## Props

| Prop        | Type                                                          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`  | `ReactNode`                                                   | The child components to apply the theme to.                                                                                                                                                                                                                                                                                                                                                                                                     |
| `className` | `string`                                                      | Additional CSS classes for the theme wrapper. A root theme has no wrapper, so under `isRoot` it does nothing and warns in development.                                                                                                                                                                                                                                                                                                          |
| `isRoot`    | `boolean`                                                     | When `true`, applies CSS variables globally at `:root` level. When `false` (default), applies variables only to the wrapper div. Several root themes compose; an inner or later-mounted one wins a variable they share. A root theme renders no wrapper, so `className` and the helper props, such as `m` or `shadow`, do nothing on it and warn in development.                                                                                |
| `colorMode` | `'light' \| 'dark' \| 'system'`                               | Sets Bulma's light/dark scheme by writing the `data-theme` attribute on `<html>`, plus `data-<prefix>theme` inside a `ConfigProvider` with a `classPrefix`. If the prefix cannot form an attribute name, `'light'` and `'dark'` write only `data-theme` and warn in development. Always global (even on a scoped `Theme`). `'system'` removes them so Bulma follows the OS `prefers-color-scheme`. Omit to leave the current setting untouched. |
| `bulmaVars` | `ThemeProps['bulmaVars']`                                     | Object mapping Bulma CSS variable names to string values (e.g., `{'--bulma-primary-h': '210'}`). Keys are limited to the `BulmaVars` type; anything else is not applied. A variable Bulma declares on the component itself changes nothing from here and warns in development; see [Which Variables a Theme Can Change](#which-variables-a-theme-can-change).                                                                                   |
| `columnGap` | [`BulmaGapStep`](./valid-values.md)                           | The column gap helper: a gap step adds `is-column-gap-<step>` to the wrapper div and sets no variable, so under `isRoot` it does nothing and warns in development. Set `--bulma-column-gap` through `bulmaVars`. Any other string still sets `--bulma-column-gap`, a deprecated route that warns in development.                                                                                                                                |
| `radius`    | `'radiusless' \| 'small' \| 'normal' \| 'large' \| 'rounded'` | The border radius helper. `radiusless` adds `is-radiusless` to the wrapper div and sets `--bulma-radius` to `0`, at `:root` under `isRoot`. The sizes add their `has-radius-*` class to the wrapper and set no variable, so under `isRoot` they do nothing and warn in development. Any other string still sets `--bulma-radius`, a deprecated route that warns in development.                                                                 |

### CSS Variable Props

The Theme component accepts individual CSS variable props that correspond to Bulma's design tokens. These props are automatically converted to their corresponding CSS custom properties (e.g., `primaryH` → `--bulma-primary-h`).

#### Scheme Variables

| Prop                     | Type     | Description                                       | CSS Variable                        |
| ------------------------ | -------- | ------------------------------------------------- | ----------------------------------- |
| `schemeH`                | `string` | Base hue for the color scheme (0-360)             | `--bulma-scheme-h`                  |
| `schemeS`                | `string` | Base saturation for the color scheme (percentage) | `--bulma-scheme-s`                  |
| `lightL`                 | `string` | Lightness value for light backgrounds             | `--bulma-light-l`                   |
| `lightInvertL`           | `string` | Inverted lightness for light backgrounds          | `--bulma-light-invert-l`            |
| `darkL`                  | `string` | Lightness value for dark backgrounds              | `--bulma-dark-l`                    |
| `darkInvertL`            | `string` | Inverted lightness for dark backgrounds           | `--bulma-dark-invert-l`             |
| `softL`                  | `string` | Lightness value for soft colors                   | `--bulma-soft-l`                    |
| `boldL`                  | `string` | Lightness value for bold colors                   | `--bulma-bold-l`                    |
| `softInvertL`            | `string` | Inverted lightness for soft colors                | `--bulma-soft-invert-l`             |
| `boldInvertL`            | `string` | Inverted lightness for bold colors                | `--bulma-bold-invert-l`             |
| `hoverBackgroundLDelta`  | `string` | Lightness delta for hover background states       | `--bulma-hover-background-l-delta`  |
| `activeBackgroundLDelta` | `string` | Lightness delta for active background states      | `--bulma-active-background-l-delta` |
| `hoverBorderLDelta`      | `string` | Lightness delta for hover border states           | `--bulma-hover-border-l-delta`      |
| `activeBorderLDelta`     | `string` | Lightness delta for active border states          | `--bulma-active-border-l-delta`     |
| `hoverColorLDelta`       | `string` | Lightness delta for hover text color states       | `--bulma-hover-color-l-delta`       |
| `activeColorLDelta`      | `string` | Lightness delta for active text color states      | `--bulma-active-color-l-delta`      |
| `hoverShadowADelta`      | `string` | Alpha delta for hover shadow states               | `--bulma-hover-shadow-a-delta`      |
| `activeShadowADelta`     | `string` | Alpha delta for active shadow states              | `--bulma-active-shadow-a-delta`     |

#### Color Variables

| Prop       | Type     | Description                           | CSS Variable        |
| ---------- | -------- | ------------------------------------- | ------------------- |
| `primaryH` | `string` | Primary color hue (0-360)             | `--bulma-primary-h` |
| `primaryS` | `string` | Primary color saturation (percentage) | `--bulma-primary-s` |
| `primaryL` | `string` | Primary color lightness (percentage)  | `--bulma-primary-l` |
| `linkH`    | `string` | Link color hue (0-360)                | `--bulma-link-h`    |
| `linkS`    | `string` | Link color saturation (percentage)    | `--bulma-link-s`    |
| `linkL`    | `string` | Link color lightness (percentage)     | `--bulma-link-l`    |
| `infoH`    | `string` | Info color hue (0-360)                | `--bulma-info-h`    |
| `infoS`    | `string` | Info color saturation (percentage)    | `--bulma-info-s`    |
| `infoL`    | `string` | Info color lightness (percentage)     | `--bulma-info-l`    |
| `successH` | `string` | Success color hue (0-360)             | `--bulma-success-h` |
| `successS` | `string` | Success color saturation (percentage) | `--bulma-success-s` |
| `successL` | `string` | Success color lightness (percentage)  | `--bulma-success-l` |
| `warningH` | `string` | Warning color hue (0-360)             | `--bulma-warning-h` |
| `warningS` | `string` | Warning color saturation (percentage) | `--bulma-warning-s` |
| `warningL` | `string` | Warning color lightness (percentage)  | `--bulma-warning-l` |
| `dangerH`  | `string` | Danger color hue (0-360)              | `--bulma-danger-h`  |
| `dangerS`  | `string` | Danger color saturation (percentage)  | `--bulma-danger-s`  |
| `dangerL`  | `string` | Danger color lightness (percentage)   | `--bulma-danger-l`  |

#### Shadow Variables

Reachable only through `bulmaVars` — there is no individual prop, since `shadow` already names
the `BulmaOtherProps` `shadowless` helper class. As noted above, `--bulma-shadow` is the one
override that cascades into `.box`/`.card`/`.dropdown`/`.panel` shadows.

| CSS Variable       | Description                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| `--bulma-shadow-h` | Shadow color hue (0-360)                                                                              |
| `--bulma-shadow-s` | Shadow color saturation (percentage)                                                                  |
| `--bulma-shadow-l` | Shadow color lightness (percentage)                                                                   |
| `--bulma-shadow`   | The full shadow value that `.box`/`.card`/`.dropdown`/`.panel` derive their own shadow variables from |

#### Which Variables a Theme Can Change

`bulmaVars` takes any key of the `BulmaVars` type. Write it as an object literal and your editor
lists them as you type `'--bulma-'`. Not every one of those keys does something from a `Theme`,
though, and the reason is where Bulma declares the variable.

A `Theme` writes its variables on its wrapper `div`, or at `:root` under `isRoot`. A component
inherits them from there only if it declares no value of its own, because an element's own
declaration always beats an inherited one.

- **Global variables reach everything under the Theme.** Bulma declares the scheme, color and
  shadow variables above, and the typography, radius, spacing and timing tokens (such as
  `--bulma-family-primary`, `--bulma-radius` and `--bulma-block-spacing`), on `:root`. Set them
  on a `Theme`, or on any ancestor.
- **Component variables have to be set on the component.** Where Bulma declares a variable on
  the component's own element, as it does `--bulma-card-radius`, `--bulma-tag-h` and
  `--bulma-delete-dimensions`, a value a `Theme` sets never reaches it. Those keys are still
  accepted, so existing code keeps compiling, but they change nothing, and `Theme` logs a
  warning in development naming them. Set them on the component instead, with
  `className` (a class in your own stylesheet) or the `style` prop, or at build time through
  [Sass](../../guides/features/sass-customization.md).

Each component's API page lists its variables under **CSS & Sass Variables** and says where Bulma
declares them, so check there before reaching for a `Theme`. The
[shadow note](#css-variable-naming) above is the same rule in action: `--bulma-box-shadow` lives on
`.box`, so the way to change box shadows from a `Theme` is the global `--bulma-shadow` they derive
from.

The Theme component also supports all [Bulma helper class props](./usebulmaclasses.md) for styling the wrapper element.
