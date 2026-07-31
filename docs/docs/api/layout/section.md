---
title: Section
sidebar_label: Section
description: The `Section` component provides vertical spacing and visual separation for your Bulma React UI.
---

# Section

## Overview

<!-- bestax:generated overview -->

The `Section` component provides vertical spacing and visual separation for your Bulma React UI.

<!-- /bestax:generated overview -->

Use it to divide your page into large blocks of content, ensure consistent spacing, and apply Bulma helper props for color, background, and more. `Section` supports all Bulma section sizes and can be combined with containers, titles, and other layout components.

:::info
Use `Section` to break up your page into logical, visually distinct areas—such as headers, main content, and footers.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Section } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Default Section

This example shows a standard `Section` component, which provides vertical spacing and visual separation for your content. Use the `Section` component to break up your page into logical areas, such as headers, main content, or footers.

```tsx live
<Section>
  <Title>Section</Title>
  <SubTitle>
    Divide your content into into <Strong>sections</Strong>. Tada!
  </SubTitle>
</Section>
```

---

### Medium Section

Set the `size` prop to `"medium"` to increase the vertical spacing of the section. This is useful for visually emphasizing certain areas of your layout.

```tsx live
<Section size="medium">
  <Title>Medium Section</Title>
  <SubTitle>
    Divide your content into into <Strong>sections</Strong>. Tada! Make sure
    your window is wide or you won't see a medium section.
  </SubTitle>
</Section>
```

---

### Large Section

Set the `size` prop to `"large"` for even more vertical spacing. Use this for prominent page sections or to create clear separation between major content blocks.

```tsx live
<Section size="large">
  <Title>Large Section</Title>
  <SubTitle>
    Divide your content into into <Strong>sections</Strong>. Tada! Make sure
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
- [Storybook: Section Stories](https://bestax.io/storybook/?path=/story/layout-section--default)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Section />` for powerful utility-based styling.
:::

---

## Props

<!-- bestax:generated props -->

| Prop        | Type                                                                    | Default | Description                                       |
| ----------- | ----------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `color`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Bulma color modifier for text.                    |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Bulma background color helper.                    |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Bulma text color helper.                          |
| `size`      | `'medium'` \| `'large'`                                                 | —       | Section size for extra vertical spacing.          |
| `className` | `string`                                                                | —       | Additional CSS classes.                           |
| `children`  | `React.ReactNode`                                                       | —       | Section content.                                  |
| `...`       | All standard HTML attributes and Bulma helper props                     | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Section` registers these variables on its own `.section` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                      | Sass Variable              | Default       |
| --------------------------------- | -------------------------- | ------------- |
| `--bulma-section-padding`         | `$section-padding`         | `3rem 1.5rem` |
| `--bulma-section-padding-desktop` | `$section-padding-desktop` | `3rem 3rem`   |
| `--bulma-section-padding-medium`  | `$section-padding-medium`  | `9rem 4.5rem` |
| `--bulma-section-padding-large`   | `$section-padding-large`   | `18rem 6rem`  |

<!-- /bestax:generated cssvars -->
