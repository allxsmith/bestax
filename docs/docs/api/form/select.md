---
title: Select
sidebar_label: Select
---

# Select

## Overview

The `Select` component provides a Bulma-styled dropdown for selecting one or more options. It supports color, size, rounded corners, loading, multiselect, icons, and all Bulma helper props.

---

## Import

```tsx
import { Select, Field, Control } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop           | Type                                           | Description                                      |
| -------------- | ---------------------------------------------- | ------------------------------------------------ |
| `color`        | `'primary' \| 'link' \| ... \| 'white'`        | Bulma color modifier.                            |
| `size`         | `'small' \| 'medium' \| 'large'`               | Size modifier.                                   |
| `isRounded`    | `boolean`                                      | Rounded select corners.                          |
| `isLoading`    | `boolean`                                      | Shows loading indicator.                         |
| `isActive`     | `boolean`                                      | Applies Bulma's is-active modifier.              |
| `className`    | `string`                                       | Additional CSS classes.                          |
| `disabled`     | `boolean`                                      | Disables the select.                             |
| `multiple`     | `boolean`                                      | Allows multiple selections.                      |
| `multipleSize` | `number`                                       | Number of visible options in multiselect.        |
| `children`     | `React.ReactNode`                              | `<option>` elements.                             |
| ...            | All standard `<select>` and Bulma helper props | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Default Select

```tsx
<Field label="Default">
  <Control>
    <Select>
      <option value="">Please select</option>
      <option value="option1">Option 1</option>
      <option value="option2">Option 2</option>
    </Select>
  </Control>
</Field>
```

---

### Multi Select

```tsx
<Field label="Multi Select">
  <Control>
    <Select multiple multipleSize={10}>
      <option value="huck">Huckleberry Finn</option>
      <option value="tom">Tom Sawyer</option>
      <option value="becky">Becky Thatcher</option>
      <option value="jim">Jim</option>
      <option value="pap">Pap Finn</option>
      <option value="duke">The Duke</option>
      <option value="king">The King</option>
      <option value="widow">Widow Douglas</option>
      <option value="judge">Judge Thatcher</option>
      <option value="sid">Sid Sawyer</option>
    </Select>
  </Control>
</Field>
```

---

### Colored Select

```tsx
<Field label="Primary">
  <Control>
    <Select color="primary">
      <option value="1">Option 1</option>
      <option value="2">Option 2</option>
    </Select>
  </Control>
</Field>

<Field label="Link">
  <Control>
    <Select color="link">
      <option value="1">Option 1</option>
      <option value="2">Option 2</option>
    </Select>
  </Control>
</Field>

<Field label="Info">
  <Control>
    <Select color="info">
      <option value="1">Option 1</option>
      <option value="2">Option 2</option>
    </Select>
  </Control>
</Field>

<Field label="Success">
  <Control>
    <Select color="success">
      <option value="1">Option 1</option>
      <option value="2">Option 2</option>
    </Select>
  </Control>
</Field>

<Field label="Warning">
  <Control>
    <Select color="warning">
      <option value="1">Option 1</option>
      <option value="2">Option 2</option>
    </Select>
  </Control>
</Field>

<Field label="Danger">
  <Control>
    <Select color="danger">
      <option value="1">Option 1</option>
      <option value="2">Option 2</option>
    </Select>
  </Control>
</Field>
```

---

### Rounded Style

```tsx
<Field label="Rounded">
  <Control>
    <Select isRounded>
      <option value="">Please select</option>
      <option value="option1">Option 1</option>
      <option value="option2">Option 2</option>
    </Select>
  </Control>
</Field>
```

---

### Sizes

```tsx
<Field label="Small">
  <Control>
    <Select size="small">
      <option value="">Please select</option>
      <option value="option1">Option 1</option>
      <option value="option2">Option 2</option>
    </Select>
  </Control>
</Field>

<Field label="Normal">
  <Control>
    <Select>
      <option value="">Please select</option>
      <option value="option1">Option 1</option>
      <option value="option2">Option 2</option>
    </Select>
  </Control>
</Field>

<Field label="Medium">
  <Control>
    <Select size="medium">
      <option value="">Please select</option>
      <option value="option1">Option 1</option>
      <option value="option2">Option 2</option>
    </Select>
  </Control>
</Field>

<Field label="Large">
  <Control>
    <Select size="large">
      <option value="">Please select</option>
      <option value="option1">Option 1</option>
      <option value="option2">Option 2</option>
    </Select>
  </Control>
</Field>
```

---

### States

```tsx
<Field label="Normal">
  <Control>
    <Select>
      <option value="">Please select</option>
      <option value="option1">Option 1</option>
      <option value="option2">Option 2</option>
    </Select>
  </Control>
</Field>

<Field label="Hover">
  <Control>
    <Select className="is-hovered">
      <option value="">Please select</option>
      <option value="option1">Option 1</option>
      <option value="option2">Option 2</option>
    </Select>
  </Control>
</Field>

<Field label="Focus">
  <Control>
    <Select className="is-focused">
      <option value="">Please select</option>
      <option value="option1">Option 1</option>
      <option value="option2">Option 2</option>
    </Select>
  </Control>
</Field>

<Field label="Loading">
  <Control isLoading>
    <Select isLoading>
      <option value="">Please select</option>
      <option value="option1">Option 1</option>
      <option value="option2">Option 2</option>
    </Select>
  </Control>
</Field>
```

---

### With Icons

```tsx
<Field label="With Icons">
  <Control hasIconsLeft iconLeft={{ name: 'person' }}>
    <Select>
      <option value="huck">Huckleberry Finn</option>
      <option value="tom">Tom Sawyer</option>
      <option value="becky">Becky Thatcher</option>
      <option value="jim">Jim</option>
      <option value="pap">Pap Finn</option>
    </Select>
  </Control>
</Field>
```

---

### With Icons and Size Variations

```tsx
<Field label="With Icons Small">
  <Control
    hasIconsLeft
    iconLeft={{ name: 'person', size: 'small' }}
    size="small"
  >
    <Select size="small">
      <option value="huck">Huckleberry Finn</option>
      <option value="tom">Tom Sawyer</option>
    </Select>
  </Control>
</Field>

<Field label="With Icons Normal">
  <Control hasIconsLeft iconLeft={{ name: 'person' }}>
    <Select>
      <option value="huck">Huckleberry Finn</option>
      <option value="tom">Tom Sawyer</option>
    </Select>
  </Control>
</Field>

<Field label="With Icons Medium">
  <Control
    hasIconsLeft
    iconLeft={{ name: 'person', size: 'medium' }}
    size="medium"
  >
    <Select size="medium">
      <option value="huck">Huckleberry Finn</option>
      <option value="tom">Tom Sawyer</option>
    </Select>
  </Control>
</Field>

<Field label="With Icons Large">
  <Control
    hasIconsLeft
    iconLeft={{ name: 'person', size: 'large' }}
    size="large"
  >
    <Select size="large">
      <option value="huck">Huckleberry Finn</option>
      <option value="tom">Tom Sawyer</option>
    </Select>
  </Control>
</Field>
```

---

## Accessibility

- Always provide a `<label>` (use with `Field`) for accessible select usage.
- Use the `multiple` and `multipleSize` props for multi-select dropdowns.

---

## Related Components

- [`Control`](./control.md): For icons and loading.
- [`Field`](./field.md): For field grouping and labels.

---

## Additional Resources

- [Bulma Select Documentation](https://bulma.io/documentation/form/select/)
- [Storybook: Select Stories](https://storybook.bestax.cc/?path=/story/form-select--default)
