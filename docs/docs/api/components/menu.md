---
title: Menu
sidebar_label: Menu
---

# Menu

## Overview

The `Menu` component provides Bulma's vertical navigation menu: a simple, accessible sidebar or section menu for your Bulma React UI. It supports labels, nested menu lists, active states, custom links, and all Bulma/utility helper props. Use it for dashboards, sidebars, admin panels, or any grouped navigation.

:::info
Menu supports unlimited nesting and lets you use any link or router component via the `as` prop on `Menu.Item`.
:::

---

## Import

```tsx
import { Menu } from '@allxsmith/bestax-bulma';
```

---

## Props

### Menu

| Prop        | Type                   | Default | Description                                      |
| ----------- | ---------------------- | ------- | ------------------------------------------------ |
| `className` | `string`               | —       | Additional CSS classes.                          |
| `children`  | `React.ReactNode`      | —       | Menu content (labels, lists, items, etc).        |
| ...         | All Bulma helper props |         | (See [Helper Props](../helpers/usebulmaclasses)) |

### Menu.Label

| Prop        | Type              | Default | Description         |
| ----------- | ----------------- | ------- | ------------------- |
| `className` | `string`          | —       | Additional classes. |
| `children`  | `React.ReactNode` | —       | Label content.      |

### Menu.List

| Prop        | Type              | Default | Description                                 |
| ----------- | ----------------- | ------- | ------------------------------------------- |
| `className` | `string`          | —       | Additional classes.                         |
| `children`  | `React.ReactNode` | —       | List items (`Menu.Item`). Supports nesting. |

### Menu.Item

| Prop        | Type                        | Default | Description                                      |
| ----------- | --------------------------- | ------- | ------------------------------------------------ |
| `className` | `string`                    | —       | Additional classes.                              |
| `children`  | `React.ReactNode`           | —       | Label, and optionally nested `Menu.List`.        |
| `active`    | `boolean`                   | —       | Highlight item as active.                        |
| `href`      | `string`                    | —       | Href for link items (if rendered as `<a>`).      |
| `as`        | `React.ElementType`         | `'a'`   | Custom link component (e.g. `Link` from router). |
| ...         | All `<li>` and helper props |         | Standard HTML/li/utility props.                  |

---

## Usage

### Basic Menu with Nested Lists

```tsx
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

```tsx
import { Link } from 'react-router-dom';

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
</Menu>;
```

---

### Active Menu Item

```tsx
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

```tsx
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

## Accessibility

- The root `Menu` renders as `<aside class="menu">`.
- Use semantic nesting (`Menu.List` inside `Menu.Item`) for submenus.
- Ensure each item is focusable and accessible if interactive.

:::note
For router integrations, pass the correct `as` and `to`/`href` props to `Menu.Item`.
:::

---

## Related Components

- [`Panel`](./panel.md): For alternate sidebar/navigation layouts.
- [Helper Props](../helpers/usebulmaclasses.md): All Bulma utility helpers are supported.

---

## Additional Resources

- [Bulma Menu Documentation](https://bulma.io/documentation/components/menu/)
- [Storybook: Menu Stories](https://bestax.cc/storybook/?path=/story/components-menu--basic)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Menu />` and its subcomponents for powerful utility-based styling.
:::
