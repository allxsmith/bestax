---
title: CSS Variables
sidebar_label: CSS Variables
sidebar_position: 2
---

# CSS Variables

[Bulma v1 introduces comprehensive support for CSS custom properties (CSS variables)](https://bulma.io/documentation/features/css-variables/), enabling runtime customization without Sass compilation. bestax-bulma gives you a first-class React surface for all 500+ of them through the `Theme` component: named, camelCase props for the common variables, a `bulmaVars` escape hatch for the long tail, and automatic scoping so themes compose via React context — no manual style-sheet injection, no string concatenation, fully type-checked.

:::info Bulma's canonical reference
The authoritative documentation for every Bulma CSS variable lives on the Bulma site:

- [CSS Variables in Bulma](https://bulma.io/documentation/features/css-variables/) — how Bulma uses CSS variables and their `--bulma-` prefix.
- [Themes](https://bulma.io/documentation/features/themes/) — Bulma's theme system (a theme is a set of CSS variables scoped at `:root` or below).
- [Dark Mode](https://bulma.io/documentation/features/dark-mode/) — the prefers-color-scheme and `.theme-dark` conventions Bulma ships.

This page focuses on the React surface (`Theme`, `bulmaVars`); refer to Bulma's docs for the variable catalog and CSS-level semantics.
:::

## What are CSS Variables?

CSS variables (officially called CSS custom properties) are entities defined by CSS authors that contain specific values to be reused throughout a document. Unlike Sass variables, which are compile-time constants, CSS variables are runtime values that can be:

- Changed dynamically with JavaScript
- Inherited through the CSS cascade
- Scoped to specific DOM elements
- Modified without rebuilding your CSS

## Runtime Customization

### Browser DevTools

You can modify Bulma's appearance directly in browser developer tools by changing CSS variable values. This is powerful for testing and debugging:

**Steps to test:**

1. Open your browser's developer tools
2. Select the `html` element in the Elements panel
3. In the Styles panel, add or modify a CSS variable like `--bulma-primary-h: 270deg`
4. Watch the changes apply instantly across your entire application

```css
/* Example: Change primary color to purple in DevTools */
:root {
  --bulma-primary-h: 270deg;
  --bulma-primary-s: 100%;
  --bulma-primary-l: 50%;
}
```

### JavaScript Runtime Changes

CSS variables can be modified programmatically:

```javascript
// Change primary color dynamically
document.documentElement.style.setProperty('--bulma-primary-h', '120deg');

// Change theme scheme
document.documentElement.style.setProperty('--bulma-scheme-h', '210deg');
```

## Using the Theme Component

`Theme` is bestax's React wrapper for Bulma's CSS variables. Two things make it idiomatic to use from React rather than hand-writing `style.setProperty` calls:

- **Named props for the common variables** — `primaryH`, `schemeH`, `radius`, `familyPrimary`, etc. TypeScript autocompletes them and catches typos at build time.
- **`bulmaVars` for everything else** — a single object prop that accepts raw CSS variable names, so you never hit a ceiling.

Themes nest naturally: outer `<Theme>` sets app-wide defaults, inner ones scope overrides to a subtree. Use `isRoot` to inject variables at `:root` for true app-wide reach.

### Global Theme Application

```tsx
import { Theme, Button, Box, Title } from '@allxsmith/bestax-bulma';

function App() {
  return (
    <Theme
      isRoot
      primaryH="270"
      primaryS="100%"
      primaryL="50%"
      schemeH="260"
      schemeS="30%"
    >
      <Box p="4">
        <Title>Purple-themed Application</Title>
        <Button color="primary">Purple Button</Button>
      </Box>
    </Theme>
  );
}
```

### Scoped Theme Application

```tsx
function ScopedTheming() {
  return (
    <div>
      <Title>Standard Theme</Title>

      <Theme primaryH="120" primaryS="100%" primaryL="40%">
        <Box p="4" mt="3">
          <Title size="4">Green Section</Title>
          <Button color="primary">Green Button</Button>
        </Box>
      </Theme>

      <Theme primaryH="15" primaryS="85%" primaryL="55%">
        <Box p="4" mt="3">
          <Title size="4">Orange Section</Title>
          <Button color="primary">Orange Button</Button>
        </Box>
      </Theme>
    </div>
  );
}
```

### Using bulmaVars Object

For less common variables or when you have many to set:

```tsx
function AdvancedTheming() {
  const customTheme = {
    '--bulma-family-primary': '"Helvetica Neue", sans-serif',
    '--bulma-family-code': '"Fira Code", monospace',
    '--bulma-size-normal': '16px',
    '--bulma-weight-bold': '700',
    '--bulma-title-color': 'hsl(0, 0%, 21%)',
    '--bulma-subtitle-color': 'hsl(0, 0%, 48%)',
    '--bulma-card-shadow': '0 8px 32px rgba(0, 0, 0, 0.1)',
    '--bulma-button-border-radius': '12px',
  };

  return (
    <Theme bulmaVars={customTheme}>
      <Box p="4">
        <Title>Custom Typography & Styling</Title>
        <Button color="primary">Custom Styled Button</Button>
      </Box>
    </Theme>
  );
}
```

## Complete CSS Variables Catalog

Bulma v1 provides 500+ CSS variables organized by category. Here are the key categories — for the full, authoritative list see the [Bulma CSS Variables reference](https://bulma.io/documentation/features/css-variables/) and the per-component pages under [bulma.io/documentation](https://bulma.io/documentation/).

### Scheme Variables

| Variable           | Description                | Example Value |
| ------------------ | -------------------------- | ------------- |
| `--bulma-scheme-h` | Base hue for color scheme  | `210`         |
| `--bulma-scheme-s` | Base saturation            | `50%`         |
| `--bulma-light-l`  | Light background lightness | `96%`         |
| `--bulma-dark-l`   | Dark background lightness  | `4%`          |
| `--bulma-soft-l`   | Soft color lightness       | `85%`         |
| `--bulma-bold-l`   | Bold color lightness       | `15%`         |

### Color Variables

| Variable            | Description              | Example Value |
| ------------------- | ------------------------ | ------------- |
| `--bulma-primary-h` | Primary color hue        | `171`         |
| `--bulma-primary-s` | Primary color saturation | `100%`        |
| `--bulma-primary-l` | Primary color lightness  | `41%`         |
| `--bulma-link-h`    | Link color hue           | `233`         |
| `--bulma-info-h`    | Info color hue           | `198`         |
| `--bulma-success-h` | Success color hue        | `153`         |
| `--bulma-warning-h` | Warning color hue        | `42`          |
| `--bulma-danger-h`  | Danger color hue         | `348`         |

### Typography Variables

| Variable                 | Description         | Example Value                                |
| ------------------------ | ------------------- | -------------------------------------------- |
| `--bulma-family-primary` | Primary font family | `'BlinkMacSystemFont', 'Segoe UI', 'Roboto'` |
| `--bulma-family-code`    | Code font family    | `'Source Code Pro', monospace`               |
| `--bulma-size-normal`    | Normal text size    | `1rem`                                       |
| `--bulma-weight-normal`  | Normal font weight  | `400`                                        |
| `--bulma-weight-bold`    | Bold font weight    | `700`                                        |

### Layout Variables

| Variable                 | Description           | Example Value |
| ------------------------ | --------------------- | ------------- |
| `--bulma-block-spacing`  | Block element spacing | `1.5rem`      |
| `--bulma-radius`         | Default border radius | `4px`         |
| `--bulma-radius-rounded` | Rounded border radius | `9999px`      |
| `--bulma-column-gap`     | Column spacing        | `0.75rem`     |
| `--bulma-grid-gap`       | Grid spacing          | `1rem`        |

### Component-Specific Variables

#### Button Variables

| Variable                               | Description               |
| -------------------------------------- | ------------------------- |
| `--bulma-button-padding-vertical`      | Button vertical padding   |
| `--bulma-button-padding-horizontal`    | Button horizontal padding |
| `--bulma-button-border-radius`         | Button border radius      |
| `--bulma-button-focus-box-shadow-size` | Focus shadow size         |

#### Card Variables

| Variable                        | Description        |
| ------------------------------- | ------------------ |
| `--bulma-card-color`            | Card text color    |
| `--bulma-card-background-color` | Card background    |
| `--bulma-card-shadow`           | Card drop shadow   |
| `--bulma-card-radius`           | Card border radius |

#### Input Variables

| Variable                          | Description                |
| --------------------------------- | -------------------------- |
| `--bulma-input-color-l`           | Input text lightness       |
| `--bulma-input-background-l`      | Input background lightness |
| `--bulma-input-border-l`          | Input border lightness     |
| `--bulma-input-focus-shadow-size` | Focus shadow size          |

## Dynamic Theming Examples

### Dark Mode Toggle

Bulma ships a built-in dark-mode scheme that responds to `prefers-color-scheme` — see the [Bulma Dark Mode documentation](https://bulma.io/documentation/features/dark-mode/) for the CSS-level details. The example below overrides a subset of the scheme variables from React:

```tsx
function DarkModeApp() {
  const [isDark, setIsDark] = useState(false);

  const themeVars = {
    '--bulma-scheme-h': isDark ? '220' : '0',
    '--bulma-light-l': isDark ? '15%' : '96%',
    '--bulma-dark-l': isDark ? '85%' : '4%',
    '--bulma-scheme-invert-ter': isDark
      ? 'var(--bulma-scheme-main)'
      : 'var(--bulma-scheme-main-ter)',
  };

  return (
    <Theme bulmaVars={themeVars} isRoot>
      <Box p="4">
        <Title>Dynamic Dark Mode</Title>
        <Button onClick={() => setIsDark(!isDark)} color="primary">
          Toggle {isDark ? 'Light' : 'Dark'} Mode
        </Button>
      </Box>
    </Theme>
  );
}
```

### Color Palette Generator

```tsx
function ColorPaletteApp() {
  const [hue, setHue] = useState(171);

  return (
    <Theme primaryH={hue.toString()} isRoot>
      <Box p="4">
        <Title>Dynamic Color Palette</Title>
        <input
          type="range"
          min="0"
          max="360"
          value={hue}
          onChange={e => setHue(parseInt(e.target.value))}
        />
        <p>Hue: {hue}°</p>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <Button color="primary">Primary</Button>
          <Button color="info">Info</Button>
          <Button color="success">Success</Button>
          <Button color="warning">Warning</Button>
          <Button color="danger">Danger</Button>
        </div>
      </Box>
    </Theme>
  );
}
```

## Advantages Over Sass Variables

### Build-time vs Runtime

```scss
/* Sass variables (build-time only) */
$primary: #ff6b35;
$family-primary: 'Helvetica Neue', sans-serif;

@import 'bulma/bulma.sass';
```

```css
/* CSS variables (runtime modifiable) */
:root {
  --bulma-primary-h: 18deg;
  --bulma-primary-s: 100%;
  --bulma-primary-l: 60%;
  --bulma-family-primary: '"Helvetica Neue", sans-serif';
}
```

### Benefits of CSS Variables

1. **Runtime modification**: Change themes without rebuilding CSS
2. **User preferences**: Allow users to customize appearance
3. **Context-aware theming**: Different themes for different sections
4. **Performance**: No need for multiple CSS bundles
5. **Testing**: Easy to test different color schemes
6. **Debugging**: Modify values in DevTools for instant feedback

## Best Practices

### Organization

Group related variables for better maintainability:

```tsx
const brandTheme = {
  // Brand colors
  '--bulma-primary-h': '210',
  '--bulma-primary-s': '100%',
  '--bulma-primary-l': '50%',

  // Typography
  '--bulma-family-primary': '"Inter", sans-serif',
  '--bulma-weight-normal': '400',
  '--bulma-weight-bold': '600',

  // Layout
  '--bulma-radius': '8px',
  '--bulma-block-spacing': '2rem',
};
```

### Scope

- Prefer a single `isRoot` `Theme` at the top of your tree for global values.
- Use nested, non-root `Theme` elements only to override a specific subtree (a dashboard section, a marketing block) — each non-root theme wraps its children in a `<div>`, so don't nest one around a single button when a helper prop would do.

### Consistency

- Establish a design system with your CSS variables
- Document which variables your team uses most commonly
- Create reusable theme objects for common scenarios

## Further Reading

- [Theme component reference](../../api/helpers/theme.md) — the full bestax React API.
- [Bulma: CSS Variables](https://bulma.io/documentation/features/css-variables/) — how Bulma defines and consumes CSS variables.
- [Bulma: Themes](https://bulma.io/documentation/features/themes/) — Bulma's theme system and scoping rules.
- [Bulma: Dark Mode](https://bulma.io/documentation/features/dark-mode/) — dark-scheme conventions.
- [Bulma: Customize with CSS Variables](https://bulma.io/documentation/customize/with-css-variables/) — CSS-only customization guide.
