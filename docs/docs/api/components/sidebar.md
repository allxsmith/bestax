---
title: Sidebar
sidebar_label: Sidebar
---

# Sidebar

## Overview

The `Sidebar` component provides a slide-out navigation panel that appears from the left or right side of the screen. It's ideal for mobile navigation, settings panels, or any content that should overlay the main interface.

---

## Import

```tsx
import { Sidebar } from '@allxsmith/bestax-bulma';
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
| `inline`       | `boolean`                                | `false`   | Renders inline instead of using a portal.        |
| `children`     | `React.ReactNode`                        | —         | Content to display in the sidebar.               |
| `className`    | `string`                                 | —         | Additional CSS classes.                          |
| `ref`          | `React.Ref<HTMLElement>`                 | —         | Ref forwarded to the sidebar element.            |
| ...            | All standard HTML and Bulma helper props |           | (See [Helper Props](../helpers/usebulmaclasses)) |

### Sidebar.Header

Container for the sidebar header. Accepts all standard `<div>` HTML attributes.

### Sidebar.Title

Title text inside the header. Accepts all standard `<p>` HTML attributes.

### Sidebar.Close

Close button for the sidebar. Accepts all standard `<button>` HTML attributes.

### Sidebar.Body

Main content area of the sidebar. Accepts all standard `<div>` HTML attributes.

### Sidebar.Footer

Footer area of the sidebar. Accepts all standard `<div>` HTML attributes.

---

## Usage

:::info
The examples below use the `inline` prop so the sidebar renders inside the live preview. In real apps, omit `inline` so the sidebar uses a portal (rendered at document.body) for proper stacking above all page content.
:::

### Basic Sidebar

A simple sidebar with navigation menu. Compose the sidebar with `Sidebar.Header`, `Sidebar.Title`, `Sidebar.Close`, and `Sidebar.Body` subcomponents.

```tsx live
function example() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button color="primary" onClick={() => setIsOpen(true)}>
        Open Sidebar
      </Button>
      <Sidebar inline isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <Sidebar.Header>
          <Sidebar.Title>Navigation</Sidebar.Title>
          <Sidebar.Close onClick={() => setIsOpen(false)} />
        </Sidebar.Header>
        <Sidebar.Body>
          <Menu>
            <Menu.Label>General</Menu.Label>
            <Menu.List>
              <Menu.Item href="#">Dashboard</Menu.Item>
              <Menu.Item active href="#">
                Settings
              </Menu.Item>
              <Menu.Item href="#">Profile</Menu.Item>
            </Menu.List>
            <Menu.Label>Administration</Menu.Label>
            <Menu.List>
              <Menu.Item href="#">Users</Menu.Item>
              <Menu.Item href="#">Permissions</Menu.Item>
            </Menu.List>
          </Menu>
        </Sidebar.Body>
      </Sidebar>
    </>
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
    <>
      <Button color="info" onClick={() => setIsOpen(true)}>
        Open Right Sidebar
      </Button>
      <Sidebar
        inline
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        position="right"
      >
        <Sidebar.Header>
          <Sidebar.Title>Settings</Sidebar.Title>
          <Sidebar.Close onClick={() => setIsOpen(false)} />
        </Sidebar.Header>
        <Sidebar.Body>
          <Paragraph>Configure your preferences here.</Paragraph>
        </Sidebar.Body>
      </Sidebar>
    </>
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
    <>
      <Button color="success" onClick={() => setIsOpen(true)}>
        Open Wide Sidebar
      </Button>
      <Sidebar
        inline
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        width="400px"
      >
        <Sidebar.Header>
          <Sidebar.Title>Wide Panel</Sidebar.Title>
          <Sidebar.Close onClick={() => setIsOpen(false)} />
        </Sidebar.Header>
        <Sidebar.Body>
          <Paragraph>This sidebar has a custom width of 400px.</Paragraph>
        </Sidebar.Body>
      </Sidebar>
    </>
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
    <>
      <Button color="warning" onClick={() => setIsOpen(true)}>
        Open Full Width
      </Button>
      <Sidebar
        inline
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        fullWidth
      >
        <Sidebar.Header>
          <Sidebar.Title>Full Width Panel</Sidebar.Title>
          <Sidebar.Close onClick={() => setIsOpen(false)} />
        </Sidebar.Header>
        <Sidebar.Body>
          <Menu>
            <Menu.List>
              <Menu.Item href="#">Home</Menu.Item>
              <Menu.Item href="#">Products</Menu.Item>
              <Menu.Item href="#">About</Menu.Item>
              <Menu.Item href="#">Contact</Menu.Item>
            </Menu.List>
          </Menu>
        </Sidebar.Body>
      </Sidebar>
    </>
  );
}
```

---

### Without Overlay

Sidebar without the background overlay.

:::caution
When `overlay={false}`, there's no backdrop to click for dismissal. Always provide an explicit Close action inside the sidebar (or rely on the Escape key) so users can close it.
:::

```tsx live
function example() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button color="link" onClick={() => setIsOpen(true)}>
        Open Without Overlay
      </Button>
      <Paragraph mt="4">
        You can still interact with the page content when the sidebar is open.
      </Paragraph>
      <Sidebar
        inline
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        overlay={false}
      >
        <Sidebar.Header>
          <Sidebar.Title>No Overlay</Sidebar.Title>
          <Sidebar.Close onClick={() => setIsOpen(false)} />
        </Sidebar.Header>
        <Sidebar.Body>
          <Menu>
            <Menu.List>
              <Menu.Item href="#">Home</Menu.Item>
              <Menu.Item href="#">About</Menu.Item>
              <Menu.Item href="#">Contact</Menu.Item>
            </Menu.List>
          </Menu>
          <Button color="primary" mt="4" onClick={() => setIsOpen(false)}>
            Close Sidebar
          </Button>
        </Sidebar.Body>
      </Sidebar>
    </>
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
    <>
      <Button color="danger" onClick={() => setIsOpen(true)}>
        Open Important Panel
      </Button>
      <Sidebar
        inline
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        overlayClose={false}
        escapeClose={false}
        canCancel={false}
      >
        <Sidebar.Header>
          <Sidebar.Title>Important Action</Sidebar.Title>
        </Sidebar.Header>
        <Sidebar.Body>
          <Paragraph>You must complete this action before closing.</Paragraph>
          <Button color="primary" onClick={() => setIsOpen(false)} mt="4">
            Complete & Close
          </Button>
        </Sidebar.Body>
      </Sidebar>
    </>
  );
}
```

---

### Sidebar with Footer

Use `Sidebar.Footer` for actions or metadata pinned to the bottom of the sidebar.

```tsx live
function example() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button color="primary" onClick={() => setIsOpen(true)}>
        Open With Footer
      </Button>
      <Sidebar inline isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <Sidebar.Header>
          <Sidebar.Title>Navigation</Sidebar.Title>
          <Sidebar.Close onClick={() => setIsOpen(false)} />
        </Sidebar.Header>
        <Sidebar.Body>
          <Menu>
            <Menu.Label>Pages</Menu.Label>
            <Menu.List>
              <Menu.Item active href="#">
                Home
              </Menu.Item>
              <Menu.Item href="#">Products</Menu.Item>
              <Menu.Item href="#">Services</Menu.Item>
              <Menu.Item href="#">Blog</Menu.Item>
              <Menu.Item href="#">Contact</Menu.Item>
            </Menu.List>
          </Menu>
        </Sidebar.Body>
        <Sidebar.Footer>
          <Paragraph textSize="7" textColor="grey">
            © 2026 Company Name
          </Paragraph>
        </Sidebar.Footer>
      </Sidebar>
    </>
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
