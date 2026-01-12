---
title: Paragraph
sidebar_label: Paragraph
---

# Paragraph

## Overview

The `Paragraph` component renders a styled `<p>` element with Bulma helper class integration. Use it for text content that benefits from Bulma's typography utilities, including text color, size, alignment, weight, and spacing.

:::info
The Paragraph component is a thin wrapper around the HTML `<p>` element, providing consistent Bulma styling and helper class support for text content.
:::

---

## Import

```tsx
import { Paragraph } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                                                                                                                                                                                                                                                                     | Default | Description                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------ |
| `className` | `string`                                                                                                                                                                                                                                                                                 | —       | Additional CSS classes.                          |
| `textColor` | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Text color helper.                               |
| `bgColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Background color helper.                         |
| `children`  | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | Content to render inside the paragraph.          |
| ...         | All standard `<p>` and Bulma helper props                                                                                                                                                                                                                                                |         | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Default Paragraph

The default usage of the `Paragraph` component renders a standard paragraph element.

```tsx live
<Paragraph>
  This is a default paragraph. It contains some sample text to demonstrate the
  component.
</Paragraph>
```

### Primary Color Paragraph

Set the text color using the `textColor` prop for emphasis.

```tsx live
<Paragraph textColor="primary">
  This paragraph has primary colored text.
</Paragraph>
```

### Centered Text

Use the `textAlign` prop to center the text.

```tsx live
<Paragraph textAlign="centered">This paragraph is centered.</Paragraph>
```

### Paragraph with Background

Add a background color and padding to create a callout effect.

```tsx live
<Paragraph bgColor="light" p="3">
  This paragraph has a light background.
</Paragraph>
```

### Large Text

Use the `textSize` prop to increase the font size.

```tsx live
<Paragraph textSize="3">This is a large paragraph.</Paragraph>
```

### Small Text

Use the `textSize` prop with a larger number for smaller text.

```tsx live
<Paragraph textSize="7">This is a small paragraph.</Paragraph>
```

### Justified Text

Use `textAlign="justified"` for text that spans the full width.

```tsx live
<div style={{ maxWidth: '400px' }}>
  <Paragraph textAlign="justified">
    This paragraph has justified text alignment. Lorem ipsum dolor sit amet,
    consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
    dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
    ullamco laboris.
  </Paragraph>
</div>
```

### All Colors

Display paragraphs in all Bulma theme colors.

```tsx live
<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
  <Paragraph textColor="primary">Primary paragraph</Paragraph>
  <Paragraph textColor="link">Link paragraph</Paragraph>
  <Paragraph textColor="info">Info paragraph</Paragraph>
  <Paragraph textColor="success">Success paragraph</Paragraph>
  <Paragraph textColor="warning">Warning paragraph</Paragraph>
  <Paragraph textColor="danger">Danger paragraph</Paragraph>
</div>
```

### Stacked Paragraphs

Use margin props to control spacing between paragraphs.

```tsx live
<div style={{ maxWidth: '500px' }}>
  <Paragraph mb="4">
    First paragraph with margin bottom. Lorem ipsum dolor sit amet, consectetur
    adipiscing elit.
  </Paragraph>
  <Paragraph mb="4">
    Second paragraph with margin bottom. Sed do eiusmod tempor incididunt ut
    labore et dolore magna aliqua.
  </Paragraph>
  <Paragraph>
    Third paragraph without margin bottom. Ut enim ad minim veniam, quis nostrud
    exercitation.
  </Paragraph>
</div>
```

### Highlighted Paragraph

Combine background and text colors for a callout or highlight effect.

```tsx live
<Paragraph bgColor="dark" textColor="white" p="4">
  This is a highlighted paragraph with dark background.
</Paragraph>
```

---

## Accessibility

- **Semantic Structure:** Use paragraphs to wrap distinct blocks of text for proper document structure.
- **Color Contrast:** Ensure sufficient contrast between text and background colors for readability.
- **Heading Order:** Paragraphs should follow proper heading hierarchy in your document.

:::info
For semantic emphasis within paragraphs, use `<strong>` (Strong) or `<em>` (Emphasis) components.
:::

---

## Related Components

- [`Span`](./span.md): For inline styled text.
- [`Strong`](./strong.md): For semantically important bold text.
- [`Emphasis`](./emphasis.md): For semantically emphasized italic text.
- [`Content`](./content.md): For rich typographic content.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Bulma Typography Helpers](https://bulma.io/documentation/helpers/typography-helpers/)
- [Storybook: Paragraph Stories](https://bestax.io/storybook/?path=/story/elements-paragraph--default)
