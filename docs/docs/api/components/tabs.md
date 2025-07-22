---
title: Tabs
sidebar_label: Tabs
---

# Tabs

## Overview

The `Tabs` component provides flexible and fully-featured Bulma tab navigation for your Bulma React UI. It supports alignment, size, color, boxed and toggle styles, rounded and fullwidth options, and can display icons or custom content in each tab. Compose tabs using the `Tabs.List` and `Tabs.Item` subcomponents for maximum flexibility.

:::info
Use `Tabs` for navigation, filtering, or switching between views. Combine with icons and Bulma helpers for advanced layouts.
:::

---

## Import

```tsx
import { Tabs } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                                | Default | Description                                             |
| ----------- | --------------------------------------------------- | ------- | ------------------------------------------------------- |
| `align`     | `'centered'` \| `'right'` \| `'left'`               | —       | Tab alignment.                                          |
| `size`      | `'small'` \| `'medium'` \| `'large'`                | —       | Tab size.                                               |
| `fullwidth` | `boolean`                                           | `false` | Tabs expand to fill the horizontal space.               |
| `boxed`     | `boolean`                                           | `false` | Tabs use the boxed style.                               |
| `toggle`    | `boolean`                                           | `false` | Tabs use the toggle style.                              |
| `rounded`   | `boolean`                                           | `false` | Tabs use the rounded toggle style (only with `toggle`). |
| `color`     | Bulma color (`'primary'`, `'link'`, `'info'`, etc.) | —       | Bulma color for tab underlines and active state.        |
| `className` | `string`                                            | —       | Additional CSS classes.                                 |
| `children`  | `React.ReactNode`                                   | —       | Tab list and tab items.                                 |
| ...         | All standard HTML and Bulma helper props            |         | (See [Helper Props](../helpers/usebulmaclasses))        |

**Subcomponents:**

- `Tabs.List`: The `<ul>` container for tab items.
- `Tabs.Item`: Each tab; accepts `active`, `onClick`, etc.

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
- [Storybook: Tabs Stories](https://bestax.cc/storybook/?path=/story/components-tabs--alignment-centered)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Tabs />` and its subcomponents for powerful utility-based styling.
:::
