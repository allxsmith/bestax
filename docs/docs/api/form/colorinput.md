---
title: ColorInput
sidebar_label: ColorInput
description: 'The `ColorInput` component is a form field for a color: type it, or open a color picker from its launcher or its swatch.'
---

# ColorInput

## Overview

<!-- bestax:generated overview -->

The `ColorInput` component is a form field for a color: type it, or open a color picker from its launcher or its swatch.

<!-- /bestax:generated overview -->

Reach for it wherever a form asks for a color: a brand or theme color in settings, the color of a
label, a calendar or a chart series. The field holds the value as text, so it can be typed or
pasted, and a swatch at its start shows the color. Its launcher, a click on the swatch, or
Alt+ArrowDown opens a [`ColorPicker`](./colorpicker.md) in a popover, the same one the date
pickers use.

The value is a CSS color string, HSL by default, or empty, so the field can be left blank and
`required` works the way it does on any text field.

:::info
Bulma has no color field, so `ColorInput` brings its own styles, in `bestax.css` and its variants,
or in `extras.css` next to your own Bulma.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { ColorInput } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Give it a `label` and, uncontrolled, a `defaultValue`. Type a color, or open the panel from the
launcher, the swatch or Alt+ArrowDown, and Escape brings you back to the field.

```tsx live
<ColorInput label="Brand color" defaultValue="hsl(202, 67%, 36%)" />
```

### Empty

Without a value the field is empty and the swatch shows a checkerboard. Clearing the text and
leaving the field empties it again, and `onChange` gets `''`.

```tsx live
<ColorInput label="Highlight" placeholder="No color" />
```

### Typing

Typed text is read as hex, `rgb()`, `hsl()` or a CSS color name, and committed on Enter or on
leaving the field, written back in `format`. Text it can't read is marked invalid; Escape, or
leaving the field, puts the value back.

```tsx live
<ColorInput label="Type tomato, then Enter" format="hex" />
```

### Formats and Alpha

`format` writes the value as `hsl` (the default), `hex` or `rgb`. `alpha` adds a slider for
transparency to the panel and writes it into the value.

```tsx live
<ColorInput
  label="Overlay"
  alpha
  format="rgb"
  defaultValue="rgba(10, 10, 10, 0.6)"
/>
```

### Swatches

`swatches` adds preset colors to the panel, and `swatches="bulma"` the page's own theme colors.
`closeOnSwatchClick` closes the panel once one is chosen with a click, Enter or Space; the arrow
keys only move between them.

```tsx live
<ColorInput
  label="Label color"
  format="hex"
  closeOnSwatchClick
  swatches={[
    { color: '#1e6b99', label: 'Ocean' },
    { color: '#00d1b2', label: 'Turquoise' },
    { color: '#ff6685', label: 'Pink' },
    { color: '#ffdd57', label: 'Sunflower' },
  ]}
/>
```

### Controlled, and Theming With It

`onChange` fires on every step of a drag in the panel, and `onChangeEnd` once a change is done,
the place to save. An HSL value splits into the channels [`Theme`](../helpers/theme.md) takes.

```tsx live
function example() {
  const [color, setColor] = useState('hsl(202, 67%, 36%)');
  const [h, s, l] = color.match(/[\d.]+/g) ?? [];
  return (
    <>
      <ColorInput label="Primary" value={color} onChange={setColor} />
      <Theme primaryH={h} primaryS={`${s}%`} primaryL={`${l}%`}>
        <Buttons>
          <Button color="primary">Primary</Button>
          <Button color="primary" isOutlined>
            Outlined
          </Button>
        </Buttons>
      </Theme>
    </>
  );
}
```

### Opening on Focus

`openOnFocus` opens the panel when the field takes focus and moves focus into it, as `DateInput`
does. It's off by default, since typing is the quick way in. Focus coming back from the panel
leaves it closed.

```tsx live
<ColorInput label="Accent" openOnFocus defaultValue="#ffdd57" />
```

### In a Form

`name` sends the text the field shows, the value in `format`, with the form, and `required`
fails an empty field. Inside a disabled [`Fieldset`](./fieldset.md), or with `disabled`, nothing
opens.

```tsx live
<form onSubmit={event => event.preventDefault()}>
  <ColorInput label="Calendar color" name="calendarColor" required />
  <ColorInput label="Locked" disabled defaultValue="#ff6685" />
</form>
```

### Sizes and Colors

`size`, `color` and `isRounded` style the field as they do an [`Input`](./input.md). The swatch
and the launcher grow with it.

```tsx live
<>
  <ColorInput label="Small" size="small" isRounded defaultValue="#00d1b2" />
  <ColorInput label="Large" size="large" color="info" defaultValue="#1e6b99" />
</>
```

### Right to Left

In a right-to-left page the swatch sits on the right and the launcher on the left, and the panel's
square and sliders run from the right.

```tsx live
<LocaleProvider locale="ar" dir="rtl">
  <ColorInput
    label="اللون"
    defaultValue="hsl(150, 60%, 40%)"
    labels={{ chooseColor: 'اختر لونًا' }}
  />
</LocaleProvider>
```

### Without the Field

`ColorInputBase` is the field and its panel with no `Field` or `Control` around it, for composing
those yourself.

```tsx live
<Field label="Bare">
  <Control>
    <ColorInputBase defaultValue="#ff6685" />
  </Control>
</Field>
```

---

## Accessibility

- **The field is a combobox that opens a dialog**, as the date pickers' is: `role="combobox"`,
  `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls`, named by its `label`. The
  launcher is a button named "Choose color" with the same attributes.
- **Keys in the field:** Alt+ArrowDown opens the panel; Enter commits typed text; Escape puts
  typed text back without closing a `Modal` around the field.
- **The panel** is a non-modal `dialog` named "Choose color" that holds focus while it's open.
  Focus starts on the saturation and brightness square, and Escape, Alt+ArrowUp or a press
  outside closes it and hands focus back to the field.
- **The square and the sliders** are `ColorPicker`'s: native range inputs, the square one 2D
  slider with one tab stop. See [`ColorPicker`](./colorpicker.md#accessibility).
- **The swatch in the field** is for the pointer only: it's hidden from assistive tech and takes
  no tab stop, since the launcher does the same from the keyboard.
- **The value is always text** in the field, and text it can't read is marked `aria-invalid`.
- **Forced colors:** the swatch keeps its color with an edge in the system's text color.
- **Strings** come from `labels`, with English defaults.

---

## Related Components

- [`ColorPicker`](./colorpicker.md): The panel on its own, always on the page.
- [`ColorSwatch`](../elements/colorswatch.md): Shows a color without choosing one.
- [`Input`](./input.md#choosing-a-color): `type="color"`, the browser's own color well, with no JavaScript.
- [`DateInput`](./datetime/dateinput.md): The same field and popover, for a date.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: ColorInput Stories](https://bestax.io/storybook/?path=/story/form-colorinput--default)
- [WAI-ARIA Authoring Practices: Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- [WAI-ARIA Authoring Practices: Date Picker Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/)

---

## Props

<!-- bestax:generated props -->

| Prop                 | Type                                                                             | Default          | Description                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `label`              | `React.ReactNode`                                                                | —                | Field label (component auto-wraps in a `Field` if not already inside). Automatically associated with the text field via `htmlFor`, using your `id` when provided, otherwise a generated one. Dropped inside an outer `Field`, whose own label associates instead when that `Field` generates a target id (not `grouped`/`hasAddons`, no explicit `labelProps.htmlFor`) and you set no `id` here. |
| `labelSize`          | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                               | —                | Size for the label.                                                                                                                                                                                                                                                                                                                                                                              |
| `labelProps`         | `React.LabelHTMLAttributes<HTMLLabelElement> & { [key: string]: unknown; }`      | —                | Props for the label element. An explicit `htmlFor` here overrides the automatic association (no id is generated then).                                                                                                                                                                                                                                                                           |
| `horizontal`         | `boolean`                                                                        | `false`          | Render the field with horizontal layout.                                                                                                                                                                                                                                                                                                                                                         |
| `isLoading`          | `boolean`                                                                        | `false`          | Shows a loading spinner on the `Control` it renders, and hides the launcher (`triggerIcon`) while it does. Inside your own `Control` it renders none, so this draws nothing and warns in development; set `isLoading` on that `Control`.                                                                                                                                                         |
| `triggerIcon`        | `boolean`                                                                        | `true`           | Shows the launcher on the field's end that toggles the panel. Hidden by default while a spinner shows at the same edge: this component's `isLoading` when it renders its own `Control`, or the enclosing `Control`'s `isLoading` inside one.                                                                                                                                                     |
| `isExpanded`         | `boolean`                                                                        | `false`          | Expand the control to fill its container.                                                                                                                                                                                                                                                                                                                                                        |
| `controlSize`        | `'small'` \| `'medium'` \| `'large'`                                             | —                | Size of the wrapping Control.                                                                                                                                                                                                                                                                                                                                                                    |
| `message`            | `React.ReactNode`                                                                | —                | Help/validation text below the field.                                                                                                                                                                                                                                                                                                                                                            |
| `messageColor`       | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`  | —                | Color modifier for the help message.                                                                                                                                                                                                                                                                                                                                                             |
| `fieldClassName`     | `string`                                                                         | —                | Additional CSS classes for the Field wrapper.                                                                                                                                                                                                                                                                                                                                                    |
| `controlClassName`   | `string`                                                                         | —                | Additional CSS classes for the Control wrapper.                                                                                                                                                                                                                                                                                                                                                  |
| `value`              | `string`                                                                         | —                | The color, controlled, as a CSS color the picker reads (hex, `rgb()`, `hsl()` or a color name), or `''` for none.                                                                                                                                                                                                                                                                                |
| `defaultValue`       | `string`                                                                         | —                | The color to start with, uncontrolled; empty without one.                                                                                                                                                                                                                                                                                                                                        |
| `onChange`           | `(value: string) => void`                                                        | —                | Called with the color, in `format`, as it changes: on every step of a drag in the panel, on a key or a swatch, and when typed text is committed. Clearing the field calls it with `''`.                                                                                                                                                                                                          |
| `onChangeEnd`        | `(value: string) => void`                                                        | —                | Called with the color, in `format`, once a change is done: when a drag ends, and with `onChange` for everything else. The place to save it.                                                                                                                                                                                                                                                      |
| `format`             | `'hsl'` \| `'hex'` \| `'rgb'`                                                    | `'hsl'`          | How the value is written: `'hsl'` (`hsl(171, 100%, 41%)`), `'hex'` or `'rgb'`, with alpha as `hsla()`, `#rrggbbaa` and `rgba()`. Typed text in any of them is written back in this one.                                                                                                                                                                                                          |
| `alpha`              | `boolean`                                                                        | `false`          | Adds an alpha slider to the panel and writes the alpha into the value.                                                                                                                                                                                                                                                                                                                           |
| `swatches`           | `ColorPickerSwatch[]` \| `'bulma'`                                               | —                | Preset colors in the panel: a list of CSS colors, each a string or `{ color, label }`, or `"bulma"` for the page's theme colors.                                                                                                                                                                                                                                                                 |
| `eyeDropper`         | `boolean`                                                                        | `false`          | Adds a button to the panel that picks a color from anywhere on the screen, where the browser has the EyeDropper API.                                                                                                                                                                                                                                                                             |
| `onOpen`             | `() => void`                                                                     | —                | Fired when the panel opens.                                                                                                                                                                                                                                                                                                                                                                      |
| `onClose`            | `() => void`                                                                     | —                | Fired when the panel closes.                                                                                                                                                                                                                                                                                                                                                                     |
| `openOnFocus`        | `boolean`                                                                        | `false`          | Opens the panel when the field takes focus, and moves focus into it. Off by default, since typing a value is the quick way in and the launcher, a click on the swatch or Alt+ArrowDown open it.                                                                                                                                                                                                  |
| `closeOnSwatchClick` | `boolean`                                                                        | `false`          | Closes the panel once a swatch is chosen.                                                                                                                                                                                                                                                                                                                                                        |
| `position`           | `'bottom-left'` \| `'bottom-right'` \| `'top-left'` \| `'top-right'` \| `'auto'` | `'bottom-left'`  | The panel's place relative to the field.                                                                                                                                                                                                                                                                                                                                                         |
| `appendToBody`       | `boolean`                                                                        | `false`          | Renders the panel through a portal, into the `portalContainer` a `ConfigProvider` sets, `document.body` by default.                                                                                                                                                                                                                                                                              |
| `color`              | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`  | —                | Bulma color modifier for the field.                                                                                                                                                                                                                                                                                                                                                              |
| `size`               | `'small'` \| `'medium'` \| `'large'`                                             | —                | The field's size.                                                                                                                                                                                                                                                                                                                                                                                |
| `isRounded`          | `boolean`                                                                        | `false`          | Renders the field with rounded ends.                                                                                                                                                                                                                                                                                                                                                             |
| `disabled`           | `boolean`                                                                        | `false`          | Disables the field and its panel. A disabled `Fieldset` does too.                                                                                                                                                                                                                                                                                                                                |
| `readOnly`           | `boolean`                                                                        | `false`          | Makes the field read-only, with no panel.                                                                                                                                                                                                                                                                                                                                                        |
| `placeholder`        | `string`                                                                         | —                | Text shown while the field is empty.                                                                                                                                                                                                                                                                                                                                                             |
| `triggerIconName`    | `string`                                                                         | `'chevron-down'` | The launcher's glyph.                                                                                                                                                                                                                                                                                                                                                                            |
| `labels`             | `ColorPickerLabels`                                                              | —                | The strings it says, each with an English default.                                                                                                                                                                                                                                                                                                                                               |
| `className`          | `string`                                                                         | —                | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                                                          |
| `name`               | `string`                                                                         | —                | Form field name. The field submits the text it shows, the value in `format`, or nothing when it's empty.                                                                                                                                                                                                                                                                                         |
| `required`           | `boolean`                                                                        | `false`          | Marks the field required, so an empty one fails the form's constraint validation.                                                                                                                                                                                                                                                                                                                |
| `ref`                | `React.Ref<HTMLInputElement>`                                                    | —                | Forwarded to the text `<input>`.                                                                                                                                                                                                                                                                                                                                                                 |
| `...`                | All standard `<input>` attributes and Bulma helper props                         | —                | Helper props go on the `.colorinput` `<div>`, with `className`. The other attributes go on the text `<input>`. See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                 |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`ColorInput` registers these variables on its own `.colorinput` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                  | Sass Variable                        | Default                            |
| --------------------------------------------- | ------------------------------------ | ---------------------------------- |
| `--bulma-colorinput-side-width`               | `$colorinput-side-width`             | `2.5em`                            |
| `--bulma-colorinput-swatch-size`              | `$colorinput-swatch-size`            | `1.25em`                           |
| `--bulma-colorinput-trigger-color`            | `$colorinput-trigger-color`          | `var(--bulma-text)`                |
| `--bulma-colorinput-trigger-hover-color`      | `$colorinput-trigger-hover-color`    | `var(--bulma-text-strong)`         |
| `--bulma-colorinput-disabled-opacity`         | `$colorinput-disabled-opacity`       | `0.5`                              |
| `--bulma-picker-popover-z-index` ‡            | `$picker-popover-z-index`            | `30`                               |
| `--bulma-picker-popover-background` ‡         | `$picker-popover-background`         | `var(--bulma-scheme-main)`         |
| `--bulma-picker-popover-radius` ‡             | `$picker-popover-radius`             | `var(--bulma-radius-large)`        |
| `--bulma-picker-popover-shadow` ‡             | `$picker-popover-shadow`             | `0 8px 24px hsla(0, 0%, 0%, 0.18)` |
| `--bulma-picker-popover-border-color` ‡       | `$picker-popover-border-color`       | `var(--bulma-border)`              |
| `--bulma-picker-popover-padding` ‡            | `$picker-popover-padding`            | `0.75rem`                          |
| `--bulma-picker-popover-offset` ‡             | `$picker-popover-offset`             | `4px`                              |
| `--bulma-picker-popover-animation-duration` ‡ | `$picker-popover-animation-duration` | `0.15s`                            |

‡ declared on a constituent element: values set via `className`, the `style` prop, or an ancestor are only inherited and lose — target the declaring element in your CSS.

<!-- /bestax:generated cssvars -->
