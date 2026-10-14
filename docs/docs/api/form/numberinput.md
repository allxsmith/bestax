---
title: Numberinput
sidebar_label: Numberinput
description: The `Numberinput` component provides a number input with increment/decrement buttons.
---

# Numberinput

## Overview

<!-- bestax:generated overview -->

The `Numberinput` component provides a number input with increment/decrement buttons.

<!-- /bestax:generated overview -->

It's ideal for quantity selectors, step inputs, and any numeric value that benefits from easy +/- adjustment.

---

## Import

<!-- bestax:generated import -->

```tsx
import { Numberinput } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

The component is exported as `Numberinput`; a deprecated `NumberInput` alias names the same component for imports written with camel-case spelling, and `NumberInputProps` is the matching deprecated alias of the `NumberinputProps` type.

### Basic Numberinput

A simple number input with +/- buttons.

```tsx live
function example() {
  const [value, setValue] = useState(5);
  return (
    <Block>
      <Numberinput label="Quantity" value={value} onChange={setValue} />
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
<Block display="flex" flexDirection="column">
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
<Block display="flex" flexDirection="column">
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
<Block display="flex" flexDirection="column">
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
The plus and minus buttons sit in a row of their own. Inside a `Field` they render bare instead, without that row, so they join the row of a `Field` with `hasAddons` or `grouped` (set `bare` to choose either way). Inside a `Control` they keep their own row, because a `Control` stacks what it holds. The stepper variant always keeps its own row.

A labeled `Field` names the Numberinput it holds, but not one with `hasAddons` or `grouped`, since those hold several controls. Label that row with `labelProps={{ htmlFor }}` and a matching `id` on the Numberinput.
:::

#### Default (with label)

The simplest usage — the component automatically renders its own Field wrapper.

```tsx live
<Numberinput
  label="Quantity"
  defaultValue={1}
  min={1}
  max={10}
  color="primary"
/>
```

---

#### With Field Wrapper

When you need manual control over the Field layout (e.g., horizontal forms), wrap the component in `Field`. The component detects it's inside a Field and skips rendering its own. A plain `Field` lays out no row, so pass `bare={false}` to keep the buttons in a row of their own.

A labeled `Field` that holds the Numberinput directly names its input with no extra wiring. In a horizontal form the label sits on the outer `Field` and the Numberinput in an inner one, which starts its own scope, so these examples wire the label by hand with `labelProps={{ htmlFor }}` and a matching `id`.

```tsx live
function example() {
  return (
    <Field
      horizontal
      label="Quantity"
      labelProps={{ htmlFor: 'quantity-field' }}
    >
      <Field.Body>
        <Field>
          <Numberinput
            id="quantity-field"
            bare={false}
            defaultValue={1}
            min={1}
            max={10}
            color="primary"
          />
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

#### With Field and Control Wrappers

For full manual composition, wrap in both Field and Control. The Field wrapper is detected and its own Field is skipped, and inside the Control the buttons keep their own row. Leave icons and `isLoading` off that Control: Bulma places them at its edges, where the buttons sit, and its icon rules would also restyle the glyphs inside the buttons. For a spinner, set `isLoading` on the Numberinput itself. That Control belongs in a plain `Field`: in a `Field` with `hasAddons` or `grouped`, put the Numberinput in directly, where it renders bare and joins that row.

```tsx live
function example() {
  return (
    <Field
      horizontal
      label="Quantity"
      labelProps={{ htmlFor: 'quantity-field-control' }}
    >
      <Field.Body>
        <Field>
          <Control>
            <Numberinput
              id="quantity-field-control"
              defaultValue={1}
              min={1}
              max={10}
              color="primary"
            />
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
- The `label` prop, or the label of a `Field` the Numberinput sits in, names its input. A `Field` with `hasAddons` or `grouped` holds several controls and names none, so wire that one with `labelProps={{ htmlFor }}` and a matching `id`.
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

---

## Props

<!-- bestax:generated props -->

| Prop               | Type                                                                                                     | Default       | Description                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`            | `React.ReactNode`                                                                                        | —             | Field label. Automatically associated with the number input via `htmlFor` — uses your `id` when provided, otherwise a generated one. Dropped inside an outer `Field`, whose own label associates instead when that `Field` generates a target id (not `grouped`/`hasAddons`, no explicit `labelProps.htmlFor`) and you set no `id` here. Not rendered either by a plusminus `bare` Numberinput outside a `Field`. |
| `labelProps`       | `React.LabelHTMLAttributes<HTMLLabelElement> & { [key: string]: unknown; }`                              | —             | Props for the label element. An explicit `htmlFor` here overrides the automatic association (no id is generated then).                                                                                                                                                                                                                                                                                            |
| `value`            | `number`                                                                                                 | —             | Controlled value.                                                                                                                                                                                                                                                                                                                                                                                                 |
| `defaultValue`     | `number`                                                                                                 | —             | Default value for uncontrolled usage.                                                                                                                                                                                                                                                                                                                                                                             |
| `min`              | `number`                                                                                                 | —             | Minimum allowed value.                                                                                                                                                                                                                                                                                                                                                                                            |
| `max`              | `number`                                                                                                 | —             | Maximum allowed value.                                                                                                                                                                                                                                                                                                                                                                                            |
| `step`             | `number`                                                                                                 | `1`           | Step increment (default: 1).                                                                                                                                                                                                                                                                                                                                                                                      |
| `size`             | `'small'` \| `'medium'` \| `'large'`                                                                     | —             | Size variant.                                                                                                                                                                                                                                                                                                                                                                                                     |
| `color`            | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'light'` \| `'dark'` | —             | Color variant for buttons.                                                                                                                                                                                                                                                                                                                                                                                        |
| `inputColor`       | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`                          | —             | Color of the input field itself.                                                                                                                                                                                                                                                                                                                                                                                  |
| `controlsPosition` | `'left'` \| `'right'` \| `'both'`                                                                        | `'both'`      | Position of +/- buttons.                                                                                                                                                                                                                                                                                                                                                                                          |
| `controlsRounded`  | `boolean`                                                                                                | `false`       | Use rounded buttons.                                                                                                                                                                                                                                                                                                                                                                                              |
| `compact`          | `boolean`                                                                                                | `false`       | Uses compact button spacing.                                                                                                                                                                                                                                                                                                                                                                                      |
| `bare`             | `boolean`                                                                                                | `auto`        | Renders the plusminus controls without a `.field` row of their own, so they join the row of a `Field` with `hasAddons` or `grouped` they sit in. On by default inside a `Field`, unless a `Control` is anywhere above it: a `Control` stacks its children, so there the controls keep their own row.                                                                                                              |
| `variant`          | `'plusminus'` \| `'stepper'`                                                                             | `'plusminus'` | Style variant for the control buttons.                                                                                                                                                                                                                                                                                                                                                                            |
| `disabled`         | `boolean`                                                                                                | `false`       | Whether the input is disabled.                                                                                                                                                                                                                                                                                                                                                                                    |
| `editable`         | `boolean`                                                                                                | `true`        | Whether the input can be typed in.                                                                                                                                                                                                                                                                                                                                                                                |
| `isLoading`        | `boolean`                                                                                                | `false`       | Shows a loading spinner on the input's control. Under `prefers-reduced-motion: reduce` the spinner stops and stays drawn (with bestax's CSS loaded). Use this rather than `isLoading` on a `Control` around the Numberinput: that spinner sits at the `Control`'s right edge, on top of whichever button is there, while this one stays inside the input.                                                         |
| `exponential`      | `boolean`                                                                                                | `false`       | Enables exponential step increments when holding buttons.                                                                                                                                                                                                                                                                                                                                                         |
| `onChange`         | `(value: number) => void`                                                                                | —             | Callback when value changes.                                                                                                                                                                                                                                                                                                                                                                                      |
| `labelSize`        | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                                                       | —             | Size for the label (used in horizontal layouts).                                                                                                                                                                                                                                                                                                                                                                  |
| `horizontal`       | `boolean`                                                                                                | `false`       | Horizontal field layout.                                                                                                                                                                                                                                                                                                                                                                                          |
| `message`          | `React.ReactNode`                                                                                        | —             | Help/validation message below the input.                                                                                                                                                                                                                                                                                                                                                                          |
| `messageColor`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`                          | —             | Bulma color for the message.                                                                                                                                                                                                                                                                                                                                                                                      |
| `fieldClassName`   | `string`                                                                                                 | —             | Additional CSS classes for the Field wrapper.                                                                                                                                                                                                                                                                                                                                                                     |
| `className`        | `string`                                                                                                 | —             | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                                                                           |
| `ref`              | `React.Ref<HTMLElement>`                                                                                 | —             | Ref forwarded to the input element.                                                                                                                                                                                                                                                                                                                                                                               |
| `...`              | All standard `<input>` attributes and Bulma helper props                                                 | —             | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                 |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Numberinput` registers these variables on its own `.numberinput` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                     | Sass Variable                             | Default                    |
| ------------------------------------------------ | ----------------------------------------- | -------------------------- |
| `--bulma-numberinput-stepper-width`              | `$numberinput-stepper-width`              | `2.5em`                    |
| `--bulma-numberinput-stepper-border-color`       | `$numberinput-stepper-border-color`       | `var(--bulma-border)`      |
| `--bulma-numberinput-stepper-button-color`       | `$numberinput-stepper-button-color`       | `var(--bulma-text-weak)`   |
| `--bulma-numberinput-stepper-button-hover-color` | `$numberinput-stepper-button-hover-color` | `var(--bulma-text-strong)` |
| `--bulma-numberinput-stepper-button-hover-bg`    | `$numberinput-stepper-button-hover-bg`    | `var(--bulma-background)`  |
| `--bulma-numberinput-disabled-opacity`           | `$numberinput-disabled-opacity`           | `0.5`                      |
| `--bulma-numberinput-rounded-button-size`        | `$numberinput-rounded-button-size`        | `2.5em`                    |

<!-- /bestax:generated cssvars -->
