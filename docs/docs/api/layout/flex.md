---
title: Flex
sidebar_label: Flex
description: The `Flex` component is a flex container with CSS's own defaults, taking the flex container's properties as props.
---

# Flex

## Overview

<!-- bestax:generated overview -->

The `Flex` component is a flex container with CSS's own defaults, taking the flex container's properties as props.

<!-- /bestax:generated overview -->

Reach for it for a layout of your own, such as a fixed side beside a growing one. It's a flex
container with no `display` prop to remember: `flexDirection`, `flexWrap`, `alignItems`,
`justifyContent`, `alignContent` and the gaps are its props, each on Bulma's helper classes, and
`flexGrow`, `flexShrink` and `alignSelf` go on its children. Like the others, it zeroes its
children's own block margins, so the gap is the only space between them.

For a column of Bulma blocks, [`Stack`](./stack.md) starts with Bulma's spacing in place, and for a
row of controls, [`Group`](./group.md) wraps and centers. Flex is still a flex container and
nothing more: it renders one of a few structural elements and draws nothing of its own.

:::info
Bulma has no flex component, so `Flex` brings its own styles, in `bestax.css` and its variants, or
in `extras.css` next to your own Bulma. It's a flex container in `bestax-no-helpers.css` too, though
there its props have no helper class to add, so it stays a row with no gap.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Flex } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

A row that doesn't wrap, with its children stretched to the same height, and a gap.

```tsx live
<Flex gap="2">
  <Box>One</Box>
  <Box>Two, with more to say than the first</Box>
</Flex>
```

### A Fixed Side and a Growing One

`flexShrink="0"` keeps the side at its own width, and `flexGrow="1"` gives the rest of the row to
the main part.

```tsx live
<Flex gap="4" alignItems="flex-start">
  <Box flexShrink="0">
    <Menu>
      <Menu.Label>Account</Menu.Label>
      <Menu.List>
        <Menu.Item href="#profile">Profile</Menu.Item>
        <Menu.Item href="#billing">Billing</Menu.Item>
      </Menu.List>
    </Menu>
  </Box>
  <Box flexGrow="1">
    <Content>
      <p>The side keeps its width, and this part grows into the rest.</p>
    </Content>
  </Box>
</Flex>
```

### Direction

`flexDirection` turns the main axis. `row-reverse` and `column-reverse` change only what's seen: a
screen reader still reads the children, and Tab still moves through them, in their own order.

```tsx live
<Flex flexDirection="column" alignItems="flex-start" gap="2">
  <Button color="primary">First</Button>
  <Button>Second</Button>
</Flex>
```

### Wrapping

`flexWrap="wrap"` moves children to a new line when they don't fit, and `rowGap` and `columnGap`
space the two directions apart differently.

```tsx live
<Flex flexWrap="wrap" columnGap="3" rowGap="1">
  {Array.from({ length: 10 }, (_, i) => (
    <Button key={i} size="small">
      Item {i + 1}
    </Button>
  ))}
</Flex>
```

---

## Accessibility

- **No role of its own:** a Flex adds nothing to the accessibility tree, apart from `role="list"`
  on a `ul` or `ol`, which Safari otherwise drops once Bulma's reset hides the markers.
- **Reversed directions:** `row-reverse` and `column-reverse` change what's seen and not the
  reading or Tab order, so what's seen and what's read can disagree (WCAG 1.3.2 Meaningful Sequence
  and 2.4.3 Focus Order). Use them only where the order doesn't carry meaning, or put the children
  in the order you want them read.
- **Landmarks:** with `as="nav"`, `"aside"`, `"section"` or `"main"`, the Flex is the landmark. A
  `section` is a region only once it has a name.

---

## Related Components

- [`Stack`](./stack.md): A column with Bulma's block spacing.
- [`Group`](./group.md): A row that wraps and centers, which can stack on a phone.
- [`Center`](./center.md): Centers its content on both axes.
- [`Columns`](../columns/columns.md): Columns sized in fractions of the row, stacked on a phone.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: Flex Stories](https://bestax.io/storybook/?path=/story/layout-flex--default)
- [The Flex guide](../../guides/helpers/flex.md): Every flex helper prop, with its Bulma class.
- [Bulma: Flexbox helpers](https://bulma.io/documentation/helpers/flexbox-helpers/)

---

## Props

<!-- bestax:generated props -->

| Prop             | Type                                                                    | Default | Description                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------- | ----------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `as`             | `LayoutElement`                                                         | `'div'` | The element to render. With `ul` or `ol`, give it `li` children: it restates `role="list"`, which Bulma's list reset takes away in Safari.                                                                                                                                                                                                                                               |
| `flexDirection`  | `(typeof validFlexDirections)[number]`                                  | —       | The main axis, a row unless set. `row-reverse` and `column-reverse` change only what's seen: reading and Tab order still follow the children's order (WCAG 1.3.2 and 2.4.3).                                                                                                                                                                                                             |
| `flexWrap`       | `(typeof validFlexWraps)[number]`                                       | —       | Whether children move to a new line when they don't fit. Unset, CSS's own `nowrap`.                                                                                                                                                                                                                                                                                                      |
| `alignItems`     | `(typeof validAlignItems)[number]`                                      | —       | How each child sits across the main axis. Unset, CSS's own `stretch`.                                                                                                                                                                                                                                                                                                                    |
| `justifyContent` | `(typeof validJustifyContents)[number]`                                 | —       | Where the children sit along the main axis.                                                                                                                                                                                                                                                                                                                                              |
| `alignContent`   | `(typeof validAlignContents)[number]`                                   | —       | How wrapped lines share the space across the main axis.                                                                                                                                                                                                                                                                                                                                  |
| `gap`            | `BulmaGapStep`                                                          | —       | Space between children, a step of Bulma's gap scale. None by default.                                                                                                                                                                                                                                                                                                                    |
| `rowGap`         | `BulmaGapStep`                                                          | —       | Space between wrapped lines, when it differs from `gap`.                                                                                                                                                                                                                                                                                                                                 |
| `columnGap`      | `BulmaGapStep`                                                          | —       | Space between children along a row, when it differs from `gap`.                                                                                                                                                                                                                                                                                                                          |
| `className`      | `string`                                                                | —       | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                                                  |
| `children`       | `React.ReactNode`                                                       | —       | What it lays out. The top and bottom margins Bulma gives them are zeroed, so `gap` is the only space between them, and a spacing helper such as `mt="2"` still adds to it. A `Columns` child keeps its own top and side margins, and takes at the bottom the one Bulma gives the last Columns in a container, the column gap pulled back in (none when gapless), so its columns line up. |
| `textColor`      | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper.                                                                                                                                                                                                                                                                                                                                                                       |
| `bgColor`        | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                                                                                                                                                                                                                                                                                                                                                                 |
| `ref`            | `PolymorphicRef<LayoutElement>`                                         | —       | Ref forwarded to the element `as` renders.                                                                                                                                                                                                                                                                                                                                               |
| `...`            | Remaining props of the element selected by `as` and Bulma helper props  | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                        |

**Types:**

- `BulmaGapStep`: `'0'` | `'0.5'` | `'1'` | `'1.5'` | `'2'` | `'2.5'` | `'3'` | `'3.5'` | `'4'` | `'4.5'` | `'5'` | `'5.5'` | `'6'` | `'6.5'` | `'7'` | `'7.5'` | `'8'` | `0` | `0.5` | `1` | `1.5` | `2` | `2.5` | `3` | `3.5` | `4` | `4.5` | `5` | `5.5` | `6` | `6.5` | `7` | `7.5` | `8` — A gap step as `gap`, `columnGap` and `rowGap` take it: a value from `validGaps`, or the same step written as a number (`gap={2}`, `gap={1.5}`). `Grid` took its gaps as numbers before the gap helpers were shared, so every gap prop still does.
- `LayoutElement`: `'div'` | `'main'` | `'section'` | `'article'` | `'aside'` | `'header'` | `'footer'` | `'nav'` | `'ul'` | `'ol'` | `'form'` | `'fieldset'` — The elements Stack, Group, Center and Flex can render as: Container's landmarks and sections, a list, a form or a fieldset.

<!-- /bestax:generated props -->
