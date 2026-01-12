---
title: Code
sidebar_label: Code
---

# Code

## Overview

The `Code` component renders a styled `<code>` element with Bulma helper class integration. Use it for inline code snippets, variable names, function names, file paths, or any short technical content that should be displayed in a monospace font.

:::info
For multi-line code blocks, use the `Pre` component instead, optionally with a `Code` component inside it.
:::

---

## Import

```tsx
import { Code } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                                                                                                                                                                                                                                                                     | Default | Description                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------ |
| `className` | `string`                                                                                                                                                                                                                                                                                 | —       | Additional CSS classes.                          |
| `textColor` | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Text color helper.                               |
| `bgColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Background color helper.                         |
| `children`  | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | Code content to render inside the element.       |
| ...         | All standard `<code>` and Bulma helper props                                                                                                                                                                                                                                             |         | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Default Code

The default usage renders inline code in a monospace font.

```tsx live
<Code>console.log("Hello, World!")</Code>
```

### Variable Name

Reference variable names inline within text.

```tsx live
<Paragraph>
  The <Code>userName</Code> variable stores the current user's name.
</Paragraph>
```

### Function Call

Reference function or method calls.

```tsx live
<Paragraph>
  Use <Code>Array.map()</Code> to transform each element in the array.
</Paragraph>
```

### Command Line

Display command line instructions.

```tsx live
<Paragraph>
  Run <Code>npm install</Code> to install the dependencies.
</Paragraph>
```

### Colored Code

Apply text color for syntax highlighting or emphasis.

```tsx live
<Code textColor="primary">import React from "react"</Code>
```

### Code with Background

Add background color and padding for visibility.

```tsx live
<Code bgColor="light" p="1">
  const x = 42
</Code>
```

### All Colors

Display code in all Bulma theme colors.

```tsx live
<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
  <Code textColor="primary">primary code</Code>
  <Code textColor="link">link code</Code>
  <Code textColor="info">info code</Code>
  <Code textColor="success">success code</Code>
  <Code textColor="warning">warning code</Code>
  <Code textColor="danger">danger code</Code>
</div>
```

### File Path

Display file or directory paths.

```tsx live
<Paragraph>
  Edit the configuration file at <Code>src/config/settings.ts</Code> to change
  the default values.
</Paragraph>
```

### Keyboard Shortcuts

Display keyboard shortcuts.

```tsx live
<Paragraph>
  Press <Code>Ctrl + C</Code> to copy and <Code>Ctrl + V</Code> to paste.
</Paragraph>
```

---

## Accessibility

- **Code Semantics:** Screen readers may indicate code content differently, helping users understand it's technical content.
- **Monospace Font:** The `<code>` element typically renders in a monospace font, aiding readability of technical content.
- **Context:** Provide context around code snippets so users understand what the code represents.

:::info
Use `Code` for short inline snippets. For multi-line code blocks that need to preserve whitespace and formatting, use the `Pre` component.
:::

---

## Related Components

- [`Pre`](./pre.md): For multi-line preformatted code blocks.
- [`Figure`](./figure.md): For code figures with captions.
- [`Paragraph`](./paragraph.md): For text paragraphs containing code.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [MDN: code element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/code)
- [Storybook: Code Stories](https://bestax.io/storybook/?path=/story/elements-code--default)
