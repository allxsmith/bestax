---
title: Extra Elements
sidebar_label: Extras
sidebar_position: 2
---

# Extra Elements

The **Extra Elements** section provides additional HTML element wrappers for common semantic elements. These components extend the core [Elements](./index.md) with thin wrappers around standard HTML elements, providing consistent Bulma helper class support.

:::info
Extra Elements are lightweight wrappers that give you the full power of Bulma's helper props system on standard HTML elements.
:::

---

## Text Elements

### Link

A styled anchor (`<a>`) wrapper for navigation links with Bulma helper support. [View full documentation.](../../../api/elements/link.md)

```tsx live
<Link href="#" textColor="primary">
  Primary Link
</Link>
```

---

### Span

An inline (`<span>`) wrapper for styling text without semantic meaning. [View full documentation.](../../../api/elements/span.md)

```tsx live
<Paragraph>
  This text has a <Span textColor="primary">colored span</Span> inside it.
</Paragraph>
```

---

### Paragraph

A paragraph (`<p>`) wrapper with typography and spacing helpers. [View full documentation.](../../../api/elements/paragraph.md)

```tsx live
<Paragraph textColor="info" textAlign="centered">
  A centered, info-colored paragraph.
</Paragraph>
```

---

## Layout Elements

### Divider

A horizontal rule (`<hr>`) for visually separating content sections. [View full documentation.](../../../api/elements/divider.md)

```tsx live
<div>
  <Block>Content above</Block>
  <Divider my="4" />
  <Block>Content below</Block>
</div>
```

---

## List Elements

### UnorderedList

An unordered list (`<ul>`) wrapper with Bulma helper support. [View full documentation.](../../../api/elements/unorderedlist.md)

```tsx live
<Content>
  <UnorderedList>
    <ListItem>First item</ListItem>
    <ListItem>Second item</ListItem>
    <ListItem>Third item</ListItem>
  </UnorderedList>
</Content>
```

---

### OrderedList

An ordered list (`<ol>`) wrapper supporting numbering types and Bulma helpers. [View full documentation.](../../../api/elements/orderedlist.md)

```tsx live
<Content>
  <OrderedList type="A">
    <ListItem>First item</ListItem>
    <ListItem>Second item</ListItem>
    <ListItem>Third item</ListItem>
  </OrderedList>
</Content>
```

---

### ListItem

A list item (`<li>`) wrapper for use inside UnorderedList or OrderedList. [View full documentation.](../../../api/elements/listitem.md)

```tsx live
<Content>
  <UnorderedList>
    <ListItem textColor="primary">Primary item</ListItem>
    <ListItem textColor="success">Success item</ListItem>
    <ListItem textColor="danger">Danger item</ListItem>
  </UnorderedList>
</Content>
```

---

## Figure Elements

### Figure

A figure (`<figure>`) wrapper for grouping content with an optional caption. [View full documentation.](../../../api/elements/figure.md)

```tsx live
<Figure bgColor="light" textColor="dark" p="4">
  <Image src="/img/logo.png" alt="Example" size="128x128" />
  <Figure.Caption mt="2">Figure caption</Figure.Caption>
</Figure>
```

---

## Semantic Text Elements

### Strong

A strong (`<strong>`) wrapper for semantically important bold text. [View full documentation.](../../../api/elements/strong.md)

```tsx live
<Paragraph>
  This text has <Strong>important information</Strong> highlighted.
</Paragraph>
```

---

### Emphasis

An emphasis (`<em>`) wrapper for semantically emphasized italic text. [View full documentation.](../../../api/elements/emphasis.md)

```tsx live
<Paragraph>
  You should <Emphasis>really</Emphasis> pay attention to this.
</Paragraph>
```

---

## Code Elements

### Code

An inline code (`<code>`) wrapper for short code snippets. [View full documentation.](../../../api/elements/code.md)

```tsx live
<Paragraph>
  Run <Code>npm install</Code> to install dependencies.
</Paragraph>
```

---

### Pre

A preformatted text (`<pre>`) wrapper for code blocks. [View full documentation.](../../../api/elements/pre.md)

```tsx live
<Pre bgColor="dark" textColor="white" p="4">
  {`function hello() {
  console.log("Hello!");
}`}
</Pre>
```

---

:::tip
All Extra Elements support the full range of Bulma helper props including colors, spacing, typography, and more. See [Helper Props](../../../api/helpers/usebulmaclasses.md) for details.
:::

:::note
For the core element components like Button, Box, and Title, see the [Elements](./index.md) guide.
:::
