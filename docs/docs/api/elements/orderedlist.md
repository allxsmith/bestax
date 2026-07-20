---
title: OrderedList
sidebar_label: OrderedList
---

# OrderedList

## Overview

The `OrderedList` component renders a styled ordered list (`<ol>`) element with Bulma helper class integration. Use it with `ListItem` components to create numbered lists with consistent styling. Supports all standard `<ol>` attributes like `type`, `start`, and `reversed`.

:::info
The OrderedList component is a thin wrapper around the HTML `<ol>` element, providing consistent Bulma styling and helper class support.
:::

---

## Import

```tsx
import { OrderedList, ListItem } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                                                                                                                                                                                                                                                                     | Default | Description                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------ |
| `type`      | `'1'` \| `'a'` \| `'A'` \| `'i'` \| `'I'`                                                                                                                                                                                                                                                | `'1'`   | The numbering type for the list.                 |
| `start`     | `number`                                                                                                                                                                                                                                                                                 | —       | The starting number for the list.                |
| `reversed`  | `boolean`                                                                                                                                                                                                                                                                                | —       | Whether to reverse the list numbering.           |
| `className` | `string`                                                                                                                                                                                                                                                                                 | —       | Additional CSS classes.                          |
| `textColor` | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Text color helper.                               |
| `bgColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Background color helper.                         |
| `children`  | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | List items to render inside the list.            |
| ...         | All standard `<ol>` and Bulma helper props                                                                                                                                                                                                                                               |         | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

:::info Wrap Lists in Content for Traditional Styling
Without a [`Content`](./content.md) wrapper, Bulma renders lists without the traditional margin, padding, and list-style markers (bullets, numbers). Wrap your lists in `<Content>` to get the expected typographic list appearance.
:::

### Default List

The default usage of the `OrderedList` component with numbered items.

```tsx live
<Content>
  <OrderedList>
    <ListItem>First item</ListItem>
    <ListItem>Second item</ListItem>
    <ListItem>Third item</ListItem>
  </OrderedList>
</Content>
```

### Alphabetic Lowercase

Use `type="a"` for lowercase alphabetic numbering.

```tsx live
<Content>
  <OrderedList type="a">
    <ListItem>First item</ListItem>
    <ListItem>Second item</ListItem>
    <ListItem>Third item</ListItem>
  </OrderedList>
</Content>
```

### Alphabetic Uppercase

Use `type="A"` for uppercase alphabetic numbering.

```tsx live
<Content>
  <OrderedList type="A">
    <ListItem>First item</ListItem>
    <ListItem>Second item</ListItem>
    <ListItem>Third item</ListItem>
  </OrderedList>
</Content>
```

### Roman Numerals

Use `type="I"` for uppercase Roman numerals or `type="i"` for lowercase.

```tsx live
<Content>
  <OrderedList type="I">
    <ListItem>First item</ListItem>
    <ListItem>Second item</ListItem>
    <ListItem>Third item</ListItem>
  </OrderedList>
</Content>
```

### Custom Starting Number

Use the `start` prop to begin numbering from a specific value.

```tsx live
<Content>
  <OrderedList start={5}>
    <ListItem>Fifth item</ListItem>
    <ListItem>Sixth item</ListItem>
    <ListItem>Seventh item</ListItem>
  </OrderedList>
</Content>
```

### Reversed Order

Use the `reversed` prop to count down instead of up.

```tsx live
<Content>
  <OrderedList reversed>
    <ListItem>Third item (shown as 3)</ListItem>
    <ListItem>Second item (shown as 2)</ListItem>
    <ListItem>First item (shown as 1)</ListItem>
  </OrderedList>
</Content>
```

### Colored List

Apply text color to all list items.

```tsx live
<Content>
  <OrderedList textColor="primary">
    <ListItem>First item</ListItem>
    <ListItem>Second item</ListItem>
    <ListItem>Third item</ListItem>
  </OrderedList>
</Content>
```

### Nested Lists

Create nested ordered lists with different numbering types.

```tsx live
<Content>
  <OrderedList>
    <ListItem>First item</ListItem>
    <ListItem>
      Second item with nested list
      <OrderedList type="a">
        <ListItem>Nested item a</ListItem>
        <ListItem>Nested item b</ListItem>
      </OrderedList>
    </ListItem>
    <ListItem>Third item</ListItem>
  </OrderedList>
</Content>
```

---

### Compound (dot-notation) usage

`ListItem` is also available as `OrderedList.Item`, so a list can be composed from the single `OrderedList` import.

```tsx live
<Content>
  <OrderedList>
    <OrderedList.Item>First item</OrderedList.Item>
    <OrderedList.Item>Second item</OrderedList.Item>
  </OrderedList>
</Content>
```

---

## Accessibility

- **List Structure:** Screen readers announce ordered lists with their numbering, helping users understand sequential content.
- **Semantic Markup:** Using proper `<ol>` and `<li>` elements ensures accessibility for all users.
- **Numbering Type:** The `type` attribute is announced by most screen readers, providing context about the list format.

:::info
Use `OrderedList` when the order of items is significant, such as steps in a process or ranked items.
:::

---

## Related Components

- [`UnorderedList`](./unorderedlist.md): For bulleted/unordered lists.
- [`ListItem`](./listitem.md): Individual list item component.
- [`Content`](./content.md): For rich typographic content including lists.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [MDN: ol element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol)
- [Storybook: OrderedList Stories](https://bestax.io/storybook/?path=/story/elements-orderedlist--default)
