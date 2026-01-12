---
title: UnorderedList
sidebar_label: UnorderedList
---

# UnorderedList

## Overview

The `UnorderedList` component renders a styled unordered list (`<ul>`) element with Bulma helper class integration. Use it with `ListItem` components to create bulleted lists with consistent styling.

:::info
The UnorderedList component is a thin wrapper around the HTML `<ul>` element, providing consistent Bulma styling and helper class support.
:::

---

## Import

```tsx
import { UnorderedList, ListItem } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                                                                                                                                                                                                                                                                     | Default | Description                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------ |
| `className` | `string`                                                                                                                                                                                                                                                                                 | —       | Additional CSS classes.                          |
| `textColor` | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Text color helper.                               |
| `bgColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Background color helper.                         |
| `children`  | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | List items to render inside the list.            |
| ...         | All standard `<ul>` and Bulma helper props                                                                                                                                                                                                                                               |         | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Default List

The default usage of the `UnorderedList` component with `ListItem` children.

```tsx live
<UnorderedList>
  <ListItem>First item</ListItem>
  <ListItem>Second item</ListItem>
  <ListItem>Third item</ListItem>
</UnorderedList>
```

### Colored List

Apply text color to all list items at once.

```tsx live
<UnorderedList textColor="primary">
  <ListItem>First item</ListItem>
  <ListItem>Second item</ListItem>
  <ListItem>Third item</ListItem>
</UnorderedList>
```

### List with Background

Add a background color and padding for a contained look.

```tsx live
<UnorderedList bgColor="light" p="4">
  <ListItem>First item</ListItem>
  <ListItem>Second item</ListItem>
  <ListItem>Third item</ListItem>
</UnorderedList>
```

### Nested Lists

Create nested lists for hierarchical content.

```tsx live
<UnorderedList>
  <ListItem>First item</ListItem>
  <ListItem>
    Second item with nested list
    <UnorderedList>
      <ListItem>Nested item 1</ListItem>
      <ListItem>Nested item 2</ListItem>
    </UnorderedList>
  </ListItem>
  <ListItem>Third item</ListItem>
</UnorderedList>
```

### Individually Colored Items

Apply different colors to individual list items.

```tsx live
<UnorderedList>
  <ListItem textColor="primary">Primary item</ListItem>
  <ListItem textColor="success">Success item</ListItem>
  <ListItem textColor="warning">Warning item</ListItem>
  <ListItem textColor="danger">Danger item</ListItem>
</UnorderedList>
```

---

## Accessibility

- **List Structure:** Screen readers announce the list and the number of items, helping users understand the content structure.
- **Semantic Markup:** Using proper `<ul>` and `<li>` elements ensures accessibility for all users.
- **Nesting:** Properly nested lists maintain correct semantics for assistive technologies.

:::info
Use `UnorderedList` when the order of items is not significant. For ordered content, use `OrderedList`.
:::

---

## Related Components

- [`OrderedList`](./orderedlist.md): For numbered/ordered lists.
- [`ListItem`](./listitem.md): Individual list item component.
- [`Content`](./content.md): For rich typographic content including lists.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [MDN: ul element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ul)
- [Storybook: UnorderedList Stories](https://bestax.io/storybook/?path=/story/elements-unorderedlist--default)
