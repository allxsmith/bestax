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
