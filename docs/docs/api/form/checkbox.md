---
title: Checkbox
sidebar_label: Checkbox
---

# Checkbox

## Overview

The `Checkbox` component provides a Bulma-styled checkbox input with flexible labels and helper classes. Use it for single boolean choices, forms, or within a group using the `Checkboxes` component.

:::info
Use `Checkbox` for toggling a single item. For groups, use with `Checkboxes`.
:::

---

## Import

```tsx
import { Checkbox } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                               | Default | Description                                      |
| ----------- | -------------------------------------------------- | ------- | ------------------------------------------------ |
| `disabled`  | `boolean`                                          | —       | Whether the checkbox is disabled.                |
| `className` | `string`                                           | —       | Additional CSS classes.                          |
| `children`  | `React.ReactNode`                                  | —       | Label/content for the checkbox.                  |
| ...         | All standard HTML `<input>` and Bulma helper props |         | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Basic Checkbox

```tsx
<Checkbox>Stay Signed In</Checkbox>
```

### Checkbox With Link

```tsx
<Checkbox>
  I have read and agree to the
  <a href="#" target="_blank" rel="noopener noreferrer">
    terms and conditions
  </a>
  .
</Checkbox>
```

### Disabled Checkbox

```tsx
<Checkbox disabled>Stay Signed In</Checkbox>
```

---

## Accessibility

- The checkbox is rendered as a `<label>` wrapping an `<input type="checkbox">`.
- The `children` prop provides the accessible label.

---

title: Checkbox
sidebar_label: Checkbox

---

# Checkbox

## Overview

The `Checkbox` component provides a Bulma-styled checkbox input. Pass the label as children; you can include plain text, links, or custom JSX. Use it for boolean choices and combine with the `Checkboxes` component for grouped options.

---

## Import

```tsx
import Checkbox from '@allxsmith/bestax-bulma';
import Checkboxes from '@allxsmith/bestax-bulma'; // for groups
```

---

## Props

| Prop        | Type                                          | Description                                      |
| ----------- | --------------------------------------------- | ------------------------------------------------ |
| `disabled`  | `boolean`                                     | Whether the checkbox is disabled.                |
| `className` | `string`                                      | Additional CSS classes.                          |
| `children`  | `React.ReactNode`                             | Label/content for the checkbox.                  |
| ...         | All standard `<input>` and Bulma helper props | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Basic Checkbox

```tsx
<Checkbox>Stay Signed In</Checkbox>
```

### Checkbox With Link In Label

```tsx
<Checkbox>
  I have read and agree to the{' '}
  <a href="#" target="_blank" rel="noopener noreferrer">
    terms and conditions
  </a>
  .
</Checkbox>
```

### Disabled Checkbox

```tsx
<Checkbox disabled>Stay Signed In</Checkbox>
```

### Group/List of Checkboxes

Use the `Checkboxes` wrapper for a vertical group.

```tsx
<Checkboxes>
  <Checkbox>Make the bed</Checkbox>
  <Checkbox>Brush teeth</Checkbox>
  <Checkbox>Do homework</Checkbox>
  <Checkbox>Feed the pet</Checkbox>
  <Checkbox>Take out the trash</Checkbox>
  <Checkbox>Clean your room</Checkbox>
  <Checkbox>Set the table</Checkbox>
  <Checkbox>Help with dishes</Checkbox>
  <Checkbox>Water the plants</Checkbox>
  <Checkbox>Put away toys</Checkbox>
</Checkboxes>
```

---

## Accessibility

- Each `Checkbox` is rendered as a `<label>` wrapping an `<input type="checkbox">` and the label text, for optimal accessibility.
- The clickable area includes both box and label by default.

---

## Related Components

- [`Checkboxes`](./checkboxes.md) – for grouped checkboxes.
- [`Field`](./field.md) – for labeled/structured forms.
- [Helper Props](../helpers/usebulmaclasses.md)

---

## Additional Resources

- [Bulma Checkbox Documentation](https://bulma.io/documentation/form/checkbox/)
- [Storybook: Checkbox Stories](https://bestax.cc/storybook/?path=/story/form-checkbox--default)

---

## Related Components

- [`Checkboxes`](./checkboxes.md): For grouped checkboxes.
- [`Field`](./field.md): For forms.
- [Helper Props](../helpers/usebulmaclasses.md): For spacing, color, etc.

---

## Additional Resources

- [Bulma Checkbox Documentation](https://bulma.io/documentation/form/checkbox/)
- [Storybook: Checkbox Stories](https://bestax.cc/storybook/?path=/story/form-checkbox--default)
