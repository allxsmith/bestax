---
title: Title
sidebar_label: Title
---

# Title

## Overview

The `Title` component renders a Bulma-styled title (heading), supporting sizes `1`-`6`, spacing, and rendering as any heading or paragraph element (`h1`-`h6`, `p`). Use it for section headings, page titles, and prominent text.

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

| Prop          | Type                                                  | Default | Description                                              |
| ------------- | ----------------------------------------------------- | ------- | -------------------------------------------------------- |
| `className`   | `string`                                              | —       | Additional CSS classes.                                  |
| `size`        | `'1' \| '2' \| '3' \| '4' \| '5' \| '6'`              | —       | Size of the title (Bulma sizes).                         |
| `isSpaced`    | `boolean`                                             | —       | Adds margin below the title.                             |
| `as`          | `'h1' \| 'h2' \| 'h3' \| 'h4' \| 'h5' \| 'h6' \| 'p'` | `'h1'`  | HTML element to render as.                               |
| `hasSkeleton` | `boolean`                                             | —       | Applies the `has-skeleton` class to part of the content. |
| `skeleton`    | `boolean`                                             | —       | Applies the `is-skeleton` class to the entire component. |
| `children`    | `React.ReactNode`                                     | —       | Title content.                                           |
| ...           | All standard heading/paragraph and Bulma helper props |         | (See [Helper Props](../helpers/usebulmaclasses))         |

---

## Usage

### Default Title

A basic `Title` renders a prominent heading. Use this for main section or page titles.

```tsx live
<Title>Default Title</Title>
```

### Has Skeleton

Set the `hasSkeleton` prop to apply a skeleton effect to part of the title, useful for partial loading states.

```tsx live
<Title hasSkeleton>Title with Skeleton Effect</Title>
```

`hasSkeleton` will only turn a small part of the content into a skeleton, typically for partial loading effects.

### Is Skeleton

Set the `skeleton` prop to apply a skeleton effect to the entire title, indicating that the whole heading is loading.

```tsx live
<Title skeleton>Title Skeleton Effect</Title>
```

`skeleton` applies the `is-skeleton` class to the entire title, making the whole heading appear as a skeleton placeholder.

### Different Sizes

Adjust the `size` prop to render the title in different Bulma-styled sizes, from `1` to `6`.

```tsx live
<>
  <Title size="1">Title Size 1</Title>
  <Title size="3">Title Size 3</Title>
</>
```

### Spaced Title

Use the `isSpaced` prop to add margin below the title, creating visual separation from other content.

```tsx live
<Title isSpaced>Spaced Title</Title>
```

### With Margin

Utilize margin helper props like `m="4"` to add custom margins around the title.

```tsx live
<Title m="4">Title with Margin</Title>
```

### As Paragraph

Render the title as a paragraph element by setting the `as` prop to `"p"`, while still applying heading styles.

```tsx live
<Title as="p" size="3">
  Title as Paragraph
</Title>
```

### All Sizes

Quickly render titles of all sizes from `1` to `6` using a map function. This is useful for demonstrating or testing all size variations.

```tsx live
<>
  {['1', '2', '3', '4', '5', '6'].map(size => (
    <Title key={size} size={size}>
      Title Size {size}
    </Title>
  ))}
</>
```

### Title and Subtitle

Combine `Title` with `SubTitle` for a structured heading and subheading layout. This is ideal for emphasizing the relationship between a title and its subtitle.

```tsx live
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
- [Storybook: Title Stories](https://bestax.io/storybook/?path=/story/elements-title--default)
