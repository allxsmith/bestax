---
title: Sidebar
sidebar_label: Sidebar
---

# Sidebar

## Overview

The `Sidebar` component provides a slide-out navigation panel that appears from the left or right side of the screen. It's ideal for mobile navigation, settings panels, or any content that should overlay the main interface.

:::info
The Sidebar component requires importing the extras CSS. See the [Extras Setup Guide](../../guides/getting-started/using-extras.md) for installation instructions.
:::

---

## Import

```tsx
import { Sidebar } from '@allxsmith/bestax-bulma';

// Also import the extras CSS
import '@allxsmith/bestax-bulma/dist/extras.css';
```

---

## Props

| Prop           | Type                                     | Default   | Description                                      |
| -------------- | ---------------------------------------- | --------- | ------------------------------------------------ |
| `isOpen`       | `boolean`                                | —         | Whether the sidebar is open (required).          |
| `onClose`      | `() => void`                             | —         | Callback when sidebar should close.              |
| `position`     | `'left'` \| `'right'`                    | `'left'`  | Which side the sidebar appears from.             |
| `width`        | `string`                                 | `'260px'` | Custom width of the sidebar.                     |
| `fullWidth`    | `boolean`                                | `false`   | Sidebar takes full width (mobile-style).         |
| `overlay`      | `boolean`                                | `true`    | Show overlay behind sidebar.                     |
| `overlayClose` | `boolean`                                | `true`    | Close sidebar when overlay is clicked.           |
| `escapeClose`  | `boolean`                                | `true`    | Close sidebar on Escape key.                     |
| `canCancel`    | `boolean`                                | `true`    | Allow closing the sidebar.                       |
| `children`     | `React.ReactNode`                        | —         | Content to display in the sidebar.               |
| `className`    | `string`                                 | —         | Additional CSS classes.                          |
| `ref`          | `React.Ref<HTMLElement>`                 | —         | Ref forwarded to the sidebar element.            |
| ...            | All standard HTML and Bulma helper props |           | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Basic Sidebar

A simple sidebar with navigation menu.

```tsx live
function example() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <Button color="primary" onClick={() => setIsOpen(true)}>
        Open Sidebar
      </Button>
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="p-4">
          <Title size="5">Navigation</Title>
          <Menu>
            <Menu.List title="General">
              <Menu.Item>Dashboard</Menu.Item>
              <Menu.Item isActive>Settings</Menu.Item>
              <Menu.Item>Profile</Menu.Item>
            </Menu.List>
            <Menu.List title="Administration">
              <Menu.Item>Users</Menu.Item>
              <Menu.Item>Permissions</Menu.Item>
            </Menu.List>
          </Menu>
        </div>
      </Sidebar>
    </div>
  );
}
```

---

### Right-side Sidebar

Sidebar that slides in from the right.

```tsx live
function example() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Right Sidebar</Button>
      <Sidebar
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        position="right"
      >
        <div className="p-4">
          <Title size="5">Settings</Title>
          <p>Panel content here...</p>
        </div>
      </Sidebar>
    </div>
  );
}
```

---

### Custom Width

Sidebar with custom width.

```tsx live
function example() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Wide Sidebar</Button>
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} width="400px">
        <div className="p-4">
          <Title size="5">Wide Panel</Title>
          <p>This sidebar is 400px wide.</p>
        </div>
      </Sidebar>
    </div>
  );
}
```

---

### Full Width (Mobile Style)

Full-width sidebar for mobile navigation.

```tsx live
function example() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Full Width</Button>
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} fullWidth>
        <div className="p-4">
          <div className="is-flex is-justify-content-space-between is-align-items-center mb-4">
            <Title size="4" mb="0">
              Menu
            </Title>
            <Delete onClick={() => setIsOpen(false)} />
          </div>
          <Menu>
            <Menu.List>
              <Menu.Item>Home</Menu.Item>
              <Menu.Item>Products</Menu.Item>
              <Menu.Item>About</Menu.Item>
              <Menu.Item>Contact</Menu.Item>
            </Menu.List>
          </Menu>
        </div>
      </Sidebar>
    </div>
  );
}
```

---

### Without Overlay

Sidebar without the background overlay.

```tsx live
function example() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Without Overlay</Button>
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} overlay={false}>
        <div className="p-4">
          <Title size="5">No Overlay</Title>
          <p>The background is not dimmed.</p>
          <Button onClick={() => setIsOpen(false)} className="mt-4">
            Close
          </Button>
        </div>
      </Sidebar>
    </div>
  );
}
```

---

### Non-cancelable Sidebar

Sidebar that cannot be dismissed by overlay click or escape key.

```tsx live
function example() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <Button color="warning" onClick={() => setIsOpen(true)}>
        Open Important Panel
      </Button>
      <Sidebar isOpen={isOpen} canCancel={false}>
        <div className="p-4">
          <Title size="5">Important Action</Title>
          <p>You must complete this action before closing.</p>
          <Button
            color="primary"
            onClick={() => setIsOpen(false)}
            className="mt-4"
          >
            Complete & Close
          </Button>
        </div>
      </Sidebar>
    </div>
  );
}
```

---

## Close Methods

When `canCancel` is true, the sidebar can be closed by:

1. **Clicking the overlay** - When `overlayClose` is true
2. **Pressing Escape key** - When `escapeClose` is true
3. **Calling `onClose`** - From a button or other action

---

## Accessibility

- Uses `role="dialog"` for proper screen reader announcement
- Has `aria-modal="true"` when overlay is shown
- Focus is trapped within the sidebar when open
- Escape key closes the sidebar by default
- Body scroll is prevented when sidebar is open

---

## Related Components

- [Modal](./modal.md) - For centered modal dialogs
- [Menu](./menu.md) - For navigation menus inside sidebar

---

## Additional Resources

- [Storybook: Sidebar Stories](https://bestax.io/storybook/?path=/story/components-sidebar)

:::tip Pro Tip
Use the Sidebar with a Menu component for building navigation drawers in mobile-responsive layouts.
:::
