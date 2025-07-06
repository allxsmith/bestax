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

```tsx
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

```tsx
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

```tsx
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

```tsx
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

```tsx
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

```tsx
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

```tsx
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

```tsx
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

```tsx
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
- [Storybook: Grid Story](https://storybook.bestax.cc/?path=/story/grid-grid--smart-grid)
