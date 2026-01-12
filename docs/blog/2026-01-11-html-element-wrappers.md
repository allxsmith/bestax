---
slug: html-element-wrappers
title: New HTML Element Wrappers
authors: [asmith]
tags: [bulma, elements, html, semantic]
---

We've added 12 new HTML element wrapper components that bring Bulma's helper props to everyday HTML elements like links, paragraphs, lists, and code blocks.

<!-- truncate -->

## Why?

Previously, styling basic HTML elements required manual class management. Now you get full Bulma helper prop support on semantic HTML elements:

```jsx
// Before: manual classes
<a href="#" className="has-text-primary">Link</a>

// After: props-based styling
<Link href="#" textColor="primary">Link</Link>
```

:::tip Key Benefit
No more string manipulation for classes. Use type-safe props that your IDE can autocomplete.
:::

## The Components

| Category | Components | HTML Elements |
|----------|------------|---------------|
| **Text** | `Link`, `Span`, `Paragraph`, `Strong`, `Emphasis` | `<a>`, `<span>`, `<p>`, `<strong>`, `<em>` |
| **Lists** | `UnorderedList`, `OrderedList`, `ListItem` | `<ul>`, `<ol>`, `<li>` |
| **Code** | `Code`, `Pre` | `<code>`, `<pre>` |
| **Media** | `Figure`, `Figure.Caption` | `<figure>`, `<figcaption>` |
| **Layout** | `Divider` | `<hr>` |

## Examples

### Styled Text

```tsx live
<Paragraph textColor="info" textAlign="centered">
  Centered info text
</Paragraph>
```

### Colored Lists

```tsx live
<Content>
  <UnorderedList>
    <ListItem textColor="success">Green item</ListItem>
    <ListItem textColor="danger">Red item</ListItem>
  </UnorderedList>
</Content>
```

### Figures with Captions

```tsx live
<Figure textAlign="centered">
  <Image src="/img/bestax-solar-system-3d.png" alt="Bestax Solar System" size="16by9" />
  <Figure.Caption textColor="grey" textSize="7">
    Bestax Solar System
  </Figure.Caption>
</Figure>
```

### Code Blocks

```tsx live
<Pre bgColor="dark" textColor="white" p="4">
  {`const hello = "world";`}
</Pre>
```

:::info All Bulma Helpers Supported
Every component supports the full range of Bulma helper props: `textColor`, `bgColor`, `m`, `p`, `textAlign`, `textSize`, and more.
:::

## Get Started

```bash
import { Link, Paragraph, Code, Figure } from '@allxsmith/bestax-bulma';
```

Check out the [Extra Elements guide](/docs/guides/library/elements/extras) for full documentation.
