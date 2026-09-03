---
title: IconText
sidebar_label: IconText
description: The `IconText` component provides a Bulma-styled horizontal arrangement of one or more `Icon` components and optional text.
---

# IconText

## Overview

<!-- bestax:generated overview -->

The `IconText` component provides a Bulma-styled horizontal arrangement of one or more `Icon` components and optional text.

<!-- /bestax:generated overview -->

Use it for icon-and-label patterns, ratings, button content, or any visual+text UI. Supports all Bulma helper props for spacing, color, and layout.

:::tip
Use `IconText` to keep icons and text vertically aligned and spaced, as recommended by Bulma.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { IconText } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Single Icon + Text

A basic usage of the `IconText` component with a single icon and text. The `iconProps` object receives the icon's name and an `ariaLabel` for accessibility.

```tsx live
<IconText iconProps={{ library: 'fa', name: 'star', ariaLabel: 'Star icon' }}>
  Star
</IconText>
```

### With Text Color

You can customize the text color using Bulma's color helpers. This example shows a primary colored text.

```tsx live
<IconText
  iconProps={{ library: 'fa', name: 'star', ariaLabel: 'Star icon' }}
  textColor="primary"
>
  Star
</IconText>
```

### With Margin

You can use Bulma spacing helpers like `m` to add margin around the `IconText` component for better layout control.

```tsx live
<IconText
  iconProps={{ library: 'fa', name: 'star', ariaLabel: 'Star icon' }}
  m="2"
>
  Star
</IconText>
```

### In a Button

Use `IconText` inside a button to combine an icon and label, ensuring proper alignment and spacing.

```tsx live
<Button color="primary">
  <IconText
    iconProps={{
      library: 'fa',
      name: 'check',
      ariaLabel: 'Check icon',
    }}
  >
    Click Me
  </IconText>
</Button>
```

### In a Notification

Place `IconText` inside a notification to visually pair an icon with a message, using color and margin helpers for emphasis.

```tsx live
<Notification color="info">
  <IconText
    iconProps={{
      library: 'fa',
      name: 'info-circle',
      ariaLabel: 'Info icon',
      textColor: 'dark',
    }}
    m="1"
  >
    Info Notification
  </IconText>
</Notification>
```

### In a Tag

Use `IconText` inside a tag for labeled icons, such as status indicators or badges.

```tsx live
<Tag color="success" size="medium">
  <IconText
    iconProps={{
      library: 'fa',
      name: 'check',
      ariaLabel: 'Check icon',
    }}
  >
    Success
  </IconText>
</Tag>
```

### Multiple Icons and Text

The `items` prop allows you to render a sequence of icons and optional text, perfect for visualizing progress, routes, or multi-step processes.

```tsx live
<IconText
  items={[
    {
      iconProps: { library: 'fa', name: 'train', ariaLabel: 'Train icon' },
      text: 'Paris',
    },
    {
      iconProps: {
        library: 'fa',
        name: 'arrow-right',
        ariaLabel: 'Arrow right icon',
      },
      text: 'Budapest',
    },
    {
      iconProps: {
        library: 'fa',
        name: 'arrow-right',
        ariaLabel: 'Arrow right icon',
      },
      text: 'Bucharest',
    },
    {
      iconProps: {
        library: 'fa',
        name: 'arrow-right',
        ariaLabel: 'Arrow right icon',
      },
      text: 'Istanbul',
    },
    {
      iconProps: {
        library: 'fa',
        name: 'flag-checkered',
        ariaLabel: 'Finish icon',
      },
    },
  ]}
  mx="1"
/>
```

### Star Rating Example

This example uses the `items` prop to display a star rating with icons and text, demonstrating how to build composite icon+text UIs.

:::tip Use the Rate Component for Star Ratings
This example demonstrates IconText with multiple icon items. For actual star rating functionality (hover, click, keyboard, precision, etc.), use the dedicated [`Rate`](/docs/api/form/rate) component:

```tsx live
<Rate defaultValue={3.5} color="warning" precision={0.5} showScore />
```

:::

```tsx live
<IconText
  items={[
    {
      iconProps: {
        library: 'fa',
        name: 'star',
        ariaLabel: 'Star icon',
      },
    },
    {
      iconProps: {
        library: 'fa',
        name: 'star',
        ariaLabel: 'Star icon',
      },
    },
    {
      iconProps: {
        library: 'fa',
        name: 'star',
        ariaLabel: 'Star icon',
      },
    },
    {
      iconProps: {
        library: 'fa',
        name: 'star-half-alt',
        ariaLabel: 'Half star icon',
      },
    },
    {
      iconProps: {
        library: 'fa',
        name: 'star',
        variant: 'regular',
        ariaLabel: 'Empty star icon',
      },
      text: '3.5/5',
    },
  ]}
  textColor="warning"
  mx="1"
/>
```

### With Flex

The `display` prop can be used to apply Bulma's flexbox helpers, allowing for flexible alignment and layout of icon and text content.

```tsx live
<IconText
  iconProps={{
    library: 'fa',
    name: 'info-circle',
    ariaLabel: 'Info icon',
    textColor: 'info',
  }}
  display="flex"
>
  Information
</IconText>
```

---

### Compound (dot-notation) usage

`Icon` is also available as `IconText.Icon`, so an icon-and-text pairing can be composed from the single `IconText` import.

```tsx live
<IconText>
  <IconText.Icon name="star" ariaLabel="star icon" />
  <span>Starred</span>
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
- [Storybook: IconText Stories](https://bestax.io/storybook/?path=/story/elements-icontext--default)

---

## Props

<!-- bestax:generated props -->

| Prop        | Type                                                                            | Default | Description                                                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className` | `string`                                                                        | —       | Additional CSS classes to apply.                                                                                                                                                                                                         |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Text color helper.                                                                                                                                                                                                                       |
| `color`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Text color alias: renders `has-text-<color>`, exactly like `textColor`. Not a filled variant (no `.icon-text.is-<color>` CSS exists). Prefer `textColor`, which takes precedence when both are set; use `bgColor` for a colored surface. |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Background color helper.                                                                                                                                                                                                                 |
| `iconProps` | `IconProps` \| `React.ReactNode`                                                | —       | Props for a single Icon component, or a custom node, for single icon mode.                                                                                                                                                               |
| `children`  | `React.ReactNode`                                                               | —       | Text for a single icon (for single icon mode).                                                                                                                                                                                           |
| `items`     | `{ iconProps: IconProps \| React.ReactNode; text?: string }[]`                  | —       | Array of icon/text pairs (for multiple icons mode).                                                                                                                                                                                      |
| `...`       | All standard `<span>` attributes and Bulma helper props                         | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                        |

**Subcomponents:**

- [`IconText.Icon`](icon.md): The `Icon` component is a Bulma-styled wrapper for displaying icons from various libraries (Font Awesome, Material Design Icons, Ionicons, Google Material Icons, Material Symbols, etc.).

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`IconText` registers these variables on its own `.icon-text` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                     | Sass Variable             | Default  |
| -------------------------------- | ------------------------- | -------- |
| `--bulma-icon-dimensions`        | `$icon-dimensions`        | `1.5rem` |
| `--bulma-icon-dimensions-small`  | `$icon-dimensions-small`  | `1rem`   |
| `--bulma-icon-dimensions-medium` | `$icon-dimensions-medium` | `2rem`   |
| `--bulma-icon-dimensions-large`  | `$icon-dimensions-large`  | `3rem`   |
| `--bulma-icon-text-spacing`      | `$icon-text-spacing`      | `0.25em` |

<!-- /bestax:generated cssvars -->
