---
title: IconText
sidebar_label: IconText
---

# IconText

## Overview

The `IconText` component provides a Bulma-styled horizontal arrangement of one or more `Icon` components and optional text. Use it for icon-and-label patterns, ratings, button content, or any visual+text UI. Supports all Bulma helper props for spacing, color, and layout.

:::tip
Use `IconText` to keep icons and text vertically aligned and spaced, as recommended by Bulma.
:::

---

## Import

```tsx
import { IconText } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                                                                                                                                                                                                                                                                     | Default | Description                                               |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------- |
| `className` | `string`                                                                                                                                                                                                                                                                                 | —       | Additional CSS classes.                                   |
| `textColor` | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Text color helper.                                        |
| `color`     | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger'`                                                                                                                                                                                                                    | —       | Bulma color modifier for the icon text group.             |
| `bgColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Background color helper.                                  |
| `iconProps` | `IconProps`                                                                                                                                                                                                                                                                              | —       | Props for a single Icon component (for single icon mode). |
| `children`  | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | Text for a single icon (for single icon mode).            |
| `items`     | `{ iconProps: IconProps, text?: string }[]`                                                                                                                                                                                                                                              | —       | Array of icon/text pairs (for multiple icons mode).       |
| ...         | All standard `<span>` and Bulma helper props                                                                                                                                                                                                                                             |         | (See [Helper Props](../helpers/usebulmaclasses))          |

---

## Usage

### Single Icon + Text

```tsx
<IconText iconProps={{ name: 'fas fa-star', ariaLabel: 'Star icon' }}>
  Star
</IconText>
```

### With Text Color

```tsx
<IconText
  iconProps={{ name: 'fas fa-star', ariaLabel: 'Star icon' }}
  textColor="primary"
>
  Star
</IconText>
```

### With Margin

```tsx
<IconText iconProps={{ name: 'fas fa-star', ariaLabel: 'Star icon' }} m="2">
  Star
</IconText>
```

### Large Icon

```tsx
<IconText
  iconProps={{
    name: 'fas fa-star',
    size: 'large',
    ariaLabel: 'Star icon',
    textColor: 'danger',
  }}
>
  Large Star
</IconText>
```

### In a Button

```tsx
<button className="button is-primary">
  <IconText
    iconProps={{
      name: 'fas fa-check',
      ariaLabel: 'Check icon',
      textColor: 'white',
    }}
  >
    Click Me
  </IconText>
</button>
```

### In a Notification

```tsx
<div className="notification is-info">
  <IconText
    iconProps={{
      name: 'fas fa-info-circle',
      ariaLabel: 'Info icon',
      textColor: 'dark',
    }}
    m="1"
  >
    Info Notification
  </IconText>
</div>
```

### In a Tag

```tsx
<span className="tag is-success is-medium">
  <IconText
    iconProps={{
      name: 'fas fa-check',
      ariaLabel: 'Check icon',
      textColor: 'white',
      size: 'small',
    }}
  >
    Success
  </IconText>
</span>
```

### Multiple Icons and Text

```tsx
<IconText
  items={[
    {
      iconProps: { name: 'fas fa-train', ariaLabel: 'Train icon' },
      text: 'Paris',
    },
    {
      iconProps: { name: 'fas fa-arrow-right', ariaLabel: 'Arrow right icon' },
      text: 'Budapest',
    },
    {
      iconProps: { name: 'fas fa-arrow-right', ariaLabel: 'Arrow right icon' },
      text: 'Bucharest',
    },
    {
      iconProps: { name: 'fas fa-arrow-right', ariaLabel: 'Arrow right icon' },
      text: 'Istanbul',
    },
    { iconProps: { name: 'fas fa-flag-checkered', ariaLabel: 'Finish icon' } },
  ]}
  mx="1"
/>
```

### Star Rating Example

```tsx
<IconText
  items={[
    { iconProps: { name: 'fas fa-star', ariaLabel: 'Star icon' } },
    { iconProps: { name: 'fas fa-star', ariaLabel: 'Star icon' } },
    { iconProps: { name: 'fas fa-star', ariaLabel: 'Star icon' } },
    {
      iconProps: { name: 'fas fa-star-half-alt', ariaLabel: 'Half star icon' },
    },
    {
      iconProps: { name: 'far fa-star', ariaLabel: 'Empty star icon' },
      text: '3.5/5',
    },
  ]}
  textColor="warning"
  mx="1"
/>
```

### With Flex

```tsx
<IconText
  iconProps={{
    name: 'fas fa-info-circle',
    ariaLabel: 'Info icon',
    textColor: 'info',
  }}
  display="flex"
>
  Information
</IconText>
```

---

## Accessibility

- **ARIA labels:** Always set an `ariaLabel` for icons for screen readers.
- **Order:** The icon is visually before the text by default.
- **Keyboard:** If used in a button or link, keyboard accessibility is handled by the parent.

:::info
For star ratings or icon lists, use `items` with `iconProps` and optional `text`.
:::

---

## Related Components

- [`Icon`](./icon.md): For standalone icons.
- [`Button`](./button.md): For icon-button combos.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Bulma IconText Documentation](https://bulma.io/documentation/elements/icon/#icon-text)
- [Storybook: IconText Stories](https://storybook.bestax.cc/?path=/story/elements-icontext--default)
