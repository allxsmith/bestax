---
title: Rate
sidebar_label: Rate
description: The `Rate` component provides a star/icon-based rating system.
---

# Rate

## Overview

<!-- bestax:generated overview -->

The `Rate` component provides a star/icon-based rating system.

<!-- /bestax:generated overview -->

It supports custom icons, sizes, and display options for building rating interfaces.

---

## Import

<!-- bestax:generated import -->

```tsx
import { Rate } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Rating

A simple 5-star rating.

```tsx live
function example() {
  const [rating, setRating] = useState(3);
  return (
    <Block>
      <Rate value={rating} onChange={setRating} />
      <Paragraph mt="2">Rating: {rating} stars</Paragraph>
    </Block>
  );
}
```

---

### With Score Display

Rating showing the numeric score.

```tsx live
function example() {
  const [rating, setRating] = useState(4);
  return <Rate value={rating} onChange={setRating} showScore />;
}
```

---

### With Text Labels

Rating with descriptive text for each level.

```tsx live
function example() {
  const [rating, setRating] = useState(3);
  return (
    <Rate
      value={rating}
      onChange={setRating}
      showText
      texts={['Poor', 'Fair', 'Average', 'Good', 'Excellent']}
    />
  );
}
```

---

### With Score and Text

Both score and text displayed together.

```tsx live
function example() {
  const [rating, setRating] = useState(4);
  return (
    <Rate
      value={rating}
      onChange={setRating}
      showScore
      showText
      texts={['Terrible', 'Bad', 'OK', 'Good', 'Great']}
    />
  );
}
```

---

### Size Variants

Ratings in different sizes.

```tsx live
<Block display="flex" flexDirection="column" gap="4">
  <Rate defaultValue={3} size="small" />
  <Rate defaultValue={3} />
  <Rate defaultValue={3} size="medium" />
  <Rate defaultValue={3} size="large" />
</Block>
```

---

### Custom Max Value

Rating with more than 5 stars.

```tsx live
function example() {
  const [rating, setRating] = useState(7);
  return (
    <Block>
      <Rate value={rating} onChange={setRating} max={10} showScore />
      <Paragraph mt="2">Rating: {rating} out of 10</Paragraph>
    </Block>
  );
}
```

---

### Spaced Icons

Rating with spacing between stars.

```tsx live
<Rate defaultValue={3} spaced />
```

---

### Disabled Rating

A read-only rating display.

```tsx live
<Rate value={4} disabled showScore />
```

---

### Custom Icons

Rating with custom heart icons.

```tsx live
function example() {
  const [rating, setRating] = useState(3);

  const HeartIcon = ({ isActive }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={isActive ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={isActive ? 0 : 2}
      style={{ color: '#f14668' }}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );

  return (
    <Rate
      value={rating}
      onChange={setRating}
      customIcon={({ isActive }) => <HeartIcon isActive={isActive} />}
      showScore
    />
  );
}
```

---

### Context-Aware Rendering

The `Rate` component is context-aware: it detects whether it is already inside a `Field` and adjusts its rendering accordingly. This means you can use it standalone with a `label` prop (it wraps itself in a Field), or inside a `Field` (it skips rendering its own).

#### Default (with label)

The simplest usage — the component automatically renders its own Field wrapper.

```tsx live
<Rate label="Rating" defaultValue={3} />
```

---

#### With Field Wrapper

When you need manual control over the Field layout (e.g., horizontal forms), wrap the component in `Field`. The component detects it's inside a Field and skips rendering its own.

```tsx live
function example() {
  return (
    <Field horizontal label="Rating">
      <Field.Body>
        <Field>
          <Rate defaultValue={3} />
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

#### With Field and Control Wrappers

For full manual composition, wrap in both Field and Control. The component detects the Field context and renders only the rating element.

```tsx live
function example() {
  return (
    <Field horizontal label="Rating">
      <Field.Body>
        <Field>
          <Control iconLeftName="star">
            <Rate defaultValue={3} />
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
const [rating, setRating] = useState(3);
<Rate value={rating} onChange={setRating} />;
```

### Uncontrolled Mode

Use `defaultValue` for internal state management:

```tsx
<Rate defaultValue={3} />
```

---

## Click Behavior

Clicking the same star twice will deselect it (set value to 0). This allows users to clear their rating if needed.

---

## Form Submission

`Rate` is an HTML form element. Pass a `name` prop and the current rating value is rendered as a hidden `<input type="hidden">` inside the component, so it's included in `FormData` on submit and posts to the server like any native input.

| Prop   | Description                                                                                               |
| ------ | --------------------------------------------------------------------------------------------------------- |
| `name` | Form field name. When set, a hidden input is rendered.                                                    |
| `form` | Optional id of the form this hidden input belongs to (use when the input lives outside the form element). |

Submit the form below and inspect the resulting `FormData` entries:

```tsx live
function RateFormDemo() {
  const [submitted, setSubmitted] = React.useState('');
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setSubmitted(JSON.stringify(Array.from(fd.entries()), null, 2));
      }}
    >
      <Rate name="rating" defaultValue={3} showScore />
      <div style={{ marginTop: '1rem' }}>
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

- Uses `role="radiogroup"` for the container
- Each star has `role="radio"` with `aria-checked`
- Has `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`
- Full keyboard navigation with arrow keys
- Home/End keys jump to 0/max values

---

## Related Components

- [Slider](./slider.md) - For selecting numeric values with a range
- [Input](./input.md) - For text input

---

## Additional Resources

- [Storybook: Rate Stories](https://bestax.io/storybook/?path=/story/form-rate)

:::tip Pro Tip
Use the `texts` prop to provide context for each rating level, helping users understand what each star value means.
:::

---

## Props

<!-- bestax:generated props -->

| Prop             | Type                                                                            | Default | Description                                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`           | `string`                                                                        | —       | Form field name. When set, a hidden input is rendered. Form field name. When provided, a hidden input is rendered so the rating value is submitted with the surrounding form. |
| `form`           | `string`                                                                        | —       | Optional id of the form this hidden input belongs to (use when the input lives outside the form element).                                                                     |
| `value`          | `number`                                                                        | —       | Controlled value (0 to max). Controlled rating value.                                                                                                                         |
| `defaultValue`   | `number`                                                                        | `0`     | Default value for uncontrolled usage. Initial value for uncontrolled mode. Default: 0.                                                                                        |
| `max`            | `number`                                                                        | `5`     | Maximum rating value. Maximum number of icons. Default: 5.                                                                                                                    |
| `size`           | `'small'` \| `'medium'` \| `'large'`                                            | —       | Size variant. Size modifier for the component.                                                                                                                                |
| `disabled`       | `boolean`                                                                       | `false` | Whether the rating is disabled.                                                                                                                                               |
| `showScore`      | `boolean`                                                                       | `false` | Show the numeric score next to stars. Display the numeric score next to icons.                                                                                                |
| `showText`       | `boolean`                                                                       | `false` | Show custom text based on value. Display text label for the current value.                                                                                                    |
| `texts`          | `string[]`                                                                      | —       | Array of text labels for each rating value. Text labels per rating level (used with showText).                                                                                |
| `onChange`       | `(value: number) => void`                                                       | —       | Callback when the rating changes.                                                                                                                                             |
| `customIcon`     | `(props: RateIconProps) => React.ReactNode`                                     | —       | Custom icon renderer. Custom icon render function.                                                                                                                            |
| `spaced`         | `boolean`                                                                       | `false` | Add spacing between icons.                                                                                                                                                    |
| `rtl`            | `boolean`                                                                       | `false` | Right-to-left direction. Render icons in right-to-left order.                                                                                                                 |
| `iconName`       | `string`                                                                        | —       | Custom icon name for the rating stars. Font icon name (e.g., 'star'). When set, renders `<Icon>` instead of default SVG.                                                      |
| `iconLibrary`    | `'fa'` \| `'mdi'` \| `'ion'` \| `'material-icons'` \| `'material-symbols'`      | —       | Icon library to use (defaults to ConfigProvider value or 'fa').                                                                                                               |
| `iconVariant`    | `string`                                                                        | —       | Icon style variant (e.g., 'solid', 'outlined').                                                                                                                               |
| `iconFeatures`   | `string` \| `string[]`                                                          | —       | Additional icon modifiers.                                                                                                                                                    |
| `color`          | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Color of the active rating icons. Bulma color for active icons.                                                                                                               |
| `precision`      | `number`                                                                        | `1`     | Rating precision (e.g., `0.5` for half stars). Granularity: 1 for whole stars, 0.5 for half, 0.25 for quarter.                                                                |
| `customText`     | `string`                                                                        | —       | Custom text displayed next to the rating. Text displayed after score (e.g., "(128 reviews)").                                                                                 |
| `label`          | `React.ReactNode`                                                               | —       | Field label, rendered above the widget.                                                                                                                                       |
| `labelSize`      | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                              | —       | Size for the label (used in horizontal layouts).                                                                                                                              |
| `labelProps`     | `React.LabelHTMLAttributes<HTMLLabelElement> & { [key: string]: unknown; }`     | —       | Props for the label element.                                                                                                                                                  |
| `horizontal`     | `boolean`                                                                       | `false` | Horizontal field layout.                                                                                                                                                      |
| `message`        | `React.ReactNode`                                                               | —       | Help/validation message below the input.                                                                                                                                      |
| `messageColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Bulma color for the message.                                                                                                                                                  |
| `fieldClassName` | `string`                                                                        | —       | Additional CSS classes for the Field wrapper.                                                                                                                                 |
| `children`       | `React.ReactNode`                                                               | —       | Content rendered inside the component.                                                                                                                                        |
| `className`      | `string`                                                                        | —       | Additional CSS classes.                                                                                                                                                       |
| `ref`            | `React.Ref<HTMLElement>`                                                        | —       | Ref forwarded to the container element.                                                                                                                                       |
| `index`          | `number`                                                                        | —       | The index of this icon (0-based).                                                                                                                                             |
| `isActive`       | `boolean`                                                                       | —       | Whether this icon is currently active (filled).                                                                                                                               |
| `isHovered`      | `boolean`                                                                       | —       | Whether this icon is currently hovered.                                                                                                                                       |
| `...`            | All standard `<div>` attributes and Bulma helper props                          | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                             |

<!-- /bestax:generated props -->

### RateIconProps

| Prop        | Type      | Description                                     |
| ----------- | --------- | ----------------------------------------------- |
| `index`     | `number`  | The index of this icon (0-based).               |
| `isActive`  | `boolean` | Whether this icon is currently active (filled). |
| `isHovered` | `boolean` | Whether this icon is currently hovered.         |
| `value`     | `number`  | The current value.                              |

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Rate` registers these variables on its own `.rate` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                         | Sass Variable                 | Default                    |
| ------------------------------------ | ----------------------------- | -------------------------- |
| `--bulma-rate-color-inactive`        | `$rate-color-inactive`        | `var(--bulma-grey-light)`  |
| `--bulma-rate-color-active`          | `$rate-color-active`          | `hsl(48, 100%, 50%)`       |
| `--bulma-rate-color-hover`           | `$rate-color-hover`           | `hsl(48, 100%, 67%)`       |
| `--bulma-rate-icon-size`             | `$rate-icon-size`             | `1.5em`                    |
| `--bulma-rate-icon-size-small`       | `$rate-icon-size-small`       | `1em`                      |
| `--bulma-rate-icon-size-medium`      | `$rate-icon-size-medium`      | `2em`                      |
| `--bulma-rate-icon-size-large`       | `$rate-icon-size-large`       | `2.5em`                    |
| `--bulma-rate-font-icon-size`        | `$rate-font-icon-size`        | `1.35em`                   |
| `--bulma-rate-font-icon-size-small`  | `$rate-font-icon-size-small`  | `0.9em`                    |
| `--bulma-rate-font-icon-size-medium` | `$rate-font-icon-size-medium` | `1.8em`                    |
| `--bulma-rate-font-icon-size-large`  | `$rate-font-icon-size-large`  | `2.25em`                   |
| `--bulma-rate-gap`                   | `$rate-gap`                   | `0.5rem`                   |
| `--bulma-rate-spaced-gap`            | `$rate-spaced-gap`            | `0.25rem`                  |
| `--bulma-rate-score-weight`          | `$rate-score-weight`          | `600`                      |
| `--bulma-rate-score-color`           | `$rate-score-color`           | `var(--bulma-text-strong)` |
| `--bulma-rate-text-color`            | `$rate-text-color`            | `var(--bulma-text)`        |
| `--bulma-rate-text-size`             | `$rate-text-size`             | `0.875em`                  |
| `--bulma-rate-transition-duration`   | `$rate-transition-duration`   | `var(--bulma-duration)`    |
| `--bulma-rate-disabled-opacity`      | `$rate-disabled-opacity`      | `0.5`                      |
| `--bulma-rate-pop-scale`             | `$rate-pop-scale`             | `1.2`                      |

<!-- /bestax:generated cssvars -->
