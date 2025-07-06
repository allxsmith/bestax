---
title: Container
sidebar_label: Container
---

# Container

## Overview

The `Container` component provides a responsive and flexible layout wrapper for your Bulma React UI. It supports all Bulma container features, including fixed and fluid layouts, different breakpoints, widescreen/fullhd options, and helper props for colors, spacing, and more. It is typically used to center and constrain content horizontally within your page.

:::tip
Use `Container` to ensure your content maintains consistent margins and maximum width across different devices and breakpoints.
:::

---

## Import

```tsx
import { Container } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop         | Type                                                                                                                                                                                                                                                                                     | Default | Description                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------- |
| `fluid`      | `boolean`                                                                                                                                                                                                                                                                                | `false` | Makes the container full-width with a 32px gap on each side.                      |
| `widescreen` | `boolean`                                                                                                                                                                                                                                                                                | `false` | Makes the container full-width until the `widescreen` breakpoint.                 |
| `fullhd`     | `boolean`                                                                                                                                                                                                                                                                                | `false` | Makes the container full-width until the `fullhd` breakpoint.                     |
| `breakpoint` | `'tablet' \| 'desktop' \| 'widescreen'`                                                                                                                                                                                                                                                  | —       | Responsive breakpoint for container (`is-tablet`, `is-desktop`, `is-widescreen`). |
| `isMax`      | `boolean`                                                                                                                                                                                                                                                                                | `false` | Uses Bulma's `is-max-*` class for the specified breakpoint, limiting max width.   |
| `color`      | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger'`                                                                                                                                                                                                                    | —       | Bulma color modifier for text.                                                    |
| `textColor`  | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Text color helper.                                                                |
| `bgColor`    | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Background color helper.                                                          |
| `className`  | `string`                                                                                                                                                                                                                                                                                 | —       | Additional CSS classes.                                                           |
| `children`   | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | Content inside the container.                                                     |
| ...          | All standard `<div>` and Bulma helper props                                                                                                                                                                                                                                              |         | (See [Helper Props](../helpers/usebulmaclasses))                                  |

---

## Usage

### Default Container

```tsx
<Container>
  <Notification color="primary">
    By default the container is <strong>centered</strong> on desktop viewports
    and up.
  </Notification>
</Container>
```

---

### Widescreen Container

```tsx
<Container widescreen>
  <Notification color="primary">
    If <code>breakpoint="widescreen"</code> the container is{' '}
    <strong>fullwidth</strong> <em>until</em> the <code>widescreen</code>{' '}
    breakpoint.
  </Notification>
</Container>
```

---

### FullHD Container

```tsx
<Container fullhd>
  <Notification color="primary">
    If <code>breakpoint="fullhd"</code> the container is{' '}
    <strong>fullwidth</strong> <em>until</em> the <code>fullhd</code>{' '}
    breakpoint.
  </Notification>
</Container>
```

---

### Max Tablet Width

```tsx
<Container breakpoint="tablet" isMax>
  <Notification color="primary">
    If the container has <code>breakpoint="tablet"</code> and <code>isMax</code>{' '}
    then the container will have a <code>max-width</code> of{' '}
    <code>tablet - container offset</code>.
  </Notification>
</Container>
```

---

### Max Width Desktop

```tsx
<Container breakpoint="desktop" isMax>
  <Notification color="primary">
    If the container has <code>breakpoint="desktop"</code> and{' '}
    <code>isMax</code> then the container will have a <code>max-width</code> of{' '}
    <code>desktop - container offset</code>.
  </Notification>
</Container>
```

---

### Max Width Widescreen

```tsx
<Container breakpoint="widescreen" isMax>
  <Notification color="primary">
    If the container has <code>breakpoint="widescreen"</code> and{' '}
    <code>isMax</code> then the container will have a <code>max-width</code> of{' '}
    <code>widescreen - container offset</code>.
  </Notification>
</Container>
```

---

### Fluid Container

```tsx
<Container fluid>
  <Notification color="primary">
    If the container has <code>fluid</code> it will expand to the full width of
    the screen, with a small 32px gap on each side.
  </Notification>
</Container>
```

---

## Accessibility

- The container renders as a semantic `<div>` by default.
- Use semantic HTML and accessible children within the container for best practices.

---

## Related Components

- [`Notification`](../elements/notification.md): Useful for demonstrating container layouts.
- [Helper Props](../helpers/usebulmaclasses.md): List of all supported Bulma helper props for spacing, colors, etc.

---

## Additional Resources

- [Bulma Container Documentation](https://bulma.io/documentation/layout/container/)
- [Storybook: Container Stories](https://bestax.cc/storybook/?path=/story/layout-container--default)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Container />` for powerful utility-based styling.
:::
