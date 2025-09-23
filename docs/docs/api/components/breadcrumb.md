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

To create a navigation trail, use the `Breadcrumb` component with a series of `<li>` elements as children. You can include icons, text, and links for each breadcrumb item. This pattern helps users understand their current location within the app and easily navigate back to previous sections. Customize the appearance using props like `alignment`, `separator`, and `size` for different layouts and styles.

```tsx live
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

Set the `alignment` prop to `centered` to center the breadcrumb navigation horizontally. This is useful for layouts where you want the navigation to be visually balanced in the middle of the page or section. All other features, such as icons and separators, remain available.

```tsx live
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

Use the `alignment` prop with the value `right` to align the breadcrumb navigation to the right edge of its container. This is helpful for layouts where navigation should be flush with the right margin, such as in toolbars or headers.

```tsx live
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

Set the `separator` prop to `arrow` to use arrow icons between breadcrumb items. This style is visually clear and works well for step-by-step navigation.

```tsx live
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

Use the `separator` prop with the value `bullet` to display bullet points between breadcrumb items. This provides a subtle, minimalist look for navigation trails.

```tsx live
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

Set the `separator` prop to `dot` to use dot separators between breadcrumb items. This style is clean and works well for compact navigation.

```tsx live
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

Use the `separator` prop with the value `succeeds` to show a chevron-style separator between breadcrumb items. This is another option for visually indicating progression.

```tsx live
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

Set the `size` prop to `small` to render a compact breadcrumb navigation. This is useful for tight layouts or when breadcrumbs are a secondary navigation element.

```tsx live
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

Use the `size` prop with the value `medium` to increase the breadcrumb's size for better visibility or emphasis in your layout.

```tsx live
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

Set the `size` prop to `large` to make the breadcrumb navigation more prominent. This is ideal for main navigation or when breadcrumbs need to stand out.

```tsx live
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

Combine multiple props such as `alignment`, `separator`, `size`, and `textWeight` to fully customize the breadcrumb's appearance. You can also use the `textColor` and `size` props on the `Icon` component for even more control over the look of each breadcrumb item.

```tsx live
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
- [Storybook: Breadcrumb Stories](https://bestax.io/storybook/?path=/story/components-breadcrumb--default)
