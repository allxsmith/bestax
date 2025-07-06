---
title: SubTitle
sidebar_label: SubTitle
---

# SubTitle

## Overview

The `SubTitle` component renders a Bulma-styled subtitle (secondary heading), supporting sizes 1–6 and rendering as any heading or paragraph element (`h1`–`h6`, `p`). Use it for subheadings, section captions, or as a pair with `Title`.

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

| Prop        | Type                                                  | Default | Description                                      |
| ----------- | ----------------------------------------------------- | ------- | ------------------------------------------------ |
| `className` | `string`                                              | —       | Additional CSS classes.                          |
| `size`      | `'1' \| '2' \| '3' \| '4' \| '5' \| '6'`              | —       | Size of the subtitle (Bulma sizes).              |
| `as`        | `'h1' \| 'h2' \| 'h3' \| 'h4' \| 'h5' \| 'h6' \| 'p'` | `'h1'`  | HTML element to render as.                       |
| `children`  | `React.ReactNode`                                     | —       | Subtitle content.                                |
| ...         | All standard heading/paragraph and Bulma helper props |         | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Default SubTitle

```tsx
<SubTitle>Default SubTitle</SubTitle>
```

### Different Sizes

```tsx
<>
  <SubTitle size="2">SubTitle Size 2</SubTitle>
  <SubTitle size="4">SubTitle Size 4</SubTitle>
</>
```

### With Margin

```tsx
<SubTitle m="4">SubTitle with Margin</SubTitle>
```

### As Paragraph

```tsx
<SubTitle as="p" size="3">
  SubTitle as Paragraph
</SubTitle>
```

### All Sizes

```tsx
<>
  {['1', '2', '3', '4', '5', '6'].map(size => (
    <SubTitle key={size} size={size}>
      SubTitle Size {size}
    </SubTitle>
  ))}
</>
```

### Title and Subtitle Pairings

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
- [Storybook: SubTitle Stories](https://storybook.bestax.cc/?path=/story/elements-subtitle--default)
