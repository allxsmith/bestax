---
title: Bulma 0.9.4 → 1.x
sidebar_label: Bulma 0.9.4 to 1.x
sidebar_position: 2
---

# Migrating from Bulma v0.9.x → Bulma v1

bestax-bulma has always required Bulma v1, so upgrading bestax itself never requires a Bulma migration. This page is here for two situations where the Bulma upgrade is relevant alongside (or before) adopting bestax:

- You're **migrating off another React + Bulma library** (e.g. `react-bulma-components`, Buefy, an in-house wrapper) that was pinned to Bulma 0.9.x.
- You have **plain Bulma 0.9.x in your project** today (separate stylesheets, custom Sass) and you want to upgrade Bulma itself so you can adopt bestax cleanly.

Either way, the changes you'll see at the Bulma layer are the same — captured below.

## Easy HTML compatibility

:::tip HTML stays the same
All Bulma v0.9.x HTML snippets remain valid in v1. You don't need to update markup or React component output — only your CSS / Sass build.
:::

You can keep your existing components, classes, and JSX as-is.

You can simply update your CSS import from:

```js
// Old: Bulma v0.9.4
import 'bulma@0.9.4/css/bulma.min.css';
```

To:

```js
// New: Bulma v1.0.0+
import 'bulma@1.0.0/css/bulma.min.css';
```

Your components will continue to work. Things may look slightly different due to design improvements, but functionality remains intact.

## Sass compiler change

Bulma v1 uses **Dart Sass** instead of the deprecated Node Sass:

- If you use the `sass` npm package, you're already using Dart Sass.
- The old `node-sass` package is no longer supported.
- Build times may be faster with Dart Sass.

```bash
# Remove old dependency
npm uninstall node-sass

# Install modern Sass compiler
pnpm add sass
```

## CSS variables support

One of the biggest changes in Bulma v1 is **CSS custom properties (variables)** instead of static values:

```css
/* Old: Static values */
color: hsl(171deg, 100%, 41%);

/* New: CSS variables */
color: var(--bulma-primary);
```

This means you can customize Bulma at **runtime** without needing Sass compilation:

```css
:root {
  --bulma-primary-h: 270deg;
  --bulma-primary-s: 100%;
  --bulma-primary-l: 50%;
}
```

## New features in Bulma v1

### Themes

Bulma v1 introduces **themes** — collections of CSS variables that can be applied to different contexts. bestax-bulma exposes a `<Theme>` component for this:

```tsx live
<Theme primaryH="270" primaryS="100%" primaryL="50%">
  <Box p="4">
    <Button color="primary">Purple themed button</Button>
  </Box>
</Theme>
```

Learn more in our [Theme documentation](../../../api/helpers/theme.md).

### Dark mode

```tsx live
<Theme bulmaVars={{ '--bulma-scheme-invert-ter': 'var(--bulma-scheme-main)' }}>
  <Card>
    <Box p="5">
      <Title>Dark mode content</Title>
    </Box>
  </Card>
</Theme>
```

### Color palettes

Each of the 7 primary colors now has a complete palette with shades:

```tsx live
<Buttons>
  <Button color="primary" colorShade="10">
    Primary Light
  </Button>
  <Button color="primary" colorShade="30">
    Primary Medium
  </Button>
  <Button color="primary" colorShade="60">
    Primary Dark
  </Button>
  <Button color="primary" colorShade="90">
    Primary Darker
  </Button>
</Buttons>
```

### Skeleton loaders

```tsx live
<Card>
  <Box p="4">
    <Title skeleton>Loading title…</Title>
    <Button skeleton>Loading button</Button>
    <Icon name="star" skeleton ariaLabel="Loading icon" />
  </Box>
</Card>
```

### CSS Grid support

Bulma v1 introduces true CSS Grid (not flexbox-based "grids"):

```tsx live
<Grid minCol={3} gap={2}>
  {[...Array(9)].map((_, i) => (
    <Cell key={i}>
      <Notification color="primary">Cell {i + 1}</Notification>
    </Cell>
  ))}
</Grid>
```

Learn more in our [Grid documentation](../../../api/grid/grid.md).

## Deprecated in Bulma v1

### Tiles → Grid

:::caution Tiles are deprecated
The Tile system is deprecated in Bulma v1. Migrate to the new CSS Grid system below — it's more powerful and uses real CSS Grid under the hood.
:::

❌ Old (deprecated):

```tsx
<div className="tile is-ancestor">
  <div className="tile is-4 is-vertical is-parent">
    <div className="tile is-child">Content</div>
  </div>
</div>
```

✅ New:

```tsx live
<Grid isFixed fixedCols={3}>
  <Cell>
    <Box>Content</Box>
  </Cell>
</Grid>
```

The new Grid system is more powerful and flexible.

## Runtime customization

Unlike Bulma v0.9.x, which required Sass compilation for customization, v1 allows runtime tweaks via CSS variables:

```css
/* Change primary color in DevTools */
:root {
  --bulma-primary-h: 120deg; /* Green instead of teal */
}
```

Or programmatically with the `<Theme>` component:

```tsx live
function example() {
  const [isDark, setIsDark] = useState(false);
  return (
    <Theme
      schemeH={isDark ? '220' : '0'}
      lightL={isDark ? '15%' : '96%'}
      darkL={isDark ? '85%' : '4%'}
    >
      <Container>
        <Button onClick={() => setIsDark(!isDark)}>
          Toggle {isDark ? 'Light' : 'Dark'} Mode
        </Button>
      </Container>
    </Theme>
  );
}
```

## Sass to CSS variables

If you were customizing Bulma with Sass variables:

```scss
// Old: Sass customization (v0.9.x)
$primary: #ff6b35;
$family-primary: 'Helvetica Neue', sans-serif;

@import 'bulma/bulma.sass';
```

Consider migrating to CSS variables for runtime flexibility:

```tsx
// New: Runtime customization (v1.x)
<Theme
  isRoot
  primaryH="18"
  primaryS="100%"
  primaryL="60%"
  bulmaVars={{
    '--bulma-family-primary': '"Helvetica Neue", sans-serif',
  }}
>
  <App />
</Theme>
```

## Best practices

1. **Start with CSS** — update to Bulma v1 CSS first to ensure compatibility.
2. **Test thoroughly** — verify all components render correctly.
3. **Add new features** — gradually introduce themes, CSS variables, and new components.
4. **Optimize later** — move to modular imports for better bundle size.

## Migration tool

If you're coming from **react-bulma-components**, the [`bestax-migrate`](./react-bulma-components.md) codemod automates the component-level migration:

```bash
pnpm dlx bestax-migrate react-bulma-components src/ --dry   # preview
pnpm dlx bestax-migrate react-bulma-components src/         # apply
```

It uses jscodeshift to rewrite imports, component names, and props onto bestax-bulma, flattens responsive breakpoint objects, and leaves a `TODO(bestax-migrate)` comment (plus an end-of-run report) at every site it can't convert safely — including deprecated Tile usage, which maps to the new [Grid](../../../api/grid/grid.md) components. See the [full guide](./react-bulma-components.md); the CSS-level steps on this page still apply afterwards.

### Request migration support

If you're using a specific React Bulma package that isn't supported by our migration tool yet, please [open a feature request](https://github.com/allxsmith/bestax/issues/new?template=feature-request.md) and tell us:

- Which React Bulma package you're currently using.
- What components or patterns you need help migrating.
- Any specific challenges you're facing.

This helps us prioritize which packages to support next.
