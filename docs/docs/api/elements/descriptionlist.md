---
title: DescriptionList
sidebar_label: DescriptionList
description: The `DescriptionList` component lists facts about one thing, each a label and its value, such as an order's details or a profile.
keywords:
  - description list
  - data list
  - key-value
  - key value pairs
  - definition list
  - details list
  - summary list
---

# DescriptionList

## Overview

<!-- bestax:generated overview -->

The `DescriptionList` component lists facts about one thing, each a label and its value, such as an order's details or a profile.

<!-- /bestax:generated overview -->

Reach for it wherever a page says what something is, one fact at a time: an order's number, date
and total, an account's name and plan, a file's size and owner, or the answers a user is about to
submit. Other libraries call it a data list or a key-value list.

It's HTML's own description list, a `<dl>` with a `<dt>` for each label and a `<dd>` for each
value. Labels sit above their values on a phone and beside them from Bulma's tablet breakpoint up,
where every label shares one column so the values line up.

:::info
Bulma styles a description list only inside `Content`, so `DescriptionList` brings its own styles,
in `bestax.css` and its variants, or in `extras.css` next to your own Bulma.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { DescriptionList } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Give each `DescriptionList.Item` a `label` and a `value`. Name the list by the heading above it
with `aria-labelledby`, so a screen reader says what the list is about when it gets there. Make
the window narrower than 769px to see the labels move above their values.

```tsx live
<>
  <Title as="h2" textSize="5" id="order-heading">
    Order details
  </Title>
  <DescriptionList aria-labelledby="order-heading">
    <DescriptionList.Item label="Order" value="#1234" />
    <DescriptionList.Item label="Placed on" value="14 October 2026" />
    <DescriptionList.Item
      label="Estimated delivery"
      value="Between 18 and 21 October 2026"
    />
    <DescriptionList.Item label="Total" value="$86.40" />
  </DescriptionList>
</>
```

### Links, Tags and Other Values

A `value`, or a `label`, takes any node, so it can be a link, a `Tag` or a formatted date. When a
value is missing, say so in words: an empty value renders nothing, and a label with nothing after
it reads as a mistake.

```tsx live
<DescriptionList>
  <DescriptionList.Item
    label="Status"
    value={<Tag color="success">Shipped</Tag>}
  />
  <DescriptionList.Item
    label="Tracking"
    value={<Link href="#track">1Z999AA10123456784</Link>}
  />
  <DescriptionList.Item label="Coupon" value="None used" />
</DescriptionList>
```

### Several Values

For anything the props don't cover, put `DescriptionList.Label` and `DescriptionList.Value` in
the item. An item can have several values, each in its own `<dd>`, and they line up under each
other. `label` renders before the children and `value` after them, so you can mix the two.

```tsx live
<DescriptionList>
  <DescriptionList.Item label="Delivery notes">
    <DescriptionList.Value>Leave with a neighbour</DescriptionList.Value>
    <DescriptionList.Value>Ring twice</DescriptionList.Value>
  </DescriptionList.Item>
  <DescriptionList.Item label="Gift message" value="Happy birthday, Ada!" />
</DescriptionList>
```

### An Info Tip on a Label

To explain a label, put a [`Popover`](../components/popover.md) in it, opened by a real button
named "About" and the label, so a keyboard reaches it and a screen reader says what it's about.
Name each tip for its own label, rather than "Info" on every row.

```tsx live
<DescriptionList>
  <DescriptionList.Item label="Order" value="#1234" />
  <DescriptionList.Item value="Partner warehouse">
    <DescriptionList.Label>
      Fulfilment{' '}
      <Popover
        ariaLabel="About fulfilment"
        trigger={
          <Button size="small" color="ghost" aria-label="About fulfilment">
            <Icon name="circle-info" />
          </Button>
        }
      >
        <Popover.Body>
          Packed and shipped by a partner warehouse, not by us.
        </Popover.Body>
        <Popover.Footer>
          <Popover.Close size="small">Close</Popover.Close>
        </Popover.Footer>
      </Popover>
    </DescriptionList.Label>
  </DescriptionList.Item>
</DescriptionList>
```

### Orientation

`orientation` pins the layout at every width: `horizontal` keeps each label beside its value, and
`vertical` keeps it above. Beside, the labels' column is as wide as the longest label, up to the
share of the list `--bulma-description-list-label-max-width` sets, 40% by default, and longer labels
wrap.

```tsx live
<>
  <DescriptionList orientation="horizontal">
    <DescriptionList.Item label="Name" value="Ada Lovelace" />
    <DescriptionList.Item label="Email address" value="ada@example.com" />
  </DescriptionList>
  <DescriptionList orientation="vertical">
    <DescriptionList.Item label="Name" value="Ada Lovelace" />
    <DescriptionList.Item label="Email address" value="ada@example.com" />
  </DescriptionList>
</>
```

### Per Viewport

`orientationMobile`, `orientationTablet`, `orientationDesktop`, `orientationWidescreen` and
`orientationFullhd` pin it from their own breakpoint up, the way a `Column`'s `size` props do, and
where several apply the widest one wins. This list keeps its labels above until the desktop
breakpoint, for a narrow sidebar on a tablet.

```tsx live
<DescriptionList orientation="vertical" orientationDesktop="horizontal">
  <DescriptionList.Item label="Plan" value="Team" />
  <DescriptionList.Item label="Seats" value="12 of 15 used" />
  <DescriptionList.Item label="Renews on" value="1 November 2026" />
</DescriptionList>
```

### Dividers

`hasDividers` draws a line between items. It helps the eye from a label to its value across a
wide list, and shows where each item ends to someone zoomed in.

```tsx live
<DescriptionList hasDividers>
  <DescriptionList.Item label="Name" value="Ada Lovelace" />
  <DescriptionList.Item label="Email" value="ada@example.com" />
  <DescriptionList.Item label="Plan" value="Team" />
  <DescriptionList.Item label="Member since" value="March 2019" />
</DescriptionList>
```

### Text Size

It takes the font size around it, and its gaps are in em, so the `textSize` helper scales the
whole list.

```tsx live
<>
  <DescriptionList textSize="7">
    <DescriptionList.Item label="Size" value="2.4 MB" />
    <DescriptionList.Item label="Type" value="PDF document" />
  </DescriptionList>
  <DescriptionList textSize="5">
    <DescriptionList.Item label="Size" value="2.4 MB" />
    <DescriptionList.Item label="Type" value="PDF document" />
  </DescriptionList>
</>
```

### From an Array

There's no `items` prop: map your data to items. Give each item a `key`.

```tsx live
function example() {
  const file = [
    ['Name', 'quarterly-report.pdf'],
    ['Size', '2.4 MB'],
    ['Owner', 'Ada Lovelace'],
    ['Last changed', '27 October 2026'],
  ];
  return (
    <DescriptionList>
      {file.map(([label, value]) => (
        <DescriptionList.Item key={label} label={label} value={value} />
      ))}
    </DescriptionList>
  );
}
```

### Compound (dot-notation) usage

`DescriptionList.Item`, `DescriptionList.Label` and `DescriptionList.Value` are the parts, also
exported by name as `DescriptionListItem`, `DescriptionListLabel` and `DescriptionListValue`. An
item can hold several labels for one value, as HTML allows, and they line up the same way.

```tsx live
<DescriptionList orientation="horizontal">
  <DescriptionList.Item>
    <DescriptionList.Label>Author</DescriptionList.Label>
    <DescriptionList.Label>Translator</DescriptionList.Label>
    <DescriptionList.Value>Ada Lovelace</DescriptionList.Value>
  </DescriptionList.Item>
  <DescriptionList.Item>
    <DescriptionList.Label>Languages</DescriptionList.Label>
    <DescriptionList.Value>English</DescriptionList.Value>
    <DescriptionList.Value>French</DescriptionList.Value>
    <DescriptionList.Value>Italian</DescriptionList.Value>
  </DescriptionList.Item>
</DescriptionList>
```

---

## Use a Table Instead When…

A description list holds facts about one thing. Use a [`Table`](./table.md) when the data has two
dimensions:

- several records with the same fields, such as a list of orders or a comparison of plans;
- columns people scan down, compare or add up;
- rows people sort, filter or select.

A table is also the choice when a user must hear each value with its label while moving through
it, since a screen reader reads a cell's headers as it reaches the cell. Mark the label of each
row as a header with `scope="row"`.

```tsx live
<Table isFullwidth>
  <Table.Thead>
    <Table.Tr>
      <Table.Th scope="col">Plan</Table.Th>
      <Table.Th scope="col">Storage</Table.Th>
      <Table.Th scope="col">Price</Table.Th>
    </Table.Tr>
  </Table.Thead>
  <Table.Tbody>
    <Table.Tr>
      <Table.Th scope="row">Starter</Table.Th>
      <Table.Td>10 GB</Table.Td>
      <Table.Td>$4 a month</Table.Td>
    </Table.Tr>
    <Table.Tr>
      <Table.Th scope="row">Team</Table.Th>
      <Table.Td>1 TB</Table.Td>
      <Table.Td>$12 a month</Table.Td>
    </Table.Tr>
  </Table.Tbody>
</Table>
```

---

## Accessibility

- **HTML's own elements, and no roles:** a `<dl>`, a `<div>` for each item, a `<dt>` for each
  label and a `<dd>` for each value. Browsers expose them as a list, terms and definitions.
- **A name from the heading above:** point `aria-labelledby` at it, as in
  [Basic Usage](#basic-usage), so a screen reader names the list when it reaches it.
- **Reading order is the order you write:** each label is read before its value at every width and
  in right-to-left text, since the layout only changes where the parts sit.
- **Screen readers announce it in different ways,** and none of them loses the content. Some count
  the labels and the values as separate items and some count the pairs, some say "term" and
  "definition" and some don't, and some don't say there's a list at all as you move through it.
  Adrian Roselli's notes, under Additional Resources, follow which does what. Where a user must
  hear the label with every value, [use a table](#use-a-table-instead-when).
- **Info tips:** a real button named "About" and the label, opening a `Popover`, as in
  [An Info Tip on a Label](#an-info-tip-on-a-label), rather than a tip that opens on hover.
- **Contrast:** the labels, in Bulma's `text-weak`, and the values, in `text`, both clear WCAG's
  4.5:1 against Bulma's page background in light and dark mode.
- **Forced colors:** the layout, the text and the dividers stay. The labels lose their lighter
  color there, and their place, first or above, still tells them from the values.
- **Not interactive and not live:** it has no tab stop of its own and announces nothing when it
  changes.

---

## Related Components

- [`Table`](./table.md): For data with two dimensions.
- [`Content`](./content.md): For a description list inside long-form text, styled by Bulma.
- [`Popover`](../components/popover.md): For an info tip on a label.
- [`Title`](./title.md): For the heading that names the list.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: DescriptionList Stories](https://bestax.io/storybook/?path=/story/elements-descriptionlist--default)
- [MDN: The description list element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dl)
- [Adrian Roselli: Updated Brief Note on Description List Support](https://adrianroselli.com/2025/01/updated-brief-note-on-description-list-support.html)
- [W3C: Tables with one header](https://www.w3.org/WAI/tutorials/tables/one-header/)

---

## Props

<!-- bestax:generated props -->

| Prop                    | Type                                                                    | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------- | ----------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `className`             | `string`                                                                | —       | Additional CSS classes to apply.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `children`              | `React.ReactNode`                                                       | —       | `DescriptionList.Item`s, one for each fact.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `orientation`           | `'vertical'` \| `'horizontal'`                                          | —       | Whether each label sits above its value or beside it, at every width no `orientation<Viewport>` prop covers. Those props read the way a `Column`'s `size<Viewport>` props do: `orientationMobile` applies below Bulma's tablet breakpoint, each of the others from its own breakpoint up, and where several apply the widest one wins. With none of them, labels sit above their values below the tablet breakpoint and beside them from it up. Beside, the labels share one column as wide as the longest label, up to `--bulma-description-list-label-max-width`, so the values line up. |
| `orientationMobile`     | `'vertical'` \| `'horizontal'`                                          | —       | The orientation below Bulma's tablet breakpoint (769px). Falls back to `orientation`, then to `vertical`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `orientationTablet`     | `'vertical'` \| `'horizontal'`                                          | —       | The orientation from Bulma's tablet breakpoint (769px) up, until a wider viewport's prop takes over. Falls back to `orientation`, then to `horizontal`.                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `orientationDesktop`    | `'vertical'` \| `'horizontal'`                                          | —       | The orientation from Bulma's desktop breakpoint (1024px) up, until a wider viewport's prop takes over. Falls back to `orientationTablet`, and on down.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `orientationWidescreen` | `'vertical'` \| `'horizontal'`                                          | —       | The orientation from Bulma's widescreen breakpoint (1216px) up, until `orientationFullhd` takes over. Falls back to `orientationDesktop`, and on down.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `orientationFullhd`     | `'vertical'` \| `'horizontal'`                                          | —       | The orientation from Bulma's fullhd breakpoint (1408px) up. Falls back to `orientationWidescreen`, and on down.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `hasDividers`           | `boolean`                                                               | `false` | Draws a line between items, which helps the eye from a label to its value across a wide list, and shows where each item ends to someone zoomed in.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `textColor`             | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper. It colors the values; the labels keep their own color.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `bgColor`               | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `ref`                   | `React.Ref<HTMLDListElement>`                                           | —       | Ref forwarded to the `<dl>`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `aria-labelledby`       | `string`                                                                | —       | The id of the heading above the list, which names it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `...`                   | All standard `<dl>` attributes and Bulma helper props                   | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

**Subcomponents:**

- `DescriptionList.Item`: One fact: its label and its value, in a `<div>`, from the `label` and `value` props or from `Label` and `Value` children.
- `DescriptionList.Label`: A label, the name of a fact: a `<dt>`, in the weaker text color.
- `DescriptionList.Value`: A value, what the label says about the thing: a `<dd>`. An item may have several.

### DescriptionList.Item

| Prop        | Type                                                                    | Default | Description                                                                                                                                                                                                                                                                                |
| ----------- | ----------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `className` | `string`                                                                | —       | Additional CSS classes to apply.                                                                                                                                                                                                                                                           |
| `label`     | `React.ReactNode`                                                       | —       | The label, such as "Order", as a `DescriptionList.Label` before the children.                                                                                                                                                                                                              |
| `value`     | `React.ReactNode`                                                       | —       | The value, such as "#1234", as a `DescriptionList.Value` after the children. Text, a link, a `Tag`: anything that renders. `undefined`, `null` and `''` render nothing, so when a value is missing, say so in words, such as "Not given", rather than leave a label with nothing after it. |
| `children`  | `React.ReactNode`                                                       | —       | `DescriptionList.Label`s and `DescriptionList.Value`s, for what `label` and `value` don't cover, such as a label with an info tip or several values. They render between the two, so a `Label` here reads before `value`, and a `Value` here after `label`.                                |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper.                                                                                                                                                                                                                                                                         |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                                                                                                                                                                                                                                                                   |
| `ref`       | `React.Ref<HTMLDivElement>`                                             | —       | Ref forwarded to the `<div>`.                                                                                                                                                                                                                                                              |
| `...`       | All standard `<div>` attributes and Bulma helper props                  | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                          |

### DescriptionList.Label

| Prop        | Type                                                                    | Default | Description                                                                                                                              |
| ----------- | ----------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `className` | `string`                                                                | —       | Additional CSS classes to apply.                                                                                                         |
| `children`  | `React.ReactNode`                                                       | —       | The label. A button may sit in it, such as one that opens a `Popover` about the label, but not a heading, which HTML doesn't allow here. |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper.                                                                                                                       |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                                                                                                                 |
| `ref`       | `React.Ref<HTMLElement>`                                                | —       | Ref forwarded to the `<dt>`.                                                                                                             |
| `...`       | All standard HTML attributes and Bulma helper props                     | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                        |

### DescriptionList.Value

| Prop        | Type                                                                    | Default | Description                                               |
| ----------- | ----------------------------------------------------------------------- | ------- | --------------------------------------------------------- |
| `className` | `string`                                                                | —       | Additional CSS classes to apply.                          |
| `children`  | `React.ReactNode`                                                       | —       | The value. Anything goes, a list or a paragraph included. |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper.                                        |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                                  |
| `ref`       | `React.Ref<HTMLElement>`                                                | —       | Ref forwarded to the `<dd>`.                              |
| `...`       | All standard HTML attributes and Bulma helper props                     | —       | See [Helper Props](../helpers/usebulmaclasses.md)         |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`DescriptionList` registers these variables on its own `.description-list` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                               | Sass Variable                       | Default                      |
| ------------------------------------------ | ----------------------------------- | ---------------------------- |
| `--bulma-description-list-gap`             | `$description-list-gap`             | `0.75em`                     |
| `--bulma-description-list-column-gap`      | `$description-list-column-gap`      | `1.5em`                      |
| `--bulma-description-list-row-gap`         | `$description-list-row-gap`         | `0.25em`                     |
| `--bulma-description-list-label-max-width` | `$description-list-label-max-width` | `40%`                        |
| `--bulma-description-list-label-color`     | `$description-list-label-color`     | `var(--bulma-text-weak)`     |
| `--bulma-description-list-label-weight`    | `$description-list-label-weight`    | `var(--bulma-weight-normal)` |
| `--bulma-description-list-value-color`     | `$description-list-value-color`     | `var(--bulma-text)`          |
| `--bulma-description-list-divider-color`   | `$description-list-divider-color`   | `var(--bulma-border-weak)`   |
| `--bulma-description-list-divider-width`   | `$description-list-divider-width`   | `1px`                        |

<!-- /bestax:generated cssvars -->
