---
title: Footer
sidebar_label: Footer
description: The `Footer` component provides a semantic and accessible site footer for your Bulma React UI.
---

# Footer

## Overview

<!-- bestax:generated overview -->

The `Footer` component provides a semantic and accessible site footer for your Bulma React UI.

<!-- /bestax:generated overview -->

It supports Bulma color and background helpers, accepts any content as children, and can be rendered as either a `<footer>` or `<div>`. Use it to display copyright, links, or extra information at the bottom of your pages.

:::info
`Footer` is usually placed at the end of your layout and is styled to stand out as a distinct section.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Footer } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Default Footer

This example shows the `Footer` component with centered content. Use the `Footer` at the bottom of your layout to display copyright, links, or extra information. The `as` prop can be used to render as a `<footer>` or `<div>`.

```tsx live
import { Footer } from '@allxsmith/bestax-bulma';
import { Content } from '@allxsmith/bestax-bulma';

<Footer>
  <Content textAlign="centered">
    <Paragraph>
      <Strong>Bestax</Strong> a Bulma component library by{' '}
      <a href="https://bestax.io">Alex Smith</a>.<br />
      <a href="https://opensource.org/license/mit">MIT Source Code License</a>
      {', '}
      Web content licensed{' '}
      <a href="https://creativecommons.org/licenses/by-nc-sa/4.0//">
        CC BY NC SA 4.0
      </a>
      .
    </Paragraph>
  </Content>
</Footer>;
```

---

## Accessibility

- Renders as a semantic `<footer>` tag by default.
- Accepts any valid children; ensure your links and text are accessible.
- You can use the `as="div"` prop if you need a non-semantic container.

:::note
When using only icons or non-text content, add `aria-label` or screen-reader-only content for accessibility.
:::

---

## Related Components

- [`Content`](../elements/content.md): For rich text and formatting within the footer.
- [`Container`](./container.md): To constrain footer width if desired.
- [Helper Props](../helpers/usebulmaclasses.md): Use Bulma utility helpers for spacing, color, etc.

---

## Additional Resources

- [Bulma Footer Documentation](https://bulma.io/documentation/layout/footer/)
- [Storybook: Footer Stories](https://bestax.io/storybook/?path=/story/layout-footer--default)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Footer />` for powerful utility-based styling.
:::

---

## Props

<!-- bestax:generated props -->

| Prop        | Type                                                                                                            | Default    | Description                                                                                                                                                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `as`        | `'footer'` \| `'div'`                                                                                           | `'footer'` | The HTML tag to render as.                                                                                                                                                                                                          |
| `color`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                         | —          | Bulma color modifier.                                                                                                                                                                                                               |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `(typeof validSchemeColors)[number]` \| `'inherit'` \| `'current'` | —          | Background color. `scheme-*` values render as a dark-mode-safe inline `background-color: var(--bulma-scheme-*)` instead of a class. The `scheme-invert*` values do not change text color — pair them with a contrasting foreground. |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                         | —          | Text color.                                                                                                                                                                                                                         |
| `className` | `string`                                                                                                        | —          | Additional CSS classes.                                                                                                                                                                                                             |
| `children`  | `React.ReactNode`                                                                                               | —          | Content inside the footer.                                                                                                                                                                                                          |
| `...`       | All standard HTML attributes and Bulma helper props                                                             | —          | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                   |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Footer` registers these variables on its own `.footer` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                      | Sass Variable              | Default                        |
| --------------------------------- | -------------------------- | ------------------------------ |
| `--bulma-footer-background-color` | `$footer-background-color` | `var(--bulma-scheme-main-bis)` |
| `--bulma-footer-color`            | `$footer-color`            | `false`                        |
| `--bulma-footer-padding`          | `$footer-padding`          | `3rem 1.5rem 6rem`             |

<!-- /bestax:generated cssvars -->
