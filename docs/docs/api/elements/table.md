---
title: Table
sidebar_label: Table
---

# Table

## Overview

The `Table` component and its subcomponents provide a highly composable, Bulma-styled table system for React. You get full access to Bulma’s table features—borders, stripes, narrow cells, hover effects, responsive scroll, cell/row coloring, and more—using idiomatic React patterns. All Bulma helper props for spacing and color are supported.

:::info
Use the full suite: `Table`, `Thead`, `Tbody`, `Tfoot`, `Tr`, `Th`, and `Td` for maximum flexibility and Bulma compatibility.
:::

---

## Import

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

---

## Props

### Table

| Prop           | Type                                          | Default | Description                                               |
| -------------- | --------------------------------------------- | ------- | --------------------------------------------------------- |
| `className`    | `string`                                      | —       | Additional CSS classes.                                   |
| `isBordered`   | `boolean`                                     | —       | Adds borders to all cells.                                |
| `isStriped`    | `boolean`                                     | —       | Adds zebra-striping to rows.                              |
| `isNarrow`     | `boolean`                                     | —       | Makes the table more compact.                             |
| `isHoverable`  | `boolean`                                     | —       | Adds a hover effect on rows.                              |
| `isFullwidth`  | `boolean`                                     | —       | Makes the table span the full width of its parent.        |
| `isResponsive` | `boolean`                                     | —       | Makes the table horizontally scrollable on small screens. |
| `children`     | `ReactNode`                                   | —       | Table content (should use subcomponents).                 |
| ...            | All standard `<table>` and Bulma helper props |         | (See [Helper Props](../helpers/usebulmaclasses))          |

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

## Usage

### Basic Table

```tsx
<Table>
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
  </Tbody>
</Table>
```

### All Modifiers

```tsx
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

```tsx
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

```tsx
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

```tsx
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

```tsx
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
- [Storybook: Table Stories](https://storybook.bestax.cc/?path=/story/elements-table--default)
  :::
