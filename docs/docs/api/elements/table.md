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

`Tr` and `Th` take the same colors. They are exported as the `validTableColors` tuple, for building a color picker or checking a value that arrives at runtime. See [valid value constants](../helpers/valid-values.md#table-color-constant).

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

`Td` takes the same `isAligned` values, so a column's body cells can line up with its header. A `style` on a `Th` keeps its `width`, and a `width` inside that `style` wins.

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
      <Td isAligned="left">Jane Doe</Td>
      <Td isAligned="right">98</Td>
    </Tr>
  </Tbody>
</Table>
```

### A Column of Checkboxes

`isNarrow` on a `Th` or `Td` shrinks the cell to its content and keeps it on one line, Bulma's `is-narrow` cell, which suits a column of checkboxes or actions. It isn't the table's own `isNarrow`, which tightens every cell's padding. `isVcentered` centers a cell's content vertically, where cells otherwise sit at the top.

`isSelected` is a look only, so a row picked for an action needs a checkbox named for it, as here. A bestax `Checkbox` or `Radio` placed straight in a selected row's cell takes the row's text color, so a checked one still shows on the row's fill. One in a menu or a table nested in the cell, or in a cell or a row with a `color` of its own, keeps its own colors, since it sits on that surface instead.

```tsx live
function example() {
  const teams = ['Ice Wolves', 'Frost Giants', 'Snow Owls'];
  const [picked, setPicked] = useState(['Ice Wolves']);
  const toggle = (team: string) =>
    setPicked(current =>
      current.includes(team)
        ? current.filter(name => name !== team)
        : [...current, team]
    );

  return (
    <Table isFullwidth>
      <Thead>
        <Tr>
          <Th isNarrow>
            <Span visibility="sr-only">Picked</Span>
          </Th>
          <Th>Team</Th>
        </Tr>
      </Thead>
      <Tbody>
        {teams.map(team => (
          <Tr key={team} isSelected={picked.includes(team)}>
            <Td isNarrow isVcentered>
              <Checkbox
                aria-label={`Pick ${team}`}
                checked={picked.includes(team)}
                onChange={() => toggle(team)}
              />
            </Td>
            <Td isVcentered>{team}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
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
- **Right to left:** with `bestax.css` and its variants, a header cell aligns to the start of the line, as the body cells do, so on a right-to-left page both sit on the right. They build Bulma with `$table-cell-text-align: start`, where Bulma's own default, in the table below, is `left`. With `extras.css` and a Bulma of your own, set `$table-cell-text-align: start` in your Bulma build, or `--bulma-table-cell-text-align: start` on the table, to get the same. `isAligned` or an `align` attribute still sets a cell's own alignment.

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

| Prop           | Type                                                     | Default | Description                                                                                                                        |
| -------------- | -------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `className`    | `string`                                                 | —       | Additional CSS classes to apply.                                                                                                   |
| `isBordered`   | `boolean`                                                | `false` | Adds borders to all cells.                                                                                                         |
| `isStriped`    | `boolean`                                                | `false` | Adds zebra-striping to rows.                                                                                                       |
| `isNarrow`     | `boolean`                                                | `false` | Makes the table more compact by cutting cell padding in half.                                                                      |
| `isHoverable`  | `boolean`                                                | `false` | Adds a hover effect on rows.                                                                                                       |
| `isFullwidth`  | `boolean`                                                | `false` | Makes the table span the full width of its parent.                                                                                 |
| `isFullWidth`  | `boolean`                                                | `false` | **Deprecated.** Use `isFullwidth` instead — `isFullwidth` wins if both are set. Makes the table span the full width of its parent. |
| `isResponsive` | `boolean`                                                | `false` | Makes the table horizontally scrollable on small screens.                                                                          |
| `children`     | `React.ReactNode`                                        | —       | Table content (should use subcomponents).                                                                                          |
| `...`          | All standard `<table>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                  |

**Subcomponents:**

- `Table.Thead`: Thead component for rendering a styled Bulma table header. Supports Bulma helper classes for additional styling.
- `Table.Tbody`: Tbody component for rendering a styled Bulma table body. Supports Bulma helper classes for additional styling.
- `Table.Tfoot`: Tfoot component for rendering a styled Bulma table footer. Supports Bulma helper classes for additional styling.
- `Table.Tr`: Tr component for rendering a styled Bulma table row. Supports the is-selected modifier and color modifiers.
- `Table.Th`: Th component for rendering a styled Bulma table header cell. Supports alignment, width, narrow and vertically centered cells, and color modifiers.
- `Table.Td`: Td component for rendering a styled Bulma table cell. Supports alignment, narrow and vertically centered cells, Bulma color modifiers, and helper classes for additional styling.

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

| Prop         | Type                                                  | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------ | ----------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className`  | `string`                                              | —       | Additional CSS classes to apply.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `isSelected` | `boolean`                                             | `false` | Whether the row is selected (adds Bulma's is-selected class). It's a look only: it says nothing to assistive tech, so pair it with a checkbox named for the row when the selection matters. A bestax `Checkbox` or `Radio` placed straight in one of the row's cells takes the row's text color, so a checked one shows on the row's fill. One in a menu or a table nested in a cell, or in a cell with a `color` of its own, keeps its own colors, since it sits on that surface instead, and so does every one in a row with a `color`, whose cells paint that color over the fill. |
| `color`      | `TableColor`                                          | —       | Bulma color modifier for the table row.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `children`   | `React.ReactNode`                                     | —       | Table row content (cells).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `...`        | All standard `<tr>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

**Types:**

- `TableColor`: `'primary'` | `'link'` | `'info'` | `'success'` | `'warning'` | `'danger'` | `'black'` | `'dark'` | `'light'` | `'white'` — The color values `Tr`, `Th` and `Td` accept, typed from `validTableColors`.

### Table.Th

| Prop          | Type                                                         | Default | Description                                                                                                                                                                                                                  |
| ------------- | ------------------------------------------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className`   | `string`                                                     | —       | Additional CSS classes to apply.                                                                                                                                                                                             |
| `isAligned`   | `'left'` \| `'right'` \| `'centered'`                        | —       | Text alignment for the header cell ('left', 'right', 'centered'). Without it, `bestax.css` and its variants align a header to the start of the line, as the body cells are, so it sits on the right on a right-to-left page. |
| `isNarrow`    | `boolean`                                                    | `false` | Shrinks the cell to its content and keeps that on one line (Bulma's `is-narrow`), as for a column of checkboxes or actions. Not the table's own `isNarrow`, which tightens every cell's padding.                             |
| `isVcentered` | `boolean`                                                    | `false` | Centers the content vertically (Bulma's `is-vcentered`). Cells sit at the top otherwise.                                                                                                                                     |
| `width`       | `string` \| `number`                                         | —       | Width of the header cell (e.g., '100px' or 100), written into its `style`. A `style` passed as well keeps it, and a `width` that `style` sets wins.                                                                          |
| `color`       | `TableColor`                                                 | —       | Bulma color modifier for the header cell.                                                                                                                                                                                    |
| `children`    | `React.ReactNode`                                            | —       | Table header cell content.                                                                                                                                                                                                   |
| `...`         | All standard `<td>`/`<th>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                            |

**Types:**

- `TableColor`: `'primary'` | `'link'` | `'info'` | `'success'` | `'warning'` | `'danger'` | `'black'` | `'dark'` | `'light'` | `'white'` — The color values `Tr`, `Th` and `Td` accept, typed from `validTableColors`.

### Table.Td

| Prop          | Type                                                         | Default | Description                                                                                                                                                                                      |
| ------------- | ------------------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `className`   | `string`                                                     | —       | Additional CSS classes to apply.                                                                                                                                                                 |
| `isAligned`   | `'left'` \| `'right'` \| `'centered'`                        | —       | Text alignment for the table cell ('left', 'right', 'centered').                                                                                                                                 |
| `isNarrow`    | `boolean`                                                    | `false` | Shrinks the cell to its content and keeps that on one line (Bulma's `is-narrow`), as for a column of checkboxes or actions. Not the table's own `isNarrow`, which tightens every cell's padding. |
| `isVcentered` | `boolean`                                                    | `false` | Centers the content vertically (Bulma's `is-vcentered`). Cells sit at the top otherwise.                                                                                                         |
| `color`       | `TableColor`                                                 | —       | Bulma color modifier for the table cell.                                                                                                                                                         |
| `children`    | `React.ReactNode`                                            | —       | Table cell content.                                                                                                                                                                              |
| `...`         | All standard `<td>`/`<th>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                |

**Types:**

- `TableColor`: `'primary'` | `'link'` | `'info'` | `'success'` | `'warning'` | `'danger'` | `'black'` | `'dark'` | `'light'` | `'white'` — The color values `Tr`, `Th` and `Td` accept, typed from `validTableColors`.

<!-- /bestax:generated props -->

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
