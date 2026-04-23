---
title: File
sidebar_label: File
---

# File

## Overview

The `File` component provides a Bulma-styled file input, supporting color, size, boxed/fullwidth/align styles, icons, "has name", and filename display. It is highly customizable for all file upload UI needs.

---

## Import

```tsx
import { File, Icon } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop             | Type                                                      | Description                                      |
| ---------------- | --------------------------------------------------------- | ------------------------------------------------ |
| `color`          | `'primary' \| 'link' \| ... \| 'white'`                   | Bulma color modifier for the file input.         |
| `size`           | `'small' \| 'medium' \| 'large'`                          | Size modifier for the file input.                |
| `isBoxed`        | `boolean`                                                 | Boxed file input.                                |
| `isFullwidth`    | `boolean`                                                 | File input expands to full width.                |
| `isRight`        | `boolean`                                                 | Position the CTA on the right (with `hasName`).  |
| `isCentered`     | `boolean`                                                 | Center the file input within its container.      |
| `hasName`        | `boolean`                                                 | Show a file name indicator.                      |
| `buttonLabel`    | `React.ReactNode`                                         | Text on the file CTA button (defaults to "Choose a file…"). |
| `label`          | `React.ReactNode`                                         | Field label rendered above the widget.           |
| `iconLeft`       | `React.ReactNode`                                         | Left icon element.                               |
| `iconRight`      | `React.ReactNode`                                         | Right icon element.                              |
| `className`      | `string`                                                  | Additional CSS classes.                          |
| `inputClassName` | `string`                                                  | Additional CSS classes for the `<input>`.        |
| `fileName`       | `string`                                                  | File name to display.                            |
| ...              | All standard `<input type="file">` and Bulma helper props | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

`File` is a self-contained Bulma file widget. It detects whether it's already inside a `Field` and skips rendering its own field wrapper if so. For typical use, pass `buttonLabel`, `iconLeft`, and any modifier props (`hasName`, `isBoxed`, `isFullwidth`, `isRight`, `isCentered`, `color`, `size`) — Bulma doesn't document file inputs in addons or grouped layouts, so the convenience form covers every case. Use `label` only when you want an additional Bulma `<label class="label">` rendered above the widget.

### Default

A basic file input. The `buttonLabel` prop sets the text on the CTA button, and `iconLeft` adds an icon for visual context.

```tsx live
<File buttonLabel="Choose a file…" iconLeft={<Icon name="upload" />} />
```

---

### With Filename Display

Set `hasName` to display the selected file name. The `fileName` prop shows a custom or pre-selected name.

```tsx live
<File
  hasName
  fileName="resume.pdf"
  buttonLabel="Choose a file…"
  iconLeft={<Icon name="upload" />}
/>
```

---

### CTA on Right

Combine `isRight` with `hasName` to put the CTA button on the right and the filename on the left.

```tsx live
<File
  hasName
  isRight
  fileName="contract.pdf"
  buttonLabel="Choose a file…"
  iconLeft={<Icon name="upload" />}
/>
```

---

### Full Width

`isFullwidth` makes the file input take the full width of its container — pairs well with `hasName` so the filename area expands.

```tsx live
<File
  hasName
  isFullwidth
  fileName="picture.png"
  buttonLabel="Choose a file…"
  iconLeft={<Icon name="upload" />}
/>
```

---

### Boxed

`isBoxed` stacks the icon over the text into a square box.

```tsx live
<File isBoxed buttonLabel="Choose a file…" iconLeft={<Icon name="upload" />} />
```

---

### Boxed with Name

Combine `isBoxed` and `hasName` for a boxed widget that also shows the filename.

```tsx live
<File
  isBoxed
  hasName
  fileName="holiday.jpg"
  buttonLabel="Choose a file…"
  iconLeft={<Icon name="upload" />}
/>
```

---

### Colors

The `color` prop applies Bulma color modifiers. The four examples below match the combinations Bulma's docs show.

```tsx live
<>
  <File
    color="primary"
    buttonLabel="Choose a file…"
    iconLeft={<Icon name="upload" />}
  />
  <File
    color="info"
    hasName
    fileName="resume.pdf"
    buttonLabel="Choose a file…"
    iconLeft={<Icon name="upload" />}
  />
  <File
    color="warning"
    isBoxed
    buttonLabel="Choose a file…"
    iconLeft={<Icon name="cloud-upload-alt" />}
  />
  <File
    color="danger"
    isBoxed
    hasName
    fileName="resume.pdf"
    buttonLabel="Choose a file…"
    iconLeft={<Icon name="cloud-upload-alt" />}
  />
</>
```

---

### Sizes

The `size` prop controls the file input's size.

```tsx live
<>
  <File
    size="small"
    buttonLabel="Choose a file…"
    iconLeft={<Icon name="upload" />}
  />
  <File buttonLabel="Choose a file…" iconLeft={<Icon name="upload" />} />
  <File
    size="medium"
    buttonLabel="Choose a file…"
    iconLeft={<Icon name="upload" />}
  />
  <File
    size="large"
    buttonLabel="Choose a file…"
    iconLeft={<Icon name="upload" />}
  />
</>
```

---

### Sizes with Name

Combine `size` with `hasName` to scale the filename display alongside the button.

```tsx live
<>
  <File
    size="small"
    hasName
    fileName="sample.txt"
    buttonLabel="Choose a file…"
    iconLeft={<Icon name="upload" />}
  />
  <File
    hasName
    fileName="sample.txt"
    buttonLabel="Choose a file…"
    iconLeft={<Icon name="upload" />}
  />
  <File
    size="medium"
    hasName
    fileName="sample.txt"
    buttonLabel="Choose a file…"
    iconLeft={<Icon name="upload" />}
  />
  <File
    size="large"
    hasName
    fileName="sample.txt"
    buttonLabel="Choose a file…"
    iconLeft={<Icon name="upload" />}
  />
</>
```

---

### Sizes with Boxed

Combine `size` with `isBoxed` for boxed file inputs at every size.

```tsx live
<>
  <File
    size="small"
    isBoxed
    buttonLabel="Choose a file…"
    iconLeft={<Icon name="upload" />}
  />
  <File isBoxed buttonLabel="Choose a file…" iconLeft={<Icon name="upload" />} />
  <File
    size="medium"
    isBoxed
    buttonLabel="Choose a file…"
    iconLeft={<Icon name="upload" />}
  />
  <File
    size="large"
    isBoxed
    buttonLabel="Choose a file…"
    iconLeft={<Icon name="upload" />}
  />
</>
```

---

### Sizes with Boxed and Name

For a boxed file input that also shows the filename, combine `isBoxed`, `hasName`, and `size`.

```tsx live
<>
  <File
    size="small"
    isBoxed
    hasName
    fileName="summary.docx"
    buttonLabel="Choose a file…"
    iconLeft={<Icon name="upload" />}
  />
  <File
    isBoxed
    hasName
    fileName="summary.docx"
    buttonLabel="Choose a file…"
    iconLeft={<Icon name="upload" />}
  />
  <File
    size="medium"
    isBoxed
    hasName
    fileName="summary.docx"
    buttonLabel="Choose a file…"
    iconLeft={<Icon name="upload" />}
  />
  <File
    size="large"
    isBoxed
    hasName
    fileName="summary.docx"
    buttonLabel="Choose a file…"
    iconLeft={<Icon name="upload" />}
  />
</>
```

---

### Alignment: Centered

`isCentered` centers the widget within its parent container.

```tsx live
<File
  color="info"
  isCentered
  isBoxed
  hasName
  fileName="centered.pdf"
  buttonLabel="Choose a file…"
  iconLeft={<Icon name="upload" />}
/>
```

---

### Alignment: Right

`isRight` aligns the widget to the right of its parent.

```tsx live
<File
  color="primary"
  isRight
  hasName
  fileName="right.pdf"
  buttonLabel="Choose a file…"
  iconLeft={<Icon name="upload" />}
/>
```

---

### Context-Aware Rendering

The `File` component is context-aware: it detects whether it is already inside a `Field` and skips rendering its own field wrapper if so. Use `label` to add a Bulma `<label class="label">` above the widget; use `buttonLabel` to set the CTA text.

:::note
File does not consume the Control context (it is its own self-contained widget). The "With Field and Control Wrappers" example below shows that wrapping File in a Control is harmless but doesn't change its rendering.
:::

#### Default (with label)

The simplest usage — `label` adds a Field label above the widget.

```tsx live
<File label="Document" buttonLabel="Choose a file…" iconLeft={<Icon name="upload" />} />
```

---

#### With Field Wrapper

For manual layout control (e.g., horizontal forms), wrap in `Field`. The component detects it's inside a Field and skips rendering its own.

```tsx live
function example() {
  return (
    <Field horizontal label="Document">
      <Field.Body>
        <Field>
          <File buttonLabel="Choose a file…" iconLeft={<Icon name="upload" />} />
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

#### With Field and Control Wrappers

For full manual composition, wrap in both `Field` and `Control`. File doesn't consume Control's context but the outer Field is still detected and File's own Field wrapper is skipped.

```tsx live
function example() {
  return (
    <Field horizontal label="Document">
      <Field.Body>
        <Field>
          <Control iconLeftName="paperclip">
            <File buttonLabel="Choose a file…" iconLeft={<Icon name="upload" />} />
          </Control>
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

## Accessibility

- The root is a `<div class="file">` with a nested `<label>` and `<input type="file">`.
- The label is always clickable.
- Add `aria-label` to the `<input>` for accessibility if your label is not plain text.

---

## Related Components

- [`Field`](./field.md): For labeled/grouped fields.
- [`Icon`](../elements/icon.md): For file icons.
- [Helper Props](../helpers/usebulmaclasses.md)

---

## Additional Resources

- [Bulma File Documentation](https://bulma.io/documentation/form/file/)
- [Storybook: File Stories](https://bestax.io/storybook/?path=/story/form-file--default)
