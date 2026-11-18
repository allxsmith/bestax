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

Number input where you can only use the buttons or the arrow keys, not type. A screen reader
still announces it as read-only, so say that the buttons set it in its label, or in its `message`
where it renders one.

```tsx live
<Numberinput
  label="Seats"
  message="Set it with the buttons."
  defaultValue={5}
  editable={false}
  color="primary"
/>
```

---

### Buttons in Another Language

The buttons show only a sign or an arrow, so a screen reader and speech input go by their names,
"Increase value" and "Decrease value". In another language, `labels` names them in the page's
language. Here the page is English, so a `lang="fr"` around the field tells a screen reader to
read it in French.

```tsx live
<Block lang="fr">
  <Numberinput
    label="Quantité"
    defaultValue={2}
    min={1}
    labels={{ increase: 'Augmenter', decrease: 'Diminuer' }}
  />
</Block>
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
- Has `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` attributes, with `aria-valuenow` left off while the field holds no number, or a number outside `min` and `max` that's still being typed
- The increase and decrease buttons are named "Increase value" and "Decrease value", in both variants, and `labels` names them in the page's language
- Arrow keys increment/decrement the value
- With `editable={false}` the input is read-only, so nothing can be typed in, but the arrow keys and the buttons still change the value. A screen reader announces the field as read-only all the same, so say that the buttons set it in its label, or in its `message` where it renders one
- While you edit, the field can be empty, hold a lone `-` on the way to a negative number, or hold a number outside `min` and `max` on the way to one inside them, such as the `2` of `25` when `min` is 10. `onChange` waits for a number in range. Enter or leaving the field clamps a number outside them and reports it, or puts the last value back when the field holds no number. From a number outside them, a step toward them lands on the nearer one and a step away does nothing, and with no number a step starts from the last value
- The +/- buttons stay out of the Tab order, and a press on one leaves focus where it was, in the input when it had it, so the arrow keys keep working after a click and a button that disables at `min` or `max` doesn't take focus with it. A press on a button that's already disabled reaches nothing, as a press on any text does, so focus leaves the input then
- Buttons are disabled at min/max boundaries, and while the field holds a number typed outside them, the one that would step further out is disabled
- In forced colors (Windows' contrast themes), a disabled Numberinput isn't faded as a whole, and in the stepper variant those disabled buttons draw at full strength in the system's color for a disabled control.
- The `message` describes the number input through `aria-describedby`, after any ids you pass there, so a screen reader reads it when the input takes focus.

---

## Related Components

- [Slider](./slider.md) - For selecting values with a range slider
- [Input](./input.md) - For general text/number input

---

## Additional Resources

- [Storybook: Numberinput Stories](https://bestax.io/storybook/?path=/story/form-numberinput)

:::tip Pro Tip
Set `editable={false}` when you want users to step the value with the buttons or the arrow keys rather than type it.
:::

---

## Props

<!-- bestax:generated props -->

| Prop               | Type                                                                                                     | Default       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`            | `React.ReactNode`                                                                                        | —             | Field label. Automatically associated with the number input via `htmlFor` — uses your `id` when provided, otherwise a generated one. Dropped inside an outer `Field`, whose own label associates instead when that `Field` generates a target id (not `grouped`/`hasAddons`, no explicit `labelProps.htmlFor`) and you set no `id` here. Not rendered either by a plusminus `bare` Numberinput outside a `Field`.                                                                                                                                                                                                                                                                                                                                                                            |
| `labelProps`       | `React.LabelHTMLAttributes<HTMLLabelElement> & { [key: string]: unknown; }`                              | —             | Props for the label element. An explicit `htmlFor` here overrides the automatic association (no id is generated then).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `value`            | `number`                                                                                                 | —             | Controlled value.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `defaultValue`     | `number`                                                                                                 | —             | Default value for uncontrolled usage.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `min`              | `number`                                                                                                 | —             | Minimum allowed value.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `max`              | `number`                                                                                                 | —             | Maximum allowed value.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `step`             | `number`                                                                                                 | `1`           | Step increment (default: 1).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `size`             | `'small'` \| `'medium'` \| `'large'`                                                                     | —             | Size variant.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `color`            | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'light'` \| `'dark'` | —             | Color variant for buttons.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `inputColor`       | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`                          | —             | Color of the input field itself.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `controlsPosition` | `'left'` \| `'right'` \| `'both'`                                                                        | `'both'`      | Position of +/- buttons.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `controlsRounded`  | `boolean`                                                                                                | `false`       | Use rounded buttons.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `compact`          | `boolean`                                                                                                | `false`       | Uses compact button spacing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `bare`             | `boolean`                                                                                                | `auto`        | Renders the plusminus controls without a `.field` row of their own, so they join the row of a `Field` with `hasAddons` or `grouped` they sit in. On by default inside a `Field`, unless a `Control` is anywhere above it: a `Control` stacks its children, so there the controls keep their own row. Bare plusminus controls render no `message`, so put help text after that row yourself.                                                                                                                                                                                                                                                                                                                                                                                                  |
| `variant`          | `'plusminus'` \| `'stepper'`                                                                             | `'plusminus'` | Style variant for the control buttons.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `labels`           | `{ increase?: string; decrease?: string }`                                                               | —             | The buttons' names, in your app's language, in both variants.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `disabled`         | `boolean`                                                                                                | `false`       | Whether the input is disabled.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `editable`         | `boolean`                                                                                                | `true`        | Whether the input can be typed in. With `false` the input is `readOnly`, so nothing can be typed or pasted, but the arrow keys and the buttons still change the value, and a screen reader announces the field as read-only all the same. Say that the buttons set it in its label, or in its `message` where it renders one.                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `isLoading`        | `boolean`                                                                                                | `false`       | Shows a loading spinner on the input's control. Under `prefers-reduced-motion: reduce` the spinner stops and stays drawn (with bestax's CSS loaded). Use this rather than `isLoading` on a `Control` around the Numberinput: that spinner sits at the `Control`'s right edge, on top of whichever button is there, while this one stays inside the input. The spinner is only drawn, so a screen reader hears nothing of it. Say that the field is loading in its `message` as well, where it renders one, or in text you tie to the input with `aria-describedby`, which a screen reader reads when the input takes focus. A load that starts while the user is in the field, such as a search as they type, isn't reliably heard without a live region, such as a `role="status"` element. |
| `exponential`      | `boolean`                                                                                                | `false`       | Enables exponential step increments when holding buttons.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `onChange`         | `(value: number) => void`                                                                                | —             | Called with the new value, within `min` and `max`. While the field is edited it isn't called for a number typed outside them, such as the `2` of `25` when `min` is 10: Enter or leaving the field clamps that number and calls it, and a step toward `min` and `max` calls it with the nearer one, while a step away from them does nothing. It isn't called either while the field is empty or holds text that isn't a number yet, such as a lone `-`: Enter or leaving the field puts the last value back, and a step starts from the last value.                                                                                                                                                                                                                                         |
| `labelSize`        | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                                                       | —             | Size for the label (used in horizontal layouts).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `horizontal`       | `boolean`                                                                                                | `false`       | Horizontal field layout.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `message`          | `React.ReactNode`                                                                                        | —             | Help or validation text under the widget. It describes the control its label names through `aria-describedby`, so a screen reader reads it there.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `messageColor`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`                          | —             | Bulma color for the message.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `fieldClassName`   | `string`                                                                                                 | —             | Additional CSS classes for the Field wrapper.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `className`        | `string`                                                                                                 | —             | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `ref`              | `React.Ref<HTMLElement>`                                                                                 | —             | Ref forwarded to the input element.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `...`              | All standard `<input>` attributes and Bulma helper props                                                 | —             | Helper props go on the outer `.numberinput` `<div>`, with `className`. The other attributes go on the `<input>`. See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

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
