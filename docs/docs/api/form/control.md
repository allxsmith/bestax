---
title: Control
sidebar_label: Control
---

# Control

## Overview

The `Control` component is a Bulma-styled wrapper for form controls (`Input`, `Select`, `TextArea`, etc.), supporting icons (left/right), loading state, expansion, size, and Bulma helper props for layout and color. Use it to provide consistent spacing, icon placement, and loading indicators for any form element.

---

## Import

```tsx
import { Control, Input, Select, TextArea } from '@allxsmith/bestax-bulma';
// ...and other form elements as needed
```

---

## Props

| Prop            | Type                                                                                                                                                                                                                                                                                     | Description                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | -------- | ----------------------------- | --------- | --------- | --------------------- |
| `hasIconsLeft`  | `boolean`                                                                                                                                                                                                                                                                                | Adds left icon container.                        |
| `hasIconsRight` | `boolean`                                                                                                                                                                                                                                                                                | Adds right icon container.                       |
| `isLoading`     | `boolean`                                                                                                                                                                                                                                                                                | Shows loading indicator.                         |
| `isExpanded`    | `boolean`                                                                                                                                                                                                                                                                                | Makes the control expand to fill space.          |
| `size`          | `'small' \| 'medium' \| 'large'`                                                                                                                                                                                                                                                         | Sets control size.                               |
| `textColor`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | Text color.                                      |
| `color`         | `'primary'                                                                                                                                                                                                                                                                               | 'link'                                           | 'info'   | 'success'                     | 'warning' | 'danger'` | Bulma color modifier. |
| `bgColor`       | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | Background color.                                |
| `iconLeft`      | `IconProps`                                                                                                                                                                                                                                                                              | Props for left icon.                             |
| `iconRight`     | `IconProps`                                                                                                                                                                                                                                                                              | Props for right icon.                            |
| `iconLeftName`  | `string`                                                                                                                                                                                                                                                                                 | Shortcut for left icon name.                     |
| `iconLeftSize`  | `'small'                                                                                                                                                                                                                                                                                 | 'medium'                                         | 'large'` | Shortcut for left icon size.  |
| `iconRightName` | `string`                                                                                                                                                                                                                                                                                 | Shortcut for right icon name.                    |
| `iconRightSize` | `'small'                                                                                                                                                                                                                                                                                 | 'medium'                                         | 'large'` | Shortcut for right icon size. |
| `className`     | `string`                                                                                                                                                                                                                                                                                 | Additional CSS classes.                          |
| `children`      | `React.ReactNode`                                                                                                                                                                                                                                                                        | Content inside the control.                      |
| `as`            | `'div' \| 'p'`                                                                                                                                                                                                                                                                           | Element type for the container (default: `div`). |
| ...             | All standard HTML and Bulma helper props                                                                                                                                                                                                                                                 | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### With Input

```tsx live
<Field label="Default">
  <Control>
    <Input placeholder="Default input" />
  </Control>
</Field>
```

---

### With Select

```tsx live
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

### With TextArea

```tsx live
<Field label="Default">
  <Control>
    <TextArea placeholder="Write here..." />
  </Control>
</Field>
```

---

### With Icons (Left and Right)

```tsx live
<Field>
  <Control
    hasIconsLeft
    hasIconsRight
    iconLeft={{ name: 'user' }}
    iconRight={{ name: 'check' }}
  >
    <Input placeholder="With icons" />
  </Control>
</Field>
```

---

### With Only Left Icon (Shortcut Props)

```tsx live
<Field>
  <Control hasIconsLeft iconLeftName="user" iconLeftSize="small">
    <Input size="small" placeholder="With left icon shortcut" />
  </Control>
</Field>
```

---

### With Only Right Icon (Shortcut Props)

```tsx live
<Field>
  <Control hasIconsRight iconRightName="check" iconRightSize="small">
    <Input size="small" placeholder="With right icon shortcut" />
  </Control>
</Field>
```

---

### With Icons and Size Variations

```tsx live
<Field>
  <Control
    hasIconsLeft
    hasIconsRight
    size="medium"
    iconLeft={{ name: 'user', size: 'medium' }}
    iconRight={{ name: 'check', size: 'medium' }}
  >
    <Input size="medium" placeholder="Icons left/right medium" />
  </Control>
</Field>
```

---

### Loading State

```tsx live
<Field label="Loading">
  <Control isLoading>
    <Input placeholder="Loading state" />
  </Control>
</Field>
```

---

### Loading State with Size Variations

```tsx live
<Field label="Loading Small">
  <Control isLoading size="small">
    <Input size="small" placeholder="Loading small" />
  </Control>
</Field>

<Field label="Loading Medium">
  <Control isLoading size="medium">
    <Input size="medium" placeholder="Loading medium" />
  </Control>
</Field>

<Field label="Loading Large">
  <Control isLoading size="large">
    <Input size="large" placeholder="Loading large" />
  </Control>
</Field>
```

---

### Expanded Control

```tsx live
<Field label="Expanded">
  <Control isExpanded>
    <Input placeholder="Expands to fill available space" />
  </Control>
</Field>
```

---

### Control as Paragraph (`as="p"`)

```tsx live
<Field label="Control as Paragraph">
  <Control as="p">
    <Input placeholder="Inside a <p> element" />
  </Control>
</Field>
```

---

### With Radios or Checkboxes

```tsx live
<Field label="Options">
  <Control>
    <Radio name="option">Option 1</Radio>
    <Radio name="option">Option 2</Radio>
  </Control>
</Field>

<Field label="Preferences">
  <Control>
    <Checkbox>Enable notifications</Checkbox>
    <Checkbox>Subscribe to newsletter</Checkbox>
  </Control>
</Field>
```

---

## Accessibility

- `Control` provides only visual and layout structure; ensure you use associated `Field` and `label` for accessible form labeling.
- Icons are decorative by default. Add ARIA attributes to icons if needed for accessibility.

---

## Related Components

- [`Field`](./field.md): Use for labeling and grouping.
- [`Input`](./input.md), [`Select`](./select.md), [`TextArea`](./textarea.md), [`Radio`](./radio.md), [`Checkbox`](./checkbox.md): Use as children of `Control`.
- [Helper Props](../helpers/usebulmaclasses.md)

---

## Additional Resources

- [Bulma Control Documentation](https://bulma.io/documentation/form/general/#control)
- [Storybook: Input Stories](https://bestax.cc/storybook/?path=/story/form-input--default)
