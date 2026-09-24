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

```tsx
function TypographyTheme() {
  const typographyTheme = {
    '--bulma-family-primary': '"Helvetica Neue", sans-serif',
    '--bulma-family-code': '"Fira Code", monospace',
    '--bulma-size-normal': '16px',
    '--bulma-weight-bold': '700',
    '--bulma-title-color': 'hsl(0, 0%, 21%)',
    '--bulma-subtitle-color': 'hsl(0, 0%, 48%)',
  };

  return (
    <Theme bulmaVars={typographyTheme}>
      <Title>Custom Typography</Title>
      <SubTitle>With custom fonts and weights</SubTitle>
    </Theme>
  );
}
```

```tsx
function RadiusTheme() {
  // `radius` is the `radiusless` helper prop, so the radius scale goes through bulmaVars
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

```tsx
function SpacingTheme() {
  const spacingTheme = {
    '--bulma-block-spacing': '2rem',
    '--bulma-column-gap': '1rem',
    '--bulma-section-padding': '4rem 1.5rem',
    '--bulma-box-padding': '2rem',
    '--bulma-card-content-padding': '2rem',
  };

  return (
    <Theme bulmaVars={spacingTheme}>
      <Section>
        <Columns>
          <Column>
            <Box>Content with custom spacing</Box>
          </Column>
          <Column>
            <Card>
              <Card.Content>Custom card padding</Card.Content>
            </Card>
          </Column>
        </Columns>
      </Section>
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

### CSS Variable Naming

- All Bulma CSS variables follow the `--bulma-*` naming convention
- Named props exist for the scheme and color variables only (like `primaryH`); every other variable, typography and radius included, goes through `bulmaVars`
- `bulmaVars` keys are the full variable names (`'--bulma-family-primary'`), not camelCase
- `bulmaVars` also accepts the scheme surface variables — `--bulma-scheme-main`, `--bulma-scheme-main-bis`, `--bulma-scheme-main-ter`, `--bulma-scheme-invert`, `--bulma-scheme-invert-bis`, `--bulma-scheme-invert-ter` — so overriding `--bulma-scheme-main-bis`/`-ter` re-tints every scheme-background band (e.g., `<Section bgColor="scheme-main-bis">`) at once
- `bulmaVars` also accepts `--bulma-shadow` (plus `--bulma-shadow-h`/`-s`/`-l`) — the upstream token that `.box`, `.card`, `.dropdown`, and `.panel` derive their own shadow variables from. Those selectors re-declare their derived variable (e.g. `--bulma-box-shadow`) on themselves, so setting it from an ancestor `Theme` is only inherited and never wins; overriding `--bulma-shadow` itself is the one override that cascades. There is no individual `shadow` prop for this — `shadow` already names the unrelated `shadowless` helper class — so reach it through `bulmaVars`

### Performance Considerations

- Prefer setting themes at higher levels in your component tree rather than deeply nested
- Use `isRoot={true}` sparingly to avoid CSS specificity issues
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

Every other variable (typography, radius, spacing, and the per-component variables) has no named
prop and goes through `bulmaVars`, keyed by its full `--bulma-*` name:

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

Two variables could never be named props, because the name is already a helper prop that
`Theme` accepts for its wrapper:

- `radius` is the `radiusless` helper, so `<Theme radius="2px" />` is a type error. Set
  `--bulma-radius` through `bulmaVars`.
- `shadow` is the `shadowless` helper. Set `--bulma-shadow` through `bulmaVars`.

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
       '--bulma-card-content-padding': '2rem',
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
       '--bulma-card-content-padding': '2rem',
     }}
   >
     <App />
   </Theme>
   ```

### TypeScript Support

`bulmaVars` is typed as a partial record keyed by the union of every variable `Theme` can set, so
your editor autocompletes the keys and a misspelled or unsupported key is a type error:

```tsx
<Theme
  primaryH="270"
  bulmaVars={{
    '--bulma-card-content-padding': '2rem', // start typing '--bulma-card' to list the rest
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

| Prop        | Type                                   | Description                                                                                                                                                                                                                                               |
| ----------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`  | `ReactNode`                            | The child components to apply the theme to.                                                                                                                                                                                                               |
| `className` | `string`                               | Additional CSS classes for the theme wrapper.                                                                                                                                                                                                             |
| `isRoot`    | `boolean`                              | When `true`, applies CSS variables globally at `:root` level. When `false` (default), applies variables only to the wrapper div.                                                                                                                          |
| `colorMode` | `'light' \| 'dark' \| 'system'`        | Sets Bulma's light/dark scheme by writing the `data-theme` attribute on `<html>`. Always global (even on a scoped `Theme`). `'system'` removes the attribute so Bulma follows the OS `prefers-color-scheme`. Omit to leave the current setting untouched. |
| `bulmaVars` | `Partial<Record<BulmaVarKey, string>>` | Object mapping Bulma CSS variable names to values (e.g., `{'--bulma-primary-h': '210'}`). Keys are limited to the variables listed below; anything else is a type error and is not applied.                                                               |

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

#### Complete CSS Variables List

These are the keys `bulmaVars` accepts, in addition to the scheme, color, and shadow variables above. None of them has a named prop:

**Typography Variables:**

- `--bulma-family-primary`, `--bulma-family-secondary`, `--bulma-family-code`
- `--bulma-size-small`, `--bulma-size-normal`, `--bulma-size-medium`, `--bulma-size-large`
- `--bulma-weight-light`, `--bulma-weight-normal`, `--bulma-weight-medium`, `--bulma-weight-semibold`, `--bulma-weight-bold`, `--bulma-weight-extrabold`
- `--bulma-body-background-color`, `--bulma-body-size`, `--bulma-body-min-width`, `--bulma-body-rendering`
- `--bulma-body-family`, `--bulma-body-overflow-x`, `--bulma-body-overflow-y`, `--bulma-body-color`
- `--bulma-body-font-size`, `--bulma-body-weight`, `--bulma-body-line-height`
- `--bulma-code-family`, `--bulma-code-padding`, `--bulma-code-weight`, `--bulma-code-size`
- `--bulma-small-font-size`, `--bulma-hr-background-color`, `--bulma-hr-height`, `--bulma-hr-margin`
- `--bulma-strong-color`, `--bulma-strong-weight`, `--bulma-pre-font-size`, `--bulma-pre-padding`, `--bulma-pre-code-font-size`

**Layout & Spacing Variables:**

- `--bulma-block-spacing`, `--bulma-duration`, `--bulma-easing`, `--bulma-speed`
- `--bulma-radius-small`, `--bulma-radius`, `--bulma-radius-medium`, `--bulma-radius-large`, `--bulma-radius-rounded`
- `--bulma-arrow-color`, `--bulma-loading-color`
- `--bulma-column-gap`, `--bulma-grid-gap`, `--bulma-grid-column-count`, `--bulma-grid-column-min`
- `--bulma-grid-cell-column-span`, `--bulma-grid-cell-column-start`

**Box Variables:**

- `--bulma-box-background-color`, `--bulma-box-color`, `--bulma-box-radius`, `--bulma-box-shadow`
- `--bulma-box-padding`, `--bulma-box-link-hover-shadow`, `--bulma-box-link-active-shadow`

**Breadcrumb Variables:**

- `--bulma-breadcrumb-item-color`, `--bulma-breadcrumb-item-hover-color`, `--bulma-breadcrumb-item-active-color`
- `--bulma-breadcrumb-item-padding-vertical`, `--bulma-breadcrumb-item-padding-horizontal`
- `--bulma-breadcrumb-item-separator-color`

**Card Variables:**

- `--bulma-card-color`, `--bulma-card-background-color`, `--bulma-card-shadow`, `--bulma-card-radius`
- `--bulma-card-header-background-color`, `--bulma-card-header-color`, `--bulma-card-header-padding`
- `--bulma-card-header-shadow`, `--bulma-card-header-weight`
- `--bulma-card-content-background-color`, `--bulma-card-content-padding`
- `--bulma-card-footer-background-color`, `--bulma-card-footer-border-top`, `--bulma-card-footer-padding`
- `--bulma-card-media-margin`

**Dropdown Variables:**

- `--bulma-dropdown-menu-min-width`, `--bulma-dropdown-content-background-color`
- `--bulma-dropdown-content-offset`, `--bulma-dropdown-content-padding-bottom`
- `--bulma-dropdown-content-padding-top`, `--bulma-dropdown-content-radius`
- `--bulma-dropdown-content-shadow`, `--bulma-dropdown-content-z`
- `--bulma-dropdown-item-h`, `--bulma-dropdown-item-s`, `--bulma-dropdown-item-l`
- `--bulma-dropdown-item-background-l`, `--bulma-dropdown-item-background-l-delta`
- `--bulma-dropdown-item-hover-background-l-delta`, `--bulma-dropdown-item-active-background-l-delta`
- `--bulma-dropdown-item-color-l`, `--bulma-dropdown-item-selected-h`
- `--bulma-dropdown-item-selected-s`, `--bulma-dropdown-item-selected-l`
- `--bulma-dropdown-item-selected-background-l`, `--bulma-dropdown-item-selected-color-l`
- `--bulma-dropdown-divider-background-color`

**Input Variables:**

- `--bulma-input-h`, `--bulma-input-s`, `--bulma-input-l`, `--bulma-input-border-style`
- `--bulma-input-border-l`, `--bulma-input-border-l-delta`, `--bulma-input-hover-border-l-delta`
- `--bulma-input-active-border-l-delta`, `--bulma-input-focus-h`, `--bulma-input-focus-s`
- `--bulma-input-focus-l`, `--bulma-input-focus-shadow-size`, `--bulma-input-focus-shadow-alpha`
- `--bulma-input-color-l`, `--bulma-input-background-l`, `--bulma-input-background-l-delta`
- `--bulma-input-height`, `--bulma-input-shadow`, `--bulma-input-placeholder-color`
- `--bulma-input-disabled-color`, `--bulma-input-disabled-background-color`
- `--bulma-input-disabled-border-color`, `--bulma-input-disabled-placeholder-color`
- `--bulma-input-arrow`, `--bulma-input-icon-color`, `--bulma-input-icon-hover-color`
- `--bulma-input-icon-focus-color`, `--bulma-input-radius`

**Menu Variables:**

- `--bulma-menu-item-h`, `--bulma-menu-item-s`, `--bulma-menu-item-l`
- `--bulma-menu-item-background-l`, `--bulma-menu-item-background-l-delta`
- `--bulma-menu-item-hover-background-l-delta`, `--bulma-menu-item-active-background-l-delta`
- `--bulma-menu-item-color-l`, `--bulma-menu-item-radius`
- `--bulma-menu-item-selected-h`, `--bulma-menu-item-selected-s`, `--bulma-menu-item-selected-l`
- `--bulma-menu-item-selected-background-l`, `--bulma-menu-item-selected-color-l`
- `--bulma-menu-list-border-left`, `--bulma-menu-list-line-height`, `--bulma-menu-list-link-padding`
- `--bulma-menu-nested-list-margin`, `--bulma-menu-nested-list-padding-left`
- `--bulma-menu-label-color`, `--bulma-menu-label-font-size`, `--bulma-menu-label-letter-spacing`
- `--bulma-menu-label-spacing`

**Message Variables:**

- `--bulma-message-h`, `--bulma-message-s`, `--bulma-message-background-l`
- `--bulma-message-border-l`, `--bulma-message-border-l-delta`, `--bulma-message-border-style`
- `--bulma-message-border-width`, `--bulma-message-color-l`, `--bulma-message-radius`
- `--bulma-message-header-weight`, `--bulma-message-header-padding`, `--bulma-message-header-radius`
- `--bulma-message-header-body-border-width`, `--bulma-message-header-background-l`
- `--bulma-message-header-color-l`, `--bulma-message-body-border-width`
- `--bulma-message-body-color`, `--bulma-message-body-padding`, `--bulma-message-body-radius`
- `--bulma-message-body-pre-code-background-color`

**Modal Variables:**

- `--bulma-modal-z`, `--bulma-modal-background-background-color`, `--bulma-modal-content-width`
- `--bulma-modal-content-margin-mobile`, `--bulma-modal-content-spacing-mobile`
- `--bulma-modal-content-spacing-tablet`, `--bulma-modal-close-dimensions`
- `--bulma-modal-close-right`, `--bulma-modal-close-top`, `--bulma-modal-card-spacing`
- `--bulma-modal-card-head-background-color`, `--bulma-modal-card-head-padding`
- `--bulma-modal-card-head-radius`, `--bulma-modal-card-title-color`
- `--bulma-modal-card-title-line-height`, `--bulma-modal-card-title-size`
- `--bulma-modal-card-foot-background-color`, `--bulma-modal-card-foot-radius`
- `--bulma-modal-card-body-background-color`, `--bulma-modal-card-body-padding`

**Navbar Variables:**

- `--bulma-navbar-h`, `--bulma-navbar-s`, `--bulma-navbar-l`, `--bulma-navbar-background-color`
- `--bulma-navbar-box-shadow-size`, `--bulma-navbar-box-shadow-color`
- `--bulma-navbar-padding-vertical`, `--bulma-navbar-padding-horizontal`
- `--bulma-navbar-z`, `--bulma-navbar-fixed-z`, `--bulma-navbar-item-background-a`
- `--bulma-navbar-item-background-l`, `--bulma-navbar-item-background-l-delta`
- `--bulma-navbar-item-hover-background-l-delta`, `--bulma-navbar-item-active-background-l-delta`
- `--bulma-navbar-item-color-l`, `--bulma-navbar-item-selected-h`
- `--bulma-navbar-item-selected-s`, `--bulma-navbar-item-selected-l`
- `--bulma-navbar-item-selected-background-l`, `--bulma-navbar-item-selected-color-l`
- `--bulma-navbar-item-img-max-height`, `--bulma-navbar-burger-color`
- `--bulma-navbar-tab-hover-background-color`, `--bulma-navbar-tab-hover-border-bottom-color`
- `--bulma-navbar-tab-active-color`, `--bulma-navbar-tab-active-background-color`
- `--bulma-navbar-tab-active-border-bottom-color`, `--bulma-navbar-tab-active-border-bottom-style`
- `--bulma-navbar-tab-active-border-bottom-width`, `--bulma-navbar-dropdown-background-color`
- `--bulma-navbar-dropdown-border-l`, `--bulma-navbar-dropdown-border-color`
- `--bulma-navbar-dropdown-border-style`, `--bulma-navbar-dropdown-border-width`
- `--bulma-navbar-dropdown-offset`, `--bulma-navbar-dropdown-arrow`
- `--bulma-navbar-dropdown-radius`, `--bulma-navbar-dropdown-z`
- `--bulma-navbar-dropdown-boxed-radius`, `--bulma-navbar-dropdown-boxed-shadow`
- `--bulma-navbar-dropdown-item-h`, `--bulma-navbar-dropdown-item-s`
- `--bulma-navbar-dropdown-item-l`, `--bulma-navbar-dropdown-item-background-l`
- `--bulma-navbar-dropdown-item-color-l`, `--bulma-navbar-divider-background-l`
- `--bulma-navbar-divider-height`, `--bulma-navbar-bottom-box-shadow-size`

**Notification Variables:**

- `--bulma-notification-h`, `--bulma-notification-s`, `--bulma-notification-background-l`
- `--bulma-notification-color-l`, `--bulma-notification-code-background-color`
- `--bulma-notification-radius`, `--bulma-notification-padding`

**Pagination Variables:**

- `--bulma-pagination-margin`, `--bulma-pagination-min-width`
- `--bulma-pagination-item-h`, `--bulma-pagination-item-s`, `--bulma-pagination-item-l`
- `--bulma-pagination-item-background-l-delta`, `--bulma-pagination-item-hover-background-l-delta`
- `--bulma-pagination-item-active-background-l-delta`, `--bulma-pagination-item-border-style`
- `--bulma-pagination-item-border-width`, `--bulma-pagination-item-border-l`
- `--bulma-pagination-item-border-l-delta`, `--bulma-pagination-item-hover-border-l-delta`
- `--bulma-pagination-item-active-border-l-delta`, `--bulma-pagination-item-focus-border-l-delta`
- `--bulma-pagination-item-color-l`, `--bulma-pagination-item-font-size`
- `--bulma-pagination-item-margin`, `--bulma-pagination-item-padding-left`
- `--bulma-pagination-item-padding-right`, `--bulma-pagination-item-outer-shadow-h`
- `--bulma-pagination-item-outer-shadow-s`, `--bulma-pagination-item-outer-shadow-l`
- `--bulma-pagination-item-outer-shadow-a`, `--bulma-pagination-nav-padding-left`
- `--bulma-pagination-nav-padding-right`, `--bulma-pagination-disabled-color`
- `--bulma-pagination-disabled-background-color`, `--bulma-pagination-disabled-border-color`
- `--bulma-pagination-current-color`, `--bulma-pagination-current-background-color`
- `--bulma-pagination-current-border-color`, `--bulma-pagination-ellipsis-color`
- `--bulma-pagination-shadow-inset`, `--bulma-pagination-selected-item-h`
- `--bulma-pagination-selected-item-s`, `--bulma-pagination-selected-item-l`
- `--bulma-pagination-selected-item-background-l`, `--bulma-pagination-selected-item-border-l`
- `--bulma-pagination-selected-item-color-l`

**Panel Variables:**

- `--bulma-panel-margin`, `--bulma-panel-item-border`, `--bulma-panel-radius`, `--bulma-panel-shadow`
- `--bulma-panel-heading-line-height`, `--bulma-panel-heading-padding`, `--bulma-panel-heading-radius`
- `--bulma-panel-heading-size`, `--bulma-panel-heading-weight`, `--bulma-panel-tabs-font-size`
- `--bulma-panel-tab-border-bottom-color`, `--bulma-panel-tab-border-bottom-style`
- `--bulma-panel-tab-border-bottom-width`, `--bulma-panel-tab-active-color`
- `--bulma-panel-list-item-color`, `--bulma-panel-list-item-hover-color`
- `--bulma-panel-block-color`, `--bulma-panel-block-hover-background-color`
- `--bulma-panel-block-active-border-left-color`, `--bulma-panel-block-active-color`
- `--bulma-panel-block-active-icon-color`, `--bulma-panel-icon-color`

**Progress Variables:**

- `--bulma-progress-border-radius`, `--bulma-progress-bar-background-color`
- `--bulma-progress-value-background-color`, `--bulma-progress-indeterminate-duration`

**Skeleton Variables:**

- `--bulma-skeleton-background`, `--bulma-skeleton-radius`, `--bulma-skeleton-block-min-height`
- `--bulma-skeleton-lines-gap`, `--bulma-skeleton-line-height`

**Table Variables:**

- `--bulma-table-color`, `--bulma-table-background-color`, `--bulma-table-cell-border-color`
- `--bulma-table-cell-border-style`, `--bulma-table-cell-border-width`, `--bulma-table-cell-padding`
- `--bulma-table-cell-heading-color`, `--bulma-table-cell-text-align`
- `--bulma-table-head-cell-border-width`, `--bulma-table-head-cell-color`
- `--bulma-table-foot-cell-border-width`, `--bulma-table-foot-cell-color`
- `--bulma-table-head-background-color`, `--bulma-table-body-background-color`
- `--bulma-table-foot-background-color`, `--bulma-table-row-hover-background-color`
- `--bulma-table-row-active-background-color`, `--bulma-table-row-active-color`
- `--bulma-table-striped-row-even-background-color`, `--bulma-table-striped-row-even-hover-background-color`

**Tabs Variables:**

- `--bulma-tabs-border-bottom-color`, `--bulma-tabs-border-bottom-style`, `--bulma-tabs-border-bottom-width`
- `--bulma-tabs-link-color`, `--bulma-tabs-link-hover-border-bottom-color`, `--bulma-tabs-link-hover-color`
- `--bulma-tabs-link-active-border-bottom-color`, `--bulma-tabs-link-active-color`, `--bulma-tabs-link-padding`
- `--bulma-tabs-boxed-link-radius`, `--bulma-tabs-boxed-link-hover-background-color`
- `--bulma-tabs-boxed-link-hover-border-bottom-color`, `--bulma-tabs-boxed-link-active-background-color`
- `--bulma-tabs-boxed-link-active-border-color`, `--bulma-tabs-boxed-link-active-border-bottom-color`
- `--bulma-tabs-toggle-link-border-color`, `--bulma-tabs-toggle-link-border-style`
- `--bulma-tabs-toggle-link-border-width`, `--bulma-tabs-toggle-link-hover-background-color`
- `--bulma-tabs-toggle-link-hover-border-color`, `--bulma-tabs-toggle-link-radius`
- `--bulma-tabs-toggle-link-active-background-color`, `--bulma-tabs-toggle-link-active-border-color`
- `--bulma-tabs-toggle-link-active-color`

**Tag Variables:**

- `--bulma-tag-h`, `--bulma-tag-s`, `--bulma-tag-background-l`, `--bulma-tag-background-l-delta`
- `--bulma-tag-hover-background-l-delta`, `--bulma-tag-active-background-l-delta`
- `--bulma-tag-color-l`, `--bulma-tag-radius`, `--bulma-tag-delete-margin`

**Title & Subtitle Variables:**

- `--bulma-title-color`, `--bulma-title-family`, `--bulma-title-size`, `--bulma-title-weight`
- `--bulma-title-line-height`, `--bulma-title-strong-color`, `--bulma-title-strong-weight`
- `--bulma-title-sub-size`, `--bulma-title-sup-size`
- `--bulma-subtitle-color`, `--bulma-subtitle-family`, `--bulma-subtitle-size`, `--bulma-subtitle-weight`
- `--bulma-subtitle-line-height`, `--bulma-subtitle-strong-color`, `--bulma-subtitle-strong-weight`

**Content Variables:**

- `--bulma-content-heading-color`, `--bulma-content-heading-weight`, `--bulma-content-heading-line-height`
- `--bulma-content-block-margin-bottom`, `--bulma-content-blockquote-background-color`
- `--bulma-content-blockquote-border-left`, `--bulma-content-blockquote-padding`, `--bulma-content-pre-padding`
- `--bulma-content-table-cell-border`, `--bulma-content-table-cell-border-width`
- `--bulma-content-table-cell-padding`, `--bulma-content-table-cell-heading-color`
- `--bulma-content-table-head-cell-border-width`, `--bulma-content-table-head-cell-color`
- `--bulma-content-table-body-last-row-cell-border-bottom-width`
- `--bulma-content-table-foot-cell-border-width`, `--bulma-content-table-foot-cell-color`

**Control Variables:**

- `--bulma-control-radius`, `--bulma-control-radius-small`, `--bulma-control-border-width`
- `--bulma-control-height`, `--bulma-control-line-height`, `--bulma-control-padding-vertical`
- `--bulma-control-padding-horizontal`, `--bulma-control-size`, `--bulma-control-focus-shadow-l`

**Delete Variables:**

- `--bulma-delete-dimensions`, `--bulma-delete-background-l`, `--bulma-delete-background-alpha`
- `--bulma-delete-color`

**File Variables:**

- `--bulma-file-radius`, `--bulma-file-name-border-color`, `--bulma-file-name-border-style`
- `--bulma-file-name-border-width`, `--bulma-file-name-max-width`
- `--bulma-file-h`, `--bulma-file-s`, `--bulma-file-background-l`, `--bulma-file-background-l-delta`
- `--bulma-file-hover-background-l-delta`, `--bulma-file-active-background-l-delta`
- `--bulma-file-border-l`, `--bulma-file-border-l-delta`, `--bulma-file-hover-border-l-delta`
- `--bulma-file-active-border-l-delta`, `--bulma-file-cta-color-l`, `--bulma-file-name-color-l`
- `--bulma-file-color-l-delta`, `--bulma-file-hover-color-l-delta`, `--bulma-file-active-color-l-delta`

**Footer Variables:**

- `--bulma-footer-background-color`, `--bulma-footer-color`, `--bulma-footer-padding`

**Hero Variables:**

- `--bulma-hero-body-padding`, `--bulma-hero-body-padding-tablet`, `--bulma-hero-body-padding-small`
- `--bulma-hero-body-padding-medium`, `--bulma-hero-body-padding-large`

**Icon Variables:**

- `--bulma-icon-dimensions`, `--bulma-icon-dimensions-small`, `--bulma-icon-dimensions-medium`
- `--bulma-icon-dimensions-large`, `--bulma-icon-text-spacing`

**Media Variables:**

- `--bulma-media-border-color`, `--bulma-media-border-size`, `--bulma-media-spacing`
- `--bulma-media-spacing-large`, `--bulma-media-content-spacing`, `--bulma-media-level-1-spacing`
- `--bulma-media-level-1-content-spacing`, `--bulma-media-level-2-spacing`

**Section Variables:**

- `--bulma-section-padding`, `--bulma-section-padding-desktop`, `--bulma-section-padding-medium`
- `--bulma-section-padding-large`

**Burger Variables:**

- `--bulma-burger-h`, `--bulma-burger-s`, `--bulma-burger-l`, `--bulma-burger-border-radius`
- `--bulma-burger-gap`, `--bulma-burger-item-height`, `--bulma-burger-item-width`

The Theme component also supports all [Bulma helper class props](./usebulmaclasses.md) for styling the wrapper element.
