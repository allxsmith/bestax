---
title: SubTitle
sidebar_label: SubTitle
---

# SubTitle

## Overview

The `SubTitle` component renders a Bulma-styled subtitle (secondary heading), supporting sizes 1–6 and rendering as any heading or paragraph element (`h1`–`h6`, `p`). Use it for subheadings, section titles, and supporting text.

:::info
`SubTitle` helps create clarity in content structure, especially when paired with `Title`.
:::

---

## Import

```tsx
import { SubTitle } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop          | Type                                                  | Default | Description                                              |
| ------------- | ----------------------------------------------------- | ------- | -------------------------------------------------------- |
| `className`   | `string`                                              | —       | Additional CSS classes.                                  |
| `size`        | `'1' \| '2' \| '3' \| '4' \| '5' \| '6'`              | —       | Size of the subtitle (Bulma sizes).                      |
| `as`          | `'h1' \| 'h2' \| 'h3' \| 'h4' \| 'h5' \| 'h6' \| 'p'` | `'h1'`  | HTML element to render as.                               |
| `hasSkeleton` | `boolean`                                             | —       | Applies the `has-skeleton` class to part of the content. |
| `skeleton`    | `boolean`                                             | —       | Applies the `is-skeleton` class to the entire component. |
| `children`    | `React.ReactNode`                                     | —       | Subtitle content.                                        |
| ...           | All standard heading/paragraph and Bulma helper props |         | (See [Helper Props](../helpers/usebulmaclasses))         |

---

## Usage

### Default SubTitle

```tsx live
<SubTitle>Default SubTitle</SubTitle>
```

### Has Skeleton

```tsx live
<SubTitle hasSkeleton>SubTitle with Skeleton Effect</SubTitle>
```

`hasSkeleton` will only turn a small part of the content into a skeleton, typically for partial loading effects.

### Is Skeleton

```tsx live
<SubTitle skeleton>SubTitle Skeleton Effect</SubTitle>
```

`skeleton` applies the `is-skeleton` class to the entire subtitle, making the whole heading appear as a skeleton placeholder.

### Different Sizes

```tsx live
<>
  <SubTitle size="2">SubTitle Size 2</SubTitle>
  <SubTitle size="4">SubTitle Size 4</SubTitle>
</>
```

### With Margin

```tsx live
<SubTitle m="4">SubTitle with Margin</SubTitle>
```

### As Paragraph

```tsx live
<SubTitle as="p" size="3">
  SubTitle as Paragraph
</SubTitle>
```

### All Sizes

```tsx live
<>
  {['1', '2', '3', '4', '5', '6'].map(size => (
    <SubTitle key={size} size={size}>
      SubTitle Size {size}
    </SubTitle>
  ))}
</>
```

### Title and Subtitle Pairings

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
- **Screen readers:** Subtitles should be used in conjunction with titles for clarity.

:::tip
`SubTitle` is visually styled as a heading, but its semantic level depends on the `as` prop.
:::

---

## Related Components

- [`Title`](./title.md): For main headings.
- [`Block`](./block.md): For spacing and grouping content.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Bulma Title Documentation (Subtitle)](https://bulma.io/documentation/elements/title/#subtitle)
- [Storybook: SubTitle Stories](https://bestax.cc/storybook/?path=/story/elements-subtitle--default)
