---
title: ListItem
sidebar_label: ListItem
description: The `ListItem` component renders a styled list item (`<li>`) element with Bulma helper class integration.
---

# ListItem

## Overview

<!-- bestax:generated overview -->

The `ListItem` component renders a styled list item (`<li>`) element with Bulma helper class integration.

<!-- /bestax:generated overview -->

Use it inside `UnorderedList` or `OrderedList` components to create list items with consistent styling.

:::info
The ListItem component is a thin wrapper around the HTML `<li>` element, providing consistent Bulma styling and helper class support.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { ListItem, UnorderedList, OrderedList } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

:::info Wrap Lists in Content for Traditional Styling
Without a [`Content`](./content.md) wrapper, Bulma renders lists without the traditional margin, padding, and list-style markers (bullets, numbers). Wrap your lists in `<Content>` to get the expected typographic list appearance.
:::

### Default List Item

The default usage of the `ListItem` component inside a list.

```tsx live
<Content>
  <UnorderedList>
    <ListItem>Default List Item</ListItem>
    <ListItem>Another item</ListItem>
  </UnorderedList>
</Content>
```

### Colored List Item

Apply text color to individual list items.

```tsx live
<Content>
  <UnorderedList>
    <ListItem textColor="primary">Primary item</ListItem>
    <ListItem textColor="success">Success item</ListItem>
    <ListItem textColor="warning">Warning item</ListItem>
    <ListItem textColor="danger">Danger item</ListItem>
  </UnorderedList>
</Content>
```

### Custom Value in Ordered List

Use the `value` prop to set a custom number in an ordered list.

```tsx live
<Content>
  <OrderedList>
    <ListItem>First item</ListItem>
    <ListItem value={10}>Tenth item (custom value)</ListItem>
    <ListItem>Eleventh item</ListItem>
  </OrderedList>
</Content>
```

### All Colors

Display list items in all Bulma theme colors.

```tsx live
<Content>
  <UnorderedList>
    <ListItem textColor="primary">Primary</ListItem>
    <ListItem textColor="link">Link</ListItem>
    <ListItem textColor="info">Info</ListItem>
    <ListItem textColor="success">Success</ListItem>
    <ListItem textColor="warning">Warning</ListItem>
    <ListItem textColor="danger">Danger</ListItem>
  </UnorderedList>
</Content>
```

### Spaced List Items

Use margin helpers for custom spacing between items.

```tsx live
<Content>
  <UnorderedList>
    <ListItem mb="3">Item with extra bottom margin</ListItem>
    <ListItem mb="3">Another spaced item</ListItem>
    <ListItem>Last item</ListItem>
  </UnorderedList>
</Content>
```

### In Ordered List

ListItem works the same way in ordered lists.

```tsx live
<Content>
  <OrderedList>
    <ListItem>First item</ListItem>
    <ListItem textColor="success">Second item (success)</ListItem>
    <ListItem>Third item</ListItem>
  </OrderedList>
</Content>
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

---

## Props

<!-- bestax:generated props -->

| Prop        | Type                                                                    | Default | Description                                       |
| ----------- | ----------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `className` | `string`                                                                | —       | Additional CSS classes to apply.                  |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper.                                |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                          |
| `children`  | `React.ReactNode`                                                       | —       | Content to render inside the list item.           |
| `value`     | `number`                                                                | —       | Custom value for ordered list items.              |
| `...`       | All standard `<li>` attributes and Bulma helper props                   | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

<!-- /bestax:generated props -->
