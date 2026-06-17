---
title: Bulma V1
sidebar_label: Bulma V1
sidebar_position: 4
---

# Bulma V1 (and Beyond)

bestax-bulma is built for **Bulma v1** — the version released in 2024 that introduced CSS custom properties, true CSS Grid, and skeleton loading — and it layers on a curated set of components Bulma doesn't ship. It's not a neutral wrapper around Bulma's markup; it's a React library that **extends** Bulma with the pieces real apps need (Carousel, Dialog, Autocomplete, Rate, Slider, Taginput, Toast, Sidebar, and more) while keeping the Bulma classes you already know.

## Why Bulma V1 Matters

Most React Bulma packages on npm still target Bulma v0.9.4. That means no CSS variables, no runtime theming, no true CSS Grid, no skeletons, and no class prefixing. Adopting any of them today means inheriting a design system frozen in 2023.

### Library Comparison

| Feature                     | Other Libraries          | bestax-bulma                                                                      |
| --------------------------- | ------------------------ | --------------------------------------------------------------------------------- |
| **Bulma Version**           | v0.9.4 or older          | v1.0+ (latest)                                                                    |
| **CSS Variables**           | ❌ Not supported         | ✅ Full support (500+ variables)                                                  |
| **Runtime Theming**         | ❌ Limited               | ✅ Complete `Theme` component                                                     |
| **CSS Grid**                | ❌ Missing               | ✅ True CSS Grid via `Grid` / `Cell`                                              |
| **Skeleton Loading**        | ❌ Not available         | ✅ Universal `skeleton` helper prop + dedicated `Skeleton` element                |
| **Class Prefixing**         | ❌ No support            | ✅ `ConfigProvider` support                                                       |
| **Dark Mode**               | ❌ Manual implementation | ✅ Built-in theme support                                                         |
| **Components beyond Bulma** | ❌ None                  | ✅ Carousel, Dialog, Autocomplete, Rate, Slider, Taginput, Toast, Sidebar, Switch |

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

bestax exposes Bulma v1's skeletons through three complementary APIs:

1. **`skeleton` helper prop** — available on every component that uses `useBulmaClasses` (so: Button, Box, Icon, Image, Notification, Tag, Input, TextArea, and most others). Renders Bulma's `is-skeleton` class for an in-place loading state.
2. **`<Skeleton />` element** — a standalone placeholder for custom shapes and multi-line blocks (`<Skeleton variant="lines" lines={5} />`).
3. **`hasSkeleton` prop on `Title` / `SubTitle`** — emits `has-skeleton` so heading placeholders preserve the heading's sizing.

```tsx
import {
  Box,
  Button,
  Title,
  Icon,
  Image,
  Skeleton,
} from '@allxsmith/bestax-bulma';

function SkeletonExamples() {
  const [loading, setLoading] = useState(true);

  return (
    <Box p="4">
      <Title hasSkeleton={loading}>
        {loading ? 'Loading...' : 'Content Loaded!'}
      </Title>

      <Button skeleton={loading} color="primary">
        Click me
      </Button>

      <Icon name="star" skeleton={loading} ariaLabel="Rating" />

      <Image
        skeleton={loading}
        src="https://via.placeholder.com/300"
        alt="Example"
        size="128x128"
      />

      {loading && <Skeleton variant="lines" lines={3} />}

      <button onClick={() => setLoading(!loading)}>Toggle Loading State</button>
    </Box>
  );
}
```

## Comprehensive Feature Matrix

### Elements

| Component        | Bulma v1 Features              | bestax-bulma Support |
| ---------------- | ------------------------------ | -------------------- |
| **Button**       | Skeleton states, CSS variables | ✅ Complete          |
| **Box**          | CSS variable theming           | ✅ Complete          |
| **Icon**         | Skeleton helper                | ✅ Complete          |
| **Image**        | Skeleton helper                | ✅ Complete          |
| **Notification** | CSS variable colors            | ✅ Complete          |
| **Progress**     | Enhanced animations            | ✅ Complete          |
| **Skeleton**     | Standalone placeholder element | ✅ Complete          |
| **Tag**          | Skeleton helper                | ✅ Complete          |
| **Title**        | `hasSkeleton` support          | ✅ Complete          |

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

## Beyond Bulma v1: bestax Extras

Bulma is a CSS framework — it doesn't ship carousels, dialogs, autocompletes, or rating inputs. bestax-bulma adds a curated set of React components that fit the same look and feel, use the same CSS variables, and respect the same `ConfigProvider` settings.

### Interactive components

| Component    | What it adds                                                |
| ------------ | ----------------------------------------------------------- |
| **Carousel** | Slide-based content viewer with auto-advance and indicators |
| **Dialog**   | Modal dialog with confirm/cancel callbacks                  |
| **Collapse** | Expandable content region with animation                    |
| **Sidebar**  | Slide-in navigation panel                                   |
| **Toast**    | Transient notification stack with optional action buttons   |
| **Loading**  | Full-page or in-box loading overlay                         |
| **Tooltip**  | Hover-triggered label with configurable delay               |

### Form components beyond Bulma

| Component        | What it adds                                                   |
| ---------------- | -------------------------------------------------------------- |
| **Autocomplete** | Searchable select with keyboard navigation                     |
| **Rate**         | Star-rating input                                              |
| **Slider**       | Themed range input                                             |
| **Taginput**     | Free-text tag entry                                            |
| **Switch**       | Toggle switch styled to match Bulma controls                   |
| **NumberInput**  | Numeric input with increment/decrement controls                |
| **Checkboxes**   | Grouped checkbox list with shared label / layout               |
| **Radios**       | Grouped radio list with shared label / layout                  |
| **Field**        | Convenience wrapper that bundles `Field` / `Control` / `Label` |

Each of these is a full React component with TypeScript types, Storybook examples, and its own API page under the **Components** and **Form** sections.

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

This example uses class prefixing (`ConfigProvider`), runtime theming (`Theme`), and true CSS Grid (`Grid` / `Cell`) — all Bulma v1 features exposed as first-class React APIs.

### Why bestax-bulma

- **Latest Bulma v1** — not a v0.9.4 port.
- **TypeScript-first** — complete, accurate prop types for every component.
- **Tree-shakeable** — import only the components you use.
- **One dependency** — Bulma. bestax bundles it for you.
- **Extends, doesn't wrap** — Carousel, Dialog, Autocomplete, Rate, Slider, Taginput, Toast, Sidebar, and more are included alongside the full Bulma component set.
