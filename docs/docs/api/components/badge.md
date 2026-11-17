---
title: Badge
sidebar_label: Badge
description: The `Badge` component is a small status/count indicator overlaid on the corner of another element, or rendered standalone.
---

# Badge

## Overview

<!-- bestax:generated overview -->

The `Badge` component is a small status/count indicator overlaid on the corner of another element, or rendered standalone.

<!-- /bestax:generated overview -->

Use it for online-status dots, unread counts, or "pending" bubbles — [`Tag`](../elements/tag) is
an inline label; `Badge` is a positioned overlay.

---

## Import

<!-- bestax:generated import -->

```tsx
import { Badge } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Status Dot on an Avatar

A `dot` badge drops the content and renders a small indicator. Pair it with `overlap="circle"`
so it hugs a round avatar. A dot isn't read out, and only its look tells what it means, so say
that in the anchor's name, as the avatar's `alt` does here.

```tsx live
<Badge dot color="success" overlap="circle">
  <Avatar name="Ada Lovelace" alt="Ada Lovelace, online" />
</Badge>
```

### Unread Count

Numeric `content` above `max` renders as `"{max}+"`. The badge reads out only what it shows,
`99+` here, so give the anchor a name that says what it counts, built from the same value as
`content`.

```tsx live
<Badge content={128} max={99} color="danger">
  <Icon name="bell" ariaLabel="Notifications, 128 unread" />
</Badge>
```

### Unread Mail

The classic envelope-with-count pattern; give the icon anchor an `ariaLabel` describing the whole
control.

```tsx live
<Badge content={4} color="danger">
  <Icon name="envelope" ariaLabel="Inbox, 4 unread messages" size="large" />
</Badge>
```

### Badge on a Button

Wrap any element — here a cart button carries its item count, and its name says what the count
is.

```tsx live
<Badge content={3} color="danger" overlap="square">
  <Button color="primary" aria-label="Cart, 3 items">
    <Icon name="shopping-cart" />
    <span>Cart</span>
  </Button>
</Badge>
```

### Positions

Each badge is translated outside its anchor, so a flex row with a gap keeps neighbors from
colliding.

```tsx live
<Block display="flex">
  <Badge content={1} position="top-right" mr="5">
    <Avatar name="A" alt="A, 1 new message" shape="square" />
  </Badge>
  <Badge content={2} position="top-left" mr="5">
    <Avatar name="B" alt="B, 2 new messages" shape="square" />
  </Badge>
  <Badge content={3} position="bottom-right" mr="5">
    <Avatar name="C" alt="C, 3 new messages" shape="square" />
  </Badge>
  <Badge content={4} position="bottom-left">
    <Avatar name="D" alt="D, 4 new messages" shape="square" />
  </Badge>
</Block>
```

### Overlap: Circle vs Square

`overlap` nudges the offset inward for a round child so the badge doesn't float off the edge.

```tsx live
<Block display="flex">
  <Badge content={5} overlap="square" mr="5">
    <Avatar name="Square" alt="Square, 5 new messages" shape="square" />
  </Badge>
  <Badge content={5} overlap="circle">
    <Avatar name="Circle" alt="Circle, 5 new messages" shape="circle" />
  </Badge>
</Block>
```

### Colors

`color` accepts any Bulma color for the pill background.

```tsx live
<Block display="flex">
  <Badge content={1} color="primary" mr="5">
    <Icon name="bell" ariaLabel="Notifications, 1 unread" size="large" />
  </Badge>
  <Badge content={2} color="info" mr="5">
    <Icon name="bell" ariaLabel="Notifications, 2 unread" size="large" />
  </Badge>
  <Badge content={3} color="success" mr="5">
    <Icon name="bell" ariaLabel="Notifications, 3 unread" size="large" />
  </Badge>
  <Badge content={4} color="warning" mr="5">
    <Icon name="bell" ariaLabel="Notifications, 4 unread" size="large" />
  </Badge>
  <Badge content={5} color="danger">
    <Icon name="bell" ariaLabel="Notifications, 5 unread" size="large" />
  </Badge>
</Block>
```

### Pulse

`pulse` adds a "processing" ripple; it no-ops under `prefers-reduced-motion: reduce`.

```tsx live
<Badge dot color="success" pulse overlap="circle">
  <Avatar name="Ada Lovelace" alt="Ada Lovelace, syncing" />
</Badge>
```

### Toggling Visibility

The `invisible` prop hides just the pill while keeping the anchor in place — toggle it with state.

```tsx live
function example() {
  const [muted, setMuted] = useState(false);

  return (
    <Block display="flex" alignItems="center">
      <Badge content={4} color="danger" invisible={muted} mr="5">
        <Icon name="bell" ariaLabel="Notifications, 4 unread" size="large" />
      </Badge>
      <Button onClick={() => setMuted(m => !m)}>
        {muted ? 'Show badge' : 'Hide badge'}
      </Button>
    </Block>
  );
}
```

### Hidden at Zero (unless `showZero`)

A numeric `content` of `0` hides the badge by default; pass `showZero` to keep it.

```tsx live
<Block display="flex">
  <Badge content={0} mr="5">
    <Icon name="bell" ariaLabel="Notifications, none unread" size="large" />
  </Badge>
  <Badge content={0} showZero>
    <Icon name="bell" ariaLabel="Notifications, none unread" size="large" />
  </Badge>
</Block>
```

### Standalone

Omit `children` to render the pill inline in normal flow; `position`/`overlap` are ignored. With
no anchor to name, text beside the badge says what it means.

```tsx live
<Block display="flex" alignItems="center">
  <Badge content={5} color="info" mr="2" />
  <span>new messages</span>
</Block>
```

### Standalone, Beside a Control

A standalone badge is a status, not a control: it isn't in the tab order and takes no keys, so a
click handler on the pill would reach only a pointer. Put the click on a control beside it, here a
`Button` whose name says what the count counts, and let the badge show the count. Helper props,
such as the margin here, land on the pill itself.

```tsx live
function example() {
  const [likes, setLikes] = useState(0);

  return (
    <Block display="flex" alignItems="center">
      <Button onClick={() => setLikes(n => n + 1)} mr="3">
        Like
      </Button>
      <Badge content={likes} showZero color="info" mr="2" />
      <span>likes</span>
    </Block>
  );
}
```

### Standalone, Pulse

`pulse` on a standalone badge anchors its halo to the pill itself rather than the nearest
positioned ancestor.

```tsx live
<Block display="flex" alignItems="center">
  <Badge content={5} color="danger" pulse mr="2" />
  <span>new alerts</span>
</Block>
```

### Text Child

A plain-text `children` value renders at its natural height alongside the badge.

```tsx live
<Badge content={3} color="primary">
  Inbox
</Badge>
```

### Custom Node Content

`content` accepts any `React.ReactNode` — pass an icon or element instead of a count. `max` and
`showZero` are ignored for non-numeric content.

```tsx live
<Badge content={<Icon name="check" />} color="success">
  <Avatar name="Ada Lovelace" alt="Ada Lovelace, verified" />
</Badge>
```

---

## Accessibility

- A count/text badge exposes `role="status"` and an `aria-label` announcing its content.
- At `content={0}` without `showZero`, the pill is visually hidden but stays mounted as an
  empty `role="status"` node, so a later `0 -> 1` change mutates an existing live region and
  is reliably announced (a live region inserted already populated often isn't).
- A bare number in a `role="status"` span is not enough context on its own — put the full
  meaning on the anchor itself, e.g. `<Icon ariaLabel="Inbox, 4 unread messages" />` rather than
  relying on the badge to read out just "4".
- A `dot` badge is `aria-hidden`, and only its look tells what it means, so say what a dot means
  in words in the anchor's name: an `Avatar`'s `alt`, an `Icon`'s `ariaLabel`, or the
  `aria-label` of a button it sits on. A standalone dot has no anchor, so say it in text beside
  the dot, as for any standalone badge. An `Icon` passed as `content` with no `ariaLabel` is
  hidden too, so the badge reads
  nothing; name what it means on the anchor as well.
- A badge is a status, not a control: it isn't in the tab order and takes no keys, so a click
  handler on a standalone badge reaches only a pointer. Put the click on a control beside it, as
  [Standalone, Beside a Control](#standalone-beside-a-control) does.
- `pulse` respects `prefers-reduced-motion: reduce` and renders without animation.
- **Forced colors:** a badge is drawn as a fill with a ring, and forced colors (Windows' contrast
  themes) paints the fill in the page's own color and drops the ring, so bestax's styles draw a
  count or text badge's edge in the system's text color there, and fill a dot in it, with its ring
  in the page's color. A pulsing badge pulses in the same color. A badge's text stays in the
  contrast theme's colors.
- Note the two hide mechanisms differ: the Bulma `visibility="invisible"` helper hides the whole
  wrapper (anchor included), while the `invisible` **prop** hides only the badge pill.

---

## Related Components

- [`Avatar`](./avatar.md): A common element to overlay a `Badge` on.
- [`Tag`](../elements/tag.md): An inline label, versus `Badge`'s positioned overlay.
- [`Icon`](../elements/icon.md): The icon anchors used throughout these examples.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: Badge Stories](https://bestax.io/storybook/?path=/story/components-badge--unread-count)

---

## Props

<!-- bestax:generated props -->

| Prop             | Type                                                                 | Default       | Description                                                                                                                                                                                                                      |
| ---------------- | -------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className`      | `string`                                                             | —             | Additional CSS classes for the root — the wrapper when `children` are present, else the badge pill.                                                                                                                              |
| `badgeClassName` | `string`                                                             | —             | Additional CSS classes applied to the badge pill itself (unprefixed, like `Tooltip`'s `tooltipClassName`).                                                                                                                       |
| `content`        | `React.ReactNode`                                                    | —             | Count, short text, or a custom node to display; omit with `dot` for a plain dot. `max`/`showZero` apply only to numeric content. A numeric count is written the way the `locale` of a `LocaleProvider` around it writes numbers. |
| `max`            | `number`                                                             | `99`          | Numeric `content` above this renders as `"{max}+"`. A negative or non-integer value falls back to the default.                                                                                                                   |
| `dot`            | `boolean`                                                            | `false`       | Render a small dot with no content. In forced colors (Windows' contrast themes) a dot is filled in the system's text color, whatever its `color` or a background helper says, so it shows there.                                 |
| `showZero`       | `boolean`                                                            | `false`       | Show the badge when `content` is `0`. Default `false`.                                                                                                                                                                           |
| `color`          | `BadgeColor`                                                         | `'danger'`    | Status color. Default `'danger'`.                                                                                                                                                                                                |
| `position`       | `'top-right'` \| `'top-left'` \| `'bottom-right'` \| `'bottom-left'` | `'top-right'` | Corner to overlay the badge on, relative to `children`. Ignored for standalone badges (no `children`).                                                                                                                           |
| `overlap`        | `'circle'` \| `'square'`                                             | `'square'`    | Nudges the offset for a round (`'circle'`) vs rectangular (`'square'`) child. Ignored for standalone badges (no `children`).                                                                                                     |
| `pulse`          | `boolean`                                                            | `false`       | Processing/pulse animation; no-ops under `prefers-reduced-motion: reduce`.                                                                                                                                                       |
| `invisible`      | `boolean`                                                            | `false`       | Hide the badge pill without unmounting it (the wrapper and `children` stay visible).                                                                                                                                             |
| `children`       | `React.ReactNode`                                                    | —             | The element the badge overlays. Omit to render a standalone badge.                                                                                                                                                               |
| `...`            | All standard `<span>` attributes and Bulma helper props              | —             | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                |

**Types:**

- `BadgeColor`: `'primary'` | `'link'` | `'info'` | `'success'` | `'warning'` | `'danger'` | `'black'` | `'dark'` | `'light'` | `'white'` — Valid color values for the Badge component.

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Badge` registers these variables on its own `.badge` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                       | Sass Variable               | Default                       |
| ---------------------------------- | --------------------------- | ----------------------------- |
| `--bulma-badge-height`             | `$badge-height`             | `1.25em`                      |
| `--bulma-badge-min-width`          | `$badge-min-width`          | `1.25em`                      |
| `--bulma-badge-padding`            | `$badge-padding`            | `0 0.4em`                     |
| `--bulma-badge-font-size`          | `$badge-font-size`          | `0.7rem`                      |
| `--bulma-badge-radius`             | `$badge-radius`             | `var(--bulma-radius-rounded)` |
| `--bulma-badge-ring-color`         | `$badge-ring-color`         | `var(--bulma-scheme-main)`    |
| `--bulma-badge-ring-width`         | `$badge-ring-width`         | `2px`                         |
| `--bulma-badge-dot-size`           | `$badge-dot-size`           | `0.65em`                      |
| `--bulma-badge-inset-circle`       | `$badge-inset-circle`       | `12%`                         |
| `--bulma-badge-animation-duration` | `$badge-animation-duration` | `1.4s`                        |

<!-- /bestax:generated cssvars -->
