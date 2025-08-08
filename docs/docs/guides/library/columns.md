---
title: Columns Components Overview
sidebar_label: Columns
sidebar_position: 5
---

# Columns Components

This page summarizes the Bulma-styled columns system in Bestax, with a brief description, usage example, and links to full documentation for each. Use these components to build responsive, flexible, and declarative grid layouts.

---

## Columns

A responsive grid container for aligning and distributing `Column` components. Supports wrapping, gap control, centering, vertical alignment, responsive breakpoints, and all Bulma/utility helper props.

:::info
Use `Columns` as the parent for all column-based layouts. It handles responsive wrapping and spacing automatically.
:::

```tsx live
<Columns>
  <Column>
    <Notification color="primary">First column</Notification>
  </Column>
  <Column>
    <Notification color="info">Second column</Notification>
  </Column>
</Columns>
```

**Gapless Columns**

Remove the gap between columns using the `isGapless` prop. This is useful for tightly packed layouts.

:::tip
`isGapless` is great for dashboards or toolbars where you want columns to touch.
:::

```tsx live
<Columns isGapless>
  <Column>
    <Notification color="primary">No gap 1</Notification>
  </Column>
  <Column>
    <Notification color="info">No gap 2</Notification>
  </Column>
</Columns>
```

**Multiline Columns**

Allow columns to wrap to multiple lines using the `isMultiline` prop. This is helpful for responsive layouts with many columns.

:::caution
If you have more columns than fit in one row, use `isMultiline` to prevent overflow on small screens.
:::

```tsx live
<Columns isMultiline>
  <Column>
    <Notification color="primary">Column 1</Notification>
  </Column>
  <Column>
    <Notification color="info">Column 2</Notification>
  </Column>
  <Column>
    <Notification color="success">Column 3</Notification>
  </Column>
  <Column>
    <Notification color="warning">Column 4</Notification>
  </Column>
</Columns>
```

[View full documentation.](../api/columns)

---

## Column

A single responsive layout column using Bulma's flexbox-based column system. Supports all Bulma column size modifiers, responsive sizes and offsets, color/background helpers, and narrow behavior. Use together with `Columns` for powerful, declarative layouts.

**Column Sizes**

Set the `size` prop to control the width of each column. You can use values like `"half"`, `"one-quarter"`, or numbers for fractional widths.

:::info
Mix and match column sizes for flexible layouts. Unspecified columns will auto-fill remaining space.
:::

```tsx live
<Columns>
  <Column size="half">
    <Notification color="primary">Half width</Notification>
  </Column>
  <Column size="one-quarter">
    <Notification color="info">One quarter</Notification>
  </Column>
  <Column>
    <Notification color="success">Auto width</Notification>
  </Column>
</Columns>
```

**Narrow Columns**

Use the `isNarrow` prop to make a column only as wide as its content.

:::tip
Narrow columns are perfect for buttons, icons, or small controls in a row.
:::

```tsx live
<Columns>
  <Column>
    <Notification color="primary">Normal</Notification>
  </Column>
  <Column isNarrow>
    <Notification color="warning">Narrow</Notification>
  </Column>
  <Column>
    <Notification color="info">Normal</Notification>
  </Column>
</Columns>
```

**Offset Columns**

Offset a column to add space before it using the `offset` prop.

:::caution
Offsets are useful for centering or right-aligning columns, but can cause layout issues if overused.
:::

```tsx live
<Columns>
  <Column>
    <Notification color="primary">First</Notification>
  </Column>
  <Column offset={2}>
    <Notification color="danger">Offset by 2</Notification>
  </Column>
</Columns>
```

[View full documentation.](../api/columns/column)

---

For more details and advanced usage, see the full documentation for each component linked above.
