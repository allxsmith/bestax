---
title: CSS Variations
sidebar_label: CSS Variations
sidebar_position: 2
---

# CSS Variations

Bestax ships pre-built CSS variations that combine Bulma with bestax extras into a single file. Each variation mirrors a Bulma variation but includes all bestax extra component styles, so you only need one CSS import.

---

## Complete (Recommended)

The full bestax CSS including Bulma, all extras, helpers, and dark mode support. **This is the recommended version for most projects.**

**Prefix:** None\
**Import Statement:**

```js
import '@allxsmith/bestax-bulma/bestax.css';
```

**Usage:**

```tsx live
import React from 'react';
import { Button, Box, Title } from '@allxsmith/bestax-bulma';
import '@allxsmith/bestax-bulma/bestax.css';

function App() {
  return (
    <Box>
      <Title>Complete Bestax</Title>
      <Button color="primary">Primary Button</Button>
    </Box>
  );
}
```

---

## Prefixed (`bestax-`)

All CSS classes are prefixed with `bestax-` to avoid conflicts with other CSS frameworks.

**Prefix:** `bestax-`\
**Import Statement:**

```js
import '@allxsmith/bestax-bulma/versions/bestax-prefixed.css';
```

**Usage:**

```tsx live
import React from 'react';
import { ConfigProvider, Button, Box, Title } from '@allxsmith/bestax-bulma';
import '@allxsmith/bestax-bulma/versions/bestax-prefixed.css';

function App() {
  return (
    <ConfigProvider classPrefix="bestax-">
      <Box>
        <Title size={2}>Bestax-Prefixed Components</Title>
        <p>
          All components inside this ConfigProvider will have their CSS classes
          prefixed with "bestax-". This allows you to use bestax alongside other
          CSS frameworks without class name conflicts.
        </p>
        <Button color="primary" mt="3">
          Bestax-Prefixed Button
        </Button>
      </Box>
    </ConfigProvider>
  );
}
```

This renders HTML with prefixed classes:

```html title="HTML markup from example above"
<div class="bestax-box">
  <h1 class="bestax-title">Bestax-Prefixed Components</h1>
  <button class="bestax-button bestax-is-primary">
    Bestax-Prefixed Button
  </button>
</div>
```

---

## Bulma-Prefixed (`bulma-`)

Same as Prefixed, but uses `bulma-` as the class prefix. Useful if you want a Bulma-branded prefix while still including bestax extras.

**Prefix:** `bulma-`\
**Import Statement:**

```js
import '@allxsmith/bestax-bulma/versions/bestax-bulma-prefixed.css';
```

**Usage:**

```tsx
import React from 'react';
import { ConfigProvider, Button, Box, Title } from '@allxsmith/bestax-bulma';
import '@allxsmith/bestax-bulma/versions/bestax-bulma-prefixed.css';

function App() {
  return (
    <ConfigProvider classPrefix="bulma-">
      <Box>
        <Title>Bulma-Prefixed Components</Title>
        <Button color="primary">Bulma-Prefixed Button</Button>
      </Box>
    </ConfigProvider>
  );
}
```

---

## No Helpers

Includes Bulma core components and bestax extras, but excludes Bulma helper classes (spacing, typography, color utilities, etc.).

**Prefix:** None\
**Import Statement:**

```js
import '@allxsmith/bestax-bulma/versions/bestax-no-helpers.css';
```

**Usage:**

```tsx
import React from 'react';
import { Button, Box, Title } from '@allxsmith/bestax-bulma';
import '@allxsmith/bestax-bulma/versions/bestax-no-helpers.css';

function App() {
  return (
    <Box>
      <Title>No Helpers</Title>
      <Button color="primary">Primary Button</Button>
      {/* Helper classes like 'has-text-centered', 'mt-4', etc. won't work */}
    </Box>
  );
}
```

:::warning
Without helper classes, you'll need to use custom CSS for spacing, text alignment, and other utilities that are normally provided by Bulma helpers.
:::

---

## No Helpers, Prefixed

Combines the no-helpers version with the `bestax-` class prefix. Smallest prefixed bundle.

**Prefix:** `bestax-`\
**Import Statement:**

```js
import '@allxsmith/bestax-bulma/versions/bestax-no-helpers-prefixed.css';
```

**Usage:**

```tsx
import React from 'react';
import { ConfigProvider, Button, Box, Title } from '@allxsmith/bestax-bulma';
import '@allxsmith/bestax-bulma/versions/bestax-no-helpers-prefixed.css';

function App() {
  return (
    <ConfigProvider classPrefix="bestax-">
      <Box>
        <Title>No Helpers, Prefixed</Title>
        <Button color="primary">Primary Button</Button>
      </Box>
    </ConfigProvider>
  );
}
```

---

## No Dark Mode

Includes everything except dark mode styles, resulting in a smaller file size. Only the light theme is applied.

**Prefix:** None\
**Import Statement:**

```js
import '@allxsmith/bestax-bulma/versions/bestax-no-dark-mode.css';
```

**Usage:**

```tsx
import React from 'react';
import { Button, Box, Title } from '@allxsmith/bestax-bulma';
import '@allxsmith/bestax-bulma/versions/bestax-no-dark-mode.css';

function App() {
  return (
    <Box>
      <Title>Light Mode Only</Title>
      <Button color="primary">Primary Button</Button>
      {/* Dark mode styles are not included */}
    </Box>
  );
}
```

:::info
This version is ideal for applications that only support light mode and want to minimize CSS bundle size.
:::

---

## Custom Brand (SCSS Only)

For teams that want a custom class prefix matching their brand or organization. This requires building from SCSS source.

**Prefix:** Custom (e.g., `mycompany-`)\
**Setup:**

1. **Install dependencies:**

   ```bash
   npm install bulma sass
   ```

2. **Create a custom SCSS file:**

   ```scss title="src/styles/mycompany-bestax.scss"
   @use 'bulma/sass' with (
     $class-prefix: 'mycompany-'
   );

   // Include bestax extras (Toast, Dialog, Carousel, Slider, Switch, etc.)
   @use '@allxsmith/bestax-bulma/scss';
   ```

3. **Import the custom SCSS file:**

   ```js title="src/index.js"
   import './styles/mycompany-bestax.scss';
   ```

**Usage:**

```tsx
import React from 'react';
import { ConfigProvider, Button, Box, Title } from '@allxsmith/bestax-bulma';
import './styles/mycompany-bestax.scss';

function App() {
  return (
    <ConfigProvider classPrefix="mycompany-">
      <Box>
        <Title>Custom Brand Prefix</Title>
        <Button color="primary">Branded Button</Button>
      </Box>
    </ConfigProvider>
  );
}
```

This approach allows you to:

- Use your own brand prefix across all Bulma and bestax classes
- Customize Bulma variables during the build process
- Maintain consistency with your design system naming conventions

---

## Choosing the Right Variation

| Use Case                                  | Recommended Variation                                   |
| ----------------------------------------- | ------------------------------------------------------- |
| **New project, full control**             | Complete (`bestax.css`)                                 |
| **Avoid class conflicts (bestax prefix)** | Prefixed (`bestax-prefixed.css`)                        |
| **Avoid class conflicts (bulma prefix)**  | Bulma-Prefixed (`bestax-bulma-prefixed.css`)            |
| **Custom styling, minimal CSS**           | No Helpers (`bestax-no-helpers.css`)                    |
| **Minimal CSS + prefixed**                | No Helpers, Prefixed (`bestax-no-helpers-prefixed.css`) |
| **Light mode only, smaller bundle**       | No Dark Mode (`bestax-no-dark-mode.css`)                |
| **Enterprise/branded applications**       | Custom Brand (custom SCSS build)                        |

---

## File Size Comparison

| Variation                 | Gzipped Size | Description                      |
| ------------------------- | ------------ | -------------------------------- |
| Complete                  | ~78KB        | Full-featured, recommended       |
| Prefixed (`bestax-`)      | ~80KB        | Full + `bestax-` class prefix    |
| Bulma-Prefixed (`bulma-`) | ~80KB        | Full + `bulma-` class prefix     |
| No Helpers                | ~63KB        | No helper utilities              |
| No Helpers, Prefixed      | ~64KB        | No helpers + `bestax-` prefix    |
| No Dark Mode              | ~66KB        | Light theme only                 |
| Custom Brand              | ~78KB        | Custom prefix, built from source |

:::tip
All sizes are approximate gzipped transfer sizes. Enable gzip compression on your server to achieve these transfer sizes.
:::

---

## Next Steps

- **Learn about configuration options**: [ConfigProvider](/docs/api/helpers/config)
- **Explore theming capabilities**: [Theme](/docs/api/helpers/theme)
- **Alternative icon libraries**: [Alternative Icons](/docs/guides/getting-started/alternative-icons)
- **Framework-specific setup**: [React Setups](/docs/guides/getting-started/react-setups)
- **Browse all components**: [API Documentation](/docs/category/elements)
