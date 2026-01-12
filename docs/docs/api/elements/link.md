---
title: Link
sidebar_label: Link
---

# Link

## Overview

The `Link` component renders a styled anchor (`<a>`) element with Bulma helper class integration. Use it for navigation links, external links, or any clickable text that follows Bulma's styling conventions. It supports all Bulma helper props for color, spacing, typography, and more.

:::info
The Link component is a thin wrapper around the HTML `<a>` element, providing consistent Bulma styling and helper class support.
:::

---

## Import

```tsx
import { Link } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                                                                                                                                                                                                                                                                     | Default | Description                                       |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `href`      | `string`                                                                                                                                                                                                                                                                                 | —       | The URL the link points to.                       |
| `target`    | `'_self'` \| `'_blank'` \| `'_parent'` \| `'_top'`                                                                                                                                                                                                                                       | —       | Where to open the linked document.                |
| `rel`       | `string`                                                                                                                                                                                                                                                                                 | —       | Relationship between current and linked document. |
| `isActive`  | `boolean`                                                                                                                                                                                                                                                                                | —       | Whether the link appears active.                  |
| `className` | `string`                                                                                                                                                                                                                                                                                 | —       | Additional CSS classes.                           |
| `textColor` | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Text color helper.                                |
| `bgColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Background color helper.                          |
| `children`  | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | Content to render inside the link.                |
| ...         | All standard `<a>` and Bulma helper props                                                                                                                                                                                                                                                |         | (See [Helper Props](../helpers/usebulmaclasses))  |

---

## Usage

### Default Link

The default usage of the `Link` component renders a standard anchor element with Bulma styling support.

```tsx live
<Link href="#">Default Link</Link>
```

### Primary Color Link

Set the text color using the `textColor` prop to emphasize the link with Bulma's primary color.

```tsx live
<Link href="#" textColor="primary">
  Primary Link
</Link>
```

### Danger Color Link

Use `textColor="danger"` for links that indicate destructive or warning actions.

```tsx live
<Link href="#" textColor="danger">
  Danger Link
</Link>
```

### Active Link

Apply the `isActive` prop to style the link as currently active, useful for navigation menus.

```tsx live
<Link href="#" isActive>
  Active Link
</Link>
```

### External Link

For external links, set `target="_blank"` and use `rel="noopener noreferrer"` for security.

```tsx live
<Link href="https://bulma.io" target="_blank" rel="noopener noreferrer">
  Open Bulma Docs
</Link>
```

### Link with Background

Add a background color and padding to create a button-like appearance.

```tsx live
<Link href="#" bgColor="light" p="2">
  Link with Background
</Link>
```

### Large Text Link

Use the `textSize` prop to increase the link's font size.

```tsx live
<Link href="#" textSize="3">
  Large Link
</Link>
```

### Bold Link

Apply bold text weight using the `textWeight` prop.

```tsx live
<Link href="#" textWeight="bold">
  Bold Link
</Link>
```

### All Colors

Display links in all Bulma theme colors.

```tsx live
<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
  <Link href="#" textColor="primary">
    Primary Link
  </Link>
  <Link href="#" textColor="link">
    Link Color Link
  </Link>
  <Link href="#" textColor="info">
    Info Link
  </Link>
  <Link href="#" textColor="success">
    Success Link
  </Link>
  <Link href="#" textColor="warning">
    Warning Link
  </Link>
  <Link href="#" textColor="danger">
    Danger Link
  </Link>
</div>
```

### Inline Link

Links work seamlessly inline within text content.

```tsx live
<Paragraph>
  This is a paragraph with an <Link href="#">inline link</Link> in the middle of
  the text.
</Paragraph>
```

---

## Accessibility

- **Descriptive Text:** Use meaningful link text that describes the destination, not generic text like "click here".
- **External Links:** When opening links in new tabs, consider informing users (e.g., with an icon or text like "opens in new tab").
- **Focus States:** Links inherit browser focus styles. Customize with CSS if needed.
- **Keyboard Navigation:** Links are naturally keyboard accessible via Tab and Enter keys.

:::info
For navigation menus, consider using the `isActive` prop to indicate the current page.
:::

---

## Related Components

- [`Button`](./button.md): For button-style clickable elements.
- [`Paragraph`](./paragraph.md): For text paragraphs that may contain links.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Bulma Content Documentation](https://bulma.io/documentation/elements/content/)
- [Storybook: Link Stories](https://bestax.io/storybook/?path=/story/elements-link--default)
