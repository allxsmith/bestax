---
title: Layout Components Overview
sidebar_label: Layout
sidebar_position: 7
---

# Layout Components

This page summarizes all Bulma-styled layout components in Bestax, with a brief description, usage example, and links to full documentation for each. Use these components to structure your app with responsive, flexible, and visually consistent layouts.

---

## Container

A responsive layout wrapper for centering and constraining content. Supports fixed/fluid layouts, breakpoints, and color helpers.

```tsx live
<Container>
  <Notification color="primary">Content goes here.</Notification>
</Container>
```

[View full documentation.](../../api/layout/container)

---

## Hero

A visually striking section for headers, banners, or landing areas. Supports color, size, fullheight, and composition with `Hero.Head`, `Hero.Body`, and `Hero.Foot`.

```tsx live
<Hero color="link">
  <Hero.Body>
    <Container>
      <Title>Hero title</Title>
      <SubTitle>Hero subtitle</SubTitle>
    </Container>
  </Hero.Body>
</Hero>
```

[View full documentation.](../../api/layout/hero)

---

## Footer

A semantic, accessible site footer for copyright, links, or extra info. Supports color, background, and custom content.

```tsx live
<Footer bgColor="dark">
  <Content textAlign="centered">
    <p>Copyright © 2025 Bestax-Bulma</p>
  </Content>
</Footer>
```

[View full documentation.](../../api/layout/footer)

---

## Level

A flexible horizontal layout for aligning items left, right, or center. Use for toolbars, status bars, or summary sections. Includes `Level.Left`, `Level.Right`, and `Level.Item` subcomponents.

```tsx live
<Level>
  <Level.Left>
    <Level.Item>
      <SubTitle as="p" size="5">
        <strong>Stats</strong>
      </SubTitle>
    </Level.Item>
  </Level.Left>
  <Level.Right>
    <Level.Item>Right content</Level.Item>
  </Level.Right>
</Level>
```

[View full documentation.](../../api/layout/level)

---

## Section

Provides vertical spacing and visual separation for large blocks of content. Supports size, color, and background helpers.

```tsx live
<Section>
  <Title>Section</Title>
  <SubTitle>Divide your content into sections.</SubTitle>
</Section>
```

[View full documentation.](../../api/layout/section)

---

## Media

Implements Bulma’s media object layout for aligning images/icons with content and actions. Includes `Media.Left`, `Media.Content`, and `Media.Right` subcomponents.

```tsx live
<Media>
  <Media.Left>
    <Image src="/img/logo.svg" size="64x64" />
  </Media.Left>
  <Media.Content>
    <p>
      <strong>Bestax Bulma</strong> <small>@allxsmith/bestax</small>{' '}
      <small>TS</small>
      <br />
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ultricies
      nisi neque, eu accumsan dui tempus id. Nunc fringilla, est at tincidunt
      iaculis, diam dui aliquet magna, in imperdiet leo lorem eget augue.
      Pellentesque vel nisl non sem condimentum elementum non sed nibh. Donec
      venenatis a diam a tempor.
    </p>
  </Media.Content>
  <Media.Right>
    <Delete />
  </Media.Right>
</Media>
```

[View full documentation.](../../api/layout/media)

---

## Splitter

Panes side by side or one above the other, like columns the reader resizes: a handle goes between each pair, to drag or move by keyboard, each named by its pane's label.

```tsx live
<Splitter height={160} className="box p-0">
  <Splitter.Pane label="Files" defaultSize={30} minSize="8rem">
    <Content p="4">
      <p>Files</p>
    </Content>
  </Splitter.Pane>
  <Splitter.Pane label="Editor">
    <Content p="4">
      <p>Editor</p>
    </Content>
  </Splitter.Pane>
</Splitter>
```

[View full documentation.](../../api/layout/splitter)

---

## Stack

A column with Bulma's block spacing between its children and the margins Bulma gives them zeroed, so the gap is the only space and there are no margins to undo.

```tsx live
<Stack>
  <Notification color="info">Your changes are saved.</Notification>
  <Box>A Box, with no margin to undo.</Box>
</Stack>
```

[View full documentation.](../../api/layout/stack)

---

## Group

A row that wraps, its children centered on each other, with half of Bulma's block spacing between them. `isFullwidth` shares the row equally, and `breakpoint` stacks it on a phone.

```tsx live
<Group justifyContent="space-between">
  <Title as="h2" size="4">
    Invoices
  </Title>
  <Group gap="1">
    <Button>Export</Button>
    <Button color="primary">New invoice</Button>
  </Group>
</Group>
```

[View full documentation.](../../api/layout/group)

---

## Center

Centers its content on both axes, such as a loader in the middle of a panel.

```tsx live
<Center aspectRatio="3by1" bgColor="light">
  <Loader textSize="3" ariaLabel="Loading" />
</Center>
```

[View full documentation.](../../api/layout/center)

---

## Flex

A flex container with CSS's own defaults, taking the flex container's properties as props, for a layout of your own such as a fixed side beside a growing one.

```tsx live
<Flex gap="4" alignItems="flex-start">
  <Box flexShrink="0">Side</Box>
  <Box flexGrow="1">Main, which grows into the rest of the row</Box>
</Flex>
```

[View full documentation.](../../api/layout/flex)

---

For more details and advanced usage, see the full documentation for each component linked above.
