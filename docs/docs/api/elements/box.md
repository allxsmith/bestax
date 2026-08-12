---
title: Box
sidebar_label: Box
description: The `Box` component renders a bordered, padded container with an optional shadow using Bulma's `.box` class.
---

# Box

## Overview

<!-- bestax:generated overview -->

The `Box` component renders a bordered, padded container with an optional shadow using Bulma's `.box` class.

<!-- /bestax:generated overview -->

It's useful for visually separating content, callouts, or emphasizing important UI elements. Supports all Bulma helper props for color, spacing, and more.

:::info
By default, `Box` includes a subtle shadow. You can disable the shadow with `hasShadow={false}`.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Box } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

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
- [Storybook: Box Stories](https://bestax.io/storybook/?path=/story/elements-box--default)

---

## Props

<!-- bestax:generated props -->

| Prop        | Type                                                                                                            | Default | Description                                                                                                                                                                                                                            |
| ----------- | --------------------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className` | `string`                                                                                                        | —       | Additional CSS classes to apply.                                                                                                                                                                                                       |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                         | —       | Text color helper.                                                                                                                                                                                                                     |
| `color`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`                                 | —       | Text color alias: renders `has-text-<color>`, exactly like `textColor`. Not a filled box variant (no `.box.is-<color>` CSS exists). Prefer `textColor`, which takes precedence when both are set; use `bgColor` for a colored surface. |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `(typeof validSchemeColors)[number]` \| `'inherit'` \| `'current'` | —       | Background color helper. `scheme-*` values render as a dark-mode-safe inline `background-color: var(--bulma-scheme-*)` instead of a class.                                                                                             |
| `hasShadow` | `boolean`                                                                                                       | `true`  | Whether the box has a shadow (default: true).                                                                                                                                                                                          |
| `children`  | `React.ReactNode`                                                                                               | —       | Content to render inside the box.                                                                                                                                                                                                      |
| `...`       | All standard `<div>` attributes and Bulma helper props                                                          | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                      |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Box` registers these variables on its own `.box` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                     | Sass Variable             | Default                                                                                                                                   |
| -------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--bulma-box-background-color`   | `$box-background-color`   | `var(--bulma-scheme-main)`                                                                                                                |
| `--bulma-box-color`              | `$box-color`              | `var(--bulma-text)`                                                                                                                       |
| `--bulma-box-radius`             | `$box-radius`             | `var(--bulma-radius-large)`                                                                                                               |
| `--bulma-box-shadow`             | `$box-shadow`             | `var(--bulma-shadow)`                                                                                                                     |
| `--bulma-box-padding`            | `$box-padding`            | `1.25rem`                                                                                                                                 |
| `--bulma-box-link-hover-shadow`  | `$box-link-hover-shadow`  | `0 0.5em 1em -0.125em hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-invert-l), 0.1), 0 0 0 1px var(--bulma-link)` |
| `--bulma-box-link-active-shadow` | `$box-link-active-shadow` | `inset 0 1px 2px hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-invert-l), 0.2), 0 0 0 1px var(--bulma-link)`      |

<!-- /bestax:generated cssvars -->
