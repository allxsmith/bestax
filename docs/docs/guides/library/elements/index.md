---
title: Elements
sidebar_label: Elements
sidebar_position: 1
---

# Elements

The **Elements** section provides foundational UI building blocks for your Bulma React applications. These components are designed to be simple, composable, and highly customizable, covering everything from typography and layout containers to interactive controls and feedback elements. Each element supports Bulma's utility props for color, spacing, and accessibility, making it easy to create beautiful, consistent interfaces.

:::info
Elements are the core primitives of the Bestax Bulma library. They are intended to be used directly or as building blocks for more complex components.
:::

---

## Layout

### Block

A simple container with vertical margin for grouping or spacing content sections. [View full documentation.](../../../api/elements/block.md)

```tsx live
<Block>Default Block</Block>
```

---

### Box

A bordered, padded container with optional shadow, ideal for grouping or highlighting content. [View full documentation.](../../../api/elements/box.md)

```tsx live
<Box>Default Box</Box>
```

---

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

## Typography

### Title

A Bulma-styled title (heading), supporting sizes, spacing, and rendering as any heading or paragraph element. [View full documentation.](../../../api/elements/title.md)

```tsx live
<Title>Default Title</Title>
```

---

### SubTitle

A Bulma-styled subtitle (secondary heading), supporting sizes and rendering as any heading or paragraph element. [View full documentation.](../../../api/elements/subtitle.md)

```tsx live
<SubTitle>Default SubTitle</SubTitle>
```

---

### Content

Applies Bulma's typographic styles to children, perfect for rendering rich or markdown-like HTML content. [View full documentation.](../../../api/elements/content.md)

```tsx live
<Content>
  <p>This is a paragraph inside Content.</p>
</Content>
```

---

## Text

### Paragraph

A paragraph (`<p>`) wrapper with typography and spacing helpers. [View full documentation.](../../../api/elements/paragraph.md)

```tsx live
<Paragraph textColor="info" textAlign="centered">
  A centered, info-colored paragraph.
</Paragraph>
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

### Link

A styled anchor (`<a>`) wrapper for navigation links with Bulma helper support. [View full documentation.](../../../api/elements/link.md)

```tsx live
<Link href="#" textColor="primary">
  Primary Link
</Link>
```

---

## Buttons

### Button

A flexible, highly customizable button supporting all Bulma color, size, and state modifiers. [View full documentation.](../../../api/elements/button.md)

```tsx live
<Button>Default Button</Button>
```

---

### Buttons

A group container for multiple `Button` elements, supporting spacing, alignment, and add-ons. [View full documentation.](../../../api/elements/buttons.md)

```tsx live
<Buttons>
  <Button color="primary">Save</Button>
  <Button color="info">Edit</Button>
  <Button color="danger">Delete</Button>
</Buttons>
```

---

### LinkButton

A `<button>` that visually looks like text or a link. Supports `text` and `ghost` variants with optional color overrides. [View full documentation.](../../../api/elements/linkbutton.md)

:::warning Accessibility
Using `<div onClick>` or `<a onClick>` without an `href` are common anti-patterns flagged by [`eslint-plugin-jsx-a11y`](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y):

- **`no-static-element-interactions`** — catches clickable `<div>`s and other non-interactive elements
- **`anchor-is-valid`** — catches `<a>` tags with `onClick` but no valid `href`

These elements are invisible or misleading to screen readers because they lack semantic role, keyboard focus, and key-event handling. `LinkButton` solves this by rendering a native `<button>` with full keyboard and screen-reader support — while still looking like plain text or a link.
:::

```tsx live
<Buttons>
  <LinkButton>Text Variant</LinkButton>
  <LinkButton variant="ghost">Ghost Variant</LinkButton>
  <LinkButton color="primary">Primary Text</LinkButton>
  <LinkButton variant="ghost" color="danger">Danger Ghost</LinkButton>
</Buttons>
```

---

## Media

### Icon

A wrapper for displaying icons from various libraries, handling Bulma sizing, color, and accessibility. [View full documentation.](../../../api/elements/icon.md)

```tsx live
<Icon name="star" ariaLabel="Star icon" />
```

---

### IconText

A horizontal arrangement of one or more icons and optional text, ideal for icon-and-label patterns. [View full documentation.](../../../api/elements/icontext.md)

```tsx live
<IconText iconProps={{ name: 'fas fa-star', ariaLabel: 'Star icon' }}>
  Star
</IconText>
```

---

### Image

A Bulma-styled container for images, iframes, or custom content, supporting sizes, aspect ratios, and more. [View full documentation.](../../../api/elements/image.md)

```tsx live
<Image
  src="/img/react-logo.png"
  alt="Sample image"
  size="128x128"
/>
```

---

### Figure

A figure (`<figure>`) wrapper for grouping content with an optional caption. [View full documentation.](../../../api/elements/figure.md)

```tsx live
<Figure bgColor="light" textColor="dark" p="4">
  <Image src="/img/logo.png" alt="Example" size="128x128" />
  <Figure.Caption mt="2">Figure caption</Figure.Caption>
</Figure>
```

---

## Lists

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

## Data

### Table

A highly composable, Bulma-styled table system with full support for Bulma's table features. [View full documentation.](../../../api/elements/table.md)

```tsx live
<Table>
  <Thead>
    <Tr>
      <Th>Name</Th>
      <Th>Value</Th>
    </Tr>
  </Thead>
  <Tbody>
    <Tr>
      <Td>Example</Td>
      <Td>42</Td>
    </Tr>
  </Tbody>
</Table>
```

---

### Tag

A Bulma-styled label or badge, supporting color, size, rounded, hoverable, and delete variants. [View full documentation.](../../../api/elements/tag.md)

```tsx live
<Tag>Default Tag</Tag>
```

---

### Tags

A container for grouping multiple `Tag` components, supporting add-ons and multiline layouts. [View full documentation.](../../../api/elements/tags.md)

```tsx live
<Tags>
  <Tag color="primary">Primary</Tag>
  <Tag color="info">Info</Tag>
  <Tag color="success">Success</Tag>
</Tags>
```

---

## Feedback

### Notification

A Bulma-styled alert/message area for feedback, warnings, or information, with color and close button support. [View full documentation.](../../../api/elements/notification.md)

```tsx live
<Notification>This is a default notification.</Notification>
```

---

### Progress

A Bulma-styled progress bar for visualizing task completion, loading states, or feedback. [View full documentation.](../../../api/elements/progress.md)

```tsx live
<Progress value={50} max={100} />
```

---

### Skeleton

A skeleton loader for indicating loading content, with block or lines variants. [View full documentation.](../../../api/elements/skeleton.md)

```tsx live
<Skeleton />
```

---

## Utility

### Delete

A Bulma-styled close/delete button for dismissing modals, notifications, tags, and more. [View full documentation.](../../../api/elements/delete.md)

```tsx live
<Delete />
```

---

:::tip
For advanced customization, all elements support Bulma helper props for color, spacing, and accessibility. See the full documentation for each component for more details and advanced usage.
:::

:::caution
Elements are low-level building blocks. For more complex UI patterns, consider using the higher-level components and layout primitives provided elsewhere in the library.
:::
