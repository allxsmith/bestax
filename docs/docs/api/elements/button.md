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

The default usage of the `Button` component provides a standard clickable button with no additional modifiers. Use this for secondary actions or when you need a simple button without emphasis.

```tsx live
<Button>Default Button</Button>
```

### All Colors

This example shows all available `color` modifiers (`primary`, `link`, `info`, `success`, `warning`, `danger`). Use different colors to convey semantic meaning or highlight important actions.

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

Demonstrates the four size variants: `small`, `normal`, `medium`, and `large`. Choose the appropriate size for your layout and emphasis needs.

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

The `isLight` prop creates a softer, pastel version of the colored button. Use this for secondary actions that still need color coding but shouldn't compete with primary buttons.

```tsx live
<Button color="primary" isLight>
  Light Primary Button
</Button>
```

### Rounded

Adding `isRounded` creates a pill-shaped button with fully rounded corners. This modern styling works well for tags, chips, or contemporary interfaces.

```tsx live
<Button color="info" isRounded>
  Rounded Button
</Button>
```

### Loading

The `isLoading` prop displays a loading spinner and disables the button. Use this for asynchronous actions such as form submissions or API calls to indicate progress to the user.

```tsx live
<Button color="success" isLoading>
  Loading Button
</Button>
```

### Static

Static buttons with `isStatic` appear button-like but cannot be clicked or focused. They're useful for displaying button-styled text in read-only contexts or form previews.

```tsx live
<Button isStatic>Static Button</Button>
```

### Full Width

The `isFullWidth` prop makes the button span the entire width of its container. This is particularly useful in mobile layouts or card interfaces where you want the button to be prominent and easy to tap.

```tsx live
<Button color="warning" isFullWidth>
  Full Width Button
</Button>
```

### Outlined

Outlined buttons using `isOutlined` have transparent backgrounds with colored borders and text. They provide visual hierarchy while maintaining the color semantics—perfect for secondary actions that relate to primary colored buttons.

```tsx live
<Button color="danger" isOutlined>
  Outlined Button
</Button>
```

### Inverted

The `isInverted` modifier reverses the color scheme, creating light text on dark backgrounds. This is essential for buttons placed on colored backgrounds or in dark theme interfaces where standard buttons would have poor contrast.

```tsx live
<Button color="link" isInverted>
  Inverted Button
</Button>
```

### Focused

Shows the `isFocused` state styling that normally appears during keyboard navigation. This helps ensure your buttons provide clear visual feedback for accessibility and keyboard-only users.

```tsx live
<Button color="primary" isFocused>
  Focused Button
</Button>
```

### Active

The `isActive` state mimics the pressed appearance that occurs during clicks. You can use this to show when a button represents the current state or selection in toggle scenarios.

```tsx live
<Button color="info" isActive>
  Active Button
</Button>
```

### Hovered

Demonstrates the `isHovered` state that typically appears on mouse interaction. This preview helps you understand the interactive feedback users will experience when engaging with your buttons.

```tsx live
<Button color="success" isHovered>
  Hovered Button
</Button>
```

### Disabled

Disabled buttons using the `isDisabled` prop become non-interactive with reduced opacity. This clearly communicates when actions are unavailable while maintaining layout structure.

```tsx live
<Button color="warning" isDisabled disabled>
  Disabled Button
</Button>
```

### Custom Text and Background Color

Use the `textColor` and `bgColor` props to override default colors with custom combinations. This is useful for branding or highlighting special actions.

```tsx live
<Button textColor="danger" bgColor="info">
  Custom Text &amp; Background
</Button>
```

### Spacing Helpers

You can use Bulma spacing props like `m`, `p`, `mx`, `my`, `mt`, `mr`, `mb`, and `ml` to control margin and padding. This example demonstrates a button with various spacing helpers applied.

```tsx live
<Button m="2" p="3" mx="4" my="5" mt="1" mr="2" mb="3" ml="4">
  Button with Spacing
</Button>
```

### Text Alignment

The `textAlign` prop allows you to align the button's content. Here, the text is centered within the button.

```tsx live
<Button textAlign="centered">Centered Text Button</Button>
```

### Responsive Viewport

The `viewport` prop lets you apply modifiers at specific breakpoints. This example shows a button styled for mobile devices.

```tsx live
<Button viewport="mobile">Mobile Responsive Button</Button>
```

### Flexbox Layout

Use Bulma flexbox helpers like `display`, `justifyContent`, and `alignItems` to control the button's internal layout. This is useful for buttons with complex content or icon/text combinations.

```tsx live
<Button display="flex" justifyContent="center" alignItems="center">
  Flex Button
</Button>
```

### Button Group

Group multiple buttons together using the `Buttons` component and the `hasAddons` prop for connected button groups.

```tsx live
<Buttons hasAddons>
  <Button color="primary">Left</Button>
  <Button color="primary">Center</Button>
  <Button color="primary">Right</Button>
</Buttons>
```

### With HTML Attributes

You can pass standard HTML attributes and custom classes to the `Button` component for further customization or integration with forms.

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
