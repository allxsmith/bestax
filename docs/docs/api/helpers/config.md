---
title: ConfigProvider
sidebar_label: ConfigProvider
sidebar_position: 1
---

# ConfigProvider

## Overview

The `ConfigProvider` component provides a React context for configuring global settings across all Bulma UI components. Its `classPrefix` is applied automatically to **all Bulma CSS classes**, including both main component classes (like `button`, `box`, `title`) and helper/modifier classes (like `is-primary`, `has-text-centered`, `m-4`), allowing you to namespace Bulma classes to avoid conflicts with other CSS frameworks or customize the class naming convention.

---

## Import

```tsx
import { ConfigProvider, useConfig } from '@allxsmith/bestax-bulma';
```

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
        <code>classPrefix="bestax-"</code> to add the "bestax-" prefix to all
        component CSS classes. This is useful when integrating Bulma with other
        CSS frameworks or when you need to namespace Bulma classes to avoid
        conflicts.
      </p>

      <Notification color="info" mt="4">
        <strong>Tip:</strong> Open your browser's developer tools and inspect
        the DOM elements below. You'll see that all Bulma CSS classes have the
        "bestax-" prefix applied.
      </Notification>

      <ConfigProvider classPrefix="bestax-">
        <Box mt="4" p="4">
          {/* 
            This Box will have classes:
            - bestax-box (main class)
            - bestax-mt-4 (helper class)
            - bestax-p-4 (helper class)
          */}
          <Title size="4">Prefixed Components</Title>
          {/* 
            This Title will have classes:
            - bestax-title (main class)
            - bestax-is-4 (modifier class)
          */}
          <p>
            All components inside this ConfigProvider will have their CSS
            classes prefixed with "bestax-". This allows you to use Bulma
            alongside other CSS frameworks without class name conflicts.
          </p>
          <Button color="primary" mt="3" isRounded>
            {/* 
              This Button will have classes:
              - bestax-button (main class)
              - bestax-is-primary (modifier class)
              - bestax-is-rounded (modifier class)
              - bestax-mt-3 (helper class)
            */}
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

ConfigProviders can be nested. An inner provider replaces the outer one's settings rather than adding to them, so inside it any setting it leaves out is back to its default:

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

### Where Portaled Content Goes

`portalContainer` sets where portaled content goes when it has no target of its own. That covers a [`Portal`](./portal.md) with no `container`, and what the library's components portal, such as the panel `Popover` renders with `appendToBody`, a `Modal` or `Dialog` with `portal` set to `true`, a `Toast`, or a `Sidebar`. It takes an element or a `document.querySelector` selector. Unset, that content goes to `document.body`.

A target a component is given still wins, such as a `Modal`'s `portal` selector or a `Toast`'s `container`. And `portalContainer` only changes where portaled content goes: a component that renders in place, like a `Modal` without `portal` or a `Toast` with `inline`, still does.

`document.body` is outside any styles scoped to where the content was declared: a scoped `Theme`'s variables, or a shadow root's stylesheets. To keep them, render an element inside that area and make it the `portalContainer`, held in state from a ref callback. Below, the panel keeps the purple primary its `Theme` sets, which it would lose at the end of the page:

```tsx live
function ThemedOverlays() {
  const [overlays, setOverlays] = useState<HTMLElement | null>(null);

  return (
    <Theme primaryH="270" primaryS="100%" primaryL="50%">
      <ConfigProvider portalContainer={overlays ?? undefined}>
        <Popover
          appendToBody
          ariaLabel="Themed panel"
          trigger={<Button color="primary">Open</Button>}
        >
          <Popover.Body>
            <Button color="primary">Still purple</Button>
          </Popover.Body>
        </Popover>
      </ConfigProvider>
      <div ref={setOverlays} />
    </Theme>
  );
}
```

A selector can't find an element inside a shadow root, since `document.querySelector` doesn't look there, so in a shadow root pass the element itself, as above. Content that portals before the element is set goes to `document.body` and moves when it is, which remounts it and resets its state, as [`Portal`'s `container`](./portal.md#into-a-container) describes. A nested provider like this one needs the class prefix and icon library repeated if your app sets them (see [Nested ConfigProviders](#nested-configproviders)).

What gets portaled is `position: fixed`, so put the element where no ancestor has a `transform`, `filter`, `backdrop-filter`, `perspective`, `will-change: transform`, or a `contain` that includes `paint` or `layout`. Any of those becomes the containing block for the overlays and panels, which then cover or line up against that ancestor instead of the viewport. An ancestor that starts a stacking context, with a `z-index` or `isolation: isolate`, keeps them inside it, under anything the page stacks above it.

`NotificationContainer` portals its status region along with its notifications, so the `portalContainer` also decides where announcements come from. Keep it out of any `aria-hidden` ancestor, which takes the region out of the accessibility tree and silences them.

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
<ConfigProvider classPrefix="bestax-">
  <App />
</ConfigProvider>
```

This ensures all Bulma classes are prefixed with `bestax-`, preventing conflicts with other framework classes.

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

- The `classPrefix` is applied to **all Bulma classes**:
  - Main component classes (e.g., `button` → `bestax-button`, `box` → `bestax-box`)
  - Helper/modifier classes (e.g., `is-primary` → `bestax-is-primary`, `has-text-centered` → `bestax-has-text-centered`)
  - Spacing classes (e.g., `m-4` → `bestax-m-4`, `p-2` → `bestax-p-2`)
  - All other Bulma utility classes
- Changes to the `classPrefix` will affect all child components immediately
- If no `classPrefix` is provided, components use standard Bulma class names
- The ConfigProvider must wrap all components that should inherit the configuration

---

## TypeScript Support

Full TypeScript support is included:

```tsx
interface ConfigContextProps {
  classPrefix?: string;
  iconLibrary?: 'fa' | 'mdi' | 'ion' | 'material-icons' | 'material-symbols';
  portalContainer?: string | HTMLElement;
}

interface ConfigProviderProps {
  children: ReactNode;
  classPrefix?: string;
  iconLibrary?: 'fa' | 'mdi' | 'ion' | 'material-icons' | 'material-symbols';
  portalContainer?: string | HTMLElement;
}
```

---

## Props

| Prop              | Type                                                               | Description                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `children`        | `ReactNode`                                                        | The child components that will inherit the configuration settings.                                                                                                                                                                                                                                                                                                                               |
| `classPrefix`     | `string`                                                           | Optional prefix to add to all Bulma CSS classes. Useful for namespacing when integrating with other frameworks.                                                                                                                                                                                                                                                                                  |
| `iconLibrary`     | `'fa' \| 'mdi' \| 'ion' \| 'material-icons' \| 'material-symbols'` | Default icon library for all child components.                                                                                                                                                                                                                                                                                                                                                   |
| `portalContainer` | `string` \| `HTMLElement`                                          | Where portaled content goes when it has no target of its own: what a `Portal` without a `container` renders, and what the library's components portal, such as `Popover`'s `appendToBody` panel or a `Modal` with `portal`. An element, or a `document.querySelector` selector. Unset, or a selector that matches nothing, it goes to `document.body`. A target a component is given still wins. |
