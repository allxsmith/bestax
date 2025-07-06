---
title: Box
sidebar_label: Box
---

# Box

## Overview

The `Box` component renders a bordered, padded container with an optional shadow using Bulma's `.box` class. It's useful for visually separating content, callouts, or emphasizing important UI elements. Supports all Bulma helper props for color, spacing, and more.

:::info
By default, `Box` includes a subtle shadow. You can disable the shadow with `hasShadow={false}`.
:::

---

## Import

```tsx
import { Box } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                                                                                                                                                                                                                                                                     | Default | Description                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------ |
| `className` | `string`                                                                                                                                                                                                                                                                                 | —       | Additional CSS classes.                          |
| `textColor` | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Text color helper.                               |
| `color`     | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger'`                                                                                                                                                                                                                    | —       | Bulma color modifier for the box.                |
| `bgColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Background color helper.                         |
| `hasShadow` | `boolean`                                                                                                                                                                                                                                                                                | `true`  | Whether the box has a shadow.                    |
| `children`  | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | Content to render inside the box.                |
| ...         | All standard `<div>` and Bulma helper props                                                                                                                                                                                                                                              |         | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Default Box

```tsx
<Box>Default Box</Box>
```

### Primary Text Color

```tsx
<Box textColor="primary">Box with Primary Text</Box>
```

### Light Background

```tsx
<Box bgColor="grey-light">Box with Light Background</Box>
```

### No Shadow

```tsx
<Box hasShadow={false}>Box without Shadow</Box>
```

### Spacing and Alignment

```tsx
<Box m="4" p="4" textAlign="centered">
  Box with Margin, Padding, and Centered Text
</Box>
```

### Custom Class

```tsx
<Box className="custom-box-class">Box with Custom Class</Box>
```

### Viewport-Specific Text Color

```tsx
<Box textColor="primary" viewport="tablet">
  Box with Tablet-specific Primary Text
</Box>
```

### Interactive Box

```tsx
<Box textColor="success" bgColor="black" m="3" p="3" textAlign="right">
  Interactive Box
</Box>
```

---

## Accessibility

- **Content:** Use semantic HTML inside `Box` for best accessibility.
- **Shadow:** The shadow is purely visual and does not affect accessibility.
- **Contrast:** Ensure color combinations provide sufficient contrast.

:::tip
`Box` is perfect for card-like containers, callouts, or visually separating content.
:::

---

## Related Components

- [`Block`](./block.md): For simple vertical spacing between blocks of content.
- [`Content`](./content.md): For typographically styled rich content.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Bulma Box Documentation](https://bulma.io/documentation/elements/box/)
- [Storybook: Box Stories](https://bestax.cc/storybook/?path=/story/elements-box--default)
