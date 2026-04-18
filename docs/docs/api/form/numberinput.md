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
```

---

## Props

| Prop               | Type                                                                            | Default  | Description                                      |
| ------------------ | ------------------------------------------------------------------------------- | -------- | ------------------------------------------------ |
| `value`            | `number`                                                                        | —        | Controlled value.                                |
| `defaultValue`     | `number`                                                                        | —        | Default value for uncontrolled usage.            |
| `min`              | `number`                                                                        | —        | Minimum allowed value.                           |
| `max`              | `number`                                                                        | —        | Maximum allowed value.                           |
| `step`             | `number`                                                                        | `1`      | Step increment.                                  |
| `size`             | `'small'` \| `'medium'` \| `'large'`                                            | —        | Size variant.                                    |
| `color`            | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'light'` \| `'dark'` | —        | Color variant for buttons.                       |
| `controlsPosition` | `'left'` \| `'right'` \| `'both'`                                               | `'both'` | Position of +/- buttons.                         |
| `controlsRounded`  | `boolean`                                                                       | `false`  | Use rounded buttons.                             |
| `disabled`         | `boolean`                                                                       | `false`  | Whether the input is disabled.                   |
| `editable`         | `boolean`                                                                       | `true`   | Whether the input can be typed in.               |
| `onChange`         | `(value: number) => void`                                                       | —        | Callback when value changes.                     |
| `inputColor`       | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —        | Color of the input field itself.                 |
| `compact`          | `boolean`                                                                       | `false`  | Uses compact button spacing.                     |
| `bare`             | `boolean`                                                                       | `false`  | Removes button borders and background.           |
| `variant`          | `'plusminus'` \| `'stepper'`                                                    | `'plusminus'` | Style variant for the control buttons.      |
| `isLoading`        | `boolean`                                                                       | `false`  | Shows a loading state.                           |
| `exponential`      | `boolean`                                                                       | `false`  | Enables exponential step increments when holding buttons. |
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
    <Block>
      <Numberinput value={value} onChange={setValue} />
      <Paragraph mt="2">Value: {value}</Paragraph>
    </Block>
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
    <Block>
      <Paragraph mb="2">Quantity (1-10):</Paragraph>
      <Numberinput
        value={quantity}
        onChange={setQuantity}
        min={1}
        max={10}
        color="primary"
      />
    </Block>
  );
}
```

---

### Color Variants

Number inputs with different button colors.

```tsx live
<Block display="flex" flexDirection="column" gap="4">
  <Numberinput defaultValue={5} color="primary" />
  <Numberinput defaultValue={5} color="success" />
  <Numberinput defaultValue={5} color="info" />
  <Numberinput defaultValue={5} color="warning" />
  <Numberinput defaultValue={5} color="danger" />
</Block>
```

---

### Size Variants

Number inputs in different sizes.

```tsx live
<Block display="flex" flexDirection="column" gap="4">
  <Numberinput defaultValue={5} size="small" color="primary" />
  <Numberinput defaultValue={5} color="primary" />
  <Numberinput defaultValue={5} size="medium" color="primary" />
  <Numberinput defaultValue={5} size="large" color="primary" />
</Block>
```

---

### Controls Position

Different positions for the +/- buttons.

```tsx live
<Block display="flex" flexDirection="column" gap="4">
  <Block>
    <Paragraph mb="1">Both sides (default)</Paragraph>
    <Numberinput defaultValue={5} controlsPosition="both" color="primary" />
  </Block>
  <Block>
    <Paragraph mb="1">Left only</Paragraph>
    <Numberinput defaultValue={5} controlsPosition="left" color="info" />
  </Block>
  <Block>
    <Paragraph mb="1">Right only</Paragraph>
    <Numberinput defaultValue={5} controlsPosition="right" color="success" />
  </Block>
</Block>
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
    <Block>
      <Paragraph mb="2">Step by 10:</Paragraph>
      <Numberinput
        value={value}
        onChange={setValue}
        step={10}
        min={0}
        max={100}
        color="info"
      />
      <Paragraph mt="2">Value: {value}</Paragraph>
    </Block>
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

### Context-Aware Rendering

The `Numberinput` component is context-aware: it detects whether it is already inside a `Field` and adjusts its rendering accordingly. This means you can use it standalone with a `label` prop (it wraps itself in a Field), or inside a `Field` (it skips rendering its own).

:::note
Numberinput does not use ControlContext, so the "With Field and Control Wrappers" example below uses Field wrapping only. The Control wrapper is shown for layout consistency but does not change the component's internal rendering.
:::

#### Default (with label)

The simplest usage — the component automatically renders its own Field wrapper.

```tsx live
<Numberinput label="Quantity" defaultValue={1} min={1} max={10} color="primary" />
```

---

#### With Field Wrapper

When you need manual control over the Field layout (e.g., horizontal forms), wrap the component in `Field`. The component detects it's inside a Field and skips rendering its own.

```tsx live
function example() {
  return (
    <Field horizontal label="Quantity">
      <Field.Body>
        <Field>
          <Numberinput defaultValue={1} min={1} max={10} color="primary" />
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

#### With Field and Control Wrappers

For full manual composition, wrap in both Field and Control. Numberinput does not consume ControlContext, but the Field wrapper is still detected and its own Field is skipped.

```tsx live
function example() {
  return (
    <Field horizontal label="Quantity">
      <Field.Body>
        <Field>
          <Control iconLeftName="fas fa-hashtag">
            <Numberinput defaultValue={1} min={1} max={10} color="primary" />
          </Control>
        </Field>
      </Field.Body>
    </Field>
  );
}
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
