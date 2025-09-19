---
title: Cell
sidebar_label: Cell
sidebar_position: 2
---

# Cell

## Overview

The `Cell` component provides a single Bulma grid cell for use inside the [`Grid`](./grid.md) component. It supports all Bulma grid CSS classes for manual placement and spanning, color/background helpers, and all utility/HTML props. Use `Cell` to control column/row start, end, and span within modern CSS grid layouts.

---

## Import

```tsx
import { Cell } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop         | Type                                                                                                                                                                                                                                                                                     | Description                                                                        |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `colStart`   | `number`                                                                                                                                                                                                                                                                                 | Which column the cell starts at (Bulma: `is-col-start-x`).                         |
| `colFromEnd` | `number`                                                                                                                                                                                                                                                                                 | Which column the cell ends at, counting from the end (Bulma: `is-col-from-end-x`). |
| `colSpan`    | `number`                                                                                                                                                                                                                                                                                 | How many columns the cell will span (Bulma: `is-col-span-x`).                      |
| `rowStart`   | `number`                                                                                                                                                                                                                                                                                 | Which row the cell starts at (Bulma: `is-row-start-x`).                            |
| `rowFromEnd` | `number`                                                                                                                                                                                                                                                                                 | Which row the cell ends at, counting from the end (Bulma: `is-row-from-end-x`).    |
| `rowSpan`    | `number`                                                                                                                                                                                                                                                                                 | How many rows the cell will span (Bulma: `is-row-span-x`).                         |
| `className`  | `string`                                                                                                                                                                                                                                                                                 | Additional CSS class names.                                                        |
| `textColor`  | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | Text color.                                                                        |
| `color`      | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`                                                                                                                                                                                                          | Bulma color modifier for the cell.                                                 |
| `bgColor`    | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | Background color.                                                                  |
| `children`   | `React.ReactNode`                                                                                                                                                                                                                                                                        | Content to render inside the cell.                                                 |
| ...          | All Bulma helper and HTML props                                                                                                                                                                                                                                                          | (See [Helper Props](../helpers/usebulmaclasses))                                   |

---

## Usage

### Basic Usage

This example shows the `Cell` component used inside a `Grid`. Each `Cell` can contain any content, and the grid will automatically arrange the cells according to the available space and grid configuration.

```tsx live
<Grid>
  <Cell>
    <Notification color="primary">Basic Cell</Notification>
  </Cell>
  <Cell>
    <Notification color="info">Another Cell</Notification>
  </Cell>
</Grid>
```

---

### Column Start

Set the `colStart` prop to control which column a cell starts at. This is useful for manual placement and advanced grid layouts.

```tsx live
<Grid isFixed fixedCols={4}>
  <Cell>
    <Notification>Cell 1</Notification>
  </Cell>
  <Cell colStart={3}>
    <Notification color="primary">Cell 2</Notification>
  </Cell>
  <Cell>
    <Notification>Cell 3</Notification>
  </Cell>
  <Cell>
    <Notification>Cell 4</Notification>
  </Cell>
  <Cell>
    <Notification>Cell 5</Notification>
  </Cell>
  <Cell>
    <Notification>Cell 6</Notification>
  </Cell>
</Grid>
```

---

### Column From End

Use the `colFromEnd` prop to specify which column the cell should end at, counting from the last column. This allows for flexible layouts, especially in responsive designs.

```tsx live
<Grid isFixed fixedCols={4}>
  <Cell>
    <Notification>Cell 1</Notification>
  </Cell>
  <Cell colFromEnd={2}>
    <Notification color="primary">Cell 2</Notification>
  </Cell>
  <Cell>
    <Notification>Cell 3</Notification>
  </Cell>
  <Cell>
    <Notification>Cell 4</Notification>
  </Cell>
  <Cell>
    <Notification>Cell 5</Notification>
  </Cell>
  <Cell>
    <Notification>Cell 6</Notification>
  </Cell>
</Grid>
```

---

### Column Span

The `colSpan` prop defines how many columns a cell should span. This is useful for creating layouts where a cell needs to take up more space horizontally.

```tsx live
<Grid isFixed fixedCols={4}>
  <Cell>
    <Notification>Cell 1</Notification>
  </Cell>
  <Cell colSpan={2}>
    <Notification color="primary">Cell 2</Notification>
  </Cell>
  <Cell>
    <Notification>Cell 3</Notification>
  </Cell>
  <Cell>
    <Notification>Cell 4</Notification>
  </Cell>
  <Cell>
    <Notification>Cell 5</Notification>
  </Cell>
  <Cell>
    <Notification>Cell 6</Notification>
  </Cell>
</Grid>
```

---

### Row Start

Control the starting row of a cell using the `rowStart` prop. This can be used to create gaps or align items in specific rows.

```tsx live
<Grid isFixed fixedCols={4}>
  <Cell>
    <Notification>Cell 1</Notification>
  </Cell>
  <Cell rowStart={3}>
    <Notification color="primary">Cell 2</Notification>
  </Cell>
  <Cell>
    <Notification>Cell 3</Notification>
  </Cell>
  <Cell>
    <Notification>Cell 4</Notification>
  </Cell>
  <Cell>
    <Notification>Cell 5</Notification>
  </Cell>
  <Cell>
    <Notification>Cell 6</Notification>
  </Cell>
</Grid>
```

---

### Row Span

The `rowSpan` prop allows a cell to span multiple rows. This is particularly useful for creating complex layouts where certain content needs to be larger or span across multiple sections.

```tsx live
<Grid isFixed fixedCols={4}>
  <Cell>
    <Notification>Cell 1</Notification>
  </Cell>
  <Cell rowSpan={2}>
    <Notification color="primary" style={{ height: '100%' }}>
      Cell 2
    </Notification>
  </Cell>
  <Cell>
    <Notification>Cell 3</Notification>
  </Cell>
  <Cell>
    <Notification>Cell 4</Notification>
  </Cell>
  <Cell>
    <Notification>Cell 5</Notification>
  </Cell>
  <Cell>
    <Notification>Cell 6</Notification>
  </Cell>
</Grid>
```

---

## Notes

- Use `Cell` inside a `Grid` for proper Bulma grid layout.
- You can combine all placement and span props for advanced grid arrangements.
- All Bulma utility helper props and HTML `<div>` props are supported.

---

## See Also

- [Grid component](./grid.md)
- [Bulma Grid Documentation](https://bulma.io/documentation/grid/)
- [Storybook: Cell Story](https://bestax.io/storybook/?path=/story/grid-cell--column-start)
