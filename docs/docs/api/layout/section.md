---
title: Section
sidebar_label: Section
---

# Section

## Overview

The `Section` component provides vertical spacing and visual separation for your Bulma React UI. Use it to divide your page into large blocks of content, ensure consistent spacing, and apply Bulma helper props for color, background, and more. `Section` supports all Bulma section sizes and can be combined with containers, titles, and other layout components.

:::info
Use `Section` to break up your page into logical, visually distinct areas—such as headers, main content, and footers.
:::

---

## Import

```tsx
import { Section } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                                                                                                                                                                                                                                                                     | Default | Description                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------ |
| `size`      | `'medium'` \| `'large'`                                                                                                                                                                                                                                                                  | —       | Section size for extra vertical spacing.         |
| `color`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Bulma color modifier for text.                   |
| `bgColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Bulma background color helper.                   |
| `textColor` | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Bulma text color helper.                         |
| `className` | `string`                                                                                                                                                                                                                                                                                 | —       | Additional CSS classes.                          |
| `children`  | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | Section content.                                 |
| ...         | All standard HTML and Bulma helper props                                                                                                                                                                                                                                                 |         | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Default Section

```tsx live
<Section>
  <Title>Section</Title>
  <SubTitle>
    Divide your content into into <strong>sections</strong>. Tada!
  </SubTitle>
</Section>
```

---

### Medium Section

```tsx live
<Section size="medium">
  <Title>Medium Section</Title>
  <SubTitle>
    Divide your content into into <strong>sections</strong>. Tada! Make sure
    your window is wide or you won't see a medium section.
  </SubTitle>
</Section>
```

---

### Large Section

```tsx live
<Section size="large">
  <Title>Large Section</Title>
  <SubTitle>
    Divide your content into into <strong>sections</strong>. Tada! Make sure
    your window is wide or you won't see a large section.
  </SubTitle>
</Section>
```

---

## Accessibility

- The section renders as a semantic `<section>` for improved structure and accessibility.
- Use headings (`<Title>`, `<SubTitle>`) and semantic content for screen reader support.

:::note
Sections help organize your document outline for screen readers and SEO.
:::

---

## Related Components

- [`Container`](./container.md): Nest inside a section to constrain content width.
- [`Title`](../elements/title.md), [`SubTitle`](../elements/subtitle.md): For headings and description in sections.
- [Helper Props](../helpers/usebulmaclasses.md): Use Bulma helper props for utility-based styling.

---

## Additional Resources

- [Bulma Section Documentation](https://bulma.io/documentation/layout/section/)
- [Storybook: Section Stories](https://bestax.cc/storybook/?path=/story/layout-section--default)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Section />` for powerful utility-based styling.
:::
