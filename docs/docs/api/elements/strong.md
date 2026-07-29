---
title: Strong
sidebar_label: Strong
description: The `Strong` component renders a styled `<strong>` element with Bulma helper class integration.
---

# Strong

## Overview

<!-- bestax:generated overview -->

The `Strong` component renders a styled `<strong>` element with Bulma helper class integration.

<!-- /bestax:generated overview -->

Use it for text that has strong importance, seriousness, or urgency. The `<strong>` element carries semantic meaning for screen readers and search engines.

:::info
For visual-only bold styling without semantic meaning, use the `Span` component with `textWeight="bold"` instead.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Strong } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Default Strong

The default usage renders bold text with semantic importance.

```tsx live
<Strong>Important text</Strong>
```

### Colored Strong

Apply text color for additional emphasis.

```tsx live
<Strong textColor="primary">Primary strong text</Strong>
```

### Danger Strong

Use danger color for warnings or critical information.

```tsx live
<Strong textColor="danger">Important warning!</Strong>
```

### Strong with Background

Add background color and padding for a highlight effect.

```tsx live
<Strong bgColor="warning" p="1">
  Highlighted strong text
</Strong>
```

### Inline with Text

Strong text works naturally inline within paragraphs.

```tsx live
<Paragraph>
  This is a paragraph with <Strong>strong text</Strong> in the middle. The
  strong text indicates <Strong textColor="primary">important</Strong> content.
</Paragraph>
```

### All Colors

Display strong text in all Bulma theme colors.

```tsx live
<Block display="flex" flexDirection="column" gap="2">
  <Strong textColor="primary">Primary strong</Strong>
  <Strong textColor="link">Link strong</Strong>
  <Strong textColor="info">Info strong</Strong>
  <Strong textColor="success">Success strong</Strong>
  <Strong textColor="warning">Warning strong</Strong>
  <Strong textColor="danger">Danger strong</Strong>
</Block>
```

### Callout Pattern

A common pattern for callouts with a strong lead word.

```tsx live
<Paragraph>
  <Strong>Note:</Strong> This is a pattern commonly used for callouts where the
  lead word is strong to draw attention.
</Paragraph>
```

---

## Accessibility

- **Semantic Importance:** Screen readers typically announce `<strong>` content with additional emphasis.
- **Appropriate Use:** Use `<strong>` for content that is truly important, not just for visual styling.
- **Color Contrast:** When adding color, ensure sufficient contrast for readability.

:::info
The `<strong>` element indicates strong importance. For visual-only bold styling, use CSS or the `Span` component with `textWeight="bold"`.
:::

---

## Related Components

- [`Emphasis`](./emphasis.md): For semantically emphasized italic text.
- [`Span`](./span.md): For styled inline text without semantic meaning.
- [`Paragraph`](./paragraph.md): For text paragraphs.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [MDN: strong element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strong)
- [Storybook: Strong Stories](https://bestax.io/storybook/?path=/story/elements-strong--default)

---

## Props

<!-- bestax:generated props -->

| Prop        | Type                                                                    | Default | Description                                       |
| ----------- | ----------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `className` | `string`                                                                | —       | Additional CSS classes to apply.                  |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper.                                |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                          |
| `children`  | `React.ReactNode`                                                       | —       | Content to be rendered inside the strong element. |
| `...`       | All standard HTML attributes and Bulma helper props                     | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

<!-- /bestax:generated props -->
