---
title: Avatars
sidebar_label: Avatars
description: The `Avatars` component renders an overlapping/stacked group of `Avatar`s, the "members" list pattern.
---

# Avatars

## Overview

<!-- bestax:generated overview -->

The `Avatars` component renders an overlapping/stacked group of `Avatar`s, the "members" list pattern.

<!-- /bestax:generated overview -->

Clamp the visible count with `max`; the overflow renders as a single `+N` surplus avatar. It
follows the library's sibling plural container convention ([`Tags`](../elements/tags),
[`Buttons`](../elements/buttons)).

---

## Import

<!-- bestax:generated import -->

```tsx
import { Avatars, Avatar } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Default

Children overlap left-to-right, each ringed against the one beneath it.

```tsx live
<Avatars>
  <Avatar name="Ada Lovelace" />
  <Avatar name="Grace Hopper" />
  <Avatar name="Katherine Johnson" />
</Avatars>
```

### Clamped with a Surplus Bubble

Set `max` to cap the visible avatars; the remainder collapse into a single `+N` surplus bubble.

```tsx live
<Avatars max={3} size="48x48">
  <Avatar name="Ada Lovelace" />
  <Avatar name="Grace Hopper" />
  <Avatar name="Katherine Johnson" />
  <Avatar name="Margaret Hamilton" />
  <Avatar name="Radia Perlman" />
</Avatars>
```

### Localized Surplus Label

The surplus bubble always shows `+N`, but its accessible name defaults to English
(`"{N} more"`). Pass `surplusLabel` to localize what screen readers announce.

```tsx live
<Avatars max={3} surplusLabel={count => `${count} weitere`}>
  <Avatar name="Ada Lovelace" />
  <Avatar name="Grace Hopper" />
  <Avatar name="Katherine Johnson" />
  <Avatar name="Margaret Hamilton" />
  <Avatar name="Radia Perlman" />
</Avatars>
```

### Uniform Shape

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

### Spacing

A `'sm' | 'md' | 'lg'` preset controls how far the avatars overlap; each group is stacked here
so they read as separate rows.

```tsx live
<Block display="flex" flexDirection="column">
  <Avatars spacing="sm" mb="4">
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

A `number` sets a pixel overlap directly:

```tsx live
<Avatars spacing={4}>
  <Avatar name="Ada Lovelace" />
  <Avatar name="Grace Hopper" />
  <Avatar name="Katherine Johnson" />
</Avatars>
```

### Non-overlapping (Spaced)

`spaced` lays the avatars out side by side, using `spacing` as the gap instead of an overlap.

```tsx live
<Avatars spaced>
  <Avatar name="Ada Lovelace" />
  <Avatar name="Grace Hopper" />
  <Avatar name="Katherine Johnson" />
</Avatars>
```

### Compound (dot-notation) usage

`Avatars.Avatar` is the same component as `Avatar`, handy when you import only the container.

```tsx live
<Avatars>
  <Avatars.Avatar name="Ada Lovelace" />
  <Avatars.Avatar name="Grace Hopper" />
  <Avatars.Avatar name="Katherine Johnson" />
</Avatars>
```

---

## Accessibility

- `Avatars` is a plain container — each child `Avatar` carries its own accessible name (see
  [Avatar's accessibility notes](./avatar.md#accessibility)).
- The `+N` surplus avatar gets an accessible name of `"{N} more"` (via its `alt`), so assistive
  tech announces how many members are hidden. Localize it with `surplusLabel`, e.g.
  ``surplusLabel={count => `${count} weitere`}``.
- A focused clickable avatar is lifted above its overlapping neighbours so its focus outline
  is never partially covered.
- When the group represents a labelled set (e.g. "Project members"), give the container a
  `role="group"` and an `aria-label` describing it.

---

## Related Components

- [`Avatar`](./avatar.md): The individual avatar this component groups.
- [`Badge`](./badge.md): A status/count indicator overlay.
- [`Tags`](../elements/tags.md): The same sibling-plural-container convention for tags.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: Avatars Stories](https://bestax.io/storybook/?path=/story/components-avatars--default)

---

## Props

<!-- bestax:generated props -->

| Prop           | Type                                                                                                  | Default | Description                                                                                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className`    | `string`                                                                                              | —       | Additional CSS classes to apply.                                                                                                                                                               |
| `max`          | `number`                                                                                              | —       | Show only the first `max` children, replacing the overflow with a "+N" surplus avatar. A single overflow avatar is shown directly rather than as a pointless "+1".                             |
| `size`         | `'16x16'` \| `'24x24'` \| `'32x32'` \| `'48x48'` \| `'64x64'` \| `'96x96'` \| `'128x128'` \| `number` | —       | Uniform size applied to every child `Avatar` (and the surplus avatar).                                                                                                                         |
| `shape`        | `'circle'` \| `'rounded'` \| `'square'`                                                               | —       | Uniform shape applied to every child `Avatar` (and the surplus avatar); a child's own `shape` wins when this is unset.                                                                         |
| `spacing`      | `'sm'` \| `'md'` \| `'lg'` \| `number`                                                                | `'md'`  | Space between avatars: a preset or a pixel `number`. The overlap distance, or the gap when `spaced`. Space between avatars: a `'sm'`/`'md'`/`'lg'` preset or a pixel `number`. Default `'md'`. |
| `spaced`       | `boolean`                                                                                             | `false` | Lay the avatars out side by side (non-overlapping) with `spacing` as the gap. Default `false`.                                                                                                 |
| `surplusLabel` | `(count: number) => string`                                                                           | —       | Builds the surplus avatar's accessible name from the hidden count, for localization. Default: `` `${count} more` ``.                                                                           |
| `children`     | `React.ReactNode`                                                                                     | —       | `Avatar` elements to render inside the group.                                                                                                                                                  |
| `...`          | All standard `<div>` attributes and Bulma helper props                                                | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                              |

**Subcomponents:**

- [`Avatars.Avatar`](avatar.md): The `Avatar` component represents a person or entity as a compact image.

<!-- /bestax:generated props -->

`Avatar` is also attached as a compound static (`Avatars.Avatar`), so you can import just the
container.

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Avatars` registers these variables on its own `.avatars` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                 | Sass Variable         | Default                    |
| ---------------------------- | --------------------- | -------------------------- |
| `--bulma-avatars-ring-color` | `$avatars-ring-color` | `var(--bulma-scheme-main)` |
| `--bulma-avatars-ring-width` | `$avatars-ring-width` | `2px`                      |
| `--bulma-avatars-spacing`    | `$avatars-spacing-md` | `0.75rem`                  |

<!-- /bestax:generated cssvars -->
