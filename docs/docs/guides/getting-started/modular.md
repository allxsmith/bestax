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

A build with a responsive `Table` also wants bestax's `elements/table` partial, for its container's focus ring, and so does one with selected rows, in a `Table` or a `DataTable`, which the partial marks in forced colors.

A build with a `Select` also wants bestax's `form/select` partial, which outlines a focused select in forced colors.

Pull in only the helper categories you use:

```scss
@use 'bulma/sass/helpers/spacing';
@use 'bulma/sass/helpers/color';
@use 'bulma/sass/helpers/typography';
@use 'bulma/sass/helpers/flexbox';
@use 'bulma/sass/helpers/other';
```

With `bulma/sass/helpers/color`, add bestax's `helpers/color` partial too. The next section says what it adjusts.

#### bestax extras partials

bestax ships SCSS partials for the components it adds on top of Bulma that need styles of their own, and for some of the stock Bulma components it adjusts. Load the ones your app uses the same way, through the package's `scss/*` export. The [extras inventory](https://github.com/allxsmith/bestax/blob/main/skills/bestax-optimize/references/modular-build.md#authoritative-bestax-extras-inventory) in the bestax-optimize skill lists every partial by folder, and is checked against the partials the package ships.

For example, an app with a `Dialog`, a `Tooltip` and an `Autocomplete`, that also uses the Bulma button and navbar modules and the color helpers above:

```scss
@use '@allxsmith/bestax-bulma/scss/components/dialog';
@use '@allxsmith/bestax-bulma/scss/components/tooltip';
@use '@allxsmith/bestax-bulma/scss/form/autocomplete';
@use '@allxsmith/bestax-bulma/scss/elements/button' as bestax-button;
@use '@allxsmith/bestax-bulma/scss/components/navbar' as bestax-navbar;
@use '@allxsmith/bestax-bulma/scss/helpers/color' as bestax-color;
```

Some partials adjust a stock Bulma component rather than add one of bestax's.

- `elements/notification` keeps a `Notification`'s text clear of its close button, and gives a dark or light one its color's own text and background, and a white or black one with `isLight` the light color's text, where Bulma's module lets its text inherit the color around it, so a build that uses `bulma/sass/elements/notification` wants it too.

- `elements/pre` draws a `Pre`'s keyboard focus ring, which is a tab stop while its content overflows, so a build that shows a `Pre` wants it. Bulma draws the `<pre>` in its base, which every build has, so it needs no Bulma module of its own.

- `elements/table` draws the keyboard focus ring of a responsive table's container, which is a tab stop while the table overflows it, and marks a selected row or cell with a double line in forced colors, where Bulma's fill for it is replaced, so a build that uses `bulma/sass/elements/table` for a `Table` with `isResponsive` or selected rows, or for a `DataTable` that selects rows, wants it too.

- `elements/tag` gives a light tag, and a white, black or dark one with `isLight`, readable text, sets a normal-size tag in a table cell at the bottom of its line, where Bulma's baseline makes the row taller than a row of text, and gives a button tag (`as="button"`, `isDelete`) the weight, spacing and other text a span tag takes from the text around it, where the browser gives a button its own, so a build that uses `bulma/sass/elements/tag` wants it too.

- `components/modal` keeps a modal card's edge in forced colors (Windows' contrast themes), where Bulma's card has none and the backdrop's dark fill is replaced, so a build that uses `bulma/sass/components/modal` for a `Modal` with a card wants it too.

- `components/pagination` draws the page links' keyboard focus ring, which Bulma's own styles turn off, and keeps the current page marked in forced colors (Windows' contrast themes), so a build that uses `bulma/sass/components/pagination`, for a `Pagination` or a `DataTable`'s pager, wants it too.

- `components/tabs` shows only a `Tabs.Content`'s selected panel and lays out vertical tabs, draws a `Tabs.Tab`'s keyboard focus ring and a disabled tab's look, moves Bulma's focus ring inside most `Tabs.Item` links, where the tab row clips it, brings a focused toggle tab in front of its neighbors, and keeps the active tab marked in forced colors, so a build that uses `bulma/sass/components/tabs` for a `Tabs` needs it too.

- `components/menu` keeps a menu's active item marked in forced colors, draws `Menu.Section`'s heading and chevron, and starts each item's text at the right on a right-to-left page, so a build that uses `bulma/sass/components/menu`, for a `Menu` or a `TableOfContents`, wants it too.

- `components/dropdown` keeps a divider drawn in forced colors, where Bulma's fill takes the menu's own color, and keeps an active item marked there the way `components/menu` does, so a build that uses `bulma/sass/components/dropdown`, for a `Dropdown` or a `ContextMenu`, wants it too.

- `components/navbar` keeps the burger's bars, `Navbar.Divider` and an open dropdown's edge drawn and the active item marked in forced colors, keeps a `fixed` navbar in place while an overlay locks the page's scrolling, gives an active item's text the invert of the link color it sits on, where Bulma's leaves it in the navbar's text color, draws a navbar in a colored `Hero` in the hero's colors, where Bulma's draws its active item and burger in the link color, and, in a build with a class prefix, draws a dropdown's active link row, other than a tab, as it draws without one, where Bulma's draws it as a plain row, so a build that uses `bulma/sass/components/navbar`, for a `Navbar` or an `AppFrame`'s burger, wants it too.

- `components/panel` keeps the heading of a panel with no color readable on the dark scheme, where Bulma writes it white on light gray, and a colored panel's active block and tab, their text, icon and underline, readable on both schemes, and keeps the panel's edge drawn and the active block and tab marked in forced colors, so a build that uses `bulma/sass/components/panel` wants it too.

- `elements/box` draws a box's edge as an outline in the system's text color in forced colors, where Bulma draws it as a shadow, which those themes drop, so a build that uses `bulma/sass/elements/box` wants it too.

- `elements/divider` draws a `Divider`'s line as a border in the system's text color in forced colors, where Bulma draws an `<hr>` as a background color that's replaced with the page's own, so a build that shows a `Divider`, or a plain `<hr>`, wants it. An `<hr>` with a class of its own, such as Bulma's dropdown and navbar dividers, keeps its own rules. Bulma draws the `<hr>` in its base, which every build has, so it needs no Bulma module of its own.

- `elements/delete` keeps close buttons drawn in forced colors, the delete button and the Modal's and delete tag's crosses, so a build that shows any close button wants it.

- `elements/button` gives a focused button an outline where Bulma's border and shadow show nothing, on a ghost or static button and on every button in forced colors, apart from a loading one, which `elements/loader` outlines, gives a colored button a border in forced colors, where Bulma draws it with none and the fill is replaced, draws a pressed `ToggleButton`, a checked `SegmentedControl` segment and any other button with Bulma's `is-selected` in the system's highlight colors there, where they'd look like the buttons beside them, and gives an outlined button the lightness Bulma picks for its color's text on the page where that's lighter, so a dark color reads on the dark scheme, so a build that uses `bulma/sass/elements/button` wants it too.

- `elements/loader` stops Bulma's spinners under `prefers-reduced-motion: reduce`, hides everything inside a loading button where Bulma hides only the label, outlines a loading button that has keyboard focus, whose focus shadow Bulma takes away, and keeps each spinner's ring open in forced colors, so a build that shows a `Loader` or a loading `Button`, `Control` or `Select` wants it too.

- `elements/progress` keeps a `Progress` bar drawn in forced colors (Windows' contrast themes), its fill and an edge in the text color, where Bulma paints it in colors a contrast theme turns into the page's, and stops an indeterminate bar's sweep under `prefers-reduced-motion: reduce`, so a build that uses `bulma/sass/elements/progress` wants it too.

- `elements/skeleton` keeps every skeleton shape (`Skeleton`, the `skeleton` prop and `hasSkeleton`) drawn in forced colors (Windows' contrast themes), in `GrayText` with the text Bulma hides still hidden, where a contrast theme turns Bulma's shape into the page's color and shows that text, and stops the shapes' pulse under `prefers-reduced-motion: reduce`, so a build that uses `bulma/sass/base/skeleton` wants it too.

- `form/field` puts the `message` of a horizontal form component (`Input horizontal`, `Checkboxes horizontal` and the like) under its control, where Bulma's row would set it beside, and keeps a horizontal label's text against its control on a right-to-left page, so a build that uses `bulma/sass/form/tools` for horizontal fields wants it too.

- `form/file` lets a file dropped on a `File`'s button or name reach its input, where Bulma's module draws the button and name over it, draws the button's keyboard focus ring, where Bulma's transparent input shows none, and rounds the bottom corners of a boxed `hasName` File with no name to show, which Bulma's `is-boxed` squares, so a build that uses `bulma/sass/form/file`, for a `File` or a `Dropzone`, wants it too.

- `form/select` outlines a focused `Select` in forced colors (Windows' contrast themes), where Bulma's focus ring is a shadow those themes drop and only the border's color would change, so a build that uses `bulma/sass/form/select` wants it too.

- `helpers/color` gives a color's text (`textColor`, `has-text-*`) the color's on-scheme lightness on the dark scheme wherever that's the lighter one, so a dark color such as the bestax blue primary reads there, and a build that uses `bulma/sass/helpers/color` wants it too.

- `helpers/visibility` draws `is-sr-only` at each breakpoint, which Bulma draws only at every width and the viewport visibility props write for `'sr-only'` (`visibilityTablet="sr-only"`), so a build that uses `bulma/sass/helpers/visibility` for those props wants it too.

A partial like that can end in the same name as the Bulma module it adjusts, and Sass refuses two `@use` lines with the same name in one file, so load it with a name of its own, `as bestax-<name>`, as the example above does. The name changes nothing in the compiled CSS.

Others draw on a stock Bulma component without adjusting it.

- `components/dialog` is drawn inside Bulma's modal, which makes it an overlay, with Bulma's buttons for its actions, so a build that uses it wants `bulma/sass/components/modal`, `bulma/sass/elements/button` and `elements/button` too. Without the modal module the dialog sits in the page's flow with no backdrop. A `Command.Dialog` is drawn inside the modal too, and `components/lightbox`'s viewer is one as well, with the button, loader and delete modules its controls use.

- `components/tableofcontents` is Bulma's menu, so a build that uses it wants `bulma/sass/components/menu` and `components/menu` too.

- `form/checkboxcard` and `form/radiocard` are Bulma cards, so a build that uses them wants `bulma/sass/components/card` too.

- `elements/stat`'s `Stats` row is Bulma's smart grid, so a build with one wants `bulma/sass/grid/grid` too.

- `form/dropzone` is Bulma's file widget, so a build that uses it wants `bulma/sass/form/file` and bestax's `form/file`, for the zone's focus ring, too, and its remove buttons are delete buttons, so it wants `bulma/sass/elements/delete` and `elements/delete` as well.

- `layout/appframe`'s drawer closes with a delete button, so it wants `bulma/sass/elements/delete` and `elements/delete` too, and its burger is Bulma's navbar burger, so it wants `bulma/sass/components/navbar` and `components/navbar` as well. Its icon rail, `AppFrame.Nav rail`, shows each label in a tooltip, so a build with a rail wants `components/tooltip` too, and `bulma/sass/components/menu` and `components/menu` for the icons in its menu.

- `form/colorpicker` draws its swatches and its preview with `elements/colorswatch`, and its value field and eye dropper button are Bulma's, so it wants that partial, `bulma/sass/form/input-textarea` and `bulma/sass/elements/button` as well.

- `form/colorinput` opens a `form/colorpicker` in the date pickers' `form/picker-popover`, so it wants both of those and what they want.

- `form/passwordinput` lays its button over Bulma's input, so it wants `bulma/sass/form/input-textarea` as well.

- `form/treeselect` opens a `components/treeview` in `form/picker-popover`, and its field, tags and clear button are Bulma's, so it wants those two, `form/checkbox` for the boxes, `bulma/sass/form/input-textarea`, `bulma/sass/elements/tag`, `bulma/sass/elements/delete` and `elements/delete` as well.

- `form/cascader` opens its columns in `form/picker-popover`, and brings `form/combobox` with it, for its search and the values its items start from. Its items are Bulma's dropdown items, so it wants `form/picker-popover`, `bulma/sass/components/dropdown`, `bulma/sass/form/input-textarea`, `bulma/sass/elements/delete` and `elements/delete` for the field and its clear button, and `bulma/sass/elements/loader`, `elements/loader` and `bulma/sass/elements/button` for a column that's loading or failed to load.

- `components/tour` draws a step's Skip, Back and Next with Bulma's buttons and its close button with a delete button, so a build that uses it wants `bulma/sass/elements/button`, `bulma/sass/elements/delete` and `elements/delete` too.

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
@use 'bulma/sass/components/modal'; // Dialog is drawn inside a Modal
@use 'bulma/sass/grid/columns';
@use 'bulma/sass/helpers/spacing';
@use 'bulma/sass/helpers/color';

// bestax extras — only what the app uses
@use '@allxsmith/bestax-bulma/scss/elements/box' as bestax-box;
@use '@allxsmith/bestax-bulma/scss/helpers/color' as bestax-color;
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
