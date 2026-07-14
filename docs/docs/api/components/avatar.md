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

| Prop         | Type                                                                                                             | Default    | Description                                                                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src`        | `string`                                                                                                         | —          | Image URL. On load error (or if absent), falls back to initials, then `icon`.                                                                        |
| `alt`        | `string`                                                                                                         | —          | Alternate text for the image (used for the accessible name in every render mode). An explicit `alt=""` marks a non-interactive avatar as decorative. |
| `name`       | `string`                                                                                                         | —          | Derives initials and a deterministic background color when no `src` is shown.                                                                        |
| `initials`   | `string`                                                                                                         | —          | Explicit initials override (else derived from `name`).                                                                                               |
| `icon`       | `React.ReactNode`                                                                                                | —          | Final fallback, rendered when there is no `src`, `name`, or `initials`.                                                                              |
| `size`       | `'16x16' \| '24x24' \| '32x32' \| '48x48' \| '64x64' \| '96x96' \| '128x128' \| number`                          | —          | Preset size, or a pixel size when a number.                                                                                                          |
| `shape`      | `'circle' \| 'rounded' \| 'square'`                                                                              | `'circle'` | Avatar shape.                                                                                                                                        |
| `color`      | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger' \| 'black' \| 'dark' \| 'light' \| 'white'` | —          | Background color for initials/icon avatars (else auto-derived from `name`).                                                                          |
| `as`         | `React.ElementType`                                                                                              | —          | Element/component to render as. Defaults to `'a'` when `href` is set, else `'figure'`.                                                               |
| `href`       | `string`                                                                                                         | —          | When set, renders the avatar as a link.                                                                                                              |
| `target`     | `string`                                                                                                         | —          | Anchor target — forwarded only when rendering a link (an `a` or a custom `as` component).                                                            |
| `rel`        | `string`                                                                                                         | —          | Anchor rel — forwarded only when rendering a link (an `a` or a custom `as` component).                                                               |
| `imageProps` | `React.ImgHTMLAttributes<HTMLImageElement>`                                                                      | —          | Extra props forwarded to the underlying `<img>` (e.g. `loading`, `crossOrigin`); its `onError` is chained before the fallback fires.                 |
| `className`  | `string`                                                                                                         | —          | Additional CSS classes.                                                                                                                              |
| ...          | All standard HTML and Bulma helper props                                                                         |            | (See [Helper Props](../helpers/usebulmaclasses))                                                                                                     |

---

## Usage

### Photo with Automatic Fallback

A working photo renders as an image; if the `src` fails to load, `Avatar` swaps to initials
derived from `name` automatically — no broken-image icon.

```tsx live
<Avatars spaced>
  <Avatar src="https://github.com/allxsmith.png" name="Al Smith" size="64x64" />
  <Avatar
    src="https://example.invalid/missing.jpg"
    name="Grace Hopper"
    size="64x64"
  />
</Avatars>
```

### Initials

With no `src`, initials render on a deterministic auto background color derived from `name`.

```tsx live
<Avatars spaced>
  <Avatar name="Ada Lovelace" />
  <Avatar name="Grace Hopper" />
  <Avatar name="Katherine Johnson" />
</Avatars>
```

### Icon Fallback

Pass an `icon` to control the final fallback when there is no photo, name, or initials.

```tsx live
<Avatar icon={<Icon name="user" />} color="info" shape="rounded" />
```

### Shapes

The `shape` prop switches between a circle, a rounded square, and a plain square.

```tsx live
<Avatars spaced>
  <Avatar name="Circle" shape="circle" />
  <Avatar name="Rounded" shape="rounded" />
  <Avatar name="Square" shape="square" />
</Avatars>
```

### Sizes

Preset sizes mirror `Image`'s fixed-size list; a `number` renders a pixel size.

```tsx live
<Avatars spaced>
  <Avatar name="Ada Lovelace" size="24x24" />
  <Avatar name="Ada Lovelace" size="32x32" />
  <Avatar name="Ada Lovelace" size="48x48" />
  <Avatar name="Ada Lovelace" size="64x64" />
  <Avatar name="Ada Lovelace" size={20} />
</Avatars>
```

### Clickable Avatar

Set `href` to render the avatar as a link (or pass `as` for a custom element).

```tsx live
<Avatar name="Ada Lovelace" href="https://bestax.io" />
```

### Forwarding Props to the Image

`imageProps` is spread onto the underlying `<img>` — handy for native attributes like
`loading`, `crossOrigin`, or `referrerPolicy`. A custom `onError` is chained _before_ the
automatic initials/icon fallback runs.

```tsx live
<Avatar
  src="https://github.com/allxsmith.png"
  name="Al Smith"
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
- **Decorative avatars:** pass an explicit `alt=""` when the avatar repeats information
  already visible next to it (e.g. beside the author's name in a comment row). The image
  stays decorative and an initials/icon avatar is skipped entirely (`aria-hidden`), avoiding
  double-speak. The opt-out never applies to a link/button avatar — an interactive element
  always keeps an accessible name (from `name`, or a generic `"Avatar"` fallback).
- A link/button avatar with no `alt`/`name` (e.g. an API that returns only a photo URL) still
  gets an `aria-label` fallback rather than rendering a nameless control.
- `as="button"` defaults to `type="button"`, so a clickable avatar inside a form doesn't
  submit it.
- The default fallback icon is `aria-hidden`.

---

## Related Components

- [`Avatars`](./avatars.md): An overlapping group of `Avatar`s with a "+N" surplus bubble.
- [`Badge`](./badge.md): A status/count indicator that overlays an `Avatar` (or any element).
- [`Image`](../elements/image.md): Bulma's fixed-ratio image container.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: Avatar Stories](https://bestax.io/storybook/?path=/story/components-avatar--photo)
