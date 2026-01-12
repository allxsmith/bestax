---
title: Pre
sidebar_label: Pre
---

# Pre

## Overview

The `Pre` component renders a styled `<pre>` element with Bulma helper class integration. Use it for multi-line code blocks, terminal output, ASCII art, or any content where whitespace formatting must be preserved.

:::info
Often used together with the `Code` component for semantically correct code blocks: `<Pre><Code>...</Code></Pre>`.
:::

---

## Import

```tsx
import { Pre, Code } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                                                                                                                                                                                                                                                                     | Default | Description                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------ |
| `className` | `string`                                                                                                                                                                                                                                                                                 | —       | Additional CSS classes.                          |
| `textColor` | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Text color helper.                               |
| `bgColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Background color helper.                         |
| `children`  | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | Preformatted content to render.                  |
| ...         | All standard `<pre>` and Bulma helper props                                                                                                                                                                                                                                              |         | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Default Pre

The default usage preserves whitespace and line breaks.

```tsx live
<Pre>{`function hello() {
  console.log("Hello, World!");
}`}</Pre>
```

### With Code Element

Combine with `Code` for semantically correct code blocks.

```tsx live
<Pre>
  <Code>{`const greeting = "Hello";
const name = "World";
console.log(\`\${greeting}, \${name}!\`);`}</Code>
</Pre>
```

### Dark Background

Create a terminal-like appearance with dark background and light text.

```tsx live
<Pre
  bgColor="dark"
  textColor="white"
  p="4"
>{`npm install @allxsmith/bestax-bulma
npm run build`}</Pre>
```

### Light Background

Use a light background for a subtle code block.

```tsx live
<Pre bgColor="light" p="4">{`{
  "name": "my-app",
  "version": "1.0.0"
}`}</Pre>
```

### Terminal Output

Style terminal output with appropriate colors.

```tsx live
<Pre bgColor="dark" textColor="success" p="4">{`$ npm run build
> @allxsmith/bestax-bulma@2.0.0 build
> tsc && vite build

vite v6.0.0 building for production...
✓ 123 modules transformed.
dist/index.js  45.23 kB
✓ built in 2.34s`}</Pre>
```

### Multiple Code Blocks

Display different code examples side by side.

```tsx live
<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <Pre bgColor="light" p="3">
    <Code>{`// JavaScript
const add = (a, b) => a + b;`}</Code>
  </Pre>
  <Pre bgColor="light" p="3">
    <Code>{`// TypeScript
const add = (a: number, b: number): number => a + b;`}</Code>
  </Pre>
</div>
```

### Primary Accent

Use color for comments or special sections.

```tsx live
<Pre textColor="primary" p="3">{`// Important configuration
const config = {
  debug: true,
  verbose: true
};`}</Pre>
```

---

## Accessibility

- **Whitespace Preservation:** The `<pre>` element preserves all whitespace, which is important for code formatting.
- **Scrolling:** Consider horizontal scrolling for long lines to prevent layout issues.
- **Screen Readers:** Preformatted text is typically announced as such by screen readers.

:::info
For code blocks, wrap content in both `<Pre>` and `<Code>` for proper semantics: `<Pre><Code>...</Code></Pre>`.
:::

---

## Related Components

- [`Code`](./code.md): For inline code snippets (often used inside Pre).
- [`Figure`](./figure.md): For code figures with captions.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [MDN: pre element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/pre)
- [Storybook: Pre Stories](https://bestax.io/storybook/?path=/story/elements-pre--default)
