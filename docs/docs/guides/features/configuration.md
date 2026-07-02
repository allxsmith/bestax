---
title: Configuration
sidebar_label: Configuration
sidebar_position: 1
---

# Configuration

`ConfigProvider` is bestax-bulma's extension point for app-wide choices that Bulma itself can't express in React: a class-prefix namespace for the Bulma CSS classes your components emit, and a default icon library every `Icon` should fall back to. It works through React context, so any setting you provide applies to every descendant component — no prop drilling.

## Overview

`ConfigProvider` supports two settings today:

- **`classPrefix`** — prefix applied to every Bulma class name the library renders (pair it with the matching prefixed bestax CSS bundle, `@allxsmith/bestax-bulma/versions/bestax-prefixed.css`, for `classPrefix="bestax-"`).
- **`iconLibrary`** — the default icon library (`'fa'`, `'mdi'`, `'ion'`, `'material-icons'`, `'material-symbols'`) that `Icon` components resolve to when no `library` prop is set.

Both are optional; without a `ConfigProvider` the library uses unprefixed Bulma classes and Font Awesome icons.

## CSS Class Prefixing

Class prefixing adds a namespace to every Bulma class the library renders:

- `button` becomes `bestax-button`
- `box` becomes `bestax-box`
- `title` becomes `bestax-title`

The goal is to avoid collisions between Bulma's generic class names (`.button`, `.card`, `.title`, `.menu`, `.notification`, …) and the class names used by your own application's CSS. Teams that have their own hand-written stylesheets — design tokens, layout utilities, component classes — often already use some of those names; prefixing every Bulma class lets both sets coexist cleanly.

:::note Not for combining CSS frameworks
Class prefixing is about namespacing Bulma's class names, not about running bestax alongside another CSS framework like Bootstrap or Tailwind Preflight. Bulma's base-element rules (in `bulma/sass/base/minireset.scss` and `generic.scss`) target raw HTML tags — `body`, `p`, `h1`–`h6`, `ul`, `img`, `table`, … — and apply globally regardless of any class prefix. Stacking Bulma on top of another framework's reset is not a supported setup; pick one framework for the base layer.
:::

## Basic Usage

### Standard Configuration

```tsx
import { ConfigProvider, Button, Box, Title } from '@allxsmith/bestax-bulma';
import '@allxsmith/bestax-bulma/versions/bestax-prefixed.css';

function App() {
  return (
    <ConfigProvider classPrefix="bestax-">
      <Box p="4">
        <Title size="4">Prefixed Components</Title>
        <Button color="primary">Prefixed Button</Button>
      </Box>
    </ConfigProvider>
  );
}
```

This renders HTML with prefixed CSS classes:

```html
<div class="bestax-box p-4">
  <h4 class="bestax-title is-4">Prefixed Components</h4>
  <button class="bestax-button is-primary">Prefixed Button</button>
</div>
```

### Avoiding Conflicts With Your Own Stylesheets

If your application already ships its own CSS — a home-grown design system, marketing-page styles, vendored legacy stylesheets — odds are some of your selectors clash with Bulma's (`.button`, `.card`, `.title`, `.menu`, `.notification`, `.content`…). Prefixing every Bulma class keeps the two worlds distinct:

```tsx
import { ConfigProvider, Button, Box, Title } from '@allxsmith/bestax-bulma';
import '@allxsmith/bestax-bulma/versions/bestax-prefixed.css';
import './styles/app.css'; // your own CSS, free to define its own .button, .card, etc.

function App() {
  return (
    <ConfigProvider classPrefix="bestax-">
      {/* bestax renders .bestax-button, .bestax-box, etc.
          Your app's own .button / .card rules are untouched. */}
      <Box p="4">
        <Title size="4">App section</Title>
        <Button color="primary">Action</Button>
      </Box>
    </ConfigProvider>
  );
}
```

## Default Icon Library

Every `Icon` component can resolve to a different icon library — Font Awesome, Material Design Icons, Ionicons, Material Icons, or Material Symbols. Setting `iconLibrary` on `ConfigProvider` lets the whole tree default to one library; individual `Icon` components can still override per-use.

```tsx
import { ConfigProvider, Icon, Button } from '@allxsmith/bestax-bulma';
import '@mdi/font/css/materialdesignicons.min.css';

function App() {
  return (
    <ConfigProvider iconLibrary="mdi">
      <Button color="primary">
        <Icon name="rocket-launch" />
        <span>Launch</span>
      </Button>
    </ConfigProvider>
  );
}
```

Valid values are `'fa'` (Font Awesome), `'mdi'` (Material Design Icons), `'ion'` (Ionicons), `'material-icons'`, and `'material-symbols'`. This is the same choice `pnpm create bestax@latest` prompts for during project setup.

## Combining Prefix and Icon Library

Both settings are independent and compose. Set whichever you need:

```tsx
<ConfigProvider classPrefix="bestax-" iconLibrary="mdi">
  <App />
</ConfigProvider>
```

## Prefixed bestax CSS bundle

bestax ships a prebuilt, `bestax-`-prefixed bundle (Bulma **and** the bestax extras, all prefixed together) that pairs with `classPrefix="bestax-"`. Import it directly:

```tsx
// Prefixed bestax bundle (Bulma + extras, all "bestax-" prefixed)
import '@allxsmith/bestax-bulma/versions/bestax-prefixed.css';

function App() {
  return (
    <ConfigProvider classPrefix="bestax-">
      <Button color="primary">Uses bestax-button class</Button>
    </ConfigProvider>
  );
}
```

## Custom Prefix Builds

For teams building custom Bulma CSS with their own prefixes:

### 1. Install Dependencies

```bash
pnpm add bulma sass
```

### 2. Create Custom Sass File

```scss title="src/styles/mycompany-bulma.scss"
@use 'bulma/sass' with (
  $class-prefix: 'mycompany-'
);
```

### 3. Configure Your Application

```tsx title="src/App.tsx"
import { ConfigProvider, Button, Box } from '@allxsmith/bestax-bulma';
import './styles/mycompany-bulma.scss';

function App() {
  return (
    <ConfigProvider classPrefix="mycompany-">
      <Box>
        <Button color="primary">Custom Prefixed Button</Button>
      </Box>
    </ConfigProvider>
  );
}
```

## Advanced Configuration

### Nested Providers

ConfigProviders can be nested, with inner providers overriding outer settings:

```tsx
function NestedConfiguration() {
  return (
    <ConfigProvider classPrefix="outer-">
      <Box p="4">
        <Title>Outer Prefix (outer-)</Title>

        <ConfigProvider classPrefix="inner-">
          <Box p="4" mt="3">
            <Title>Inner Prefix (inner-)</Title>
            <Button color="primary">Inner Button</Button>
          </Box>
        </ConfigProvider>

        <Button color="info" mt="3">
          Outer Button
        </Button>
      </Box>
    </ConfigProvider>
  );
}
```

### Using Configuration in Custom Components

Your own components can participate in the same prefix/icon conventions as bestax's built-ins:

```tsx
import { usePrefixedClass } from '@allxsmith/bestax-bulma';

function CustomComponent() {
  const prefixed = usePrefixedClass();
  return <div className={prefixed('custom-component')}>Custom content</div>;
}
```

## Configuration Hooks

Four hooks expose the active configuration so your own components can honor the same settings as bestax's built-ins.

### useConfig

Returns the full configuration object:

```tsx
import { useConfig } from '@allxsmith/bestax-bulma';

function MyComponent() {
  const { classPrefix, iconLibrary } = useConfig();
  // ...
}
```

### useClassPrefix

Convenience hook that returns just the class prefix as a string (empty string if none):

```tsx
import { useClassPrefix } from '@allxsmith/bestax-bulma';

function MyComponent() {
  const classPrefix = useClassPrefix();
}
```

### usePrefixedClass

Returns a function that applies the configured prefix to a class name — handy when building custom components that need to stay in sync with a prefixed Bulma build:

```tsx
import { usePrefixedClass } from '@allxsmith/bestax-bulma';

function CustomBanner() {
  const prefixed = usePrefixedClass();
  // Renders "bestax-notification" under ConfigProvider classPrefix="bestax-",
  // or plain "notification" without a prefix.
  return <div className={prefixed('notification')}>Hello</div>;
}
```

### useIconLibrary

Returns the configured icon library (or `undefined`):

```tsx
import { useIconLibrary } from '@allxsmith/bestax-bulma';

function MyIcon({ name }) {
  const library = useIconLibrary() ?? 'fa';
  // Render an icon using the configured library
}
```

## Use Cases

### Multi-tenant Applications

Different tenants can have different styling namespaces:

```tsx
function TenantApp({ tenantName }) {
  return (
    <ConfigProvider classPrefix={`${tenantName}-`}>
      <App />
    </ConfigProvider>
  );
}
```

### Component Library Wrapping

When building your own component library on top of bestax, give its Bulma classes a distinct namespace so they can't clash with anything a consumer adds:

```tsx
function MyLibraryProvider({ children }) {
  return <ConfigProvider classPrefix="mylib-">{children}</ConfigProvider>;
}
```

## Best Practices

1. **Set at the root level** — apply `ConfigProvider` once near the top of your tree; nest only when a subtree genuinely needs different settings.
2. **Match CSS and React** — if you set `classPrefix="bestax-"`, import the matching prefixed bestax bundle `@allxsmith/bestax-bulma/versions/bestax-prefixed.css` (or your own Sass build with the same prefix). Using the bestax bundle — rather than stock `bulma/css/...` plus a separate `extras.css` — keeps the bestax extra components (Notification, Tooltip, etc.) prefixed too.
3. **Match icon font and setting** — if you set `iconLibrary="mdi"`, make sure the MDI font package is imported somewhere in your app.
4. **Trust one source** — the `create-bestax` installer wires all of this up in a consistent way; reach for a custom `ConfigProvider` only when the defaults don't fit.

## Integration with Other Features

ConfigProvider works seamlessly with other library features:

```tsx
function CompleteSetup() {
  return (
    <ConfigProvider classPrefix="bestax-">
      <Theme primaryH="270" primaryS="100%" primaryL="50%" isRoot>
        <App />
      </Theme>
    </ConfigProvider>
  );
}
```

For detailed API documentation and more examples, see the [ConfigProvider API reference](../../api/helpers/config.md).
