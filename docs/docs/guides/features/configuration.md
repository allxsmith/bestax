---
title: Configuration
sidebar_label: Configuration
sidebar_position: 1
---

# Configuration

This React library provides powerful configuration capabilities through the `ConfigProvider` component, enabling global settings that affect all child components. The primary use case is CSS class prefixing for namespace management and framework integration.

## Overview

The `ConfigProvider` component uses React Context to provide configuration settings to all child components. Currently, it supports class prefixing, which allows you to namespace all Bulma CSS classes with a custom prefix.

:::tip Why Use Configuration?
Configuration is essential for maintaining organized, conflict-free CSS architecture in modern web applications. While not always necessary, it becomes crucial when integrating multiple CSS frameworks or when you need organized, namespaced CSS that follows your project's conventions.
:::

## CSS Class Prefixing

CSS class prefixing adds a namespace to all Bulma classes, transforming them from standard names to prefixed versions:

- `button` becomes `bulma-button`
- `box` becomes `bulma-box`
- `title` becomes `bulma-title`

This helps avoid conflicts with other CSS frameworks and provides better organization.

## Basic Usage

### Standard Configuration

```tsx
import { ConfigProvider, Button, Box, Title } from '@allxsmith/bestax-bulma';
import 'bulma/css/versions/bulma-prefixed.min.css';

function App() {
  return (
    <ConfigProvider classPrefix="bulma-">
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
<div class="bulma-box p-4">
  <h4 class="bulma-title is-4">Prefixed Components</h4>
  <button class="bulma-button is-primary">Prefixed Button</button>
</div>
```

### Framework Integration

When using multiple CSS frameworks, prefixing prevents class name conflicts:

```tsx
function MultiFrameworkApp() {
  return (
    <div>
      {/* Bootstrap section */}
      <div className="card p-4 mb-4">
        <h4 className="card-title">Bootstrap Components</h4>
        <button className="btn btn-primary">Bootstrap Button</button>
      </div>

      {/* Prefixed Bulma section */}
      <ConfigProvider classPrefix="bulma-">
        <Box p="4">
          <Title size="4">Bulma Components</Title>
          <Button color="primary">Bulma Button</Button>
        </Box>
      </ConfigProvider>
    </div>
  );
}
```

## Official Prefixed Bulma CSS

Bulma v1 provides official prefixed CSS files that you can use directly:

```tsx
// Using official prefixed Bulma CSS
import 'bulma/css/versions/bulma-prefixed.min.css';

function App() {
  return (
    <ConfigProvider classPrefix="bulma-">
      <Button color="primary">Uses bulma-button class</Button>
    </ConfigProvider>
  );
}
```

## Custom Prefix Builds

For teams building custom Bulma CSS with their own prefixes:

### 1. Install Dependencies

```bash
npm install bulma sass
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

Access configuration values in your own components:

```tsx
import { useConfig } from '@allxsmith/bestax-bulma';

function CustomComponent() {
  const { classPrefix } = useConfig();
  const className = classPrefix
    ? `${classPrefix}custom-component`
    : 'custom-component';

  return (
    <div className={className}>
      Custom component with prefix: {classPrefix || 'none'}
    </div>
  );
}
```

## Configuration Hooks

The library provides hooks for accessing configuration:

### useConfig

Returns the complete configuration context:

```tsx
import { useConfig } from '@allxsmith/bestax-bulma';

function MyComponent() {
  const { classPrefix } = useConfig();
  // Use configuration values
}
```

### useClassPrefix

Convenience hook that returns just the class prefix:

```tsx
import { useClassPrefix } from '@allxsmith/bestax-bulma';

function MyComponent() {
  const classPrefix = useClassPrefix(); // Returns prefix or empty string
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

When creating your own component library that wraps Bulma:

```tsx
function MyLibraryProvider({ children }) {
  return <ConfigProvider classPrefix="mylib-">{children}</ConfigProvider>;
}
```

### Legacy System Integration

When integrating with existing systems that have their own CSS:

```tsx
function LegacyIntegration() {
  return (
    <ConfigProvider classPrefix="bulma-">
      <ModernBulmaUI />
    </ConfigProvider>
  );
}
```

## Best Practices

1. **Set at the root level**: Apply ConfigProvider at the highest level of your component tree for consistency
2. **Use consistent prefixes**: Choose a prefix and stick with it throughout your application
3. **Match CSS and React**: Ensure your CSS prefix matches your ConfigProvider prefix
4. **Document your choice**: Make sure your team understands why and how you're using prefixes

## Integration with Other Features

ConfigProvider works seamlessly with other library features:

```tsx
function CompleteSetup() {
  return (
    <ConfigProvider classPrefix="bulma-">
      <Theme primaryH="270" primaryS="100%" primaryL="50%" isRoot>
        <App />
      </Theme>
    </ConfigProvider>
  );
}
```

For detailed API documentation and more examples, see the [ConfigProvider API reference](../../api/helpers/config.md).
