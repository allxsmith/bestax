---
title: CSS Variables
sidebar_label: CSS Variables
sidebar_position: 2
---

# CSS Variables

Bulma v1 introduces comprehensive support for CSS custom properties (CSS variables), enabling runtime customization without requiring Sass compilation. This React library provides full support for all 500+ Bulma CSS variables through the `Theme` component.

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

The `Theme` component provides a React-friendly way to work with CSS variables:

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

Bulma v1 provides 500+ CSS variables organized by category. Here are the key categories:

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

### Performance

- Use Theme component judiciously - too many nested themes can impact performance
- Prefer setting variables at higher levels in your component tree
- Use `isRoot={true}` for application-wide themes

### Consistency

- Establish a design system with your CSS variables
- Document which variables your team uses most commonly
- Create reusable theme objects for common scenarios

For comprehensive API documentation and more examples, see the [Theme component reference](../../api/helpers/theme.md).
