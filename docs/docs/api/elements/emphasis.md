---
title: Emphasis
sidebar_label: Emphasis
description: The `Emphasis` component renders a styled `<em>` element with Bulma helper class integration.
---

# Emphasis

## Overview

<!-- bestax:generated overview -->

The `Emphasis` component renders a styled `<em>` element with Bulma helper class integration.

<!-- /bestax:generated overview -->

Use it for text that has stress emphasis, which subtly changes the meaning of a sentence. The `<em>` element carries semantic meaning for screen readers.

:::info
For visual-only italic styling without semantic meaning, use CSS `font-style: italic` instead.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Emphasis } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Default Emphasis

The default usage renders emphasized (italic) text with semantic meaning.

```tsx live
<Emphasis>Emphasized text</Emphasis>
```

### Colored Emphasis

Apply text color for additional visual distinction.

```tsx live
<Emphasis textColor="primary">Primary emphasized text</Emphasis>
```

### Info Emphasis

Use info color for notes or supplementary information.

```tsx live
<Emphasis textColor="info">Note this important detail</Emphasis>
```

### Emphasis with Background

Add background color and padding for a highlight effect.

```tsx live
<Emphasis bgColor="light" textColor="dark" p="1">
  Highlighted emphasis
</Emphasis>
```

### Inline with Text

Emphasis works naturally inline within paragraphs.

```tsx live
<Paragraph>
  This is a paragraph with <Emphasis>emphasized text</Emphasis> in the middle.
  You should <Emphasis textColor="info">really</Emphasis> pay attention to this.
</Paragraph>
```

### All Colors

Display emphasized text in all Bulma theme colors.

```tsx live
<Block display="flex" flexDirection="column" gap="2">
  <Emphasis textColor="primary">Primary emphasis</Emphasis>
  <Emphasis textColor="link">Link emphasis</Emphasis>
  <Emphasis textColor="info">Info emphasis</Emphasis>
  <Emphasis textColor="success">Success emphasis</Emphasis>
  <Emphasis textColor="warning">Warning emphasis</Emphasis>
  <Emphasis textColor="danger">Danger emphasis</Emphasis>
</Block>
```

### Quotation Style

Use emphasis for quoted phrases or sayings.

```tsx live
<Paragraph>
  As the saying goes, <Emphasis>actions speak louder than words</Emphasis>.
</Paragraph>
```

### Technical Terms

Use emphasis when introducing technical terms.

```tsx live
<Paragraph>
  The <Emphasis>idempotent</Emphasis> operation can be applied multiple times
  without changing the result beyond the initial application.
</Paragraph>
```

---

## Accessibility

- **Stress Emphasis:** Screen readers may announce `<em>` content with a change in tone or stress.
- **Appropriate Use:** Use `<em>` for content that requires stress emphasis, not just for visual styling.
- **Nested Emphasis:** Multiple levels of `<em>` indicate greater degrees of emphasis.

:::info
The `<em>` element indicates stress emphasis that subtly changes the meaning of a sentence. Compare "I _love_ coding" vs "I love _coding_".
:::

---

## Related Components

- [`Strong`](./strong.md): For semantically important bold text.
- [`Span`](./span.md): For styled inline text without semantic meaning.
- [`Paragraph`](./paragraph.md): For text paragraphs.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [MDN: em element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/em)
- [Storybook: Emphasis Stories](https://bestax.io/storybook/?path=/story/elements-emphasis--default)

---

## Props

<!-- bestax:generated props -->

| Prop        | Type                                                                    | Default | Description                                       |
| ----------- | ----------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `className` | `string`                                                                | —       | Additional CSS classes to apply.                  |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper.                                |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                          |
| `children`  | `React.ReactNode`                                                       | —       | Content to render inside the em element.          |
| `...`       | All standard HTML attributes and Bulma helper props                     | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

<!-- /bestax:generated props -->
