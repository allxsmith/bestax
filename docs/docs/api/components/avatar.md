---
title: Avatar
sidebar_label: Avatar
---

# Avatar

## Overview

The `Avatar` component represents a person or entity as a compact image. It falls back
automatically from a photo (`src`) to initials (from `name`/`initials`) to a custom `icon`, and
finally to a generic default icon — so you never have to hand-roll the broken-image or
missing-photo case.

---

## Import

```tsx
import { Avatar } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop         | Type                                                                                                             | Default    | Description                                                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `src`        | `string`                                                                                                         | —          | Image URL. On load error (or if absent), falls back to initials, then `icon`.                                                        |
| `alt`        | `string`                                                                                                         | —          | Alternate text for the image (used for the accessible name in every render mode).                                                    |
| `name`       | `string`                                                                                                         | —          | Derives initials and a deterministic background color when no `src` is shown.                                                        |
| `initials`   | `string`                                                                                                         | —          | Explicit initials override (else derived from `name`).                                                                               |
| `icon`       | `React.ReactNode`                                                                                                | —          | Final fallback, rendered when there is no `src`, `name`, or `initials`.                                                              |
| `size`       | `'16x16' \| '24x24' \| '32x32' \| '48x48' \| '64x64' \| '96x96' \| '128x128' \| number`                          | —          | Preset size, or a pixel size when a number.                                                                                          |
| `shape`      | `'circle' \| 'rounded' \| 'square'`                                                                              | `'circle'` | Avatar shape.                                                                                                                        |
| `color`      | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger' \| 'black' \| 'dark' \| 'light' \| 'white'` | —          | Background color for initials/icon avatars (else auto-derived from `name`).                                                          |
| `as`         | `React.ElementType`                                                                                              | —          | Element/component to render as. Defaults to `'a'` when `href` is set, else `'figure'`.                                               |
| `href`       | `string`                                                                                                         | —          | When set, renders the avatar as a link.                                                                                              |
| `imageProps` | `React.ImgHTMLAttributes<HTMLImageElement>`                                                                      | —          | Extra props forwarded to the underlying `<img>` (e.g. `loading`, `crossOrigin`); its `onError` is chained before the fallback fires. |
| `className`  | `string`                                                                                                         | —          | Additional CSS classes.                                                                                                              |
| ...          | All standard HTML and Bulma helper props                                                                         |            | (See [Helper Props](../helpers/usebulmaclasses))                                                                                     |

---

## Usage

### Photo with automatic fallback

If the image fails to load, `Avatar` swaps to initials derived from `name` automatically.

```tsx live
<Avatar
  src="https://bulma.io/assets/images/placeholders/128x128.png"
  name="Ada Lovelace"
  size="64x64"
/>
```

### Initials

No `src` — initials render on a deterministic auto background color derived from `name`.

```tsx live
<Block>
  <Avatar name="Ada Lovelace" />
  <Avatar name="Grace Hopper" />
  <Avatar name="Katherine Johnson" />
</Block>
```

### Icon fallback

```tsx live
<Avatar icon={<Icon name="user" />} color="info" shape="rounded" />
```

### Shapes

```tsx live
<Block>
  <Avatar name="Circle" shape="circle" />
  <Avatar name="Rounded" shape="rounded" />
  <Avatar name="Square" shape="square" />
</Block>
```

### Sizes

Preset sizes mirror `Image`'s fixed-size list; a `number` renders a pixel size.

```tsx live
<Block>
  <Avatar name="Ada Lovelace" size="24x24" />
  <Avatar name="Ada Lovelace" size="32x32" />
  <Avatar name="Ada Lovelace" size="48x48" />
  <Avatar name="Ada Lovelace" size="64x64" />
  <Avatar name="Ada Lovelace" size={20} />
</Block>
```

### Clickable avatar

```tsx live
<Avatar name="Ada Lovelace" href="https://bestax.io" />
```

### Forwarding props to the image

`imageProps` is spread onto the underlying `<img>` — handy for native attributes like
`loading`, `crossOrigin`, or `referrerPolicy`. A custom `onError` is chained _before_ the
automatic initials/icon fallback runs.

```tsx live
<Avatar
  src="https://bulma.io/assets/images/placeholders/128x128.png"
  name="Ada Lovelace"
  size="64x64"
  imageProps={{ loading: 'lazy' }}
/>
```

---

## Accessibility

- Image avatars use `alt` (falling back to `name`) for their accessible name.
- Initials/icon avatars expose `role="img"` and `aria-label` (from `alt`/`name`) — unless
  rendered as a link or button, where the native link/button role and `aria-label` are used
  instead.
- The default fallback icon is `aria-hidden`.

---

## See also

- [Avatars](./avatars) — an overlapping group of `Avatar`s with a surplus bubble.
- [Badge](./badge) — a status/count indicator that overlays an `Avatar` (or any element).
