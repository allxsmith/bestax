---
title: Numberinput
sidebar_label: Numberinput
---

# Numberinput

## Overview

The `Numberinput` component provides a number input with increment/decrement buttons. It's ideal for quantity selectors, step inputs, and any numeric value that benefits from easy +/- adjustment.

:::info
The Numberinput component requires importing the extras CSS. See the [Extras Setup Guide](../../guides/getting-started/using-extras.md) for installation instructions.
:::

---

## Import

```tsx
import { Numberinput } from '@allxsmith/bestax-bulma';

// Also import the extras CSS
import '@allxsmith/bestax-bulma/dist/extras.css';
```

---

## Props

| Prop               | Type                                                                            | Default  | Description                                      |
| ------------------ | ------------------------------------------------------------------------------- | -------- | ------------------------------------------------ |
| `value`            | `number`                                                                        | —        | Controlled value.                                |
| `defaultValue`     | `number`                                                                        | `0`      | Default value for uncontrolled usage.            |
| `min`              | `number`                                                                        | —        | Minimum allowed value.                           |
| `max`              | `number`                                                                        | —        | Maximum allowed value.                           |
| `step`             | `number`                                                                        | `1`      | Step increment.                                  |
| `size`             | `'small'` \| `'medium'` \| `'large'`                                            | —        | Size variant.                                    |
| `color`            | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —        | Color variant for buttons.                       |
| `controlsPosition` | `'left'` \| `'right'` \| `'both'`                                               | `'both'` | Position of +/- buttons.                         |
| `controlsRounded`  | `boolean`                                                                       | `false`  | Use rounded buttons.                             |
| `disabled`         | `boolean`                                                                       | `false`  | Whether the input is disabled.                   |
| `editable`         | `boolean`                                                                       | `true`   | Whether the input can be typed in.               |
| `onChange`         | `(value: number) => void`                                                       | —        | Callback when value changes.                     |
| `className`        | `string`                                                                        | —        | Additional CSS classes.                          |
| `ref`              | `React.Ref<HTMLElement>`                                                        | —        | Ref forwarded to the input element.              |
| ...                | All standard HTML and Bulma helper props                                        |          | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Basic Numberinput

A simple number input with +/- buttons.

```tsx live
function example() {
  const [value, setValue] = useState(5);
  return (
    <div>
      <Numberinput value={value} onChange={setValue} />
      <p className="mt-2">Value: {value}</p>
    </div>
  );
}
```

---

### With Min and Max

Number input with value constraints.

```tsx live
function example() {
  const [quantity, setQuantity] = useState(1);
  return (
    <div>
      <p className="mb-2">Quantity (1-10):</p>
      <Numberinput
        value={quantity}
        onChange={setQuantity}
        min={1}
        max={10}
        color="primary"
      />
    </div>
  );
}
```

---

### Color Variants

Number inputs with different button colors.

```tsx live
<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <Numberinput defaultValue={5} color="primary" />
  <Numberinput defaultValue={5} color="success" />
  <Numberinput defaultValue={5} color="info" />
  <Numberinput defaultValue={5} color="warning" />
  <Numberinput defaultValue={5} color="danger" />
</div>
```

---

### Size Variants

Number inputs in different sizes.

```tsx live
<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <Numberinput defaultValue={5} size="small" color="primary" />
  <Numberinput defaultValue={5} color="primary" />
  <Numberinput defaultValue={5} size="medium" color="primary" />
  <Numberinput defaultValue={5} size="large" color="primary" />
</div>
```

---

### Controls Position

Different positions for the +/- buttons.

```tsx live
<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <div>
    <p className="mb-1">Both sides (default)</p>
    <Numberinput defaultValue={5} controlsPosition="both" color="primary" />
  </div>
  <div>
    <p className="mb-1">Left only</p>
    <Numberinput defaultValue={5} controlsPosition="left" color="info" />
  </div>
  <div>
    <p className="mb-1">Right only</p>
    <Numberinput defaultValue={5} controlsPosition="right" color="success" />
  </div>
</div>
```

---

### Rounded Buttons

Number input with rounded +/- buttons.

```tsx live
<Numberinput defaultValue={5} controlsRounded color="primary" />
```

---

### Custom Step

Number input with custom step increment.

```tsx live
function example() {
  const [value, setValue] = useState(0);
  return (
    <div>
      <p className="mb-2">Step by 10:</p>
      <Numberinput
        value={value}
        onChange={setValue}
        step={10}
        min={0}
        max={100}
        color="info"
      />
      <p className="mt-2">Value: {value}</p>
    </div>
  );
}
```

---

### Read-only Input

Number input where you can only use the buttons (not type directly).

```tsx live
<Numberinput defaultValue={5} editable={false} color="primary" />
```

---

### Disabled State

A disabled number input.

```tsx live
<Numberinput defaultValue={5} disabled />
```

---

## Controlled vs Uncontrolled

### Controlled Mode

Use `value` and `onChange` to manage state externally:

```tsx
const [quantity, setQuantity] = useState(1);
<Numberinput value={quantity} onChange={setQuantity} min={1} max={10} />;
```

### Uncontrolled Mode

Use `defaultValue` for internal state management:

```tsx
<Numberinput defaultValue={5} min={0} max={100} />
```

---

## Accessibility

- Uses native number input element
- Has `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` attributes
- +/- buttons have `aria-label` for screen readers
- Arrow keys increment/decrement the value
- Buttons are disabled at min/max boundaries

---

## Related Components

- [Slider](./slider.md) - For selecting values with a range slider
- [Input](./input.md) - For general text/number input

---

## Additional Resources

- [Storybook: Numberinput Stories](https://bestax.io/storybook/?path=/story/form-numberinput)

:::tip Pro Tip
Set `editable={false}` when you want users to only use the +/- buttons, preventing manual typing errors.
:::
