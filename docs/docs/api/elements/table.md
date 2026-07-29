---
title: Table
sidebar_label: Table
description: The `Table` component and its subcomponents provide a highly composable, Bulma-styled table system for React.
---

# Table

## Overview

<!-- bestax:generated overview -->

The `Table` component and its subcomponents provide a highly composable, Bulma-styled table system for React.

<!-- /bestax:generated overview -->

You get full access to Bulma’s table features—borders, stripes, narrow cells, hover effects, responsive scroll, cell/row coloring, and more—using idiomatic React patterns. All Bulma helper props for spacing and color are supported.

:::info
Use the full suite: `Table`, `Thead`, `Tbody`, `Tfoot`, `Tr`, `Th`, and `Td` for maximum flexibility and Bulma compatibility.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import {
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
} from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Default Table

To create a basic table, use the `Table` component along with its subcomponents: `Thead`, `Tbody`, `Tr`, `Th`, and `Td`. This approach provides a clear, semantic structure for your data and leverages Bulma's default table styling. Use this pattern for any standard tabular data display in your application.

```tsx live
<Table>
  <Thead>
    <Tr>
      <Th>Name</Th>
      <Th>Age</Th>
      <Th>Role</Th>
    </Tr>
  </Thead>
  <Tbody>
    <Tr>
      <Td>Alice</Td>
      <Td>30</Td>
      <Td>Engineer</Td>
    </Tr>
    <Tr>
      <Td>Bob</Td>
      <Td>28</Td>
      <Td>Designer</Td>
    </Tr>
  </Tbody>
</Table>
```

### All Modifiers

Showcase the full range of table customization by combining multiple props on the `Table` component. Use `isBordered` to add borders, `isStriped` for zebra-striping, `isNarrow` for compact cells, `isHoverable` for row hover effects, `isFullwidth` to stretch the table to its container, and `isResponsive` for horizontal scrolling on small screens. These modifiers can be mixed and matched to achieve the exact look and behavior you need.

```tsx live
<Table isBordered isStriped isNarrow isHoverable isFullwidth isResponsive>
  <Thead>
    <Tr>
      <Th>Column 1</Th>
      <Th>Column 2</Th>
    </Tr>
  </Thead>
  <Tbody>
    <Tr>
      <Td>Cell 1</Td>
      <Td>Cell 2</Td>
    </Tr>
    <Tr>
      <Td>Cell 3</Td>
      <Td>Cell 4</Td>
    </Tr>
  </Tbody>
</Table>
```

### Responsive Table (horizontal scroll on mobile)

Enable the `isResponsive` prop to make your table horizontally scrollable on small screens. This ensures that wide tables with many columns remain accessible and readable on mobile devices, without breaking the layout or hiding data.

```tsx live
<Table isResponsive>
  <Thead>
    <Tr>
      {Array.from({ length: 20 }, (_, i) => (
        <Th key={`col-${i + 1}`}>Column {i + 1}</Th>
      ))}
    </Tr>
  </Thead>
  <Tbody>
    {Array.from({ length: 2 }, (_, row) => (
      <Tr key={row}>
        {Array.from({ length: 20 }, (_, col) => (
          <Td key={`cell-${row + 1}-${col + 1}`}>
            Cell {row + 1}-{col + 1}
          </Td>
        ))}
      </Tr>
    ))}
  </Tbody>
</Table>
```

### Colored Cells

Apply the `color` prop to individual `Td` cells to use Bulma's color modifiers. This is helpful for highlighting important data, categorizing information, or simply making your tables more visually engaging. You can use colors like `primary`, `success`, `warning`, `danger`, `info`, and more.

```tsx live
<Table isBordered isFullwidth>
  <Thead>
    <Tr>
      <Th>Cell Color</Th>
      <Th>Example</Th>
    </Tr>
  </Thead>
  <Tbody>
    <Tr>
      <Td>Primary</Td>
      <Td color="primary">Primary Colored Cell</Td>
    </Tr>
    <Tr>
      <Td>Success</Td>
      <Td color="success">Success Colored Cell</Td>
    </Tr>
    {/* ...and so on for link, warning, danger, info, black, dark, light, white */}
  </Tbody>
</Table>
```

### Highlighted Row

Use the `isSelected` prop on a `Tr` to highlight a specific row. This is ideal for drawing attention to active selections, search results, or rows that require user action.

```tsx live
<Table isFullwidth>
  <Thead>
    <Tr>
      <Th>Team</Th>
      <Th>Wins</Th>
      <Th>Losses</Th>
    </Tr>
  </Thead>
  <Tbody>
    <Tr isSelected>
      <Td>Ice Wolves</Td>
      <Td>32</Td>
      <Td>8</Td>
    </Tr>
    <Tr>
      <Td>Frost Giants</Td>
      <Td>30</Td>
      <Td>9</Td>
    </Tr>
  </Tbody>
</Table>
```

### Custom Alignment and Width

To control the alignment and width of table header cells, use the `isAligned` and `width` props on the `Th` component. Set `isAligned` to `left`, `right`, or `centered` to adjust text alignment, and use `width` with a number or string (e.g., `width={200}` or `width="100px"`) to specify the column width. This is useful for formatting tables with specific layout requirements or for emphasizing certain columns.

```tsx live
<Table>
  <Thead>
    <Tr>
      <Th isAligned="left" width={200}>
        Name
      </Th>
      <Th isAligned="right">Score</Th>
    </Tr>
  </Thead>
  <Tbody>
    <Tr>
      <Td>Jane Doe</Td>
      <Td>98</Td>
    </Tr>
  </Tbody>
</Table>
```

---

### Compound (dot-notation) usage

Every table sub-component is also available as a static on `Table` under its exact export name — `Table.Thead`, `Table.Tbody`, `Table.Tfoot`, `Table.Tr`, `Table.Th`, and `Table.Td` — so a full table can be composed from the single `Table` import.

```tsx live
<Table isStriped>
  <Table.Thead>
    <Table.Tr>
      <Table.Th>Team</Table.Th>
      <Table.Th>Points</Table.Th>
    </Table.Tr>
  </Table.Thead>
  <Table.Tbody>
    <Table.Tr>
      <Table.Td>Maple Leafs</Table.Td>
      <Table.Td>98</Table.Td>
    </Table.Tr>
  </Table.Tbody>
</Table>
```

---

## Accessibility

- **Semantics:** Uses `<table>`, `<thead>`, `<tbody>`, `<tfoot>`, `<tr>`, `<th>`, and `<td>`—all proper HTML table elements.
- **Responsive:** When using `isResponsive`, the table is wrapped in a scrollable container.
- **Screen Readers:** Always use `<Th>` for header cells, and provide descriptive column headings.

:::tip
For responsive tables, ensure your column headers are clear and concise for small screens.
:::

---

## Related Components

- [`Block`](./block.md): For spacing and grouping tables.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Bulma Table Documentation](https://bulma.io/documentation/elements/table/)
- [Storybook: Table Stories](https://bestax.io/storybook/?path=/story/elements-table--default)
  :::

---

## Props

### Table

<!-- bestax:generated props -->

| Prop           | Type                                                     | Default | Description                                                   |
| -------------- | -------------------------------------------------------- | ------- | ------------------------------------------------------------- |
| `className`    | `string`                                                 | —       | Additional CSS classes to apply.                              |
| `isBordered`   | `boolean`                                                | `false` | Adds borders to all the cells.                                |
| `isStriped`    | `boolean`                                                | `false` | Adds zebra-striping to rows.                                  |
| `isNarrow`     | `boolean`                                                | `false` | Makes the table more compact by cutting cell padding in half. |
| `isHoverable`  | `boolean`                                                | `false` | Adds a hover effect on rows.                                  |
| `isFullwidth`  | `boolean`                                                | `false` | Makes the table span the full width of its parent.            |
| `isResponsive` | `boolean`                                                | `false` | Makes the table horizontally scrollable on small screens.     |
| `children`     | `React.ReactNode`                                        | —       | Table content (should use subcomponents).                     |
| `...`          | All standard `<table>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md)             |

**Subcomponents:**

- `Table.Thead`: Thead component for rendering a styled Bulma table header. Supports Bulma helper classes for additional styling.
- `Table.Tbody`: Tbody component for rendering a styled Bulma table body. Supports Bulma helper classes for additional styling.
- `Table.Tfoot`: Tfoot component for rendering a styled Bulma table footer. Supports Bulma helper classes for additional styling.
- `Table.Tr`: Tr component for rendering a styled Bulma table row. Supports the is-selected modifier and color modifiers.
- `Table.Th`: Th component for rendering a styled Bulma table header cell. Supports alignment, width, and color modifiers.
- `Table.Td`: Td component for rendering a styled Bulma table cell. Supports Bulma color modifiers and helper classes for additional styling.

### Table.Thead

| Prop        | Type                                                               | Default | Description                                       |
| ----------- | ------------------------------------------------------------------ | ------- | ------------------------------------------------- |
| `className` | `string`                                                           | —       | Additional CSS classes to apply.                  |
| `children`  | `React.ReactNode`                                                  | —       | Table header content (rows).                      |
| `...`       | All standard `<thead>`/`<tbody>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### Table.Tbody

| Prop        | Type                                                               | Default | Description                                       |
| ----------- | ------------------------------------------------------------------ | ------- | ------------------------------------------------- |
| `className` | `string`                                                           | —       | Additional CSS classes to apply.                  |
| `children`  | `React.ReactNode`                                                  | —       | Table body content (rows).                        |
| `...`       | All standard `<thead>`/`<tbody>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### Table.Tfoot

| Prop        | Type                                                               | Default | Description                                       |
| ----------- | ------------------------------------------------------------------ | ------- | ------------------------------------------------- |
| `className` | `string`                                                           | —       | Additional CSS classes to apply.                  |
| `children`  | `React.ReactNode`                                                  | —       | Table footer content (rows).                      |
| `...`       | All standard `<thead>`/`<tbody>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### Table.Tr

| Prop         | Type                                                  | Default | Description                                                   |
| ------------ | ----------------------------------------------------- | ------- | ------------------------------------------------------------- |
| `className`  | `string`                                              | —       | Additional CSS classes to apply.                              |
| `isSelected` | `boolean`                                             | `false` | Whether the row is selected (adds Bulma's is-selected class). |
| `color`      | `TableColor`                                          | —       | Bulma color modifier for the table row.                       |
| `children`   | `React.ReactNode`                                     | —       | Table row content (cells).                                    |
| `...`        | All standard `<tr>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md)             |

**Types:**

- `TableColor`: `'primary'` | `'link'` | `'info'` | `'success'` | `'warning'` | `'danger'` | `'black'` | `'dark'` | `'light'` | `'white'` — Valid color values for the Td component (Bulma table cell colors).

### Table.Th

| Prop        | Type                                                         | Default | Description                                                       |
| ----------- | ------------------------------------------------------------ | ------- | ----------------------------------------------------------------- |
| `className` | `string`                                                     | —       | Additional CSS classes to apply.                                  |
| `isAligned` | `'left'` \| `'right'` \| `'centered'`                        | —       | Text alignment for the header cell ('left', 'right', 'centered'). |
| `width`     | `string` \| `number`                                         | —       | Width of the header cell (e.g., '100px' or 100).                  |
| `color`     | `TableColor`                                                 | —       | Bulma color modifier for the header cell.                         |
| `children`  | `React.ReactNode`                                            | —       | Table header cell content.                                        |
| `...`       | All standard `<td>`/`<th>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md)                 |

**Types:**

- `TableColor`: `'primary'` | `'link'` | `'info'` | `'success'` | `'warning'` | `'danger'` | `'black'` | `'dark'` | `'light'` | `'white'` — Valid color values for the Td component (Bulma table cell colors).

### Table.Td

| Prop        | Type                                                         | Default | Description                                       |
| ----------- | ------------------------------------------------------------ | ------- | ------------------------------------------------- |
| `className` | `string`                                                     | —       | Additional CSS classes to apply.                  |
| `color`     | `TableColor`                                                 | —       | Bulma color modifier for the table cell.          |
| `children`  | `React.ReactNode`                                            | —       | Table cell content.                               |
| `...`       | All standard `<td>`/`<th>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

**Types:**

- `TableColor`: `'primary'` | `'link'` | `'info'` | `'success'` | `'warning'` | `'danger'` | `'black'` | `'dark'` | `'light'` | `'white'` — Valid color values for the Td component (Bulma table cell colors).

<!-- /bestax:generated props -->

### Thead / Tbody / Tfoot

| Prop        | Type                                      | Default | Description                                      |
| ----------- | ----------------------------------------- | ------- | ------------------------------------------------ |
| `className` | `string`                                  | —       | Additional CSS classes.                          |
| `children`  | `ReactNode`                               | —       | Section content (typically `Tr` rows).           |
| ...         | All standard props and Bulma helper props |         | (See [Helper Props](../helpers/usebulmaclasses)) |

### Tr

| Prop         | Type                                      | Default | Description                                      |
| ------------ | ----------------------------------------- | ------- | ------------------------------------------------ |
| `className`  | `string`                                  | —       | Additional CSS classes.                          |
| `isSelected` | `boolean`                                 | —       | Adds Bulma's `is-selected` class.                |
| `color`      | `TableColor`                              | —       | Bulma color modifier for the row.                |
| `children`   | `ReactNode`                               | —       | Row content (typically `Th`/`Td`).               |
| ...          | All standard props and Bulma helper props |         | (See [Helper Props](../helpers/usebulmaclasses)) |

### Th

| Prop        | Type                                      | Default | Description                                      |
| ----------- | ----------------------------------------- | ------- | ------------------------------------------------ |
| `className` | `string`                                  | —       | Additional CSS classes.                          |
| `isAligned` | `'left' \| 'right' \| 'centered'`         | —       | Text alignment.                                  |
| `width`     | `string \| number`                        | —       | Cell width (e.g., `'100px'`, `100`).             |
| `color`     | `TableColor`                              | —       | Bulma color modifier for the header cell.        |
| `children`  | `ReactNode`                               | —       | Header cell content.                             |
| ...         | All standard props and Bulma helper props |         | (See [Helper Props](../helpers/usebulmaclasses)) |

### Td

| Prop        | Type                                      | Default | Description                                      |
| ----------- | ----------------------------------------- | ------- | ------------------------------------------------ |
| `className` | `string`                                  | —       | Additional CSS classes.                          |
| `color`     | `TableColor`                              | —       | Bulma color modifier for the cell.               |
| `children`  | `ReactNode`                               | —       | Cell content.                                    |
| ...         | All standard props and Bulma helper props |         | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Table` registers these variables on its own `.table` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                            | Sass Variable                                    | Default                        |
| ------------------------------------------------------- | ------------------------------------------------ | ------------------------------ |
| `--bulma-table-color`                                   | `$table-color`                                   | `var(--bulma-text-strong)`     |
| `--bulma-table-background-color`                        | `$table-background-color`                        | `var(--bulma-scheme-main)`     |
| `--bulma-table-cell-border-color`                       | `$table-cell-border-color`                       | `var(--bulma-border)`          |
| `--bulma-table-cell-border-style`                       | `$table-cell-border-style`                       | `solid`                        |
| `--bulma-table-cell-border-width`                       | `$table-cell-border-width`                       | `0 0 1px`                      |
| `--bulma-table-cell-padding`                            | `$table-cell-padding`                            | `0.5em 0.75em`                 |
| `--bulma-table-cell-heading-color`                      | `$table-cell-heading-color`                      | `var(--bulma-text-strong)`     |
| `--bulma-table-cell-text-align`                         | `$table-cell-text-align`                         | `left`                         |
| `--bulma-table-head-cell-border-width`                  | `$table-head-cell-border-width`                  | `0 0 2px`                      |
| `--bulma-table-head-cell-color`                         | `$table-head-cell-color`                         | `var(--bulma-text-strong)`     |
| `--bulma-table-foot-cell-border-width`                  | `$table-foot-cell-border-width`                  | `2px 0 0`                      |
| `--bulma-table-foot-cell-color`                         | `$table-foot-cell-color`                         | `var(--bulma-text-strong)`     |
| `--bulma-table-head-background-color`                   | `$table-head-background-color`                   | `transparent`                  |
| `--bulma-table-body-background-color`                   | `$table-body-background-color`                   | `transparent`                  |
| `--bulma-table-foot-background-color`                   | `$table-foot-background-color`                   | `transparent`                  |
| `--bulma-table-row-hover-background-color`              | `$table-row-hover-background-color`              | `var(--bulma-scheme-main-bis)` |
| `--bulma-table-row-active-background-color`             | `$table-row-active-background-color`             | `var(--bulma-primary)`         |
| `--bulma-table-row-active-color`                        | `$table-row-active-color`                        | `var(--bulma-primary-invert)`  |
| `--bulma-table-striped-row-even-background-color`       | `$table-striped-row-even-background-color`       | `var(--bulma-scheme-main-bis)` |
| `--bulma-table-striped-row-even-hover-background-color` | `$table-striped-row-even-hover-background-color` | `var(--bulma-scheme-main-ter)` |

<!-- /bestax:generated cssvars -->
