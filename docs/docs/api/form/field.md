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

This example demonstrates using the `Field` component to label a file upload control. The `File` component is used as the field's content, with custom text on its button.

```tsx live
<Field label="Upload Resume">
  <File buttonLabel="Choose a file..." />
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
      <Input isStatic readOnly value="Static value" />
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

`Field.Label` is the label column, not a `<label>` element, and a `Field` with no `label` prop names nothing, so put a `label` inside it and point its `htmlFor` at a matching `id` on the control. A label placed this way names the control through its `for` alone, and a range `Slider`'s thumbs and an `Autocomplete`'s suggestion list don't point at it. For those, use the `Field`'s `label` prop, adding `labelProps={{ htmlFor, id }}` and a matching `id` on the control when an inner `Field` holds it.

```tsx live
<Field horizontal>
  <Field.Label size="normal">
    <label className="label" htmlFor="compound-name">
      Name
    </label>
  </Field.Label>
  <Field.Body>
    <Field.Control>
      <Input id="compound-name" placeholder="Jane Doe" />
    </Field.Control>
  </Field.Body>
</Field>
```

---

## Accessibility

- The `label` prop names the one control the Field holds. A composed `InputBase`, `SelectBase`, `TextAreaBase`, `DateInputBase`, `TimeInputBase`, or `DateTimeInputBase`, or a bestax input that renders a single input of its own (`Input`, `Select`, `TextArea`, `Numberinput`, `Slider`, `DateInput`, `TimeInput`, `DateTimeInput`, `Autocomplete`, `Taginput`, `File`), adopts a generated id the label's `for` points at, so clicking the label focuses the control and assistive technology announces it. An `inline` picker renders no input, so it takes nothing.
- A range `Slider` takes that id on its low thumb, and its thumbs also point `aria-labelledby` at the label (at `labelProps.id` when you set one), so under a label of "Price range" they announce as "Price range Minimum value" and "Price range Maximum value". An `ariaLabel` entry names its thumb instead, and an `aria-label` or `aria-labelledby` on the Slider takes the label's place in both names. A label you wire by hand with `labelProps={{ htmlFor }}` gets no generated id, so it reaches the thumbs' names only when you give it an `id` there too, as in `labelProps={{ htmlFor: 'price', id: 'price-label' }}`.
- An `Autocomplete` points its open suggestion list's `aria-labelledby` at the label the same way, so under a label of "Country" the list announces as "Country" rather than its fallback name, "Suggestions". A label you wire by hand needs an `id` in `labelProps` for this too, as in `labelProps={{ htmlFor: 'country', id: 'country-label' }}`.
- A group (`Radios`, `Checkboxes`, `Rate`, `DateRangeInput`) can't take a `for`, so the label gets an id (yours from `labelProps.id`, otherwise a generated one) and the group points `aria-labelledby` at it. An `aria-label` or `aria-labelledby` you set on the group wins over the Field's label, as it does over a group's own `label`.
- An `id` you set on the control wins too: it keeps that id, and the label then names it only if you point `labelProps={{ htmlFor }}` at it. Pass `labelProps={{ htmlFor: undefined }}` to opt out of the association entirely.
- Association is skipped for `grouped`/`hasAddons` fields (they hold several controls), and a `Field` nested inside a labeled one starts its own scope. A horizontal Field wraps its children in a `Field.Body` of its own and keeps the association, but the pattern with an inner `Field` in that body needs it wired by hand. A label you wire by hand names the control its `for` points at in a `grouped` or `hasAddons` field too, and with an `id` in `labelProps` it names a range `Slider`'s thumbs and an `Autocomplete`'s list there as well. No group points at it on its own.
- Two controls in one plain labeled Field would both adopt its id. Give each an `id` of its own and label it individually.
- A labeled Field drops its label's `for` when nothing it holds takes it: a group, a `Checkbox`, `Radio` or `Switch`, a `DateRangeInputBase`, an `inline` picker, an inner `Field`, or an input with an `id` of its own. The content tells the Field after it mounts, so a server render, and the first render while hydrating, still write the `for`, and hydration matches. Content the Field can't account for, such as your own markup, keeps it. `Checkbox`, `Radio` and `Switch` take nothing from the label at all: each is named by its own children, so put the text there rather than in the Field's `label`. Where you point content at the label by hand, as with a group in an inner `Field`, `labelProps={{ id }}` is enough in the browser, and `labelProps={{ id, htmlFor: undefined }}` keeps the `for` out of server-rendered HTML too.
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

| Prop         | Type                                                                            | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `horizontal` | `boolean`                                                                       | `false` | Renders the field as horizontal (label and control side by side).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `grouped`    | `boolean` \| `'centered'` \| `'right'` \| `'multiline'`                         | —       | Group controls in a row (optionally centered, right, or multiline).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `hasAddons`  | `boolean` \| `'centered'` \| `'right'`                                          | —       | Group controls as addons (optionally centered or right-aligned).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `narrow`     | `boolean`                                                                       | `false` | Constrains the field to its content's width (used inside horizontal field bodies).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `label`      | `React.ReactNode`                                                               | —       | Field label, rendered above the widget. Automatically names the one control the Field holds: a composed `InputBase`, `SelectBase`, `TextAreaBase`, `DateInputBase`, `TimeInputBase` or `DateTimeInputBase` (an `inline` picker has no input, so it takes nothing), or a bestax input that renders a single input of its own (`Input`, `Select`, `TextArea`, `Numberinput`, `Slider`, `DateInput`, `TimeInput`, `DateTimeInput`, `Autocomplete`, `Taginput`, `File`), adopts a generated id that the label's `htmlFor` points at, and a group (`Radios`, `Checkboxes`, `Rate`, `DateRangeInput`) points `aria-labelledby` at the label's own id unless you gave the group an `aria-label` or `aria-labelledby`. A range `Slider` takes the id on its low thumb and also starts each thumb's name with the label through `aria-labelledby`, unless its `ariaLabel` names that thumb or its own `aria-label` or `aria-labelledby` takes the label's place. An `Autocomplete` also names its open suggestion list after the label through `aria-labelledby`. Nothing else takes the label: `Checkbox`, `Radio` and `Switch` are named by their own children. Only the single inputs take the `htmlFor`, so the label drops it when nothing the Field holds takes it: a group, a `Checkbox`, `Radio` or `Switch`, a `DateRangeInputBase`, an `inline` picker, an inner `Field`, or an input with an `id` of its own. The content tells the Field after it mounts, so a server render, and the first render while hydrating, still write the `htmlFor`, which keeps hydration matching, and content the Field can't account for, such as your own markup, keeps it. Pass `labelProps={{ htmlFor }}` to wire your own `id`, or `labelProps={{ htmlFor: undefined }}` to opt out. Skipped for `grouped`/`hasAddons` fields (multiple controls), and a nested `Field` starts its own scope, so a horizontal Field whose body holds an inner `Field` names the control there only when you wire it. Two controls in one plain labeled Field would both adopt the id, so give each an `id` of its own. |
| `labelSize`  | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                              | —       | Size for the label.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `labelProps` | `React.LabelHTMLAttributes<HTMLLabelElement> & { [key: string]: unknown; }`     | —       | Props for the label element. An explicit `htmlFor` key — even set to `undefined` — takes over the association. While the association is on, the label renders with the `id` given here, or a generated one, and a group control, a range `Slider`'s thumbs and an `Autocomplete`'s suggestion list point `aria-labelledby` at it. A label you take over gets no generated id, and no group points at it on its own. With an `id` here, though, a range `Slider` or an `Autocomplete` whose `id` your `htmlFor` names still points its thumbs or its suggestion list at it, in a `grouped` or `hasAddons` Field too. To point a group in an inner `Field` at this label by hand, pass that `id`. Nothing in the inner `Field` takes the generated `htmlFor`, so the label drops it after mounting, and adding `htmlFor: undefined` keeps it out of server-rendered markup too.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `textColor`  | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Text color for the field.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `color`      | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Bulma color for the field.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `bgColor`    | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Background color for the field.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `className`  | `string`                                                                        | —       | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `children`   | `React.ReactNode`                                                               | —       | Field content.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `...`        | All standard `<div>` attributes and Bulma helper props                          | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

**Subcomponents:**

- `Field.Label`: FieldLabel component for rendering a Bulma field label. It renders the label column of a horizontal `Field` (a `div` with the `field-label` class), not a `<label>`, so text placed straight in it names nothing. Put a `<label>` with the `label` class inside it and point its `htmlFor` at the control's `id`, or give the horizontal `Field` a `label` prop, which renders this column and its `<label>` for you. A `<label>` you put here names the control through its `htmlFor` alone: a range `Slider`'s thumbs and an `Autocomplete`'s suggestion list point `aria-labelledby` at a `Field`'s label only when its `label` prop renders it and it names the control. Where it would not name the control on its own, as in an inner `Field`, pass `labelProps={{ htmlFor, id }}` with a matching `id` on the control.
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
