---
title: Slider
sidebar_label: Slider
description: The `Slider` component provides a range slider input for selecting values within a range.
---

# Slider

## Overview

<!-- bestax:generated overview -->

The `Slider` component provides a range slider input for selecting values within a range.

<!-- /bestax:generated overview -->

It supports different sizes, colors, and optional value display.

---

## Import

<!-- bestax:generated import -->

```tsx
import { Slider } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Slider

A simple range slider.

```tsx live
function example() {
  const [value, setValue] = useState(50);
  return (
    <Block>
      <Slider label="Volume" value={value} onChange={setValue} />
      <Paragraph mt="2">Value: {value}</Paragraph>
    </Block>
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
    <Block>
      <Slider value={value} onChange={setValue} showOutput color="primary" />
      <Paragraph mt="4">Value: {value}</Paragraph>
    </Block>
  );
}
```

---

### Color Variants

Sliders with different color options.

```tsx live
<Block display="flex" flexDirection="column">
  <Slider defaultValue={50} color="primary" showOutput />
  <Slider defaultValue={50} color="success" showOutput />
  <Slider defaultValue={50} color="info" showOutput />
  <Slider defaultValue={50} color="warning" showOutput />
  <Slider defaultValue={50} color="danger" showOutput />
</Block>
```

---

### Size Variants

Sliders in different sizes.

```tsx live
<Block display="flex" flexDirection="column">
  <Block>
    <Paragraph mb="1">Small</Paragraph>
    <Slider defaultValue={50} size="small" color="primary" />
  </Block>
  <Block>
    <Paragraph mb="1">Normal</Paragraph>
    <Slider defaultValue={50} color="primary" />
  </Block>
  <Block>
    <Paragraph mb="1">Medium</Paragraph>
    <Slider defaultValue={50} size="medium" color="primary" />
  </Block>
  <Block>
    <Paragraph mb="1">Large</Paragraph>
    <Slider defaultValue={50} size="large" color="primary" />
  </Block>
</Block>
```

---

### Rounded and Circle

Slider with rounded track and circular thumb.

```tsx live
<Block display="flex" flexDirection="column">
  <Block>
    <Paragraph mb="1">Rounded</Paragraph>
    <Slider defaultValue={50} isRounded color="info" showOutput />
  </Block>
  <Block>
    <Paragraph mb="1">Circle Thumb</Paragraph>
    <Slider defaultValue={50} isCircle color="success" showOutput />
  </Block>
  <Block>
    <Paragraph mb="1">Both</Paragraph>
    <Slider defaultValue={50} isRounded isCircle color="warning" showOutput />
  </Block>
</Block>
```

---

### Custom Range

Slider with custom min, max, and step values.

```tsx live
function example() {
  const [value, setValue] = useState(500);
  return (
    <Block>
      <Slider
        value={value}
        onChange={setValue}
        min={0}
        max={1000}
        step={50}
        showOutput
        color="primary"
      />
      <Paragraph mt="4">Value: ${value}</Paragraph>
    </Block>
  );
}
```

---

### Range Slider

Two thumbs pick a low and a high value. The label names both, so a screen reader announces "Price range Minimum value" and "Price range Maximum value". A surrounding `Field` label does the same.

```tsx live
function example() {
  const [range, setRange] = useState<[number, number]>([200, 800]);
  return (
    <Block>
      <Slider
        range
        label="Price range"
        value={range}
        onChange={setRange}
        min={0}
        max={1000}
        step={50}
        color="primary"
      />
      <Paragraph mt="4">
        ${range[0]} to ${range[1]}
      </Paragraph>
    </Block>
  );
}
```

To name the thumbs yourself, pass `ariaLabel` with both names. Each one is that thumb's whole name, so the label no longer leads it.

```tsx live
<Slider
  range
  label="Price range"
  ariaLabel={['Lowest price', 'Highest price']}
  defaultValue={[200, 800]}
  max={1000}
/>
```

---

### Custom Output Format

Slider with formatted output display.

```tsx live
function example() {
  const [value, setValue] = useState(50);
  return (
    <Block>
      <Slider
        value={value}
        onChange={setValue}
        showOutput
        color="success"
        formatOutput={v => `${v}%`}
      />
      <Paragraph mt="4">Progress: {value}%</Paragraph>
    </Block>
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

### Context-Aware Rendering

The `Slider` component is context-aware: it detects whether it is already inside a `Field` and adjusts its rendering accordingly. This means you can use it standalone with a `label` prop (it wraps itself in a Field), or inside a `Field` (it skips rendering its own).

#### Default (with label)

The simplest usage — the component automatically renders its own Field wrapper.

```tsx live
<Slider label="Volume" defaultValue={50} color="primary" />
```

---

#### With Field Wrapper

When you need manual control over the Field layout (e.g., horizontal forms), wrap the component in `Field`. The component detects it's inside a Field and skips rendering its own.

A labeled `Field` that holds the Slider directly names its input with no extra wiring. In a horizontal form the label sits on the outer `Field` and the Slider in an inner one, which starts its own scope, so these examples wire the label by hand with `labelProps={{ htmlFor }}` and a matching `id`.

```tsx live
function example() {
  return (
    <Field horizontal label="Volume" labelProps={{ htmlFor: 'volume-field' }}>
      <Field.Body>
        <Field>
          <Slider id="volume-field" defaultValue={50} color="primary" />
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

#### With Field and Control Wrappers

For full manual composition, wrap in both Field and Control. The component detects the Field context and renders only the slider element.

```tsx live
function example() {
  return (
    <Field
      horizontal
      label="Volume"
      labelProps={{ htmlFor: 'volume-field-control' }}
    >
      <Field.Body>
        <Field>
          <Control iconLeftName="volume-up">
            <Slider
              id="volume-field-control"
              defaultValue={50}
              color="primary"
            />
          </Control>
        </Field>
      </Field.Body>
    </Field>
  );
}
```

Inside a `Control` with no `Field` around it, `Slider` renders no `Field` of its own either, unless you give it `label`, `message`, `horizontal` or `fieldClassName`. Those need a `Field`, so with any of them it keeps its own `Field` inside the `Control` and warns in development. Wrap the `Control` in a `Field`, as above, and set the `label`, `horizontal` and class name on that `Field` instead.

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

## Form Submission

`Slider` uses a native `<input type="range">` and is HTML-form-compatible. In single-value mode pass a `name` prop. In range mode use `nameLow` and `nameHigh` so each thumb submits as its own field.

| Mode   | Prop(s)                                                                                                  |
| ------ | -------------------------------------------------------------------------------------------------------- |
| Single | `name` (forwarded to the single `<input type="range">`)                                                  |
| Range  | `nameLow` (low thumb), `nameHigh` (high thumb) — both render as separate `<input type="range">` elements |

```tsx live
function SliderRangeFormDemo() {
  const [submitted, setSubmitted] = React.useState('');
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setSubmitted(JSON.stringify(Array.from(fd.entries()), null, 2));
      }}
    >
      <Slider
        range
        nameLow="priceMin"
        nameHigh="priceMax"
        defaultValue={[20, 80]}
        showOutput
      />
      <div style={{ marginTop: '1.5rem' }}>
        <button type="submit" className="button is-primary">
          Submit
        </button>
      </div>
      {submitted && <pre style={{ marginTop: '1rem' }}>{submitted}</pre>}
    </form>
  );
}
```

---

## Accessibility

- Uses native `<input type="range">` element
- The `label` prop, or the label of a `Field` the slider sits in, names its input.
- In range mode the label starts each thumb's name, so `<Slider range label="Price range" />` announces "Price range Minimum value" and "Price range Maximum value". Each thumb points `aria-labelledby` at the label and at a hidden span holding its own text, because an `aria-label` would outrank the label. The label's `for` still lands on the low thumb, so clicking the label focuses it.
- `ariaLabel` wins over the label. In range mode each entry is that thumb's whole name, with no label in front, and an empty entry counts as unset.
- An `aria-label` or `aria-labelledby` you pass straight to a range Slider names the whole Slider, so it takes the label's place at the start of both thumbs' names: `<Slider range aria-label="Budget" />` announces "Budget Minimum value" and "Budget Maximum value". An `ariaLabel` entry still wins for its own thumb. To keep a label out of the thumbs' names altogether, pass `aria-labelledby={undefined}`, and they stay "Minimum value" and "Maximum value".
- A `Field` label you wire by hand with `labelProps={{ htmlFor }}`, as in a horizontal form, gets no generated id, so give it one of your own there as well, as in `labelProps={{ htmlFor: 'price', id: 'price-label' }}`, and it starts both thumbs' names the same way. Without that `id` it reaches a range Slider only through its `for`, which the thumbs' default `aria-label` outranks, so they stay "Minimum value" and "Maximum value".
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

---

## Props

<!-- bestax:generated props -->

| Prop               | Type                                                                            | Default        | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `range`            | `boolean`                                                                       | `false`        | Enables range mode with two thumbs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `value`            | `number` \| `[number, number]`                                                  | —              | Controlled value.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `defaultValue`     | `number` \| `[number, number]`                                                  | `0`            | Default value for uncontrolled usage.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `onChange`         | `(value: number) => void` \| `(value: [number, number]) => void`                | —              | Callback when value changes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `minDistance`      | `number`                                                                        | `0`            | Minimum distance between thumbs in range mode.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `ariaLabel`        | `string` \| `[string, string]`                                                  | —              | ARIA label(s) for the slider thumb(s), which win over a label, the Slider's own or a surrounding `Field`'s. In range mode each entry is that thumb's whole name, and a thumb without one is named "Minimum value" or "Maximum value", after whatever names the Slider: a label, or in its place an `aria-label` or `aria-labelledby` given to the Slider, as in "Budget Minimum value" and "Budget Maximum value". An `aria-labelledby` set to `undefined` keeps every label out of both names.                                                                                                                                                                                                                                                                                                                         |
| `nameLow`          | `string`                                                                        | —              | Form field name for the low thumb. Use this in range mode so each thumb submits with its own name.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `nameHigh`         | `string`                                                                        | —              | Form field name for the high thumb.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `label`            | `React.ReactNode`                                                               | —              | Field label. Automatically associated with the slider input via `htmlFor` — uses your `id` when provided, otherwise a generated one. In range mode the `htmlFor` targets the low (minimum) thumb, and the label also starts each thumb's name through `aria-labelledby`, as in "Price Minimum value" and "Price Maximum value", unless an `aria-label` or `aria-labelledby` on the Slider takes its place there. Dropped inside an outer `Field`, whose own label associates instead when that `Field` generates a target id (not `grouped`/`hasAddons`, no explicit `labelProps.htmlFor`), naming a range Slider's thumbs the same way. A `Field` label you wire by hand to the low thumb with `labelProps.htmlFor` names the thumbs too when you also give it an `id` there, since the `Field` generates none for it. |
| `labelProps`       | `React.LabelHTMLAttributes<HTMLLabelElement> & { [key: string]: unknown; }`     | —              | Props for the label element. An explicit `htmlFor` here overrides the automatic association (no id is generated then). In range mode an `id` here is the one the thumbs' `aria-labelledby` points at, in place of a generated one.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `min`              | `number`                                                                        | `0`            | Minimum value.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `max`              | `number`                                                                        | `100`          | Maximum value.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `step`             | `number`                                                                        | `1`            | Step increment (default: 1).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `size`             | `'small'` \| `'medium'` \| `'large'`                                            | —              | Size variant.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `color`            | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —              | Color variant.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `isRounded`        | `boolean`                                                                       | `false`        | Use rounded track ends.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `isCircle`         | `boolean`                                                                       | `false`        | Use circular thumb.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `showOutput`       | `boolean`                                                                       | `false`        | Show current value tooltip.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `tooltip`          | `'auto'` \| `'always'` \| `'hidden'`                                            | —              | Controls tooltip visibility on the thumb.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `ticks`            | `boolean`                                                                       | `false`        | Shows tick marks along the track.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `marks`            | `{ value: number; label?: React.ReactNode }[]`                                  | —              | Custom labeled marks along the track. Each mark has `{ value: number; label?: ReactNode }`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `orientation`      | `'horizontal'` \| `'vertical'`                                                  | `'horizontal'` | Orientation of the slider.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `scale`            | `(value: number) => number`                                                     | —              | Function to scale the displayed value.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `getAriaValueText` | `(value: number) => string`                                                     | —              | Function to generate the `aria-valuetext` attribute.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `formatOutput`     | `(value: number) => string`                                                     | —              | Format function for output display.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `labelSize`        | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                              | —              | Size for the label (used in horizontal layouts).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `horizontal`       | `boolean`                                                                       | `false`        | Horizontal field layout.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `message`          | `React.ReactNode`                                                               | —              | Help/validation message below the input.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `messageColor`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —              | Bulma color for the message.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `fieldClassName`   | `string`                                                                        | —              | Additional CSS classes for the Field wrapper.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `disabled`         | `boolean`                                                                       | `false`        | Whether the slider is disabled.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `className`        | `string`                                                                        | —              | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `ref`              | `React.Ref<HTMLElement>`                                                        | —              | Ref forwarded to the input element.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `...`              | All standard `<input>` attributes and Bulma helper props                        | —              | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Slider` registers these variables on its own `.slider` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                          | Sass Variable                  | Default                          |
| ------------------------------------- | ------------------------------ | -------------------------------- |
| `--bulma-slider-track-height`         | `$slider-track-height`         | `0.5rem`                         |
| `--bulma-slider-track-height-small`   | `$slider-track-height-small`   | `0.375rem`                       |
| `--bulma-slider-track-height-medium`  | `$slider-track-height-medium`  | `0.625rem`                       |
| `--bulma-slider-track-height-large`   | `$slider-track-height-large`   | `0.75rem`                        |
| `--bulma-slider-thumb-size`           | `$slider-thumb-size`           | `1.25rem`                        |
| `--bulma-slider-thumb-size-small`     | `$slider-thumb-size-small`     | `1rem`                           |
| `--bulma-slider-thumb-size-medium`    | `$slider-thumb-size-medium`    | `1.5rem`                         |
| `--bulma-slider-thumb-size-large`     | `$slider-thumb-size-large`     | `1.75rem`                        |
| `--bulma-slider-track-color`          | `$slider-track-color`          | `var(--bulma-border)`            |
| `--bulma-slider-fill-color`           | `$slider-fill-color`           | `var(--bulma-primary)`           |
| `--bulma-slider-thumb-color`          | `$slider-thumb-color`          | `var(--bulma-scheme-main)`       |
| `--bulma-slider-thumb-border`         | `$slider-thumb-border`         | `var(--bulma-border)`            |
| `--bulma-slider-thumb-shadow`         | `$slider-thumb-shadow`         | `0 2px 4px rgba(0, 0, 0, 0.1)`   |
| `--bulma-slider-radius`               | `$slider-radius`               | `var(--bulma-radius)`            |
| `--bulma-slider-disabled-opacity`     | `$slider-disabled-opacity`     | `0.5`                            |
| `--bulma-slider-transition-duration`  | `$slider-transition-duration`  | `var(--bulma-duration)`          |
| `--bulma-slider-output-background`    | `$slider-output-background`    | `var(--bulma-slider-fill-color)` |
| `--bulma-slider-output-color`         | `$slider-output-color`         | `var(--bulma-scheme-main)`       |
| `--bulma-slider-output-font-size`     | `$slider-output-font-size`     | `var(--bulma-size-small)`        |
| `--bulma-slider-output-font-weight`   | `$slider-output-font-weight`   | `var(--bulma-weight-medium)`     |
| `--bulma-slider-tick-width`           | `$slider-tick-width`           | `2px`                            |
| `--bulma-slider-tick-height`          | `$slider-tick-height`          | `1rem`                           |
| `--bulma-slider-tick-color`           | `$slider-tick-color`           | `var(--bulma-grey-light)`        |
| `--bulma-slider-tick-opacity`         | `$slider-tick-opacity`         | `0.5`                            |
| `--bulma-slider-tick-label-font-size` | `$slider-tick-label-font-size` | `0.75rem`                        |
| `--bulma-slider-tick-label-color`     | `$slider-tick-label-color`     | `var(--bulma-text-light)`        |
| `--bulma-slider-vertical-height`      | `$slider-vertical-height`      | `200px`                          |

<!-- /bestax:generated cssvars -->
