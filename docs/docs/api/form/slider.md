---
title: Slider
sidebar_label: Slider
---

# Slider

## Overview

The `Slider` component provides a range slider input for selecting values within a range. It supports different sizes, colors, and optional value display.

:::info
The Slider component requires importing the extras CSS. See the [Extras Setup Guide](../../guides/getting-started/using-extras.md) for installation instructions.
:::

---

## Import

```tsx
import { Slider } from '@allxsmith/bestax-bulma';

// Also import the extras CSS
import '@allxsmith/bestax-bulma/dist/extras.css';
```

---

## Props

| Prop           | Type                                                                            | Default | Description                                      |
| -------------- | ------------------------------------------------------------------------------- | ------- | ------------------------------------------------ |
| `value`        | `number`                                                                        | —       | Controlled value.                                |
| `defaultValue` | `number`                                                                        | `0`     | Default value for uncontrolled usage.            |
| `min`          | `number`                                                                        | `0`     | Minimum value.                                   |
| `max`          | `number`                                                                        | `100`   | Maximum value.                                   |
| `step`         | `number`                                                                        | `1`     | Step increment.                                  |
| `size`         | `'small'` \| `'medium'` \| `'large'`                                            | —       | Size variant.                                    |
| `color`        | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Color variant.                                   |
| `isRounded`    | `boolean`                                                                       | `false` | Use rounded track ends.                          |
| `isCircle`     | `boolean`                                                                       | `false` | Use circular thumb.                              |
| `disabled`     | `boolean`                                                                       | `false` | Whether the slider is disabled.                  |
| `showOutput`   | `boolean`                                                                       | `false` | Show current value tooltip.                      |
| `onChange`     | `(value: number) => void`                                                       | —       | Callback when value changes.                     |
| `formatOutput` | `(value: number) => string`                                                     | —       | Format function for output display.              |
| `className`    | `string`                                                                        | —       | Additional CSS classes.                          |
| `ref`          | `React.Ref<HTMLElement>`                                                        | —       | Ref forwarded to the input element.              |
| ...            | All standard HTML and Bulma helper props                                        |         | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Basic Slider

A simple range slider.

```tsx live
function example() {
  const [value, setValue] = useState(50);
  return (
    <div>
      <Slider value={value} onChange={setValue} />
      <p className="mt-2">Value: {value}</p>
    </div>
  );
}
```

---

### With Output Display

Slider showing the current value tooltip.

```tsx live
function example() {
  const [value, setValue] = useState(50);
  return (
    <div>
      <Slider value={value} onChange={setValue} showOutput color="primary" />
      <p className="mt-4">Value: {value}</p>
    </div>
  );
}
```

---

### Color Variants

Sliders with different color options.

```tsx live
<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
  <Slider defaultValue={50} color="primary" showOutput />
  <Slider defaultValue={50} color="success" showOutput />
  <Slider defaultValue={50} color="info" showOutput />
  <Slider defaultValue={50} color="warning" showOutput />
  <Slider defaultValue={50} color="danger" showOutput />
</div>
```

---

### Size Variants

Sliders in different sizes.

```tsx live
<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
  <div>
    <p className="mb-1">Small</p>
    <Slider defaultValue={50} size="small" color="primary" />
  </div>
  <div>
    <p className="mb-1">Normal</p>
    <Slider defaultValue={50} color="primary" />
  </div>
  <div>
    <p className="mb-1">Medium</p>
    <Slider defaultValue={50} size="medium" color="primary" />
  </div>
  <div>
    <p className="mb-1">Large</p>
    <Slider defaultValue={50} size="large" color="primary" />
  </div>
</div>
```

---

### Rounded and Circle

Slider with rounded track and circular thumb.

```tsx live
<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
  <div>
    <p className="mb-1">Rounded</p>
    <Slider defaultValue={50} isRounded color="info" showOutput />
  </div>
  <div>
    <p className="mb-1">Circle Thumb</p>
    <Slider defaultValue={50} isCircle color="success" showOutput />
  </div>
  <div>
    <p className="mb-1">Both</p>
    <Slider defaultValue={50} isRounded isCircle color="warning" showOutput />
  </div>
</div>
```

---

### Custom Range

Slider with custom min, max, and step values.

```tsx live
function example() {
  const [value, setValue] = useState(500);
  return (
    <div>
      <Slider
        value={value}
        onChange={setValue}
        min={0}
        max={1000}
        step={50}
        showOutput
        color="primary"
      />
      <p className="mt-4">Value: ${value}</p>
    </div>
  );
}
```

---

### Custom Output Format

Slider with formatted output display.

```tsx live
function example() {
  const [value, setValue] = useState(50);
  return (
    <div>
      <Slider
        value={value}
        onChange={setValue}
        showOutput
        color="success"
        formatOutput={v => `${v}%`}
      />
      <p className="mt-4">Progress: {value}%</p>
    </div>
  );
}
```

---

### Disabled Slider

A disabled slider that cannot be interacted with.

```tsx live
<Slider defaultValue={30} disabled color="primary" />
```

---

## Controlled vs Uncontrolled

### Controlled Mode

Use `value` and `onChange` to manage state externally:

```tsx
const [value, setValue] = useState(50);
<Slider value={value} onChange={setValue} />;
```

### Uncontrolled Mode

Use `defaultValue` for internal state management:

```tsx
<Slider defaultValue={50} />
```

---

## Accessibility

- Uses native `<input type="range">` element
- Has `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` attributes
- Fully keyboard accessible with arrow keys
- Focus states clearly visible

---

## Related Components

- [Numberinput](./numberinput.md) - For numeric input with +/- buttons
- [Progress](../elements/progress.md) - For displaying progress

---

## Additional Resources

- [Storybook: Slider Stories](https://bestax.io/storybook/?path=/story/form-slider)

:::tip Pro Tip
Use the `formatOutput` prop to display values with units like percentages, currencies, or custom formats.
:::
