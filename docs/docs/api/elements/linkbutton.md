---
title: LinkButton
sidebar_label: LinkButton
---

# LinkButton

## Overview

The `LinkButton` component renders a `<button>` that visually looks like text or a link. It provides an accessible replacement for `<div onClick>` anti-patterns by wrapping the [`Button`](./button.md) component with `is-text` or `is-ghost` styling and CSS overrides.

**Two variants:**

- **`text`** — like Bulma's `is-text` button but without the underline. Hover shows a background highlight.
- **`ghost`** — like Bulma's `is-ghost` button but without the link color. Hover shows an underline.

Both variants support an optional `color` prop to set the text color.

:::tip
Use `LinkButton` instead of `<div onClick>` or unstyled click handlers to get proper keyboard navigation, focus handling, and screen reader support for free.
:::

---

## Import

```tsx
import { LinkButton } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop          | Type                                                                                                             | Default    | Description                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `variant`     | `'text' \| 'ghost' \| 'underline'`                                                                               | `'text'`   | Display mode. `text` has no underline; `ghost` uses default text color. |
| `color`       | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger' \| 'white' \| 'light' \| 'dark' \| 'black'` | —          | Text color override for the button.                                     |
| `size`        | `'small' \| 'normal' \| 'medium' \| 'large'`                                                                     | —          | Size of the button.                                                     |
| `isRounded`   | `boolean`                                                                                                        | —          | Makes the button rounded.                                               |
| `isLoading`   | `boolean`                                                                                                        | —          | Displays a loading spinner.                                             |
| `isStatic`    | `boolean`                                                                                                        | —          | Makes the button non-interactive.                                       |
| `isFullWidth` | `boolean`                                                                                                        | —          | Makes the button full-width.                                            |
| `isFocused`   | `boolean`                                                                                                        | —          | Applies focused styling (visual only).                                  |
| `isActive`    | `boolean`                                                                                                        | —          | Applies active styling (visual only).                                   |
| `isHovered`   | `boolean`                                                                                                        | —          | Applies hovered styling (visual only).                                  |
| `isDisabled`  | `boolean`                                                                                                        | —          | Applies disabled styling.                                               |
| `as`          | `'button' \| 'a'`                                                                                                | `'button'` | Render as a `<button>` or `<a>`.                                        |
| `href`        | `string`                                                                                                         | —          | Href value (if rendering as `<a>`).                                     |
| `onClick`     | `function`                                                                                                       | —          | Click event handler.                                                    |
| `className`   | `string`                                                                                                         | —          | Custom class name.                                                      |
| `children`    | `React.ReactNode`                                                                                                | —          | Button content.                                                         |
| ...           | All standard `<button>` and Bulma helper props                                                                   | —          | See [Helper Props](../helpers/usebulmaclasses.md)                       |

:::note
The `isOutlined`, `isInverted`, and `isLight` props from Button are not available on LinkButton — they don't apply to link-like buttons.
:::

---

## Usage

### Default (Text Variant)

The default variant renders a minimal text button without underline. On hover it shows a background highlight.

```tsx live
<LinkButton>Click me</LinkButton>
```

### Ghost Variant

The ghost variant renders a link-like button with default text color (not link color). On hover it shows an underline.

```tsx live
<LinkButton variant="ghost">Ghost LinkButton</LinkButton>
```

### Text Variant with Color

Add a `color` prop to set the text color. The hover behavior remains the same.

```tsx live
<LinkButton color="primary">Primary Text</LinkButton>
```

### Ghost Variant with Color

Colors work with the ghost variant too.

```tsx live
<LinkButton variant="ghost" color="danger">
  Danger Ghost
</LinkButton>
```

### All Colors

```tsx live
<Buttons>
  {['primary', 'link', 'info', 'success', 'warning', 'danger'].map(color => (
    <LinkButton key={color} color={color}>
      {color.charAt(0).toUpperCase() + color.slice(1)}
    </LinkButton>
  ))}
</Buttons>
```

### Disabled

```tsx live
<LinkButton isDisabled disabled>
  Disabled LinkButton
</LinkButton>
```

### All Sizes

```tsx live
<Buttons>
  {['small', 'normal', 'medium', 'large'].map(size => (
    <LinkButton key={size} size={size}>
      {size.charAt(0).toUpperCase() + size.slice(1)}
    </LinkButton>
  ))}
</Buttons>
```

---

## Visual Behavior

|                   | Default text color   | Hover                                 |
| ----------------- | -------------------- | ------------------------------------- |
| **text variant**  | `var(--bulma-text)`  | Background highlight, no underline    |
| **ghost variant** | `var(--bulma-text)`  | Underline appears                     |
| **+ color**       | Uses specified color | Same hover behavior, color maintained |

---

## Accessibility

- **Semantic HTML:** Renders a native `<button>` element, providing correct keyboard navigation, focus management, and screen reader announcements.
- **States:** The `isDisabled` and `disabled` props ensure correct `aria-disabled` and `disabled` attributes.
- **Keyboard:** Fully keyboard accessible with Enter and Space activation.
- **Replaces anti-patterns:** Use this instead of `<div onClick>` or `<span onClick>` for interactive elements that should not navigate.

:::note
If your LinkButton has only an icon, use `aria-label` to provide accessible text.
:::

---

## Related Components

- [`Button`](./button.md): Full-featured button with all Bulma styles.
- [`Buttons`](./buttons.md): Group multiple buttons together.
- [Helper Props](../helpers/usebulmaclasses.md): List of all supported Bulma helper props.

---

## Additional Resources

- [Bulma Button Documentation](https://bulma.io/documentation/elements/button/)
- [React Button Accessibility](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
- [Storybook: LinkButton Stories](https://bestax.io/storybook/?path=/story/elements-linkbutton--default)
