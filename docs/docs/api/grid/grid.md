---
title: Grid
sidebar_label: Grid
description: The `Grid` component provides Bulma's advanced CSS Grid layout for complex, modern layouts.
sidebar_position: 1
---

# Grid

## Overview

<!-- bestax:generated overview -->

The `Grid` component provides Bulma's advanced CSS Grid layout for complex, modern layouts.

<!-- /bestax:generated overview -->

It supports both responsive and fixed grid modes, gap and min column controls, fixed column counts (per breakpoint), and full color/background/utility helpers. Use with the [`Cell`](./cell.md) component for granular grid placement.

---

## Import

<!-- bestax:generated import -->

```tsx
import { Grid, Cell } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Smart Grid

This example shows the `Grid` component rendering a set of `Cell` components. By default, the grid will automatically fit as many columns as possible based on the available space, making it ideal for responsive layouts without manual configuration.

```tsx live
<Grid>
  {[...Array(24)].map((_, i) => (
    <Cell key={i}>
      <Notification color="primary">Cell {i + 1}</Notification>
    </Cell>
  ))}
</Grid>
```

---

### Minimum Column Width

Set the `minCol` prop to control the minimum width of each column in the grid. This allows you to ensure that cells never shrink below a certain size, regardless of the screen width.

```tsx live
<Grid minCol={4}>
  {[...Array(24)].map((_, i) => (
    <Cell key={i}>
      <Notification color="primary" textSize="7">
        Cell {i + 1}
      </Notification>
    </Cell>
  ))}
</Grid>
```

You can control the minimum column width interactively; see the story for a demo.

---

### Gap

This example demonstrates the `gap` prop, which sets the spacing between grid cells. Adjust the value from 0 to 8 to control the amount of space between each cell.

```tsx live
<Grid gap={2}>
  {[...Array(24)].map((_, i) => (
    <Cell key={i}>
      <Notification color="primary">Cell {i + 1}</Notification>
    </Cell>
  ))}
</Grid>
```

---

### Column Gap

This example demonstrates the `columnGap` prop, which sets the horizontal spacing between columns in the grid. Adjust the value from 0 to 8 to control the space between columns only, without affecting row spacing.

```tsx live
<Grid columnGap={2}>
  {[...Array(24)].map((_, i) => (
    <Cell key={i}>
      <Notification color="primary">Cell {i + 1}</Notification>
    </Cell>
  ))}
</Grid>
```

---

### Row Gap

This example demonstrates the `rowGap` prop, which sets the vertical spacing between rows in the grid. Adjust the value from 0 to 8 to control the space between rows only, without affecting column spacing.

```tsx live
<Grid rowGap={2}>
  {[...Array(24)].map((_, i) => (
    <Cell key={i}>
      <Notification color="primary">Cell {i + 1}</Notification>
    </Cell>
  ))}
</Grid>
```

---

### Fixed Grid

This example shows how to enable fixed grid mode using the `isFixed` prop. In this mode, the grid uses a strict column layout, and you can control the number of columns with the `fixedCols` prop or its breakpoint variants.

```tsx live
<Grid isFixed>
  {[...Array(12)].map((_, i) => (
    <Cell key={i}>
      <Notification color="primary">Cell {i + 1}</Notification>
    </Cell>
  ))}
</Grid>
```

---

### Fixed Grid Cols

This example demonstrates the `fixedCols` prop, which specifies the number of columns in fixed grid mode. Here, the grid will always have exactly 4 columns, regardless of screen size.

```tsx live
<Grid isFixed fixedCols={4}>
  {[...Array(12)].map((_, i) => (
    <Cell key={i}>
      <Notification color="primary">Cell {i + 1}</Notification>
    </Cell>
  ))}
</Grid>
```

You can select the number of fixed columns interactively; see the story for a demo.

---

### Fixed Grid Cols By Breakpoint

This example demonstrates how to set different column counts for each breakpoint using the `fixedCols*` props. The grid will adjust the number of columns responsively as the screen size changes.

```tsx live
<Grid
  isFixed
  fixedCols={4}
  fixedColsMobile={4}
  fixedColsTablet={6}
  fixedColsDesktop={8}
  fixedColsWidescreen={10}
  fixedColsFullhd={12}
>
  {[...Array(12)].map((_, i) => (
    <Cell key={i}>
      <Notification color="primary">Cell {i + 1}</Notification>
    </Cell>
  ))}
</Grid>
```

---

### Fixed Grid Auto Count

This example shows how to use `fixedCols="auto"` to let the grid automatically determine the number of columns based on the content and available space. This is useful for dynamic layouts where the number of columns may change.

```tsx live
<Grid isFixed fixedCols="auto">
  {[...Array(16)].map((_, i) => (
    <Cell key={i}>
      <Notification color="primary">Cell {i + 1}</Notification>
    </Cell>
  ))}
</Grid>
```

---

### Compound (dot-notation) usage

`Cell` is also available as `Grid.Cell`, so a grid can be composed from the single `Grid` import.

```tsx live
<Grid>
  <Grid.Cell>
    <Notification color="primary">Cell 1</Notification>
  </Grid.Cell>
  <Grid.Cell>
    <Notification color="info">Cell 2</Notification>
  </Grid.Cell>
</Grid>
```

---

## Cell Placement Examples

See [Cell documentation](./cell.md) for granular placement using `colStart`, `colFromEnd`, `colSpan`, `rowStart`, `rowSpan`, etc.

---

## Notes

- Use the `Cell` component as a child of `Grid` for individual cell placement and spanning.
- Fixed grid mode (`isFixed`) enables a strict column layout and enables `fixedCols`/`fixedCols*` props.
- All Bulma utility helper props are supported.

---

## See Also

- [Cell component](./cell.md)
- [Bulma Grid Documentation](https://bulma.io/documentation/grid/)
- [Storybook: Grid Story](https://bestax.io/storybook/?path=/story/grid-grid--smart-grid)

---

## Props

<!-- bestax:generated props -->

| Prop                  | Type                                                                                                                                         | Default | Description                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `isFixed`             | `boolean`                                                                                                                                    | `false` | Use a fixed grid layout (Bulma's .fixed-grid > .grid).                                               |
| `gap`                 | `0` \| `1` \| `2` \| `3` \| `4` \| `5` \| `6` \| `7` \| `8` \| `'0'` \| `'1'` \| `'2'` \| `'3'` \| `'4'` \| `'5'` \| `'6'` \| `'7'` \| `'8'` | —       | Main gap for grid (Bulma `is-gap-X`). Main gap for grid (applies is-gap-X, 0-8).                     |
| `columnGap`           | `0` \| `1` \| `2` \| `3` \| `4` \| `5` \| `6` \| `7` \| `8` \| `'0'` \| `'1'` \| `'2'` \| `'3'` \| `'4'` \| `'5'` \| `'6'` \| `'7'` \| `'8'` | —       | Column gap for grid (applies is-column-gap-X, 0-8).                                                  |
| `rowGap`              | `0` \| `1` \| `2` \| `3` \| `4` \| `5` \| `6` \| `7` \| `8` \| `'0'` \| `'1'` \| `'2'` \| `'3'` \| `'4'` \| `'5'` \| `'6'` \| `'7'` \| `'8'` | —       | Row gap for grid (applies is-row-gap-X, 0-8).                                                        |
| `minCol`              | `BulmaMinColValue`                                                                                                                           | —       | Minimum column width for the grid (applies is-col-min-X, 1-32).                                      |
| `fixedCols`           | `BulmaFixedGridColsProp`                                                                                                                     | —       | For fixed grid only: explicit column count (applies has-X-cols, 0-12), or 'auto' for has-auto-count. |
| `fixedColsMobile`     | `0` \| `1` \| `2` \| `3` \| `4` \| `5` \| `6` \| `7` \| `8` \| `9` \| `10` \| `11` \| `12`                                                   | —       | For fixed grid only: explicit column count for mobile.                                               |
| `fixedColsTablet`     | `0` \| `1` \| `2` \| `3` \| `4` \| `5` \| `6` \| `7` \| `8` \| `9` \| `10` \| `11` \| `12`                                                   | —       | For fixed grid only: explicit column count for tablet.                                               |
| `fixedColsDesktop`    | `0` \| `1` \| `2` \| `3` \| `4` \| `5` \| `6` \| `7` \| `8` \| `9` \| `10` \| `11` \| `12`                                                   | —       | For fixed grid only: explicit column count for desktop.                                              |
| `fixedColsWidescreen` | `0` \| `1` \| `2` \| `3` \| `4` \| `5` \| `6` \| `7` \| `8` \| `9` \| `10` \| `11` \| `12`                                                   | —       | For fixed grid only: explicit column count for widescreen.                                           |
| `fixedColsFullhd`     | `0` \| `1` \| `2` \| `3` \| `4` \| `5` \| `6` \| `7` \| `8` \| `9` \| `10` \| `11` \| `12`                                                   | —       | For fixed grid only: explicit column count for fullhd.                                               |
| `className`           | `string`                                                                                                                                     | —       | Additional CSS classes for the grid.                                                                 |
| `textColor`           | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                                      | —       | Text color.                                                                                          |
| `color`               | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`                                                              | —       | Bulma color modifier for the grid.                                                                   |
| `bgColor`             | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                                      | —       | Background color.                                                                                    |
| `children`            | `React.ReactNode`                                                                                                                            | —       | Children to render inside the grid (usually `Cell` components).                                      |
| `...`                 | All standard `<div>` attributes and Bulma helper props                                                                                       | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                    |

**Types:**

- `BulmaMinColValue`: `1` | `2` | `3` | `4` | `5` | `6` | `7` | `8` | `9` | `10` | `11` | `12` | `13` | `14` | `15` | `16` | `17` | `18` | `19` | `20` | `21` | `22` | `23` | `24` | `25` | `26` | `27` | `28` | `29` | `30` | `31` | `32` — Allowed minimum column values for Bulma grid.

**Subcomponents:**

- [`Grid.Cell`](cell.md): The `Cell` component provides a single Bulma grid cell for use inside the [`Grid`](./grid.md) component.

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Grid` registers these variables on its own `.grid` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                    | Sass Variable | Default   |
| ------------------------------- | ------------- | --------- |
| `--bulma-grid-gap`              | `$grip-gap`   | `0.75rem` |
| `--bulma-grid-column-min`       | —             | `9rem`    |
| `--bulma-grid-cell-column-span` | —             | `1`       |
| `--bulma-grid-cell-row-span`    | —             | `1`       |

<!-- /bestax:generated cssvars -->
