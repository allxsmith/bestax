---
title: Grid
sidebar_label: Grid
sidebar_position: 1
---

# Grid

## Overview

The `Grid` component provides Bulma's advanced CSS Grid layout for complex, modern layouts. It supports both responsive and fixed grid modes, gap and min column controls, fixed column counts (per breakpoint), and full color/background/utility helpers. Use with the [`Cell`](./cell.md) component for granular grid placement.

---

## Import

```tsx
import { Grid, Cell } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop                  | Type                                                                                                                                                                                                                                                                                     | Description                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `isFixed`             | `boolean`                                                                                                                                                                                                                                                                                | Use a fixed grid layout (`.fixed-grid > .grid`).                                   |
| `gap`                 | 0-8                                                                                                                                                                                                                                                                                      | Main gap for grid (Bulma `is-gap-X`).                                              |
| `columnGap`           | 0-8                                                                                                                                                                                                                                                                                      | Column gap for grid (`is-column-gap-X`).                                           |
| `rowGap`              | 0-8                                                                                                                                                                                                                                                                                      | Row gap for grid (`is-row-gap-X`).                                                 |
| `minCol`              | 1-32                                                                                                                                                                                                                                                                                     | Minimum column width for the grid (`is-col-min-X`).                                |
| `fixedCols`           | 0-12, `'auto'`                                                                                                                                                                                                                                                                           | For fixed grids: explicit column count (`has-X-cols`), or `'auto'` for auto-count. |
| `fixedColsMobile`     | 0-12                                                                                                                                                                                                                                                                                     | For fixed grids: explicit column count for mobile.                                 |
| `fixedColsTablet`     | 0-12                                                                                                                                                                                                                                                                                     | For fixed grids: explicit column count for tablet.                                 |
| `fixedColsDesktop`    | 0-12                                                                                                                                                                                                                                                                                     | For fixed grids: explicit column count for desktop.                                |
| `fixedColsWidescreen` | 0-12                                                                                                                                                                                                                                                                                     | For fixed grids: explicit column count for widescreen.                             |
| `fixedColsFullhd`     | 0-12                                                                                                                                                                                                                                                                                     | For fixed grids: explicit column count for fullhd.                                 |
| `className`           | `string`                                                                                                                                                                                                                                                                                 | Additional CSS classes for the grid.                                               |
| `textColor`           | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | Text color.                                                                        |
| `color`               | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`                                                                                                                                                                                                          | Bulma color modifier for the grid.                                                 |
| `bgColor`             | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | Background color.                                                                  |
| `children`            | `React.ReactNode`                                                                                                                                                                                                                                                                        | Children to render inside the grid (usually `Cell` components).                    |
| ...                   | All Bulma helper and HTML props                                                                                                                                                                                                                                                          | (See [Helper Props](../api/helpers/usebulmaclasses))                               |

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
      <Notification color="primary">Cell {i + 1}</Notification>
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
