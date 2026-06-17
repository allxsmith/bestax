---
title: Select
sidebar_label: Select
---

# Select

## Overview

The `Select` component provides a Bulma-styled dropdown for selecting one or more options. It supports color, size, rounded corners, loading, hover/focus state, multiselect, fullwidth, icons, and all Bulma helper props.

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
| `isHovered`    | `boolean`                                      | Forces hovered state on the inner select.        |
| `isFocused`    | `boolean`                                      | Forces focused state on the inner select.        |
| `isFullwidth`  | `boolean`                                      | Makes the select span the full width of parent.  |
| `isActive`     | `boolean`                                      | Applies Bulma's is-active modifier.              |
| `className`    | `string`                                       | Additional CSS classes.                          |
| `disabled`     | `boolean`                                      | Disables the select.                             |
| `multiple`     | `boolean`                                      | Allows multiple selections.                      |
| `multipleSize` | `number`                                       | Number of visible options in multiselect.        |
| `children`     | `React.ReactNode`                              | `<option>` elements.                             |
| ...            | All standard `<select>` and Bulma helper props | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

`Select` is a convenience component that internally composes `Field` and `Control`. For most form fields, use `<Select>` directly with its props (`label`, `color`, `size`, `iconLeftName`, `message`, `horizontal`, etc.). Reach for explicit `<Field>` + `<Control>` composition only when you need a layout the convenience props can't express — most commonly **form addons**, **horizontal layouts that mix multiple sub-fields**, or **fullwidth selects inside addons**.

### Default Select

A standard dropdown. The `children` prop provides the `<option>` elements.

```tsx live
<Select label="Default">
  <option value="">Please select</option>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</Select>
```

---

### Multi Select

Set the `multiple` prop to enable multi-selection. The `multipleSize` prop controls how many options are visible at once.

```tsx live
<Select label="Multi Select" multiple multipleSize={10}>
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
```

---

### Colored Select

The `color` prop applies Bulma color modifiers.

```tsx live
<>
  <Select label="Primary" color="primary">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
  </Select>
  <Select label="Link" color="link">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
  </Select>
  <Select label="Info" color="info">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
  </Select>
  <Select label="Success" color="success">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
  </Select>
  <Select label="Warning" color="warning">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
  </Select>
  <Select label="Danger" color="danger">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
  </Select>
</>
```

---

### Rounded Style

The `isRounded` prop gives the select rounded corners.

```tsx live
<Select label="Rounded" isRounded>
  <option value="">Please select</option>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</Select>
```

---

### Sizes

The `size` prop controls the select's size.

```tsx live
<>
  <Select label="Small" size="small">
    <option value="">Please select</option>
    <option value="option1">Option 1</option>
    <option value="option2">Option 2</option>
  </Select>
  <Select label="Normal">
    <option value="">Please select</option>
    <option value="option1">Option 1</option>
    <option value="option2">Option 2</option>
  </Select>
  <Select label="Medium" size="medium">
    <option value="">Please select</option>
    <option value="option1">Option 1</option>
    <option value="option2">Option 2</option>
  </Select>
  <Select label="Large" size="large">
    <option value="">Please select</option>
    <option value="option1">Option 1</option>
    <option value="option2">Option 2</option>
  </Select>
</>
```

---

### States

`isHovered`, `isFocused`, and `isLoading` force the corresponding state on the select.

```tsx live
<>
  <Select label="Normal">
    <option value="">Please select</option>
    <option value="option1">Option 1</option>
  </Select>
  <Select label="Hover" isHovered>
    <option value="">Please select</option>
    <option value="option1">Option 1</option>
  </Select>
  <Select label="Focus" isFocused>
    <option value="">Please select</option>
    <option value="option1">Option 1</option>
  </Select>
  <Select label="Loading" isLoading>
    <option value="">Please select</option>
    <option value="option1">Option 1</option>
  </Select>
</>
```

---

### Loading States by Size

The loading indicator at every select size.

```tsx live
<>
  <Select label="Loading Small" size="small" isLoading>
    <option value="">Please select</option>
  </Select>
  <Select label="Loading Normal" isLoading>
    <option value="">Please select</option>
  </Select>
  <Select label="Loading Medium" size="medium" isLoading>
    <option value="">Please select</option>
  </Select>
  <Select label="Loading Large" size="large" isLoading>
    <option value="">Please select</option>
  </Select>
</>
```

---

### Disabled

Use the native `disabled` attribute to disable the select.

```tsx live
<Select label="Disabled" disabled>
  <option value="">Cannot change</option>
</Select>
```

---

### With Icons

Selects support a left icon only (Bulma's chevron occupies the right). Use the `iconLeftName` shortcut on `<Select>`.

```tsx live
<Select label="With Icons" iconLeftName="person">
  <option value="huck">Huckleberry Finn</option>
  <option value="tom">Tom Sawyer</option>
  <option value="becky">Becky Thatcher</option>
  <option value="jim">Jim</option>
  <option value="pap">Pap Finn</option>
</Select>
```

---

### With Icons and Size Variations

Match the icon size to the select size.

```tsx live
<>
  <Select
    label="With Icons Small"
    size="small"
    iconLeftName="person"
    iconLeftSize="small"
  >
    <option value="huck">Huckleberry Finn</option>
    <option value="tom">Tom Sawyer</option>
  </Select>
  <Select label="With Icons Normal" iconLeftName="person">
    <option value="huck">Huckleberry Finn</option>
    <option value="tom">Tom Sawyer</option>
  </Select>
  <Select
    label="With Icons Medium"
    size="medium"
    iconLeftName="person"
    iconLeftSize="medium"
  >
    <option value="huck">Huckleberry Finn</option>
    <option value="tom">Tom Sawyer</option>
  </Select>
  <Select
    label="With Icons Large"
    size="large"
    iconLeftName="person"
    iconLeftSize="large"
  >
    <option value="huck">Huckleberry Finn</option>
    <option value="tom">Tom Sawyer</option>
  </Select>
</>
```

---

### Form Addons

For multi-control rows like select + input + button, drop down to manual `Field` + `Control` composition.

#### Currency Select + Input + Button

A common pattern: a small select acting as a unit picker (currency, country code), an expanded input, and a submit button.

```tsx live
<Field hasAddons>
  <Control>
    <Select aria-label="Currency">
      <option>$</option>
      <option>£</option>
      <option>€</option>
    </Select>
  </Control>
  <Control isExpanded>
    <Input type="text" placeholder="Amount of money" />
  </Control>
  <Control>
    <Button>Transfer</Button>
  </Control>
</Field>
```

#### Fullwidth Select + Button

Use `isFullwidth` on the Select with `isExpanded` on its Control to make the dropdown grow to fill the row.

```tsx live
<Field hasAddons>
  <Control isExpanded>
    <Select isFullwidth aria-label="Country">
      <option>United States</option>
      <option>United Kingdom</option>
      <option>Canada</option>
      <option>France</option>
      <option>Germany</option>
    </Select>
  </Control>
  <Control>
    <Button color="primary">Choose</Button>
  </Control>
</Field>
```

---

### Horizontal — Select in Narrow Field

In horizontal forms, mark the inner `<Field narrow>` so it doesn't stretch the full row, and use `isFullwidth` on the Select to fill the narrow field.

```tsx live
<Field horizontal label="Department">
  <Field.Body>
    <Field narrow>
      <Control>
        <Select isFullwidth>
          <option>Business development</option>
          <option>Marketing</option>
          <option>Sales</option>
        </Select>
      </Control>
    </Field>
  </Field.Body>
</Field>
```

---

### Context-Aware Rendering

The `Select` component is context-aware: it detects whether it is already inside a `Field` or `Control` and adjusts its rendering accordingly. You can use it standalone with a `label` prop (it wraps itself in Field+Control), inside a `Field` (it skips its own Field), or inside both `Field` and `Control` (it renders only the raw select).

#### Default (with label)

```tsx live
<Select label="Country">
  <option value="">Please select</option>
  <option value="us">United States</option>
  <option value="uk">United Kingdom</option>
  <option value="ca">Canada</option>
</Select>
```

---

#### With Field Wrapper

```tsx live
function example() {
  return (
    <Field horizontal label="Country">
      <Field.Body>
        <Field>
          <Select>
            <option value="">Please select</option>
            <option value="us">United States</option>
            <option value="uk">United Kingdom</option>
            <option value="ca">Canada</option>
          </Select>
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

#### With Field and Control Wrappers

```tsx live
function example() {
  return (
    <Field horizontal label="Country">
      <Field.Body>
        <Field>
          <Control iconLeftName="globe">
            <Select>
              <option value="">Please select</option>
              <option value="us">United States</option>
              <option value="uk">United Kingdom</option>
              <option value="ca">Canada</option>
            </Select>
          </Control>
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

## Accessibility

- Always provide a `<label>` (use Select's `label` prop, or wrap in `Field`) for accessible select usage.
- Use the `multiple` and `multipleSize` props for multi-select dropdowns.

---

## Related Components

- [`Control`](./control.md): For icons and loading.
- [`Field`](./field.md): For field grouping and labels.

---

## Additional Resources

- [Bulma Select Documentation](https://bulma.io/documentation/form/select/)
- [Storybook: Select Stories](https://bestax.io/storybook/?path=/story/form-select--default)
