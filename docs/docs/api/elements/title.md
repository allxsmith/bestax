---
title: Title
sidebar_label: Title
---

# Title

## Overview

The `Title` component renders a Bulma-styled title (heading), supporting sizes 1–6, spacing, and rendering as any heading or paragraph element (`h1`–`h6`, `p`). Use it for section headings, page titles, or prominent labels.

:::info
Pair `Title` with `SubTitle` for semantic and visually balanced headings.
:::

---

## Import

```tsx
import { Title } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                                  | Default | Description                                      |
| ----------- | ----------------------------------------------------- | ------- | ------------------------------------------------ |
| `className` | `string`                                              | —       | Additional CSS classes.                          |
| `size`      | `'1' \| '2' \| '3' \| '4' \| '5' \| '6'`              | —       | Size of the title (Bulma sizes).                 |
| `isSpaced`  | `boolean`                                             | —       | Adds margin below the title.                     |
| `as`        | `'h1' \| 'h2' \| 'h3' \| 'h4' \| 'h5' \| 'h6' \| 'p'` | `'h1'`  | HTML element to render as.                       |
| `children`  | `React.ReactNode`                                     | —       | Title content.                                   |
| ...         | All standard heading/paragraph and Bulma helper props |         | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Default Title

```tsx
<Title>Default Title</Title>
```

### Different Sizes

```tsx
<>
  <Title size="1">Title Size 1</Title>
  <Title size="3">Title Size 3</Title>
</>
```

### Spaced Title

```tsx
<Title isSpaced>Spaced Title</Title>
```

### With Margin

```tsx
<Title m="4">Title with Margin</Title>
```

### As Paragraph

```tsx
<Title as="p" size="3">
  Title as Paragraph
</Title>
```

### All Sizes

```tsx
<>
  {['1', '2', '3', '4', '5', '6'].map(size => (
    <Title key={size} size={size}>
      Title Size {size}
    </Title>
  ))}
</>
```

### Title and Subtitle

```tsx
<Block>
  <Title as="p" size="1">
    Title 1
  </Title>
  <SubTitle as="p" size="3">
    Subtitle 3
  </SubTitle>
</Block>
```

---

## Accessibility

- **Semantic HTML:** Use appropriate heading levels for document structure.
- **Spacing:** Use `isSpaced` for extra margin when needed.
- **Screen readers:** Headings are key landmarks, so set the correct `as` and `size` prop for hierarchy.

:::tip
When using `as="p"`, the element is visually styled as a heading but semantically a paragraph.
:::

---

## Related Components

- [`SubTitle`](./subtitle.md): For secondary headings.
- [`Block`](./block.md): For spacing and grouping content.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Bulma Title Documentation](https://bulma.io/documentation/elements/title/)
- [Storybook: Title Stories](https://storybook.bestax.cc/?path=/story/elements-title--default)
