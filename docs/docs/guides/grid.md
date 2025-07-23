---
title: Grid Components Overview
sidebar_label: Grid
sidebar_position: 6
---

# Grid Components

This page summarizes the Bulma-styled grid system in Bestax, with a brief description, usage example, and links to full documentation for each. Use these components for advanced, responsive, and modern CSS grid layouts.

---

## Grid

Provides Bulma's advanced CSS Grid layout for complex, modern layouts. Supports responsive and fixed grid modes, gap and min column controls, fixed column counts per breakpoint, and full color/background/utility helpers. Use with `Cell` for granular grid placement.

:::info
Use `Grid` for advanced layouts where you need more control than Columns can provide. It supports both auto-fit and fixed column counts.
:::

```tsx live
<Grid>
  {[...Array(4)].map((_, i) => (
    <Cell key={i}>
      <Notification color="primary">Cell {i + 1}</Notification>
    </Cell>
  ))}
</Grid>
```

**Fixed Columns**

Set the `isFixed` and `fixedCols` props to create a grid with a fixed number of columns.

:::tip
Fixed grids are great for dashboards or galleries where you want a consistent number of columns at each breakpoint.
:::

```tsx live
<Grid isFixed fixedCols={3}>
  {[...Array(6)].map((_, i) => (
    <Cell key={i}>
      <Notification color="info">Fixed {i + 1}</Notification>
    </Cell>
  ))}
</Grid>
```

**Custom Gaps**

Control the gap between grid cells using the `gap`, `columnGap`, or `rowGap` props.

:::caution
Setting very large gaps can cause layout issues on small screens. Test your grid at all breakpoints.
:::

```tsx live
<Grid gap={6}>
  <Cell>
    <Notification color="success">Gap 1</Notification>
  </Cell>
  <Cell>
    <Notification color="warning">Gap 2</Notification>
  </Cell>
</Grid>
```

[View full documentation.](../api/grid)

---

## Cell

A single Bulma grid cell for use inside the `Grid` component. Supports all Bulma grid CSS classes for manual placement and spanning, color/background helpers, and all utility/HTML props.

**Manual Placement**

Use the `colSpan` and `rowSpan` props to control how many columns or rows a cell should span.

:::tip
Spanning cells is useful for headers, footers, or feature cards that need to take up more space.
:::

```tsx live
<Grid isFixed fixedCols={3}>
  <Cell colSpan={2}>
    <Notification color="primary">Span 2 columns</Notification>
  </Cell>
  <Cell>
    <Notification color="info">Normal</Notification>
  </Cell>
  <Cell>
    <Notification color="success">Normal</Notification>
  </Cell>
</Grid>
```

[View full documentation.](../api/grid/cell)

---

For more details and advanced usage, see the full documentation for each component linked above.
