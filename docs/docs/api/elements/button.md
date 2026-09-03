---
title: Button
sidebar_label: Button
description: The `Button` component provides a flexible and highly customizable button for your Bulma React UI.
---

# Button

## Overview

<!-- bestax:generated overview -->

The `Button` component provides a flexible and highly customizable button for your Bulma React UI.

<!-- /bestax:generated overview -->

It supports all Bulma color, size, and state modifiers, as well as additional helper classes for text, spacing, and more.

:::caution Accessibility
Use `Button` for real button actions (submit, toggle, open a dialog). For a link-styled click target or client-side navigation, prefer [`LinkButton`](./linkbutton.md) — using `Button` as a fake link/`<div onClick>` loses proper anchor and a11y semantics.
:::

:::tip
Make sure to provide meaningful text or accessible content for screen readers.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Button } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Default Button

This is the most fundamental use of the `Button` component, providing a simple yet stylish Bulma button for general actions. Use the default configuration (no extra props required) for forms, dialogs, toolbars, or anywhere you need a straightforward clickable action with Bulma’s default styling.

```tsx live
<Button>Default Button</Button>
```

### All Colors

By setting the `color` prop, you can style your button with any of Bulma's button colors. The semantic colors are `primary`, `link`, `info`, `success`, `warning`, and `danger`. Neutral colors are `white`, `light`, `dark`, and `black`. Special colors are `text` (minimal text-only button) and `ghost` (link-like button). This allows you to visually communicate the purpose of different actions—for example, use `success` for confirming, `danger` for destructive actions, or `ghost` for a button that looks like a link.

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

The `size` prop lets you adjust the button’s scale for various contexts. Supported values for `size` are `small`, `normal`, `medium`, and `large`. Use `small` for compact UIs, `large` for important calls to action, and `normal` or `medium` for general use.

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

Create a softer, pastel version of your button by adding the `isLight` prop. When combined with a `color`, such as `primary`, this produces a much lighter shade. This is useful for secondary actions or when you want your button to coordinate with your theme color without drawing too much attention.

```tsx live
<Button color="primary" isLight>
  Light Primary Button
</Button>
```

### Rounded

Enable the `isRounded` prop to give your button fully rounded edges. This style can help actions look friendlier and more approachable, and is often used in toolbars, cards, or to make special actions stand out visually.

```tsx live
<Button color="info" isRounded>
  Rounded Button
</Button>
```

### Loading

Set the `isLoading` prop to display a loading spinner inside the button. This is commonly used while waiting for an asynchronous operation, such as form submission or data fetching, providing user feedback and preventing multiple submissions. The button's content is replaced by the spinner while `isLoading` is active.

```tsx live
<Button color="success" isLoading>
  Loading Button
</Button>
```

### Static

When you need a button that looks interactive but isn’t clickable, use the `isStatic` prop. This makes the button non-interactive while retaining its visual appearance, which is useful for read-only forms, visual placeholders, or situations where you want to display a button-style element without enabling user actions.

```tsx live
<Button isStatic>Static Button</Button>
```

### Full Width

With the `isFullwidth` prop, your button will expand to completely fill the width of its parent container. This is useful for mobile layouts, modal footers, or anywhere you want your call-to-action to be easy to find and tap. (The `isFullWidth` spelling still works as a deprecated alias.)

```tsx live
<Button color="warning" isFullwidth>
  Full Width Button
</Button>
```

### Outlined

Use the `isOutlined` prop to give your button a simple outlined style instead of a solid fill. This works in conjunction with the `color` prop and is ideal for secondary actions. The possible values for `color` here are the same as above: `primary`, `link`, `info`, `success`, `warning`, or `danger`.

```tsx live
<Button color="danger" isOutlined>
  Outlined Button
</Button>
```

### Inverted

The `isInverted` prop inverts the button’s color, making it suitable for placement on colored backgrounds. When paired with a `color` (such as `link`), it ensures the button maintains contrast and legibility regardless of the surrounding layout.

```tsx live
<Button color="link" isInverted>
  Inverted Button
</Button>
```

### Focused

Show a focused state by enabling the `isFocused` prop. This can help demonstrate keyboard navigation and accessibility features, as it visually marks which button is currently focused in the UI.

```tsx live
<Button color="primary" isFocused>
  Focused Button
</Button>
```

### Active

The `isActive` prop highlights the button as currently pressed or selected. This is useful in toggle groups, tab bars, or any situation where you need to indicate the active choice to your users.

```tsx live
<Button color="info" isActive>
  Active Button
</Button>
```

### Hovered

By setting the `isHovered` prop, you can force the button to display its hover style. This can be useful for UI previews, tutorials, or custom scenarios where you want to visually indicate what happens on mouseover, without requiring actual pointer interaction.

```tsx live
<Button color="success" isHovered>
  Hovered Button
</Button>
```

### Ghost

Use `color="ghost"` to render a button that looks like a link but behaves as a `<button>`. This is useful when you need an action trigger (not navigation) that visually blends with surrounding text, without resorting to a `<div onClick>` pattern.

```tsx live
<Button color="ghost">Ghost Button</Button>
```

### Text

Use `color="text"` to render a minimal text-only button with no background or border. This is ideal for subtle actions in toolbars or inline contexts where a standard button would be too prominent.

```tsx live
<Button color="text">Text Button</Button>
```

### Disabled

To make a button both visually and functionally inactive, use the `isDisabled` prop and add the native `disabled` attribute. This prevents all user interaction and applies appropriate styling and accessibility attributes, clearly communicating that the action is unavailable.

```tsx live
<Button color="warning" isDisabled disabled>
  Disabled Button
</Button>
```

### Custom Text and Background Color

With the `textColor` and `bgColor` props, you can independently set the button’s foreground and background colors. Accepted values for both are any Bulma color, such as `primary`, `info`, `danger`, etc. This approach lets you create unique, branded, or visually striking button styles beyond the defaults.

```tsx live
<Button textColor="danger" bgColor="info">
  Custom Text &amp; Background
</Button>
```

### Spacing Helpers

Add margin and padding to your button using Bulma’s spacing helper props: `m`, `p`, `mx`, `my`, `mt`, `mr`, `mb`, and `ml`. These accept numeric values (e.g., `2`, `4`), letting you fine-tune the space around your button directly from props, without custom CSS.

```tsx live
<Button m="2" p="3" mx="4" my="5" mt="1" mr="2" mb="3" ml="4">
  Button with Spacing
</Button>
```

### Text Alignment

Control the horizontal alignment of the button’s text using the `textAlign` prop. Possible values are `centered`, `justified`, `left`, and `right`. This is especially useful for full-width or toolbar buttons where text alignment matters for readability and style.

```tsx live
<Button textAlign="centered">Centered Text Button</Button>
```

### Responsive Viewport

The `viewport` prop allows you to apply responsive styles for specific breakpoints. Accepted values include `mobile`, `tablet`, `desktop`, `widescreen`, and `fullhd`. This makes it easy to tailor your button’s appearance for different devices and screen sizes.

```tsx live
<Button viewport="mobile">Mobile Responsive Button</Button>
```

### Flexbox Layout

Bulma’s flexbox helpers, like `display="flex"`, `justifyContent`, and `alignItems`, can be applied as props. For `justifyContent`, use `center`, `start`, `end`, `space-between`, `space-around`, or `space-evenly`; for `alignItems`, use `center`, `start`, `end`, `baseline`, or `stretch`. This lets you precisely control the layout of button content, such as centering icons and text.

```tsx live
<Button display="flex" justifyContent="center" alignItems="center">
  Flex Button
</Button>
```

### Button Group

Group multiple buttons together using the `<Buttons hasAddons>` component. The `hasAddons` prop ensures the buttons are visually connected, making it perfect for toolbars, segmented controls, or navigation layouts where related actions need to be grouped as a unit.

```tsx live
<Buttons hasAddons>
  <Button color="primary">Left</Button>
  <Button color="primary">Center</Button>
  <Button color="primary">Right</Button>
</Buttons>
```

### With HTML Attributes

You can pass any standard HTML attributes to the Button component, such as `type` (possible values: `button`, `submit`, or `reset`) and `className`. This ensures compatibility with forms, accessibility tooling, and integration with other React libraries.

```tsx live
<Button type="submit" className="custom-class">
  Submit Button
</Button>
```

### Polymorphic `as` (Router Links)

The `as` prop accepts any `React.ElementType`, not just `'button'` or `'a'`. This lets `Button` render as a router's `Link` component (React Router, Next.js, TanStack Router, etc.) while keeping Bulma's button styling and real anchor semantics — `href`, middle-click, right-click "copy link", and correct accessibility all keep working, unlike a `useNavigate()`-in-`onClick` wrapper.

```tsx
import { Link as RouterLink } from 'react-router-dom';
import { Button } from '@allxsmith/bestax-bulma';

<Button as={RouterLink} to="/visit" color="primary">
  Book a visit
</Button>;
```

When `as` is anything other than `'button'` (including `'a'` or a custom component), `Button` strips button-only HTML attributes (`type`, `disabled`, `form`, etc.) before spreading the remaining props onto the rendered element, so they don't leak onto a link-like component.

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
- [Storybook: Button Stories](https://bestax.io/storybook/?path=/story/elements-button--default)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Button />` for powerful utility-based styling.
:::

---

## Props

<!-- bestax:generated props -->

| Prop          | Type                                                                                                                                                        | Default    | Description                                                                                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `color`       | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'white'` \| `'light'` \| `'dark'` \| `'black'` \| `'text'` \| `'ghost'` | —          | Bulma color variant for the button. `ghost` renders a link-like button; `text` renders a minimal text-only button.                                                    |
| `size`        | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                                                                                                          | —          | Size of the button.                                                                                                                                                   |
| `isLight`     | `boolean`                                                                                                                                                   | `false`    | Applies a lighter color variant.                                                                                                                                      |
| `isRounded`   | `boolean`                                                                                                                                                   | `false`    | Makes the button rounded.                                                                                                                                             |
| `isLoading`   | `boolean`                                                                                                                                                   | `false`    | Displays a loading spinner.                                                                                                                                           |
| `isStatic`    | `boolean`                                                                                                                                                   | `false`    | Makes the button non-interactive.                                                                                                                                     |
| `isFullwidth` | `boolean`                                                                                                                                                   | `false`    | Makes the button full-width.                                                                                                                                          |
| `isFullWidth` | `boolean`                                                                                                                                                   | `false`    | **Deprecated.** Use `isFullwidth` instead — `isFullwidth` wins if both are set. Makes the button full-width.                                                          |
| `isOutlined`  | `boolean`                                                                                                                                                   | `false`    | Applies outlined styling (requires color).                                                                                                                            |
| `isInverted`  | `boolean`                                                                                                                                                   | `false`    | Applies inverted styling (requires color).                                                                                                                            |
| `isFocused`   | `boolean`                                                                                                                                                   | `false`    | Applies focused styling (visual only).                                                                                                                                |
| `isActive`    | `boolean`                                                                                                                                                   | `false`    | Applies active styling (visual only).                                                                                                                                 |
| `isHovered`   | `boolean`                                                                                                                                                   | `false`    | Applies hovered styling (visual only).                                                                                                                                |
| `isDisabled`  | `boolean`                                                                                                                                                   | `false`    | Applies disabled styling.                                                                                                                                             |
| `className`   | `string`                                                                                                                                                    | —          | Custom class name.                                                                                                                                                    |
| `textColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                                                     | —          | Text color helper.                                                                                                                                                    |
| `bgColor`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                                                     | —          | Background color helper.                                                                                                                                              |
| `as`          | `React.ElementType`                                                                                                                                         | `'button'` | Render as a `<button>`, `<a>`, or a custom component (e.g. a router `Link`). Defaults to `'button'`; anything else (including `'a'`) uses anchor-style prop handling. |
| `href`        | `string`                                                                                                                                                    | —          | Href value (if rendering as `<a>`).                                                                                                                                   |
| `onClick`     | `React.MouseEventHandler<HTMLButtonElement>` \| `React.MouseEventHandler<HTMLAnchorElement>`                                                                | —          | Click event handler.                                                                                                                                                  |
| `target`      | `string`                                                                                                                                                    | —          | Anchor tag target.                                                                                                                                                    |
| `rel`         | `string`                                                                                                                                                    | —          | Anchor tag rel.                                                                                                                                                       |
| `children`    | `React.ReactNode`                                                                                                                                           | —          | Button content.                                                                                                                                                       |
| `ref`         | `React.Ref<HTMLButtonElement \| HTMLAnchorElement>`                                                                                                         | —          | Ref forwarded to the rendered button or anchor element.                                                                                                               |
| `...`         | All standard `<button>` attributes and Bulma helper props                                                                                                   | —          | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                     |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Button` registers these variables on its own `.button` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                 | Sass Variable                         | Default                                                                               |
| -------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------- |
| `--bulma-button-family`                      | `$button-family`                      | `false`                                                                               |
| `--bulma-button-weight`                      | `$button-weight`                      | `var(--bulma-weight-medium)`                                                          |
| `--bulma-button-border-color`                | `$button-border-color`                | `var(--bulma-border)`                                                                 |
| `--bulma-button-border-style`                | `$button-border-style`                | `solid`                                                                               |
| `--bulma-button-border-width`                | `$button-border-width`                | `var(--bulma-control-border-width)`                                                   |
| `--bulma-button-padding-vertical`            | `$button-padding-vertical`            | `0.5em`                                                                               |
| `--bulma-button-padding-horizontal`          | `$button-padding-horizontal`          | `1em`                                                                                 |
| `--bulma-button-focus-border-color`          | `$button-focus-border-color`          | `var(--bulma-link-focus-border)`                                                      |
| `--bulma-button-focus-box-shadow-size`       | `$button-focus-box-shadow-size`       | `0 0 0 0.125em`                                                                       |
| `--bulma-button-focus-box-shadow-color`      | `$button-focus-box-shadow-color`      | `hsla(var(--bulma-link-h), var(--bulma-link-s), var(--bulma-link-on-scheme-l), 0.25)` |
| `--bulma-button-active-color`                | `$button-active-color`                | `var(--bulma-link-active)`                                                            |
| `--bulma-button-active-border-color`         | `$button-active-border-color`         | `var(--bulma-link-active-border)`                                                     |
| `--bulma-button-text-color`                  | `$button-text-color`                  | `var(--bulma-text)`                                                                   |
| `--bulma-button-text-decoration`             | `$button-text-decoration`             | `underline`                                                                           |
| `--bulma-button-text-hover-background-color` | `$button-text-hover-background-color` | `var(--bulma-background)`                                                             |
| `--bulma-button-text-hover-color`            | `$button-text-hover-color`            | `var(--bulma-text-strong)`                                                            |
| `--bulma-button-ghost-background`            | `$button-ghost-background`            | `none`                                                                                |
| `--bulma-button-ghost-border-color`          | `$button-ghost-border-color`          | `transparent`                                                                         |
| `--bulma-button-ghost-color`                 | `$button-ghost-color`                 | `var(--bulma-link-text)`                                                              |
| `--bulma-button-ghost-decoration`            | `$button-ghost-decoration`            | `none`                                                                                |
| `--bulma-button-ghost-hover-color`           | `$button-ghost-hover-color`           | `var(--bulma-link)`                                                                   |
| `--bulma-button-ghost-hover-decoration`      | `$button-ghost-hover-decoration`      | `underline`                                                                           |
| `--bulma-button-disabled-background-color`   | `$button-disabled-background-color`   | `var(--bulma-scheme-main)`                                                            |
| `--bulma-button-disabled-border-color`       | `$button-disabled-border-color`       | `var(--bulma-border)`                                                                 |
| `--bulma-button-disabled-shadow`             | `$button-disabled-shadow`             | `none`                                                                                |
| `--bulma-button-disabled-opacity`            | `$button-disabled-opacity`            | `0.5`                                                                                 |
| `--bulma-button-static-color`                | `$button-static-color`                | `var(--bulma-text-weak)`                                                              |
| `--bulma-button-static-background-color`     | `$button-static-background-color`     | `var(--bulma-scheme-main-ter)`                                                        |
| `--bulma-button-static-border-color`         | `$button-static-border-color`         | `var(--bulma-border)`                                                                 |
| `--bulma-button-h`                           | `$button-h`                           | `var(--bulma-scheme-h)`                                                               |
| `--bulma-button-s`                           | `$button-s`                           | `var(--bulma-scheme-s)`                                                               |
| `--bulma-button-l`                           | `$button-l`                           | `var(--bulma-scheme-main-l)`                                                          |
| `--bulma-button-background-l`                | `$button-background-l`                | `var(--bulma-scheme-main-l)`                                                          |
| `--bulma-button-background-l-delta`          | `$button-background-l-delta`          | `0%`                                                                                  |
| `--bulma-button-hover-background-l-delta`    | `$button-hover-background-l-delta`    | `var(--bulma-hover-background-l-delta)`                                               |
| `--bulma-button-active-background-l-delta`   | `$button-active-background-l-delta`   | `var(--bulma-active-background-l-delta)`                                              |
| `--bulma-button-color-l`                     | `$button-color-l`                     | `var(--bulma-text-strong-l)`                                                          |
| `--bulma-button-border-l`                    | `$button-border-l`                    | `var(--bulma-border-l)`                                                               |
| `--bulma-button-border-l-delta`              | `$button-border-l-delta`              | `0%`                                                                                  |
| `--bulma-button-hover-border-l-delta`        | `$button-hover-border-l-delta`        | `var(--bulma-hover-border-l-delta)`                                                   |
| `--bulma-button-active-border-l-delta`       | `$button-active-border-l-delta`       | `var(--bulma-active-border-l-delta)`                                                  |
| `--bulma-button-focus-border-l-delta`        | `$button-focus-border-l-delta`        | `var(--bulma-focus-border-l-delta)`                                                   |
| `--bulma-button-outer-shadow-h`              | `$button-outer-shadow-h`              | `0`                                                                                   |
| `--bulma-button-outer-shadow-s`              | `$button-outer-shadow-s`              | `0%`                                                                                  |
| `--bulma-button-outer-shadow-l`              | `$button-outer-shadow-l`              | `20%`                                                                                 |
| `--bulma-button-outer-shadow-a`              | `$button-outer-shadow-a`              | `0.05`                                                                                |
| `--bulma-loading-color`                      | —                                     | `hsl(var(--bulma-button-h), var(--bulma-button-s), var(--bulma-button-color-l))`      |

<!-- /bestax:generated cssvars -->
