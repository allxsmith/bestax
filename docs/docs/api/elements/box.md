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

The default usage of the `Box` component creates a bordered, padded container with a subtle shadow. Use this for grouping related content, highlighting sections, or providing visual separation in your layout.

```tsx live
<Box>Default Box</Box>
```

### Primary Text Color

Set the text color using the `textColor` prop. For example, `textColor="primary"` applies Bulma's primary color to the text inside the box, making it stand out for emphasis or branding.

```tsx live
<Box textColor="primary">Box with Primary Text</Box>
```

### Light Background

Apply a background color using the `bgColor` prop. Here, `bgColor="grey-light"` gives the box a subtle light background, making its content stand out from the rest of the page.

```tsx live
<Box bgColor="grey-light">Box with Light Background</Box>
```

### No Shadow

Disable the default shadow using the `hasShadow={false}` prop. This is helpful when you want a flatter appearance or need to match a minimal design.

```tsx live
<Box hasShadow={false}>Box without Shadow</Box>
```

### Spacing and Alignment

You can use Bulma helper props like `m`, `p`, and `textAlign` to control margin, padding, and text alignment. This example centers the text and adds margin and padding for a visually balanced box.

```tsx live
<Box m="4" p="4" textAlign="centered">
  Box with Margin, Padding, and Centered Text
</Box>
```

### Custom Class

Add your own CSS classes with the `className` prop to further customize the box's appearance or behavior, such as adding custom backgrounds or effects.

```tsx live
<Box className="custom-box-class">Box with Custom Class</Box>
```

### Viewport-Specific Text Color

The `viewport` prop lets you apply color or other helpers at specific breakpoints. Here, `textColor="primary"` is only applied on tablet and larger screens, making the box adapt to different devices.

```tsx live
<Box textColor="primary" viewport="tablet">
  Box with Tablet-specific Primary Text
</Box>
```

### Interactive Box

Combine multiple props such as `textColor`, `bgColor`, `m`, `p`, and `textAlign` to create visually distinct and interactive boxes for advanced layouts or callouts.

```tsx live
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
