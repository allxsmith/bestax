---
title: 'Meet bestax-bulma: Modern React Components for Bulma CSS v1'
description: 'Discover bestax-bulma, a TypeScript-first React component library with 99% test coverage, built for Bulma CSS v1 with modern features like CSS Grid and HSL theming'
sidebar_label: 'Meet bestax-bulma'
tags: [react, bulma, typescript, components]
authors: [asmith]
# image: ./cover.png
hide_table_of_contents: false
# dev.to specific
publish_to_devto: false # Set to true when ready to publish
published: false # Always false for drafts
series: 'Introducing bestax-bulma'
canonical_url: https://bestax.io/blog/2025/09/24/meet-bestax-bulma
# cover_image: ./cover.png
---

Hey React developers! 👋 Are you looking for a modern, actively maintained component library for Bulma CSS? Let me introduce you to **bestax-bulma** (pronounced "bee-stacks"), a TypeScript-first React component library that brings the full power of Bulma v1 to your React applications.

**Opensource! Free as in beer🍺**

<!-- truncate -->

## Why Another Bulma React Library?

Great question! While there are other Bulma React libraries out there, many haven't been updated for Bulma v1 or are no longer actively maintained. bestax-bulma fills this gap with:

- 🎯 **Full Bulma v1 Support**: Built specifically for the latest Bulma version
- 📊 **99% Test Coverage**: Every component thoroughly tested with React Testing Library
- 🔷 **TypeScript-First**: Complete type safety with comprehensive TypeScript definitions
- 🚀 **Modern Build**: Tree-shakeable ESM and CJS builds for optimal bundle sizes
- 📚 **Rich Documentation**: Comprehensive [API docs](https://bestax.io/docs/api) and [getting started guides](https://bestax.io/docs/guides/getting-started) available at bestax.io
- ⚡ **Active Development**: Regular updates and responsive maintenance

<!-- ![Component showcase](./components-demo.png) -->

## Quick Start in 2 Minutes

Getting started is as simple as:

```bash
npm install @allxsmith/bestax-bulma bulma
```

Then import and use components:

```jsx live
import { Button, Card, Hero } from '@allxsmith/bestax-bulma';
import 'bulma/css/bulma.min.css';

function App() {
  return (
    <Hero color="primary">
      <Hero.Body>
        <Card>
          <Card.Header>
            <Card.Header.Title>Welcome to bestax-bulma!</Card.Header.Title>
          </Card.Header>
          <Card.Content>
            <p>Modern React components for Bulma CSS v1</p>
            <Button color="success">Get Started</Button>
          </Card.Content>
        </Card>
      </Hero.Body>
    </Hero>
  );
}
```

## Showcasing Bulma v1's New Features

### 🦴 Skeleton Loading States

Bulma v1 introduced the Skeleton component for beautiful loading states:

<!-- ![Skeleton loading demo](./skeleton-demo.gif) -->

```jsx live
import { Card } from '@allxsmith/bestax-bulma';
import { useState, useEffect } from 'react';

function LoadingCard() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsLoading(prev => !prev);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card skeleton={isLoading}>
      <Card.Content>
        <p>Your content here!</p>
      </Card.Content>
    </Card>
  );
}
```

### 🎨 CSS Grid Support

Take advantage of Bulma's new CSS Grid components for modern layouts:

<!-- ![Grid layout example](./grid-demo.png) -->

```jsx live
import { Grid, Cell, Card } from '@allxsmith/bestax-bulma';

function Dashboard() {
  return (
    <Grid>
      <Cell>
        <Card>Cell 1</Card>
      </Cell>
      <Cell>
        <Card>Cell 2</Card>
      </Cell>
      <Cell>
        <Card>Cell 3</Card>
      </Cell>
      <Cell>
        <Card>Cell 4</Card>
      </Cell>
      <Cell>
        <Card>Cell 5</Card>
      </Cell>
      <Cell>
        <Card>Cell 6</Card>
      </Cell>
      <Cell>
        <Card>Cell 7</Card>
      </Cell>
      <Cell>
        <Card>Cell 8</Card>
      </Cell>
      <Cell>
        <Card>Cell 9</Card>
      </Cell>
    </Grid>
  );
}
```

### 🌈 Dynamic HSL Theming

Bulma v1's HSL color system enables dynamic theming:

```jsx live
import { Theme, Button } from '@allxsmith/bestax-bulma';

function ThemedApp() {
  return (
    <Theme primaryH="280" primaryS="100%" primaryL="45%">
      <Button color="primary">Themed Button</Button>
    </Theme>
  );
}
```

## Why Developers Love bestax-bulma

### 1. Compound Components Pattern

We use the compound components pattern for intuitive, readable code:

```jsx live
import { Modal, Button } from '@allxsmith/bestax-bulma';
import { useState } from 'react';

function ModalExample() {
  const [showModal, setShowModal] = useState(false);
  const closeModal = () => setShowModal(false);

  return (
    <>
      <Button color="primary" onClick={() => setShowModal(true)}>
        Open Modal
      </Button>
      <Modal isActive={showModal}>
        <Modal.Background onClick={closeModal} />
        <Modal.Card>
          <Modal.Card.Head>
            <Modal.Card.Title>Intuitive API</Modal.Card.Title>
            <Modal.Close onClick={closeModal} />
          </Modal.Card.Head>
          <Modal.Card.Body>Components that make sense!</Modal.Card.Body>
          <Modal.Card.Foot>
            <Button color="primary" onClick={closeModal}>
              Close
            </Button>
          </Modal.Card.Foot>
        </Modal.Card>
      </Modal>
    </>
  );
}
```

### 2. TypeScript Autocomplete Heaven

Every prop is fully typed, giving you incredible IDE support:

```typescript
// Full autocomplete for colors, sizes, and more
<Button
  color="primary"  // 'primary' | 'link' | 'info' | 'success' | ...
  size="large"     // 'small' | 'normal' | 'medium' | 'large'
  isLoading
  isOutlined
/>
```

### 3. Zero Configuration

Unlike many CSS-in-JS solutions, bestax-bulma works with standard Bulma CSS. No build configuration, no CSS extraction, just import and go!

## Try It Live

Want to see bestax-bulma in action? Check out [bestax.io](https://bestax.io) for comprehensive examples and interactive documentation. Storybook is also available for browsing individual component variations.

## Comparison with Alternatives

| Feature             | bestax-bulma | react-bulma-components | rbx          | bulma-react |
| ------------------- | ------------ | ---------------------- | ------------ | ----------- |
| Bulma v1 Support    | ✅           | ❌                     | ❌           | ❌          |
| TypeScript          | ✅ Built-in  | ⚠️ Separate            | ✅           | ❌          |
| Test Coverage       | 99%          | ~70%                   | ~100%        | Unknown     |
| Active Maintenance  | ✅ 2025      | ⚠️ 2021                | ❌ 2019      | ❌ 2015     |
| Tree Shaking        | ✅           | ✅                     | ✅           | ❌          |
| Compound Components | ✅           | ❌                     | ✅           | ❌          |
| Comprehensive Docs  | ✅           | ❌                     | ⚠️ Partial   | ❌          |
| Real CSS Grids      | ✅           | ❌                     | ❌           | ❌          |
| Configurable        | ✅           | ❌                     | ❌           | ❌          |
| Theme Support       | ✅           | ❌                     | ❌           | ❌          |
| Quick Start CLI     | ✅           | ❌                     | ❌           | ❌          |

## Get Started Today

Ready to modernize your Bulma React experience?

1. **Install**: `npm install @allxsmith/bestax-bulma bulma`
2. **Explore**: Check our [documentation](https://bestax.io)
3. **Build**: Start creating beautiful UIs with modern React patterns
4. **Contribute**: Join us on [GitHub](https://github.com/allxsmith/bestax)

## What's Next?

This is just the beginning! In the next parts of this series, we'll dive deep into:

- Part 2: Building Beautiful UIs with Core Components
- Part 3: Forms, Data Display, and Advanced Patterns

:::tip

👤 Follow me [@allxsmith](https://github.com/allxsmith) for updates!

⭐ Feel free to star the [repository](https://github.com/allxsmith/bestax) if you find it helpful!

:::

---

**Have questions or feedback?** [Create an issue](https://github.com/allxsmith/bestax/issues) or [start a discussion](https://github.com/allxsmith/bestax/discussions) on GitHub for new ideas!
