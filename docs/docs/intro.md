# Getting Started

Welcome to **bestax-bulma** – a modern, flexible React component library powered by the latest Bulma v1 and TypeScript.

:::info

The latest Bulma V1 is supported by **bestax-bulma**.

:::

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
       href="https://cdn.jsdelivr.net/npm/bulma@1.0.4/css/bulma.min.css"
     />
     ```

3. **(Optional) Add an icon library:**

   Many components support icons. We recommend:

   ```bash
   npm install @fortawesome/fontawesome-free
   ```

---

## Component Overview

bestax-bulma is organized into several major directories. Here’s a high-level overview with links to API docs for each section:

### 🟢 [Elements](/docs/category/elements)

Basic Bulma elements made available as React components.

- [Block](/docs/api/elements/block) – Container with margin bottom. Great for consistent spacing.
- [Box](/docs/api/elements/box) – Container with optional color/shadow.
- [Button](/docs/api/elements/button) – The most awesome button in existence.
- [Buttons](/docs/api/elements/buttons) – A container for grouping buttons.
- [Content](/docs/api/elements/content) – A container for html content, great for content from services and WYSIWYG editors.
- [Delete](/docs/api/elements/delete) – An element to signify delete or close. Useful in tons of situations.
- [Icon](/docs/api/elements/icon) – Standardized icon wrapper for Bulma/Font Awesome.
- [Image](/docs/api/elements/image) – A container for images, fixed and responsive.
- [Notification](/docs/api/elements/notification) – A colored block to notify.
- [Progress](/docs/api/elements/progress) – A decent looking progress bar.
- [Table](/docs/api/elements/table) – `Thead`, `Tbody`, `Tfoot`, `Td`, `Th`, `Tr` for styled tables.
- [Tag](/docs/api/elements/tag) – Labels with colors and sizes.
- [Tags](/docs/api/elements/tags) – Group tags together.
- [Title](/docs/api/elements/title) – A styled title.
- [SubTitle](/docs/api/elements/subtitle) – A styled SubTitle, goes well under a Title.

### 🟦 [Columns](/docs/category/columns)

Responsive and flexible row-column layouts using Bulma’s columns system.

- [Columns](/docs/api/columns) – Row container for columns.
- [Column](/docs/api/columns/column) – Individual grid column.

### 🟩 [Grid](/docs/category/grid)

CSS Grid support, using Bulma’s new grid utilities.

- [Grid](/docs/api/grid) – CSS grid container.
- [Cell](/docs/api/grid/cell) – CSS grid cell.

### 🟨 [Layout](/docs/category/layout)

High-level layout primitives for structuring your app.

- [Container](/docs/api/layout/container) – Responsive maximum width container.
- [Section](/docs/api/layout/section) – Page section wrapper.
- [Hero](/docs/api/layout/hero) – Prominent hero banner (with `Hero.Head`, `Hero.Body`, `Hero.Foot`).
- [Level](/docs/api/layout/level) – Horizontal alignment container and items.
- [Media](/docs/api/layout/media) – Flexible media object for avatars/media + content.
- [Footer](/docs/api/layout/footer) – Page footer.

### 🟧 [Components](/docs/category/components)

Reusable UI widgets and navigation components.

- [Breadcrumb](/docs/api/components/breadcrumb) – A breadcrumb to help users navigate.
- [Card](/docs/api/components/card) – Content card with header, image, content, and footer.
- [Dropdown](/docs/api/components/dropdown) – A dropdown menu, kinda like select, but not a select.
- [Menu](/docs/api/components/menu) – Vertical navigation menu with nested items.
- [Message](/docs/api/components/message) – Colored message blocks, great for emphasis.
- [Modal](/docs/api/components/modal) – A Modal or dialog box.
- [Navbar](/docs/api/components/navbar) – Responsive top navigation bar and items.
- [Pagination](/docs/api/components/pagination) – A pagination bar for navigating multiple pages of results.
- [Panel](/docs/api/components/panel) – Sidebar menu/panel with subcomponents (tabs, blocks, icons).
- [Tabs/Tab](/docs/api/components/tabs) – Tab navigation with tab list and tab item.

### 🟪 [Form](/docs/category/form)

Accessible, fully styled form controls supporting all Bulma modifiers.

- [Field](/docs/api/form/field) – Form field wrapper with label and layout.
- [Control](/docs/api/form/control) – Form control container (handles icons, loading, etc).
- [Input](/docs/api/form/input) – Styled input field.
- [Select](/docs/api/form/select) – Styled select dropdown.
- [File](/docs/api/form/file) – File input.
- [Radio & Radios](/docs/api/form/radio) – Radio button and grouped radios.
- [Checkbox & Checkboxes](/docs/api/form/checkbox) – Checkbox and grouped checkboxes.
- [TextArea](/docs/api/form/textarea) – Styled textarea field.

---

### 🟦 [Helpers](/docs/category/helpers)

Little helpers used throughout this package to aid with translating properties to bulma classes. Recommended to use if you want to create your own components that are bulma powered.

- [classNames](/docs/api/helpers/classnames) – Our internal class name generator.
- [useBulmaClasses](/docs/api/helpers/usebulmaclasses) – Handles the translation from property to bulma classes.

---

## Example Usage

```tsx live
import React from 'react';
// import {
//   Box,
//   Button,
//   Columns,
//   Column,
//   Field,
//   Input,
// } from '@allxsmith/bestax-bulma';
// Line above commented out for live example
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
- **Get started with the [API component docs](/docs/category/elements/)** for detailed usage, props, and examples for every component.
  - For example, check out [Button](/docs/api/elements/button) or browse other components in the sidebar.
- **Try out code samples and experiment as you go.**

---

## Storybook

We also provide a [Storybook site](https://bestax.cc/storybook) that we use for UI development and visual testing of all components.  
If you prefer the Storybook format, feel free to explore it for live demos and interaction.  
However, this documentation site is the primary and most complete resource for usage guides and real-world examples.

---

## Attribution

- The [Bulma CSS framework](https://bulma.io) is © Jeremy Thomas and licensed under the [MIT License](https://github.com/jgthms/bulma/blob/master/LICENSE).
- Some example content and documentation in this site are adapted from the Bulma website ([CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)), © Jeremy Thomas.

See [Bulma’s license page](https://github.com/jgthms/bulma/blob/main/LICENSE) for more details.

:::tip

If you find Bulma useful, please consider [sponsoring Jeremy Thomas](https://github.com/sponsors/jgthms) to support the continued development of Bulma.

:::

:::note

We are not affiliated with Bulma or Jeremy Thomas in any way—we’re just big fans of the Bulma framework!

:::

---
