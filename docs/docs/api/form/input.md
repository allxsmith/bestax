---
title: Input
sidebar_label: Input
---

# Input

## Overview

The `Input` component provides a Bulma-styled text input, supporting colors, sizes, rounded corners, static/read-only state, hover/focus/loading states, and all Bulma helper props. It is suitable for all standard text input types.

---

## Import

```tsx
import { Input, Field, Control } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                          | Description                                      |
| ----------- | --------------------------------------------- | ------------------------------------------------ |
| `color`     | `'primary' \| 'link' \| ... \| 'white'`       | Bulma color modifier.                            |
| `size`      | `'small' \| 'medium' \| 'large'`              | Size modifier.                                   |
| `isRounded` | `boolean`                                     | Rounded input corners.                           |
| `isStatic`  | `boolean`                                     | Renders input as static (read only, styled).     |
| `isHovered` | `boolean`                                     | Applies hovered state.                           |
| `isFocused` | `boolean`                                     | Applies focused state.                           |
| `isLoading` | `boolean`                                     | Shows loading indicator.                         |
| `className` | `string`                                      | Additional CSS classes.                          |
| `disabled`  | `boolean`                                     | Disabled input.                                  |
| `readOnly`  | `boolean`                                     | Read-only input.                                 |
| ...         | All standard `<input>` and Bulma helper props | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

`Input` is a convenience component that internally composes `Field` and `Control`. For most form fields, use `<Input>` directly with its props (`label`, `color`, `size`, `iconLeftName`, `message`, `horizontal`, etc.). Reach for explicit `<Field>` + `<Control>` composition only when you need a layout the convenience props can't express — most commonly **form addons**, **grouped controls**, or **horizontal layouts that mix multiple sub-fields**.

### Default Input

A standard text input. The `placeholder` prop provides hint text for the user.

```tsx live
<Input label="Default" placeholder="Default input" />
```

---

### Color Inputs

The `color` prop applies Bulma color modifiers to the input. Use it to visually distinguish input fields based on context or validation state.

```tsx live
<>
  <Input label="Primary" color="primary" placeholder="Primary input" />
  <Input label="Link" color="link" placeholder="Link input" />
  <Input label="Info" color="info" placeholder="Info input" />
  <Input label="Success" color="success" placeholder="Success input" />
  <Input label="Warning" color="warning" placeholder="Warning input" />
  <Input label="Danger" color="danger" placeholder="Danger input" />
</>
```

---

### Sizes

The `size` prop controls the input's size. Options: `"small"`, `"medium"`, `"large"` (default is normal).

```tsx live
<>
  <Input label="Small" size="small" placeholder="Small input" />
  <Input label="Normal" placeholder="Normal input" />
  <Input label="Medium" size="medium" placeholder="Medium input" />
  <Input label="Large" size="large" placeholder="Large input" />
</>
```

---

### Style: Rounded

The `isRounded` prop gives the input rounded corners for a softer appearance.

```tsx live
<Input label="Rounded" isRounded placeholder="Rounded input" />
```

---

### States

`isHovered`, `isFocused`, and `isLoading` force the corresponding state on the input.

```tsx live
<>
  <Input label="Normal" placeholder="Normal state" />
  <Input label="Hover" isHovered placeholder="Hovered state" />
  <Input label="Focus" isFocused placeholder="Focused state" />
  <Input label="Loading" isLoading placeholder="Loading state" />
</>
```

---

### Loading States by Size

The loading indicator at every input size. Use `controlSize` on `<Input>` to scale the spinner to match.

```tsx live
<>
  <Input
    label="Loading Small"
    size="small"
    controlSize="small"
    isLoading
    placeholder="Loading small"
  />
  <Input label="Loading Normal" isLoading placeholder="Loading normal" />
  <Input
    label="Loading Medium"
    size="medium"
    controlSize="medium"
    isLoading
    placeholder="Loading medium"
  />
  <Input
    label="Loading Large"
    size="large"
    controlSize="large"
    isLoading
    placeholder="Loading large"
  />
</>
```

---

### Disabled & Read Only

Disabled inputs cannot be interacted with; read-only inputs can be focused but not edited.

```tsx live
<>
  <Input label="Disabled" disabled placeholder="Disabled input" />
  <Input label="Read Only" readOnly value="Read only value" />
</>
```

---

### Static State

The `isStatic` prop renders the input as non-interactive text — useful for displaying read-only values alongside editable fields.

```tsx live
<>
  <Input horizontal label="Username" isStatic value="Static value" />
  <Input horizontal label="Password" placeholder="Editable value" />
</>
```

---

### With Icons (Left and Right)

Add icons via the `iconLeftName` / `iconRightName` shortcuts on `<Input>`.

```tsx live
<>
  <Input iconLeftName="user" iconRightName="check" placeholder="With icons" />
  <Input
    iconLeftName="envelope"
    iconRightName="exclamation-triangle"
    placeholder="Another input"
  />
</>
```

---

### With Icons and Size Variations

Match the input size to the icon size via the `size` + `iconLeftSize` / `iconRightSize` props.

```tsx live
<>
  <Input
    size="small"
    iconLeftName="user"
    iconLeftSize="small"
    iconRightName="check"
    iconRightSize="small"
    placeholder="Icons left/right small"
  />
  <Input
    iconLeftName="user"
    iconRightName="check"
    placeholder="Icons left/right normal"
  />
  <Input
    size="medium"
    iconLeftName="user"
    iconLeftSize="medium"
    iconRightName="check"
    iconRightSize="medium"
    placeholder="Icons left/right medium"
  />
  <Input
    size="large"
    iconLeftName="user"
    iconLeftSize="large"
    iconRightName="check"
    iconRightSize="large"
    placeholder="Icons left/right large"
  />
</>
```

---

### Help Text Colors

Pair `color` and `messageColor` to produce success and danger validation states with matching help text.

```tsx live
<>
  <Input
    label="Username"
    color="success"
    value="bulma"
    message="This username is available"
    messageColor="success"
    iconLeftName="user"
    iconRightName="check"
    onChange={() => {}}
  />
  <Input
    label="Email"
    type="email"
    color="danger"
    value="hello@"
    message="This email is invalid"
    messageColor="danger"
    iconLeftName="envelope"
    iconRightName="exclamation-triangle"
    onChange={() => {}}
  />
</>
```

---

### Form Addons

For multi-control rows like input + button, drop down to manual `Field` + `Control` composition. Use `<Field hasAddons>` with multiple `<Control>` children. Use `<Control isExpanded>` on the input so it fills the available space.

#### Input + Button

```tsx live
<Field hasAddons>
  <Control isExpanded>
    <Input placeholder="Find a repository" />
  </Control>
  <Control>
    <Button color="info">Search</Button>
  </Control>
</Field>
```

#### Input + Static Suffix

A static button is non-interactive — useful for fixed prefixes/suffixes such as an email domain.

```tsx live
<Field hasAddons>
  <Control isExpanded>
    <Input placeholder="Your email" />
  </Control>
  <Control>
    <Button isStatic>@gmail.com</Button>
  </Control>
</Field>
```

#### Select + Input + Button

```tsx live
<Field hasAddons>
  <Control>
    <Select aria-label="Country code">
      <option>+1</option>
      <option>+44</option>
      <option>+33</option>
    </Select>
  </Control>
  <Control isExpanded>
    <Input type="tel" placeholder="Your phone number" />
  </Control>
  <Control>
    <Button color="primary">Call</Button>
  </Control>
</Field>
```

#### Centered Addons

Pass `hasAddons="centered"` to center the addon group on the row.

```tsx live
<Field hasAddons="centered">
  <Control>
    <Button>Yes</Button>
  </Control>
  <Control>
    <Button>Maybe</Button>
  </Control>
  <Control>
    <Button>No</Button>
  </Control>
</Field>
```

#### Right-Aligned Addons

Pass `hasAddons="right"` to right-align the group.

```tsx live
<Field hasAddons="right">
  <Control>
    <Button>Yes</Button>
  </Control>
  <Control>
    <Button>Maybe</Button>
  </Control>
  <Control>
    <Button>No</Button>
  </Control>
</Field>
```

---

### Form Group

Use `<Field grouped>` to lay multiple controls out on a single row with consistent spacing — common for form action buttons and search-style rows.

#### Grouped Buttons

```tsx live
<Field grouped>
  <Control>
    <Button color="link">Submit</Button>
  </Control>
  <Control>
    <Button>Cancel</Button>
  </Control>
</Field>
```

#### Centered Group

```tsx live
<Field grouped="centered">
  <Control>
    <Button color="link">Submit</Button>
  </Control>
  <Control>
    <Button>Cancel</Button>
  </Control>
</Field>
```

#### Right-Aligned Group

```tsx live
<Field grouped="right">
  <Control>
    <Button color="link">Submit</Button>
  </Control>
  <Control>
    <Button>Cancel</Button>
  </Control>
</Field>
```

#### Expanded Input + Button

```tsx live
<Field grouped>
  <Control isExpanded>
    <Input placeholder="Find a repository" />
  </Control>
  <Control>
    <Button color="info">Search</Button>
  </Control>
</Field>
```

#### Multiline Group

`grouped="multiline"` allows the row to wrap onto multiple lines.

```tsx live
<Field grouped="multiline">
  {[
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
  ].map(label => (
    <Control key={label}>
      <Button>{label}</Button>
    </Control>
  ))}
</Field>
```

---

### Horizontal — Validation Error

Place a `color="danger"` Input and a danger help message inside the horizontal field body.

```tsx live
<Field horizontal label="Email">
  <Field.Body>
    <Field>
      <Control iconLeftName="envelope" iconRightName="exclamation-triangle">
        <Input
          type="email"
          color="danger"
          value="hello@"
          onChange={() => {}}
        />
      </Control>
      <p className="help is-danger">This email is invalid</p>
    </Field>
  </Field.Body>
</Field>
```

---

### Horizontal — Addons (Phone with Country Code)

Combine `Field horizontal` with a nested `Field hasAddons` inside the body to mix layouts.

```tsx live
<Field horizontal label="Phone">
  <Field.Body>
    <Field hasAddons>
      <Control>
        <Button isStatic>+44</Button>
      </Control>
      <Control isExpanded>
        <Input type="tel" placeholder="Your phone number" />
      </Control>
    </Field>
  </Field.Body>
</Field>
```

---

### Horizontal — Submit Row

Use an empty `Field.Label` to align the submit button under the inputs above it.

```tsx live
<>
  <Field horizontal label="Name">
    <Field.Body>
      <Field>
        <Control>
          <Input placeholder="Your name" />
        </Control>
      </Field>
    </Field.Body>
  </Field>
  <Field horizontal>
    <Field.Label />
    <Field.Body>
      <Field>
        <Control>
          <Button color="primary">Submit</Button>
        </Control>
      </Field>
    </Field.Body>
  </Field>
</>
```

---

### Disabled Fieldset

Wrap multiple Inputs in a native `<fieldset disabled>` to disable every field at once.

```tsx live
<fieldset disabled>
  <Input label="Name" placeholder="Your name" />
  <Input label="Email" type="email" placeholder="Your email" />
</fieldset>
```

---

### Context-Aware Rendering

The `Input` component is context-aware: it detects whether it is already inside a `Field` or `Control` and adjusts its rendering accordingly. This means you can use it standalone with a `label` prop (it wraps itself in Field+Control), inside a `Field` (it skips its own Field), or inside both `Field` and `Control` (it renders only the raw input).

#### Default (with label)

The simplest usage — the component automatically renders its own Field and Control wrappers.

```tsx live
<Input label="Username" placeholder="Enter username" />
```

---

#### With Field Wrapper

When you need manual control over the Field layout (e.g., horizontal forms), wrap the component in `Field`. The component detects it's inside a Field and skips rendering its own.

```tsx live
function example() {
  return (
    <Field horizontal label="Username">
      <Field.Body>
        <Field>
          <Input placeholder="Enter username" />
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

#### With Field and Control Wrappers

For full manual control (e.g., adding icons via Control), wrap in both Field and Control. The component detects both and renders only its raw element.

```tsx live
function example() {
  return (
    <Field horizontal label="Username">
      <Field.Body>
        <Field>
          <Control iconLeftName="user">
            <Input placeholder="Enter username" />
          </Control>
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

## Accessibility

- Always provide a `<label>` (use with `Field`) for accessible input usage.
- Use the correct input `type` for semantics (`text`, `email`, etc.).

---

## Related Components

- [`Control`](./control.md): For icons and loading.
- [`Field`](./field.md): For field grouping and labels.

---

## Additional Resources

- [Bulma Input Documentation](https://bulma.io/documentation/form/input/)
- [Storybook: Input Stories](https://bestax.io/storybook/?path=/story/form-input--default)
