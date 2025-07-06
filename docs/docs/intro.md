# Getting Started with bestax-bulma

Welcome to **bestax-bulma** – a modern, flexible React component library powered by the latest Bulma v1 and TypeScript.

---

## Installation

1. **Install the package:**

   ```bash
   npm install @allxsmith/bestax-bulma
   # or
   yarn add @allxsmith/bestax-bulma
   ```

2. **Include Bulma CSS in your project:**
   - **In your main JS/TS file:**
     ```js
     import 'bulma/css/bulma.min.css';
     ```
   - **Or via CDN in your HTML:**
     ```html
     <link
       rel="stylesheet"
       href="https://cdn.jsdelivr.net/npm/bulma@1.0.0/css/bulma.min.css"
     />
     ```

3. **(Optional) Add an icon library:**

   Many components support icons. We recommend:

   ```bash
   npm install @fortawesome/fontawesome-free
   # or
   npm install react-icons
   ```

---

## Component Overview

bestax-bulma is organized into several major directories. Here’s a high-level overview:

### 🟢 Elements

Basic Bulma elements made available as React components.

- **Box** – Container with optional color/shadow.
- **Tag** – Labels with colors and sizes.
- **Tags** – Group tags together.
- **Icon** – Standardized icon wrapper for Bulma/Font Awesome/react-icons.
- **Table** – `Td`, `Th`, `Tr` for styled tables.

### 🟦 Columns

Responsive and flexible grid layouts using Bulma’s columns system.

- **Columns** – Row container for columns.
- **Column** – Individual grid column.

### 🟩 Grid

CSS Grid support, using Bulma’s new grid utilities.

- **Grid** – CSS grid container.
- **Cell** – CSS grid cell.

### 🟨 Layout

High-level layout primitives for structuring your app.

- **Container** – Responsive maximum width container.
- **Section** – Page section wrapper.
- **Hero** – Prominent hero banner (with `Hero.Head`, `Hero.Body`, `Hero.Foot`).
- **Level** – Horizontal alignment container and items.
- **Media** – Flexible media object for avatars/media + content.
- **Footer** – Page footer.

### 🟧 Components

Reusable UI widgets and navigation components.

- **Card** – Content card with header, image, content, and footer.
- **Menu** – Vertical navigation menu with nested items.
- **Navbar** – Responsive top navigation bar and items.
- **Panel** – Sidebar menu/panel with subcomponents (tabs, blocks, icons).
- **Tabs/Tab** – Tab navigation with tab list and tab item.
- **Modal** – Dialog/modal window.

### 🟪 Form

Accessible, fully styled form controls supporting all Bulma modifiers.

- **Field** – Form field wrapper with label and layout.
- **Control** – Form control container (handles icons, loading, etc).
- **Input** – Styled input field.
- **Select** – Styled select dropdown.
- **File** – File input.
- **Radio & Radios** – Radio button and grouped radios.

---

## Example Usage

```tsx
import React from 'react';
import {
  Box,
  Button,
  Columns,
  Column,
  Field,
  Input,
} from '@allxsmith/bestax-bulma';
import 'bulma/css/bulma.min.css';

function Demo() {
  return (
    <Box>
      <Columns>
        <Column>
          <Field label="Username">
            <Input placeholder="Enter your username" />
          </Field>
          <Button color="primary">Submit</Button>
        </Column>
      </Columns>
    </Box>
  );
}
```

---

## Next Steps

- **Keep exploring right here in the documentation site!**
- **Get started with the [API component docs](/docs/category/elements)** for detailed usage, props, and examples for every component.
  - For example, check out [Button](/docs/api/elements/button) or browse other components in the sidebar.
- **Try out code samples and experiment as you go.**

---

## Storybook

We also provide a [Storybook site](https://bestax.cc/storybook) that we use for UI development and visual testing of all components.  
If you prefer the Storybook format, feel free to explore it for live demos and interaction.  
However, this documentation site is the primary and most complete resource for usage guides and real-world examples.

---

## 🙏 Special Thanks

bestax-bulma is built on top of the incredible [@jgthms/bulma](https://github.com/jgthms/bulma) CSS framework.

If you find Bulma useful, please consider [sponsoring Jeremy Thomas](https://github.com/sponsors/jgthms) to support the continued development of Bulma.

_Note: We are not affiliated with Bulma or Jeremy Thomas in any way...We’re just big fans of the Bulma framework!_

---
