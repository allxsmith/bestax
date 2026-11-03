---
title: Stats
sidebar_label: Stats
description: The `Stats` component lays out a row of `Stat`s, such as the key figures at the top of a dashboard, as one description list on Bulma's smart grid.
keywords:
  - stats
  - stat group
  - statistics
  - KPI row
  - dashboard
  - metrics
---

# Stats

## Overview

<!-- bestax:generated overview -->

The `Stats` component lays out a row of `Stat`s, such as the key figures at the top of a dashboard, as one description list on Bulma's smart grid.

<!-- /bestax:generated overview -->

It's a `<dl>` holding a [`Stat`](./stat.md) for each figure, each a `<div>` with its label and its
values, so a screen reader meets one list for the whole row. The row is Bulma's
[smart grid](../grid/grid.md): each tile is at least `minCol` wide, the tiles share the width
left over, and they wrap onto more lines as the row narrows, with no media queries.

---

## Import

<!-- bestax:generated import -->

```tsx
import { Stats, Stat } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Put a `Stat` in it for each figure, and name the row by the heading above it with
`aria-labelledby`, so a screen reader says what the figures are about when it gets there. Make the
window narrower to see the tiles wrap.

```tsx live
<>
  <Title as="h2" size="5" id="stats-kpis">
    This month
  </Title>
  <Stats aria-labelledby="stats-kpis" minCol={8} gap={4}>
    <Stat
      label="Revenue"
      value={8456.4}
      format={{ style: 'currency', currency: 'USD' }}
      locale="en-US"
      change={0.12}
      description="since last month"
    />
    <Stat
      label="New customers"
      value={1234}
      locale="en-US"
      change={-0.019}
      description="since last month"
    />
    <Stat
      label="Churn"
      value={0.021}
      format={{ style: 'percent', maximumFractionDigits: 1 }}
      locale="en-US"
      change={0.004}
      changeColor="danger"
      description="since last month"
    />
    <Stat
      label="Requests"
      value={1234567}
      format={{ notation: 'compact' }}
      locale="en-US"
      change={0}
      description="since last month"
    />
  </Stats>
</>
```

### Tile Width and Gap

`minCol` is the narrowest a tile gets before the row wraps, 1.5rem a step, as on
[`Grid`](../grid/grid.md); unset, it's Bulma's 9rem. The `gap` helper prop sets the space between
tiles, 0.5rem a step.

```tsx live
<Stats minCol={5} gap={2}>
  <Stat label="Mon" value={12} />
  <Stat label="Tue" value={18} />
  <Stat label="Wed" value={9} />
  <Stat label="Thu" value={21} />
  <Stat label="Fri" value={15} />
</Stats>
```

### Text Color

`textColor` on the row is each Stat's `textColor` unless it has its own, so it colors the
figures. The labels, the changes and the notes keep their own colors.

```tsx live
<Stats minCol={8} textColor="link">
  <Stat label="Revenue" value="$8,456" />
  <Stat label="Refunds" value="$312" textColor="danger" />
</Stats>
```

### In a LocaleProvider

A `LocaleProvider` around the row reaches every figure and change in it. Put it around the
`Stats` rather than inside, since its wrapper `<div>` can't sit in a list.

```tsx live
<LocaleProvider locale="de-DE">
  <Stats minCol={8} gap={4}>
    <Stat
      label="Umsatz"
      value={8456.4}
      format={{ style: 'currency', currency: 'EUR' }}
      change={-0.019}
    />
    <Stat label="Neukunden" value={1234} change={0.12} />
  </Stats>
</LocaleProvider>
```

---

## Accessibility

- **One list for the row:** a `<dl>` with a `<div>` for each Stat, which browsers expose as a list
  of terms and their definitions. Chromium, Firefox and WebKit give the same tree: each label
  followed by its figure, its change and its note, in the order written.
- **A name from the heading above:** point `aria-labelledby` at it, as in
  [Basic Usage](#basic-usage).
- **Only Stats inside:** a `<dl>` holds only its groups, so put nothing else in the row, a
  `LocaleProvider` included; put it around the row.
- **Reading order is the order you write:** the grid places the tiles and follows the writing
  direction, so in a right-to-left page the first tile sits on the right, and a screen reader
  reads them in the same order either way.
- **Not interactive and not live:** it has no tab stop and announces nothing when a figure
  changes. See [`Stat`](./stat.md#a-figure-that-should-be-announced) for the one figure that
  should be announced.

---

## Related Components

- [`Stat`](./stat.md): One figure, its label, its change and its note.
- [`Grid`](../grid/grid.md): Bulma's smart grid, which lays the row out.
- [`Title`](./title.md): For the heading that names the row.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: Stats Stories](https://bestax.io/storybook/?path=/story/elements-stats--default)
- [Bulma: Smart Grid](https://bulma.io/documentation/grid/smart-grid/)
- [MDN: The description list element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dl)

---

## Props

<!-- bestax:generated props -->

| Prop              | Type                                                                    | Default | Description                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `className`       | `string`                                                                | —       | Additional CSS classes to apply.                                                                                              |
| `children`        | `React.ReactNode`                                                       | —       | `Stat`s, one per figure, and nothing else: they're the groups of its `<dl>`.                                                  |
| `minCol`          | `BulmaMinColValue`                                                      | —       | The narrowest a tile gets before the row wraps (`is-col-min-*`), as Grid's `minCol`: 1.5rem a step. Unset, it's Bulma's 9rem. |
| `textColor`       | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper. Each Stat in the row without a `textColor` of its own takes this one, which colors its figure.             |
| `bgColor`         | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                                                                                                      |
| `ref`             | `React.Ref<HTMLDListElement>`                                           | —       | Ref forwarded to the `<dl>`.                                                                                                  |
| `gap`             | `BulmaGapStep`                                                          | —       | The space between tiles (`is-gap-*`), the helper prop with the values Grid's `gap` takes.                                     |
| `aria-labelledby` | `string`                                                                | —       | The id of the heading above the row, which names it.                                                                          |
| `...`             | All standard `<dl>` attributes and Bulma helper props                   | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                             |

**Types:**

- `BulmaMinColValue`: `1` | `2` | `3` | `4` | `5` | `6` | `7` | `8` | `9` | `10` | `11` | `12` | `13` | `14` | `15` | `16` | `17` | `18` | `19` | `20` | `21` | `22` | `23` | `24` | `25` | `26` | `27` | `28` | `29` | `30` | `31` | `32` — Allowed minimum column values for Bulma grid.

<!-- /bestax:generated props -->
