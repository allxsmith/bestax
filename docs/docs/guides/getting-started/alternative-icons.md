---
title: Alternative Icon Libraries
sidebar_label: Alternative Icons
sidebar_position: 3
---

# Alternative Icon Libraries

While Font Awesome is the most popular choice and the default for bestax-bulma, the library supports multiple icon libraries to suit different project needs and design preferences.

:::note Getting Started with Font Awesome
If you haven't set up Font Awesome yet, check out our [Installation Guide](/docs/guides/getting-started/installation) which covers installing Font Awesome as the default icon library for bestax-bulma.
:::

---

## Material Design Icons

Material Design Icons (MDI) is a comprehensive icon library that follows Google's Material Design guidelines.

**Install:**

```bash
npm install @mdi/font
```

**Import:**

```js
import '@mdi/font/css/materialdesignicons.min.css';
```

**Usage:**

```tsx live
import { Button, Icon } from '@allxsmith/bestax-bulma';

function MaterialIconExample() {
  return (
    <Button color="primary">
      <Icon library="mdi" name="home" />
      <span>Home</span>
    </Button>
  );
}
```

---

## Ionicons

Ionicons is a modern icon library with 1,300+ icons designed specifically for web, iOS, Android, and desktop apps. The library now uses web components for better performance and loading.

**Install:**

```bash
npm install ionicons@^8.0.13
```

**Import:**

:::info No CSS Import Needed

Ionicons v8 uses web components that are automatically loaded in your documentation examples.

:::

**Setup for Your Application:**

For your own application, you need to import the ionicons ES module. Add this to your main application file (e.g., `index.js`, `App.js`, or `main.tsx`):

```js
// Import ionicons as ES module - this will auto-register the web components
import 'ionicons/dist/ionicons/ionicons.esm.js';
```

**Alternative Setup (CDN):**

You can also load ionicons via CDN by adding these script tags to your HTML:

```html
<script
  type="module"
  src="https://unpkg.com/ionicons@8.0.13/dist/ionicons/ionicons.esm.js"
></script>
<script
  nomodule
  src="https://unpkg.com/ionicons@8.0.13/dist/ionicons/ionicons.js"
></script>
```

**Usage:**

```tsx live
import { Button, Icon } from '@allxsmith/bestax-bulma';

function IoniconExample() {
  return (
    <Button color="info">
      <Icon library="ion" name="settings" />
      <span>Settings</span>
    </Button>
  );
}
```

**Available Icon Variants:**

Ionicons v8 provides three variants for most icons:

```tsx live
import { Icon, Columns, Column, Block } from '@allxsmith/bestax-bulma';

function IoniconVariants() {
  return (
    <Columns isVCentered>
      <Column isNarrow textAlign="center">
        <Icon library="ion" name="heart" />
        <Block fontSize="small" mt={1}>
          Default
        </Block>
      </Column>
      <Column isNarrow textAlign="center">
        <Icon library="ion" name="heart-outline" />
        <Block fontSize="small" mt={1}>
          Outline
        </Block>
      </Column>
      <Column isNarrow textAlign="center">
        <Icon library="ion" name="heart-sharp" />
        <Block fontSize="small" mt={1}>
          Sharp
        </Block>
      </Column>
    </Columns>
  );
}
```

:::info Ionicons v8 Web Components
Ionicons v8 uses modern web components instead of CSS fonts. This provides:

- **Better performance**: Only loads icons that are actually used
- **Smaller bundle size**: No need to include entire font files
- **SVG-based rendering**: Crisp icons at any size
- **Automatic loading**: Icons load dynamically as needed

Web components are automatically registered in documentation examples, so no additional setup is required.
:::

:::tip Icon Naming Convention
Ionicons v8 simplified the naming convention:

- **Default (filled)**: `heart`, `settings`, `home`
- **Outline**: `heart-outline`, `settings-outline`, `home-outline`
- **Sharp**: `heart-sharp`, `settings-sharp`, `home-sharp`

The old iOS/MD prefixes (`ios-heart`, `md-heart`) are no longer used in v8.
:::

---

## Google Material Icons

Google's official Material Icons library provides the core set of Material Design icons.

**Install:**

```bash
npm install material-icons
```

**Import:**

```js
// Default import (includes all styles)
import 'material-icons';

// Or import the base CSS file
import 'material-icons/iconfont/material-icons.css';
```

**SASS Import:**

```scss
@import 'material-icons/iconfont/material-icons.scss';
```

**Selective Imports (for smaller bundle size):**

```js
// Import only specific styles you need
import 'material-icons/iconfont/filled.css'; // Default filled style
import 'material-icons/iconfont/outlined.css'; // Outlined style
import 'material-icons/iconfont/round.css'; // Round style
import 'material-icons/iconfont/sharp.css'; // Sharp style
import 'material-icons/iconfont/two-tone.css'; // Two-tone style
```

**Usage:**

```tsx live
import { Button, Icon } from '@allxsmith/bestax-bulma';

function GoogleMaterialIconExample() {
  return (
    <Button color="success">
      <Icon library="material-icons" name="home" />
      <span>Home</span>
    </Button>
  );
}
```

**Available Icon Styles:**

The Google Material Icons library includes different styles that can be used via `variant`:

```tsx live
import { Icon, Columns, Column } from '@allxsmith/bestax-bulma';

function MaterialIconStyles() {
  return (
    <Columns isVCentered>
      <Column isNarrow>
        <Icon library="material-icons" name="account_circle" color="danger" />
      </Column>
      <Column isNarrow>
        <Icon
          library="material-icons"
          name="account_circle"
          variant="outlined"
          color="danger"
        />
      </Column>
      <Column isNarrow>
        <Icon
          library="material-icons"
          name="account_circle"
          variant="round"
          color="danger"
        />
      </Column>
      <Column isNarrow>
        <Icon
          library="material-icons"
          name="account_circle"
          variant="sharp"
          color="danger"
        />
      </Column>
    </Columns>
  );
}
```

:::tip Icon Styles

- **Default (Filled)**: Standard filled icons (default, no `variant` needed)
- **Outlined**: `variant="outlined"`
- **Round**: `variant="round"`
- **Sharp**: `variant="sharp"`
  :::

:::info Documentation
For a complete list of available icons and detailed usage instructions, visit the [material-icons package documentation](https://www.npmjs.com/package/material-icons).
:::

---

## Material Symbols

The newest icon library from Google, offering more comprehensive icon coverage and modern design.

**Install:**

```bash
npm install material-symbols
```

**Import:**

```js
// Default import (includes all styles)
import 'material-symbols';
```

**SASS Import:**

```scss
@import 'material-symbols';
```

**Selective Imports (for smaller bundle size):**

```js
// Import only specific styles you need
import 'material-symbols/outlined.css'; // Outlined style (most common)
import 'material-symbols/rounded.css'; // Rounded style
import 'material-symbols/sharp.css'; // Sharp style
```

**Usage:**

```tsx live
import { Button, Icon } from '@allxsmith/bestax-bulma';

function MaterialSymbolExample() {
  return (
    <Button color="warning">
      <Icon library="material-symbols" name="home" />
      <span>Home</span>
    </Button>
  );
}
```

**Available Symbol Styles:**

Material Symbols come in three styles. The default import includes all styles, but you can import selectively:

```tsx live
import { Icon, Columns, Column } from '@allxsmith/bestax-bulma';

function MaterialSymbolStyles() {
  return (
    <>
      <Columns isVCentered>
        <Column size={2} textWeight="bold">
          Outlined:
        </Column>
        <Column isNarrow>
          <Icon
            library="material-symbols"
            name="delete"
            size="large"
            features="is-size-1"
          />
        </Column>
        <Column isNarrow>
          <Icon
            library="material-symbols"
            name="settings"
            size="large"
            features="is-size-1"
          />
        </Column>
        <Column isNarrow>
          <Icon
            library="material-symbols"
            name="grade"
            size="large"
            features="is-size-1"
          />
        </Column>
      </Columns>

      <Columns isVCentered>
        <Column size={2} textWeight="bold">
          Rounded:
        </Column>
        <Column isNarrow>
          <Icon
            library="material-symbols"
            name="delete"
            variant="rounded"
            size="large"
            features="is-size-1"
          />
        </Column>
        <Column isNarrow>
          <Icon
            library="material-symbols"
            name="settings"
            variant="rounded"
            size="large"
            features="is-size-1"
          />
        </Column>
        <Column isNarrow>
          <Icon
            library="material-symbols"
            name="grade"
            variant="rounded"
            size="large"
            features="is-size-1"
          />
        </Column>
      </Columns>

      <Columns isVCentered>
        <Column size={2} textWeight="bold">
          Sharp:
        </Column>
        <Column isNarrow>
          <Icon
            library="material-symbols"
            name="delete"
            variant="sharp"
            size="large"
            features="is-size-1"
          />
        </Column>
        <Column isNarrow>
          <Icon
            library="material-symbols"
            name="settings"
            variant="sharp"
            size="large"
            features="is-size-1"
          />
        </Column>
        <Column isNarrow>
          <Icon
            library="material-symbols"
            name="grade"
            variant="sharp"
            size="large"
            features="is-size-1"
          />
        </Column>
      </Columns>
    </>
  );
}
```

:::tip Symbol Styles

- **Outlined**: Default style (no `variant` needed)
- **Rounded**: `variant="rounded"`
- **Sharp**: `variant="sharp"`
  :::

:::info Material Symbols vs Material Icons
Material Symbols is Google's newer icon system with:

- More comprehensive icon coverage (2,500+ icons)
- Better optical sizing and variable font support
- Consistent design across all platforms
- Recommended for new projects

For a complete list of available symbols and detailed usage instructions, visit the [material-symbols package documentation](https://www.npmjs.com/package/material-symbols).
:::

---

## Choosing the Right Icon Library

| Library                   | Icons Count | File Size | Best For                        |
| ------------------------- | ----------- | --------- | ------------------------------- |
| **Font Awesome**          | 2,000+      | ~75KB     | General purpose, most popular   |
| **Material Design Icons** | 7,000+      | ~50KB     | Material Design projects        |
| **Ionicons v8**           | 1,300+      | Dynamic   | Modern web components, mobile   |
| **Google Material Icons** | 1,100+      | ~45KB     | Official Google Material Design |
| **Material Symbols**      | 2,500+      | ~55KB     | Modern Material Design projects |

---

## Icon Name References

- **Font Awesome**: [fontawesome.com/icons](https://fontawesome.com/icons)
- **Material Design Icons**: [materialdesignicons.com](https://materialdesignicons.com/)
- **Ionicons v8**: [ionicons.com](https://ionicons.com/) • [NPM Package](https://www.npmjs.com/package/ionicons)
- **Google Material Icons**: [fonts.google.com/icons](https://fonts.google.com/icons?icon.set=Material+Icons) • [NPM Package](https://www.npmjs.com/package/material-icons)
- **Material Symbols**: [fonts.google.com/icons](https://fonts.google.com/icons?icon.set=Material+Symbols) • [NPM Package](https://www.npmjs.com/package/material-symbols)

---

## Next Steps

- **Learn about Icon component props**: [Icon API](/docs/api/elements/icon)
- **Explore IconText component**: [IconText API](/docs/api/elements/icontext)
- **Browse Bulma variations**: [Bulma Variations](/docs/guides/getting-started/bulma-variations)
