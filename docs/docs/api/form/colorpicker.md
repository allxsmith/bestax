---
title: ColorPicker
sidebar_label: ColorPicker
description: 'The `ColorPicker` component is a panel for choosing a color: a saturation and brightness square, a hue slider, and the value as text, with alpha and swatches when asked for.'
---

# ColorPicker

## Overview

<!-- bestax:generated overview -->

The `ColorPicker` component is a panel for choosing a color: a saturation and brightness square, a hue slider, and the value as text, with alpha and swatches when asked for.

<!-- /bestax:generated overview -->

Reach for it wherever people choose a color on the page itself: a brand color in a settings
page, the color of a label or a calendar, or a chart series. Drag in the square for saturation and
brightness, pick the hue on the slider below it, or type a value into the field. Every part works
from the keyboard, and the value is a CSS color string you can save, send with a form, or hand to
[`Theme`](../helpers/theme.md).

The value is written in HSL by default, the way Bulma builds its own colors, or in hex or RGB with
`format`. `alpha` adds a slider for transparency, `swatches` adds preset colors, and the parts let
you lay it out your own way.

:::info
Bulma has no color picker, so `ColorPicker` brings its own styles, in `bestax.css` and its
variants, or in `extras.css` next to your own Bulma.
:::

:::tip No JavaScript needed?
For a plain color well, the browser's own `<Input type="color" />` works with no picker at all. It
can't be empty, takes alpha only in Safari, offers fixed colors only in Firefox for Android, and
gives hex only. See [`Input`](./input.md#choosing-a-color).
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { ColorPicker } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Give it a `label` and, uncontrolled, a `defaultValue`. Without one it starts on black.

```tsx live
<ColorPicker label="Brand color" defaultValue="hsl(202, 67%, 36%)" />
```

### Formats

`format` writes the value as `hsl` (the default), `hex` or `rgb`. A value you give it can be in
any of them, or a CSS color name; what it hands back is always in `format`.

```tsx live
<Columns>
  {(['hsl', 'hex', 'rgb'] as const).map(format => (
    <Column key={format} isNarrow>
      <ColorPicker label={format} format={format} defaultValue="tomato" />
    </Column>
  ))}
</Columns>
```

### Alpha

`alpha` adds a slider for transparency and writes it into the value: `hsla()`, `#rrggbbaa` or
`rgba()`. Without it, the value is always solid.

```tsx live
<ColorPicker label="Highlight" alpha defaultValue="hsla(171, 100%, 41%, 0.6)" />
```

### Swatches

`swatches` adds preset colors, a string each or `{ color, label }` with a name a screen reader
says and a tooltip shows. They're a radio group: the arrow keys move between them and choose.

```tsx live
<ColorPicker
  label="Label color"
  format="hex"
  defaultValue="#00d1b2"
  swatches={[
    { color: '#1e6b99', label: 'Ocean' },
    { color: '#00d1b2', label: 'Turquoise' },
    { color: '#ff6685', label: 'Pink' },
    { color: '#ffdd57', label: 'Sunflower' },
    { color: '#4a4a4a', label: 'Charcoal' },
  ]}
/>
```

### The Page's Theme Colors

`swatches="bulma"` shows the page's primary, link, info, success, warning and danger, read from
Bulma's CSS variables once the picker is on the page, so a themed app shows its own. Their names
are English; in another language, pass the same list yourself:
`{ color: 'var(--bulma-primary)', label: 'Primär' }`.

```tsx live
<ColorPicker label="Accent" swatches="bulma" />
```

### Controlled, and Saving When Done

`onChange` fires on every step of a drag, so the value on screen follows the pointer.
`onChangeEnd` fires once a change is done, when the drag ends, or with `onChange` for a key, a
swatch or a typed value, which makes it the place to save.

```tsx live
function example() {
  const [color, setColor] = useState('hsl(348, 86%, 61%)');
  const [saved, setSaved] = useState(color);
  return (
    <>
      <ColorPicker
        label="Danger"
        value={color}
        onChange={setColor}
        onChangeEnd={setSaved}
      />
      <Paragraph mt="3">
        Showing <Code>{color}</Code>, saved <Code>{saved}</Code>
      </Paragraph>
    </>
  );
}
```

### Theming With It

An HSL value splits straight into the channels [`Theme`](../helpers/theme.md) takes, so a picker
can set a page's primary color.

```tsx live
function example() {
  const [brand, setBrand] = useState('hsl(202, 67%, 36%)');
  const [h, s, l] = brand.match(/[\d.]+/g) ?? [];
  return (
    <Columns>
      <Column isNarrow>
        <ColorPicker label="Primary" value={brand} onChange={setBrand} />
      </Column>
      <Column>
        <Theme primaryH={h} primaryS={`${s}%`} primaryL={`${l}%`}>
          <Buttons>
            <Button color="primary">Primary</Button>
            <Button color="primary" isOutlined>
              Outlined
            </Button>
          </Buttons>
        </Theme>
      </Column>
    </Columns>
  );
}
```

### Picking From the Screen

`eyeDropper` adds a button that picks a color from anywhere on the screen, where the browser has
the EyeDropper API, which today is desktop Chromium. Elsewhere the button isn't there.

```tsx live
<ColorPicker label="Sample a color" eyeDropper />
```

### In a Form

With `name`, a hidden input sends the value with the form. Inside a disabled
[`Fieldset`](./fieldset.md), or with `disabled`, every part is off.

```tsx live
<form onSubmit={event => event.preventDefault()}>
  <ColorPicker label="Calendar color" name="calendarColor" format="hex" />
  <ColorPicker label="Locked" disabled defaultValue="#ff6685" />
</form>
```

### Right to Left

In a right-to-left page the square's saturation and the sliders run from the right, and the arrow
keys follow the screen. Inside a [`LocaleProvider`](../helpers/localeprovider.md) with a `locale`,
the numbers it says are written in that locale; `labels` translates the words.

```tsx live
<LocaleProvider locale="ar" dir="rtl">
  <ColorPicker
    label="اللون"
    labels={{
      area: 'التشبع والسطوع',
      saturation: 'التشبع',
      brightness: 'السطوع',
      hue: 'تدرج اللون',
      value: 'قيمة اللون',
    }}
    defaultValue="hsl(150, 60%, 40%)"
  />
</LocaleProvider>
```

### Compound (dot-notation) usage

The parts make a layout of your own: `ColorPicker.Area`, `ColorPicker.HueSlider`,
`ColorPicker.AlphaSlider`, `ColorPicker.Swatches` and `ColorPicker.Input`, with anything else
between them. They share the color of the `ColorPicker` around them, and each is also exported on
its own, as `ColorPickerArea` and so on. Keep `ColorPicker.Input` in unless the value is shown as
text some other way.

```tsx live
<ColorPicker
  aria-label="Accent"
  format="hex"
  defaultValue="#00d1b2"
  swatches={['#1e6b99', '#00d1b2', '#ff6685', '#ffdd57']}
>
  <ColorPicker.Swatches />
  <ColorPickerArea />
  <ColorPicker.HueSlider />
  <ColorPicker.Input />
</ColorPicker>
```

---

## Accessibility

- **The square is one 2D slider made of two native range inputs**, saturation and brightness,
  the way React Aria builds it. Only the input for the axis moved last is a tab stop, and the
  other is hidden until a key moves it, so a screen reader lists one control, "Saturation and
  brightness, 2D slider", with value text such as "Saturation 50%, Brightness 80%", the moved
  channel first. On a touch device both inputs stay exposed, so a touch screen reader can adjust
  each with its own gestures.
- **Keys in the square:** the arrows move by 1, with Shift by 10; Page Up and Page Down move
  brightness by 10, and Home and End move saturation by 10. Focus follows the axis a key moved.
- **The sliders** are native range inputs named "Hue" and "Alpha", read as "171 degrees" and
  "50%". The arrows step by 1, with Shift or Page Up and Page Down by 10, and Home and End go to
  the ends.
- **Right to left,** the horizontal arrows follow the screen.
- **Pointer:** a press anywhere on the square or a track sets the value there, so nothing needs a
  drag (WCAG 2.5.7), and the sliders, the square and the swatch buttons are at least 24 by 24 CSS
  pixels (WCAG 2.5.8).
- **Swatches** are a radio group named "Swatches": each swatch is a radio named by its label or
  its color, the chosen one checked and marked by a check and a ring as well as its color.
- **The value is always in words:** the field shows it and takes a typed color, and a value it
  can't read is marked invalid and put back when you leave the field.
- **The group** is named by its `label`, or by `aria-label`.
- **Strings** come from `labels`, with English defaults.
- **Forced colors:** the square, the tracks and the swatches keep their colors with an edge in the
  system's text color, and the chosen swatch's ring is drawn in the system's highlight color.
- **The eye dropper** button is named "Pick a color from the screen" and only appears where the
  browser can do it.

---

## Related Components

- [`ColorSwatch`](../elements/colorswatch.md): Shows a color without choosing one.
- [`Input`](./input.md#choosing-a-color): `type="color"`, the browser's own color well, with no JavaScript.
- [`Slider`](./slider.md): A range of numbers rather than of colors.
- [`Theme`](../helpers/theme.md): Takes an HSL value's channels to theme a page.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: ColorPicker Stories](https://bestax.io/storybook/?path=/story/form-colorpicker--default)
- [WAI-ARIA Authoring Practices: Slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider/)
- [React Aria: ColorArea](https://react-spectrum.adobe.com/react-aria/ColorArea.html)
- [MDN: EyeDropper API](https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper_API)

---

## Props

<!-- bestax:generated props -->

| Prop             | Type                                                                            | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className`      | `string`                                                                        | —       | Additional CSS classes to apply.                                                                                                                                                                                                                                                                                                                                                                                                  |
| `label`          | `React.ReactNode`                                                               | —       | Field label naming the picker's group, through `aria-labelledby`. Dropped inside an outer `Field`, whose own label names it instead. An `aria-label` or `aria-labelledby` you set wins over either.                                                                                                                                                                                                                               |
| `labelProps`     | `React.LabelHTMLAttributes<HTMLLabelElement> & { [key: string]: unknown; }`     | —       | Props for the label element. An explicit `id` here is used as the `aria-labelledby` target instead of a generated one; any `htmlFor` is ignored (a group label names the group, never a single control).                                                                                                                                                                                                                          |
| `value`          | `string`                                                                        | —       | The color, controlled: any CSS color the picker reads (hex, `rgb()`, `hsl()` or a color name), in any format, since `onChange` hands back the `format` asked for. One it can't read leaves the picker showing the last color it could. A value it gave you comes back without moving the thumbs, and a gray or black keeps the hue and saturation the user had.                                                                   |
| `defaultValue`   | `string`                                                                        | —       | The color to start with, uncontrolled. Black without one.                                                                                                                                                                                                                                                                                                                                                                         |
| `onChange`       | `(value: string) => void`                                                       | —       | Called with the color, in `format`, as it changes: on every step of a drag, and on a key, a swatch, a typed value or the eye dropper.                                                                                                                                                                                                                                                                                             |
| `onChangeEnd`    | `(value: string) => void`                                                       | —       | Called with the color, in `format`, once a change is done: when a drag ends, and with `onChange` for a key, a swatch, a typed value or the eye dropper. The place to save it.                                                                                                                                                                                                                                                     |
| `format`         | `'hsl'` \| `'hex'` \| `'rgb'`                                                   | `'hsl'` | How the value is written: `'hsl'` (`hsl(171, 100%, 41%)`), Bulma's own color space and what `Theme`'s `primaryH`, `primaryS` and `primaryL` take, `'hex'` (`#00d1b2`) or `'rgb'` (`rgb(0, 209, 178)`). With `alpha`, `hsla()`, `#rrggbbaa` and `rgba()`.                                                                                                                                                                          |
| `alpha`          | `boolean`                                                                       | `false` | Adds an alpha slider and writes the alpha into the value. Without it, the value is always solid.                                                                                                                                                                                                                                                                                                                                  |
| `swatches`       | `ColorPickerSwatch[]` \| `'bulma'`                                              | —       | Preset colors shown as a radio group under the picker: a list of CSS colors, each a string or `{ color, label }`, or `"bulma"` for the page's primary, link, info, success, warning and danger, read from Bulma's CSS variables once the picker is on the page, so a themed app shows its own. The `"bulma"` names are English; for others, pass the list yourself, such as `{ color: 'var(--bulma-primary)', label: 'Primär' }`. |
| `eyeDropper`     | `boolean`                                                                       | `false` | Adds a button that picks a color from anywhere on the screen, where the browser has the EyeDropper API (desktop Chromium today). Elsewhere, and until the page hydrates, it isn't shown.                                                                                                                                                                                                                                          |
| `disabled`       | `boolean`                                                                       | `false` | Disables every part. A disabled `Fieldset` around it does too.                                                                                                                                                                                                                                                                                                                                                                    |
| `name`           | `string`                                                                        | —       | Form field name. When set, a hidden input carries the value.                                                                                                                                                                                                                                                                                                                                                                      |
| `form`           | `string`                                                                        | —       | The id of the form the hidden input belongs to.                                                                                                                                                                                                                                                                                                                                                                                   |
| `labels`         | `ColorPickerLabels`                                                             | —       | The strings it says, each with an English default.                                                                                                                                                                                                                                                                                                                                                                                |
| `children`       | `React.ReactNode`                                                               | —       | Parts for a layout of your own: `ColorPicker.Area`, `ColorPicker.HueSlider`, `ColorPicker.AlphaSlider`, `ColorPicker.Swatches` and `ColorPicker.Input`, with anything else between them. Without children, the picker shows the square, the hue slider, the alpha slider with `alpha`, the value, and the swatches when there are some.                                                                                           |
| `labelSize`      | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                              | —       | Size for the label (used in horizontal layouts).                                                                                                                                                                                                                                                                                                                                                                                  |
| `horizontal`     | `boolean`                                                                       | `false` | Horizontal field layout.                                                                                                                                                                                                                                                                                                                                                                                                          |
| `message`        | `React.ReactNode`                                                               | —       | Help/validation message below the input.                                                                                                                                                                                                                                                                                                                                                                                          |
| `messageColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Bulma color for the message.                                                                                                                                                                                                                                                                                                                                                                                                      |
| `fieldClassName` | `string`                                                                        | —       | Additional CSS classes for the Field wrapper.                                                                                                                                                                                                                                                                                                                                                                                     |
| `ref`            | `React.Ref<HTMLDivElement>`                                                     | —       | Ref forwarded to the picker's `<div>`.                                                                                                                                                                                                                                                                                                                                                                                            |
| `aria-label`     | `string`                                                                        | —       | Names the picker's group when there's no `label`.                                                                                                                                                                                                                                                                                                                                                                                 |
| `...`            | All standard `<div>` attributes and Bulma helper props                          | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                 |

**Subcomponents:**

- `ColorPicker.Area`: The saturation and brightness square, operated by pointer or by keyboard as one 2D slider.
- `ColorPicker.HueSlider`: The hue slider, from red round the spectrum and back to red.
- `ColorPicker.AlphaSlider`: The alpha slider, from see-through to solid.
- `ColorPicker.Swatches`: The swatches, a radio group of preset colors that sets the picker's color.
- `ColorPicker.Input`: The value as text you can type in, beside a preview swatch, with the eye dropper when the picker has `eyeDropper`.

### ColorPicker.Area

| Prop        | Type                                                   | Default | Description                                       |
| ----------- | ------------------------------------------------------ | ------- | ------------------------------------------------- |
| `className` | `string`                                               | —       | Additional CSS classes to apply.                  |
| `ref`       | `React.Ref<HTMLDivElement>`                            | —       | Ref forwarded to the square's `<div>`.            |
| `...`       | All standard `<div>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### ColorPicker.HueSlider

| Prop        | Type                                                   | Default | Description                                       |
| ----------- | ------------------------------------------------------ | ------- | ------------------------------------------------- |
| `className` | `string`                                               | —       | Additional CSS classes to apply.                  |
| `ref`       | `React.Ref<HTMLDivElement>`                            | —       | Ref forwarded to the slider's `<div>`.            |
| `...`       | All standard `<div>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### ColorPicker.AlphaSlider

| Prop        | Type                                                   | Default | Description                                       |
| ----------- | ------------------------------------------------------ | ------- | ------------------------------------------------- |
| `className` | `string`                                               | —       | Additional CSS classes to apply.                  |
| `ref`       | `React.Ref<HTMLDivElement>`                            | —       | Ref forwarded to the slider's `<div>`.            |
| `...`       | All standard `<div>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### ColorPicker.Swatches

| Prop        | Type                                                   | Default | Description                                                                                                     |
| ----------- | ------------------------------------------------------ | ------- | --------------------------------------------------------------------------------------------------------------- |
| `className` | `string`                                               | —       | Additional CSS classes to apply.                                                                                |
| `swatches`  | `ColorPickerSwatch[]` \| `'bulma'`                     | —       | The colors to offer, in place of the picker's own `swatches`: a list, or `"bulma"` for the page's theme colors. |
| `ref`       | `React.Ref<HTMLDivElement>`                            | —       | Ref forwarded to the group's `<div>`.                                                                           |
| `...`       | All standard `<div>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                               |

### ColorPicker.Input

| Prop        | Type                                                   | Default | Description                                       |
| ----------- | ------------------------------------------------------ | ------- | ------------------------------------------------- |
| `className` | `string`                                               | —       | Additional CSS classes to apply.                  |
| `ref`       | `React.Ref<HTMLDivElement>`                            | —       | Ref forwarded to the row's `<div>`.               |
| `...`       | All standard `<div>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`ColorPicker` registers these variables on its own `.color-picker` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                              | Sass Variable                      | Default                                                                    |
| ----------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------- |
| `--bulma-color-picker-width`              | `$color-picker-width`              | `16rem`                                                                    |
| `--bulma-color-picker-gap`                | `$color-picker-gap`                | `0.75rem`                                                                  |
| `--bulma-color-picker-area-height`        | `$color-picker-area-height`        | `10rem`                                                                    |
| `--bulma-color-picker-area-radius`        | `$color-picker-area-radius`        | `var(--bulma-radius)`                                                      |
| `--bulma-color-picker-slider-height`      | `$color-picker-slider-height`      | `1.5rem`                                                                   |
| `--bulma-color-picker-track-height`       | `$color-picker-track-height`       | `0.75rem`                                                                  |
| `--bulma-color-picker-track-radius`       | `$color-picker-track-radius`       | `var(--bulma-radius-rounded)`                                              |
| `--bulma-color-picker-thumb-size`         | `$color-picker-thumb-size`         | `1.25rem`                                                                  |
| `--bulma-color-picker-thumb-border-width` | `$color-picker-thumb-border-width` | `3px`                                                                      |
| `--bulma-color-picker-thumb-color`        | `$color-picker-thumb-color`        | `hsl(0, 0%, 100%)`                                                         |
| `--bulma-color-picker-thumb-shadow`       | `$color-picker-thumb-shadow`       | `0 0 0 1px hsla(0, 0%, 0%, 0.45), inset 0 0 0 1px hsla(0, 0%, 0%, 0.45)`   |
| `--bulma-color-picker-edge-color`         | `$color-picker-edge-color`         | `hsla(var(--bulma-text-h), var(--bulma-text-s), var(--bulma-text-l), 0.2)` |
| `--bulma-color-picker-checker-color`      | `$color-picker-checker-color`      | `var(--bulma-border)`                                                      |
| `--bulma-color-picker-checker-background` | `$color-picker-checker-background` | `var(--bulma-scheme-main)`                                                 |
| `--bulma-color-picker-checker-size`       | `$color-picker-checker-size`       | `0.375rem`                                                                 |
| `--bulma-color-picker-swatch-size`        | `$color-picker-swatch-size`        | `1.5rem`                                                                   |
| `--bulma-color-picker-swatch-gap`         | `$color-picker-swatch-gap`         | `0.25rem`                                                                  |
| `--bulma-color-picker-swatch-radius`      | `$color-picker-swatch-radius`      | `var(--bulma-radius)`                                                      |
| `--bulma-color-picker-swatch-ring-color`  | `$color-picker-swatch-ring-color`  | `var(--bulma-text-strong)`                                                 |
| `--bulma-color-picker-preview-size`       | `$color-picker-preview-size`       | `1.875rem`                                                                 |
| `--bulma-color-picker-disabled-opacity`   | `$color-picker-disabled-opacity`   | `0.5`                                                                      |

<!-- /bestax:generated cssvars -->
