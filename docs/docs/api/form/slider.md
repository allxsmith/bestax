---
title: Slider
sidebar_label: Slider
---

# Slider

## Overview

The `Slider` component provides a range slider input for selecting values within a range. It supports different sizes, colors, and optional value display.

---

## Import

```tsx
import { Slider } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop               | Type                                                                            | Default        | Description                                                                                 |
| ------------------ | ------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------- |
| `value`            | `number`                                                                        | —              | Controlled value.                                                                           |
| `defaultValue`     | `number`                                                                        | `0`            | Default value for uncontrolled usage.                                                       |
| `min`              | `number`                                                                        | `0`            | Minimum value.                                                                              |
| `max`              | `number`                                                                        | `100`          | Maximum value.                                                                              |
| `step`             | `number`                                                                        | `1`            | Step increment.                                                                             |
| `size`             | `'small'` \| `'medium'` \| `'large'`                                            | —              | Size variant.                                                                               |
| `color`            | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —              | Color variant.                                                                              |
| `isRounded`        | `boolean`                                                                       | `false`        | Use rounded track ends.                                                                     |
| `isCircle`         | `boolean`                                                                       | `false`        | Use circular thumb.                                                                         |
| `disabled`         | `boolean`                                                                       | `false`        | Whether the slider is disabled.                                                             |
| `showOutput`       | `boolean`                                                                       | `false`        | Show current value tooltip.                                                                 |
| `onChange`         | `(value: number) => void`                                                       | —              | Callback when value changes.                                                                |
| `formatOutput`     | `(value: number) => string`                                                     | —              | Format function for output display.                                                         |
| `tooltip`          | `'auto'` \| `'always'` \| `'hidden'`                                            | —              | Controls tooltip visibility on the thumb.                                                   |
| `ticks`            | `boolean`                                                                       | —              | Shows tick marks along the track.                                                           |
| `marks`            | `SliderMark[]`                                                                  | —              | Custom labeled marks along the track. Each mark has `{ value: number; label?: ReactNode }`. |
| `orientation`      | `'horizontal'` \| `'vertical'`                                                  | `'horizontal'` | Orientation of the slider.                                                                  |
| `scale`            | `(value: number) => number`                                                     | —              | Function to scale the displayed value.                                                      |
| `getAriaValueText` | `(value: number) => string`                                                     | —              | Function to generate the `aria-valuetext` attribute.                                        |
| `range`            | `boolean`                                                                       | `false`        | Enables range mode with two thumbs.                                                         |
| `minDistance`      | `number`                                                                        | `0`            | Minimum distance between thumbs in range mode.                                              |
| `ariaLabel`        | `string` \| `[string, string]`                                                  | —              | ARIA label(s) for the slider thumb(s).                                                      |
| `className`        | `string`                                                                        | —              | Additional CSS classes.                                                                     |
| `ref`              | `React.Ref<HTMLElement>`                                                        | —              | Ref forwarded to the input element.                                                         |
| ...                | All standard HTML and Bulma helper props                                        |                | (See [Helper Props](../helpers/usebulmaclasses))                                            |

---

## Usage

### Basic Slider

A simple range slider.

```tsx live
function example() {
  const [value, setValue] = useState(50);
  return (
    <Block>
      <Slider value={value} onChange={setValue} />
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
<Block display="flex" flexDirection="column" gap="5">
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
<Block display="flex" flexDirection="column" gap="5">
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
<Block display="flex" flexDirection="column" gap="5">
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

```tsx live
function example() {
  return (
    <Field horizontal label="Volume">
      <Field.Body>
        <Field>
          <Slider defaultValue={50} color="primary" />
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
    <Field horizontal label="Volume">
      <Field.Body>
        <Field>
          <Control iconLeftName="volume-up">
            <Slider defaultValue={50} color="primary" />
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
