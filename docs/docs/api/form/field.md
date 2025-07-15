---
title: Field
sidebar_label: Field
---

# Field

## Overview

The `Field` component is a Bulma-styled form field container. It supports horizontal layouts, grouped controls, labels, label sizing, and all Bulma helper props for color, margin, and more. `Field` is the primary way to compose labeled, grouped, or horizontal layouts in your forms.

---

## Import

```tsx
import { Field } from '@allxsmith/bestax-bulma';
// Field.Label, Field.Body are available as subcomponents
```

---

## Props

| Field        | Type                                                                                                                                                                                                                                                                                     | Default | Description                                                         |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------- |
| `horizontal` | `boolean`                                                                                                                                                                                                                                                                                | —       | Renders the field as horizontal (label and control side by side).   |
| `grouped`    | `boolean` \| `'centered'` \| `'right'` \| `'multiline'`                                                                                                                                                                                                                                  | —       | Group controls in a row (optionally centered, right, or multiline). |
| `hasAddons`  | `boolean`                                                                                                                                                                                                                                                                                | —       | Group controls as addons.                                           |
| `label`      | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | Field label.                                                        |
| `labelSize`  | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                                                                                                                                                                                                                                       | —       | Size for the label.                                                 |
| `labelProps` | `object` (Label HTML attributes)                                                                                                                                                                                                                                                         | —       | Props for the label element.                                        |
| `textColor`  | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Text color for the field.                                           |
| `color`      | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`                                                                                                                                                                                                          | —       | Bulma color for the field.                                          |
| `bgColor`    | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Background color for the field.                                     |
| `className`  | `string`                                                                                                                                                                                                                                                                                 | —       | Additional CSS classes.                                             |
| `children`   | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | Field content.                                                      |
| ...          | All Bulma helper and HTML props                                                                                                                                                                                                                                                          | —       | (See [Helper Props](../helpers/usebulmaclasses))                    |

---

## Usage

### With Checkbox

```tsx live
<Field label="Stay Signed In">
  <Checkbox>Stay Signed In</Checkbox>
</Field>
```

---

### With Checkbox and Custom Label (with link)

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

```tsx live
<Field label="Upload Resume">
  <File label="Choose a file..." />
</Field>
```

---

### With Input (Default)

```tsx live
<Field label="Default">
  <Control>
    <Input placeholder="Default input" />
  </Control>
</Field>
```

---

### With Input (Sizes)

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

```tsx live
<Field label="Rounded">
  <Control>
    <Input isRounded placeholder="Rounded input" />
  </Control>
</Field>
```

---

### With Input (States)

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

```tsx live
<Field label="Default">
  <Control>
    <TextArea placeholder="Carpe Diem" />
  </Control>
</Field>
```

---

### With TextArea (Rows, Colors, Sizes, States, Loading, Fixed Size)

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

## Accessibility

- Uses `<label>` for accessible field labeling.
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
- [Storybook: Field Stories](https://bestax.cc/storybook/?path=/story/form-input--default)
