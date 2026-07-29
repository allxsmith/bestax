---
title: Column
sidebar_label: Column
description: The `Column` component provides a single responsive layout column using Bulma's flexbox-based column system.
sidebar_position: 2
---

# Column

## Overview

<!-- bestax:generated overview -->

The `Column` component provides a single responsive layout column using Bulma's flexbox-based column system.

<!-- /bestax:generated overview -->

It supports all Bulma column size modifiers, responsive sizes and offsets, color/background helpers, "narrow" behavior, and utility/HTML props. Use together with [`Columns`](./columns.md) for powerful, declarative layouts.

---

## Import

<!-- bestax:generated import -->

```tsx
import { Column } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Columns Example

This example shows the `Column` component used within a `Columns` container. Each `Column` can accept Bulma size, color, and offset props to control its width and appearance. Use this pattern for building flexible horizontal layouts with multiple columns.

```tsx live
import { Columns, Column } from '@allxsmith/bestax-bulma';
import { Notification } from '@allxsmith/bestax-bulma/elements/Notification';

<Columns>
  <Column>
    <Notification color="primary">First column</Notification>
  </Column>
  <Column>
    <Notification color="info">Second column</Notification>
  </Column>
  <Column>
    <Notification color="link">Third column</Notification>
  </Column>
  <Column>
    <Notification color="warning">Fourth column</Notification>
  </Column>
</Columns>;
```

---

### Column Sizes

This section demonstrates the various size options for columns. Sizes can be set using Bulma's fractional values or keywords like `full`, `half`, `one-third`, etc. Combine these with offset props to control the column's position within the row.

```tsx live
<>
  <Columns>
    <Column size="four-fifths">
      <Notification color="primary">is-four-fifths</Notification>
    </Column>
    <Column>
      <Notification color="primary">Auto</Notification>
    </Column>
    <Column>
      <Notification color="primary">Auto</Notification>
    </Column>
  </Columns>

  <Columns>
    <Column size="three-quarters">
      <Notification color="primary">is-three-quarters</Notification>
    </Column>
    <Column>
      <Notification color="primary">Auto</Notification>
    </Column>
    <Column>
      <Notification color="primary">Auto</Notification>
    </Column>
  </Columns>

  <Columns>
    <Column size="two-thirds">
      <Notification color="primary">is-two-thirds</Notification>
    </Column>
    <Column>
      <Notification color="primary">Auto</Notification>
    </Column>
    <Column>
      <Notification color="primary">Auto</Notification>
    </Column>
  </Columns>

  <Columns>
    <Column size="three-fifths">
      <Notification color="primary">is-three-fifths</Notification>
    </Column>
    <Column>
      <Notification color="primary">Auto</Notification>
    </Column>
    <Column>
      <Notification color="primary">Auto</Notification>
    </Column>
  </Columns>

  <Columns>
    <Column size="half">
      <Notification color="primary">is-half</Notification>
    </Column>
    <Column>
      <Notification color="primary">Auto</Notification>
    </Column>
    <Column>
      <Notification color="primary">Auto</Notification>
    </Column>
  </Columns>

  <Columns>
    <Column size="two-fifths">
      <Notification color="primary">is-two-fifths</Notification>
    </Column>
    <Column>
      <Notification color="primary">Auto</Notification>
    </Column>
    <Column>
      <Notification color="primary">Auto</Notification>
    </Column>
  </Columns>

  <Columns>
    <Column size="one-third">
      <Notification color="primary">is-one-third</Notification>
    </Column>
    <Column>
      <Notification color="primary">Auto</Notification>
    </Column>
    <Column>
      <Notification color="primary">Auto</Notification>
    </Column>
  </Columns>

  <Columns>
    <Column size="one-quarter">
      <Notification color="primary">is-one-quarter</Notification>
    </Column>
    <Column>
      <Notification color="primary">Auto</Notification>
    </Column>
    <Column>
      <Notification color="primary">Auto</Notification>
    </Column>
  </Columns>

  <Columns>
    <Column size="one-fifth">
      <Notification color="primary">is-one-fifth</Notification>
    </Column>
    <Column>
      <Notification color="primary">Auto</Notification>
    </Column>
    <Column>
      <Notification color="primary">Auto</Notification>
    </Column>
  </Columns>
</>
```

---

### 12 Column System

In Bulma's 12 column system, you can specify column sizes from 1 to 12, allowing for a wide range of layout possibilities. This example demonstrates how each column size behaves, including automatic sizing for remaining space.

```tsx live
<>
  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
    <Columns key={num}>
      <Column size={num}>
        <Notification color="primary">
          {num === 1 ? 1 : `is-${num}`}
        </Notification>
      </Column>
      {num === 11 && (
        <Column>
          <Notification color="primary">1</Notification>
        </Column>
      )}
      {num < 11 && (
        <Column>
          <Notification color="primary">Auto</Notification>
        </Column>
      )}
      {num < 10 && (
        <Column>
          <Notification color="primary">Auto</Notification>
        </Column>
      )}
    </Columns>
  ))}
</>
```

---

### Responsive Column Sizes

Columns can have different sizes at different breakpoints, allowing for a fully responsive design. This example shows a column that changes size from mobile to desktop views.

```tsx live
<Columns isMobile>
  <Column
    sizeMobile="three-quarters"
    sizeTablet="two-thirds"
    sizeDesktop="half"
    sizeWidescreen="one-third"
    sizeFullhd="one-quarter"
  >
    <Notification color="primary">
      <code>sizeMobile="three-quarters"</code>
      <br />
      <code>sizeTablet="two-thirds"</code>
      <br />
      <code>sizeDesktop="half"</code>
      <br />
      <code>sizeWidescreen="one-third"</code>
      <br />
      <code>sizeFullhd="one-quarter"</code>
    </Notification>
  </Column>
  <Column>
    <Notification color="primary">2</Notification>
  </Column>
  <Column>
    <Notification color="primary">3</Notification>
  </Column>
  <Column>
    <Notification color="primary">4</Notification>
  </Column>
  <Column>
    <Notification color="primary">5</Notification>
  </Column>
</Columns>
```

---

### Offsets

Offsets are used to push columns to the right, creating space between columns. This is particularly useful for centering columns or creating specific layouts.

```tsx live
<>
  <Columns isMobile>
    <Column size="half" offset="one-quarter">
      <Notification color="primary">is-half is-offset-one-quarter</Notification>
    </Column>
  </Columns>
  <Columns isMobile>
    <Column size="three-fifths" offset="one-fifth">
      <Notification color="primary">
        is-three-fifths is-offset-one-fifth
      </Notification>
    </Column>
  </Columns>
  <Columns isMobile>
    <Column size={4} offset={8}>
      <Notification color="primary">is-4 is-offset-8</Notification>
    </Column>
  </Columns>
  <Columns isMobile>
    <Column size={11} offset={1}>
      <Notification color="primary">is-11 is-offset-1</Notification>
    </Column>
  </Columns>
</>
```

---

### Narrow Columns

Narrow columns only take up as much width as their content, which can be useful for sidebar menus, buttons, or any content that doesn't need to stretch the full width of the column.

```tsx live
<Columns>
  <Column isNarrow>
    <Notification color="primary" style={{ width: 180 }}>
      <Strong>Narrow column</Strong>
      <br />
      <Span>This column is only as wide as it needs to be, 180px wide.</Span>
    </Notification>
  </Column>
  <Column>
    <Notification color="primary">
      <Strong>Flexible column</Strong>
      <br />
      <Span>This column will take up the remaining space available.</Span>
    </Notification>
  </Column>
</Columns>
```

---

## Notes

- Use the `Columns` component as a parent for `Column` children for proper row-column behavior.
- All column, offset, and narrow props support responsive variants.
- Combine with [Bulma helper props](/docs/api/helpers/usebulmaclasses) for utility-first styling.
- All standard `<div>` HTML props are supported.

---

## See Also

- [Columns container](./columns.md)
- [Bulma Columns Documentation](https://bulma.io/documentation/columns/)
- [Storybook: Column Story](https://bestax.io/storybook/?path=/story/columns-column--default)

---

## Props

<!-- bestax:generated props -->

| Prop                 | Type                                                                            | Default | Description                                       |
| -------------------- | ------------------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `className`          | `string`                                                                        | —       | Additional CSS classes for the column.            |
| `textColor`          | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Text color.                                       |
| `color`              | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Bulma color modifier for the column.              |
| `bgColor`            | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Background color.                                 |
| `size`               | `BulmaColumnSize`                                                               | —       | Column size (see Bulma docs).                     |
| `sizeMobile`         | `BulmaColumnSize`                                                               | —       | Size for mobile breakpoint.                       |
| `sizeTablet`         | `BulmaColumnSize`                                                               | —       | Size for tablet breakpoint.                       |
| `sizeDesktop`        | `BulmaColumnSize`                                                               | —       | Size for desktop breakpoint.                      |
| `sizeWidescreen`     | `BulmaColumnSize`                                                               | —       | Size for widescreen breakpoint.                   |
| `sizeFullhd`         | `BulmaColumnSize`                                                               | —       | Size for fullhd breakpoint.                       |
| `offset`             | `BulmaColumnSize`                                                               | —       | Offset for column.                                |
| `offsetMobile`       | `BulmaColumnSize`                                                               | —       | Offset for mobile.                                |
| `offsetTablet`       | `BulmaColumnSize`                                                               | —       | Offset for tablet.                                |
| `offsetDesktop`      | `BulmaColumnSize`                                                               | —       | Offset for desktop.                               |
| `offsetWidescreen`   | `BulmaColumnSize`                                                               | —       | Offset for widescreen.                            |
| `offsetFullhd`       | `BulmaColumnSize`                                                               | —       | Offset for fullhd.                                |
| `isNarrow`           | `boolean`                                                                       | `false` | Column is only as wide as its content.            |
| `isNarrowMobile`     | `boolean`                                                                       | `false` | The column is narrow on mobile.                   |
| `isNarrowTablet`     | `boolean`                                                                       | `false` | The column is narrow on tablet.                   |
| `isNarrowTouch`      | `boolean`                                                                       | `false` | The column is narrow on touch devices.            |
| `isNarrowDesktop`    | `boolean`                                                                       | `false` | The column is narrow on desktop.                  |
| `isNarrowWidescreen` | `boolean`                                                                       | `false` | The column is narrow on widescreen.               |
| `isNarrowFullhd`     | `boolean`                                                                       | `false` | The column is narrow on fullhd.                   |
| `children`           | `React.ReactNode`                                                               | —       | Children to render inside the column.             |
| `...`                | All standard `<div>` attributes and Bulma helper props                          | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

**Types:**

- `BulmaColumnSize`: `number` | `'full'` | `'half'` | `'one-third'` | `'two-thirds'` | `'one-quarter'` | `'three-quarters'` | `'one-fifth'` | `'two-fifths'` | `'three-fifths'` | `'four-fifths'` — Possible values for Bulma column size.

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

Bulma declares these variables globally rather than on `Column`'s own element, so the defaults come from the theme. Override them anywhere above the component — on the element itself (via `className`/`style`) for a one-off, or on `:root` to retheme every instance. See [Theme](../helpers/theme.md).

| CSS Variable         | Sass Variable | Default   |
| -------------------- | ------------- | --------- |
| `--bulma-column-gap` | `$column-gap` | `0.75rem` |

<!-- /bestax:generated cssvars -->
