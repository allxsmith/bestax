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

[View full documentation.](../api/layout/container)

---

## Hero

A visually striking section for headers, banners, or landing areas. Supports color, size, fullheight, and composition with `Hero.Head`, `Hero.Body`, and `Hero.Foot`.

```tsx live
<Hero>
  <Hero.Body>
    <Container>
      <Title>Hero title</Title>
      <SubTitle>Hero subtitle</SubTitle>
    </Container>
  </Hero.Body>
</Hero>
```

[View full documentation.](../api/layout/hero)

---

## Footer

A semantic, accessible site footer for copyright, links, or extra info. Supports color, background, and custom content.

```tsx live
<Footer>
  <Content textAlign="centered">
    <p>Copyright © 2025</p>
  </Content>
</Footer>
```

[View full documentation.](../api/layout/footer)

---

## Level

A flexible horizontal layout for aligning items left, right, or center. Use for toolbars, status bars, or summary sections. Includes `Level.Left`, `Level.Right`, and `Level.Item` subcomponents.

```tsx live
<Level>
  <Level.Left>
    <Level.Item>
      <Title as="p" size="5" className="subtitle">
        <strong>Stats</strong>
      </Title>
    </Level.Item>
  </Level.Left>
  <Level.Right>
    <Level.Item>Right content</Level.Item>
  </Level.Right>
</Level>
```

[View full documentation.](../api/layout/level)

---

## Section

Provides vertical spacing and visual separation for large blocks of content. Supports size, color, and background helpers.

```tsx live
<Section>
  <Title>Section</Title>
  <SubTitle>Divide your content into sections.</SubTitle>
</Section>
```

[View full documentation.](../api/layout/section)

---

## Media

Implements Bulma’s media object layout for aligning images/icons with content and actions. Includes `Media.Left`, `Media.Content`, and `Media.Right` subcomponents.

```tsx live
<Media>
  <Media.Left>
    <img src="avatar.png" alt="avatar" />
  </Media.Left>
  <Media.Content>
    <p>Main content</p>
  </Media.Content>
  <Media.Right>
    <button>Reply</button>
  </Media.Right>
</Media>
```

[View full documentation.](../api/layout/media)

---

For more details and advanced usage, see the full documentation for each component linked above.
