---
title: ListItem
sidebar_label: ListItem
---

# ListItem

## Overview

The `ListItem` component renders a styled list item (`<li>`) element with Bulma helper class integration. Use it inside `UnorderedList` or `OrderedList` components to create list items with consistent styling.

:::info
The ListItem component is a thin wrapper around the HTML `<li>` element, providing consistent Bulma styling and helper class support.
:::

---

## Import

```tsx
import { ListItem, UnorderedList, OrderedList } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                                                                                                                                                                                                                                                                     | Default | Description                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------ |
| `value`     | `number`                                                                                                                                                                                                                                                                                 | —       | Custom value for ordered list items.             |
| `className` | `string`                                                                                                                                                                                                                                                                                 | —       | Additional CSS classes.                          |
| `textColor` | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Text color helper.                               |
| `bgColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Background color helper.                         |
| `children`  | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | Content to render inside the list item.          |
| ...         | All standard `<li>` and Bulma helper props                                                                                                                                                                                                                                               |         | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Default List Item

The default usage of the `ListItem` component inside a list.

```tsx live
<UnorderedList>
  <ListItem>Default List Item</ListItem>
  <ListItem>Another item</ListItem>
</UnorderedList>
```

### Colored List Item

Apply text color to individual list items.

```tsx live
<UnorderedList>
  <ListItem textColor="primary">Primary item</ListItem>
  <ListItem textColor="success">Success item</ListItem>
  <ListItem textColor="warning">Warning item</ListItem>
  <ListItem textColor="danger">Danger item</ListItem>
</UnorderedList>
```

### List Item with Background

Add background color and padding for visual emphasis.

```tsx live
<UnorderedList>
  <ListItem bgColor="light" p="2">
    Item with background
  </ListItem>
  <ListItem>Normal item</ListItem>
</UnorderedList>
```

### Custom Value in Ordered List

Use the `value` prop to set a custom number in an ordered list.

```tsx live
<OrderedList>
  <ListItem>First item</ListItem>
  <ListItem value={10}>Tenth item (custom value)</ListItem>
  <ListItem>Eleventh item</ListItem>
</OrderedList>
```

### All Colors

Display list items in all Bulma theme colors.

```tsx live
<UnorderedList>
  <ListItem textColor="primary">Primary</ListItem>
  <ListItem textColor="link">Link</ListItem>
  <ListItem textColor="info">Info</ListItem>
  <ListItem textColor="success">Success</ListItem>
  <ListItem textColor="warning">Warning</ListItem>
  <ListItem textColor="danger">Danger</ListItem>
</UnorderedList>
```

### Spaced List Items

Use margin and padding helpers for custom spacing.

```tsx live
<UnorderedList>
  <ListItem mb="3" p="2" bgColor="light">
    Item with margin and padding
  </ListItem>
  <ListItem mb="3" p="2" bgColor="light">
    Another spaced item
  </ListItem>
  <ListItem p="2" bgColor="light">
    Last item
  </ListItem>
</UnorderedList>
```

### In Ordered List

ListItem works the same way in ordered lists.

```tsx live
<OrderedList>
  <ListItem>First item</ListItem>
  <ListItem textColor="success">Second item (success)</ListItem>
  <ListItem>Third item</ListItem>
</OrderedList>
```

---

## Accessibility

- **Semantic Markup:** Using proper `<li>` elements inside `<ul>` or `<ol>` ensures correct accessibility semantics.
- **Color Contrast:** When using colored text or backgrounds, ensure sufficient contrast for readability.
- **Screen Readers:** List items are announced as part of the list structure by screen readers.

:::info
Always use `ListItem` inside `UnorderedList` or `OrderedList` for proper semantic structure.
:::

---

## Related Components

- [`UnorderedList`](./unorderedlist.md): Parent component for bulleted lists.
- [`OrderedList`](./orderedlist.md): Parent component for numbered lists.
- [`Content`](./content.md): For rich typographic content including lists.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [MDN: li element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li)
- [Storybook: ListItem Stories](https://bestax.io/storybook/?path=/story/elements-listitem--default)
