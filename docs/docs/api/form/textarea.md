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
| `isLoading`    | `boolean`                                        | Shows loading indicator on the wrapping Control. |
| `isActive`     | `boolean`                                        | Applies Bulma's is-active modifier.              |
| `hasFixedSize` | `boolean`                                        | Fixed textarea size (no resize).                 |
| `className`    | `string`                                         | Additional CSS classes.                          |
| `disabled`     | `boolean`                                        | Disables the textarea.                           |
| `readOnly`     | `boolean`                                        | Read-only textarea.                              |
| `rows`         | `number`                                         | Number of visible text lines.                    |
| ...            | All standard `<textarea>` and Bulma helper props | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

`TextArea` is a convenience component that internally composes `Field` and `Control`. For most multi-line inputs, use `<TextArea>` directly with its props (`label`, `color`, `size`, `rows`, `hasFixedSize`, `isLoading`, `message`, `horizontal`, etc.). Bulma doesn't document textareas in addons or grouped layouts, so the convenience form covers nearly every case. Reach for explicit `<Field>` + `<Control>` only for very custom layouts.

### Default

A standard multi-line text input. The `placeholder` prop provides hint text.

```tsx live
<TextArea label="Default" placeholder="e.g. Hello world" />
```

---

### Row Count

Set the `rows` prop to control the visible number of text lines.

```tsx live
<TextArea label="Rows" rows={10} placeholder="10 rows" />
```

---

### Colors

The `color` prop applies Bulma color modifiers to visually distinguish input fields based on context or validation state.

```tsx live
<>
  <TextArea label="Primary" color="primary" placeholder="Primary textarea" />
  <TextArea label="Link" color="link" placeholder="Link textarea" />
  <TextArea label="Info" color="info" placeholder="Info textarea" />
  <TextArea label="Success" color="success" placeholder="Success textarea" />
  <TextArea label="Warning" color="warning" placeholder="Warning textarea" />
  <TextArea label="Danger" color="danger" placeholder="Danger textarea" />
</>
```

---

### Sizes

The `size` prop controls the overall size of the textarea.

```tsx live
<>
  <TextArea label="Small" size="small" placeholder="Small textarea" />
  <TextArea label="Normal" placeholder="Normal textarea" />
  <TextArea label="Medium" size="medium" placeholder="Medium textarea" />
  <TextArea label="Large" size="large" placeholder="Large textarea" />
</>
```

---

### States

`isHovered`, `isFocused`, and `isLoading` force the corresponding state on the textarea.

```tsx live
<>
  <TextArea label="Normal" placeholder="Normal textarea" />
  <TextArea label="Hover" isHovered placeholder="Hovered textarea" />
  <TextArea label="Focus" isFocused placeholder="Focused textarea" />
  <TextArea label="Loading" isLoading placeholder="Loading textarea" />
</>
```

---

### Loading States by Size

The loading indicator at every textarea size. Use `controlSize` on `<TextArea>` to scale the spinner to match.

```tsx live
<>
  <TextArea
    label="Loading Small"
    size="small"
    controlSize="small"
    isLoading
    placeholder="Small loading textarea"
  />
  <TextArea label="Loading Normal" isLoading placeholder="Normal loading textarea" />
  <TextArea
    label="Loading Medium"
    size="medium"
    controlSize="medium"
    isLoading
    placeholder="Medium loading textarea"
  />
  <TextArea
    label="Loading Large"
    size="large"
    controlSize="large"
    isLoading
    placeholder="Large loading textarea"
  />
</>
```

---

### Disabled & Read Only

Disabled textareas cannot be interacted with; read-only textareas can be focused but not edited.

```tsx live
<>
  <TextArea label="Disabled" disabled placeholder="Disabled textarea" />
  <TextArea label="Read Only" readOnly value="This content is readonly" />
</>
```

---

### Fixed Size

Set `hasFixedSize` to prevent the textarea from being user-resized.

```tsx live
<TextArea label="Fixed Size" hasFixedSize rows={3} placeholder="Fixed size textarea" />
```

---

### Horizontal

Use `horizontal` to render the label to the left of the textarea.

```tsx live
<TextArea
  horizontal
  label="Question"
  placeholder="Explain how we can help you"
  rows={4}
/>
```

---

### Context-Aware Rendering

The `TextArea` component is context-aware: it detects whether it is already inside a `Field` or `Control` and adjusts its rendering accordingly. You can use it standalone with a `label` prop (it wraps itself in Field+Control), inside a `Field` (it skips its own Field), or inside both `Field` and `Control` (it renders only the raw textarea).

#### Default (with label)

```tsx live
<TextArea label="Message" placeholder="Enter your message" />
```

---

#### With Field Wrapper

```tsx live
function example() {
  return (
    <Field horizontal label="Message">
      <Field.Body>
        <Field>
          <TextArea placeholder="Enter your message" />
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
    <Field horizontal label="Message">
      <Field.Body>
        <Field>
          <Control iconLeftName="comment">
            <TextArea placeholder="Enter your message" />
          </Control>
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

## Accessibility

- Always provide a `<label>` (use TextArea's `label` prop, or wrap in `Field`) for accessible usage.
- Use the `rows` prop to set an appropriate height for your content.

---

## Related Components

- [`Control`](./control.md): For loading.
- [`Field`](./field.md): For field grouping and labels.

---

## Additional Resources

- [Bulma Textarea Documentation](https://bulma.io/documentation/form/textarea/)
- [Storybook: TextArea Stories](https://bestax.io/storybook/?path=/story/form-textarea--default)
