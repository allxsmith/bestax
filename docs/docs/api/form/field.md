---
title: Field
sidebar_label: Field
description: The `Field` component is a Bulma-styled form field container.
---

# Field

## Overview

<!-- bestax:generated overview -->

The `Field` component is a Bulma-styled form field container.

<!-- /bestax:generated overview -->

It supports horizontal layouts, grouped controls, labels, label sizing, and all Bulma helper props for color, margin, and more. `Field` is the primary way to compose labeled, grouped, or horizontal layouts in your forms.

---

## Import

<!-- bestax:generated import -->

```tsx
import { Field } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### With Checkbox

This example demonstrates using the `Field` component to label a single `Checkbox`. The `label` prop provides the field label, and the `Checkbox` is rendered as the field's content.

```tsx live
<Field label="Stay Signed In">
  <Checkbox>Stay Signed In</Checkbox>
</Field>
```

---

### With Checkbox and Custom Label (with link)

Use the `Field` component to group a `Checkbox` with a custom label containing a link. This pattern is useful for agreements or terms and conditions.

```tsx live
<Field label="Agreement">
  <Checkbox>
    I have read and agree to the{' '}
    <a href="#" target="_blank" rel="noopener noreferrer">
      terms and conditions
    </a>
    .
  </Checkbox>
</Field>
```

---

### With Grouped Checkboxes

This example shows how to use the `Field` component to label a group of checkboxes. The `Checkboxes` component is used as the field content, and each `Checkbox` receives its own label.

```tsx live
<Field label="Chores">
  <Checkboxes>
    <Checkbox>Make the bed</Checkbox>
    <Checkbox>Brush teeth</Checkbox>
    <Checkbox>Do homework</Checkbox>
  </Checkboxes>
</Field>
```

---

### With File

This example demonstrates using the `Field` component to label a file upload control. The `File` component is used as the field's content, with a custom label for the file input.

```tsx live
<Field label="Upload Resume">
  <File label="Choose a file..." />
</Field>
```

---

### With Input (Default)

The `Field` component can be used to wrap an `Input` control, providing a label and styling. In this example, a default-styled `Input` is used.

```tsx live
<Field label="Default">
  <Control>
    <Input placeholder="Default input" />
  </Control>
</Field>
```

---

### With Input (Sizes)

This example demonstrates using the `Field` component with `Input` controls of various sizes. The `size` prop on `Input` controls the visual size of the input.

```tsx live
<>
  <Field label="Small">
    <Control>
      <Input size="small" placeholder="Small input" />
    </Control>
  </Field>

  <Field label="Normal">
    <Control>
      <Input placeholder="Normal input" />
    </Control>
  </Field>

  <Field label="Medium">
    <Control>
      <Input size="medium" placeholder="Medium input" />
    </Control>
  </Field>

  <Field label="Large">
    <Control>
      <Input size="large" placeholder="Large input" />
    </Control>
  </Field>
</>
```

---

### With Input (Rounded)

This example shows how to create a `Field` with a rounded `Input`. The `isRounded` prop on `Input` gives it a pill-shaped appearance.

```tsx live
<Field label="Rounded">
  <Control>
    <Input isRounded placeholder="Rounded input" />
  </Control>
</Field>
```

---

### With Input (States)

The `Field` component can be used with `Input` controls to demonstrate different states like hover, focus, and loading. This example shows how to apply these states to an `Input`.

```tsx live
<>
  <Field label="Normal">
    <Control>
      <Input placeholder="Normal state" />
    </Control>
  </Field>

  <Field label="Hover">
    <Control>
      <Input isHovered placeholder="Hovered state" />
    </Control>
  </Field>

  <Field label="Focus">
    <Control>
      <Input isFocused placeholder="Focused state" />
    </Control>
  </Field>

  <Field label="Loading">
    <Control isLoading>
      <Input placeholder="Loading state" />
    </Control>
  </Field>
</>
```

---

### With Input (Disabled & Read Only)

This example demonstrates using the `Field` component with `Input` controls that are disabled or read-only. The `disabled` and `readOnly` props control the respective states of the `Input`.

```tsx live
<>
  <Field label="Disabled">
    <Control>
      <Input disabled placeholder="Disabled input" />
    </Control>
  </Field>

  <Field label="Read Only">
    <Control>
      <Input readOnly value="Read only value" />
    </Control>
  </Field>
</>
```

---

### With Input (Static, Horizontal)

You can use the `Field` component to create horizontal layouts for static and editable inputs. This example shows a static `Input` next to an editable one.

```tsx live
<>
  <Field horizontal label="Username">
    <Control>
      <Input isStatic value="Static value" />
    </Control>
  </Field>
  <Field horizontal label="Password">
    <Control>
      <Input placeholder="Editable value" />
    </Control>
  </Field>
</>
```

---

### With Input (Icons)

This example demonstrates adding icons to an `Input` within a `Field`. The `hasIconsLeft` and `hasIconsRight` props add icons to the left and right of the input, respectively.

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

### With Radio

The `Field` component can be used to group `Radio` buttons. In this example, two `Radio` buttons are grouped under the "Pet" label.

```tsx live
<Field label="Pet">
  <Control>
    <Radio name="pet">Cat</Radio>
    <Radio name="pet" defaultChecked>
      Dog
    </Radio>
  </Control>
</Field>
```

---

### With Grouped Radios

This example shows how to use the `Field` component to create a group of `Radio` buttons that are disabled. The `Radios` component is used to group the `Radio` buttons.

```tsx live
<Field label="Event Response">
  <Radios>
    <Radio name="event" disabled>
      Attend
    </Radio>
    <Radio name="event" disabled>
      Decline
    </Radio>
    <Radio name="event" disabled>
      Tentative
    </Radio>
  </Radios>
</Field>
```

---

### With Select

The `Field` component can be used with a `Select` dropdown. This example shows a basic `Select` with two options.

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

### With Select (Multi Select)

This example demonstrates using the `Field` component with a multi-select `Select`. The `multiple` and `multipleSize` props on `Select` enable multiple selections.

```tsx live
<>
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
  <br />
  <br />
  <br />
  <br />
  <br />
  <br />
  <br />
  <br />
  <br />
  <br />
  <br />
  <br />
  <br />
</>
```

---

### With Select (Colors, Sizes, Rounded, Loading, Icons)

In this example, the `Field` component is used with a `Select` that has various enhancements: color, rounded corners, loading state, and icons.

```tsx live
<>
  <Field label="Primary">
    <Control>
      <Select color="primary">
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
    </Control>
  </Field>

  <Field label="Rounded">
    <Control>
      <Select isRounded>
        <option value="">Please select</option>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </Select>
    </Control>
  </Field>

  <Field label="With Icons">
    <Control hasIconsLeft iconLeft={{ name: 'person' }}>
      <Select>
        <option value="huck">Huckleberry Finn</option>
        <option value="tom">Tom Sawyer</option>
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
</>
```

---

### With TextArea

The `Field` component can also be used with a `TextArea`. This example shows a basic usage with a label.

```tsx live
<Field label="Default">
  <Control>
    <TextArea placeholder="Carpe Diem" />
  </Control>
</Field>
```

---

### With TextArea (Rows, Colors, Sizes, States, Loading, Fixed Size)

This example demonstrates the versatility of the `TextArea` component used within a `Field`. It showcases various props like `rows`, `color`, `size`, and states like `loading`.

```tsx live
<>
  <Field label="Rows">
    <Control>
      <TextArea rows={8} placeholder="8 rows" />
    </Control>
  </Field>

  <Field label="Primary">
    <Control>
      <TextArea color="primary" placeholder="Primary (color='primary')" />
    </Control>
  </Field>

  <Field label="Small">
    <Control>
      <TextArea size="small" placeholder="Small" />
    </Control>
  </Field>

  <Field label="Hover">
    <Control>
      <TextArea isHovered placeholder="Hovered state" />
    </Control>
  </Field>

  <Field label="Loading">
    <Control isLoading>
      <TextArea placeholder="Loading state" />
    </Control>
  </Field>

  <Field label="Fixed Size">
    <Control>
      <TextArea hasFixedSize placeholder="Fixed size textarea" rows={3} />
    </Control>
  </Field>
</>
```

---

### Grouped Controls

This example demonstrates using the `Field` component to create a group of controls. The `grouped` prop is used on the `Field`, and each control is placed inside a `Control` component.

```tsx live
<Field grouped>
  <Control>
    <Input placeholder="First" />
  </Control>
  <Control>
    <Input placeholder="Second" />
  </Control>
</Field>
```

---

### Compound (dot-notation) usage

Alongside the existing `Field.Label` and `Field.Body` statics, `Control` is now also available as `Field.Control`, so a field can be composed from the single `Field` import.

```tsx live
<Field horizontal>
  <Field.Label>Name</Field.Label>
  <Field.Body>
    <Field.Control>
      <Input placeholder="Jane Doe" />
    </Field.Control>
  </Field.Body>
</Field>
```

---

## Accessibility

- Renders a `<label>` for the field, but `Field` itself does not associate it with any control — pass `labelProps={{ htmlFor }}` and a matching `id` on your control. The single-control convenience inputs (`Input`, `Select`, `TextArea`, and similar) do this automatically via their own `label` prop.
- Grouped/horizontal layouts use Bulma’s grid for layout.
- Always use the `label` prop or a custom label for clarity.

---

## Related Components

- [`Control`](./control.md): For wrapping form controls.
- [`Input`](./input.md), [`Select`](./select.md), [`TextArea`](./textarea.md): Use inside `Field`.
- [`Checkbox`](./checkbox.md), [`Checkboxes`](./checkboxes.md), [`Radio`](./radio.md), [`Radios`](./radios.md), [`File`](./file.md)

---

## Additional Resources

- [Bulma Field Documentation](https://bulma.io/documentation/form/general/#field)
- [Storybook: Field Stories](https://bestax.io/storybook/?path=/story/form-input--default)

---

## Props

<!-- bestax:generated props -->

| Prop         | Type                                                                            | Default | Description                                                                                                                                                                                                                                                   |
| ------------ | ------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `horizontal` | `boolean`                                                                       | `false` | Renders the field as horizontal (label and control side by side).                                                                                                                                                                                             |
| `grouped`    | `boolean` \| `'centered'` \| `'right'` \| `'multiline'`                         | —       | Group controls in a row (optionally centered, right, or multiline).                                                                                                                                                                                           |
| `hasAddons`  | `boolean` \| `'centered'` \| `'right'`                                          | —       | Group controls as addons (optionally centered or right-aligned).                                                                                                                                                                                              |
| `narrow`     | `boolean`                                                                       | `false` | Constrains the field to its content's width (used inside horizontal field bodies).                                                                                                                                                                            |
| `label`      | `React.ReactNode`                                                               | —       | Field label, rendered above the widget. `Field` itself does not associate it with any control — pass `labelProps={{ htmlFor }}` and a matching `id` on your control (the single-control convenience inputs do this automatically via their own `label` prop). |
| `labelSize`  | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                              | —       | Size for the label.                                                                                                                                                                                                                                           |
| `labelProps` | `React.LabelHTMLAttributes<HTMLLabelElement> & { [key: string]: unknown; }`     | —       | Props for the label element — where `htmlFor` goes when composing.                                                                                                                                                                                            |
| `textColor`  | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Text color for the field.                                                                                                                                                                                                                                     |
| `color`      | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Bulma color for the field.                                                                                                                                                                                                                                    |
| `bgColor`    | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Background color for the field.                                                                                                                                                                                                                               |
| `className`  | `string`                                                                        | —       | Additional CSS classes.                                                                                                                                                                                                                                       |
| `children`   | `React.ReactNode`                                                               | —       | Field content.                                                                                                                                                                                                                                                |
| `...`        | All standard `<div>` attributes and Bulma helper props                          | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                             |

**Subcomponents:**

- `Field.Label`: FieldLabel component for rendering a Bulma field label.
- `Field.Body`: FieldBody component for rendering Bulma field body.
- [`Field.Control`](control.md): The `Control` component is a Bulma-styled wrapper for form controls (`Input`, `Select`, `TextArea`, etc.), supporting icons (left/right), loading state, expansion, size, and Bulma helper props for layout and color.

### Field.Label

| Prop        | Type                                                                            | Default | Description                                       |
| ----------- | ------------------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `size`      | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                              | —       | Size for the field label.                         |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Text color for the label.                         |
| `color`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Bulma color for the label.                        |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Background color for the label.                   |
| `className` | `string`                                                                        | —       | Additional CSS classes.                           |
| `children`  | `React.ReactNode`                                                               | —       | Field label content.                              |
| `...`       | All standard `<div>` attributes and Bulma helper props                          | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### Field.Body

| Prop        | Type                                                                            | Default | Description                                       |
| ----------- | ------------------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Text color for the field body.                    |
| `color`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Bulma color for the field body.                   |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Background color for the field body.              |
| `className` | `string`                                                                        | —       | Additional CSS classes.                           |
| `children`  | `React.ReactNode`                                                               | —       | Field body content.                               |
| `...`       | All standard `<div>` attributes and Bulma helper props                          | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Field` registers these variables on its own `.field` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                  | Sass Variable          | Default                            |
| ----------------------------- | ---------------------- | ---------------------------------- |
| `--bulma-field-block-spacing` | `$field-block-spacing` | `0.75rem`                          |
| `--bulma-block-spacing`       | —                      | `var(--bulma-field-block-spacing)` |

<!-- /bestax:generated cssvars -->
