---
title: TextArea
sidebar_label: TextArea
description: The `TextArea` component provides a Bulma-styled multi-line text input, supporting color, size, rounded corners, static/read-only state, hover/focus/loading states, fixed size, and all Bulma helper props.
---

# TextArea

## Overview

<!-- bestax:generated overview -->

The `TextArea` component provides a Bulma-styled multi-line text input, supporting color, size, rounded corners, static/read-only state, hover/focus/loading states, fixed size, and all Bulma helper props.

<!-- /bestax:generated overview -->

---

## Import

<!-- bestax:generated import -->

```tsx
import { TextArea, Field, Control } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

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
  <TextArea
    label="Loading Normal"
    isLoading
    placeholder="Normal loading textarea"
  />
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
<TextArea
  label="Fixed Size"
  hasFixedSize
  rows={3}
  placeholder="Fixed size textarea"
/>
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

- Always provide a label. TextArea's `label` prop is automatically associated with the `<textarea>` (`htmlFor` plus a generated `id`, or your own `id` if you pass one).
- When composing with `Field` instead, the `Field`'s own `label` associates with the textarea automatically when the textarea sits directly in that labeled `Field` — a nested unlabeled `Field` (as in horizontal multi-field layouts) starts its own scope. Pass `labelProps={{ htmlFor }}` and a matching `id` for a stable id or to label across a nested `Field`.
- Use the `rows` prop to set an appropriate height for your content.

---

## Related Components

- [`Control`](./control.md): For loading.
- [`Field`](./field.md): For field grouping and labels.

---

## Additional Resources

- [Bulma Textarea Documentation](https://bulma.io/documentation/form/textarea/)
- [Storybook: TextArea Stories](https://bestax.io/storybook/?path=/story/form-textarea--default)

---

## Props

<!-- bestax:generated props -->

| Prop               | Type                                                                                                                               | Default | Description                                                                                                                                                                                                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`            | `React.ReactNode`                                                                                                                  | —       | Field label. Automatically associated with the textarea via `htmlFor` — uses your `id` when provided, otherwise a generated one. Dropped inside an outer `Field`, whose own label associates instead when that `Field` generates a target id (not `grouped`/`hasAddons`, no explicit `labelProps.htmlFor`). |
| `labelSize`        | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                                                                                 | —       | Size for the label.                                                                                                                                                                                                                                                                                         |
| `labelProps`       | `React.LabelHTMLAttributes<HTMLLabelElement> & { [key: string]: unknown; }`                                                        | —       | Props for the label element when the component renders its own `Field`; dropped inside an outer `Field` (use that `Field`'s `labelProps` instead). An explicit `htmlFor` key — even `undefined` — overrides the automatic association and no id is generated.                                               |
| `horizontal`       | `boolean`                                                                                                                          | `false` | Horizontal field layout.                                                                                                                                                                                                                                                                                    |
| `isLoading`        | `boolean`                                                                                                                          | `false` | Shows loading indicator on the wrapping Control.                                                                                                                                                                                                                                                            |
| `controlSize`      | `'small'` \| `'medium'` \| `'large'`                                                                                               | —       | Control size.                                                                                                                                                                                                                                                                                               |
| `message`          | `React.ReactNode`                                                                                                                  | —       | Help/validation message below the textarea.                                                                                                                                                                                                                                                                 |
| `messageColor`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`                                                    | —       | Bulma color for the message.                                                                                                                                                                                                                                                                                |
| `fieldClassName`   | `string`                                                                                                                           | —       | Additional CSS classes for the Field.                                                                                                                                                                                                                                                                       |
| `controlClassName` | `string`                                                                                                                           | —       | Additional CSS classes for the Control.                                                                                                                                                                                                                                                                     |
| `color`            | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'dark'` \| `'light'` \| `'white'` | —       | Bulma color modifier for the textarea.                                                                                                                                                                                                                                                                      |
| `size`             | `'small'` \| `'medium'` \| `'large'`                                                                                               | —       | Size modifier for the textarea.                                                                                                                                                                                                                                                                             |
| `isRounded`        | `boolean`                                                                                                                          | `false` | Rounded textarea corners.                                                                                                                                                                                                                                                                                   |
| `isStatic`         | `boolean`                                                                                                                          | `false` | Renders textarea as static (styled readonly).                                                                                                                                                                                                                                                               |
| `isHovered`        | `boolean`                                                                                                                          | `false` | Applies hovered state.                                                                                                                                                                                                                                                                                      |
| `isFocused`        | `boolean`                                                                                                                          | `false` | Applies focused state.                                                                                                                                                                                                                                                                                      |
| `isActive`         | `boolean`                                                                                                                          | `false` | Applies Bulma's is-active modifier.                                                                                                                                                                                                                                                                         |
| `hasFixedSize`     | `boolean`                                                                                                                          | `false` | Fixed textarea size (no resize).                                                                                                                                                                                                                                                                            |
| `className`        | `string`                                                                                                                           | —       | Additional CSS classes to apply.                                                                                                                                                                                                                                                                            |
| `disabled`         | `boolean`                                                                                                                          | `false` | Disables the textarea.                                                                                                                                                                                                                                                                                      |
| `readOnly`         | `boolean`                                                                                                                          | `false` | Read-only textarea.                                                                                                                                                                                                                                                                                         |
| `rows`             | `number`                                                                                                                           | —       | Number of visible text lines.                                                                                                                                                                                                                                                                               |
| `ref`              | `React.Ref<HTMLTextAreaElement>`                                                                                                   | —       | Forwarded to the underlying element.                                                                                                                                                                                                                                                                        |
| `...`              | All standard `<textarea>` attributes and Bulma helper props                                                                        | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                           |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`TextArea` registers these variables on its own `.textarea` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                               | Sass Variable                       | Default                                                                                                                  |
| ------------------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `--bulma-textarea-padding`                 | `$textarea-padding`                 | `var(--bulma-control-padding-horizontal)`                                                                                |
| `--bulma-textarea-max-height`              | `$textarea-max-height`              | `40em`                                                                                                                   |
| `--bulma-textarea-min-height`              | `$textarea-min-height`              | `8em`                                                                                                                    |
| `--bulma-input-h`                          | `$input-h`                          | `var(--bulma-scheme-h)`                                                                                                  |
| `--bulma-input-s`                          | `$input-s`                          | `var(--bulma-scheme-s)`                                                                                                  |
| `--bulma-input-l`                          | `$input-l`                          | `var(--bulma-scheme-main-l)`                                                                                             |
| `--bulma-input-border-style`               | `$input-border-style`               | `solid`                                                                                                                  |
| `--bulma-input-border-width`               | `$input-border-width`               | `var(--bulma-control-border-width)`                                                                                      |
| `--bulma-input-border-l`                   | `$input-border-l`                   | `var(--bulma-border-l)`                                                                                                  |
| `--bulma-input-border-l-delta`             | `$input-border-l-delta`             | `0%`                                                                                                                     |
| `--bulma-input-border-color`               | `$input-border-color`               | `hsl(var(--bulma-input-h), var(--bulma-input-s), calc(var(--bulma-input-border-l) + var(--bulma-input-border-l-delta)))` |
| `--bulma-input-hover-border-l-delta`       | `$input-hover-border-l-delta`       | `var(--bulma-hover-border-l-delta)`                                                                                      |
| `--bulma-input-active-border-l-delta`      | `$input-active-border-l-delta`      | `var(--bulma-active-border-l-delta)`                                                                                     |
| `--bulma-input-focus-h`                    | `$input-focus-h`                    | `var(--bulma-focus-h)`                                                                                                   |
| `--bulma-input-focus-s`                    | `$input-focus-s`                    | `var(--bulma-focus-s)`                                                                                                   |
| `--bulma-input-focus-l`                    | `$input-focus-l`                    | `var(--bulma-focus-l)`                                                                                                   |
| `--bulma-input-focus-shadow-size`          | `$input-focus-shadow-size`          | `var(--bulma-focus-shadow-size)`                                                                                         |
| `--bulma-input-focus-shadow-alpha`         | `$input-focus-shadow-alpha`         | `var(--bulma-focus-shadow-alpha)`                                                                                        |
| `--bulma-input-color-l`                    | `$input-color-l`                    | `var(--bulma-text-strong-l)`                                                                                             |
| `--bulma-input-background-l`               | `$input-background-l`               | `var(--bulma-scheme-main-l)`                                                                                             |
| `--bulma-input-background-l-delta`         | `$input-background-l-delta`         | `0%`                                                                                                                     |
| `--bulma-input-height`                     | `$input-height`                     | `var(--bulma-control-height)`                                                                                            |
| `--bulma-input-shadow`                     | `$input-shadow`                     | `inset 0 0.0625em 0.125em hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-invert-l), 0.05)`        |
| `--bulma-input-placeholder-color`          | `$input-placeholder-color`          | `hsla(var(--bulma-text-h), var(--bulma-text-s), var(--bulma-text-strong-l), 0.3)`                                        |
| `--bulma-input-disabled-color`             | `$input-disabled-color`             | `var(--bulma-text-weak)`                                                                                                 |
| `--bulma-input-disabled-background-color`  | `$input-disabled-background-color`  | `var(--bulma-background)`                                                                                                |
| `--bulma-input-disabled-border-color`      | `$input-disabled-border-color`      | `var(--bulma-background)`                                                                                                |
| `--bulma-input-disabled-placeholder-color` | `$input-disabled-placeholder-color` | `hsla(var(--bulma-text-h), var(--bulma-text-s), var(--bulma-text-weak-l), 0.3)`                                          |
| `--bulma-input-arrow`                      | `$input-arrow`                      | `var(--bulma-link)`                                                                                                      |
| `--bulma-input-icon-color`                 | `$input-icon-color`                 | `var(--bulma-text-light)`                                                                                                |
| `--bulma-input-icon-hover-color`           | `$input-icon-hover-color`           | `var(--bulma-text-weak)`                                                                                                 |
| `--bulma-input-icon-focus-color`           | `$input-icon-focus-color`           | `var(--bulma-link)`                                                                                                      |
| `--bulma-input-radius`                     | `$input-radius`                     | `var(--bulma-radius)`                                                                                                    |

<!-- /bestax:generated cssvars -->
