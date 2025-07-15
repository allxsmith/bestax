---
title: Block
sidebar_label: Block
---

# Block

## Overview

The `Block` component renders a simple container with Bulma's `.block` class, adding vertical margin between sections of content. Use it for grouping or spacing elements, especially in forms or stacked layouts. It supports all Bulma helper props for color, spacing, and more.

:::info
Bulma’s `.block` adds margin-bottom. For visual separation, combine with color or background helpers.
:::

---

## Import

```tsx
import { Block } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                                                                                                                                                                                                                                                                     | Default | Description                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------ |
| `className` | `string`                                                                                                                                                                                                                                                                                 | —       | Additional CSS classes.                          |
| `textColor` | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Text color helper.                               |
| `color`     | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger'`                                                                                                                                                                                                                    | —       | Bulma color modifier for the block.              |
| `bgColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Background color helper.                         |
| `children`  | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | Content to render inside the block.              |
| ...         | All standard `<div>` and Bulma helper props                                                                                                                                                                                                                                              |         | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Default Block

```tsx live
<Block>Default Block</Block>
```

### Primary Text Color

```tsx live
<Block textColor="primary">Block with Primary Text</Block>
```

### Light Background

```tsx live
<Block bgColor="light">Block with Light Background</Block>
```

### Spacing and Alignment

```tsx live
<Block m="4" p="4" textAlign="centered">
  Block with Margin, Padding, and Centered Text
</Block>
```

### Custom Class

```tsx live
<Block className="custom-block-class">Block with Custom Class</Block>
```

### Viewport-Specific Text Color

```tsx live
<Block textColor="primary" viewport="tablet">
  Block with Tablet-specific Primary Text
</Block>
```

### Interactive Block with Multiple Props

```tsx live
<Block textColor="success" bgColor="dark" m="3" p="3" textAlign="right">
  Interactive Block
</Block>
```

### Stacked Blocks (Demonstrating Vertical Spacing)

:::note

The notificaiton blocks have zero margin bottom assigned to illustrate the spacing the blocks provide.

:::

```tsx live
<div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
  <Block>
    <Notification color="primary" mb={0}>
      First Block
    </Notification>
  </Block>
  <Block>
    <Notification color="info" mb={0}>
      Second Block
    </Notification>
  </Block>
  <Block>
    <Notification color="success" mb={0}>
      Third Block
    </Notification>
  </Block>
  <Block>
    <Notification color="warning" mb={0}>
      Fourth Block
    </Notification>
  </Block>
</div>
```

---

## Accessibility

- **Content:** Use semantic HTML inside `Block` for best accessibility.
- **Spacing:** The `.block` class is for layout only and does not affect accessibility.
- **Contrast:** Choose text and background colors for good readability.

:::info
Use `Block` for logical, visually separated sections of content.
:::

---

## Related Components

- [`Box`](./box.md): For bordered, padded containers.
- [`Content`](./content.md): For typographically styled rich content.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Bulma Block Documentation](https://bulma.io/documentation/elements/block/)
- [Storybook: Block Stories](https://bestax.cc/storybook/?path=/story/elements-block--default)
