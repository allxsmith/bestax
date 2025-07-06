---
title: Panel
sidebar_label: Panel
---

# Panel

## Overview

The `Panel` component implements Bulma's versatile panel block for React. It provides a convenient way to display lists, filters, navigation menus, or grouped actions in a card-like vertical container. The Panel supports color modifiers, search, tabs, icons, selectable blocks, and comes with several subcomponents for every panel part.

:::info
Use `Panel` for sidebar menus, filter lists, admin navigation, or any grouped interface actions.
:::

---

## Import

```tsx
import { Panel } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                                                                                                               | Default | Description                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------- |
| `color`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'dark'` \| `'light'` \| `'white'` | —       | Bulma color modifier for the panel.             |
| `className` | `string`                                                                                                                           | —       | Additional CSS classes.                         |
| `children`  | `React.ReactNode`                                                                                                                  | —       | Panel content (usually includes subcomponents). |
| ...         | All standard HTML and Bulma helper props (see [Helper Props](../helpers/usebulmaclasses))                                          |         | Utility and accessibility props.                |

**Subcomponents:**

- `Panel.Heading`: Main heading (renders as `<p class="panel-heading">`)
- `Panel.Tabs`: Panel tabs (renders as `<p class="panel-tabs">`)
- `Panel.Block`: Individual panel block (renders as `<a class="panel-block">`)
- `Panel.Icon`: Icon container (renders as `<span class="panel-icon">`)
- `Panel.InputBlock`: Search input with icon (renders as `<div class="panel-block">`)
- `Panel.CheckboxBlock`: Checkbox block (renders as `<label class="panel-block">`)
- `Panel.ButtonBlock`: Call-to-action button (renders as `<div class="panel-block"><button /></div>`)

---

## Usage

### Complete Panel (Revolutionary Figures)

```tsx
<Panel>
  <Panel.Heading>Revolutionary Figures</Panel.Heading>
  <Panel.InputBlock placeholder="Search" />
  <Panel.Tabs>
    <a className="is-active">All</a>
    <a>Patriots</a>
    <a>Loyalists</a>
    <a>Battles</a>
    <a>Documents</a>
  </Panel.Tabs>
  <Panel.Block active>
    <Panel.Icon>
      <i className="fas fa-user" aria-hidden="true"></i>
    </Panel.Icon>
    George Washington
  </Panel.Block>
  <Panel.Block>
    <Panel.Icon>
      <i className="fas fa-user" aria-hidden="true"></i>
    </Panel.Icon>
    Alexander Hamilton
  </Panel.Block>
  <Panel.Block>
    <Panel.Icon>
      <i className="fas fa-user" aria-hidden="true"></i>
    </Panel.Icon>
    Benedict Arnold
  </Panel.Block>
  <Panel.Block>
    <Panel.Icon>
      <i className="fas fa-user" aria-hidden="true"></i>
    </Panel.Icon>
    John Adams
  </Panel.Block>
  <Panel.Block>
    <Panel.Icon>
      <i className="fas fa-flag" aria-hidden="true"></i>
    </Panel.Icon>
    Battle of Saratoga
  </Panel.Block>
  <Panel.Block>
    <Panel.Icon>
      <i className="fas fa-flag" aria-hidden="true"></i>
    </Panel.Icon>
    Treaty of Paris
  </Panel.Block>
  <Panel.Block>
    <Panel.Icon>
      <i className="fas fa-flag" aria-hidden="true"></i>
    </Panel.Icon>
    Bunker Hill
  </Panel.Block>
  <Panel.CheckboxBlock>remember me</Panel.CheckboxBlock>
  <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
</Panel>
```

---

### Color Variants

```tsx
<Panel color="primary">
  <Panel.Heading>Primary Panel</Panel.Heading>
  <Panel.InputBlock placeholder="Search" />
  <Panel.Block active>
    <Panel.Icon>
      <i className="fas fa-user" aria-hidden="true"></i>
    </Panel.Icon>
    George Washington
  </Panel.Block>
  <Panel.Block>
    <Panel.Icon>
      <i className="fas fa-user" aria-hidden="true"></i>
    </Panel.Icon>
    Marquis de Lafayette
  </Panel.Block>
  <Panel.Block>
    <Panel.Icon>
      <i className="fas fa-user" aria-hidden="true"></i>
    </Panel.Icon>
    Nathanael Greene
  </Panel.Block>
  <Panel.Block>
    <Panel.Icon>
      <i className="fas fa-flag" aria-hidden="true"></i>
    </Panel.Icon>
    Battle of Trenton
  </Panel.Block>
  <Panel.Block>
    <Panel.Icon>
      <i className="fas fa-flag" aria-hidden="true"></i>
    </Panel.Icon>
    Yorktown
  </Panel.Block>
  <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
</Panel>
```

Repeat the above block for these color values:

- `color="link"`
- `color="info"`
- `color="success"`
- `color="warning"`
- `color="danger"`
- `color="black"`
- `color="dark"`
- `color="light"`
- `color="white"`

---

## Accessibility

- The root panel renders as a semantic `<nav>` for navigation/landmark.
- Use headings, links, and buttons with appropriate labels for best accessibility.
- The `Panel.Block` by default renders as an anchor `<a>`, but can be customized for interactive blocks.

:::note
For keyboard navigation, ensure interactive Panel blocks are focusable and provide clear visual states.
:::

---

## Related Components

- [`Icon`](../elements/icon.md): For icons inside `Panel.Icon`.
- [Helper Props](../helpers/usebulmaclasses.md): All Bulma utility helpers can be used.

---

## Additional Resources

- [Bulma Panel Documentation](https://bulma.io/documentation/components/panel/)
- [Storybook: Panel Stories](https://storybook.bestax.cc/?path=/story/components-panel--revolutionary-war)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Panel />` and its subcomponents for powerful utility-based styling.
:::
