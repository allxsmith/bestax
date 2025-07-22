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
| `isRight`        | `boolean`                                                 | Align file input to the right.                   |
| `isCentered`     | `boolean`                                                 | Center the file input.                           |
| `hasName`        | `boolean`                                                 | Show a file name indicator.                      |
| `label`          | `React.ReactNode`                                         | Custom label text or node.                       |
| `iconLeft`       | `React.ReactNode`                                         | Left icon element.                               |
| `iconRight`      | `React.ReactNode`                                         | Right icon element.                              |
| `className`      | `string`                                                  | Additional CSS classes.                          |
| `inputClassName` | `string`                                                  | Additional CSS classes for the `<input>`.        |
| `fileName`       | `string`                                                  | File name to display.                            |
| ...              | All standard `<input type="file">` and Bulma helper props | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Default

This example shows a basic file input using the `File` component. The `label` prop provides the button text, and the `iconLeft` prop adds a left icon for visual context.

```tsx live
<File label="Choose a file..." iconLeft={<Icon name="upload" />} />
```

---

### With `hasName` and Filename Display

Set the `hasName` prop to display the selected file name. The `fileName` prop can be used to show a custom or pre-selected file name. This is useful for upload UIs where you want to show the user which file is selected.

```tsx live
<File
  hasName
  fileName="resume.pdf"
  label="Choose a file..."
  iconLeft={<Icon name="upload" />}
/>
```

---

### Right-Aligned

Use the `isRight` prop to align the file input to the right. Combine with `hasName` and `fileName` for a right-aligned file upload UI.

```tsx live
<File
  hasName
  isRight
  fileName="contract.pdf"
  label="Choose a file..."
  iconLeft={<Icon name="upload" />}
/>
```

---

### Full Width

The `isFullwidth` prop makes the file input take up the full width of its container. This is particularly useful in forms where you want the file input to be more prominent.

```tsx live
<File
  hasName
  isFullwidth
  fileName="picture.png"
  label="Choose a file..."
  iconLeft={<Icon name="upload" />}
/>
```

---

### Boxed Style

The `isBoxed` prop gives the file input a boxed appearance, which can be useful for emphasizing the input area.

```tsx live
<File isBoxed label="Choose a file..." iconLeft={<Icon name="upload" />} />
```

---

### Boxed and Has Name

Combine `isBoxed` and `hasName` to create a file input that is both boxed and displays the selected file name.

```tsx live
<File
  isBoxed
  hasName
  fileName="holiday.jpg"
  label="Choose a file..."
  iconLeft={<Icon name="upload" />}
/>
```

---

### Colors

The `color` prop allows you to change the color of the file input, using any of Bulma's color modifiers. This can be useful for indicating different states or categories of file uploads.

```tsx live
<>
  <File
    color="primary"
    label="Choose a file..."
    iconLeft={<Icon name="upload" />}
  />
  <File
    color="info"
    label="Choose a file..."
    iconLeft={<Icon name="upload" />}
  />
  <File
    color="warning"
    label="Choose a file..."
    iconLeft={<Icon name="upload" />}
  />
  <File
    color="danger"
    label="Choose a file..."
    iconLeft={<Icon name="upload" />}
  />
</>
```

---

### Sizes

The `size` prop controls the size of the file input. You can choose from `small`, `medium`, or `large` to fit your design needs.

```tsx live
<>
  <File
    size="small"
    label="Choose a file..."
    iconLeft={<Icon name="upload" />}
  />
  <File label="Choose a file..." iconLeft={<Icon name="upload" />} />{' '}
  {/* Normal */}
  <File
    size="medium"
    label="Choose a file..."
    iconLeft={<Icon name="upload" />}
  />
  <File
    size="large"
    label="Choose a file..."
    iconLeft={<Icon name="upload" />}
  />
</>
```

---

### Sizes with Name

When using the `hasName` prop, the file input will display the name of the selected file. This is particularly useful in forms where users need to upload files and you want to show them the file name they've selected.

```tsx live
<>
  <File
    size="small"
    hasName
    fileName="sample.txt"
    label="Choose a file..."
    iconLeft={<Icon name="upload" />}
  />
  <File
    hasName
    fileName="sample.txt"
    label="Choose a file..."
    iconLeft={<Icon name="upload" />}
  />
  <File
    size="medium"
    hasName
    fileName="sample.txt"
    label="Choose a file..."
    iconLeft={<Icon name="upload" />}
  />
  <File
    size="large"
    hasName
    fileName="sample.txt"
    label="Choose a file..."
    iconLeft={<Icon name="upload" />}
  />
</>
```

---

### Sizes with Boxed

The `isBoxed` prop can also be used in conjunction with the `size` prop to create a boxed file input in various sizes.

```tsx live
<>
  <File
    size="small"
    isBoxed
    label="Choose a file..."
    iconLeft={<Icon name="upload" />}
  />
  <File isBoxed label="Choose a file..." iconLeft={<Icon name="upload" />} />{' '}
  {/* Normal */}
  <File
    size="medium"
    isBoxed
    label="Choose a file..."
    iconLeft={<Icon name="upload" />}
  />
  <File
    size="large"
    isBoxed
    label="Choose a file..."
    iconLeft={<Icon name="upload" />}
  />
</>
```

---

### Sizes with Name and Boxed

For a file input that is both boxed and shows the selected file name, use the `isBoxed` and `hasName` props together. This is useful for creating a clear and concise file upload area in your UI.

```tsx live
<>
  <File
    size="small"
    isBoxed
    hasName
    fileName="summary.docx"
    label="Choose a file..."
    iconLeft={<Icon name="upload" />}
  />
  <File
    isBoxed
    hasName
    fileName="summary.docx"
    label="Choose a file..."
    iconLeft={<Icon name="upload" />}
  />{' '}
  {/* Normal */}
  <File
    size="medium"
    isBoxed
    hasName
    fileName="summary.docx"
    label="Choose a file..."
    iconLeft={<Icon name="upload" />}
  />
  <File
    size="large"
    isBoxed
    hasName
    fileName="summary.docx"
    label="Choose a file..."
    iconLeft={<Icon name="upload" />}
  />
</>
```

---

### Alignment: Centered

To center the file input within its container, use the `isCentered` prop. This can be useful in forms where you want to draw attention to the file upload area.

```tsx live
<File
  color="info"
  isCentered
  isBoxed
  hasName
  fileName="centered.pdf"
  label="Choose a file..."
  iconLeft={<Icon name="upload" />}
/>
```

---

### Alignment: Right

For a right-aligned file input, use the `isRight` prop. This can be useful in layouts where you want the file input to be aligned with other right-aligned elements.

```tsx live
<File
  color="primary"
  isRight
  hasName
  fileName="right.pdf"
  label="Choose a file..."
  iconLeft={<Icon name="upload" />}
/>
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
- [Storybook: File Stories](https://bestax.cc/storybook/?path=/story/form-file--default)
