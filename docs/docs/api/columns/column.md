---
title: Column
sidebar_label: Column
sidebar_position: 2
---

# Column

## Overview

The `Column` component provides a single responsive layout column using Bulma's flexbox-based column system. It supports all Bulma column size modifiers, responsive sizes and offsets, color/background helpers, "narrow" behavior, and utility/HTML props. Use together with [`Columns`](./columns.md) for powerful, declarative layouts.

---

## Import

```tsx
import { Column } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop                 | Type                                                                                                                                                                                                                                                                                     | Description                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `className`          | `string`                                                                                                                                                                                                                                                                                 | Additional CSS classes for the column.                  |
| `textColor`          | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | Text color.                                             |
| `color`              | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`                                                                                                                                                                                                          | Bulma color modifier for the column.                    |
| `bgColor`            | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | Background color.                                       |
| `size`               | number \| `'full'` \| `'half'` \| `'one-third'` \| `'two-thirds'` \| `'one-quarter'` \| ...                                                                                                                                                                                              | Column size (see Bulma docs).                           |
| `sizeMobile`         | as above                                                                                                                                                                                                                                                                                 | Size for mobile breakpoint.                             |
| `sizeTablet`         | as above                                                                                                                                                                                                                                                                                 | Size for tablet breakpoint.                             |
| `sizeDesktop`        | as above                                                                                                                                                                                                                                                                                 | Size for desktop breakpoint.                            |
| `sizeWidescreen`     | as above                                                                                                                                                                                                                                                                                 | Size for widescreen breakpoint.                         |
| `sizeFullhd`         | as above                                                                                                                                                                                                                                                                                 | Size for fullhd breakpoint.                             |
| `offset`             | as above                                                                                                                                                                                                                                                                                 | Offset for column.                                      |
| `offsetMobile`       | as above                                                                                                                                                                                                                                                                                 | Offset for mobile.                                      |
| `offsetTablet`       | as above                                                                                                                                                                                                                                                                                 | Offset for tablet.                                      |
| `offsetDesktop`      | as above                                                                                                                                                                                                                                                                                 | Offset for desktop.                                     |
| `offsetWidescreen`   | as above                                                                                                                                                                                                                                                                                 | Offset for widescreen.                                  |
| `offsetFullhd`       | as above                                                                                                                                                                                                                                                                                 | Offset for fullhd.                                      |
| `isNarrow`           | `boolean`                                                                                                                                                                                                                                                                                | Column is only as wide as its content.                  |
| `isNarrowMobile`     | `boolean`                                                                                                                                                                                                                                                                                | Narrow on mobile.                                       |
| `isNarrowTablet`     | `boolean`                                                                                                                                                                                                                                                                                | Narrow on tablet.                                       |
| `isNarrowTouch`      | `boolean`                                                                                                                                                                                                                                                                                | Narrow on touch devices.                                |
| `isNarrowDesktop`    | `boolean`                                                                                                                                                                                                                                                                                | Narrow on desktop.                                      |
| `isNarrowWidescreen` | `boolean`                                                                                                                                                                                                                                                                                | Narrow on widescreen.                                   |
| `isNarrowFullhd`     | `boolean`                                                                                                                                                                                                                                                                                | Narrow on fullhd.                                       |
| `children`           | `React.ReactNode`                                                                                                                                                                                                                                                                        | Children to render inside the column.                   |
| ...                  | All Bulma helper and HTML props                                                                                                                                                                                                                                                          | (See [Helper Props](/docs/api/helpers/usebulmaclasses)) |

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
      <span style={{ fontWeight: 'bold' }}>Narrow column</span>
      <br />
      <span>This column is only as wide as it needs to be, 180px wide.</span>
    </Notification>
  </Column>
  <Column>
    <Notification color="primary">
      <span style={{ fontWeight: 'bold' }}>Flexible column</span>
      <br />
      <span>This column will take up the remaining space available.</span>
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
