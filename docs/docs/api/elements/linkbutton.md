---
title: LinkButton
sidebar_label: LinkButton
description: The `LinkButton` component renders a `<button>` that visually looks like text or a link.
---

# LinkButton

## Overview

<!-- bestax:generated overview -->

The `LinkButton` component renders a `<button>` that visually looks like text or a link.

<!-- /bestax:generated overview -->

It provides an accessible replacement for `<div onClick>` anti-patterns by wrapping the [`Button`](./button.md) component with `is-text` or `is-ghost` styling and CSS overrides.

**Three variants:**

- **`text`** (default) — like Bulma's `is-text` button but without the underline. Hover shows a background highlight.
- **`ghost`** — like Bulma's `is-ghost` button but without the link color. Hover shows an underline.
- **`underline`** — no button chrome at all: transparent background and border, plain text color, and an underline on hover or focus.

All three support an optional `color` prop to set the text color.

:::tip
Use `LinkButton` instead of `<div onClick>` or unstyled click handlers to get proper keyboard navigation, focus handling, and screen reader support for free.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { LinkButton } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

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

### Underline Variant

The underline variant drops the button chrome entirely — transparent background and border, plain text color — and underlines on hover or focus. Use it for an inline action inside a sentence or a summary step ("go back and edit"), where a second solid button would compete with the primary one.

```tsx live
<LinkButton variant="underline">Go back and edit</LinkButton>
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

### Polymorphic `as` (Router Links)

Since `LinkButton` forwards its props to [`Button`](./button.md), it inherits the same polymorphic `as` prop — render it as a router's `Link` component to get a link-styled, a11y-friendly, client-side-navigating call to action.

```tsx
import { Link as RouterLink } from 'react-router-dom';
import { LinkButton } from '@allxsmith/bestax-bulma';

<LinkButton as={RouterLink} to="/dashboard" variant="underline">
  Go to Dashboard
</LinkButton>;
```

---

## Visual Behavior

|                       | Default text color   | Hover                                           |
| --------------------- | -------------------- | ----------------------------------------------- |
| **text variant**      | `var(--bulma-text)`  | Background highlight, no underline              |
| **ghost variant**     | `var(--bulma-text)`  | Underline appears                               |
| **underline variant** | `var(--bulma-text)`  | Underline appears, background stays transparent |
| **+ color**           | Uses specified color | Same hover behavior, color maintained           |

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

---

## Props

<!-- bestax:generated props -->

| Prop          | Type                                                                                                                               | Default    | Description                                                                                                                                                                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variant`     | `'text'` \| `'ghost'` \| `'underline'`                                                                                             | `'text'`   | Display mode. `text` has no underline and highlights its background on hover; `ghost` uses the default text color and underlines on hover; `underline` drops the button chrome entirely (transparent background and border) and underlines on hover or focus. |
| `color`       | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'white'` \| `'light'` \| `'dark'` \| `'black'` | —          | Text color override for the button.                                                                                                                                                                                                                           |
| `size`        | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                                                                                 | —          | Size of the button.                                                                                                                                                                                                                                           |
| `isRounded`   | `boolean`                                                                                                                          | `false`    | Makes the button rounded.                                                                                                                                                                                                                                     |
| `isLoading`   | `boolean`                                                                                                                          | `false`    | Displays a loading spinner.                                                                                                                                                                                                                                   |
| `isStatic`    | `boolean`                                                                                                                          | `false`    | Makes the button non-interactive.                                                                                                                                                                                                                             |
| `isFullwidth` | `boolean`                                                                                                                          | `false`    | Makes the button full-width.                                                                                                                                                                                                                                  |
| `isFullWidth` | `boolean`                                                                                                                          | `false`    | **Deprecated.** Use `isFullwidth` instead — `isFullwidth` wins if both are set. Makes the button full-width.                                                                                                                                                  |
| `isFocused`   | `boolean`                                                                                                                          | `false`    | Applies focused styling (visual only).                                                                                                                                                                                                                        |
| `isActive`    | `boolean`                                                                                                                          | `false`    | Applies active styling (visual only).                                                                                                                                                                                                                         |
| `isHovered`   | `boolean`                                                                                                                          | `false`    | Applies hovered styling (visual only).                                                                                                                                                                                                                        |
| `isDisabled`  | `boolean`                                                                                                                          | `false`    | Applies disabled styling.                                                                                                                                                                                                                                     |
| `className`   | `string`                                                                                                                           | —          | Custom class name.                                                                                                                                                                                                                                            |
| `textColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                            | —          | Text color helper.                                                                                                                                                                                                                                            |
| `bgColor`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                            | —          | Background color helper.                                                                                                                                                                                                                                      |
| `as`          | `React.ElementType`                                                                                                                | `'button'` | Render as a `<button>`, `<a>`, or a custom component (e.g. a router `Link`). Defaults to `'button'`; anything else (including `'a'`) uses anchor-style prop handling.                                                                                         |
| `href`        | `string`                                                                                                                           | —          | Href value (if rendering as `<a>`).                                                                                                                                                                                                                           |
| `onClick`     | `React.MouseEventHandler<HTMLButtonElement>` \| `React.MouseEventHandler<HTMLAnchorElement>`                                       | —          | Click event handler.                                                                                                                                                                                                                                          |
| `target`      | `string`                                                                                                                           | —          | Anchor tag target.                                                                                                                                                                                                                                            |
| `rel`         | `string`                                                                                                                           | —          | Anchor tag rel.                                                                                                                                                                                                                                               |
| `children`    | `React.ReactNode`                                                                                                                  | —          | Button content.                                                                                                                                                                                                                                               |
| `ref`         | `React.Ref<HTMLButtonElement \| HTMLAnchorElement>`                                                                                | —          | Ref forwarded to the rendered button or anchor element.                                                                                                                                                                                                       |
| `...`         | All standard `<button>` attributes and Bulma helper props                                                                          | —          | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                             |

<!-- /bestax:generated props -->

:::note
The `isOutlined`, `isInverted`, and `isLight` props from Button are not available on LinkButton — they don't apply to link-like buttons.
:::

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`LinkButton` registers these variables on a compound selector (higher specificity than a single class). Override them with inline `style`, or with a selector that exceeds that specificity (one that only matches it must load after the library styles to win by source order) — a lone class via `className` loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                              | Sass Variable                      | Default                    |
| ----------------------------------------- | ---------------------------------- | -------------------------- |
| `--bulma-link-button-underline-offset`    | `$link-button-underline-offset`    | `0.2em`                    |
| `--bulma-link-button-transition-duration` | `$link-button-transition-duration` | `var(--bulma-duration)`    |
| `--bulma-link-button-ghost-color`         | `$link-button-ghost-color`         | `var(--bulma-text)`        |
| `--bulma-link-button-ghost-hover-color`   | `$link-button-ghost-hover-color`   | `var(--bulma-text-strong)` |

<!-- /bestax:generated cssvars -->
