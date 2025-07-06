---
title: Icon
sidebar_label: Icon
---

# Icon

## Overview

The `Icon` component is a Bulma-styled wrapper for displaying icons from various libraries (Font Awesome, Material Design Icons, Ionicons, etc.). It handles Bulma sizing, colors, helper props, and accessibility. You can use it standalone or inside other components (like `Button`, `Tag`, or `IconText`).

:::info
Font Awesome is the default icon library, but you can use Material or Ionicons by changing the `library` prop.
:::

---

## Import

```tsx
import { Icon } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop              | Type                                                                                                                                                                                                                                                                                     | Default  | Description                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------- |
| `className`       | `string`                                                                                                                                                                                                                                                                                 | —        | Additional CSS classes.                                   |
| `textColor`       | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —        | Text color helper.                                        |
| `color`           | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger'`                                                                                                                                                                                                                    | —        | Bulma color modifier for the icon.                        |
| `bgColor`         | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —        | Background color helper.                                  |
| `name`            | `string`                                                                                                                                                                                                                                                                                 |          | The icon name (without library prefix, e.g. `'star'`).    |
| `library`         | `'fa' \| 'mdi' \| 'ion'`                                                                                                                                                                                                                                                                 | `'fa'`   | The icon library to use.                                  |
| `libraryFeatures` | `string \| string[]`                                                                                                                                                                                                                                                                     | —        | Additional library classes (e.g. `'fa-lg'`, `'fa-spin'`). |
| `size`            | `'small' \| 'medium' \| 'large'`                                                                                                                                                                                                                                                         | —        | Size modifier for the icon container.                     |
| `ariaLabel`       | `string`                                                                                                                                                                                                                                                                                 | `'icon'` | ARIA label for accessibility.                             |
| `style`           | `object`                                                                                                                                                                                                                                                                                 | —        | Inline style object.                                      |
| ...               | All standard `<span>` and Bulma helper props                                                                                                                                                                                                                                             |          | (See [Helper Props](../helpers/usebulmaclasses))          |

---

## Usage

### Default Icon (Font Awesome)

```tsx
<Icon name="star" ariaLabel="Star icon" />
```

### Font Awesome Large

```tsx
<Icon
  name="star"
  libraryFeatures={['fas', 'fa-2x']}
  ariaLabel="Star icon large"
/>
```

### Spinning Icon

```tsx
<Icon
  name="spinner"
  libraryFeatures={['fas', 'fa-spin', 'fa-2x']}
  ariaLabel="Loading spinner"
/>
```

### Bordered and Fixed Width

```tsx
<Icon
  name="star"
  libraryFeatures={['fas', 'fa-fw', 'fa-border', 'fa-lg']}
  ariaLabel="Star bordered fixed width"
/>
```

### With Text Color

```tsx
<Icon
  name="star"
  textColor="primary"
  ariaLabel="Star icon with primary text color"
/>
```

### With Margin

```tsx
<Icon name="star" m="2" ariaLabel="Star icon with margin" />
```

### With Container Size

```tsx
<Icon name="star" size="large" ariaLabel="Star icon large container" />
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
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Bulma Icon Documentation](https://bulma.io/documentation/elements/icon/)
- [Font Awesome Docs](https://fontawesome.com/docs/web/use-with/react/)
- [Storybook: Icon Stories](https://bestax.cc/storybook/?path=/story/elements-icon--default)
