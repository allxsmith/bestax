---
title: Migration
sidebar_label: Migration
sidebar_position: 7
---

# Migration

This guide covers migrating from Bulma v0.9.x to Bulma v1.x, migrating from other React Bulma packages to this library, and how to take advantage of the new features with this React library.

## Bulma v1 Migration

### Easy HTML Compatibility

The best part about migrating to Bulma v1 is that all HTML snippets remain the same. You don't need to update your markup - this means if you're using Bulma components, you don't need to change anything in your React components.

You can simply update your CSS import from:

```js
// Old: Bulma v0.9.4
import 'bulma@0.9.4/css/bulma.min.css';
```

To:

```js
// New: Bulma v1.0.0
import 'bulma@1.0.0/css/bulma.min.css';
```

Your components will continue to work! Things may look slightly different due to design improvements, but functionality remains intact.

## Key Changes in Bulma v1

### Sass Compiler Change

Bulma v1 now uses **Dart Sass** instead of the deprecated Node Sass:

- If you use the `sass` npm package, you're already using Dart Sass
- The old `node-sass` package is no longer supported
- Build times may be faster with Dart Sass

```bash
# Remove old dependency
npm uninstall node-sass

# Install modern Sass compiler
npm install sass
```

### CSS Variables Support

One of the biggest changes is that Bulma now uses **CSS custom properties (variables)** instead of static values:

```css
/* Old: Static values */
color: hsl(171deg, 100%, 41%);

/* New: CSS variables */
color: var(--bulma-primary);
```

This means you can now customize Bulma at **runtime** without needing Sass compilation:

```css
:root {
  --bulma-primary-h: 270deg;
  --bulma-primary-s: 100%;
  --bulma-primary-l: 50%;
}
```

## New Features

### Themes Support

Bulma v1 introduces the concept of **themes** - collections of CSS variables that can be applied to different contexts. This React library provides a `Theme` component to work with this:

```tsx
import { Theme, Button, Box } from '@allxsmith/bestax-bulma';

function ThemedSection() {
  return (
    <Theme primaryH="270" primaryS="100%" primaryL="50%">
      <Box p="4">
        <Button color="primary">Purple themed button</Button>
      </Box>
    </Theme>
  );
}
```

Learn more about theming in our [Theme documentation](../../api/helpers/theme.md).

### Dark Mode

Bulma v1 includes built-in dark mode support:

```tsx
import { Theme, Card, Title } from '@allxsmith/bestax-bulma';

function DarkModeExample() {
  return (
    <Theme
      bulmaVars={{ '--bulma-scheme-invert-ter': 'var(--bulma-scheme-main)' }}
    >
      <Card>
        <Box p="5">
          <Title>Dark mode content</Title>
        </Box>
      </Card>
    </Theme>
  );
}
```

### Color Palettes

Each of the 7 primary colors now has a complete palette with different shades:

```tsx
import { Button, Buttons } from '@allxsmith/bestax-bulma';

function ColorPaletteExample() {
  return (
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
  );
}
```

### Skeleton Loaders

New skeleton loading states are available for components:

```tsx
import { Button, Card, Title, Icon } from '@allxsmith/bestax-bulma';

function SkeletonExample() {
  return (
    <Card>
      <Box p="4">
        <Title skeleton>Loading title...</Title>
        <Button skeleton>Loading button</Button>
        <Icon name="star" skeleton ariaLabel="Loading icon" />
      </Box>
    </Card>
  );
}
```

### CSS Grid Support

Bulma v1 introduces true CSS Grid support (not flexbox-based "grids"):

```tsx
import { Grid, Cell, Notification } from '@allxsmith/bestax-bulma';

function GridExample() {
  return (
    <Grid minCol={3} gap={2}>
      {[...Array(9)].map((_, i) => (
        <Cell key={i}>
          <Notification color="primary">Cell {i + 1}</Notification>
        </Cell>
      ))}
    </Grid>
  );
}
```

Learn more in our [Grid documentation](../../api/grid/grid.md).

## Deprecated Features

### Tiles → Grid Migration

Tiles have been deprecated in Bulma v1. You should migrate to the new Grid system:

```tsx
// ❌ Old: Tiles (deprecated)
<div className="tile is-ancestor">
  <div className="tile is-4 is-vertical is-parent">
    <div className="tile is-child">Content</div>
  </div>
</div>

// ✅ New: CSS Grid
<Grid isFixed fixedCols={3}>
  <Cell>
    <Box>Content</Box>
  </Cell>
</Grid>
```

The new Grid system is more powerful and flexible than the old Tile system.

## Runtime Customization

Unlike Bulma v0.9.x which required Sass compilation for customization, v1 allows runtime customization through CSS variables:

### Browser DevTools

You can now change Bulma's appearance directly in browser developer tools:

```css
/* Change primary color in DevTools */
:root {
  --bulma-primary-h: 120deg; /* Green instead of teal */
}
```

### Theme Component

Use the Theme component for programmatic customization:

```tsx
import { Theme, Container, Button } from '@allxsmith/bestax-bulma';

function CustomTheme() {
  const [isDark, setIsDark] = useState(false);

  return (
    <Theme
      isRoot
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

## Migration Tool

We're developing a migration tool to help you transition from older React Bulma libraries to bestax-bulma:

```bash
# Coming soon: Automated migration tool
npx bestax-bulma-migrate
```

This tool will use jscodeshift to:

- Update imports from older React Bulma packages
- Migrate from Bulma v0.9.4 class patterns to v1.x
- Convert deprecated Tile usage to Grid components
- Update theme and configuration patterns

### Request Migration Support

If you're using a specific React Bulma package that isn't supported by our migration tool yet, we'd love to hear from you! Please [create a feature request](https://github.com/allxsmith/bestax/issues/new?template=feature-request.md) and let us know:

- Which React Bulma package you're currently using
- What components or patterns you need help migrating
- Any specific challenges you're facing in the migration process

This helps us prioritize which packages to support next and ensures the migration tool meets your needs.

## Best Practices

### Gradual Migration

1. **Start with CSS**: Update to Bulma v1 CSS first to ensure compatibility
2. **Test thoroughly**: Verify all components render correctly
3. **Add new features**: Gradually introduce themes, CSS variables, and new components
4. **Optimize later**: Move to modular imports for better bundle size

### Sass to CSS Variables

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

This migration guide should help you transition smoothly to Bulma v1 while taking advantage of the powerful new features available in this React library.
