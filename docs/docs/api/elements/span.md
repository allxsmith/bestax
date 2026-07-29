---
title: Span
sidebar_label: Span
description: The `Span` component renders a styled inline `<span>` element with Bulma helper class integration.
---

# Span

## Overview

<!-- bestax:generated overview -->

The `Span` component renders a styled inline `<span>` element with Bulma helper class integration.

<!-- /bestax:generated overview -->

Use it for highlighting text, applying inline styles, or wrapping content that needs Bulma's typography and color utilities without affecting the document flow.

:::info
The Span component is a thin wrapper around the HTML `<span>` element, providing consistent Bulma styling and helper class support for inline content.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Span } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Default Span

The default usage of the `Span` component renders plain inline content.

```tsx live
<Span>Default Span</Span>
```

### Primary Color Span

Set the text color using the `textColor` prop to highlight inline text.

```tsx live
<Span textColor="primary">Primary Text</Span>
```

### Success Color Span

Use semantic colors to convey meaning.

```tsx live
<Span textColor="success">Success Text</Span>
```

### Span with Background

Add a background color and padding to create a highlight effect.

```tsx live
<Span bgColor="warning" p="2">
  Highlighted Text
</Span>
```

### Large Text Span

Use the `textSize` prop to increase the font size of inline content.

```tsx live
<Span textSize="3">Large Span</Span>
```

### Bold Span

Apply bold text weight for emphasis.

```tsx live
<Span textWeight="bold">Bold Span</Span>
```

### All Colors

Display spans in all Bulma theme colors.

```tsx live
<Block display="flex" flexDirection="column" gap="2">
  <Span textColor="primary">Primary Span</Span>
  <Span textColor="link">Link Span</Span>
  <Span textColor="info">Info Span</Span>
  <Span textColor="success">Success Span</Span>
  <Span textColor="warning">Warning Span</Span>
  <Span textColor="danger">Danger Span</Span>
</Block>
```

### Inline with Text

Spans work seamlessly inline within paragraphs.

```tsx live
<Paragraph>
  This paragraph contains a <Span textColor="primary">colored span</Span> and a{' '}
  <Span textWeight="bold">bold span</Span> for emphasis.
</Paragraph>
```

### Highlighted Text

Combine background and text colors for a marker-like highlight effect.

```tsx live
<Paragraph>
  This sentence has{' '}
  <Span bgColor="warning" textColor="dark" p="1">
    highlighted text
  </Span>{' '}
  to draw attention.
</Paragraph>
```

---

## Accessibility

- **Semantic Meaning:** The `<span>` element has no semantic meaning. Use it only for styling purposes.
- **Color Contrast:** Ensure sufficient contrast between text and background colors for readability.
- **Screen Readers:** Content inside spans is read normally by screen readers.

:::info
For text that has semantic importance, consider using `<strong>` (Strong) or `<em>` (Emphasis) components instead.
:::

---

## Related Components

- [`Strong`](./strong.md): For semantically important bold text.
- [`Emphasis`](./emphasis.md): For semantically emphasized italic text.
- [`Paragraph`](./paragraph.md): For text paragraphs.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Bulma Typography Helpers](https://bulma.io/documentation/helpers/typography-helpers/)
- [Storybook: Span Stories](https://bestax.io/storybook/?path=/story/elements-span--default)

---

## Props

<!-- bestax:generated props -->

| Prop        | Type                                                                    | Default | Description                                       |
| ----------- | ----------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `className` | `string`                                                                | —       | Additional CSS classes to apply.                  |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper.                                |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                          |
| `children`  | `React.ReactNode`                                                       | —       | Content to be rendered inside the span.           |
| `...`       | All standard `<span>` attributes and Bulma helper props                 | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

<!-- /bestax:generated props -->
