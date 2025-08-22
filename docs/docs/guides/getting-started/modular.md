---
title: Modular
sidebar_label: Modular
sidebar_position: 5
---

# Modular

This guide covers how to use just what you need from both Bulma CSS and this React library to optimize your bundle size and improve performance.

## Bulma CSS Modularity

:::tip Development Approach
For development, the recommended approach is to start by importing all of Bulma to get up and running quickly:

```js
import 'bulma/css/bulma.min.css';
```

This gives you access to all Bulma components and helpers during development. Once your application is more mature and you want to optimize bundle size, you can refine your imports to include only what you need.
:::

Bulma v1 is designed to be modular, allowing you to import only the CSS you need for your specific components and features.

### Base Styles

Before importing individual component styles, you need Bulma's base styles and themes:

```scss
// Required: Base styles and CSS variables
@use 'bulma/sass/base';
@use 'bulma/sass/themes';
```

These provide:

- CSS reset and normalization
- CSS custom properties (variables)
- Base typography and color system
- Theme definitions (light/dark modes)

### Individual Component Styles

After importing the base, you can selectively import styles for individual components:

```scss
// Elements
@use 'bulma/sass/elements/button';
@use 'bulma/sass/elements/box';
@use 'bulma/sass/elements/notification';
@use 'bulma/sass/elements/title';

// Form components
@use 'bulma/sass/form/input';
@use 'bulma/sass/form/textarea';
@use 'bulma/sass/form/select';

// Components
@use 'bulma/sass/components/card';
@use 'bulma/sass/components/modal';
@use 'bulma/sass/components/navbar';
```

### Grid System

The columns system does **not** require base styles since it doesn't use CSS variables:

```scss
// Can be imported independently
@use 'bulma/sass/grid/columns';

// Or import the new CSS Grid system
@use 'bulma/sass/grid/grid';
```

### Helper Classes

Import only the helper categories you need:

```scss
// Spacing helpers
@use 'bulma/sass/helpers/spacing';

// Color helpers
@use 'bulma/sass/helpers/color';

// Typography helpers
@use 'bulma/sass/helpers/typography';

// Flexbox helpers
@use 'bulma/sass/helpers/flexbox';

// Other helpers
@use 'bulma/sass/helpers/other';
```

### Complete Modular Example

Here's a complete example for a project using only buttons, boxes, and the grid system:

```scss
// styles/main.scss

// Required base styles
@use 'bulma/sass/base';
@use 'bulma/sass/themes';

// Only the components we need
@use 'bulma/sass/elements/button';
@use 'bulma/sass/elements/box';
@use 'bulma/sass/grid/columns';

// Only specific helpers
@use 'bulma/sass/helpers/spacing';
@use 'bulma/sass/helpers/color';
```

Then import this in your React app:

```tsx
// App.tsx
import './styles/main.scss';
import { Button, Box, Columns, Column } from '@allxsmith/bestax-bulma';

function App() {
  return (
    <Columns>
      <Column>
        <Box p="4">
          <Button color="primary">Hello World</Button>
        </Box>
      </Column>
    </Columns>
  );
}
```

## React Component Modularity

This React library is also designed for modularity. Your bundler will automatically tree-shake unused components when you use individual imports.

### Individual Component Imports

Instead of importing everything:

```tsx
// ❌ Imports entire library (larger bundle)
import BestaxBulma from '@allxsmith/bestax-bulma';
```

Import only what you need:

:::tip

Most bundlers will tree-shake automatically

:::

```tsx
// ✅ Also tree-shakeable with modern bundlers
import { Button, Box, Card } from '@allxsmith/bestax-bulma';
```

### Component Categories

Components are organized by categories matching Bulma's structure:

```tsx
// Elements
import {
  Button,
  Box,
  Content,
  Delete,
  Icon,
  Image,
  Notification,
  Progress,
  Tag,
  Title,
} from '@allxsmith/bestax-bulma';

// Components
import {
  Breadcrumb,
  Card,
  Dropdown,
  Menu,
  Message,
  Modal,
  Navbar,
  Pagination,
  Panel,
  Tabs,
} from '@allxsmith/bestax-bulma';

// Form
import {
  Input,
  TextArea,
  Select,
  Checkbox,
  Radio,
  File,
} from '@allxsmith/bestax-bulma';

// Layout
import {
  Container,
  Footer,
  Hero,
  Level,
  Media,
  Section,
} from '@allxsmith/bestax-bulma';

// Columns
import { Columns, Column } from '@allxsmith/bestax-bulma';

// Grid
import { Grid, Cell } from '@allxsmith/bestax-bulma';

// Helpers
import {
  useBulmaClasses,
  classNames,
  ConfigProvider,
  Theme,
} from '@allxsmith/bestax-bulma';
```

## Bundle Size Optimization

### Vite Example

Create a custom SCSS file with only what you need:

```scss
// src/styles/bulma-custom.scss

// Required base
@use 'bulma/sass/base';
@use 'bulma/sass/themes';

// Only components we use
@use 'bulma/sass/elements/button';
@use 'bulma/sass/elements/box';
@use 'bulma/sass/elements/notification';
@use 'bulma/sass/components/card';
@use 'bulma/sass/grid/columns';

// Essential helpers
@use 'bulma/sass/helpers/spacing';
@use 'bulma/sass/helpers/color';
```

Import in your main component:

```tsx
// src/App.tsx
import './styles/bulma-custom.scss';
import {
  Button,
  Box,
  Notification,
  Card,
  Columns,
  Column,
} from '@allxsmith/bestax-bulma';

function App() {
  return (
    <div>
      <Columns>
        <Column>
          <Card>
            <Box p="4">
              <Button color="primary">Optimized App</Button>
              <Notification color="success" mt="3">
                Only loads the CSS and JS we need!
              </Notification>
            </Box>
          </Card>
        </Column>
      </Columns>
    </div>
  );
}

export default App;
```

### Webpack Example

For Webpack projects, create a similar modular SCSS file:

```scss
// src/styles/bulma.scss
@use 'bulma/sass/base';
@use 'bulma/sass/themes';

// Add only what you need
@use 'bulma/sass/elements/button';
@use 'bulma/sass/layout/container';
@use 'bulma/sass/helpers/spacing';
```

Import in your entry point:

```tsx
// src/index.tsx
import './styles/bulma.scss';
import { createRoot } from 'react-dom/client';
import { Container, Button } from '@allxsmith/bestax-bulma';

function App() {
  return (
    <Container>
      <Button color="primary" m="4">
        Modular Button
      </Button>
    </Container>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
```

### Next.js Example

In Next.js, create a global stylesheet:

```scss
// styles/globals.scss
@use 'bulma/sass/base';
@use 'bulma/sass/themes';

// Import only needed components
@use 'bulma/sass/elements/button';
@use 'bulma/sass/elements/title';
@use 'bulma/sass/layout/section';
@use 'bulma/sass/layout/container';
@use 'bulma/sass/helpers/spacing';
```

Import in `_app.tsx`:

```tsx
// pages/_app.tsx
import '../styles/globals.scss';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
```

Use components in pages:

```tsx
// pages/index.tsx
import { Container, Section, Title, Button } from '@allxsmith/bestax-bulma';

export default function Home() {
  return (
    <Section>
      <Container>
        <Title>Modular Next.js App</Title>
        <Button color="primary" mt="4">
          Tree-shaken Button
        </Button>
      </Container>
    </Section>
  );
}
```

## Bundle Size Benefits

Using modular imports can significantly reduce your bundle size:

### Full Bulma CSS

- **Size**: ~200KB minified
- **Components**: All Bulma components and helpers

### Modular Approach (Button + Box + Helpers)

- **Size**: ~30-50KB minified
- **Components**: Only what you imported

### Tree-shaken JavaScript

- **Full library import**: All component code
- **Modular imports**: Only components you use
- **Savings**: Can reduce JS bundle by 70-90% depending on usage

## Best Practices

1. **Start minimal**: Begin with base styles + only the components you need
2. **Add incrementally**: Import additional components as you need them
3. **Use helper classes selectively**: Import only the helper categories you use
4. **Monitor bundle size**: Use tools like `webpack-bundle-analyzer` to track your bundle
5. **Prefer component-specific styles**: When possible, use component props over helper classes for better tree-shaking

## Development vs Production

During development, you might import the full Bulma CSS for convenience:

```scss
// Development: Quick setup
@import 'bulma/css/bulma.min.css';
```

For production, switch to modular imports for optimal performance:

```scss
// Production: Optimized bundle
@use 'bulma/sass/base';
@use 'bulma/sass/themes';
@use 'bulma/sass/elements/button';
// ... only what you need
```

This approach ensures your production bundle is as small as possible while maintaining development flexibility.
