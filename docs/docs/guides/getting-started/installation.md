---
title: Installation
sidebar_label: Installation
sidebar_position: 1
---

# Installation Guide

This comprehensive guide covers all installation options, prerequisites, and configuration choices for bestax-bulma.

:::tip Quick Setup
Need to get started quickly? Check out our [Quick Start guide](/docs/guides/intro) for a 2-minute setup, or jump to [Toolchains](/docs/guides/getting-started/react-setups) for specific toolchain instructions.
:::

:::info Already Configured?
If you've already installed everything and want to start building, explore our [Component Documentation](/docs/category/elements) to see live examples, props, and usage patterns for all bestax-bulma components.
:::

---

## Prerequisites

### System Requirements

- **Node.js**: 16.0.0 or higher
- **npm**: 7.0.0 or higher (or yarn/pnpm)
- **React**: 16.8.0 or higher (requires hooks support)

### HTML Setup

Ensure your HTML document includes the viewport meta tag for responsive design:

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

:::warning Important
The viewport meta tag is **essential** for Bulma's responsive features. Without it, mobile layouts won't work correctly.
:::

---

## Package Installation

### Using npm (recommended)

```bash
npm install @allxsmith/bestax-bulma
```

### Using yarn

```bash
yarn add @allxsmith/bestax-bulma
```

### Using pnpm

```bash
pnpm add @allxsmith/bestax-bulma
```

### Version Management

To install a specific version:

```bash
npm install @allxsmith/bestax-bulma@2.0.1
```

To see available versions:

```bash
npm view @allxsmith/bestax-bulma versions
```

---

## Bulma CSS Setup

bestax-bulma requires Bulma CSS for styling. Choose one of these methods:

### Method 1: NPM Package (Recommended)

**Pros**: Version control, offline access, build optimizations, tree shaking
**Cons**: Slightly larger initial setup

```bash
npm install bulma
```

Then import in your main file:

```js
import 'bulma/css/bulma.min.css';
```

### Method 2: CDN

**Pros**: Quick setup, no build step required, always latest version
**Cons**: Requires internet connection, no tree shaking

Add to your HTML `<head>`:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/bulma@1.0.4/css/bulma.min.css"
/>
```

### Method 3: Custom Bulma Build

**Pros**: Smallest bundle size, full customization
**Cons**: More complex setup

1. Install Bulma and Sass:

```bash
npm install bulma sass
```

2. Create a custom SCSS file:

```scss
// custom-bulma.scss
@import 'bulma/sass/utilities/initial-variables';

// Customize variables
$primary: #00d1b2;
$link: #3273dc;

// Import only what you need
@import 'bulma/sass/base/_all';
@import 'bulma/sass/elements/button';
@import 'bulma/sass/elements/box';
// ... add other components as needed
```

3. Import your custom build:

```js
import './custom-bulma.scss';
```

---

## Icon Libraries

bestax-bulma components support multiple icon libraries. Icons are optional but enhance the user experience.

### Font Awesome (Most Popular)

```bash
npm install @fortawesome/fontawesome-free
```

Import in your main file:

```js
import '@fortawesome/fontawesome-free/css/all.min.css';
```

Usage: `<Icon name="user" />` or `<Icon name="github" variant="brands" />`

### Material Design Icons

```bash
npm install @mdi/font
```

```js
import '@mdi/font/css/materialdesignicons.min.css';
```

Usage: `<Icon name="account" library="mdi" />`

### Material Icons (Google)

```bash
npm install material-icons
```

```js
import 'material-icons/iconfont/material-icons.css';
```

Usage: `<Icon name="person" library="material" />`

### Ionicons

```bash
npm install ionicons
```

```js
import 'ionicons/dist/css/ionicons.min.css';
```

Usage: `<Icon name="person" library="ion" />`

### Using Multiple Icon Libraries

You can use multiple libraries simultaneously:

```js
// Import all icon libraries
import '@fortawesome/fontawesome-free/css/all.min.css';
import '@mdi/font/css/materialdesignicons.min.css';
import 'material-icons/iconfont/material-icons.css';

// Use different libraries
<Icon name="user" />                    // Font Awesome (default)
<Icon name="account" library="mdi" />   // Material Design Icons
<Icon name="person" library="material" />  // Material Icons
```

---

## CSS Import Order

The order of CSS imports matters for proper styling precedence:

```js
// 1. First: Bulma CSS
import 'bulma/css/bulma.min.css';

// 2. Second: Icon libraries (if using)
import '@fortawesome/fontawesome-free/css/all.min.css';

// 3. Third: Any theme or override CSS
import './theme.css';

// 4. Last: Your custom styles
import './App.css';
```

:::caution Style Conflicts
If Bulma styles are being overridden unexpectedly, check your CSS import order. Bulma should be imported before your custom styles.
:::

---

## TypeScript Setup

bestax-bulma includes TypeScript definitions. For the best experience:

### Install Type Definitions

```bash
npm install -D typescript @types/react @types/react-dom
```

### TypeScript Configuration

Recommended `tsconfig.json` settings:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## Bundle Size Optimization

### Tree Shaking

bestax-bulma supports tree shaking. Always use named imports:

```js
// ✅ Good - Only imports what you need
import { Button, Box, Title } from '@allxsmith/bestax-bulma';

// ❌ Bad - Imports entire library
import * as Bulma from '@allxsmith/bestax-bulma';
```

### Analyzing Bundle Size

To analyze your bundle:

1. Install bundle analyzer:

```bash
npm install -D webpack-bundle-analyzer
```

2. Check what's included:

```bash
npx webpack-bundle-analyzer stats.json
```

### Expected Sizes

- **bestax-bulma**: ~21KB (gzipped)
- **Bulma CSS**: ~30KB (gzipped)
- **With PurgeCSS**: Can reduce Bulma CSS further

---

## Environment-Specific Setup

### Development

For development, use unminified versions for better debugging:

```js
if (process.env.NODE_ENV === 'development') {
  import('bulma/css/bulma.css'); // Unminified
} else {
  import('bulma/css/bulma.min.css'); // Minified
}
```

### Production

For production builds:

1. Use minified CSS
2. Enable CSS purging (remove unused styles)
3. Consider CDN for better caching

### Testing

For testing environments:

```js
// jest.setup.js
import '@testing-library/jest-dom';

// Mock CSS imports
jest.mock('bulma/css/bulma.min.css', () => ({}));
```

---

## Verification

After installation, verify everything is working:

### 1. Check Package Installation

```bash
npm list @allxsmith/bestax-bulma
```

### 2. Check Import Resolution

Your IDE should autocomplete:

```js
import { Button } from '@allxsmith/bestax-bulma';
```

### 3. Check Styling

Components should have Bulma styling applied. If components appear unstyled:

- Verify Bulma CSS is imported
- Check browser console for 404 errors
- Ensure CSS import order is correct

### 4. Check Icons (if using)

Icons should render correctly. If you see placeholder text instead of icons:

- Verify icon library CSS is imported
- Check the icon name matches the library's naming convention

---

## Troubleshooting

### Common Issues

**Components are unstyled**

- Solution: Ensure Bulma CSS is imported in your main file

**Icons not showing**

- Solution: Import the icon library CSS and verify icon names

**TypeScript errors**

- Solution: Install `@types/react` and `@types/react-dom`

**Large bundle size**

- Solution: Use named imports and consider CSS purging

**Mobile layout broken**

- Solution: Add viewport meta tag to your HTML

### Getting Help

- Check our [Toolchains guide](/docs/guides/getting-started/react-setups) for toolchain-specific issues
- View [example projects](https://github.com/allxsmith/bestax/tree/main/examples)
- Open an [issue on GitHub](https://github.com/allxsmith/bestax/issues)

---

## Next Steps

Now that you understand the installation options:

1. **Choose your toolchain** → [Toolchains Guide](/docs/guides/getting-started/react-setups)
2. **Explore components** → [Component Documentation](/docs/category/elements)
3. **Customize styling** → [Theming Guide](/docs/api/helpers/theme)
4. **Configure globally** → [Config Provider](/docs/api/helpers/config)
