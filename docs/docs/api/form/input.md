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

### Default Input

```tsx live
<Field label="Default">
  <Control>
    <Input placeholder="Default input" />
  </Control>
</Field>
```

---

### Color Inputs

```tsx live
<>
  <Field label="Primary">
    <Control>
      <Input color="primary" placeholder="Primary input" />
    </Control>
  </Field>

  <Field label="Link">
    <Control>
      <Input color="link" placeholder="Link input" />
    </Control>
  </Field>

  <Field label="Info">
    <Control>
      <Input color="info" placeholder="Info input" />
    </Control>
  </Field>

  <Field label="Success">
    <Control>
      <Input color="success" placeholder="Success input" />
    </Control>
  </Field>

  <Field label="Warning">
    <Control>
      <Input color="warning" placeholder="Warning input" />
    </Control>
  </Field>

  <Field label="Danger">
    <Control>
      <Input color="danger" placeholder="Danger input" />
    </Control>
  </Field>
</>
```

---

### Sizes

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

### Style: Rounded

```tsx live
<Field label="Rounded">
  <Control>
    <Input isRounded placeholder="Rounded input" />
  </Control>
</Field>
```

---

### States

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

### Loading States by Size

```tsx live
<>
  <Field label="Loading Small">
    <Control isLoading size="small">
      <Input size="small" placeholder="Loading small" />
    </Control>
  </Field>

  <Field label="Loading Normal">
    <Control isLoading>
      <Input placeholder="Loading normal" />
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

### Disabled & Read Only

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

### Static State

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

### With Icons (Left and Right)

```tsx live
<>
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

  <Field>
    <Control
      hasIconsLeft
      hasIconsRight
      iconLeft={{ name: 'envelope' }}
      iconRight={{ name: 'exclamation-triangle' }}
    >
      <Input placeholder="Another input" />
    </Control>
  </Field>
</>
```

---

### With Icons and Size Variations

```tsx live
<>
  <Field>
    <Control
      hasIconsLeft
      hasIconsRight
      size="small"
      iconLeft={{ name: 'user', size: 'small' }}
      iconRight={{ name: 'check', size: 'small' }}
    >
      <Input size="small" placeholder="Icons left/right small" />
    </Control>
  </Field>

  <Field>
    <Control
      hasIconsLeft
      hasIconsRight
      iconLeft={{ name: 'user' }}
      iconRight={{ name: 'check' }}
    >
      <Input placeholder="Icons left/right normal" />
    </Control>
  </Field>

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

  <Field>
    <Control
      hasIconsLeft
      hasIconsRight
      size="large"
      iconLeft={{ name: 'user', size: 'large' }}
      iconRight={{ name: 'check', size: 'large' }}
    >
      <Input size="large" placeholder="Icons left/right large" />
    </Control>
  </Field>
</>
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
- [Storybook: Input Stories](https://bestax.cc/storybook/?path=/story/form-input--default)
