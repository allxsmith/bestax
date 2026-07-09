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

| Prop        | Type                                                                                                             | Default       | Description                                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `content`   | `React.ReactNode`                                                                                                | —             | Count, short text, or a custom node to display; omit with `dot` for a plain dot. `max`/`showZero` apply only to numeric content. |
| `max`       | `number`                                                                                                         | `99`          | Numeric `content` above this renders as `"{max}+"`.                                                                              |
| `dot`       | `boolean`                                                                                                        | `false`       | Render a small dot with no content.                                                                                              |
| `showZero`  | `boolean`                                                                                                        | `false`       | Show the badge when `content` is `0`.                                                                                            |
| `color`     | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger' \| 'black' \| 'dark' \| 'light' \| 'white'` | `'danger'`    | Status color.                                                                                                                    |
| `position`  | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'`                                                   | `'top-right'` | Corner to overlay the badge on, relative to `children`.                                                                          |
| `overlap`   | `'circle' \| 'square'`                                                                                           | `'square'`    | Nudges the offset for a round (`'circle'`) vs rectangular (`'square'`) child.                                                    |
| `pulse`     | `boolean`                                                                                                        | `false`       | Processing/pulse animation; no-ops under `prefers-reduced-motion: reduce`.                                                       |
| `invisible` | `boolean`                                                                                                        | `false`       | Hide the badge without unmounting it.                                                                                            |
| `className` | `string`                                                                                                         | —             | Additional CSS classes.                                                                                                          |
| `children`  | `React.ReactNode`                                                                                                | —             | The element the badge overlays. Omit to render a standalone badge.                                                               |
| ...         | All standard HTML and Bulma helper props                                                                         |               | (See [Helper Props](../helpers/usebulmaclasses))                                                                                 |

---

## Usage

### Status dot on an avatar

```tsx live
<Badge dot color="success" overlap="circle">
  <Avatar name="Ada Lovelace" />
</Badge>
```

### Unread count

Numeric `content` above `max` renders as `"{max}+"`.

```tsx live
<Badge content={128} max={99} color="danger">
  <Icon name="bell" />
</Badge>
```

### Positions

```tsx live
<Block>
  <Badge content={1} position="top-right">
    <Avatar name="A" shape="square" />
  </Badge>
  <Badge content={2} position="top-left">
    <Avatar name="B" shape="square" />
  </Badge>
  <Badge content={3} position="bottom-right">
    <Avatar name="C" shape="square" />
  </Badge>
  <Badge content={4} position="bottom-left">
    <Avatar name="D" shape="square" />
  </Badge>
</Block>
```

### Hidden at zero (unless `showZero`)

```tsx live
<Block>
  <Badge content={0}>
    <Icon name="bell" />
  </Badge>
  <Badge content={0} showZero>
    <Icon name="bell" />
  </Badge>
</Block>
```

### Standalone

```tsx live
<Badge content={5} color="info" />
```

### Custom node content

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
- A decorative `dot` badge is `aria-hidden`.
- `pulse` respects `prefers-reduced-motion: reduce` and renders without animation.

---

## See also

- [Avatar](./avatar) — a common element to overlay a `Badge` on.
