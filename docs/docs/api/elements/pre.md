---
title: Pre
sidebar_label: Pre
description: The `Pre` component renders a styled `<pre>` element with Bulma helper class integration.
---

# Pre

## Overview

<!-- bestax:generated overview -->

The `Pre` component renders a styled `<pre>` element with Bulma helper class integration.

<!-- /bestax:generated overview -->

Use it for multi-line code blocks, terminal output, ASCII art, or any content where whitespace formatting must be preserved.

:::info
Often used together with the `Code` component for semantically correct code blocks: `<Pre><Code>...</Code></Pre>`.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Pre, Code } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

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
<Pre bgColor="dark" textColor="white" p="4">{`pnpm add @allxsmith/bestax-bulma
pnpm build`}</Pre>
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
<Pre bgColor="dark" textColor="success" p="4">{`$ pnpm build
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
<Block display="flex" flexDirection="column">
  <Pre bgColor="light" p="3">
    <Code>{`// JavaScript
const add = (a, b) => a + b;`}</Code>
  </Pre>
  <Pre bgColor="light" p="3">
    <Code>{`// TypeScript
const add = (a: number, b: number): number => a + b;`}</Code>
  </Pre>
</Block>
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
- **Scrolling:** Bulma scrolls a long line sideways rather than wrapping it. While the content
  overflows, the block is a tab stop you can scroll with the arrow keys, Safari included, with
  Bulma's focus ring just inside it, and a region when it has a name. While it fits, it's a plain
  `<pre>` with no tab stop. Name it with `aria-label` or `aria-labelledby` so a screen reader says
  what took focus.
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

---

## Props

<!-- bestax:generated props -->

| Prop              | Type                                                                    | Default | Description                                                                                                                                           |
| ----------------- | ----------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className`       | `string`                                                                | —       | Additional CSS classes to apply.                                                                                                                      |
| `textColor`       | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper.                                                                                                                                    |
| `bgColor`         | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                                                                                                                              |
| `children`        | `React.ReactNode`                                                       | —       | Preformatted content to render.                                                                                                                       |
| `aria-label`      | `string`                                                                | —       | Names the block, such as "Install command". While it overflows, a named block is a region, and this is what a screen reader says when it takes focus. |
| `aria-labelledby` | `string`                                                                | —       | The id of a visible heading or caption that names the block, in place of `aria-label`.                                                                |
| `tabIndex`        | `number`                                                                | —       | Replaces the tab stop `Pre` gives itself while it overflows: `-1` keeps it out of the Tab order.                                                      |
| `...`             | All standard `<pre>` attributes and Bulma helper props                  | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                     |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

Bulma declares these variables globally rather than on `Pre`'s own element, so the defaults come from the theme. Override them anywhere above the component — on the element itself (via `className`/`style`) for a one-off, or on `:root` to retheme every instance. See [Theme](../helpers/theme.md).

| CSS Variable                 | Sass Variable         | Default          |
| ---------------------------- | --------------------- | ---------------- |
| `--bulma-pre-font-size`      | `$pre-font-size`      | `0.875em`        |
| `--bulma-pre-padding`        | `$pre-padding`        | `1.25rem 1.5rem` |
| `--bulma-pre-code-font-size` | `$pre-code-font-size` | `1em`            |

<!-- /bestax:generated cssvars -->
