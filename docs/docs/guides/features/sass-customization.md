---
title: Sass Customization
sidebar_label: Sass Customization
sidebar_position: 3
---

# Sass Customization

Sass customization allows you to configure Bulma's design tokens at build time by setting Sass variables. This approach was the primary customization method in Bulma v0.9.4 and earlier, and remains useful for creating consistent, compiled themes.

:::tip Modern Approach
While Sass customization is still supported and useful, consider using [CSS Variables](./css-variables.md) for runtime flexibility and dynamic theming capabilities introduced in Bulma v1.
:::

## Overview

Sass variables control the fundamental values that Bulma uses to generate its CSS. When you customize Sass variables, these values are compiled into the final CSS at build time, affecting the default appearance and the values of CSS variables.

## Dependencies

To customize Bulma with Sass variables, you need:

```bash
npm install sass
npm install bulma
```

## Build Configuration

### Webpack

For Webpack-based projects (Create React App, custom Webpack):

**package.json scripts:**

```json
{
  "scripts": {
    "build-bulma": "sass --load-path=node_modules src/styles/bulma-custom.scss src/styles/bulma-custom.css",
    "watch-bulma": "npm run build-bulma -- --watch"
  }
}
```

**Custom Sass file (src/styles/bulma-custom.scss):**

```scss
// Set your brand colors
$purple: #8a4d76;
$pink: #fa7c91;
$brown: #757763;
$beige-light: #d0d1cd;
$beige-lighter: #eff0eb;

// Customize Bulma variables
@use 'bulma/sass' with (
  $family-primary: '"Nunito", sans-serif',
  $grey-dark: $brown,
  $grey-light: $beige-light,
  $primary: $purple,
  $link: $pink,
  $control-border-width: 2px,
  $input-shadow: none
);

// Import custom fonts
@import url('https://fonts.googleapis.com/css?family=Nunito:400,700');
```

**Import in your React app:**

```tsx
// src/index.tsx or src/App.tsx
import './styles/bulma-custom.css';
import { Button, Box, Title } from '@allxsmith/bestax-bulma';

function App() {
  return (
    <Box p="4">
      <Title>Custom Sass Theme</Title>
      <Button color="primary">Custom Primary Button</Button>
    </Box>
  );
}
```

### Vite

For Vite projects, you can directly import and process Sass:

**vite.config.js:**

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        includePaths: ['node_modules'],
      },
    },
  },
});
```

**Custom Sass file (src/styles/bulma-custom.scss):**

```scss
@use 'bulma/sass' with (
  $primary: #e91e63,
  $family-primary: '"Roboto", sans-serif',
  $radius-large: 12px,
  $control-height: 3rem
);
```

**Import directly in React:**

```tsx
// src/main.tsx or src/App.tsx
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
npm install sass
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

## Common Sass Variables

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

## Legacy vs Modern Approach

### Bulma v0.9.4 and Earlier

In older versions of Bulma, Sass customization was the only way to customize the framework:

```scss
// Old approach (still works)
$primary: #ff6b35;
$family-primary: 'Helvetica Neue', sans-serif;

@import 'bulma/bulma.sass';
```

### Bulma v1 with CSS Variables

Modern Bulma generates CSS variables from Sass variables:

```scss
// Sass variables affect the CSS variable defaults
@use 'bulma/sass' with (
    $primary: #ff6b35,
    // Sets --bulma-primary-* variables
    $family-primary: 'Helvetica Neue',
    sans-serif
  );
```

The generated CSS includes variables that can be overridden at runtime:

```css
:root {
  --bulma-primary-h: 18deg;
  --bulma-primary-s: 100%;
  --bulma-primary-l: 60%;
  --bulma-family-primary: 'Helvetica Neue', sans-serif;
}
```

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

## Migration from Sass to CSS Variables

When migrating from pure Sass customization to CSS variables:

```scss
// Before: Sass only
$primary: #8b5cf6;
$border-radius: 8px;

// After: Sass for defaults, CSS variables for runtime
@use 'bulma/sass' with (
  $primary: #8b5cf6,
  // Default value
  $radius: 8px // Default value
);
```

```tsx
// Runtime customization with Theme component
<Theme
  primaryH="258"
  primaryS="90%"
  primaryL="64%"
  bulmaVars={{ '--bulma-radius': '12px' }}
>
  <App />
</Theme>
```

This approach provides the best of both worlds: consistent build-time defaults with runtime flexibility.

For more information about modern theming approaches, see [CSS Variables](./css-variables.md) and [Theme component documentation](../../api/helpers/theme.md).
