---
title: Dropdown
sidebar_label: Dropdown
description: The `Dropdown` component provides Bulma's versatile dropdown menu for your Bulma React UI.
---

# Dropdown

## Overview

<!-- bestax:generated overview -->

The `Dropdown` component provides Bulma's versatile dropdown menu for your Bulma React UI.

<!-- /bestax:generated overview -->

It supports custom triggers, menu alignment, hover or click activation, right/up direction, disabled state, controlled/uncontrolled open state, menu dividers, and full Bulma/utility helper props. Use it for navigation menus, actions, or custom pop-up lists.

:::info
Dropdowns can be fully controlled, used as hoverable, or triggered by click. Menu items and dividers are included.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Dropdown } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

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

### Compound (dot-notation) usage

`DropdownItem` and `DropdownDivider` are also available as `Dropdown.Item` and `Dropdown.Divider`, so the whole menu can be composed from the single `Dropdown` import.

```tsx live
<Dropdown label="Dropdown Menu" active>
  <Dropdown.Item>First Item</Dropdown.Item>
  <Dropdown.Item>Second Item</Dropdown.Item>
  <Dropdown.Divider />
  <Dropdown.Item>Third Item</Dropdown.Item>
</Dropdown>
```

---

## Accessibility

- The dropdown root is a `<div class="dropdown">` with ARIA roles/attributes for menu and trigger.
- The trigger button uses `aria-haspopup`, `aria-controls`, and `aria-expanded`.
- Menu items are focusable and use `role="menuitem"`.
- Clicking outside closes the dropdown in most cases.

`Dropdown` implements the [WAI-ARIA Menu Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)
out of the box:

- On the trigger: <kbd>ArrowDown</kbd> or <kbd>Enter</kbd>/<kbd>Space</kbd> open the menu and
  focus the first item; <kbd>ArrowUp</kbd> opens the menu and focuses the last item;
  <kbd>Escape</kbd> closes an open menu.
- Inside the menu: <kbd>ArrowDown</kbd>/<kbd>ArrowUp</kbd> move between items and wrap around;
  <kbd>Home</kbd>/<kbd>End</kbd> jump to the first/last item; <kbd>Escape</kbd> closes the menu
  and returns focus to the trigger; <kbd>Tab</kbd> closes the menu and lets focus continue
  naturally.
- Disabled items (a `Dropdown.Item` rendered with a native `disabled` attribute or
  `aria-disabled="true"`) and dividers are skipped during arrow-key navigation.

:::note
There is no typeahead and no built-in outside-click handling inside the menu beyond the
existing click-outside-to-close behavior — add those yourself if your use case needs them.
:::

---

## Related Components

- [`Button`](../elements/button.md): Use Bulma/Bestax buttons as triggers if needed.
- [Helper Props](../helpers/usebulmaclasses.md): All Bulma utility helpers can be used.

---

## Additional Resources

- [Bulma Dropdown Documentation](https://bulma.io/documentation/components/dropdown/)
- [Storybook: Dropdown Stories](https://bestax.io/storybook/?path=/story/components-dropdown--default)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Dropdown />`, `<Dropdown.Item />`, and `<Dropdown.Divider />` for utility-based styling.
:::

---

## Props

### Dropdown

<!-- bestax:generated props -->

| Prop             | Type                                                   | Default | Description                                       |
| ---------------- | ------------------------------------------------------ | ------- | ------------------------------------------------- |
| `label`          | `React.ReactNode`                                      | —       | The dropdown button/trigger content.              |
| `children`       | `React.ReactNode`                                      | —       | Dropdown menu items and dividers.                 |
| `className`      | `string`                                               | —       | Additional CSS classes for root.                  |
| `menuClassName`  | `string`                                               | —       | Additional CSS classes for the dropdown menu.     |
| `active`         | `boolean`                                              | —       | Whether the dropdown is open (controlled).        |
| `up`             | `boolean`                                              | `false` | Dropdown menu opens upward.                       |
| `right`          | `boolean`                                              | `false` | Menu is right-aligned.                            |
| `hoverable`      | `boolean`                                              | `false` | Open on hover instead of click.                   |
| `disabled`       | `boolean`                                              | `false` | Disables the dropdown trigger.                    |
| `onActiveChange` | `(active: boolean) => void`                            | —       | Callback when dropdown active state changes.      |
| `closeOnClick`   | `boolean`                                              | `true`  | Close dropdown when a menu item is clicked.       |
| `id`             | `string`                                               | —       | Root element ID (for aria-controls, etc).         |
| `...`            | All standard `<div>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

**Subcomponents:**

- `Dropdown.Item`: Bulma Dropdown item.
- `Dropdown.Divider`: Bulma Dropdown divider.

### Dropdown.Item

| Prop        | Type                                                | Default | Description                                       |
| ----------- | --------------------------------------------------- | ------- | ------------------------------------------------- |
| `active`    | `boolean`                                           | `false` | Whether the item is active.                       |
| `className` | `string`                                            | —       | Additional CSS classes.                           |
| `as`        | `'a'` \| `'div'` \| `'button'`                      | `'a'`   | The element type to render.                       |
| `children`  | `React.ReactNode`                                   | —       | Item content.                                     |
| `...`       | All standard HTML attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

<!-- /bestax:generated props -->

### Dropdown.Divider

No props. Renders as a menu divider (`<hr>`).

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Dropdown` registers these variables on its own `.dropdown` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                      | Sass Variable                              | Default                                  |
| ------------------------------------------------- | ------------------------------------------ | ---------------------------------------- |
| `--bulma-dropdown-menu-min-width`                 | `$dropdown-menu-min-width`                 | `12rem`                                  |
| `--bulma-dropdown-content-background-color`       | `$dropdown-content-background-color`       | `var(--bulma-scheme-main)`               |
| `--bulma-dropdown-content-offset`                 | `$dropdown-content-offset`                 | `0.25rem`                                |
| `--bulma-dropdown-content-padding-bottom`         | `$dropdown-content-padding-bottom`         | `0.5rem`                                 |
| `--bulma-dropdown-content-padding-top`            | `$dropdown-content-padding-top`            | `0.5rem`                                 |
| `--bulma-dropdown-content-radius`                 | `$dropdown-content-radius`                 | `var(--bulma-radius)`                    |
| `--bulma-dropdown-content-shadow`                 | `$dropdown-content-shadow`                 | `var(--bulma-shadow)`                    |
| `--bulma-dropdown-content-z`                      | `$dropdown-content-z`                      | `20`                                     |
| `--bulma-dropdown-item-h`                         | `$dropdown-item-h`                         | `var(--bulma-scheme-h)`                  |
| `--bulma-dropdown-item-s`                         | `$dropdown-item-s`                         | `var(--bulma-scheme-s)`                  |
| `--bulma-dropdown-item-l`                         | `$dropdown-item-l`                         | `var(--bulma-scheme-main-l)`             |
| `--bulma-dropdown-item-background-l`              | `$dropdown-item-background-l`              | `var(--bulma-scheme-main-l)`             |
| `--bulma-dropdown-item-background-l-delta`        | `$dropdown-item-background-l-delta`        | `0%`                                     |
| `--bulma-dropdown-item-hover-background-l-delta`  | `$dropdown-item-hover-background-l-delta`  | `var(--bulma-hover-background-l-delta)`  |
| `--bulma-dropdown-item-active-background-l-delta` | `$dropdown-item-active-background-l-delta` | `var(--bulma-active-background-l-delta)` |
| `--bulma-dropdown-item-color-l`                   | `$dropdown-item-color-l`                   | `var(--bulma-text-strong-l)`             |
| `--bulma-dropdown-item-selected-h`                | `$dropdown-item-selected-h`                | `var(--bulma-link-h)`                    |
| `--bulma-dropdown-item-selected-s`                | `$dropdown-item-selected-s`                | `var(--bulma-link-s)`                    |
| `--bulma-dropdown-item-selected-l`                | `$dropdown-item-selected-l`                | `var(--bulma-link-l)`                    |
| `--bulma-dropdown-item-selected-background-l`     | `$dropdown-item-selected-background-l`     | `var(--bulma-link-l)`                    |
| `--bulma-dropdown-item-selected-color-l`          | `$dropdown-item-selected-color-l`          | `var(--bulma-link-invert-l)`             |
| `--bulma-dropdown-divider-background-color`       | `$dropdown-divider-background-color`       | `var(--bulma-border-weak)`               |

<!-- /bestax:generated cssvars -->
