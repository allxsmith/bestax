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

| Prop            | Type                                                                  | Description                                                                         |
| --------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `hasIconsLeft`  | `boolean`                                                             | Adds left icon container.                                                           |
| `hasIconsRight` | `boolean`                                                             | Adds right icon container.                                                          |
| `isLoading`     | `boolean`                                                             | Shows loading indicator.                                                            |
| `isExpanded`    | `boolean`                                                             | Makes the control expand to fill available space.                                   |
| `size`          | `'small' \| 'medium' \| 'large'`                                      | Sets the control size.                                                              |
| `textColor`     | [Bulma color]\*, `'inherit'`, `'current'`                             | Sets text color.                                                                    |
| `color`         | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger'` | Bulma color for the control.                                                        |
| `bgColor`       | [Bulma color]\*, `'inherit'`, `'current'`                             | Background color.                                                                   |
| `iconLeft`      | `IconProps`                                                           | Icon props for left icon.                                                           |
| `iconRight`     | `IconProps`                                                           | Icon props for right icon.                                                          |
| `iconLeftName`  | `string`                                                              | Shortcut for left icon name.                                                        |
| `iconLeftSize`  | `'small' \| 'medium' \| 'large'`                                      | Shortcut for left icon size.                                                        |
| `iconRightName` | `string`                                                              | Shortcut for right icon name.                                                       |
| `iconRightSize` | `'small' \| 'medium' \| 'large'`                                      | Shortcut for right icon size.                                                       |
| `className`     | `string`                                                              | Additional CSS classes to apply.                                                    |
| `children`      | `React.ReactNode`                                                     | Content inside the control.                                                         |
| `as`            | `'div' \| 'p'`                                                        | Element type for the control (`div` by default).                                    |
| `ref`           | `React.Ref<HTMLDivElement \| HTMLParagraphElement>`                   | Ref for the control element.                                                        |
| ...             | All standard HTML and Bulma helper props                              | See [Helper Props](../helpers/usebulmaclasses.md) for available Bulma helper props. |

\* [Bulma color] options include: `'primary'`, `'link'`, `'info'`, `'success'`, `'warning'`, `'danger'`, `'black'`, `'black-bis'`, `'black-ter'`, `'grey-darker'`, `'grey-dark'`, `'grey'`, `'grey-light'`, `'grey-lighter'`, `'white'`, `'white-bis'`, `'white-ter'`.

---

## Usage

### With Input

This example shows the `Control` component wrapping an `Input` inside a `Field`. Use `Control` to provide consistent spacing and icon placement for form elements. The `placeholder` prop on `Input` provides hint text.

```tsx live
<Field label="Default">
  <Control>
    <Input placeholder="Default input" />
  </Control>
</Field>
```

---

### With Select

This example demonstrates using the `Control` component to wrap a `Select` element. The `Control` ensures proper Bulma styling and layout for the select dropdown.

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

This example shows a `Control` wrapping a `TextArea`. The `Control` component provides a styled container that can include icons, loading indicators, and size variations.

```tsx live
<Field label="Default">
  <Control>
    <TextArea placeholder="Write here..." />
  </Control>
</Field>
```

---

### With Icons (Left and Right)

This example demonstrates using the `Control` component with icons on both sides. The `hasIconsLeft` and `hasIconsRight` props add icon containers, and the `iconLeft` and `iconRight` props define the icons to be used.

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

This example shows how to use shortcut props for quickly adding an icon to the left of the input. The `iconLeftName` and `iconLeftSize` props are used for specifying the icon's name and size, respectively.

```tsx live
<Field>
  <Control hasIconsLeft iconLeftName="user" iconLeftSize="small">
    <Input size="small" placeholder="With left icon shortcut" />
  </Control>
</Field>
```

---

### With Only Right Icon (Shortcut Props)

Similar to the previous example, this one demonstrates adding an icon to the right of the input using shortcut props. The `iconRightName` and `iconRightSize` props define the icon's characteristics.

```tsx live
<Field>
  <Control hasIconsRight iconRightName="check" iconRightSize="small">
    <Input size="small" placeholder="With right icon shortcut" />
  </Control>
</Field>
```

---

### With Icons and Size Variations

This example combines icon usage with size variations. The `size` prop on `Control` and `Input` adjusts the size, while the `iconLeft` and `iconRight` props with size specifications control the icon sizes.

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

The `isLoading` prop can be used to indicate a loading state for the control. This example shows a control with an input field in a loading state.

```tsx live
<Field label="Loading">
  <Control isLoading>
    <Input placeholder="Loading state" />
  </Control>
</Field>
```

---

### Loading State with Size Variations

This example demonstrates the loading state with different size variations. The `size` prop is used to control the size of the `Control` and `Input` components.

```tsx live
<>
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
</>
```

---

### Expanded Control

The `isExpanded` prop makes the control expand to fill the available space. This example shows an expanded control with an input field.

```tsx live
<Field label="Expanded">
  <Control isExpanded>
    <Input placeholder="Expands to fill available space" />
  </Control>
</Field>
```

---

### Control as Paragraph (`as="p"`)

The `as` prop allows rendering the control as a different HTML element. This example shows the control rendered as a paragraph (`<p>`), which can be useful for inline forms or specific layout requirements.

```tsx live
<Field label="Control as Paragraph">
  <Control as="p">
    <Input placeholder="Inside a <p> element" />
  </Control>
</Field>
```

---

### With Radios or Checkboxes

The `Control` component can also be used with radio buttons or checkboxes. This example shows how to group radio buttons and checkboxes within a control.

```tsx live
<>
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
</>
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
- [Storybook: Input Stories](https://bestax.io/storybook/?path=/story/form-input--default)
