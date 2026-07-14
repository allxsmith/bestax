---
title: Badge
sidebar_label: Badge
---

# Badge

## Overview

The `Badge` component is a small status/count indicator overlaid on the corner of another element, or rendered standalone.

Use it for online-status dots, unread counts, or "pending" bubbles — [`Tag`](../elements/tag) is
an inline label; `Badge` is a positioned overlay.

---

## Import

```tsx
import { Badge } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop             | Type                                                                                                             | Default       | Description                                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `content`        | `React.ReactNode`                                                                                                | —             | Count, short text, or a custom node to display; omit with `dot` for a plain dot. `max`/`showZero` apply only to numeric content. |
| `max`            | `number`                                                                                                         | `99`          | Numeric `content` above this renders as `"{max}+"`. A negative or non-integer value falls back to the default.                   |
| `dot`            | `boolean`                                                                                                        | `false`       | Render a small dot with no content.                                                                                              |
| `showZero`       | `boolean`                                                                                                        | `false`       | Show the badge when `content` is `0`.                                                                                            |
| `color`          | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger' \| 'black' \| 'dark' \| 'light' \| 'white'` | `'danger'`    | Status color.                                                                                                                    |
| `position`       | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'`                                                   | `'top-right'` | Corner to overlay the badge on, relative to `children`. Ignored for standalone badges (no `children`).                           |
| `overlap`        | `'circle' \| 'square'`                                                                                           | `'square'`    | Nudges the offset for a round (`'circle'`) vs rectangular (`'square'`) child. Ignored for standalone badges (no `children`).     |
| `pulse`          | `boolean`                                                                                                        | `false`       | Processing/pulse animation; no-ops under `prefers-reduced-motion: reduce`.                                                       |
| `invisible`      | `boolean`                                                                                                        | `false`       | Hide the badge pill without unmounting it (the wrapper and `children` stay visible).                                             |
| `className`      | `string`                                                                                                         | —             | Additional CSS classes for the root — the wrapper when `children` are present, else the badge pill.                              |
| `badgeClassName` | `string`                                                                                                         | —             | Additional CSS classes applied to the badge pill itself (unprefixed, like `Tooltip`'s `tooltipClassName`).                       |
| `children`       | `React.ReactNode`                                                                                                | —             | The element the badge overlays. Omit to render a standalone badge.                                                               |
| ...              | All standard HTML and Bulma helper props                                                                         |               | (See [Helper Props](../helpers/usebulmaclasses))                                                                                 |

---

## Usage

### Status Dot on an Avatar

A `dot` badge drops the content and renders a small indicator — pair it with `overlap="circle"`
so it hugs a round avatar.

```tsx live
<Badge dot color="success" overlap="circle">
  <Avatar name="Ada Lovelace" />
</Badge>
```

### Unread Count

Numeric `content` above `max` renders as `"{max}+"`.

```tsx live
<Badge content={128} max={99} color="danger">
  <Icon name="bell" ariaLabel="Notifications" />
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

Wrap any element — here a cart button carries its item count.

```tsx live
<Badge content={3} color="danger" overlap="square">
  <Button color="primary">
    <Icon name="shopping-cart" ariaLabel="Cart" />
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
    <Avatar name="A" shape="square" />
  </Badge>
  <Badge content={2} position="top-left" mr="5">
    <Avatar name="B" shape="square" />
  </Badge>
  <Badge content={3} position="bottom-right" mr="5">
    <Avatar name="C" shape="square" />
  </Badge>
  <Badge content={4} position="bottom-left">
    <Avatar name="D" shape="square" />
  </Badge>
</Block>
```

### Overlap: Circle vs Square

`overlap` nudges the offset inward for a round child so the badge doesn't float off the edge.

```tsx live
<Block display="flex">
  <Badge content={5} overlap="square" mr="5">
    <Avatar name="Square" shape="square" />
  </Badge>
  <Badge content={5} overlap="circle">
    <Avatar name="Circle" shape="circle" />
  </Badge>
</Block>
```

### Colors

`color` accepts any Bulma color for the pill background.

```tsx live
<Block display="flex">
  <Badge content={1} color="primary" mr="5">
    <Icon name="bell" ariaLabel="Notifications" size="large" />
  </Badge>
  <Badge content={2} color="info" mr="5">
    <Icon name="bell" ariaLabel="Notifications" size="large" />
  </Badge>
  <Badge content={3} color="success" mr="5">
    <Icon name="bell" ariaLabel="Notifications" size="large" />
  </Badge>
  <Badge content={4} color="warning" mr="5">
    <Icon name="bell" ariaLabel="Notifications" size="large" />
  </Badge>
  <Badge content={5} color="danger">
    <Icon name="bell" ariaLabel="Notifications" size="large" />
  </Badge>
</Block>
```

### Pulse

`pulse` adds a "processing" ripple; it no-ops under `prefers-reduced-motion: reduce`.

```tsx live
<Badge dot color="success" pulse overlap="circle">
  <Avatar name="Ada Lovelace" />
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
        <Icon name="bell" ariaLabel="Notifications" size="large" />
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
    <Icon name="bell" ariaLabel="Notifications" size="large" />
  </Badge>
  <Badge content={0} showZero>
    <Icon name="bell" ariaLabel="Notifications" size="large" />
  </Badge>
</Block>
```

### Standalone

Omit `children` to render the pill inline in normal flow; `position`/`overlap` are ignored.

```tsx live
<Badge content={5} color="info" />
```

### Standalone, Interactive

A standalone badge is itself the interactive root — helper props like `onClick` land directly on
the pill, which stays clickable (`pointer-events: auto`).

```tsx live
function example() {
  const [clicks, setClicks] = useState(0);

  return (
    <Badge content={clicks} showZero onClick={() => setClicks(c => c + 1)} />
  );
}
```

### Standalone, Pulse

`pulse` on a standalone badge anchors its halo to the pill itself rather than the nearest
positioned ancestor.

```tsx live
<Badge content={5} color="danger" pulse />
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
  <Avatar name="Ada Lovelace" />
</Badge>
```

---

## Accessibility

- A count/text badge exposes `role="status"` and an `aria-label` announcing its content.
- A bare number in a `role="status"` span is not enough context on its own — put the full
  meaning on the anchor itself, e.g. `<Icon ariaLabel="Inbox, 4 unread messages" />` rather than
  relying on the badge to read out just "4".
- A decorative `dot` badge is `aria-hidden`.
- `pulse` respects `prefers-reduced-motion: reduce` and renders without animation.
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
