---
title: TextArea
sidebar_label: TextArea
---

# TextArea

## Overview

The `TextArea` component provides a Bulma-styled multi-line text input, supporting color, size, rounded corners, static/read-only state, hover/focus/loading states, fixed size, and all Bulma helper props.

---

## Import

```tsx
import { TextArea, Field, Control } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop           | Type                                             | Description                                      |
| -------------- | ------------------------------------------------ | ------------------------------------------------ |
| `color`        | `'primary' \| 'link' \| ... \| 'white'`          | Bulma color modifier.                            |
| `size`         | `'small' \| 'medium' \| 'large'`                 | Size modifier.                                   |
| `isRounded`    | `boolean`                                        | Rounded textarea corners.                        |
| `isStatic`     | `boolean`                                        | Renders textarea as static (styled readonly).    |
| `isHovered`    | `boolean`                                        | Applies hovered state.                           |
| `isFocused`    | `boolean`                                        | Applies focused state.                           |
| `isLoading`    | `boolean`                                        | Shows loading indicator.                         |
| `isActive`     | `boolean`                                        | Applies Bulma's is-active modifier.              |
| `hasFixedSize` | `boolean`                                        | Fixed textarea size (no resize).                 |
| `className`    | `string`                                         | Additional CSS classes.                          |
| `disabled`     | `boolean`                                        | Disables the textarea.                           |
| `readOnly`     | `boolean`                                        | Read-only textarea.                              |
| `rows`         | `number`                                         | Number of visible text lines.                    |
| ...            | All standard `<textarea>` and Bulma helper props | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Default

```tsx
<Field label="Default">
  <Control>
    <TextArea placeholder="Carpe Diem" />
  </Control>
</Field>
```

---

### Row Count

```tsx
<Field label="Rows">
  <Control>
    <TextArea rows={8} placeholder="8 rows" />
  </Control>
</Field>
```

---

### Colors

```tsx
<Field label="Primary">
  <Control>
    <TextArea color="primary" placeholder="Primary (color='primary')" />
  </Control>
</Field>

<Field label="Link">
  <Control>
    <TextArea color="link" placeholder="Link (color='link')" />
  </Control>
</Field>

<Field label="Info">
  <Control>
    <TextArea color="info" placeholder="Info (color='info')" />
  </Control>
</Field>

<Field label="Success">
  <Control>
    <TextArea color="success" placeholder="Success (color='success')" />
  </Control>
</Field>

<Field label="Warning">
  <Control>
    <TextArea color="warning" placeholder="Warning (color='warning')" />
  </Control>
</Field>

<Field label="Danger">
  <Control>
    <TextArea color="danger" placeholder="Danger (color='danger')" />
  </Control>
</Field>
```

---

### Sizes

```tsx
<Field label="Small">
  <Control>
    <TextArea size="small" placeholder="Small" />
  </Control>
</Field>

<Field label="Normal">
  <Control>
    <TextArea placeholder="Normal" />
  </Control>
</Field>

<Field label="Medium">
  <Control>
    <TextArea size="medium" placeholder="Medium" />
  </Control>
</Field>

<Field label="Large">
  <Control>
    <TextArea size="large" placeholder="Large" />
  </Control>
</Field>
```

---

### States

```tsx
<Field label="Normal">
  <Control>
    <TextArea placeholder="Normal state" />
  </Control>
</Field>

<Field label="Hover">
  <Control>
    <TextArea isHovered placeholder="Hovered state" />
  </Control>
</Field>

<Field label="Focus">
  <Control>
    <TextArea isFocused placeholder="Focused state" />
  </Control>
</Field>

<Field label="Loading">
  <Control isLoading>
    <TextArea placeholder="Loading state" />
  </Control>
</Field>
```

---

### Loading States by Size

```tsx
<Field label="Loading Small">
  <Control isLoading size="small">
    <TextArea size="small" placeholder="Loading small" />
  </Control>
</Field>

<Field label="Loading Normal">
  <Control isLoading>
    <TextArea placeholder="Loading normal" />
  </Control>
</Field>

<Field label="Loading Medium">
  <Control isLoading size="medium">
    <TextArea size="medium" placeholder="Loading medium" />
  </Control>
</Field>

<Field label="Loading Large">
  <Control isLoading size="large">
    <TextArea size="large" placeholder="Loading large" />
  </Control>
</Field>
```

---

### Disabled & Read Only

```tsx
<Field label="Disabled">
  <Control>
    <TextArea disabled placeholder="Disabled textarea" />
  </Control>
</Field>

<Field label="Read Only">
  <Control>
    <TextArea readOnly value="Read only value" />
  </Control>
</Field>
```

---

### Fixed Size

```tsx
<Field label="Fixed Size">
  <Control>
    <TextArea hasFixedSize placeholder="Fixed size textarea" rows={3} />
  </Control>
</Field>
```

---

## Accessibility

- Always provide a `<label>` (use with `Field`) for accessible usage.
- Use the `rows` prop for appropriate height for your content.

---

## Related Components

- [`Control`](./control.md): For icons and loading.
- [`Field`](./field.md): For field grouping and labels.

---

## Additional Resources

- [Bulma Textarea Documentation](https://bulma.io/documentation/form/textarea/)
- [Storybook: TextArea Stories](https://bestax.cc/storybook/?path=/story/form-textarea--default)
