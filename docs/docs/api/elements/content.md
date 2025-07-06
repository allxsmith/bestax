---
title: Content
sidebar_label: Content
---

# Content

## Overview

The `Content` component applies Bulma’s typographic styles to its children, enhancing the appearance of HTML elements like paragraphs, headings, lists, and tables. It supports Bulma size modifiers and helper classes for color, alignment, spacing, and more, making it ideal for rendering rich or markdown-like HTML content.

:::info
The `Content` component is perfect for displaying user-generated content, documentation, or any HTML you want styled consistently.
:::

---

## Import

```tsx
import { Content } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                                                                                                                                                                                                                                                                     | Default | Description                                                         |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------- |
| `className` | `string`                                                                                                                                                                                                                                                                                 | —       | Additional CSS classes.                                             |
| `textColor` | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Text color helper (e.g., `'danger'` for `has-text-danger`).         |
| `color`     | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger'`                                                                                                                                                                                                                    | —       | Bulma color modifier for the content.                               |
| `bgColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Background color helper (e.g., `'info'` for `has-background-info`). |
| `size`      | `'small' \| 'normal' \| 'medium' \| 'large'`                                                                                                                                                                                                                                             | —       | Size modifier for the content.                                      |
| `children`  | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | Content to be rendered inside the block.                            |
| ...         | All standard `<div>` and Bulma helper props                                                                                                                                                                                                                                              |         | (See [Helper Props](../helpers/usebulmaclasses))                    |

---

## Usage

### Default Content

```tsx
<Content>
  <p>This is a paragraph inside Content.</p>
</Content>
```

### Primary Text Color

```tsx
<Content textColor="primary">Content with Primary Text</Content>
```

### Light Background

```tsx
<Content bgColor="light">Content with Light Background</Content>
```

### Medium Size

```tsx
<Content size="medium">Content with Medium Size</Content>
```

### Spacing and Alignment

```tsx
<Content m="4" p="4" textAlign="centered">
  Content with Margin, Padding, and Centered Text
</Content>
```

### Custom Class

```tsx
<Content className="custom-content-class">Content with Custom Class</Content>
```

### Viewport-Specific Text Color

```tsx
<Content textColor="primary" viewport="tablet">
  Content with Tablet-specific Primary Text
</Content>
```

### Interactive Content

```tsx
<Content
  textColor="success"
  bgColor="dark"
  size="large"
  m="3"
  p="3"
  textAlign="right"
>
  Interactive Content
</Content>
```

### Typographic Elements

```tsx
<Content textColor="info" p="3">
  <h1>Heading 1</h1>
  <p>This is a paragraph styled by Bulma’s content class.</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
  <blockquote>This is a blockquote styled by Bulma.</blockquote>
</Content>
```

### Rich Content (all HTML tags, various sizes)

```tsx
<Content size="small" textColor="primary" p="3">
  <h1>Lorem Ipsum Heading</h1>
  <p>
    Lorem ipsum dolor sit amet, <strong>consectetur adipiscing</strong> elit.
  </p>
  <ul>
    <li>Lorem ipsum</li>
    <li>Consectetur</li>
    <li>Sed do eiusmod</li>
  </ul>
  <ol>
    <li>First item</li>
    <li>Second item</li>
  </ol>
  <blockquote>
    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.
  </blockquote>
  <table>
    <thead>
      <tr>
        <th>Header 1</th>
        <th>Header 2</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Row 1, Cell 1</td>
        <td>Row 1, Cell 2</td>
      </tr>
    </tbody>
  </table>
</Content>
```

---

## Accessibility

- **Semantic HTML:** Use semantic elements (`<h1>`, `<ul>`, `<table>`, etc.) as children of `Content`.
- **Contrast:** Use appropriate text and background color combinations for readability.
- **Headings:** Keep heading structure meaningful for screen readers.

:::tip
The `Content` component does not add ARIA roles. You are responsible for semantic HTML structure within it.
:::

---

## Related Components

- [`Block`](./block.md): For simple vertical spacing between blocks of content.
- [`Box`](./box.md): For visually distinct, bordered containers.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Bulma Content Documentation](https://bulma.io/documentation/elements/content/)
- [MDN: HTML Content Categories](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_categories)
- [Storybook: Content Stories](https://bestax.cc/storybook/?path=/story/elements-content--default)

:::info
Use `Content` for any rich HTML or markdown output to ensure consistent Bulma styling.
:::
