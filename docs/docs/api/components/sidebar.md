---
title: Sidebar
sidebar_label: Sidebar
description: The `Sidebar` component provides a slide-out navigation panel that appears from the left or right side of the screen.
---

# Sidebar

## Overview

<!-- bestax:generated overview -->

The `Sidebar` component provides a slide-out navigation panel that appears from the left or right side of the screen.

<!-- /bestax:generated overview -->

It's ideal for mobile navigation, settings panels, or any content that should overlay the main interface.

---

## Import

<!-- bestax:generated import -->

```tsx
import { Sidebar } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

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
        isFullwidth
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

### Compound (dot-notation) usage

`Sidebar.Header`, `Sidebar.Title`, `Sidebar.Close`, `Sidebar.Body`, and `Sidebar.Footer` are all statics on `Sidebar`, so the whole panel can be composed from the single `Sidebar` import.

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
          <Sidebar.Title>Dot Notation</Sidebar.Title>
          <Sidebar.Close onClick={() => setIsOpen(false)} />
        </Sidebar.Header>
        <Sidebar.Body>
          <Paragraph>
            Header, Title, Close, Body, and Footer are all available from the
            single Sidebar import.
          </Paragraph>
        </Sidebar.Body>
        <Sidebar.Footer>
          <Button color="primary" onClick={() => setIsOpen(false)}>
            Done
          </Button>
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

---

## Props

<!-- bestax:generated props -->

| Prop           | Type                                                | Default   | Description                                                                                                              |
| -------------- | --------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------ |
| `isOpen`       | `boolean`                                           | —         | Whether the sidebar is open (required).                                                                                  |
| `onClose`      | `() => void`                                        | —         | Callback when sidebar should close.                                                                                      |
| `position`     | `'left'` \| `'right'`                               | `'left'`  | Which side the sidebar appears from. Default: 'left'.                                                                    |
| `width`        | `string`                                            | `'260px'` | Custom width of the sidebar.                                                                                             |
| `isFullwidth`  | `boolean`                                           | `false`   | Sidebar takes full width (mobile-style).                                                                                 |
| `fullWidth`    | `boolean`                                           | `false`   | **Deprecated.** Use `isFullwidth` instead — `isFullwidth` wins if both are set. Sidebar takes full width (mobile-style). |
| `overlay`      | `boolean`                                           | `true`    | Show overlay behind sidebar. Default: true.                                                                              |
| `overlayClose` | `boolean`                                           | `true`    | Close sidebar when overlay is clicked. Default: true.                                                                    |
| `escapeClose`  | `boolean`                                           | `true`    | Close sidebar on Escape key. Default: true.                                                                              |
| `canCancel`    | `boolean`                                           | `true`    | Allow closing the sidebar. Default: true.                                                                                |
| `children`     | `React.ReactNode`                                   | —         | Content to display in the sidebar.                                                                                       |
| `inline`       | `boolean`                                           | `false`   | Renders inline instead of using a portal.                                                                                |
| `className`    | `string`                                            | —         | Additional CSS classes.                                                                                                  |
| `ref`          | `React.Ref<HTMLElement>`                            | —         | Ref forwarded to the sidebar element.                                                                                    |
| `...`          | All standard HTML attributes and Bulma helper props | —         | See [Helper Props](../helpers/usebulmaclasses.md)                                                                        |

**Subcomponents:**

- `Sidebar.Header`: Container for the sidebar header.
- `Sidebar.Title`: Title text inside the header.
- `Sidebar.Close`: Close button for the sidebar.
- `Sidebar.Body`: Main content area of the sidebar.
- `Sidebar.Footer`: Footer area of the sidebar.

### Sidebar.Header

| Prop        | Type                            | Default | Description             |
| ----------- | ------------------------------- | ------- | ----------------------- |
| `children`  | `React.ReactNode`               | —       | Header content.         |
| `className` | `string`                        | —       | Additional CSS classes. |
| `...`       | All standard `<div>` attributes | —       |                         |

### Sidebar.Title

| Prop        | Type                          | Default | Description             |
| ----------- | ----------------------------- | ------- | ----------------------- |
| `children`  | `React.ReactNode`             | —       | Title content.          |
| `className` | `string`                      | —       | Additional CSS classes. |
| `...`       | All standard `<p>` attributes | —       |                         |

### Sidebar.Close

| Prop        | Type                               | Default | Description                            |
| ----------- | ---------------------------------- | ------- | -------------------------------------- |
| `className` | `string`                           | —       | Additional CSS classes.                |
| `children`  | `React.ReactNode`                  | —       | Content rendered inside the component. |
| `...`       | All standard `<button>` attributes | —       |                                        |

### Sidebar.Body

| Prop        | Type                            | Default | Description             |
| ----------- | ------------------------------- | ------- | ----------------------- |
| `children`  | `React.ReactNode`               | —       | Body content.           |
| `className` | `string`                        | —       | Additional CSS classes. |
| `...`       | All standard `<div>` attributes | —       |                         |

### Sidebar.Footer

| Prop        | Type                            | Default | Description             |
| ----------- | ------------------------------- | ------- | ----------------------- |
| `children`  | `React.ReactNode`               | —       | Footer content.         |
| `className` | `string`                        | —       | Additional CSS classes. |
| `...`       | All standard `<div>` attributes | —       |                         |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Sidebar` registers these variables on its own `.sidebar` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                  | Sass Variable                          | Default                           |
| --------------------------------------------- | -------------------------------------- | --------------------------------- |
| `--bulma-sidebar-width`                       | `$sidebar-width`                       | `260px`                           |
| `--bulma-sidebar-background`                  | `$sidebar-background`                  | `var(--bulma-scheme-main)`        |
| `--bulma-sidebar-shadow`                      | `$sidebar-shadow`                      | `0 2px 8px hsla(0, 0%, 0%, 0.15)` |
| `--bulma-sidebar-transition-duration`         | `$sidebar-transition-duration`         | `0.3s`                            |
| `--bulma-sidebar-content-padding`             | `$sidebar-content-padding`             | `1rem`                            |
| `--bulma-sidebar-scrollbar-width`             | `$sidebar-scrollbar-width`             | `6px`                             |
| `--bulma-sidebar-scrollbar-color`             | `$sidebar-scrollbar-color`             | `var(--bulma-grey-light)`         |
| `--bulma-sidebar-scrollbar-color-hover`       | `$sidebar-scrollbar-color-hover`       | `var(--bulma-grey)`               |
| `--bulma-sidebar-header-padding`              | `$sidebar-header-padding`              | `0.75rem 1rem`                    |
| `--bulma-sidebar-header-border-color`         | `$sidebar-header-border-color`         | `var(--bulma-border)`             |
| `--bulma-sidebar-header-margin-bottom`        | `$sidebar-header-margin-bottom`        | `1rem`                            |
| `--bulma-sidebar-title-size`                  | `$sidebar-title-size`                  | `1.25rem`                         |
| `--bulma-sidebar-title-weight`                | `$sidebar-title-weight`                | `var(--bulma-weight-semibold)`    |
| `--bulma-sidebar-title-color`                 | `$sidebar-title-color`                 | `var(--bulma-text-strong)`        |
| `--bulma-sidebar-close-size`                  | `$sidebar-close-size`                  | `1.75rem`                         |
| `--bulma-sidebar-close-color`                 | `$sidebar-close-color`                 | `var(--bulma-text)`               |
| `--bulma-sidebar-close-line-width`            | `$sidebar-close-line-width`            | `2px`                             |
| `--bulma-sidebar-close-hover-background`      | `$sidebar-close-hover-background`      | `var(--bulma-scheme-main-ter)`    |
| `--bulma-sidebar-close-radius`                | `$sidebar-close-radius`                | `var(--bulma-radius)`             |
| `--bulma-sidebar-footer-padding`              | `$sidebar-footer-padding`              | `0.75rem 1rem`                    |
| `--bulma-sidebar-footer-border-color`         | `$sidebar-footer-border-color`         | `var(--bulma-border)`             |
| `--bulma-sidebar-footer-margin-top`           | `$sidebar-footer-margin-top`           | `1rem`                            |
| `--bulma-sidebar-menu-item-padding`           | `$sidebar-menu-item-padding`           | `0.5rem 0.75rem`                  |
| `--bulma-sidebar-menu-item-radius`            | `$sidebar-menu-item-radius`            | `var(--bulma-radius)`             |
| `--bulma-sidebar-menu-item-hover-background`  | `$sidebar-menu-item-hover-background`  | `var(--bulma-scheme-main-bis)`    |
| `--bulma-sidebar-menu-item-active-background` | `$sidebar-menu-item-active-background` | `var(--bulma-link)`               |
| `--bulma-sidebar-menu-item-active-color`      | `$sidebar-menu-item-active-color`      | `var(--bulma-link-invert)`        |
| `--bulma-sidebar-static-border-color`         | `$sidebar-static-border-color`         | `var(--bulma-border)`             |

<!-- /bestax:generated cssvars -->
