---
title: Bulma Variations
sidebar_label: Bulma Variations
sidebar_position: 2
---

# Bulma Variations

Bulma offers several pre-built CSS variations to suit different project needs. This guide covers how to use each variation with bestax-bulma, including import statements and usage examples.

---

## Complete (Library + Helpers, Recommended)

This is the full Bulma CSS including all components, helpers, and utilities. **This is the recommended version for most projects.**

**Prefix:** None  
**Import Statement:**

```js
import 'bulma/css/bulma.min.css';
```

**Usage:**

```tsx live
import React from 'react';
import { Button, Box, Title } from '@allxsmith/bestax-bulma';
import 'bulma/css/bulma.min.css';

function App() {
  return (
    <Box>
      <Title>Complete Bulma</Title>
      <Button color="primary">Primary Button</Button>
    </Box>
  );
}
```

---

## Prefixed

This version prefixes all Bulma CSS classes with `bulma-` to avoid conflicts with other CSS frameworks.

**Prefix:** `bulma-`  
**Import Statement:**

```js
import 'bulma/css/versions/bulma-prefixed.min.css';
```

**Usage:**

```tsx live
import React from 'react';
import { ConfigProvider, Button, Box, Title } from '@allxsmith/bestax-bulma';
import 'bulma/css/versions/bulma-prefixed.min.css';

function App() {
  return (
    <ConfigProvider classPrefix="bulma-">
      <Box>
        <Title size={2}>Prefixed Bulma Components</Title>
        <p>
          All components inside this ConfigProvider will have their CSS classes
          prefixed with "bulma-". This allows you to use Bulma alongside other
          CSS frameworks without class name conflicts.
        </p>
        <Button color="primary" mt="3">
          Bulma-Prefixed Button
        </Button>
      </Box>
    </ConfigProvider>
  );
}
```

This renders HTML with prefixed classes:

```html title="Html Markup from example above"
<div class="bulma-box">
  <h1 class="bulma-title">Prefixed Bulma Components</h1>
  <p>
    All components inside this ConfigProvider will have their CSS classes
    prefixed with "bulma-". This allows you to use Bulma alongside other CSS
    frameworks without class name conflicts.
  </p>

  <button class="bulma-button bulma-is-primary">Bulma-Prefixed Button</button>
</div>
```

---

## Library Only (No Helpers)

This version includes only the core Bulma components without helper classes like spacing, typography, and color utilities.

**Prefix:** None  
**Import Statement:**

```js
import 'bulma/css/versions/bulma-no-helpers.min.css';
```

**Usage:**

```tsx
import React from 'react';
import { Button, Box, Title } from '@allxsmith/bestax-bulma';
import 'bulma/css/versions/bulma-no-helpers.min.css';

function App() {
  return (
    <Box>
      <Title>Library Only</Title>
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

Combines the library-only version with the `bulma-` prefix.

**Prefix:** `bulma-`  
**Import Statement:**

```js
import 'bulma/css/versions/bulma-no-helpers-prefixed.min.css';
```

**Usage:**

```tsx
import React from 'react';
import { ConfigProvider, Button, Box, Title } from '@allxsmith/bestax-bulma';
import 'bulma/css/versions/bulma-no-helpers-prefixed.min.css';

function App() {
  return (
    <ConfigProvider classPrefix="bulma-">
      <Box>
        <Title>No Helpers, Prefixed</Title>
        <Button color="primary">Primary Button</Button>
        {/* Both helper classes and prefixing are applied */}
      </Box>
    </ConfigProvider>
  );
}
```

---

## No Dark Mode (Light Mode Only)

This version excludes dark mode styles, resulting in a smaller file size if you don't need dark mode support.

**Prefix:** None  
**Import Statement:**

```js
import 'bulma/css/versions/bulma-no-dark-mode.min.css';
```

**Usage:**

```tsx
import React from 'react';
import { Button, Box, Title } from '@allxsmith/bestax-bulma';
import 'bulma/css/versions/bulma-no-dark-mode.min.css';

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

## Custom Brand (Custom Prefix)

For teams that want to build their own Bulma CSS with a custom prefix that matches their brand or organization.

**Prefix:** Custom (e.g., `mycompany-`)  
**Setup:**

1. **Install Bulma and Sass:**

   ```bash
   npm install bulma sass
   ```

2. **Create a custom Sass file:**

   ```scss title="src/styles/mycompany-bulma.scss"
   @use 'bulma/sass' with (
     $class-prefix: 'mycompany-'
   );
   ```

3. **Import the custom Sass file:**
   ```js title="src/index.js"
   import './styles/mycompany-bulma.scss';
   ```

**Usage:**

```tsx
import React from 'react';
import { ConfigProvider, Button, Box, Title } from '@allxsmith/bestax-bulma';
import './styles/mycompany-bulma.scss';

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

- Use your own brand prefix across all Bulma classes
- Customize Bulma variables during the build process
- Maintain consistency with your design system naming conventions

---

## Choosing the Right Variation

| Use Case                                  | Recommended Variation                     |
| ----------------------------------------- | ----------------------------------------- |
| **New project, full control**             | Complete (bulma.min.css)                  |
| **Integration with other CSS frameworks** | Prefixed (bulma-prefixed.min.css)         |
| **Custom styling, minimal Bulma**         | Library Only (bulma-no-helpers.min.css)   |
| **Light mode only, smaller bundle**       | No Dark Mode (bulma-no-dark-mode.min.css) |
| **Enterprise/branded applications**       | Custom Brand (custom Sass build)          |

---

## File Size Comparison

| Variation            | Gzipped Size | Use Case                    |
| -------------------- | ------------ | --------------------------- |
| Complete             | ~53KB        | Full-featured applications  |
| Prefixed             | ~54KB        | Multi-framework integration |
| No Helpers           | ~40KB        | No helpers, library only    |
| No Helpers, Prefixed | ~41KB        | No helpers, library only    |
| No Dark Mode         | ~52KB        | Light mode only             |
| Custom Brand         | ~53KB        | Branded applications        |

:::tip
All sizes are gzipped transfer sizes (what users actually download). Uncompressed file sizes are significantly larger. Enable gzip compression on your server to achieve these transfer sizes.
:::

---

## Next Steps

- **Learn about configuration options**: [ConfigProvider](/docs/api/helpers/config)
- **Explore theming capabilities**: [Theme](/docs/api/helpers/theme)
- **Alternative icon libraries**: [Alternative Icons](/docs/guides/getting-started/alternative-icons)
- **Framework-specific setup**: [React Setups](/docs/guides/getting-started/react-setups)
- **Browse all components**: [API Documentation](/docs/category/elements)
