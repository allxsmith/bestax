---
title: Installation
sidebar_label: Installation
sidebar_position: 1
---

# Installation

This comprehensive guide will walk you through installing and setting up bestax-bulma in your React project, including Bulma CSS, icon libraries, and everything you need to get started.

---

## Prerequisites

Before you begin, make sure your HTML document includes the required viewport meta tag for responsive design. Add this to your `index.html` file:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Your App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

This viewport meta tag is essential for Bulma's responsive features to work properly across different devices.

---

## Step 1: Install the Package

Install bestax-bulma using your preferred package manager:

```bash
npm install @allxsmith/bestax-bulma
```

or

```bash
yarn add @allxsmith/bestax-bulma
```

or

```bash
pnpm add @allxsmith/bestax-bulma
```

---

## Step 2: Install and Import Bulma CSS

You have two options for including Bulma CSS in your project:

### Option A: Install Bulma Package (Recommended)

First, install the Bulma package:

```bash
npm install bulma
```

Then import the CSS in your main JavaScript/TypeScript file (usually `src/index.js`, `src/index.ts`, or `src/main.tsx`):

```js
import 'bulma/css/bulma.min.css';
```

### Option B: Use CDN

Alternatively, you can include Bulma via CDN by adding this link tag to your HTML `<head>`:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/bulma@1.0.4/css/bulma.min.css"
/>
```

:::tip
We recommend Option A (installing the package) as it provides better build optimization, offline support, and version control.
:::

---

## Step 3: Install Icon Library (Optional but Recommended)

Many bestax-bulma components work beautifully with icons. We recommend Font Awesome:

### Install Font Awesome Free

```bash
npm install @fortawesome/fontawesome-free
```

### Import Font Awesome CSS

Add this import to your main JavaScript/TypeScript file:

```js
import '@fortawesome/fontawesome-free/css/all.min.css';
```

:::info
Font Awesome provides thousands of free icons that work seamlessly with bestax-bulma components like Button, Notification, and many others.
:::

---

## Step 4: Complete Example

Here's a complete example showing how to set up your main App component:

```jsx title="src/App.js" live
import React from 'react';
import { Button, Buttons, Box, Title, Icon } from '@allxsmith/bestax-bulma';

// Import Bulma CSS
import 'bulma/css/bulma.min.css';

// Import Font Awesome CSS
import '@fortawesome/fontawesome-free/css/all.min.css';

function App() {
  return (
    <Box mt="6">
      <Title size="2" className="has-text-centered">
        Welcome to bestax-bulma!
      </Title>

      <Buttons isCentered>
        <Button color="primary" size="large">
          <Icon name="fas fa-rocket" />
          <span>Get Started</span>
        </Button>

        <Button color="info" size="large" isOutlined>
          <Icon name="fas fa-book" />
          <span>Documentation</span>
        </Button>

        <Button color="success" size="large" isLight>
          <Icon name="fab fa-github" />
          <span>GitHub</span>
        </Button>
      </Buttons>
    </Box>
  );
}

export default App;
```

---

## Verification

After completing the installation, you should see a page with:

- A centered title "Welcome to bestax-bulma!"
- Three styled buttons with icons:
  - A primary "Get Started" button with a rocket icon
  - An outlined info "Documentation" button with a book icon
  - A light success "GitHub" button with a GitHub icon

If you see this layout with proper styling and icons, congratulations! You've successfully installed and configured bestax-bulma.

---

## Next Steps

Now that you have bestax-bulma installed and working:

1. **Explore Components**: Check out the [API documentation](/docs/category/elements) to see all available components
2. **Learn About Configuration**: Read about [ConfigProvider](/docs/api/helpers/config) for global configuration options
3. **Customize with Theming**: Discover [Theme](/docs/api/helpers/theme) for CSS variable-based customization
4. **Try Different Bulma Variations**: See [Bulma Variations](/docs/guides/getting-started/bulma-variations) for different Bulma CSS options
5. **Framework-Specific Setup**: Check [React Setups](/docs/guides/getting-started/react-setups) for detailed setup guides for Vite, Next.js, and other frameworks

---

## Troubleshooting

If you encounter any issues:

- Make sure the viewport meta tag is present in your HTML
- Verify that Bulma CSS is being imported before your custom styles
- Check that Font Awesome CSS is imported if you're using icons
- Ensure you're using React 16.8+ (hooks are required)
- See our [React Setups](/docs/guides/getting-started/react-setups) guide for framework-specific troubleshooting
