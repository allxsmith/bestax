---
title: Avatars
sidebar_label: Avatars
---

# Avatars

## Overview

The `Avatars` component renders an overlapping/stacked group of `Avatar`s, the "members" list pattern.

Clamp the visible count with `max`; the overflow renders as a single `+N` surplus avatar. It
follows the library's sibling plural container convention ([`Tags`](../elements/tags),
[`Buttons`](../elements/buttons)).

---

## Import

```tsx
import { Avatars, Avatar } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                     | Default | Description                                                                                                                                                        |
| ----------- | ---------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `max`       | `number`                                 | —       | Show only the first `max` children, replacing the overflow with a "+N" surplus avatar. A single overflow avatar is shown directly rather than as a pointless "+1". |
| `size`      | `AvatarProps['size']`                    | —       | Uniform size applied to every child `Avatar` (and the surplus avatar).                                                                                             |
| `shape`     | `'circle' \| 'rounded' \| 'square'`      | —       | Uniform shape applied to every child `Avatar` (and the surplus avatar); a child's own `shape` wins when this is unset.                                             |
| `spacing`   | `'sm' \| 'md' \| 'lg'`                   | `'md'`  | Overlap amount between avatars.                                                                                                                                    |
| `className` | `string`                                 | —       | Additional CSS classes.                                                                                                                                            |
| `children`  | `React.ReactNode`                        | —       | `Avatar` elements to render inside the group.                                                                                                                      |
| ...         | All standard HTML and Bulma helper props |         | (See [Helper Props](../helpers/usebulmaclasses))                                                                                                                   |

`Avatar` is also attached as a compound static (`Avatars.Avatar`), so you can import just the
container.

---

## Usage

### Default

```tsx live
<Avatars>
  <Avatar name="Ada Lovelace" />
  <Avatar name="Grace Hopper" />
  <Avatar name="Katherine Johnson" />
</Avatars>
```

### Clamped with a surplus bubble

```tsx live
<Avatars max={3} size="48x48">
  <Avatar name="Ada Lovelace" />
  <Avatar name="Grace Hopper" />
  <Avatar name="Katherine Johnson" />
  <Avatar name="Margaret Hamilton" />
  <Avatar name="Radia Perlman" />
</Avatars>
```

### Uniform shape

`shape` applies to every child (and the surplus avatar); a child that sets its own `shape` keeps it.

```tsx live
<Avatars max={4} shape="square">
  <Avatar name="Ada Lovelace" />
  <Avatar name="Grace Hopper" />
  <Avatar name="Katherine Johnson" />
  <Avatar name="Margaret Hamilton" />
  <Avatar name="Radia Perlman" />
</Avatars>
```

### Compound static

```tsx live
<Avatars>
  <Avatars.Avatar name="Ada Lovelace" />
  <Avatars.Avatar name="Grace Hopper" />
  <Avatars.Avatar name="Katherine Johnson" />
</Avatars>
```

### Spacing

```tsx live
<Block>
  <Avatars spacing="sm">
    <Avatar name="Ada Lovelace" />
    <Avatar name="Grace Hopper" />
    <Avatar name="Katherine Johnson" />
  </Avatars>
  <Avatars spacing="lg">
    <Avatar name="Ada Lovelace" />
    <Avatar name="Grace Hopper" />
    <Avatar name="Katherine Johnson" />
  </Avatars>
</Block>
```

---

## See also

- [Avatar](./avatar) — the individual avatar this component groups.
- [Badge](./badge) — a status/count indicator overlay.
