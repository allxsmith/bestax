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

```tsx live
<File label="Choose a file..." iconLeft={<Icon name="upload" />} />
```

---

### With `hasName` and Filename Display

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

```tsx live
<File isBoxed label="Choose a file..." iconLeft={<Icon name="upload" />} />
```

---

### Boxed and Has Name

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

```tsx live
<File color="primary" label="Choose a file..." iconLeft={<Icon name="upload" />} />
<File color="info" label="Choose a file..." iconLeft={<Icon name="upload" />} />
<File color="warning" label="Choose a file..." iconLeft={<Icon name="upload" />} />
<File color="danger" label="Choose a file..." iconLeft={<Icon name="upload" />} />
```

---

### Sizes

```tsx live
<File size="small" label="Choose a file..." iconLeft={<Icon name="upload" />} />
<File label="Choose a file..." iconLeft={<Icon name="upload" />} /> {/* Normal */}
<File size="medium" label="Choose a file..." iconLeft={<Icon name="upload" />} />
<File size="large" label="Choose a file..." iconLeft={<Icon name="upload" />} />
```

---

### Sizes with Name

```tsx live
<File size="small" hasName fileName="sample.txt" label="Choose a file..." iconLeft={<Icon name="upload" />} />
<File hasName fileName="sample.txt" label="Choose a file..." iconLeft={<Icon name="upload" />} />
<File size="medium" hasName fileName="sample.txt" label="Choose a file..." iconLeft={<Icon name="upload" />} />
<File size="large" hasName fileName="sample.txt" label="Choose a file..." iconLeft={<Icon name="upload" />} />
```

---

### Sizes with Boxed

```tsx live
<File size="small" isBoxed label="Choose a file..." iconLeft={<Icon name="upload" />} />
<File isBoxed label="Choose a file..." iconLeft={<Icon name="upload" />} /> {/* Normal */}
<File size="medium" isBoxed label="Choose a file..." iconLeft={<Icon name="upload" />} />
<File size="large" isBoxed label="Choose a file..." iconLeft={<Icon name="upload" />} />
```

---

### Sizes with Name and Boxed

```tsx live
<File size="small" isBoxed hasName fileName="summary.docx" label="Choose a file..." iconLeft={<Icon name="upload" />} />
<File isBoxed hasName fileName="summary.docx" label="Choose a file..." iconLeft={<Icon name="upload" />} /> {/* Normal */}
<File size="medium" isBoxed hasName fileName="summary.docx" label="Choose a file..." iconLeft={<Icon name="upload" />} />
<File size="large" isBoxed hasName fileName="summary.docx" label="Choose a file..." iconLeft={<Icon name="upload" />} />
```

---

### Alignment: Centered

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
