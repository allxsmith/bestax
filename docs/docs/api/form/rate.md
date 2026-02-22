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

// Also import the extras CSS
import '@allxsmith/bestax-bulma/dist/extras.css';
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
    <div>
      <Rate value={rating} onChange={setRating} />
      <p className="mt-2">Rating: {rating} stars</p>
    </div>
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
<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <Rate defaultValue={3} size="small" />
  <Rate defaultValue={3} />
  <Rate defaultValue={3} size="medium" />
  <Rate defaultValue={3} size="large" />
</div>
```

---

### Custom Max Value

Rating with more than 5 stars.

```tsx live
function example() {
  const [rating, setRating] = useState(7);
  return (
    <div>
      <Rate value={rating} onChange={setRating} max={10} showScore />
      <p className="mt-2">Rating: {rating} out of 10</p>
    </div>
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
