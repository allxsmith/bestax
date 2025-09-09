---
title: Icon
sidebar_label: Icon
---

# Icon

## Overview

The `Icon` component is a Bulma-styled wrapper for displaying icons from various libraries (Font Awesome, Material Design Icons, Ionicons, Google Material Icons, Material Symbols, etc.). It handles Bulma sizing, colors, helper props, and accessibility. You can use it standalone or inside other components (like `Button`, `Tag`, or `IconText`).

:::info
Font Awesome is the default icon library, but you can use Material Design Icons, Ionicons, Google Material Icons, or Material Symbols by changing the `library` prop. For setup instructions, see [Alternative Icons](/docs/guides/getting-started/alternative-icons).
:::

---

## Import

```tsx
import { Icon } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop              | Type                                                                                                                                                                                                                                                                                     | Default  | Description                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------ |
| `className`       | `string`                                                                                                                                                                                                                                                                                 | —        | Additional CSS classes.                                            |
| `textColor`       | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —        | Text color helper.                                                 |
| `color`           | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger'`                                                                                                                                                                                                                    | —        | Bulma color modifier for the icon.                                 |
| `bgColor`         | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —        | Background color helper.                                           |
| `name`            | `string`                                                                                                                                                                                                                                                                                 |          | The icon name (without library prefix, e.g. `'star'`).             |
| `library`         | `'fa' \| 'mdi' \| 'ion' \| 'material-icons' \| 'material-symbols'`                                                                                                                                                                                                                       | `'fa'`   | The icon library to use.                                           |
| `variant`         | `string`                                                                                                                                                                                                                                                                                 | —        | Icon style variant (e.g. `'solid'`, `'outlined'`, `'rounded'`).    |
| `features`        | `string \| string[]`                                                                                                                                                                                                                                                                     | —        | Additional modifiers (e.g. `'fa-lg'`, `'fa-spin'`, `'is-size-1'`). |
| `libraryFeatures` | `string \| string[]`                                                                                                                                                                                                                                                                     | —        | **DEPRECATED:** Use `variant` and `features` instead.              |
| `size`            | `'small' \| 'medium' \| 'large'`                                                                                                                                                                                                                                                         | —        | Size modifier for the icon container.                              |
| `ariaLabel`       | `string`                                                                                                                                                                                                                                                                                 | `'icon'` | ARIA label for accessibility.                                      |
| `style`           | `object`                                                                                                                                                                                                                                                                                 | —        | Inline style object.                                               |
| ...               | All standard `<span>` and Bulma helper props                                                                                                                                                                                                                                             |          | (See [Helper Props](../helpers/usebulmaclasses))                   |

---

## Usage

### Default Icon (Font Awesome)

The simplest use of the `Icon` component, displaying a Font Awesome star icon. The `ariaLabel` prop provides an accessible name for the icon.

```tsx live
<Icon name="star" ariaLabel="Star icon" />
```

### Font Awesome Large

You can use the `variant` and `features` props for Font Awesome-specific styling. In this example, `variant="solid"` specifies the icon style and `features="fa-2x"` increases the icon size to 2x its normal size.

```tsx live
<Icon
  name="star"
  variant="solid"
  features="fa-2x"
  ariaLabel="Star icon large"
/>
```

### Spinning Icon

The `features` prop can be used to add Font Awesome modifiers like `fa-spin` for animated icons. This example shows a spinning loading icon with increased size.

```tsx live
<Icon
  name="spinner"
  variant="solid"
  features={['fa-spin', 'fa-2x']}
  ariaLabel="Loading spinner"
/>
```

### Bordered

You can add a border to the icon using Font Awesome's `fa-border` class via the `features` prop. This is useful for icons that need to stand out or be visually separated.

```tsx live
<Icon
  name="star"
  size="large"
  variant="solid"
  features={['fa-border', 'fa-2x']}
  ariaLabel="Star bordered"
/>
```

### With Text Color

Set the icon color using the `textColor` prop. For example, `textColor="primary"` applies Bulma's primary color to the icon.

```tsx live
<Icon
  name="star"
  textColor="primary"
  ariaLabel="Star icon with primary text color"
/>
```

### With Margin

You can use Bulma spacing helpers like `m` to add margin around the icon for better layout control.

```tsx live
<Icon name="star" m="2" ariaLabel="Star icon with margin" />
```

### With Container Size

The `size` prop adjusts the size of the icon container. Use `size="large"` for a bigger icon wrapper, which is useful for emphasis or visual hierarchy.

```tsx live
<Icon name="star" size="large" ariaLabel="Star icon large container" />
```

### Google Material Icons

Use Google's official Material Icons with different styles available through `variant`.

```tsx live
<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
  <Icon library="material-icons" name="favorite" ariaLabel="Filled heart" />
  <Icon
    library="material-icons"
    name="favorite"
    variant="outlined"
    ariaLabel="Outlined heart"
  />
  <Icon
    library="material-icons"
    name="favorite"
    variant="round"
    ariaLabel="Round heart"
  />
</div>
```

### Material Symbols

Google's newest icon system with modern design and comprehensive coverage.

```tsx live
<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
  <Icon
    library="material-symbols"
    name="settings"
    ariaLabel="Settings outlined"
  />
  <Icon
    library="material-symbols"
    name="settings"
    variant="rounded"
    ariaLabel="Settings rounded"
  />
  <Icon
    library="material-symbols"
    name="settings"
    variant="sharp"
    ariaLabel="Settings sharp"
  />
</div>
```

### Material Design Icons

Comprehensive Material Design icon library with thousands of icons.

```tsx live
<Icon library="mdi" name="home" ariaLabel="Material Design home icon" />
```

### Ionicons

Modern icon library with web components support, perfect for mobile-first applications.

```tsx live
<Icon library="ion" name="settings" ariaLabel="Ionicons settings icon" />
```

---

## Accessibility

- **ARIA label:** Always set a meaningful `ariaLabel` for screen readers (default `'icon'`).
- **Keyboard:** Icon is decorative by default. If interactive, use with `Button` or `a` and add ARIA as needed.
- **Color and size:** Use `textColor`, `bgColor`, and `size` for accessible, themeable icons.

:::note
For purely decorative icons, you can use `aria-hidden="true"` via the `...rest` props.
:::

---

## Related Components

- [`IconText`](./icontext.md): For icons with adjacent text.
- [`Button`](./button.md): For buttons with icons.
- [`Card`](../components/card.md): For cards with header icons and content.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Bulma Icon Documentation](https://bulma.io/documentation/elements/icon/)
- [Font Awesome Docs](https://fontawesome.com/docs/web/use-with/react/)
- [Storybook: Icon Stories](https://bestax.cc/storybook/?path=/story/elements-icon--default)
