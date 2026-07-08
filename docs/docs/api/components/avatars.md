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

| Prop        | Type                                     | Default | Description                                                                        |
| ----------- | ---------------------------------------- | ------- | ---------------------------------------------------------------------------------- |
| `max`       | `number`                                 | —       | Show only the first `max` children, replacing the rest with a "+N" surplus avatar. |
| `size`      | `AvatarProps['size']`                    | —       | Uniform size applied to every child `Avatar` (and the surplus avatar).             |
| `spacing`   | `'sm' \| 'md' \| 'lg'`                   | `'md'`  | Overlap amount between avatars.                                                    |
| `className` | `string`                                 | —       | Additional CSS classes.                                                            |
| `children`  | `React.ReactNode`                        | —       | `Avatar` elements to render inside the group.                                      |
| ...         | All standard HTML and Bulma helper props |         | (See [Helper Props](../helpers/usebulmaclasses))                                   |

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
