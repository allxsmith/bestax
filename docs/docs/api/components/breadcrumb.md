---
title: Breadcrumb
sidebar_label: Breadcrumb
---

# Breadcrumb

## Overview

The `Breadcrumb` component renders a Bulma-styled breadcrumb navigation. It supports alignment, separator styles, sizes, and works naturally with icons and text. Use it to help users understand their location in an app or website.

---

## Import

```tsx
import { Breadcrumb, Icon } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                         | Description                                              |
| ----------- | -------------------------------------------- | -------------------------------------------------------- |
| `className` | `string`                                     | Additional CSS classes to apply.                         |
| `alignment` | `'centered' \| 'right'`                      | Alignment of the breadcrumb (`is-centered`, `is-right`). |
| `separator` | `'arrow' \| 'bullet' \| 'dot' \| 'succeeds'` | Type of separator between breadcrumb items.              |
| `size`      | `'small' \| 'medium' \| 'large'`             | Breadcrumb size.                                         |
| `children`  | `React.ReactNode`                            | Breadcrumb items (`<li>`s with `<a>` or `<span>`).       |
| ...         | All standard HTML and Bulma helper props     | (See [Helper Props](../helpers/usebulmaclasses))         |

---

## Usage

### Default Breadcrumb

```tsx
<Breadcrumb>
  <li>
    <a href="#">
      <Icon name="fas fa-home" ariaLabel="home icon" /> Home
    </a>
  </li>
  <li>
    <a href="#">
      <Icon name="fas fa-folder" ariaLabel="category icon" /> Category
    </a>
  </li>
  <li className="is-active">
    <a href="#">
      <Icon name="fas fa-file" ariaLabel="item icon" /> Item
    </a>
  </li>
</Breadcrumb>
```

---

### Centered Alignment

```tsx
<Breadcrumb alignment="centered">
  <li>
    <a href="#">
      <Icon name="fas fa-home" ariaLabel="home icon" /> Home
    </a>
  </li>
  <li>
    <a href="#">
      <Icon name="fas fa-folder" ariaLabel="category icon" /> Category
    </a>
  </li>
  <li className="is-active">
    <a href="#">
      <Icon name="fas fa-file" ariaLabel="item icon" /> Item
    </a>
  </li>
</Breadcrumb>
```

---

### Right Alignment

```tsx
<Breadcrumb alignment="right">
  <li>
    <a href="#">
      <Icon name="fas fa-home" ariaLabel="home icon" /> Home
    </a>
  </li>
  <li>
    <a href="#">
      <Icon name="fas fa-folder" ariaLabel="category icon" /> Category
    </a>
  </li>
  <li className="is-active">
    <a href="#">
      <Icon name="fas fa-file" ariaLabel="item icon" /> Item
    </a>
  </li>
</Breadcrumb>
```

---

### Arrow Separator

```tsx
<Breadcrumb separator="arrow">
  <li>
    <a href="#">
      <Icon name="fas fa-home" ariaLabel="home icon" /> Home
    </a>
  </li>
  <li>
    <a href="#">
      <Icon name="fas fa-folder" ariaLabel="category icon" /> Category
    </a>
  </li>
  <li className="is-active">
    <a href="#">
      <Icon name="fas fa-file" ariaLabel="item icon" /> Item
    </a>
  </li>
</Breadcrumb>
```

---

### Bullet Separator

```tsx
<Breadcrumb separator="bullet">
  <li>
    <a href="#">
      <Icon name="fas fa-home" ariaLabel="home icon" /> Home
    </a>
  </li>
  <li>
    <a href="#">
      <Icon name="fas fa-folder" ariaLabel="category icon" /> Category
    </a>
  </li>
  <li className="is-active">
    <a href="#">
      <Icon name="fas fa-file" ariaLabel="item icon" /> Item
    </a>
  </li>
</Breadcrumb>
```

---

### Dot Separator

```tsx
<Breadcrumb separator="dot">
  <li>
    <a href="#">
      <Icon name="fas fa-home" ariaLabel="home icon" /> Home
    </a>
  </li>
  <li>
    <a href="#">
      <Icon name="fas fa-folder" ariaLabel="category icon" /> Category
    </a>
  </li>
  <li className="is-active">
    <a href="#">
      <Icon name="fas fa-file" ariaLabel="item icon" /> Item
    </a>
  </li>
</Breadcrumb>
```

---

### Succeeds Separator

```tsx
<Breadcrumb separator="succeeds">
  <li>
    <a href="#">
      <Icon name="fas fa-home" ariaLabel="home icon" /> Home
    </a>
  </li>
  <li>
    <a href="#">
      <Icon name="fas fa-folder" ariaLabel="category icon" /> Category
    </a>
  </li>
  <li className="is-active">
    <a href="#">
      <Icon name="fas fa-file" ariaLabel="item icon" /> Item
    </a>
  </li>
</Breadcrumb>
```

---

### Small Size

```tsx
<Breadcrumb size="small">
  <li>
    <a href="#">
      <Icon name="fas fa-home" ariaLabel="home icon" /> Home
    </a>
  </li>
  <li>
    <a href="#">
      <Icon name="fas fa-folder" ariaLabel="category icon" /> Category
    </a>
  </li>
  <li className="is-active">
    <a href="#">
      <Icon name="fas fa-file" ariaLabel="item icon" /> Item
    </a>
  </li>
</Breadcrumb>
```

---

### Medium Size

```tsx
<Breadcrumb size="medium">
  <li>
    <a href="#">
      <Icon name="fas fa-home" ariaLabel="home icon" /> Home
    </a>
  </li>
  <li>
    <a href="#">
      <Icon name="fas fa-folder" ariaLabel="category icon" /> Category
    </a>
  </li>
  <li className="is-active">
    <a href="#">
      <Icon name="fas fa-file" ariaLabel="item icon" /> Item
    </a>
  </li>
</Breadcrumb>
```

---

### Large Size

```tsx
<Breadcrumb size="large">
  <li>
    <a href="#">
      <Icon name="fas fa-home" ariaLabel="home icon" /> Home
    </a>
  </li>
  <li>
    <a href="#">
      <Icon name="fas fa-folder" ariaLabel="category icon" /> Category
    </a>
  </li>
  <li className="is-active">
    <a href="#">
      <Icon name="fas fa-file" ariaLabel="item icon" /> Item
    </a>
  </li>
</Breadcrumb>
```

---

### With Icons, Alignment, Separator, Size, and Text Weight

```tsx
<Breadcrumb
  alignment="centered"
  separator="dot"
  size="medium"
  textWeight="semibold"
>
  <li>
    <a href="#">
      <Icon
        name="fas fa-home"
        textColor="primary"
        size="small"
        ariaLabel="home icon"
      />{' '}
      Home
    </a>
  </li>
  <li>
    <a href="#">
      <Icon
        name="fas fa-folder"
        textColor="info"
        size="small"
        ariaLabel="category icon"
      />{' '}
      Category
    </a>
  </li>
  <li className="is-active">
    <a href="#">
      <Icon
        name="fas fa-file"
        textColor="success"
        size="small"
        ariaLabel="item icon"
      />{' '}
      Item
    </a>
  </li>
</Breadcrumb>
```

---

## Accessibility

- The root is a `<nav class="breadcrumb">` with `aria-label="breadcrumbs"`.
- Each breadcrumb item should be an `<li>` with an `<a>` or `<span>`, and the final active item should have the `is-active` class.

---

## Related Components

- [`Icon`](../elements/icon.md): For adding icons to breadcrumb items.
- [Helper Props](../helpers/usebulmaclasses.md)

---

## Additional Resources

- [Bulma Breadcrumb Documentation](https://bulma.io/documentation/components/breadcrumb/)
- [Storybook: Breadcrumb Stories](https://bestax.cc/storybook/?path=/story/components-breadcrumb--default)
