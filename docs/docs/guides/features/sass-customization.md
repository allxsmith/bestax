---
title: Sass Customization
sidebar_label: Sass Customization
sidebar_position: 3
---

# Sass Customization

Sass customization is the **build-time half** of bestax's two-layer theming story. You set [Bulma's Sass variables](https://bulma.io/documentation/customize/with-sass/) once at build time to bake in defaults (brand colors, fonts, radii); then bestax's [`Theme` component](./css-variables.md) lets you adjust any of them at runtime via CSS variables. The two layers are designed to work together — Sass defines what ships, `Theme` adjusts what renders.

:::info Bulma's canonical reference
The authoritative documentation for customizing Bulma with Sass lives on the Bulma site:

- [Customize with Sass](https://bulma.io/documentation/customize/with-sass/) — end-to-end walkthrough of overriding Sass variables.
- [List of Sass variables](https://bulma.io/documentation/customize/list-of-sass-variables/) — the full catalog of initial, derived, and component-level variables.
- [Concepts](https://bulma.io/documentation/customize/concepts/) — how Sass variables flow into the generated CSS and CSS custom properties.
- [Customize with Modular Sass](https://bulma.io/documentation/customize/with-modular-sass/) — importing only the parts of Bulma you need.

This page focuses on wiring a Bulma Sass build into a bestax React project; refer to Bulma's docs for the variable reference and Sass semantics.
:::

:::tip Do you actually need a custom Sass build?
If you came in through `pnpm create bestax@latest`, you already picked one of the prebuilt Bulma flavors shipped with this library (`bestax-prefixed`, `bestax-no-helpers`, `bestax-no-dark-mode`, etc. — see `bulma-ui/src/scss/versions/`). Those are [modular Sass builds](https://bulma.io/documentation/customize/with-modular-sass/) of Bulma. That, plus runtime overrides through `Theme`, covers most projects. Reach for a custom Sass build when you need design tokens (brand colors, typography, control sizes) baked into the CSS that ships to users.
:::

## Overview

Sass variables feed the generated Bulma CSS — including the values of Bulma's CSS custom properties. Customize them at build time to set the **defaults** of your design system; then use the `Theme` component (or raw CSS variables) to override those defaults at runtime.

## Dependencies

To customize Bulma with Sass variables, you need:

```bash
pnpm add sass
pnpm add bulma
```

## Build Configuration

### Vite

Vite is the default toolchain for projects scaffolded by `pnpm create bestax@latest`, and handles Sass out of the box once `sass` is installed:

```bash
pnpm add sass
```

**`src/styles/bulma-custom.scss`:**

```scss
@use 'bulma/sass' with (
  $primary: #e91e63,
  $family-primary: '"Roboto", sans-serif',
  $radius-large: 12px,
  $control-height: 3rem
);
```

**Import directly in your entry:**

```tsx
// src/main.tsx
import './styles/bulma-custom.scss';
import { Button, Container } from '@allxsmith/bestax-bulma';

function App() {
  return (
    <Container>
      <Button color="primary">Vite + Sass Button</Button>
    </Container>
  );
}
```

### Next.js

Next.js has built-in Sass support:

**Install Sass:**

```bash
pnpm add sass
```

**Custom Sass file (styles/bulma-custom.scss):**

```scss
@use 'bulma/sass' with (
  $primary: #0070f3,
  $family-primary: '"Inter", sans-serif',
  $navbar-height: 4rem,
  $footer-padding: 3rem 1.5rem
);
```

**Import in \_app.tsx:**

```tsx
// pages/_app.tsx
import '../styles/bulma-custom.scss';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
```

**Use in pages:**

```tsx
// pages/index.tsx
import { Hero, Container, Title, Button } from '@allxsmith/bestax-bulma';

export default function Home() {
  return (
    <Hero size="medium">
      <Hero.Body>
        <Container>
          <Title>Next.js + Sass Customization</Title>
          <Button color="primary" size="large">
            Get Started
          </Button>
        </Container>
      </Hero.Body>
    </Hero>
  );
}
```

### Webpack / Create React App

Create React App is no longer actively developed — new projects should prefer Vite or Next.js. If you're maintaining an existing CRA app, you can compile a custom Sass file with a standalone `sass` CLI script and import the generated CSS:

```json
{
  "scripts": {
    "build-bulma": "sass --load-path=node_modules src/styles/bulma-custom.scss src/styles/bulma-custom.css",
    "watch-bulma": "pnpm build-bulma -- --watch"
  }
}
```

```tsx
import './styles/bulma-custom.css';
```

## Common Sass Variables

The snippets below show the variables most projects customize. For the full catalog — initial, derived, and component-level — refer to Bulma's [List of Sass variables](https://bulma.io/documentation/customize/list-of-sass-variables/).

### Color Variables

```scss
@use 'bulma/sass' with (
  // Primary colors
  $primary: #3273dc,
  $link: #3273dc,
  $info: #3298dc,
  $success: #48c774,
  $warning: #ffdd57,
  $danger: #f14668,

  // Neutral colors
  $white: #ffffff,
  $black: #0a0a0a,
  $light: #f5f5f5,
  $dark: #363636,

  // Grey shades
  $grey-darker: #121212,
  $grey-dark: #363636,
  $grey: #4a4a4a,
  $grey-light: #b5b5b5,
  $grey-lighter: #dbdbdb
);
```

### Typography Variables

```scss
@use 'bulma/sass' with (
  // Font families
  $family-sans-serif: '"Inter", "SF Pro Display", sans-serif',
  $family-monospace: '"Fira Code", "SF Mono", monospace',
  $family-primary: $family-sans-serif,
  $family-secondary: $family-sans-serif,
  $family-code: $family-monospace,

  // Font sizes
  $size-1: 3rem,
  $size-2: 2.5rem,
  $size-3: 2rem,
  $size-4: 1.5rem,
  $size-5: 1.25rem,
  $size-6: 1rem,
  $size-7: 0.875rem,

  // Font weights
  $weight-light: 300,
  $weight-normal: 400,
  $weight-medium: 500,
  $weight-semibold: 600,
  $weight-bold: 700
);
```

### Layout Variables

```scss
@use 'bulma/sass' with (
  // Spacing
  $block-spacing: 1.5rem,
  $column-gap: 0.75rem,

  // Border radius
  $radius-small: 2px,
  $radius: 4px,
  $radius-medium: 6px,
  $radius-large: 8px,
  $radius-rounded: 9999px,

  // Control elements
  $control-height: 2.5em,
  $control-line-height: 1.5,
  $control-padding-vertical: calc(0.5em - 1px),
  $control-padding-horizontal: calc(0.75em - 1px)
);
```

### Component Variables

```scss
@use 'bulma/sass' with (
  // Button
  $button-padding-vertical: 0.5rem,
  $button-padding-horizontal: 1rem,
  $button-border-radius: $radius,

  // Input
  $input-shadow: inset 0 0.0625em 0.125em rgba(10, 10, 10, 0.05),
  $input-hover-border-color: $grey-dark,
  $input-focus-border-color: $link,

  // Card
  $card-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1),
  $card-radius: $radius-large,

  // Navbar
  $navbar-height: 3.25rem,
  $navbar-padding-vertical: 1rem,
  $navbar-padding-horizontal: 2rem
);
```

## How Sass Feeds Bulma's CSS Variables

In Bulma v1, the values you pass to `@use 'bulma/sass'` are compiled into the defaults of the CSS custom properties Bulma exposes — see Bulma's [Concepts](https://bulma.io/documentation/customize/concepts/) page for the end-to-end flow from Sass variable to generated CSS variable:

```scss
@use 'bulma/sass' with (
  $primary: #ff6b35,
  $family-primary: '"Helvetica Neue", sans-serif'
);
```

```css
:root {
  --bulma-primary-h: 18deg;
  --bulma-primary-s: 100%;
  --bulma-primary-l: 60%;
  --bulma-family-primary: '"Helvetica Neue", sans-serif';
}
```

Those same CSS variables can be re-addressed at runtime through bestax's [`Theme` component](./css-variables.md) — so Sass sets the baseline, `Theme` overrides as needed.

## Integration with React Components

### Build-time Theme

```scss
// styles/corporate-theme.scss
@use 'bulma/sass' with (
  $primary: #1e3a8a,
  // Corporate blue
  $success: #059669,
  // Corporate green
  $family-primary: '"Open Sans", sans-serif',
  $radius: 2px,
  // Sharp corners
  $control-height: 3rem // Larger controls
);
```

```tsx
// App.tsx
import './styles/corporate-theme.css';
import { Button, Card, Container, Title } from '@allxsmith/bestax-bulma';

function CorporateApp() {
  return (
    <Container>
      <Card>
        <Card.Content>
          <Title>Corporate Design System</Title>
          <Button color="primary">Corporate Button</Button>
          <Button color="success" ml="2">
            Action Button
          </Button>
        </Card.Content>
      </Card>
    </Container>
  );
}
```

### Combining with CSS Variables

You can use both approaches together - Sass for base configuration and CSS variables for runtime theming:

```scss
// Base theme with Sass
@use 'bulma/sass' with (
  $family-primary: '"Inter", sans-serif',
  $radius: 6px,
  $control-height: 2.75rem
);
```

```tsx
// Runtime theming with CSS variables
import { Theme } from '@allxsmith/bestax-bulma';

function App() {
  return (
    <Theme primaryH="270" primaryS="100%" primaryL="50%" isRoot>
      <CorporateApp />
    </Theme>
  );
}
```

## Best Practices

### 1. Establish Design Tokens

Define your design system values clearly:

```scss
// design-tokens.scss
$brand-blue: #1e40af;
$brand-green: #059669;
$brand-orange: #ea580c;

$font-primary: '"Inter", sans-serif';
$font-mono: '"JetBrains Mono", monospace';

$spacing-unit: 0.25rem;
$border-radius-base: 6px;

@use 'bulma/sass' with (
  $primary: $brand-blue,
  $success: $brand-green,
  $warning: $brand-orange,
  $family-primary: $font-primary,
  $family-code: $font-mono,
  $radius: $border-radius-base
);
```

### 2. Modular Sass Files

Organize your customizations by feature:

```scss
// styles/main.scss
@use './variables' as vars;
@use './typography';
@use './components';

@use 'bulma/sass' with (
  $primary: vars.$brand-primary,
  $family-primary: vars.$font-family-base
);
```

### 3. Environment-specific Builds

Create different themes for different environments:

```scss
// themes/development.scss
@use 'bulma/sass' with (
  $primary: #ef4444,
  // Red for development
  $warning: #f59e0b
);

// themes/production.scss
@use 'bulma/sass' with (
  $primary: #3b82f6,
  // Blue for production
  $warning: #f59e0b
);
```

## Pairing Sass Defaults with Runtime Overrides

A typical bestax project uses both layers together: Sass sets shipped defaults, `Theme` adjusts them per-context or per-user.

```scss
@use 'bulma/sass' with (
  $primary: #8b5cf6,
  $radius: 8px
);
```

```tsx
<Theme
  primaryH="258"
  primaryS="90%"
  primaryL="64%"
  bulmaVars={{ '--bulma-radius': '12px' }}
>
  <App />
</Theme>
```

## Further Reading

- [CSS Variables (bestax guide)](./css-variables.md) — the runtime half of the theming story.
- [Theme component reference](../../api/helpers/theme.md) — the full bestax React API.
- [Bulma: Customize with Sass](https://bulma.io/documentation/customize/with-sass/) — Bulma's official Sass customization guide.
- [Bulma: List of Sass variables](https://bulma.io/documentation/customize/list-of-sass-variables/) — the complete variable catalog.
- [Bulma: Customize with Modular Sass](https://bulma.io/documentation/customize/with-modular-sass/) — importing only the parts of Bulma you need.
- [Bulma: Concepts](https://bulma.io/documentation/customize/concepts/) — how Sass variables feed Bulma's CSS custom properties.
