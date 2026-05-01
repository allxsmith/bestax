---
title: Modular
sidebar_label: Modular
sidebar_position: 5
---

# Modular

This guide covers how to trim your CSS and JS bundles by importing only what you use from bestax-bulma and Bulma.

:::tip Recommended default
For most projects, import the combined bundle and let React handle the rest:

```js
import '@allxsmith/bestax-bulma/bestax.css';
```

`bestax.css` is already minified and small, and modern bundlers tree-shake unused components from the JS side automatically. You only need to go modular if you've measured CSS size and have a specific constraint to hit.
:::

Modular optimization has two independent axes:

1. **JS bundle** — handled by your bundler's tree shaking. Just use named imports.
2. **CSS bundle** — handled by choosing one of the CSS options below (combined, extras-only, or hand-rolled SCSS).

## JS: named imports and tree shaking

bestax-bulma is published as ES modules with `"sideEffects": ["**/*.css", "**/*.scss"]` in its `package.json`. That means Vite, Webpack 5, Rollup, esbuild, Next.js, and other modern bundlers strip out any component you don't reference — no extra configuration required.

```tsx
// Good — only the components you name are bundled
import { Button, Box, Card } from '@allxsmith/bestax-bulma';
```

:::warning Don't default-import the whole library
This defeats tree shaking and pulls in every component:

```tsx
// Bad — forces the whole library into your bundle
import * as Bestax from '@allxsmith/bestax-bulma';
```

:::

### Component categories

Components are organized by Bulma category. Import from the same package path regardless of category:

```tsx
import { Button, Icon, Title } from '@allxsmith/bestax-bulma'; // Elements
import { Card, Modal, Navbar } from '@allxsmith/bestax-bulma'; // Components
import { Input, Select, Checkbox } from '@allxsmith/bestax-bulma'; // Form
import { Container, Hero, Section } from '@allxsmith/bestax-bulma'; // Layout
import { Columns, Column } from '@allxsmith/bestax-bulma'; // Columns
import { Grid, Cell } from '@allxsmith/bestax-bulma'; // Grid
import {
  ConfigProvider,
  Theme,
  useBulmaClasses,
} from '@allxsmith/bestax-bulma'; // Helpers
```

:::info Full export list
The categories above are illustrative, not exhaustive. See the [Elements](/docs/category/elements), [Components](/docs/category/components), [Form](/docs/category/form), [Layout](/docs/category/layout), [Columns](/docs/api/columns), and [Grid](/docs/api/grid) API sections for the complete list, including newer additions like `Dialog`, `Carousel`, `Tooltip`, `Steps`, `Sidebar`, `Toast`, `Loading`, `Collapse`, `Autocomplete`, `Taginput`, `Rate`, `Slider`, `NumberInput`, `Switch`, `Checkboxes`, and `Radios`.
:::

## CSS: three ways to load styles

### Option A — combined bundle (recommended)

One import gives you Bulma and all bestax extras:

```js
import '@allxsmith/bestax-bulma/bestax.css';
```

:::tip This is the right choice for almost every project
`bestax.css` is already minified. After gzip/Brotli, the difference between it and a hand-tuned modular build is usually a few KB — not worth the ongoing maintenance of keeping SCSS imports in sync as you add components. Start here, then measure before optimizing further.
:::

### Option B — Bulma + extras separately

If you're already managing Bulma's CSS yourself (e.g. using a specific variant, CDN, or custom theme build), add only the bestax extras on top:

```js
import 'bulma/css/bulma.min.css';
import '@allxsmith/bestax-bulma/extras.css';
```

`extras.css` contains only the styles for components bestax adds on top of Bulma (Dialog, Carousel, Tooltip, Autocomplete, etc.).

### Option C — hand-rolled modular SCSS (advanced)

:::caution Advanced — only if you've measured
Hand-rolling modular SCSS is worthwhile only when you have a demonstrated CSS-size budget. You take on the maintenance burden of keeping imports in sync with the components you actually use. If in doubt, use Option A.
:::

Install Sass as a dev dependency (Bulma is already installed as a transitive dependency):

```bash
npm install -D sass
```

#### Required base styles

Before importing component partials, include Bulma's base (CSS reset, generic element styles, keyframes) and themes (CSS custom properties on `:root`):

```scss
// Required: reset + CSS variable definitions
@use 'bulma/sass/base';
@use 'bulma/sass/themes';
```

- `base` provides `minireset`, generic element styles, and animation keyframes.
- `themes` registers the `--bulma-*` CSS custom properties (colors, radii, `--bulma-scheme-main`, etc.) and sets up light/dark mode.

:::info Exception: grid and columns
`bulma/sass/grid/columns` and `bulma/sass/grid/grid` register their own CSS variables internally and compile their breakpoints from SCSS, so they can technically be used without `base` and `themes`. The safe default is still to include both — you'll almost always want them as soon as you add a second component.
:::

#### Bulma component partials

After the base, `@use` only the Bulma partials you need:

```scss
// Elements
@use 'bulma/sass/elements/button';
@use 'bulma/sass/elements/box';
@use 'bulma/sass/elements/notification';
@use 'bulma/sass/elements/title';

// Form
@use 'bulma/sass/form/input';
@use 'bulma/sass/form/textarea';
@use 'bulma/sass/form/select';

// Components
@use 'bulma/sass/components/card';
@use 'bulma/sass/components/modal';
@use 'bulma/sass/components/navbar';

// Grid systems
@use 'bulma/sass/grid/columns';
@use 'bulma/sass/grid/grid';

// Layout
@use 'bulma/sass/layout/container';
@use 'bulma/sass/layout/section';
```

Pull in only the helper categories you use:

```scss
@use 'bulma/sass/helpers/spacing';
@use 'bulma/sass/helpers/color';
@use 'bulma/sass/helpers/typography';
@use 'bulma/sass/helpers/flexbox';
@use 'bulma/sass/helpers/other';
```

#### bestax extras partials

bestax ships SCSS partials for every component it adds on top of Bulma. Import them the same way via the package's `scss/*` export:

```scss
// bestax components
@use '@allxsmith/bestax-bulma/scss/components/dialog';
@use '@allxsmith/bestax-bulma/scss/components/carousel';
@use '@allxsmith/bestax-bulma/scss/components/tooltip';
@use '@allxsmith/bestax-bulma/scss/components/loading';
@use '@allxsmith/bestax-bulma/scss/components/collapse';
@use '@allxsmith/bestax-bulma/scss/components/sidebar';
@use '@allxsmith/bestax-bulma/scss/components/toast';
@use '@allxsmith/bestax-bulma/scss/components/steps';
@use '@allxsmith/bestax-bulma/scss/components/tabs';

// bestax form components
@use '@allxsmith/bestax-bulma/scss/form/autocomplete';
@use '@allxsmith/bestax-bulma/scss/form/taginput';
@use '@allxsmith/bestax-bulma/scss/form/rate';
@use '@allxsmith/bestax-bulma/scss/form/slider';
@use '@allxsmith/bestax-bulma/scss/form/numberinput';
@use '@allxsmith/bestax-bulma/scss/form/switch';
@use '@allxsmith/bestax-bulma/scss/form/checkbox';
@use '@allxsmith/bestax-bulma/scss/form/radio';

// bestax elements and helpers
@use '@allxsmith/bestax-bulma/scss/elements/linkbutton';
@use '@allxsmith/bestax-bulma/scss/helpers/cursor';
@use '@allxsmith/bestax-bulma/scss/helpers/sizing';
```

:::info Shortcuts

- `@use '@allxsmith/bestax-bulma/scss/bestax'` — SCSS source for the full combined bundle (Bulma + all extras). Use this instead of `bestax.css` when you want a single SCSS entry point that participates in your Sass build.
- `@use '@allxsmith/bestax-bulma/scss'` — extras only (equivalent to `extras.css` but from source).
  :::

#### Complete example

A realistic modular SCSS entry for an app that uses a few Bulma primitives plus bestax's Dialog and Autocomplete:

```scss
// src/styles/app.scss

// Required base
@use 'bulma/sass/base';
@use 'bulma/sass/themes';

// Bulma partials — only what the app uses
@use 'bulma/sass/elements/button';
@use 'bulma/sass/elements/box';
@use 'bulma/sass/elements/title';
@use 'bulma/sass/form/input';
@use 'bulma/sass/components/card';
@use 'bulma/sass/grid/columns';
@use 'bulma/sass/helpers/spacing';
@use 'bulma/sass/helpers/color';

// bestax extras — only what the app uses
@use '@allxsmith/bestax-bulma/scss/components/dialog';
@use '@allxsmith/bestax-bulma/scss/form/autocomplete';
```

Then import the compiled stylesheet once in your app entry:

```tsx
// src/App.tsx
import './styles/app.scss';
import {
  Button,
  Box,
  Card,
  Columns,
  Column,
  Title,
  Dialog,
  Autocomplete,
} from '@allxsmith/bestax-bulma';

function App() {
  return (
    <Columns>
      <Column>
        <Card>
          <Box p="4">
            <Title>Modular App</Title>
            <Button color="primary">Go</Button>
          </Box>
        </Card>
      </Column>
    </Columns>
  );
}

export default App;
```

## Prebuilt variants

If you want something smaller than `bestax.css` without writing SCSS, bestax ships a handful of prebuilt variants as a middle ground:

```js
// Bulma + extras, all Bulma classes prefixed with `bulma-`
import '@allxsmith/bestax-bulma/versions/bestax-bulma-prefixed.css';

// Extras only, with `bulma-` prefixed class names
import '@allxsmith/bestax-bulma/versions/bestax-prefixed.css';

// Combined bundle without Bulma's helper classes (saves a lot of CSS)
import '@allxsmith/bestax-bulma/versions/bestax-no-helpers.css';

// Same, prefixed
import '@allxsmith/bestax-bulma/versions/bestax-no-helpers-prefixed.css';

// Combined bundle without dark-mode rules
import '@allxsmith/bestax-bulma/versions/bestax-no-dark-mode.css';
```

These require no SCSS toolchain — swap the import path and you're done.

## Bundle size expectations

- **`bestax.css`**: ~80KB gzipped (Bulma + extras, minified). Fine for most apps.
- **Hand-rolled modular SCSS**: can cut that significantly if you only use a handful of components, but expect diminishing returns after gzip.
- **JS bundle**: tree shaking is automatic with named imports — you don't need to do anything beyond avoiding `import * as ...`.

## When to go modular

Use this checklist before switching away from `bestax.css`:

1. **Ship first with `bestax.css`.** Don't premature-optimize — many apps never need anything else.
2. **Measure.** Use `webpack-bundle-analyzer`, `rollup-plugin-visualizer`, or your bundler's built-in stats to confirm CSS size is actually a problem.
3. **Try a prebuilt variant** (`bestax-no-helpers.css`, `bestax-no-dark-mode.css`) before reaching for SCSS — often enough to hit the target.
4. **Only then reach for modular SCSS**, and keep the imports in a single entry file so they're easy to audit as the app grows.
