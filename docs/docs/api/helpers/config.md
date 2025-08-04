---
title: ConfigProvider
sidebar_label: ConfigProvider
sidebar_position: 1
---

# ConfigProvider

## Overview

The `ConfigProvider` component provides a React context for configuring global settings across all Bulma UI components. Currently, it supports setting a `classPrefix` that will be automatically applied to all Bulma CSS classes, allowing you to namespace Bulma classes to avoid conflicts with other CSS frameworks or customize the class naming convention.

---

## Import

```tsx
import { ConfigProvider, useConfig } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop          | Type        | Description                                                                                                     |
| ------------- | ----------- | --------------------------------------------------------------------------------------------------------------- |
| `children`    | `ReactNode` | The child components that will inherit the configuration settings.                                              |
| `classPrefix` | `string`    | Optional prefix to add to all Bulma CSS classes. Useful for namespacing when integrating with other frameworks. |

---

## Hooks

### useConfig

Returns the current configuration context values.

```tsx
const { classPrefix } = useConfig();
```

### useClassPrefix

Convenience hook that returns just the classPrefix string (or empty string if not set).

```tsx
const classPrefix = useClassPrefix();
```

---

## Usage Examples

### Basic Usage with Class Prefix

Use `ConfigProvider` to add a prefix to all Bulma CSS classes within its scope:

```tsx
import {
  ConfigProvider,
  Box,
  Title,
  Button,
  Notification,
} from '@allxsmith/bestax-bulma';

function App() {
  return (
    <div>
      <Title size="3">Prefixed Bulma Components</Title>
      <p>
        This demonstrates using ConfigProvider with{' '}
        <code>classPrefix="bulma-"</code> to add the "bulma-" prefix to all
        component CSS classes. This is useful when integrating Bulma with other
        CSS frameworks or when you need to namespace Bulma classes to avoid
        conflicts.
      </p>

      <Notification color="info" mt="4">
        <strong>Tip:</strong> Open your browser's developer tools and inspect
        the DOM elements below. You'll see that all Bulma CSS classes have the
        "bulma-" prefix applied (e.g., "bulma-box", "bulma-title",
        "bulma-button", "bulma-notification").
      </Notification>

      <ConfigProvider classPrefix="bulma-">
        <Box mt="4" p="4">
          <Title size="4">Prefixed Components</Title>
          <p>
            All components inside this ConfigProvider will have their CSS
            classes prefixed with "bulma-". This allows you to use Bulma
            alongside other CSS frameworks without class name conflicts.
          </p>
          <Button color="primary" mt="3">
            Bulma-Prefixed Button
          </Button>
        </Box>
      </ConfigProvider>

      <Box mt="4" p="4">
        <Title size="4">Standard Components (No Prefix)</Title>
        <p>
          Components outside the ConfigProvider use standard Bulma classes
          without any prefix.
        </p>
        <Button color="info">Standard Button</Button>
      </Box>
    </div>
  );
}
```

### Nested ConfigProviders

ConfigProviders can be nested, with inner providers overriding outer settings:

```tsx
function NestedExample() {
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

Access the configuration in your own components using the `useConfig` hook:

```tsx
import { useConfig } from '@allxsmith/bestax-bulma';

function CustomComponent() {
  const { classPrefix } = useConfig();
  const className = classPrefix
    ? `${classPrefix}custom-component`
    : 'custom-component';

  return (
    <div className={className}>
      My custom component with prefix: {classPrefix || 'none'}
    </div>
  );
}
```

---

## Use Cases

### Framework Integration

When integrating Bulma with other CSS frameworks like Bootstrap or Tailwind CSS:

```tsx
<ConfigProvider classPrefix="bulma-">
  <App />
</ConfigProvider>
```

This ensures all Bulma classes are prefixed with `bulma-`, preventing conflicts with other framework classes.

### Multi-tenant Applications

For applications that need to support different styling themes or brands:

```tsx
<ConfigProvider classPrefix={`${tenantName}-`}>
  <TenantApp />
</ConfigProvider>
```

### Component Library Wrapping

When wrapping Bulma UI components in your own component library:

```tsx
<ConfigProvider classPrefix="mylib-">
  <MyComponentLibrary />
</ConfigProvider>
```

---

## Notes

- The `classPrefix` is applied to the main Bulma class of each component (e.g., `button`, `box`, `title`)
- Helper classes and modifiers (e.g., `is-primary`, `has-text-centered`) are not prefixed
- Changes to the `classPrefix` will affect all child components immediately
- If no `classPrefix` is provided, components use standard Bulma class names
- The ConfigProvider must wrap all components that should inherit the configuration

---

## TypeScript Support

Full TypeScript support is included:

```tsx
interface ConfigContextProps {
  classPrefix?: string;
}

interface ConfigProviderProps {
  children: ReactNode;
  classPrefix?: string;
}
```
