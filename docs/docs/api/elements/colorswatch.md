---
title: ColorSwatch
sidebar_label: ColorSwatch
description: The `ColorSwatch` component shows a color as a small chip, named by its label or by the color itself.
---

# ColorSwatch

## Overview

<!-- bestax:generated overview -->

The `ColorSwatch` component shows a color as a small chip, named by its label or by the color itself.

<!-- /bestax:generated overview -->

Reach for it wherever a color is shown rather than chosen: beside a name in a list of labels or
categories, in a chart's legend, in a table of brand colors, or on a card that says which theme
it uses. To let people choose a color, use [`ColorPicker`](../form/colorpicker.md).

It's an image to a screen reader, named by its `label`, or by the color as written when there's
none, so the color is always there in words too.

:::info
Bulma has no swatch, so `ColorSwatch` brings its own styles, in `bestax.css` and its variants, or
in `extras.css` next to your own Bulma.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { ColorSwatch } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Give it a `color`, any CSS color, and a `label` that says what it is.

```tsx live
<ColorSwatch color="#1e6b99" label="Brand blue" />
```

### Sizes and Shapes

`size` makes it smaller or larger, and `isRounded` draws a circle.

```tsx live
<div>
  <ColorSwatch color="#00d1b2" label="Turquoise" size="small" mr="2" />
  <ColorSwatch color="#00d1b2" label="Turquoise" mr="2" />
  <ColorSwatch color="#00d1b2" label="Turquoise" size="medium" mr="2" />
  <ColorSwatch color="#00d1b2" label="Turquoise" size="large" isRounded />
</div>
```

### See-Through Colors

A color with alpha shows a checkerboard through it, so you can see how much shows through.

```tsx live
<div>
  <ColorSwatch
    color="rgba(255, 102, 133, 1)"
    label="Pink"
    size="large"
    mr="2"
  />
  <ColorSwatch
    color="rgba(255, 102, 133, 0.5)"
    label="Pink at 50%"
    size="large"
    mr="2"
  />
  <ColorSwatch color="transparent" label="Transparent" size="large" />
</div>
```

### Theme Colors

A CSS variable shows the page's own color, so a swatch follows a [`Theme`](../helpers/theme.md).
Give it a `label`: a screen reader would otherwise read the `var()`, and a development build warns.

```tsx live
<div>
  {['primary', 'link', 'info', 'success', 'warning', 'danger'].map(name => (
    <ColorSwatch
      key={name}
      color={`var(--bulma-${name})`}
      label={name}
      isRounded
      mr="2"
    />
  ))}
</div>
```

### Beside Its Value

Where the value is written next to the swatch, hide the swatch from assistive tech with
`aria-hidden`, so the color isn't read twice.

```tsx live
<Paragraph>
  <ColorSwatch color="#ff6685" size="small" aria-hidden mr="2" />
  <Code>#ff6685</Code>
</Paragraph>
```

---

## Accessibility

- **An image with a name:** it's `role="img"`, named by `label`, by `aria-label`, or by the color
  as written, such as "#1e6b99", so the color is never shown by color alone (WCAG 1.1.1 and
  1.4.1). A role passed in never wins.
- **Hidden where the value is written beside it:** `aria-hidden` keeps it out of the
  accessibility tree, and a development build stays quiet about a `var()` then.
- **What's drawn on it** (its children, such as an icon) is hidden from assistive tech.
- **An edge:** a faint ring in the text color keeps a white swatch visible on a white page and a
  black one on a dark page. Check WCAG 1.4.11's 3:1 yourself where the swatch is the only sign of
  something.
- **Forced colors:** it keeps its color (`forced-color-adjust: none`), since the color is the
  point, and takes an edge in the system's text color so it still stands apart from the page.

---

## Related Components

- [`ColorPicker`](../form/colorpicker.md): A panel for choosing a color, with swatches of its own.
- [`Tag`](./tag.md): A small label that takes a Bulma color.
- [`Theme`](../helpers/theme.md): Sets the theme colors a swatch can show.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: ColorSwatch Stories](https://bestax.io/storybook/?path=/story/elements-colorswatch--default)
- [WCAG 2.2: Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)
- [CSS Color Adjust: forced-color-adjust](https://drafts.csswg.org/css-color-adjust-1/#forced-color-adjust-prop)

---

## Props

<!-- bestax:generated props -->

| Prop          | Type                                                                    | Default | Description                                                                                                                                                                                     |
| ------------- | ----------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className`   | `string`                                                                | —       | Additional CSS classes to apply.                                                                                                                                                                |
| `color`       | `string`                                                                | —       | The color it shows: any CSS color, such as `#1e6b99`, `hsl(202, 67%, 36%)` or `var(--bulma-primary)`. A see-through color shows a checkerboard behind it.                                       |
| `label`       | `string`                                                                | —       | What the color is called, such as "Brand blue", read as the swatch's name in place of `color` as written. A `var()` reads as nothing useful, so a development build warns when one has no name. |
| `size`        | `'small'` \| `'medium'` \| `'large'`                                    | —       | The swatch's size.                                                                                                                                                                              |
| `isRounded`   | `boolean`                                                               | `false` | Draws a circle in place of a rounded square.                                                                                                                                                    |
| `children`    | `React.ReactNode`                                                       | —       | Drawn on the swatch, such as an icon. It's hidden from assistive tech, since the swatch is an image named by its label.                                                                         |
| `textColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper, the color of anything drawn on the swatch.                                                                                                                                   |
| `ref`         | `React.Ref<HTMLSpanElement>`                                            | —       | Ref forwarded to the `<span>`.                                                                                                                                                                  |
| `aria-label`  | `string`                                                                | —       | Names the swatch in place of `label`.                                                                                                                                                           |
| `aria-hidden` | `boolean`                                                               | —       | Hides the swatch from assistive tech, for one beside text that already names the color.                                                                                                         |
| `...`         | All standard `<span>` attributes and Bulma helper props                 | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                               |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`ColorSwatch` registers these variables on its own `.color-swatch` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                              | Sass Variable                      | Default                                                                    |
| ----------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------- |
| `--bulma-color-swatch-size`               | `$color-swatch-size`               | `1.5rem`                                                                   |
| `--bulma-color-swatch-radius`             | `$color-swatch-radius`             | `var(--bulma-radius)`                                                      |
| `--bulma-color-swatch-edge-color`         | `$color-swatch-edge-color`         | `hsla(var(--bulma-text-h), var(--bulma-text-s), var(--bulma-text-l), 0.2)` |
| `--bulma-color-swatch-checker-color`      | `$color-swatch-checker-color`      | `var(--bulma-border)`                                                      |
| `--bulma-color-swatch-checker-background` | `$color-swatch-checker-background` | `var(--bulma-scheme-main)`                                                 |
| `--bulma-color-swatch-checker-size`       | `$color-swatch-checker-size`       | `0.5rem`                                                                   |

<!-- /bestax:generated cssvars -->
