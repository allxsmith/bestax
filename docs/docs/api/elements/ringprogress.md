---
title: RingProgress
sidebar_label: RingProgress
description: The `RingProgress` component draws a value as a ring that fills as it grows, with anything you pass shown in the middle.
---

# RingProgress

## Overview

<!-- bestax:generated overview -->

The `RingProgress` component draws a value as a ring that fills as it grows, with anything you pass shown in the middle.

<!-- /bestax:generated overview -->

Reach for it where one number wants a picture that takes little room: an upload or an import on
its way, a goal on a dashboard, storage used, or a score. With `sections` it draws several values
around one ring, such as storage by kind of file.

It's a progress bar for a task moving toward done, or a meter with `isMeter` for a level within a
range. A screen reader reads its `label` with its value. For work with no value yet, use
[`Loader`](./loader.md).

:::info
Bulma has no ring, so `RingProgress` brings its own styles, in `bestax.css` and its variants, or in
`extras.css` next to your own Bulma.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { RingProgress } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Give it a `value` from 0 to 100 and a `label`, and put the number in the middle as its children.

```tsx live
<RingProgress value={72} label="Upload" color="success">
  72%
</RingProgress>
```

### Out of Something Else

`max` sets the value that fills the ring. A screen reader reads the value as a percentage, so say
it in your own words with `aria-valuetext`.

```tsx live
<RingProgress
  value={7}
  max={10}
  label="Weekly goal"
  aria-valuetext="7 of 10 tasks"
>
  7/10
</RingProgress>
```

### A Level, Not a Task

`isMeter` makes it a meter: a level within a range, such as storage used or a score, rather than
a task moving toward done. A screen reader says which.

```tsx live
<RingProgress isMeter value={64} label="Storage used" color="info" size="large">
  64%
</RingProgress>
```

### Sections

`sections` draws several values around one ring, clockwise from the top, each with its own color
and `label`. A screen reader can't take several values from one element, so the ring is an image
whose name lists them: this one is "Storage: Documents 40%, Photos 15%, Video 15%". A legend
built from `Tags` says the same on the page.

```tsx live
<>
  <RingProgress
    label="Storage"
    size="medium"
    sections={[
      { value: 40, color: 'info', label: 'Documents' },
      { value: 15, color: 'warning', label: 'Photos' },
      { value: 15, color: 'danger', label: 'Video' },
    ]}
  >
    70%
  </RingProgress>
  <Tags mt="3">
    <Tag color="info">Documents 40%</Tag>
    <Tag color="warning">Photos 15%</Tag>
    <Tag color="danger">Video 15%</Tag>
  </Tags>
</>
```

### Colors

`color` takes the colors [`Progress`](./progress.md) does. Without one, the arc is the primary
color.

```tsx live
<>
  <RingProgress value={70} label="Primary" color="primary" mr="3" />
  <RingProgress value={70} label="Link" color="link" mr="3" />
  <RingProgress value={70} label="Info" color="info" mr="3" />
  <RingProgress value={70} label="Success" color="success" mr="3" />
  <RingProgress value={70} label="Warning" color="warning" mr="3" />
  <RingProgress value={70} label="Danger" color="danger" />
</>
```

### Sizes and Rounded Ends

`size` is `small`, `medium` or `large`, and `isRounded` rounds the ends of the arc.

```tsx live
<>
  <RingProgress value={60} label="Small" size="small" isRounded mr="4" />
  <RingProgress value={60} label="Normal" isRounded mr="4" />
  <RingProgress value={60} label="Medium" size="medium" isRounded mr="4" />
  <RingProgress value={60} label="Large" size="large" isRounded />
</>
```

### A Value That Changes

The arc slides to a new value, and doesn't when the user has asked for less motion. A ring
doesn't announce a change on its own: say when an upload finishes in a `role="status"` region.

```tsx live
function example() {
  const [value, setValue] = useState(20);
  return (
    <>
      <RingProgress value={value} label="Upload" color="success" mb="3">
        {value}%
      </RingProgress>
      <Paragraph role="status">
        {value >= 100 ? 'Upload complete' : ''}
      </Paragraph>
      <Button size="small" onClick={() => setValue(v => Math.min(100, v + 20))}>
        Move it on
      </Button>
    </>
  );
}
```

---

## Accessibility

- **Roles:** `role="progressbar"` by default, `role="meter"` with `isMeter`, and `role="img"` with
  `sections`, on the ring itself, named by `label` (or `aria-label`, or `aria-labelledby` with a
  visible heading's id). A development build warns when it has no name.
- **Values:** a progressbar or a meter has `aria-valuenow`, `aria-valuemin` and `aria-valuemax`,
  read as a percentage unless `aria-valuetext` says otherwise. With `sections`, use `label`, since
  a name from `aria-labelledby` would replace the one that lists the values.
- **The drawing and the middle are hidden** from assistive tech, which reads the value from the
  ring, so nothing is heard twice.
- **Contrast:** against the track, the `primary` and `link` arcs clear WCAG 1.4.11's 3:1 on a
  light page and the `info`, `success`, `warning` and `danger` arcs on a dark one. The others fall
  short in that scheme, as they do in Bulma's progress bar, so show the value as text in the middle
  where it matters.
- **Forced colors:** the arcs take the system's text color and the track its gray, and sections
  get gaps between them, since they're one color there.
- **Motion:** the arc doesn't slide under `prefers-reduced-motion: reduce`.
- **Not live:** a changing value announces nothing on its own.

---

## Related Components

- [`Progress`](./progress.md): The same value as a bar.
- [`Loader`](./loader.md): For work with no value yet.
- [`Tags`](./tags.md): A legend for a ring in sections.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: RingProgress Stories](https://bestax.io/storybook/?path=/story/elements-ringprogress--default)
- [WAI-ARIA 1.2: progressbar](https://www.w3.org/TR/wai-aria-1.2/#progressbar)
- [WAI-ARIA 1.2: meter](https://www.w3.org/TR/wai-aria-1.2/#meter)
- [W3C: Complex images](https://www.w3.org/WAI/tutorials/images/complex/)

---

## Props

<!-- bestax:generated props -->

| Prop              | Type                                                                    | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------- | ----------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className`       | `string`                                                                | —       | Additional CSS classes to apply.                                                                                                                                                                                                                                                                                                                                                                                             |
| `value`           | `number`                                                                | —       | How far along it is, from 0 to `max`. Values outside that range are drawn, and read, at the nearest end. Ignored with `sections`.                                                                                                                                                                                                                                                                                            |
| `max`             | `number`                                                                | `100`   | The value that fills the ring.                                                                                                                                                                                                                                                                                                                                                                                               |
| `sections`        | `{ value: number; color?: RingProgressColor; label: string }[]`         | —       | Several values around one ring, in order clockwise from the top, each with its own color and label. The ring is then an image whose name writes them out, such as "Storage: Documents 40%, Photos 15%", since a screen reader can't take several values from one element. Inside a `LocaleProvider` with a `locale`, the shares are written as that locale writes a percentage. A total over `max` fills the ring and stops. |
| `label`           | `string`                                                                | —       | What it shows, such as "Upload" or "Storage". It names the ring, so it's read with the value. A development build warns when the ring has no name.                                                                                                                                                                                                                                                                           |
| `isMeter`         | `boolean`                                                               | `false` | A level within a range, such as storage used or a score, rather than a task moving toward done: `role="meter"` in place of `role="progressbar"`. Ignored with `sections`.                                                                                                                                                                                                                                                    |
| `color`           | `RingProgressColor`                                                     | —       | The arc's color, and the color of sections without one.                                                                                                                                                                                                                                                                                                                                                                      |
| `size`            | `'small'` \| `'medium'` \| `'large'`                                    | —       | The ring's size.                                                                                                                                                                                                                                                                                                                                                                                                             |
| `isRounded`       | `boolean`                                                               | `false` | Rounds the ends of the arc.                                                                                                                                                                                                                                                                                                                                                                                                  |
| `children`        | `React.ReactNode`                                                       | —       | What sits in the middle of the ring, such as the value as text. It's hidden from assistive tech, which reads the value from the ring itself, so the value isn't heard twice. Say anything more, such as "7 of 10 tasks", in `aria-valuetext`.                                                                                                                                                                                |
| `textColor`       | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper.                                                                                                                                                                                                                                                                                                                                                                                                           |
| `bgColor`         | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                                                                                                                                                                                                                                                                                                                                                                                                     |
| `ref`             | `React.Ref<HTMLDivElement>`                                             | —       | Ref forwarded to the root `<div>`.                                                                                                                                                                                                                                                                                                                                                                                           |
| `aria-labelledby` | `string`                                                                | —       | The id of a visible heading that names the ring, in place of `label`. With `sections`, use `label`, since a name from here replaces the one that lists the values.                                                                                                                                                                                                                                                           |
| `aria-valuetext`  | `string`                                                                | —       | What a screen reader says for the value, such as "7 of 10 tasks". Without it, the value is read as a percentage.                                                                                                                                                                                                                                                                                                             |
| `...`             | All standard `<div>` attributes and Bulma helper props                  | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                            |

**Types:**

- `RingProgressColor`: `'primary'` | `'link'` | `'info'` | `'success'` | `'warning'` | `'danger'` | `'black'` | `'dark'` | `'light'` | `'white'` — The Bulma colors an arc takes, the ones `Progress` takes.

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`RingProgress` registers these variables on its own `.ring-progress` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                         | Sass Variable                 | Default                                     |
| ------------------------------------ | ----------------------------- | ------------------------------------------- |
| `--bulma-ring-progress-size`         | `$ring-progress-size`         | `5rem`                                      |
| `--bulma-ring-progress-thickness`    | `$ring-progress-thickness`    | `10`                                        |
| `--bulma-ring-progress-track-color`  | `$ring-progress-track-color`  | `var(--bulma-border-weak)`                  |
| `--bulma-ring-progress-arc-color`    | `$ring-progress-arc-color`    | `var(--bulma-primary)`                      |
| `--bulma-ring-progress-duration`     | `$ring-progress-duration`     | `var(--bulma-duration)`                     |
| `--bulma-ring-progress-label-color`  | `$ring-progress-label-color`  | `var(--bulma-text-strong)`                  |
| `--bulma-ring-progress-label-weight` | `$ring-progress-label-weight` | `var(--bulma-weight-semibold)`              |
| `--bulma-ring-progress-label-size`   | `$ring-progress-label-size`   | `calc(var(--bulma-ring-progress-size) / 5)` |

<!-- /bestax:generated cssvars -->
