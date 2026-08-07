---
title: Content
sidebar_label: Content
description: The `Content` component applies Bulma’s typographic styles to its children, enhancing the appearance of HTML elements like paragraphs, headings, lists, and tables.
---

# Content

## Overview

<!-- bestax:generated overview -->

The `Content` component applies Bulma’s typographic styles to its children, enhancing the appearance of HTML elements like paragraphs, headings, lists, and tables.

<!-- /bestax:generated overview -->

It supports Bulma size modifiers and helper classes for color, alignment, spacing, and more, making it ideal for rendering rich or markdown-like HTML content.

:::info
The `Content` component is perfect for displaying user-generated content, documentation, or any HTML you want styled consistently.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Content } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Default Content

The simplest use of the `Content` component, rendering a paragraph with default styles.

```tsx live
<Content>
  <p>This is a paragraph inside Content.</p>
</Content>
```

### Primary Text Color

Use the `textColor` prop to apply Bulma's text color helpers. This example uses `textColor="primary"` to make the text color primary.

```tsx live
<Content textColor="primary">Content with Primary Text</Content>
```

### Light Background

The `bgColor` prop applies a background color helper. Here, `bgColor="light"` gives the content a light background.

```tsx live
<Content bgColor="light">Content with Light Background</Content>
```

### Medium Size

The `size` prop allows you to adjust the overall font size and spacing of the content. Here, `size="medium"` increases the text size and padding for better readability.

```tsx live
<Content size="medium">Content with Medium Size</Content>
```

### Spacing and Alignment

You can use Bulma helper props like `m`, `p`, and `textAlign` to control margin, padding, and text alignment. This example centers the text and adds margin and padding for a visually balanced content block.

```tsx live
<Content m="4" p="4" textAlign="centered">
  Content with Margin, Padding, and Centered Text
</Content>
```

### Custom Class

Add your own CSS classes with the `className` prop to further customize the content's appearance or behavior, such as adding custom backgrounds or effects.

```tsx live
<Content className="custom-content-class">Content with Custom Class</Content>
```

### Viewport-Specific Text Color

The `viewport` prop lets you apply color or other helpers at specific breakpoints. Here, `textColor="primary"` is only applied on tablet and larger screens, making the content adapt to different devices.

```tsx live
<Content textColor="primary" viewport="tablet">
  Content with Tablet-specific Primary Text
</Content>
```

### Interactive Content

Combine multiple props such as `textColor`, `bgColor`, `size`, `m`, `p`, and `textAlign` to create visually distinct and interactive content blocks for advanced layouts or callouts.

```tsx live
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

The `Content` component automatically styles HTML elements like headings, paragraphs, lists, and blockquotes. This example demonstrates how various HTML tags are rendered with Bulma's typographic styles.

```tsx live
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

This example shows a mix of headings, lists, blockquotes, and tables, with the `size` and `textColor` props applied. Use this for rendering rich, markdown-like content with consistent Bulma styling.

```tsx live
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
- [Storybook: Content Stories](https://bestax.io/storybook/?path=/story/elements-content--default)

:::info
Use `Content` for any rich HTML or markdown output to ensure consistent Bulma styling.
:::

---

## Props

<!-- bestax:generated props -->

| Prop        | Type                                                                            | Default | Description                                                                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className` | `string`                                                                        | —       | Additional CSS classes to apply.                                                                                                                                                                                                       |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Text color helper (e.g., `'danger'` for `has-text-danger`).                                                                                                                                                                            |
| `color`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Text color alias: renders `has-text-<color>`, exactly like `textColor`. Not a filled variant (no `.content.is-<color>` CSS exists). Prefer `textColor`, which takes precedence when both are set; use `bgColor` for a colored surface. |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Background color helper (e.g., `'info'` for `has-background-info`).                                                                                                                                                                    |
| `size`      | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                              | —       | Size modifier for the content.                                                                                                                                                                                                         |
| `children`  | `React.ReactNode`                                                               | —       | Content to be rendered inside the block.                                                                                                                                                                                               |
| `...`       | All standard `<div>` attributes and Bulma helper props                          | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                      |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Content` registers these variables on its own `.content` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                                   | Sass Variable                                           | Default                         |
| -------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------- |
| `--bulma-content-heading-color`                                | `$content-heading-color`                                | `var(--bulma-text-strong)`      |
| `--bulma-content-heading-weight`                               | `$content-heading-weight`                               | `var(--bulma-weight-extrabold)` |
| `--bulma-content-heading-line-height`                          | `$content-heading-line-height`                          | `1.125`                         |
| `--bulma-content-block-margin-bottom`                          | `$content-block-margin-bottom`                          | `1em`                           |
| `--bulma-content-blockquote-background-color`                  | `$content-blockquote-background-color`                  | `var(--bulma-background)`       |
| `--bulma-content-blockquote-border-left`                       | `$content-blockquote-border-left`                       | `5px solid var(--bulma-border)` |
| `--bulma-content-blockquote-padding`                           | `$content-blockquote-padding`                           | `1.25em 1.5em`                  |
| `--bulma-content-pre-padding`                                  | `$content-pre-padding`                                  | `1.25em 1.5em`                  |
| `--bulma-content-table-cell-border`                            | `$content-table-cell-border`                            | `1px solid var(--bulma-border)` |
| `--bulma-content-table-cell-border-width`                      | `$content-table-cell-border-width`                      | `0 0 1px`                       |
| `--bulma-content-table-cell-padding`                           | `$content-table-cell-padding`                           | `0.5em 0.75em`                  |
| `--bulma-content-table-cell-heading-color`                     | `$content-table-cell-heading-color`                     | `var(--bulma-text-strong)`      |
| `--bulma-content-table-head-cell-border-width`                 | `$content-table-head-cell-border-width`                 | `0 0 2px`                       |
| `--bulma-content-table-head-cell-color`                        | `$content-table-head-cell-color`                        | `var(--bulma-text-strong)`      |
| `--bulma-content-table-body-last-row-cell-border-bottom-width` | `$content-table-body-last-row-cell-border-bottom-width` | `0`                             |
| `--bulma-content-table-foot-cell-border-width`                 | `$content-table-foot-cell-border-width`                 | `2px 0 0`                       |
| `--bulma-content-table-foot-cell-color`                        | `$content-table-foot-cell-color`                        | `var(--bulma-text-strong)`      |

<!-- /bestax:generated cssvars -->
