---
title: Button
sidebar_label: Button
---

# Button

## Overview

The `Button` component provides a flexible and highly customizable button for your Bulma React UI. It supports all Bulma color, size, and state modifiers, as well as additional helper classes for text color, spacing, and more. It can render as either a `<button>` or an `<a>` element, and is designed to be fully accessible and composable.

:::tip
Make sure to provide meaningful text or accessible content for screen readers.
:::

---

## Import

```tsx
import { Button } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop          | Type                                                                                                                                                                                                                                                                                     | Default    | Description                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------- |
| `color`       | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger'`                                                                                                                                                                                                                    | —          | Bulma color modifier for the button.                                       |
| `size`        | `'small' \| 'normal' \| 'medium' \| 'large'`                                                                                                                                                                                                                                             | —          | Button size.                                                               |
| `isLight`     | `boolean`                                                                                                                                                                                                                                                                                | `false`    | Use the light version of the color.                                        |
| `isRounded`   | `boolean`                                                                                                                                                                                                                                                                                | `false`    | Button is fully rounded.                                                   |
| `isLoading`   | `boolean`                                                                                                                                                                                                                                                                                | `false`    | Shows a loading spinner.                                                   |
| `isStatic`    | `boolean`                                                                                                                                                                                                                                                                                | `false`    | Non-interactive static button.                                             |
| `isFullWidth` | `boolean`                                                                                                                                                                                                                                                                                | `false`    | Button fills the width of its parent.                                      |
| `isOutlined`  | `boolean`                                                                                                                                                                                                                                                                                | `false`    | Outlined button style.                                                     |
| `isInverted`  | `boolean`                                                                                                                                                                                                                                                                                | `false`    | Inverted color style.                                                      |
| `isFocused`   | `boolean`                                                                                                                                                                                                                                                                                | `false`    | Styled as focused.                                                         |
| `isActive`    | `boolean`                                                                                                                                                                                                                                                                                | `false`    | Styled as active.                                                          |
| `isHovered`   | `boolean`                                                                                                                                                                                                                                                                                | `false`    | Styled as hovered.                                                         |
| `isDisabled`  | `boolean`                                                                                                                                                                                                                                                                                | `false`    | Disabled state. (also applies `aria-disabled` and disables pointer events) |
| `as`          | `'button' \| 'a'`                                                                                                                                                                                                                                                                        | `'button'` | Render as a `<button>` or `<a>` element.                                   |
| `href`        | `string`                                                                                                                                                                                                                                                                                 | —          | If `as="a"`, the href for the anchor link.                                 |
| `onClick`     | `function`                                                                                                                                                                                                                                                                               | —          | Click event handler.                                                       |
| `target`      | `string`                                                                                                                                                                                                                                                                                 | —          | Target for anchor element.                                                 |
| `rel`         | `string`                                                                                                                                                                                                                                                                                 | —          | Rel for anchor element.                                                    |
| `textColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —          | Text color helper (e.g., `'danger'` for `has-text-danger`).                |
| `bgColor`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —          | Background color helper (e.g., `'info'` for `has-background-info`).        |
| `className`   | `string`                                                                                                                                                                                                                                                                                 | —          | Additional CSS classes.                                                    |
| `children`    | `React.ReactNode`                                                                                                                                                                                                                                                                        | —          | Button content.                                                            |
| ...           | All standard `<button>` and Bulma helper props                                                                                                                                                                                                                                           |            | (See [Helper Props](../helpers/usebulmaclasses))                           |

---

## Usage

### Default Button

```tsx live
<Button>Default Button</Button>
```

### All Colors

```tsx live
import { Buttons } from './Buttons';

<Buttons>
  {['primary', 'link', 'info', 'success', 'warning', 'danger'].map(color => (
    <Button key={color} color={color}>
      {color.charAt(0).toUpperCase() + color.slice(1)}
    </Button>
  ))}
</Buttons>;
```

### All Sizes

```tsx live
<Buttons>
  {['small', 'normal', 'medium', 'large'].map(size => (
    <Button key={size} size={size}>
      {size.charAt(0).toUpperCase() + size.slice(1)}
    </Button>
  ))}
</Buttons>
```

### Light Variant

```tsx live
<Button color="primary" isLight>
  Light Primary Button
</Button>
```

### Rounded

```tsx live
<Button color="info" isRounded>
  Rounded Button
</Button>
```

### Loading

```tsx live
<Button color="success" isLoading>
  Loading Button
</Button>
```

### Static

```tsx live
<Button isStatic>Static Button</Button>
```

### Full Width

```tsx live
<Button color="warning" isFullWidth>
  Full Width Button
</Button>
```

### Outlined

```tsx live
<Button color="danger" isOutlined>
  Outlined Button
</Button>
```

### Inverted

```tsx live
<Button color="link" isInverted>
  Inverted Button
</Button>
```

### Focused

```tsx live
<Button color="primary" isFocused>
  Focused Button
</Button>
```

### Active

```tsx live
<Button color="info" isActive>
  Active Button
</Button>
```

### Hovered

```tsx live
<Button color="success" isHovered>
  Hovered Button
</Button>
```

### Disabled

```tsx live
<Button color="warning" isDisabled disabled>
  Disabled Button
</Button>
```

### Custom Text and Background Color

```tsx live
<Button textColor="danger" bgColor="info">
  Custom Text &amp; Background
</Button>
```

### Spacing Helpers

```tsx live
<Button m="2" p="3" mx="4" my="5" mt="1" mr="2" mb="3" ml="4">
  Button with Spacing
</Button>
```

### Text Alignment

```tsx live
<Button textAlign="centered">Centered Text Button</Button>
```

### Responsive Viewport

```tsx live
<Button viewport="mobile">Mobile Responsive Button</Button>
```

### Flexbox Layout

```tsx live
<Button display="flex" justifyContent="center" alignItems="center">
  Flex Button
</Button>
```

### Button Group

```tsx live
<Buttons hasAddons>
  <Button color="primary">Left</Button>
  <Button color="primary">Center</Button>
  <Button color="primary">Right</Button>
</Buttons>
```

### With HTML Attributes

```tsx live
<Button type="submit" className="custom-class">
  Submit Button
</Button>
```

---

## Accessibility

- **Labeling:** Always provide descriptive content for buttons for screen readers.
- **States:** The `isDisabled` and `disabled` props ensure correct `aria-disabled` and `disabled` attributes.
- **Keyboard:** When rendered as `<a>`, disabled buttons are not focusable.
- **Focus:** Use `isFocused` and `isActive` for visual feedback, but rely on browser focus for actual accessibility.

:::note
If your button has only an icon, use `aria-label` to provide accessible text.
:::

---

## Related Components

- [`Buttons`](./buttons.md): Group multiple buttons together, including add-ons and alignment.
- [`Icon`](../elements/icon.md): Inline icons for use inside buttons.
- [Helper Props](../helpers/usebulmaclasses.md): List of all supported Bulma helper props for spacing, colors, etc.

---

## Additional Resources

- [Bulma Button Documentation](https://bulma.io/documentation/elements/button/)
- [React Button Accessibility](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
- [Storybook: Button Stories](https://bestax.cc/storybook/?path=/story/elements-button--default)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Button />` for powerful utility-based styling.
:::
