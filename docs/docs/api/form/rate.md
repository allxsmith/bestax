---
title: Rate
sidebar_label: Rate
---

# Rate

## Overview

The `Rate` component provides a star/icon-based rating system. It supports custom icons, sizes, and display options for building rating interfaces.

:::info
The Rate component requires importing the extras CSS. See the [Extras Setup Guide](../../guides/getting-started/using-extras.md) for installation instructions.
:::

---

## Import

```tsx
import { Rate } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop           | Type                                        | Default | Description                                      |
| -------------- | ------------------------------------------- | ------- | ------------------------------------------------ |
| `value`        | `number`                                    | —       | Controlled value (0 to max).                     |
| `defaultValue` | `number`                                    | `0`     | Default value for uncontrolled usage.            |
| `max`          | `number`                                    | `5`     | Maximum rating value.                            |
| `size`         | `'small'` \| `'medium'` \| `'large'`        | —       | Size variant.                                    |
| `disabled`     | `boolean`                                   | `false` | Whether the rating is disabled.                  |
| `showScore`    | `boolean`                                   | `false` | Show the numeric score next to stars.            |
| `showText`     | `boolean`                                   | `false` | Show custom text based on value.                 |
| `texts`        | `string[]`                                  | —       | Array of text labels for each rating value.      |
| `onChange`     | `(value: number) => void`                   | —       | Callback when rating changes.                    |
| `customIcon`   | `(props: RateIconProps) => React.ReactNode` | —       | Custom icon renderer.                            |
| `iconName`     | `string`                                    | —       | Custom icon name for the rating stars.           |
| `iconLibrary`  | `'fa'` \| `'mdi'` \| `'ion'` \| `'material-icons'` \| `'material-symbols'` | — | Icon library to use.                |
| `iconVariant`  | `string`                                    | —       | Icon style variant.                              |
| `iconFeatures` | `string` \| `string[]`                      | —       | Additional icon modifiers.                       |
| `color`        | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | — | Color of the active rating icons.   |
| `precision`    | `number`                                    | `1`     | Rating precision (e.g., `0.5` for half stars).   |
| `customText`   | `string`                                    | —       | Custom text displayed next to the rating.        |
| `spaced`       | `boolean`                                   | `false` | Add spacing between icons.                       |
| `rtl`          | `boolean`                                   | `false` | Right-to-left direction.                         |
| `className`    | `string`                                    | —       | Additional CSS classes.                          |
| `ref`          | `React.Ref<HTMLElement>`                    | —       | Ref forwarded to the container element.          |
| ...            | All standard HTML and Bulma helper props    |         | (See [Helper Props](../helpers/usebulmaclasses)) |

### RateIconProps

| Prop        | Type      | Description                                     |
| ----------- | --------- | ----------------------------------------------- |
| `index`     | `number`  | The index of this icon (0-based).               |
| `isActive`  | `boolean` | Whether this icon is currently active (filled). |
| `isHovered` | `boolean` | Whether this icon is currently hovered.         |
| `value`     | `number`  | The current value.                              |

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
          <Control iconLeftName="fas fa-star">
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
