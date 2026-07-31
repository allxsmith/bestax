---
title: Tabs
sidebar_label: Tabs
description: The `Tabs` component provides flexible and fully-featured Bulma tab navigation for your Bulma React UI.
---

# Tabs

## Overview

<!-- bestax:generated overview -->

The `Tabs` component provides flexible and fully-featured Bulma tab navigation for your Bulma React UI.

<!-- /bestax:generated overview -->

It supports alignment, size, color, boxed and toggle styles, rounded and fullwidth options, and can display icons or custom content in each tab. Compose tabs using the `Tabs.List` and `Tabs.Item` subcomponents for maximum flexibility.

:::info
Use `Tabs` for navigation, filtering, or switching between views. Combine with icons and Bulma helpers for advanced layouts.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Tabs } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Centered Alignment

This example demonstrates a tab navigation with centered alignment using the `align="centered"` prop. Compose your tabs with `Tabs.List` and `Tabs.Item`, and use the `active` prop to highlight the selected tab. This layout is ideal for main navigation or switching between views.

```tsx live
<Tabs align="centered">
  <Tabs.List>
    <Tabs.Item active>
      <a>Home</a>
    </Tabs.Item>
    <Tabs.Item>
      <a>Profile</a>
    </Tabs.Item>
    <Tabs.Item>
      <a>Settings</a>
    </Tabs.Item>
  </Tabs.List>
</Tabs>
```

---

### Right Alignment

This example shows how to align tabs to the right using the `align="right"` prop. The `active` prop marks the current tab, and you can add as many `Tabs.Item` components as needed for your navigation structure.

```tsx live
<Tabs align="right">
  <Tabs.List>
    <Tabs.Item>
      <a>Home</a>
    </Tabs.Item>
    <Tabs.Item active>
      <a>Profile</a>
    </Tabs.Item>
    <Tabs.Item>
      <a>Settings</a>
    </Tabs.Item>
  </Tabs.List>
</Tabs>
```

---

### With Icons

This example demonstrates using icons in your tabs. Each tab can contain an icon and text, making your navigation more visually appealing and informative. The `active` tab is highlighted, and you can use any Font Awesome icons or your custom icons.

```tsx live
<Tabs>
  <Tabs.List>
    <Tabs.Item active>
      <a>
        <Icon name="fas fa-image" size="small" />
        <span>Pictures</span>
      </a>
    </Tabs.Item>
    <Tabs.Item>
      <a>
        <Icon name="fas fa-music" size="small" />
        <span>Music</span>
      </a>
    </Tabs.Item>
    <Tabs.Item>
      <a>
        <Icon name="fas fa-film" size="small" />
        <span>Videos</span>
      </a>
    </Tabs.Item>
    <Tabs.Item>
      <a>
        <Icon name="fas fa-file-alt" size="small" />
        <span>Documents</span>
      </a>
    </Tabs.Item>
  </Tabs.List>
</Tabs>
```

---

### Small, Medium, and Large Tabs

Easily adjust the size of your tabs using the `size` prop. This example shows the three available sizes: small, medium, and large. Each size variation can be used to emphasize different levels of navigation or to fit different design requirements.

```tsx live
<>
  <Tabs size="small">
    <Tabs.List>
      <Tabs.Item active>
        <a>Tab 1</a>
      </Tabs.Item>
      <Tabs.Item>
        <a>Tab 2</a>
      </Tabs.Item>
      <Tabs.Item>
        <a>Tab 3</a>
      </Tabs.Item>
    </Tabs.List>
  </Tabs>

  <Tabs size="medium">
    <Tabs.List>
      <Tabs.Item active>
        <a>Tab 1</a>
      </Tabs.Item>
      <Tabs.Item>
        <a>Tab 2</a>
      </Tabs.Item>
      <Tabs.Item>
        <a>Tab 3</a>
      </Tabs.Item>
    </Tabs.List>
  </Tabs>

  <Tabs size="large">
    <Tabs.List>
      <Tabs.Item active>
        <a>Tab 1</a>
      </Tabs.Item>
      <Tabs.Item>
        <a>Tab 2</a>
      </Tabs.Item>
      <Tabs.Item>
        <a>Tab 3</a>
      </Tabs.Item>
    </Tabs.List>
  </Tabs>
</>
```

---

### Boxed Tabs

The boxed style gives your tabs a distinct, separated look. This example demonstrates how to create boxed tabs using the `boxed` prop. Boxed tabs are great for categorizing content or features distinctly.

```tsx live
<Tabs boxed>
  <Tabs.List>
    <Tabs.Item active>
      <a>Overview</a>
    </Tabs.Item>
    <Tabs.Item>
      <a>Elements</a>
    </Tabs.Item>
    <Tabs.Item>
      <a>Components</a>
    </Tabs.Item>
  </Tabs.List>
</Tabs>
```

---

### Toggle Tabs

Toggle tabs are useful for binary views or filters, such as showing all items versus only active items. This example shows how to create toggle tabs using the `toggle` prop. The active tab indicates the current filter or view.

```tsx live
<Tabs toggle>
  <Tabs.List>
    <Tabs.Item active>
      <a>All</a>
    </Tabs.Item>
    <Tabs.Item>
      <a>Active</a>
    </Tabs.Item>
    <Tabs.Item>
      <a>Completed</a>
    </Tabs.Item>
  </Tabs.List>
</Tabs>
```

---

### Toggle Rounded Tabs

Combine the toggle style with rounded corners for a pill-like appearance. This example demonstrates toggle rounded tabs, which are especially useful in mobile interfaces or where a softer look is desired.

```tsx live
<Tabs toggle rounded>
  <Tabs.List>
    <Tabs.Item active>
      <a>All</a>
    </Tabs.Item>
    <Tabs.Item>
      <a>Active</a>
    </Tabs.Item>
    <Tabs.Item>
      <a>Completed</a>
    </Tabs.Item>
  </Tabs.List>
</Tabs>
```

---

### Fullwidth Tabs

Make your tabs span the entire width of their container with the `fullwidth` prop. This example shows fullwidth tabs, which are useful for emphasizing the tab navigation or when you have many tabs to display.

```tsx live
<Tabs fullwidth>
  <Tabs.List>
    <Tabs.Item active>
      <a>One</a>
    </Tabs.Item>
    <Tabs.Item>
      <a>Two</a>
    </Tabs.Item>
    <Tabs.Item>
      <a>Three</a>
    </Tabs.Item>
    <Tabs.Item>
      <a>Four</a>
    </Tabs.Item>
  </Tabs.List>
</Tabs>
```

---

### Centered Boxed Tabs with Icons

This example combines several features: centered alignment, boxed style, and icons. Such a combination is perfect for a dashboard or a complex application where you need to save space and still provide clear navigation.

```tsx live
<Tabs align="centered" boxed>
  <Tabs.List>
    <Tabs.Item active>
      <a>
        <Icon name="fas fa-home" size="small" />
        <span>Home</span>
      </a>
    </Tabs.Item>
    <Tabs.Item>
      <a>
        <Icon name="fas fa-user" size="small" />
        <span>Profile</span>
      </a>
    </Tabs.Item>
    <Tabs.Item>
      <a>
        <Icon name="fas fa-cog" size="small" />
        <span>Settings</span>
      </a>
    </Tabs.Item>
  </Tabs.List>
</Tabs>
```

---

### Toggle Fullwidth Tabs with Icons

Enhance your toggle tabs with icons for better visual communication. This example also uses the `fullwidth` prop to make the tabs span the entire width, which is useful for mobile views or when you want to emphasize the tab bar.

```tsx live
<Tabs toggle fullwidth>
  <Tabs.List>
    <Tabs.Item active>
      <a>
        <Icon name="fas fa-list" size="small" />
        <span>List</span>
      </a>
    </Tabs.Item>
    <Tabs.Item>
      <a>
        <Icon name="fas fa-check" size="small" />
        <span>Done</span>
      </a>
    </Tabs.Item>
    <Tabs.Item>
      <a>
        <Icon name="fas fa-times" size="small" />
        <span>Removed</span>
      </a>
    </Tabs.Item>
  </Tabs.List>
</Tabs>
```

---

### Centered Boxed Medium Tabs with Icons

This example features centered, boxed tabs in medium size, each with an icon. It's a great layout for a feature-rich application where you want to provide quick access to important sections.

```tsx live
<Tabs align="centered" boxed size="medium">
  <Tabs.List>
    <Tabs.Item active>
      <a>
        <Icon name="fas fa-star" size="small" />
        <span>Favorites</span>
      </a>
    </Tabs.Item>
    <Tabs.Item>
      <a>
        <Icon name="fas fa-clock" size="small" />
        <span>Recent</span>
      </a>
    </Tabs.Item>
    <Tabs.Item>
      <a>
        <Icon name="fas fa-archive" size="small" />
        <span>Archive</span>
      </a>
    </Tabs.Item>
  </Tabs.List>
</Tabs>
```

---

### Toggle Fullwidth Large Tabs with Icons

The final example showcases toggle tabs with fullwidth and large size, including icons. This combination is powerful for applications with complex navigation needs, ensuring that users can easily understand and access different sections.

```tsx live
<Tabs toggle fullwidth size="large">
  <Tabs.List>
    <Tabs.Item active>
      <a>
        <Icon name="fas fa-rocket" size="small" />
        <span>Launch</span>
      </a>
    </Tabs.Item>
    <Tabs.Item>
      <a>
        <Icon name="fas fa-bell" size="small" />
        <span>Alerts</span>
      </a>
    </Tabs.Item>
    <Tabs.Item>
      <a>
        <Icon name="fas fa-cogs" size="small" />
        <span>Settings</span>
      </a>
    </Tabs.Item>
  </Tabs.List>
</Tabs>
```

---

### Compound (dot-notation) usage

`TabList`, `Tab`, `TabsContent`, and `TabContentItem` are also available as `Tabs.List`, `Tabs.Tab`, `Tabs.Content`, and `Tabs.Content.Item`, so a complete tabbed interface can be composed from the single `Tabs` import.

```tsx live
<Tabs>
  <Tabs.List>
    <Tabs.Tab index={0}>Overview</Tabs.Tab>
    <Tabs.Tab index={1}>Settings</Tabs.Tab>
  </Tabs.List>
  <Tabs.Content>
    <Tabs.Content.Item index={0}>Overview panel</Tabs.Content.Item>
    <Tabs.Content.Item index={1}>Settings panel</Tabs.Content.Item>
  </Tabs.Content>
</Tabs>
```

---

## Accessibility

- The tab list renders as a semantic `<ul>` and each item as `<li>`.
- Use clear text or icons with labels for each tab.
- Provide `aria-label` or screen-reader text for icon-only tabs.

:::note
Tabs do not manage tab panels or keyboard focus automatically—implement those patterns as needed for your app.
:::

---

## Related Components

- [`Icon`](../elements/icon.md): Use for icons in tab labels.
- [Helper Props](../helpers/usebulmaclasses.md): All Bulma utility helpers are supported.

---

## Additional Resources

- [Bulma Tabs Documentation](https://bulma.io/documentation/components/tabs/)
- [Storybook: Tabs Stories](https://bestax.io/storybook/?path=/story/components-tabs--alignment-centered)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Tabs />` and its subcomponents for powerful utility-based styling.
:::

---

## Props

<!-- bestax:generated props -->

| Prop           | Type                                                                                                                               | Default | Description                                             |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------- |
| `align`        | `'centered'` \| `'right'` \| `'left'`                                                                                              | —       | Tab alignment.                                          |
| `size`         | `'small'` \| `'medium'` \| `'large'`                                                                                               | —       | Tab size.                                               |
| `fullwidth`    | `boolean`                                                                                                                          | `false` | Tabs expand to fill the horizontal space.               |
| `boxed`        | `boolean`                                                                                                                          | `false` | Tabs use the boxed style.                               |
| `toggle`       | `boolean`                                                                                                                          | `false` | Tabs use the toggle style.                              |
| `rounded`      | `boolean`                                                                                                                          | `false` | Tabs use the rounded toggle style (only with `toggle`). |
| `color`        | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'dark'` \| `'light'` \| `'white'` | —       | Bulma color for tab underlines and active state.        |
| `value`        | `number`                                                                                                                           | —       | Controlled active tab index.                            |
| `onChange`     | `(index: number) => void`                                                                                                          | —       | Callback when active tab changes.                       |
| `defaultValue` | `number`                                                                                                                           | `0`     | Initial active tab index (uncontrolled).                |
| `vertical`     | `boolean`                                                                                                                          | `false` | Renders tabs vertically.                                |
| `side`         | `'left'` \| `'right'`                                                                                                              | —       | Side placement when `vertical` is true.                 |
| `expanded`     | `boolean`                                                                                                                          | `false` | Makes tabs take up the full width equally.              |
| `className`    | `string`                                                                                                                           | —       | Additional CSS classes.                                 |
| `children`     | `React.ReactNode`                                                                                                                  | —       | Tab list and tab items.                                 |
| `...`          | All standard `<div>` attributes and Bulma helper props                                                                             | —       | See [Helper Props](../helpers/usebulmaclasses.md)       |

**Subcomponents:**

- `Tabs.List`: The `<ul>` container for tab items.
- `Tabs.Tab`: Individual tab button. Consumes Tabs context for active state management. Renders `<a>` internally — consumers provide only the label text/children.
- `Tabs.Item`: Each tab; accepts `active`, `onClick`, etc.
- `Tabs.Content`: Container for tab content panels. No custom props beyond `children` and standard `<div>` HTML attributes. Applies the `.tabs-content` class.
- `Tabs.Content.Item`: Individual content panel. Shows/hides based on active tab from context.

### Tabs.List

| Prop        | Type                           | Default | Description             |
| ----------- | ------------------------------ | ------- | ----------------------- |
| `className` | `string`                       | —       | Additional CSS classes. |
| `children`  | `React.ReactNode`              | —       | Tab elements.           |
| `...`       | All standard `<ul>` attributes | —       |                         |

### Tabs.Tab

| Prop           | Type                                                                       | Default   | Description                                                |
| -------------- | -------------------------------------------------------------------------- | --------- | ---------------------------------------------------------- |
| `index`        | `number`                                                                   | —         | **Required.** Tab index for matching with content.         |
| `disabled`     | `boolean`                                                                  | `false`   | Disables the tab.                                          |
| `icon`         | `string`                                                                   | —         | Icon name for the tab.                                     |
| `iconLibrary`  | `'fa'` \| `'mdi'` \| `'ion'` \| `'material-icons'` \| `'material-symbols'` | —         | Icon library to use.                                       |
| `iconVariant`  | `string`                                                                   | —         | Icon style variant (e.g., 'solid', 'outlined', 'rounded'). |
| `iconSize`     | `'small'` \| `'medium'` \| `'large'`                                       | `'small'` | Size of the tab icon.                                      |
| `iconFeatures` | `string` \| `string[]`                                                     | —         | Additional icon modifiers.                                 |
| `className`    | `string`                                                                   | —         | Additional CSS classes.                                    |
| `children`     | `React.ReactNode`                                                          | —         | Tab label content.                                         |
| `...`          | All standard `<li>` attributes                                             | —         |                                                            |

### Tabs.Item

| Prop        | Type                                     | Default | Description                |
| ----------- | ---------------------------------------- | ------- | -------------------------- |
| `active`    | `boolean`                                | `false` | Whether the tab is active. |
| `className` | `string`                                 | —       | Additional CSS classes.    |
| `children`  | `React.ReactNode`                        | —       | Tab content.               |
| `onClick`   | `React.MouseEventHandler<HTMLLIElement>` | —       | Click handler.             |
| `...`       | All standard `<li>` attributes           | —       |                            |

### Tabs.Content

| Prop        | Type                            | Default | Description              |
| ----------- | ------------------------------- | ------- | ------------------------ |
| `className` | `string`                        | —       | Additional CSS classes.  |
| `children`  | `React.ReactNode`               | —       | TabContentItem elements. |
| `...`       | All standard `<div>` attributes | —       |                          |

### Tabs.Content.Item

| Prop        | Type                            | Default | Description                                        |
| ----------- | ------------------------------- | ------- | -------------------------------------------------- |
| `index`     | `number`                        | —       | **Required.** Tab index for matching with content. |
| `className` | `string`                        | —       | Additional CSS classes.                            |
| `children`  | `React.ReactNode`               | —       | Panel content.                                     |
| `...`       | All standard `<div>` attributes | —       |                                                    |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Tabs` registers these variables on its own `.tabs` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                         | Sass Variable                                 | Default                     |
| ---------------------------------------------------- | --------------------------------------------- | --------------------------- |
| `--bulma-tabs-border-bottom-color`                   | `$tabs-border-bottom-color`                   | `var(--bulma-border)`       |
| `--bulma-tabs-border-bottom-style`                   | `$tabs-border-bottom-style`                   | `solid`                     |
| `--bulma-tabs-border-bottom-width`                   | `$tabs-border-bottom-width`                   | `1px`                       |
| `--bulma-tabs-link-color`                            | `$tabs-link-color`                            | `var(--bulma-text)`         |
| `--bulma-tabs-link-hover-border-bottom-color`        | `$tabs-link-hover-border-bottom-color`        | `var(--bulma-text-strong)`  |
| `--bulma-tabs-link-hover-color`                      | `$tabs-link-hover-color`                      | `var(--bulma-text-strong)`  |
| `--bulma-tabs-link-active-border-bottom-color`       | `$tabs-link-active-border-bottom-color`       | `var(--bulma-link-text)`    |
| `--bulma-tabs-link-active-color`                     | `$tabs-link-active-color`                     | `var(--bulma-link-text)`    |
| `--bulma-tabs-link-padding`                          | `$tabs-link-padding`                          | `0.5em 1em`                 |
| `--bulma-tabs-boxed-link-radius`                     | `$tabs-boxed-link-radius`                     | `var(--bulma-radius)`       |
| `--bulma-tabs-boxed-link-hover-background-color`     | `$tabs-boxed-link-hover-background-color`     | `var(--bulma-background)`   |
| `--bulma-tabs-boxed-link-hover-border-bottom-color`  | `$tabs-boxed-link-hover-border-bottom-color`  | `var(--bulma-border)`       |
| `--bulma-tabs-boxed-link-active-background-color`    | `$tabs-boxed-link-active-background-color`    | `var(--bulma-scheme-main)`  |
| `--bulma-tabs-boxed-link-active-border-color`        | `$tabs-boxed-link-active-border-color`        | `var(--bulma-border)`       |
| `--bulma-tabs-boxed-link-active-border-bottom-color` | `$tabs-boxed-link-active-border-bottom-color` | `transparent`               |
| `--bulma-tabs-toggle-link-border-color`              | `$tabs-toggle-link-border-color`              | `var(--bulma-border)`       |
| `--bulma-tabs-toggle-link-border-style`              | `$tabs-toggle-link-border-style`              | `solid`                     |
| `--bulma-tabs-toggle-link-border-width`              | `$tabs-toggle-link-border-width`              | `1px`                       |
| `--bulma-tabs-toggle-link-hover-background-color`    | `$tabs-toggle-link-hover-background-color`    | `var(--bulma-background)`   |
| `--bulma-tabs-toggle-link-hover-border-color`        | `$tabs-toggle-link-hover-border-color`        | `var(--bulma-border-hover)` |
| `--bulma-tabs-toggle-link-radius`                    | `$tabs-toggle-link-radius`                    | `var(--bulma-radius)`       |
| `--bulma-tabs-toggle-link-active-background-color`   | `$tabs-toggle-link-active-background-color`   | `var(--bulma-link)`         |
| `--bulma-tabs-toggle-link-active-border-color`       | `$tabs-toggle-link-active-border-color`       | `var(--bulma-link)`         |
| `--bulma-tabs-toggle-link-active-color`              | `$tabs-toggle-link-active-color`              | `var(--bulma-link-invert)`  |

<!-- /bestax:generated cssvars -->
