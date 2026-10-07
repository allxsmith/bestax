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

It supports alignment, size, boxed and toggle styles, rounded and fullwidth options, and can display icons or custom content in each tab. Build tabbed panels from `Tabs.Tab` and `Tabs.Content`, which keep the selected tab, show its panel and handle the keyboard, or build Bulma navigation from `Tabs.Item` with your own links inside. (The `color` prop is deprecated: Bulma ships no tabs color CSS, so it has never had a visual effect.)

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

### Tab Panels

Give each `Tabs.Tab` and `Tabs.Content.Item` the same `index` and `Tabs` shows the panel of the selected tab. Click a tab, or press Tab to reach the list, move between tabs with the arrow keys and press Enter or Space to open one. `disabled` keeps a tab from being picked, and the arrow keys skip it. See [Accessibility](#accessibility) for every key.

```tsx live
<Tabs>
  <Tabs.List>
    <Tabs.Tab index={0}>Inbox</Tabs.Tab>
    <Tabs.Tab index={1} disabled>
      Drafts
    </Tabs.Tab>
    <Tabs.Tab index={2}>Sent</Tabs.Tab>
    <Tabs.Tab index={3}>Archive</Tabs.Tab>
  </Tabs.List>
  <Tabs.Content>
    <Tabs.Content.Item index={0}>Messages waiting for you.</Tabs.Content.Item>
    <Tabs.Content.Item index={1}>Unfinished messages.</Tabs.Content.Item>
    <Tabs.Content.Item index={2}>Messages you have sent.</Tabs.Content.Item>
    <Tabs.Content.Item index={3}>
      Messages you have filed away.
    </Tabs.Content.Item>
  </Tabs.Content>
</Tabs>
```

---

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
        <Icon name="fas fa-image" size="small" aria-hidden="true" />
        <span>Pictures</span>
      </a>
    </Tabs.Item>
    <Tabs.Item>
      <a>
        <Icon name="fas fa-music" size="small" aria-hidden="true" />
        <span>Music</span>
      </a>
    </Tabs.Item>
    <Tabs.Item>
      <a>
        <Icon name="fas fa-film" size="small" aria-hidden="true" />
        <span>Videos</span>
      </a>
    </Tabs.Item>
    <Tabs.Item>
      <a>
        <Icon name="fas fa-file-alt" size="small" aria-hidden="true" />
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

Make your tabs span the entire width of their container with the `isFullwidth` prop. This example shows fullwidth tabs, which are useful for emphasizing the tab navigation or when you have many tabs to display. (The older `fullwidth` spelling still works as a deprecated alias.)

```tsx live
<Tabs isFullwidth>
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
        <Icon name="fas fa-home" size="small" aria-hidden="true" />
        <span>Home</span>
      </a>
    </Tabs.Item>
    <Tabs.Item>
      <a>
        <Icon name="fas fa-user" size="small" aria-hidden="true" />
        <span>Profile</span>
      </a>
    </Tabs.Item>
    <Tabs.Item>
      <a>
        <Icon name="fas fa-cog" size="small" aria-hidden="true" />
        <span>Settings</span>
      </a>
    </Tabs.Item>
  </Tabs.List>
</Tabs>
```

---

### Toggle Fullwidth Tabs with Icons

Enhance your toggle tabs with icons for better visual communication. This example also uses the `isFullwidth` prop to make the tabs span the entire width, which is useful for mobile views or when you want to emphasize the tab bar.

```tsx live
<Tabs toggle isFullwidth>
  <Tabs.List>
    <Tabs.Item active>
      <a>
        <Icon name="fas fa-list" size="small" aria-hidden="true" />
        <span>List</span>
      </a>
    </Tabs.Item>
    <Tabs.Item>
      <a>
        <Icon name="fas fa-check" size="small" aria-hidden="true" />
        <span>Done</span>
      </a>
    </Tabs.Item>
    <Tabs.Item>
      <a>
        <Icon name="fas fa-times" size="small" aria-hidden="true" />
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
        <Icon name="fas fa-star" size="small" aria-hidden="true" />
        <span>Favorites</span>
      </a>
    </Tabs.Item>
    <Tabs.Item>
      <a>
        <Icon name="fas fa-clock" size="small" aria-hidden="true" />
        <span>Recent</span>
      </a>
    </Tabs.Item>
    <Tabs.Item>
      <a>
        <Icon name="fas fa-archive" size="small" aria-hidden="true" />
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
<Tabs toggle isFullwidth size="large">
  <Tabs.List>
    <Tabs.Item active>
      <a>
        <Icon name="fas fa-rocket" size="small" aria-hidden="true" />
        <span>Launch</span>
      </a>
    </Tabs.Item>
    <Tabs.Item>
      <a>
        <Icon name="fas fa-bell" size="small" aria-hidden="true" />
        <span>Alerts</span>
      </a>
    </Tabs.Item>
    <Tabs.Item>
      <a>
        <Icon name="fas fa-cogs" size="small" aria-hidden="true" />
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

Tabs built from `Tabs.Tab` follow the [WAI-ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), with manual activation.

| Key                 | Action                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `Tab` / `Shift+Tab` | Enter the tab list on the selected tab, or leave it from whichever tab has focus                |
| `→` / `←`           | Move focus to the next / previous tab, wrapping at either end                                   |
| `↓` / `↑`           | Move focus to the next / previous tab in a `vertical` tab list (`→` and `←` keep working there) |
| `Home` / `End`      | Move focus to the first / last tab                                                              |
| `Enter` / `Space`   | Activate the focused tab: select it, show its panel and call `onChange`                         |

- The tab list is a single tab stop. While focus is in it, the stop follows focus, and once focus leaves it returns to the selected tab.
- Activation is manual: moving focus with the arrow keys, `Home` or `End` doesn't change the panel or call `onChange`. `Enter`, `Space` and a click do. A key press activates the tab through a click on it, so click listeners see keyboard activation too.
- The arrow keys, `Home` and `End` skip disabled tabs. A disabled tab is marked `aria-disabled` and never takes the tab stop. When the selected tab is disabled, or no tab matches `value`, the first enabled tab takes it, so the list can still be reached.
- `Tabs.List` is the `tablist` (marked `aria-orientation="vertical"` in a `vertical` layout), each `Tabs.Tab` is a `tab` with `aria-selected`, and each `Tabs.Content.Item` is a `tabpanel`. A tab names its panel in `aria-controls` and a panel names its tab in `aria-labelledby`, so the panel is announced with the tab's label. The ids are generated, and when you pass your own `id` to a tab or a panel, the other side follows it.
- Panels aren't focusable themselves. When a panel holds nothing focusable, pass it `tabIndex={0}` so `Tab` moves from the tab list into it.
- The focus ring shows for keyboard focus only, drawn inside the tab in Bulma's focus color, width and style (`--bulma-focus-h`, `--bulma-focus-s`, `--bulma-focus-l`, `--bulma-focus-width`, `--bulma-focus-style`). It comes from the bestax extras (`extras.css`, or `bestax.css`, which includes them), the same styles that show and hide the panels.
- Built from `Tabs.Item` with links inside, as in most examples above, the tabs are Bulma navigation and none of this applies: each link is its own tab stop and keeps the browser's link behavior.
- Use clear text or icons with labels for each tab, and provide `aria-label` or screen-reader text for icon-only tabs.

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

| Prop           | Type                                                                                                                               | Default | Description                                                                                                                                                                                                                                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `align`        | `'centered'` \| `'right'` \| `'left'`                                                                                              | —       | Tab alignment.                                                                                                                                                                                                                                                                                                                                |
| `size`         | `'small'` \| `'medium'` \| `'large'`                                                                                               | —       | Tab size.                                                                                                                                                                                                                                                                                                                                     |
| `isFullwidth`  | `boolean`                                                                                                                          | `false` | Tabs expand to fill the horizontal space.                                                                                                                                                                                                                                                                                                     |
| `isFullWidth`  | `boolean`                                                                                                                          | `false` | **Deprecated.** Use `isFullwidth` instead — `isFullwidth` wins if both are set. Tabs expand to fill the horizontal space.                                                                                                                                                                                                                     |
| `fullwidth`    | `boolean`                                                                                                                          | `false` | **Deprecated.** Use `isFullwidth` instead — `isFullwidth` wins if both are set. Tabs expand to fill the horizontal space.                                                                                                                                                                                                                     |
| `boxed`        | `boolean`                                                                                                                          | `false` | Tabs use the boxed style.                                                                                                                                                                                                                                                                                                                     |
| `toggle`       | `boolean`                                                                                                                          | `false` | Tabs use the toggle style.                                                                                                                                                                                                                                                                                                                    |
| `rounded`      | `boolean`                                                                                                                          | `false` | Tabs use the rounded toggle style (only with `toggle`).                                                                                                                                                                                                                                                                                       |
| `color`        | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'dark'` \| `'light'` \| `'white'` | —       | **Deprecated.** No `.tabs.is-<color>` CSS exists; the prop renders unstyled and will be removed in the next major version. Bulma color for tab underlines and active state (renders `is-<color>`). Bulma ships no tabs color CSS, so this prop has never had a visual effect for any value. Passing it logs a console warning in development. |
| `value`        | `number`                                                                                                                           | —       | Controlled active tab index.                                                                                                                                                                                                                                                                                                                  |
| `onChange`     | `(index: number) => void`                                                                                                          | —       | Callback when active tab changes. Called with the tab's `index` when a `Tabs.Tab` is activated: clicked, or Enter or Space pressed on it. Moving focus with the arrow keys, Home or End does not call it, because activation is manual: focus moves freely and the selected tab changes only when the user picks one.                         |
| `defaultValue` | `number`                                                                                                                           | `0`     | Initial active tab index (uncontrolled).                                                                                                                                                                                                                                                                                                      |
| `vertical`     | `boolean`                                                                                                                          | `false` | Renders tabs vertically. With a `Tabs.Content`, the tab list is also marked `aria-orientation="vertical"` and ArrowUp and ArrowDown move focus between tabs, alongside ArrowLeft and ArrowRight (the layout stacks horizontally on mobile).                                                                                                   |
| `side`         | `'left'` \| `'right'`                                                                                                              | —       | Side placement when `vertical` is true.                                                                                                                                                                                                                                                                                                       |
| `expanded`     | `boolean`                                                                                                                          | `false` | Makes tabs take up the full width equally.                                                                                                                                                                                                                                                                                                    |
| `className`    | `string`                                                                                                                           | —       | Additional CSS classes.                                                                                                                                                                                                                                                                                                                       |
| `children`     | `React.ReactNode`                                                                                                                  | —       | Tab list and tab items.                                                                                                                                                                                                                                                                                                                       |
| `...`          | All standard `<div>` attributes and Bulma helper props                                                                             | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                             |

**Subcomponents:**

- `Tabs.List`: The `<ul>` container for tab items.
- `Tabs.Tab`: Individual tab button. Consumes Tabs context for active state management. Renders `<a>` internally — consumers provide only the label text/children. Inside a `Tabs` it takes part in the tab list's keyboard support and links to the `Tabs.Content.Item` with the same `index`.
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

| Prop           | Type                                                                       | Default   | Description                                                                                                                                                           |
| -------------- | -------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index`        | `number`                                                                   | —         | **Required.** Tab index for matching with content.                                                                                                                    |
| `disabled`     | `boolean`                                                                  | `false`   | Disables the tab. A disabled tab is marked `aria-disabled`, cannot be activated, is skipped by the arrow keys, Home and End, and never holds the tab list's tab stop. |
| `icon`         | `string`                                                                   | —         | Icon name for the tab.                                                                                                                                                |
| `iconLibrary`  | `'fa'` \| `'mdi'` \| `'ion'` \| `'material-icons'` \| `'material-symbols'` | —         | Icon library to use.                                                                                                                                                  |
| `iconVariant`  | `string`                                                                   | —         | Icon style variant (e.g., 'solid', 'outlined', 'rounded').                                                                                                            |
| `iconSize`     | `'small'` \| `'medium'` \| `'large'`                                       | `'small'` | Size of the tab icon.                                                                                                                                                 |
| `iconFeatures` | `string` \| `string[]`                                                     | —         | Additional icon modifiers.                                                                                                                                            |
| `className`    | `string`                                                                   | —         | Additional CSS classes.                                                                                                                                               |
| `children`     | `React.ReactNode`                                                          | —         | Tab label content.                                                                                                                                                    |
| `id`           | `string`                                                                   | —         | The tab's id, which its panel names in `aria-labelledby`. Generated inside a `Tabs` when omitted; a passed `id` is used and the panel follows it.                     |
| `onKeyDown`    | `React.KeyboardEventHandler<HTMLLIElement>`                                | —         | Called before the tab handles the key; call `event.preventDefault()` to stop the tab handling it.                                                                     |
| `...`          | All standard `<li>` attributes                                             | —         |                                                                                                                                                                       |

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

| Prop        | Type                            | Default | Description                                                                                                                                   |
| ----------- | ------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `index`     | `number`                        | —       | **Required.** Tab index for matching with content.                                                                                            |
| `className` | `string`                        | —       | Additional CSS classes.                                                                                                                       |
| `children`  | `React.ReactNode`               | —       | Panel content.                                                                                                                                |
| `id`        | `string`                        | —       | The panel's id, which its tab names in `aria-controls`. Generated inside a `Tabs` when omitted; a passed `id` is used and the tab follows it. |
| `tabIndex`  | `number`                        | —       | The panel is not focusable by default. Pass `0` when it holds nothing focusable, so Tab moves from the tab list into it.                      |
| `...`       | All standard `<div>` attributes | —       |                                                                                                                                               |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Tabs` registers these variables on its own `.tabs` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                         | Sass Variable                                 | Default                     |
| ---------------------------------------------------- | --------------------------------------------- | --------------------------- |
| `--bulma-tabs-vertical-min-width` ‡                  | `$tabs-vertical-min-width`                    | `200px`                     |
| `--bulma-tabs-vertical-border-color` ‡               | `$tabs-vertical-border-color`                 | `var(--bulma-border)`       |
| `--bulma-tabs-vertical-border-width` ‡               | `$tabs-vertical-border-width`                 | `1px`                       |
| `--bulma-tabs-content-padding` ‡                     | `$tabs-content-padding`                       | `1rem`                      |
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

‡ declared on a constituent element: values set via `className`, the `style` prop, or an ancestor are only inherited and lose — target the declaring element in your CSS.

<!-- /bestax:generated cssvars -->
