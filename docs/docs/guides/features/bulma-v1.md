---
title: Bulma V1
sidebar_label: Bulma V1
sidebar_position: 4
---

# Bulma V1

**Bestax-bulma** is built specifically for Bulma v1, the latest version of Bulma released in 2024. Unlike most other React Bulma libraries that target older versions, this library provides complete, up-to-date implementations of all Bulma v1 features.

## Why Bulma V1 Matters

Most React Bulma packages available today target Bulma v0.9.4 or earlier versions, missing out on the significant improvements and new features introduced in v1. This library ensures you get access to the latest Bulma capabilities with full React integration.

### Library Comparison

| Feature              | Other Libraries          | bestax-bulma                     |
| -------------------- | ------------------------ | -------------------------------- |
| **Bulma Version**    | v0.9.4 or older          | v1.0+ (latest)                   |
| **CSS Variables**    | ❌ Not supported         | ✅ Full support (500+ variables) |
| **Runtime Theming**  | ❌ Limited               | ✅ Complete Theme component      |
| **CSS Grid**         | ❌ Missing               | ✅ True CSS Grid support         |
| **Skeleton Loading** | ❌ Not available         | ✅ Built-in skeleton states      |
| **Class Prefixing**  | ❌ No support            | ✅ ConfigProvider support        |
| **Dark Mode**        | ❌ Manual implementation | ✅ Built-in theme support        |

## New Features in Bulma V1

### CSS Variables Support

Bulma v1 introduces comprehensive CSS custom properties, enabling runtime customization without Sass compilation:

```tsx
import { Theme, Button, Box } from '@allxsmith/bestax-bulma';

function RuntimeTheming() {
  return (
    <Theme primaryH="270" primaryS="100%" primaryL="50%" isRoot>
      <Box p="4">
        <Button color="primary">Purple themed button</Button>
      </Box>
    </Theme>
  );
}
```

**Benefits:**

- Change themes without rebuilding CSS
- User-customizable interfaces
- Dynamic color schemes
- Browser DevTools customization

### Configuration & Class Prefixing

Advanced configuration options for enterprise and multi-framework environments:

```tsx
import { ConfigProvider, Button, Box } from '@allxsmith/bestax-bulma';
import 'bulma/css/versions/bulma-prefixed.min.css';

function PrefixedApp() {
  return (
    <ConfigProvider classPrefix="bulma-">
      <Box>
        <Button color="primary">Prefixed button</Button>
      </Box>
    </ConfigProvider>
  );
}
```

**Use cases:**

- Framework integration (Bootstrap + Bulma)
- Multi-tenant applications
- Component library namespacing
- Legacy system integration

### Advanced Theming System

Complete theming capabilities with nested contexts and inheritance:

```tsx
function AdvancedTheming() {
  return (
    <Theme schemeH="210" schemeS="50%" isRoot>
      <div>
        <h1>App-wide blue theme</h1>

        <Theme primaryH="120" primaryS="100%" primaryL="40%">
          <Box p="4">
            <h2>Green section</h2>
            <Button color="primary">Green button</Button>
          </Box>
        </Theme>

        <Button color="primary">Blue button</Button>
      </div>
    </Theme>
  );
}
```

### True CSS Grid Support

**Important:** Bulma v0.9.4 referred to its flexbox-based column system as "grids," but they weren't true CSS Grid. Bulma v1 introduces actual CSS Grid support alongside the existing flexbox columns.

#### Smart Grid (Auto-responsive)

```tsx
import { Grid, Cell, Notification } from '@allxsmith/bestax-bulma';

function SmartGrid() {
  return (
    <Grid minCol={3} gap={2}>
      {[...Array(12)].map((_, i) => (
        <Cell key={i}>
          <Notification color="primary">Auto-sized cell {i + 1}</Notification>
        </Cell>
      ))}
    </Grid>
  );
}
```

#### Fixed Grid (Explicit columns)

```tsx
function FixedGrid() {
  return (
    <Grid
      isFixed
      fixedCols={4}
      fixedColsTablet={6}
      fixedColsDesktop={8}
      gap={3}
    >
      {[...Array(16)].map((_, i) => (
        <Cell key={i}>
          <Box p="3">
            <Button>Grid item {i + 1}</Button>
          </Box>
        </Cell>
      ))}
    </Grid>
  );
}
```

#### Grid vs Columns

```tsx
// Old: Flexbox "grid" (still available as Columns)
<Columns>
  <Column size="one-third">Column 1</Column>
  <Column size="one-third">Column 2</Column>
  <Column size="one-third">Column 3</Column>
</Columns>

// New: True CSS Grid
<Grid isFixed fixedCols={3}>
  <Cell>Cell 1</Cell>
  <Cell>Cell 2</Cell>
  <Cell>Cell 3</Cell>
</Grid>
```

### Skeleton Loading States

Built-in skeleton loading animations for all components:

```tsx
function SkeletonExamples() {
  const [loading, setLoading] = useState(true);

  return (
    <Box p="4">
      <Title skeleton={loading}>
        {loading ? 'Loading...' : 'Content Loaded!'}
      </Title>

      <Button skeleton={loading} color="primary">
        {loading ? 'Loading...' : 'Click me'}
      </Button>

      <Icon name="star" skeleton={loading} ariaLabel="Rating" />

      <Image
        skeleton={loading}
        src="https://via.placeholder.com/300"
        alt="Example"
        size="128x128"
      />

      <button onClick={() => setLoading(!loading)}>Toggle Loading State</button>
    </Box>
  );
}
```

**Available on components:**

- Button, Icon, Image, Notification
- Tag, Title, SubTitle, Input, TextArea
- And more...

## Comprehensive Feature Matrix

### Elements

| Component        | Bulma v1 Features              | bestax-bulma Support |
| ---------------- | ------------------------------ | -------------------- |
| **Button**       | Skeleton states, CSS variables | ✅ Complete          |
| **Box**          | Enhanced theming               | ✅ Complete          |
| **Icon**         | Skeleton loading               | ✅ Complete          |
| **Image**        | Skeleton states                | ✅ Complete          |
| **Notification** | CSS variable colors            | ✅ Complete          |
| **Progress**     | Enhanced animations            | ✅ Complete          |
| **Tag**          | Skeleton loading               | ✅ Complete          |
| **Title**        | Skeleton states                | ✅ Complete          |

### Components

| Component      | Bulma v1 Features    | bestax-bulma Support |
| -------------- | -------------------- | -------------------- |
| **Card**       | CSS variable theming | ✅ Complete          |
| **Dropdown**   | Enhanced positioning | ✅ Complete          |
| **Menu**       | CSS variable colors  | ✅ Complete          |
| **Message**    | Improved theming     | ✅ Complete          |
| **Modal**      | Enhanced styling     | ✅ Complete          |
| **Navbar**     | CSS variables        | ✅ Complete          |
| **Pagination** | Modern styling       | ✅ Complete          |
| **Tabs**       | Enhanced theming     | ✅ Complete          |

### Layout & Grid

| Feature             | Description               | Support     |
| ------------------- | ------------------------- | ----------- |
| **CSS Grid**        | True grid layout system   | ✅ Complete |
| **Smart Grid**      | Auto-responsive grids     | ✅ Complete |
| **Fixed Grid**      | Explicit column control   | ✅ Complete |
| **Grid Cells**      | Advanced cell positioning | ✅ Complete |
| **Flexbox Columns** | Legacy column system      | ✅ Complete |

### Modern Capabilities

| Feature              | Description                 | Implementation      |
| -------------------- | --------------------------- | ------------------- |
| **CSS Variables**    | 500+ customizable variables | Theme component     |
| **Runtime Theming**  | Dynamic theme switching     | Theme + CSS vars    |
| **Class Prefixing**  | Namespace CSS classes       | ConfigProvider      |
| **Dark Mode**        | Built-in dark theme support | Theme component     |
| **Skeleton Loading** | Loading state animations    | Component prop      |
| **Color Palettes**   | Extended color variations   | CSS variable shades |

## Migration Benefits

### From Other Libraries

When migrating from other React Bulma libraries:

```tsx
// Before: Limited customization
import { Button } from 'react-bulma-components';

<Button color="primary">Old library</Button>;

// After: Full Bulma v1 features
import { Button, Theme, ConfigProvider } from '@allxsmith/bestax-bulma';

<ConfigProvider classPrefix="bulma-">
  <Theme primaryH="270" primaryS="100%" primaryL="50%">
    <Button color="primary" skeleton={loading}>
      Modern Bulma v1
    </Button>
  </Theme>
</ConfigProvider>;
```

### Performance Improvements

- Tree-shakeable imports
- Modern CSS with variables
- Efficient re-rendering with React contexts
- Smaller bundle sizes with modular imports

### Developer Experience

- Full TypeScript support
- Comprehensive prop interfaces
- Detailed documentation
- Storybook examples
- Modern React patterns

## Future-Proof Architecture

This library is designed to evolve with Bulma:

- **Continuous updates** with new Bulma releases
- **Backward compatibility** maintained
- **Modern React patterns** (hooks, contexts, etc.)
- **Performance optimizations** as standards evolve
- **Community-driven** development

## Getting Started with V1 Features

```tsx
import {
  ConfigProvider,
  Theme,
  Grid,
  Cell,
  Button,
  Title,
} from '@allxsmith/bestax-bulma';

function ModernBulmaApp() {
  return (
    <ConfigProvider classPrefix="bulma-">
      <Theme primaryH="200" primaryS="100%" primaryL="50%" isRoot>
        <Grid minCol={2} gap={3}>
          <Cell>
            <Title skeleton={false}>Bulma V1 Features</Title>
            <Button color="primary" skeleton={false}>
              Modern Button
            </Button>
          </Cell>
          <Cell>
            <Button color="success">CSS Grid Layout</Button>
          </Cell>
        </Grid>
      </Theme>
    </ConfigProvider>
  );
}
```

This example showcases multiple v1 features:

- Class prefixing with ConfigProvider
- Runtime theming with Theme
- True CSS Grid with Grid/Cell
- Modern component APIs

By choosing bestax-bulma, you're getting the most complete and up-to-date React implementation of Bulma available, with full support for all the modern features that make Bulma v1 a powerful choice for 2024, 2025 and beyond.
