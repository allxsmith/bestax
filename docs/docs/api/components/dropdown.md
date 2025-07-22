---
title: Dropdown
sidebar_label: Dropdown
---

# Dropdown

## Overview

The `Dropdown` component provides Bulma's versatile dropdown menu for your Bulma React UI. It supports custom triggers, menu alignment, hover or click activation, right/up direction, disabled state, controlled/uncontrolled open state, menu dividers, and full Bulma/utility helper props. Use it for navigation menus, actions, or custom pop-up lists.

:::info
Dropdowns can be fully controlled, used as hoverable, or triggered by click. Menu items and dividers are included.
:::

---

## Import

```tsx
import { Dropdown } from '@allxsmith/bestax-bulma';
```

---

## Props

### Dropdown

| Prop             | Type                        | Default | Description                                      |
| ---------------- | --------------------------- | ------- | ------------------------------------------------ |
| `label`          | `React.ReactNode`           | —       | The dropdown button/trigger content.             |
| `children`       | `React.ReactNode`           | —       | Dropdown menu items and dividers.                |
| `className`      | `string`                    | —       | Additional CSS classes for root.                 |
| `menuClassName`  | `string`                    | —       | Additional CSS classes for the dropdown menu.    |
| `active`         | `boolean`                   | —       | Whether the dropdown is open (controlled).       |
| `up`             | `boolean`                   | false   | Dropdown menu opens upward.                      |
| `right`          | `boolean`                   | false   | Menu is right-aligned.                           |
| `hoverable`      | `boolean`                   | false   | Open on hover instead of click.                  |
| `disabled`       | `boolean`                   | false   | Disables the dropdown trigger.                   |
| `onActiveChange` | `(active: boolean) => void` | —       | Callback when dropdown active state changes.     |
| `closeOnClick`   | `boolean`                   | `true`  | Close dropdown when a menu item is clicked.      |
| `id`             | `string`                    | —       | Root element ID (for aria-controls, etc).        |
| ...              | All Bulma helper props      |         | (See [Helper Props](../helpers/usebulmaclasses)) |

### Dropdown.Item

| Prop        | Type                                     | Default | Description                                      |
| ----------- | ---------------------------------------- | ------- | ------------------------------------------------ |
| `active`    | `boolean`                                | —       | Makes this item appear active.                   |
| `className` | `string`                                 | —       | Additional CSS classes.                          |
| `as`        | `'a'` \| `'div'` \| `'button'`           | `'a'`   | Element type to render.                          |
| `children`  | `React.ReactNode`                        | —       | Content for the menu item.                       |
| ...         | All standard HTML and Bulma helper props |         | (See [Helper Props](../helpers/usebulmaclasses)) |

### Dropdown.Divider

No props. Renders as a menu divider (`<hr>`).

---

## Usage

### Default Dropdown

To create a dropdown menu, use the `Dropdown` component with a `label` for the trigger and `Dropdown.Item` children for each menu option. You can add a `Dropdown.Divider` to separate groups of items. This pattern is ideal for navigation menus, action lists, or custom pop-up menus in your UI.

```tsx live
import { Dropdown } from '@allxsmith/bestax-bulma';

function Example() {
  return (
    <Dropdown label="Dropdown Menu">
      <Dropdown.Item>First Item</Dropdown.Item>
      <Dropdown.Item>Second Item</Dropdown.Item>
      <Dropdown.Divider />
      <Dropdown.Item>Third Item</Dropdown.Item>
      <Dropdown.Item>Fourth Item</Dropdown.Item>
      <Dropdown.Item>Fifth Item</Dropdown.Item>
    </Dropdown>
  );
}
```

---

### Custom Tags (button, div, anchor)

Use the `as` prop on `Dropdown.Item` to render different HTML elements, such as `a`, `div`, or `button`. This allows you to customize the behavior and semantics of each dropdown item, supporting links, actions, or custom content.

```tsx live
<Dropdown label="Custom Dropdown Content">
  <Dropdown.Item as="a" href="https://example.com" target="_blank">
    Anchor Item
  </Dropdown.Item>
  <Dropdown.Item as="div">Div Item</Dropdown.Item>
  <Dropdown.Item as="button" onClick={() => alert('Clicked!')}>
    Button Item
  </Dropdown.Item>
</Dropdown>
```

---

### Hoverable and Always Active

Add the `hoverable` prop to open the dropdown on hover, and the `active` prop to keep it always open. This is useful for menus that should remain visible or for previewing dropdown content without a click.

```tsx live
<Dropdown label="Hoverable + Active" hoverable active>
  <Dropdown.Item>Hover or Always Open</Dropdown.Item>
  <Dropdown.Item>Second</Dropdown.Item>
  <Dropdown.Divider />
  <Dropdown.Item>Another</Dropdown.Item>
</Dropdown>
```

---

### Right-Aligned Dropdown

Set the `right` prop to align the dropdown menu to the right edge of its trigger. This is useful for menus in toolbars or when space is limited on the left.

```tsx live
<Dropdown label="Dropdown Right" right>
  <Dropdown.Item>Right 1</Dropdown.Item>
  <Dropdown.Item>Right 2</Dropdown.Item>
</Dropdown>
```

---

### Upward Dropdown

Use the `up` prop to make the dropdown menu open upward instead of downward. This is helpful when the dropdown is near the bottom of the viewport or container.

```tsx live
<Dropdown label="Dropdown Up" up>
  <Dropdown.Item>Up 1</Dropdown.Item>
  <Dropdown.Item>Up 2</Dropdown.Item>
</Dropdown>
```

---

### Controlled Dropdown Example

Control the open/close state of the dropdown by setting the `active` prop and handling state changes with `onActiveChange`. This pattern is useful for advanced interactions or integrating with other UI state.

```tsx live
function example() {
  const [open, setOpen] = useState(false);

  return (
    <Dropdown
      label="Controlled Dropdown"
      active={open}
      onActiveChange={setOpen}
    >
      <Dropdown.Item>Item A</Dropdown.Item>
      <Dropdown.Item>Item B</Dropdown.Item>
    </Dropdown>
  );
}
```

---

## Accessibility

- The dropdown root is a `<div class="dropdown">` with ARIA roles/attributes for menu and trigger.
- The trigger button uses `aria-haspopup`, `aria-controls`, and `aria-expanded`.
- Menu items are focusable and use `role="menuitem"`.
- Clicking outside closes the dropdown in most cases.

:::note
For custom keyboard navigation or focus management, add handlers as needed.
:::

---

## Related Components

- [`Button`](../elements/button.md): Use Bulma/Bestax buttons as triggers if needed.
- [Helper Props](../helpers/usebulmaclasses.md): All Bulma utility helpers can be used.

---

## Additional Resources

- [Bulma Dropdown Documentation](https://bulma.io/documentation/components/dropdown/)
- [Storybook: Dropdown Stories](https://bestax.cc/storybook/?path=/story/components-dropdown--default)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Dropdown />`, `<Dropdown.Item />`, and `<Dropdown.Divider />` for utility-based styling.
:::
