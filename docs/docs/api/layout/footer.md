---
title: Footer
sidebar_label: Footer
---

# Footer

## Overview

The `Footer` component provides a semantic and accessible site footer for your Bulma React UI. It supports Bulma color and background helpers, accepts any content as children, and can be rendered as either a `<footer>` or `<div>`. Use it to display copyright, links, or extra information at the bottom of your pages.

:::info
`Footer` is usually placed at the end of your layout and is styled to stand out as a distinct section.
:::

---

## Import

```tsx
import { Footer } from '@allxsmith/bestax-bulma';
```

---

## Props

| Field       | Type                                                                                                                                                                                                                                                                                     | Default    | Description                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------ |
| `as`        | `'footer'` \| `'div'`                                                                                                                                                                                                                                                                    | `'footer'` | The HTML tag to render as.                       |
| `color`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —          | Bulma color modifier.                            |
| `bgColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —          | Background color.                                |
| `textColor` | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —          | Text color.                                      |
| `className` | `string`                                                                                                                                                                                                                                                                                 | —          | Additional CSS classes.                          |
| `children`  | `React.ReactNode`                                                                                                                                                                                                                                                                        | —          | Content inside the footer.                       |
| ...         | All Bulma helper and HTML props                                                                                                                                                                                                                                                          | —          | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Default Footer

This example shows the `Footer` component with centered content. Use the `Footer` at the bottom of your layout to display copyright, links, or extra information. The `as` prop can be used to render as a `<footer>` or `<div>`.

```tsx live
import { Footer } from '@allxsmith/bestax-bulma';
import { Content } from '@allxsmith/bestax-bulma';

<Footer>
  <Content textAlign="centered">
    <p>
      <strong>Bestax</strong> a Bulma component library by{' '}
      <a href="https://bestax.cc">Alex Smith</a>.<br />
      <a href="https://opensource.org/license/mit">MIT Source Code License</a>
      {', '}
      Web content licensed{' '}
      <a href="https://creativecommons.org/licenses/by-nc-sa/4.0//">
        CC BY NC SA 4.0
      </a>
      .
    </p>
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
- [Storybook: Footer Stories](https://bestax.cc/storybook/?path=/story/layout-footer--default)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Footer />` for powerful utility-based styling.
:::
