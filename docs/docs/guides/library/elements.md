---
title: Elements
sidebar_label: Elements
sidebar_position: 2
---

# Elements

The **Elements** section provides foundational UI building blocks for your Bulma React applications. These components are designed to be simple, composable, and highly customizable, covering everything from typography and layout containers to interactive controls and feedback elements. Each element supports Bulma's utility props for color, spacing, and accessibility, making it easy to create beautiful, consistent interfaces.

:::info
Elements are the core primitives of the Bestax Bulma library. They are intended to be used directly or as building blocks for more complex components.
:::

---

## Element Components

Below is a summary of each element component, including a brief description, a usage example, and a link to the full documentation for more details.

---

### Block

A simple container with vertical margin for grouping or spacing content sections. [View full documentation.](../../api/elements/block.md)

```tsx live
<Block>Default Block</Block>
```

---

### Box

A bordered, padded container with optional shadow, ideal for grouping or highlighting content. [View full documentation.](../../api/elements/box.md)

```tsx live
<Box>Default Box</Box>
```

---

### Button

A flexible, highly customizable button supporting all Bulma color, size, and state modifiers. [View full documentation.](../../api/elements/button.md)

```tsx live
<Button>Default Button</Button>
```

---

### Buttons

A group container for multiple `Button` elements, supporting spacing, alignment, and add-ons. [View full documentation.](../../api/elements/buttons.md)

```tsx live
<Buttons>
  <Button color="primary">Save</Button>
  <Button color="info">Edit</Button>
  <Button color="danger">Delete</Button>
</Buttons>
```

---

### Content

Applies Bulma's typographic styles to children, perfect for rendering rich or markdown-like HTML content. [View full documentation.](../../api/elements/content.md)

```tsx live
<Content>
  <p>This is a paragraph inside Content.</p>
</Content>
```

---

### Delete

A Bulma-styled close/delete button for dismissing modals, notifications, tags, and more. [View full documentation.](../../api/elements/delete.md)

```tsx live
<Delete />
```

---

### Icon

A wrapper for displaying icons from various libraries, handling Bulma sizing, color, and accessibility. [View full documentation.](../../api/elements/icon.md)

```tsx live
<Icon name="star" ariaLabel="Star icon" />
```

---

### IconText

A horizontal arrangement of one or more icons and optional text, ideal for icon-and-label patterns. [View full documentation.](../../api/elements/icontext.md)

```tsx live
<IconText iconProps={{ name: 'fas fa-star', ariaLabel: 'Star icon' }}>
  Star
</IconText>
```

---

### Image

A Bulma-styled container for images, iframes, or custom content, supporting sizes, aspect ratios, and more. [View full documentation.](../../api/elements/image.md)

```tsx live
<Image
  src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1150px-React-icon.svg.png"
  alt="Sample image"
  size="128x128"
/>
```

---

### Notification

A Bulma-styled alert/message area for feedback, warnings, or information, with color and close button support. [View full documentation.](../../api/elements/notification.md)

```tsx live
<Notification>This is a default notification.</Notification>
```

---

### Progress

A Bulma-styled progress bar for visualizing task completion, loading states, or feedback. [View full documentation.](../../api/elements/progress.md)

```tsx live
<Progress value={50} max={100} />
```

---

### Skeleton

A skeleton loader for indicating loading content, with block or lines variants. [View full documentation.](../../api/elements/skeleton.md)

```tsx live
<Skeleton />
```

---

### Table

A highly composable, Bulma-styled table system with full support for Bulma's table features. [View full documentation.](../../api/elements/table.md)

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

A Bulma-styled label or badge, supporting color, size, rounded, hoverable, and delete variants. [View full documentation.](../../api/elements/tag.md)

```tsx live
<Tag>Default Tag</Tag>
```

---

### Tags

A container for grouping multiple `Tag` components, supporting add-ons and multiline layouts. [View full documentation.](../../api/elements/tags.md)

```tsx live
<Tags>
  <Tag color="primary">Primary</Tag>
  <Tag color="info">Info</Tag>
  <Tag color="success">Success</Tag>
</Tags>
```

---

### Title

A Bulma-styled title (heading), supporting sizes, spacing, and rendering as any heading or paragraph element. [View full documentation.](../../api/elements/title.md)

```tsx live
<Title>Default Title</Title>
```

---

### SubTitle

A Bulma-styled subtitle (secondary heading), supporting sizes and rendering as any heading or paragraph element. [View full documentation.](../../api/elements/subtitle.md)

```tsx live
<SubTitle>Default SubTitle</SubTitle>
```

---

:::tip
For advanced customization, all elements support Bulma helper props for color, spacing, and accessibility. See the full documentation for each component for more details and advanced usage.
:::

:::caution
Elements are low-level building blocks. For more complex UI patterns, consider using the higher-level components and layout primitives provided elsewhere in the library.
:::
