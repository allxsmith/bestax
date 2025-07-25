---
title: Buttons
sidebar_label: Buttons
---

# Buttons

## Overview

The `Buttons` component lets you group multiple `Button` elements together with Bulma's spacing, alignment, and add-on features. It's ideal for toolbars, button clusters, or any UI where you want a consistent group of buttons, including add-on styling, centering, or right alignment.

:::tip
Use the `Buttons` component to maintain Bulma's consistent button group layout and spacing in your UI.
:::

---

## Import

```tsx
import { Buttons } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop         | Type                                                                                                                                                                                                                                                                                     | Default | Description                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------- |
| `className`  | `string`                                                                                                                                                                                                                                                                                 | —       | Additional CSS classes.                                          |
| `textColor`  | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Text color helper for the button group.                          |
| `color`      | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger'`                                                                                                                                                                                                                    | —       | Bulma color modifier for the button group.                       |
| `bgColor`    | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Background color helper for the button group.                    |
| `isCentered` | `boolean`                                                                                                                                                                                                                                                                                | `false` | Center the group of buttons.                                     |
| `isRight`    | `boolean`                                                                                                                                                                                                                                                                                | `false` | Align the group of buttons to the right.                         |
| `hasAddons`  | `boolean`                                                                                                                                                                                                                                                                                | `false` | Group buttons together as addons (removes spacing between them). |
| `children`   | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | The button elements to render inside the group.                  |
| ...          | All standard `<div>` and Bulma helper props                                                                                                                                                                                                                                              |         | (See [Helper Props](../helpers/usebulmaclasses))                 |

---

## Usage

### Default Button Group

The default usage of the `Buttons` component groups multiple `Button` elements together with consistent spacing. Use this for toolbars, button clusters, or any UI where you want a visually unified group of buttons.

```tsx live
<Buttons>
  <Button color="primary">Save</Button>
  <Button color="info">Edit</Button>
  <Button color="danger">Delete</Button>
</Buttons>
```

### All Colors Group

This example shows a group of buttons, each with a different `color` prop (`primary`, `link`, `info`, `success`, `warning`, `danger`). Use this to visually distinguish actions or statuses within a button group.

```tsx live
<Buttons>
  {['primary', 'link', 'info', 'success', 'warning', 'danger'].map(color => (
    <Button key={color} color={color}>
      {color.charAt(0).toUpperCase() + color.slice(1)}
    </Button>
  ))}
</Buttons>
```

### All Sizes Group

Demonstrates a group of buttons with different `size` props (`small`, `normal`, `medium`, `large`). Use this to show how button groups adapt to various sizing needs.

```tsx live
<Buttons>
  {['small', 'normal', 'medium', 'large'].map(size => (
    <Button key={size} size={size}>
      {size.charAt(0).toUpperCase() + size.slice(1)}
    </Button>
  ))}
</Buttons>
```

### Add-ons (No Spacing Between Buttons)

The `hasAddons` prop removes spacing between buttons, making them appear as a single connected group. This is useful for segmented controls or tightly grouped actions.

```tsx live
<Buttons hasAddons>
  <Button color="primary">Left</Button>
  <Button color="primary">Center</Button>
  <Button color="primary">Right</Button>
</Buttons>
```

### Centered Group

The `isCentered` prop centers the button group within its container. Use this for balanced layouts or when you want the group to stand out.

```tsx live
<Buttons isCentered>
  <Button color="info">One</Button>
  <Button color="info">Two</Button>
</Buttons>
```

### Right-Aligned Group

The `isRight` prop aligns the button group to the right edge of its container. This is useful for actions that should be visually separated from other content.

```tsx live
<Buttons isRight>
  <Button color="success">Accept</Button>
  <Button color="danger">Reject</Button>
</Buttons>
```

---

## Accessibility

- Grouping buttons in a `<div class="buttons">` has no negative impact on accessibility.
- Ensure each `Button` has a clear label (text or `aria-label`).
- If grouping radio or toggle buttons, consider `aria-pressed` or `aria-checked` for stateful controls.

:::tip
You can use all Bulma helper props (spacing, color, alignment) with `Buttons` for even more control.
:::

---

## Related Components

- [`Button`](./button.md): The underlying button component used in the group.
- [Helper Props](../helpers/usebulmaclasses.md): All supported Bulma helper props for layout, color, and spacing.

---

## Additional Resources

- [Bulma Button Group Documentation](https://bulma.io/documentation/elements/button/#group)
- [Storybook: Button Stories](https://bestax.cc/storybook/?path=/story/elements-button--default)
