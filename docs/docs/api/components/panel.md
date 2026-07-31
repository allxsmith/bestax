---
title: Panel
sidebar_label: Panel
description: The `Panel` component implements Bulma's versatile panel block for React.
---

# Panel

## Overview

<!-- bestax:generated overview -->

The `Panel` component implements Bulma's versatile panel block for React.

<!-- /bestax:generated overview -->

It provides a convenient way to display lists, filters, navigation menus, or grouped actions in a card-like vertical container. The Panel supports color modifiers, search, tabs, icons, selectable blocks, and comes with several subcomponents for every panel part.

:::info
Use `Panel` for sidebar menus, filter lists, admin navigation, or any grouped interface actions.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Panel } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Complete Panel (Revolutionary Figures)

This example shows a complete panel layout using `Panel` and its subcomponents. The `Panel.Heading` provides a title, `Panel.InputBlock` adds a search field, and `Panel.Tabs` enables filtering. Use `Panel.Block` for each selectable item, optionally with an `active` state, and `Panel.Icon` to display icons. This structure is ideal for sidebars, filter lists, or admin menus. The `color` prop customizes the panel's appearance.

```tsx live
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
    <Panel.Icon name="user" variant="solid" />
    George Washington
  </Panel.Block>
  <Panel.Block>
    <Panel.Icon name="user" variant="solid" />
    Alexander Hamilton
  </Panel.Block>
  <Panel.Block>
    <Panel.Icon name="user" variant="solid" />
    Benedict Arnold
  </Panel.Block>
  <Panel.Block>
    <Panel.Icon name="user" variant="solid" />
    John Adams
  </Panel.Block>
  <Panel.Block>
    <Panel.Icon name="flag" variant="solid" />
    Battle of Saratoga
  </Panel.Block>
  <Panel.Block>
    <Panel.Icon name="flag" variant="solid" />
    Treaty of Paris
  </Panel.Block>
  <Panel.Block>
    <Panel.Icon name="flag" variant="solid" />
    Bunker Hill
  </Panel.Block>
  <Panel.CheckboxBlock>remember me</Panel.CheckboxBlock>
  <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
</Panel>
```

---

### Color Variants

This example demonstrates the `Panel` component's color variants. The `color` prop applies Bulma's color modifiers to the panel. Each panel in this example uses a different color, showcasing the flexibility of the `Panel` component in adapting to various design requirements.

```tsx live
<>
  {[
    'primary',
    'link',
    'info',
    'success',
    'warning',
    'danger',
    'black',
    'dark',
    'light',
    'white',
  ].map(color => (
    <Panel key={color} color={color}>
      <Panel.Heading>
        {color.charAt(0).toUpperCase() + color.slice(1)} Panel
      </Panel.Heading>
      <Panel.InputBlock placeholder="Search" />
      <Panel.Block active>
        <Panel.Icon name="user" variant="solid" />
        George Washington
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        Marquis de Lafayette
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="user" variant="solid" />
        Nathanael Greene
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="flag" variant="solid" />
        Battle of Trenton
      </Panel.Block>
      <Panel.Block>
        <Panel.Icon name="flag" variant="solid" />
        Yorktown
      </Panel.Block>
      <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
    </Panel>
  ))}
</>
```

---

### Compound (dot-notation) usage

Every subcomponent is exported by name (`PanelHeading`, `PanelBlock`, …) and attached to `Panel` as a static, so a whole panel can be composed from the single `Panel` import.

```tsx live
<Panel>
  <Panel.Heading>Founding Documents</Panel.Heading>
  <Panel.Block active>
    <Panel.Icon name="file" variant="solid" />
    Declaration of Independence
  </Panel.Block>
  <Panel.Block>
    <Panel.Icon name="file" variant="solid" />
    Articles of Confederation
  </Panel.Block>
  <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
</Panel>
```

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
- [Storybook: Panel Stories](https://bestax.io/storybook/?path=/story/components-panel--revolutionary-war)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Panel />` and its subcomponents for powerful utility-based styling.
:::

---

## Props

<!-- bestax:generated props -->

| Prop        | Type                                                                                                                               | Default | Description                                       |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `color`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'dark'` \| `'light'` \| `'white'` | —       | Bulma color modifier for the panel.               |
| `className` | `string`                                                                                                                           | —       | Additional CSS classes.                           |
| `children`  | `React.ReactNode`                                                                                                                  | —       | Panel content (usually includes subcomponents).   |
| `...`       | All standard HTML attributes and Bulma helper props                                                                                | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

**Subcomponents:**

- `Panel.Heading`: Main heading (renders as `<p class="panel-heading">`)
- `Panel.Tabs`: Panel tabs (renders as `<p class="panel-tabs">`)
- `Panel.Block`: Individual panel block (renders as `<a class="panel-block">`)
- `Panel.Icon`: Icon wrapper with panel styling (renders as `<span class="panel-icon"><i/></span>`). Accepts all Icon props (`name`, `variant`, `features`, etc.)
- `Panel.InputBlock`: Search input with icon (renders as `<div class="panel-block">`)
- `Panel.CheckboxBlock`: Checkbox block (renders as `<label class="panel-block">`)
- `Panel.ButtonBlock`: Call-to-action button (renders as `<div class="panel-block"><button /></div>`)

### Panel.Heading

| Prop        | Type                          | Default | Description                                       |
| ----------- | ----------------------------- | ------- | ------------------------------------------------- |
| `className` | `string`                      | —       | Additional CSS classes.                           |
| `children`  | `React.ReactNode`             | —       | Heading content.                                  |
| `...`       | All standard `<p>` attributes | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### Panel.Tabs

| Prop        | Type                            | Default | Description                                       |
| ----------- | ------------------------------- | ------- | ------------------------------------------------- |
| `className` | `string`                        | —       | Additional CSS classes.                           |
| `children`  | `React.ReactNode`               | —       | Tabs content.                                     |
| `...`       | All standard `<div>` attributes | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### Panel.Block

| Prop        | Type                          | Default | Description                                       |
| ----------- | ----------------------------- | ------- | ------------------------------------------------- |
| `className` | `string`                      | —       | Additional CSS classes.                           |
| `active`    | `boolean`                     | `false` | Whether the block is active.                      |
| `children`  | `React.ReactNode`             | —       | Block content.                                    |
| `...`       | All standard `<a>` attributes | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### Panel.Icon

| Prop              | Type                                                                            | Default  | Description                                                                                                                                                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className`       | `string`                                                                        | —        | Additional CSS classes to apply.                                                                                                                                                                                                                                              |
| `textColor`       | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —        | Text color helper.                                                                                                                                                                                                                                                            |
| `color`           | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —        | Bulma color modifier for the icon.                                                                                                                                                                                                                                            |
| `bgColor`         | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —        | Background color helper.                                                                                                                                                                                                                                                      |
| `name`            | `string`                                                                        | —        | The icon name, with or without its library prefix (e.g. `'star'` or `'fa-star'`).                                                                                                                                                                                             |
| `icon`            | `string`                                                                        | —        | DEPRECATED: Legacy prop, use `name` instead.                                                                                                                                                                                                                                  |
| `library`         | `'fa'` \| `'mdi'` \| `'ion'` \| `'material-icons'` \| `'material-symbols'`      | `'fa'`   | The icon library to use ('fa' = Font Awesome, 'mdi' = Material Design Icons, 'ion' = Ionicons Web Components, 'material-icons' = Google Material Icons, 'material-symbols' = Google Material Symbols). Defaults to the value set in ConfigProvider or 'fa' if not configured. |
| `variant`         | `string`                                                                        | —        | Icon style variant (e.g. `'solid'`, `'outlined'`, `'rounded'`).                                                                                                                                                                                                               |
| `features`        | `string` \| `string[]`                                                          | —        | Additional modifiers (e.g. `'fa-lg'`, `'fa-spin'`, `'is-size-1'`).                                                                                                                                                                                                            |
| `libraryFeatures` | `string` \| `string[]`                                                          | —        | **DEPRECATED:** Use `variant` and `features` instead.                                                                                                                                                                                                                         |
| `size`            | `'small'` \| `'medium'` \| `'large'`                                            | —        | Size modifier for the icon container.                                                                                                                                                                                                                                         |
| `ariaLabel`       | `string`                                                                        | `'icon'` | ARIA label for accessibility (default: 'icon').                                                                                                                                                                                                                               |
| `style`           | `React.CSSProperties`                                                           | —        | Inline style object.                                                                                                                                                                                                                                                          |
| `...`             | All standard `<span>` attributes and Bulma helper props                         | —        | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                             |

### Panel.InputBlock

| Prop            | Type                                         | Default           | Description                                         |
| --------------- | -------------------------------------------- | ----------------- | --------------------------------------------------- |
| `value`         | `string`                                     | —                 | Input value.                                        |
| `onChange`      | `React.ChangeEventHandler<HTMLInputElement>` | —                 | Input change handler.                               |
| `placeholder`   | `string`                                     | —                 | Input placeholder.                                  |
| `iconClassName` | `string`                                     | `'fas fa-search'` | Icon class for left icon (default 'fas fa-search'). |
| `className`     | `string`                                     | —                 | Additional CSS classes.                             |
| `...`           | All standard `<div>` attributes              | —                 | See [Helper Props](../helpers/usebulmaclasses.md)   |

### Panel.CheckboxBlock

| Prop        | Type                                         | Default | Description                                       |
| ----------- | -------------------------------------------- | ------- | ------------------------------------------------- |
| `checked`   | `boolean`                                    | `false` | Whether the checkbox is checked.                  |
| `onChange`  | `React.ChangeEventHandler<HTMLInputElement>` | —       | Checkbox change handler.                          |
| `children`  | `React.ReactNode`                            | —       | Label/content.                                    |
| `className` | `string`                                     | —       | Additional CSS classes.                           |
| `...`       | All standard `<label>` attributes            | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### Panel.ButtonBlock

| Prop        | Type                               | Default | Description                                       |
| ----------- | ---------------------------------- | ------- | ------------------------------------------------- |
| `children`  | `React.ReactNode`                  | —       | Button content.                                   |
| `className` | `string`                           | —       | Additional CSS classes.                           |
| `...`       | All standard `<button>` attributes | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

<!-- /bestax:generated props -->

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Panel` registers these variables on its own `.panel` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                   | Sass Variable                           | Default                              |
| ---------------------------------------------- | --------------------------------------- | ------------------------------------ |
| `--bulma-panel-margin`                         | `$panel-margin`                         | `var(--bulma-block-spacing)`         |
| `--bulma-panel-item-border`                    | `$panel-item-border`                    | `1px solid var(--bulma-border-weak)` |
| `--bulma-panel-radius`                         | `$panel-radius`                         | `var(--bulma-radius-large)`          |
| `--bulma-panel-shadow`                         | `$panel-shadow`                         | `var(--bulma-shadow)`                |
| `--bulma-panel-heading-line-height`            | `$panel-heading-line-height`            | `1.25`                               |
| `--bulma-panel-heading-padding`                | `$panel-heading-padding`                | `1em 1.25em`                         |
| `--bulma-panel-heading-radius`                 | `$panel-heading-radius`                 | `var(--bulma-radius)`                |
| `--bulma-panel-heading-size`                   | `$panel-heading-size`                   | `1.25em`                             |
| `--bulma-panel-heading-weight`                 | `$panel-heading-weight`                 | `var(--bulma-weight-bold)`           |
| `--bulma-panel-tabs-font-size`                 | `$panel-tabs-font-size`                 | `1em`                                |
| `--bulma-panel-tab-border-bottom-color`        | `$panel-tab-border-bottom-color`        | `var(--bulma-border)`                |
| `--bulma-panel-tab-border-bottom-style`        | `$panel-tab-border-bottom-style`        | `solid`                              |
| `--bulma-panel-tab-border-bottom-width`        | `$panel-tab-border-bottom-width`        | `1px`                                |
| `--bulma-panel-tab-active-color`               | `$panel-tab-active-color`               | `var(--bulma-link-active)`           |
| `--bulma-panel-list-item-color`                | `$panel-list-item-color`                | `var(--bulma-text)`                  |
| `--bulma-panel-list-item-hover-color`          | `$panel-list-item-hover-color`          | `var(--bulma-link)`                  |
| `--bulma-panel-block-color`                    | `$panel-block-color`                    | `var(--bulma-text-strong)`           |
| `--bulma-panel-block-hover-background-color`   | `$panel-block-hover-background-color`   | `var(--bulma-background)`            |
| `--bulma-panel-block-active-border-left-color` | `$panel-block-active-border-left-color` | `var(--bulma-link)`                  |
| `--bulma-panel-block-active-color`             | `$panel-block-active-color`             | `var(--bulma-link-active)`           |
| `--bulma-panel-block-active-icon-color`        | `$panel-block-active-icon-color`        | `var(--bulma-link)`                  |
| `--bulma-panel-icon-color`                     | `$panel-icon-color`                     | `var(--bulma-text-weak)`             |
| `--bulma-panel-h`                              | —                                       | `var(--bulma-scheme-h)`              |
| `--bulma-panel-s`                              | —                                       | `var(--bulma-scheme-s)`              |
| `--bulma-panel-color-l`                        | —                                       | `var(--bulma-text-l)`                |
| `--bulma-panel-heading-background-l`           | —                                       | `var(--bulma-text-l)`                |
| `--bulma-panel-heading-color-l`                | —                                       | `var(--bulma-text-invert-l)`         |

<!-- /bestax:generated cssvars -->
