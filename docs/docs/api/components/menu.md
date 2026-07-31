---
title: Menu
sidebar_label: Menu
description: "The `Menu` component provides Bulma's vertical navigation menu: a simple, accessible sidebar or section menu for your Bulma React UI."
---

# Menu

## Overview

<!-- bestax:generated overview -->

The `Menu` component provides Bulma's vertical navigation menu: a simple, accessible sidebar or section menu for your Bulma React UI.

<!-- /bestax:generated overview -->

It supports labels, nested menu lists, active states, custom links, and all Bulma/utility helper props. Use it for dashboards, sidebars, admin panels, or any grouped navigation.

:::info
Menu supports unlimited nesting and lets you use any link or router component via the `as` prop on `Menu.Item`.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Menu } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Menu with Nested Lists

To create a sidebar or section menu with multiple levels, use the `Menu` component with nested `Menu.Label` and `Menu.List` subcomponents. You can nest `Menu.List` inside a `Menu.Item` to create hierarchical navigation. Use the `active` prop on a `Menu.Item` to highlight the current selection. This pattern is ideal for dashboards, admin panels, or any grouped navigation area, and you can apply Bulma helper props for layout and color customization.

```tsx live
<Menu style={{ maxWidth: 300 }}>
  <Menu.Label>General</Menu.Label>
  <Menu.List>
    <Menu.Item>Dashboard</Menu.Item>
    <Menu.Item>Customers</Menu.Item>
  </Menu.List>
  <Menu.Label>Administration</Menu.Label>
  <Menu.List>
    <Menu.Item>Team Settings</Menu.Item>
    <Menu.Item active>
      Manage Your Team
      <Menu.List>
        <Menu.Item>Members</Menu.Item>
        <Menu.Item>Plugins</Menu.Item>
        <Menu.Item>Add a member</Menu.Item>
      </Menu.List>
    </Menu.Item>
    <Menu.Item>Invitations</Menu.Item>
    <Menu.Item>Cloud Storage Environment Settings</Menu.Item>
    <Menu.Item>Authentication</Menu.Item>
  </Menu.List>
  <Menu.Label>Transactions</Menu.Label>
  <Menu.List>
    <Menu.Item>Payments</Menu.Item>
    <Menu.Item>Transfers</Menu.Item>
    <Menu.Item>Balance</Menu.Item>
  </Menu.List>
</Menu>
```

---

### Custom Link Component

Use the `as` prop on `Menu.Item` to render a custom link component, such as a router link. This enables seamless integration with client-side routing libraries, allowing you to pass additional props like `to` or `href` as needed for navigation.

```tsx live
// import { Link } from 'react-router-dom';
function example() {
  const Link = props => <a>{props.children}</a>;
  return (
    <Menu>
      <Menu.Label>App</Menu.Label>
      <Menu.List>
        <Menu.Item as={Link} to="/dashboard">
          Dashboard
        </Menu.Item>
        <Menu.Item as={Link} to="/settings">
          Settings
        </Menu.Item>
      </Menu.List>
    </Menu>
  );
}
```

---

### Active Menu Item

Highlight a menu entry by setting the `active` prop on a `Menu.Item`. This visually indicates the user's current location within the navigation structure, making it easier to orient within the app or section.

```tsx live
<Menu>
  <Menu.Label>Active Example</Menu.Label>
  <Menu.List>
    <Menu.Item>Overview</Menu.Item>
    <Menu.Item active>Current Page</Menu.Item>
    <Menu.Item>Other</Menu.Item>
  </Menu.List>
</Menu>
```

---

### Deeply Nested Menu

Create multi-level navigation by nesting `Menu.List` components inside `Menu.Item`. This is ideal for complex sidebars or admin panels with grouped and deeply nested navigation links.

```tsx live
<Menu>
  <Menu.Label>Levels</Menu.Label>
  <Menu.List>
    <Menu.Item>
      Level 1
      <Menu.List>
        <Menu.Item>
          Level 2
          <Menu.List>
            <Menu.Item>Level 3</Menu.Item>
          </Menu.List>
        </Menu.Item>
      </Menu.List>
    </Menu.Item>
  </Menu.List>
</Menu>
```

---

### Compound (dot-notation) usage

`MenuLabel`, `MenuList`, and `MenuItem` are also available as `Menu.Label`, `Menu.List`, and `Menu.Item`, so the whole menu can be composed from the single `Menu` import.

```tsx live
<Menu>
  <Menu.Label>General</Menu.Label>
  <Menu.List>
    <Menu.Item active>Dashboard</Menu.Item>
    <Menu.Item>Customers</Menu.Item>
  </Menu.List>
</Menu>
```

---

## Accessibility

- The root `Menu` renders as `<aside class="menu">`.
- Use semantic nesting (`Menu.List` inside `Menu.Item`) for submenus.
- Ensure each item is focusable and accessible if interactive.

:::note
For router integrations, pass the correct `as` and `to`/`href` props to `Menu.Item`.
:::

---

## Related Components

- [`Sidebar`](./sidebar.md): For slide-out navigation panels using Menu.
- [`Panel`](./panel.md): For alternate sidebar/navigation layouts.
- [Helper Props](../helpers/usebulmaclasses.md): All Bulma utility helpers are supported.

---

## Additional Resources

- [Bulma Menu Documentation](https://bulma.io/documentation/components/menu/)
- [Storybook: Menu Stories](https://bestax.io/storybook/?path=/story/components-menu--basic)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Menu />` and its subcomponents for powerful utility-based styling.
:::

---

## Props

### Menu

<!-- bestax:generated props -->

| Prop        | Type                                                | Default | Description                                       |
| ----------- | --------------------------------------------------- | ------- | ------------------------------------------------- |
| `className` | `string`                                            | —       | Additional CSS classes.                           |
| `children`  | `React.ReactNode`                                   | —       | Menu content (labels, lists, items, etc).         |
| `...`       | All standard HTML attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

**Subcomponents:**

- `Menu.Label`: Bulma Menu label component.
- `Menu.List`: MenuList applies `menu-list` class only at the top level (not for nested lists).
- `Menu.Item`: MenuItem supports `as` prop for custom link components, e.g., react-router-dom Link.

### Menu.Label

| Prop        | Type                                                 | Default | Description                                       |
| ----------- | ---------------------------------------------------- | ------- | ------------------------------------------------- |
| `className` | `string`                                             | —       | Additional CSS classes.                           |
| `children`  | `React.ReactNode`                                    | —       | Label content.                                    |
| `...`       | All standard `<p>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### Menu.List

| Prop        | Type                                                  | Default | Description                                       |
| ----------- | ----------------------------------------------------- | ------- | ------------------------------------------------- |
| `className` | `string`                                              | —       | Additional CSS classes.                           |
| `children`  | `React.ReactNode`                                     | —       | List items.                                       |
| `...`       | All standard `<ul>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### Menu.Item

| Prop        | Type                                                  | Default | Description                                       |
| ----------- | ----------------------------------------------------- | ------- | ------------------------------------------------- |
| `className` | `string`                                              | —       | Additional CSS classes.                           |
| `children`  | `React.ReactNode`                                     | —       | Item content and optional nested MenuList.        |
| `active`    | `boolean`                                             | `false` | Highlight item as active.                         |
| `href`      | `string`                                              | —       | Href for link items (if rendered as `<a>`).       |
| `as`        | `React.ElementType`                                   | `'a'`   | Custom link component (e.g. `Link` from router).  |
| `...`       | All standard `<li>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Menu` registers these variables on its own `.menu` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                  | Sass Variable                          | Default                                  |
| --------------------------------------------- | -------------------------------------- | ---------------------------------------- |
| `--bulma-menu-item-h`                         | `$menu-item-h`                         | `var(--bulma-scheme-h)`                  |
| `--bulma-menu-item-s`                         | `$menu-item-s`                         | `var(--bulma-scheme-s)`                  |
| `--bulma-menu-item-l`                         | `$menu-item-l`                         | `var(--bulma-scheme-main-l)`             |
| `--bulma-menu-item-background-l`              | `$menu-item-background-l`              | `var(--bulma-scheme-main-l)`             |
| `--bulma-menu-item-background-l-delta`        | `$menu-item-background-l-delta`        | `0%`                                     |
| `--bulma-menu-item-hover-background-l-delta`  | `$menu-item-hover-background-l-delta`  | `var(--bulma-hover-background-l-delta)`  |
| `--bulma-menu-item-active-background-l-delta` | `$menu-item-active-background-l-delta` | `var(--bulma-active-background-l-delta)` |
| `--bulma-menu-item-color-l`                   | `$menu-item-color-l`                   | `var(--bulma-text-l)`                    |
| `--bulma-menu-item-radius`                    | `$menu-item-radius`                    | `var(--bulma-radius-small)`              |
| `--bulma-menu-item-selected-h`                | `$menu-item-selected-h`                | `var(--bulma-link-h)`                    |
| `--bulma-menu-item-selected-s`                | `$menu-item-selected-s`                | `var(--bulma-link-s)`                    |
| `--bulma-menu-item-selected-l`                | `$menu-item-selected-l`                | `var(--bulma-link-l)`                    |
| `--bulma-menu-item-selected-background-l`     | `$menu-item-selected-background-l`     | `var(--bulma-link-l)`                    |
| `--bulma-menu-item-selected-color-l`          | `$menu-item-selected-color-l`          | `var(--bulma-link-invert-l)`             |
| `--bulma-menu-list-border-left`               | `$menu-list-border-left`               | `1px solid var(--bulma-border)`          |
| `--bulma-menu-list-line-height`               | `$menu-list-line-height`               | `1.25`                                   |
| `--bulma-menu-list-link-padding`              | `$menu-list-link-padding`              | `0.5em 0.75em`                           |
| `--bulma-menu-nested-list-margin`             | `$menu-nested-list-margin`             | `0.75em`                                 |
| `--bulma-menu-nested-list-padding-left`       | `$menu-nested-list-padding-left`       | `0.75em`                                 |
| `--bulma-menu-label-color`                    | `$menu-label-color`                    | `var(--bulma-text-weak)`                 |
| `--bulma-menu-label-font-size`                | `$menu-label-font-size`                | `0.75em`                                 |
| `--bulma-menu-label-letter-spacing`           | `$menu-label-letter-spacing`           | `0.1em`                                  |
| `--bulma-menu-label-spacing`                  | `$menu-label-spacing`                  | `1em`                                    |

<!-- /bestax:generated cssvars -->
