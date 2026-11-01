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

bestax-bulma is published as ES modules, one file per source module, with `"sideEffects": ["**/*.css", "**/*.scss"]` in its `package.json`. That means Vite, Webpack 5, Rollup, esbuild, Next.js, and other modern bundlers strip out any component you don't reference — no extra configuration required.

```tsx
// Good — only the components you name are bundled
import { Button, Box, Card } from '@allxsmith/bestax-bulma';
```

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

## CSS: the ways to load styles

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

Install Bulma, whose partials you `@use` below, and Sass as a dev dependency. bestax-bulma depends on Bulma, but under pnpm's default layout your Sass can only load the packages your app lists:

<PackageManagerTabs>

```bash
pnpm add bulma
pnpm add -D sass
```

</PackageManagerTabs>

If pnpm stops on a build script here, see [When pnpm blocks a build script](/docs/guides/features/sass-customization#when-pnpm-blocks-a-build-script).

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
@use 'bulma/sass/form/input-textarea';
@use 'bulma/sass/form/select';
@use 'bulma/sass/form/tools';

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

Bulma groups some form controls into one module: `form/input-textarea` styles both Input and TextArea, `form/checkbox-radio` styles Checkbox and Radio, and `form/tools` styles Field and Control.

bestax's prebuilt stylesheets build Bulma's table with `$table-cell-text-align: start`, so a table's header cells line up with the body cells under them on a right-to-left page too, where Bulma's default, `left`, keeps them on the left. A modular build with a `Table` or a `DataTable` gets the same by configuring the module where it loads it:

```scss
@use 'bulma/sass/elements/table' with (
  $table-cell-text-align: start
);
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
@use '@allxsmith/bestax-bulma/scss/components/tabs' as bestax-tabs;
@use '@allxsmith/bestax-bulma/scss/components/emptystate';
@use '@allxsmith/bestax-bulma/scss/components/timeline';
@use '@allxsmith/bestax-bulma/scss/components/treeview';
@use '@allxsmith/bestax-bulma/scss/components/scrollarea';
@use '@allxsmith/bestax-bulma/scss/components/command';
@use '@allxsmith/bestax-bulma/scss/components/datatable';
@use '@allxsmith/bestax-bulma/scss/components/pagination' as bestax-pagination;

// bestax layout
@use '@allxsmith/bestax-bulma/scss/layout/splitter';
@use '@allxsmith/bestax-bulma/scss/layout/stack';

// bestax form components
@use '@allxsmith/bestax-bulma/scss/form/autocomplete';
@use '@allxsmith/bestax-bulma/scss/form/combobox';
@use '@allxsmith/bestax-bulma/scss/form/taginput';
@use '@allxsmith/bestax-bulma/scss/form/rate';
@use '@allxsmith/bestax-bulma/scss/form/slider';
@use '@allxsmith/bestax-bulma/scss/form/numberinput';
@use '@allxsmith/bestax-bulma/scss/form/pininput';
@use '@allxsmith/bestax-bulma/scss/form/switch';
@use '@allxsmith/bestax-bulma/scss/form/checkbox';
@use '@allxsmith/bestax-bulma/scss/form/checkboxcard';
@use '@allxsmith/bestax-bulma/scss/form/radio';
@use '@allxsmith/bestax-bulma/scss/form/radiocard';
@use '@allxsmith/bestax-bulma/scss/form/fieldset';
@use '@allxsmith/bestax-bulma/scss/form/field';
@use '@allxsmith/bestax-bulma/scss/form/dropzone';
@use '@allxsmith/bestax-bulma/scss/form/colorpicker';
@use '@allxsmith/bestax-bulma/scss/form/colorinput';

// bestax elements and helpers
@use '@allxsmith/bestax-bulma/scss/elements/colorswatch';
@use '@allxsmith/bestax-bulma/scss/elements/delete' as bestax-delete;
@use '@allxsmith/bestax-bulma/scss/elements/descriptionlist';
@use '@allxsmith/bestax-bulma/scss/elements/kbd';
@use '@allxsmith/bestax-bulma/scss/elements/linkbutton';
@use '@allxsmith/bestax-bulma/scss/elements/loader' as bestax-loader;
@use '@allxsmith/bestax-bulma/scss/elements/notification' as bestax-notification;
@use '@allxsmith/bestax-bulma/scss/elements/progress' as bestax-progress;
@use '@allxsmith/bestax-bulma/scss/elements/ringprogress';
@use '@allxsmith/bestax-bulma/scss/elements/skeleton' as bestax-skeleton;
@use '@allxsmith/bestax-bulma/scss/helpers/cursor';
@use '@allxsmith/bestax-bulma/scss/helpers/sizing';
```

Some of these partials adjust a stock Bulma component rather than add one of bestax's. `elements/notification` is one: it keeps a `Notification`'s text clear of its close button, so a build that uses `bulma/sass/elements/notification` wants it too. `components/pagination` is another: it keeps the current page marked in forced colors (Windows' contrast themes), so a build that uses `bulma/sass/components/pagination`, for a `Pagination` or a `DataTable`'s pager, wants it too. `elements/delete` is a third: it keeps close buttons drawn in forced colors, the delete button and the Modal's and delete tag's crosses, so a build that shows any close button wants it. `form/field` is one more: it puts the `message` of a horizontal form component (`Input horizontal`, `Checkboxes horizontal` and the like) under its control, where Bulma's row would set it beside, so a build that uses `bulma/sass/form/tools` for horizontal fields wants it too. A partial like that can end in the same name as the Bulma module it adjusts, and Sass refuses two `@use` lines with the same name in one file, so the block above gives those lines a name of their own with `as`. The name changes nothing in the compiled CSS.

Others draw on a stock Bulma component without adjusting it. `form/checkboxcard` and `form/radiocard` are Bulma cards, so a build that uses them wants `bulma/sass/components/card` too. `form/dropzone` is Bulma's file widget, so a build that uses it wants `bulma/sass/form/file` and bestax's `form/file`, for the zone's focus ring, too, and its remove buttons are delete buttons, so it wants `bulma/sass/elements/delete` and `elements/delete` as well. `form/colorpicker` draws its swatches and its preview with `elements/colorswatch`, and its value field and eye dropper button are Bulma's, so it wants that partial, `bulma/sass/form/input-textarea` and `bulma/sass/elements/button` as well. `form/colorinput` opens a `form/colorpicker` in the date pickers' `form/picker-popover`, so it wants both of those and what they want.

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
@use 'bulma/sass/form/input-textarea';
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
// Bulma + extras, all classes prefixed with `bestax-` (pair with classPrefix="bestax-")
import '@allxsmith/bestax-bulma/versions/bestax-prefixed.css';

// Combined bundle without Bulma's helper classes (saves a lot of CSS)
import '@allxsmith/bestax-bulma/versions/bestax-no-helpers.css';

// Same, `bestax-` prefixed
import '@allxsmith/bestax-bulma/versions/bestax-no-helpers-prefixed.css';

// Combined bundle without dark-mode rules
import '@allxsmith/bestax-bulma/versions/bestax-no-dark-mode.css';
```

These require no SCSS toolchain — swap the import path and you're done.

## Bundle size expectations

- **`bestax.css`**: ~800KB minified on disk, **~82KB gzipped** over the wire (Bulma + extras). The raw number is what your bundler reports at build time; the gzipped number is what users download. Fine for most apps — but it ships in full regardless of how many components you use, because bundlers don't tree-shake CSS. See the full [File Size Comparison](/docs/guides/getting-started/variations#file-size-comparison) for every prebuilt variation, and [Optimizing CSS Size](/docs/guides/getting-started/optimizing-css) for the complete trimming playbook.
- **Hand-rolled modular SCSS**: can cut the CSS significantly if you only use a handful of components, but expect diminishing returns after gzip.
- **JS bundle**: the entire library is ~65KB min+gzip, and tree shaking is automatic with named imports.

## When to go modular

Use this checklist before switching away from `bestax.css`:

1. **Ship first with `bestax.css`.** Don't premature-optimize — many apps never need anything else.
2. **Measure.** Use `webpack-bundle-analyzer`, `rollup-plugin-visualizer`, or your bundler's built-in stats to confirm CSS size is actually a problem — and judge by the **gzipped** transfer size, not the raw `dist/` number.
3. **Try a prebuilt variant** (`bestax-no-helpers.css` saves ~15KB gzipped, `bestax-no-dark-mode.css` ~12KB) before reaching for SCSS — often enough to hit the target.
4. **Only then reach for modular SCSS**, and keep the imports in a single entry file so they're easy to audit as the app grows.
