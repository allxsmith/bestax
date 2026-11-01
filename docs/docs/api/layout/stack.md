---
title: Stack
sidebar_label: Stack
description: The `Stack` component lays its children out in a column, with Bulma's block spacing between them and the bottom margins Bulma gives them zeroed.
---

# Stack

## Overview

<!-- bestax:generated overview -->

The `Stack` component lays its children out in a column, with Bulma's block spacing between them and the bottom margins Bulma gives them zeroed.

<!-- /bestax:generated overview -->

Reach for it for a column of cards, notifications or form sections. Bulma gives its blocks a bottom
margin to space them, and in a flex container that margin adds to the gap, so a Stack zeroes its
children's own block-end margins: the gap is the only space, and there are no margins to undo with
`mb="0"`. The default gap is Bulma's block spacing, so a Stack of Boxes looks like Bulma's own
stacked blocks.

It's always a column, top to bottom. For a row, use [`Group`](./group.md), and for a flex container
with no defaults of its own, [`Flex`](./flex.md).

:::info
Bulma has no stack, so `Stack` brings its own styles, in `bestax.css` and its variants, or in
`extras.css` next to your own Bulma. The layout is in those styles, so it holds in
`bestax-no-helpers.css` too, where the `gap`, `alignItems` and `justifyContent` props have no helper
class to add and the defaults stay.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Stack } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

A column of Bulma blocks, each spaced from the next by the gap alone.

```tsx live
<Stack>
  <Notification color="info">Your changes are saved.</Notification>
  <Box>A Box, with no margin to undo.</Box>
  <Card>
    <Card.Content>A Card, last.</Card.Content>
  </Card>
</Stack>
```

### Gap

A `gap` step replaces the default spacing. Each whole step is 0.5rem, so `gap="2"` is 1rem, and
`gapless` puts the children flush. Unset, the gap is `--bulma-stack-gap`, which follows Bulma's
`--bulma-block-spacing`. Of the two variables below, that's the Stack's; the other is Group's.

```tsx live
<Group alignItems="flex-start" gap="6">
  <Stack gap="1">
    <Box p="3">gap="1"</Box>
    <Box p="3">gap="1"</Box>
  </Stack>
  <Stack gap="4">
    <Box p="3">gap="4"</Box>
    <Box p="3">gap="4"</Box>
  </Stack>
</Group>
```

### Forms

A form's fields, spaced evenly. Bulma spaces fields more closely than blocks, 0.75rem apart, which is
`gap="1.5"`. With `as="form"`, the Stack takes a form's attributes, such as `action` and `onSubmit`.

```tsx live
<Stack as="form" gap="1.5" aria-label="Profile">
  <Field label="Name">
    <Input placeholder="Ada Lovelace" />
  </Field>
  <Field label="Email">
    <Input type="email" placeholder="ada@example.com" />
  </Field>
  <Group justifyContent="flex-end" gap="1">
    <Button>Cancel</Button>
    <Button color="primary">Save</Button>
  </Group>
</Stack>
```

### Alignment

Children stretch across the column by default. `alignItems` sizes each to its content instead and
places it, and `justifyContent` places the children down a Stack that's taller than they are.

```tsx live
<Stack alignItems="flex-start" gap="2">
  <Button color="primary">Sized to its text</Button>
  <Button>So is this one</Button>
</Stack>
```

### Dividers

A Stack draws no dividers of its own. Put a `Divider` between the children, and it sits in the
middle of the space.

```tsx live
<Stack gap="3">
  <Box>Profile</Box>
  <Divider />
  <Box>Billing</Box>
</Stack>
```

### With Columns

A `Columns` child keeps the negative margins Bulma gives it, so its columns line up with the blocks
around it and sit the gap away from them, as they would between Bulma's own blocks.

```tsx live
<Stack>
  <Box>Above</Box>
  <Columns>
    <Column>
      <Box>One</Box>
    </Column>
    <Column>
      <Box>Two</Box>
    </Column>
  </Columns>
  <Box>Below</Box>
</Stack>
```

### A Title and Its SubTitle

Bulma sets a `SubTitle` right under its `Title`. In a Stack, the gap would come between them, so put
the pair in one element of its own.

```tsx live
<Stack>
  <div>
    <Title>Account</Title>
    <SubTitle>Your profile and how you pay.</SubTitle>
  </div>
  <Box>Profile</Box>
</Stack>
```

### As a List

With `as="ul"` or `as="ol"`, give it `li` children. It restates `role="list"`, which Safari drops
from a list once Bulma's reset hides its markers.

```tsx live
<Stack as="ul" gap="2" aria-label="Recent invoices">
  <li>
    <Box>Invoice 1042, paid</Box>
  </li>
  <li>
    <Box>Invoice 1043, due Friday</Box>
  </li>
</Stack>
```

---

## Accessibility

- **No role of its own:** a Stack adds nothing to the accessibility tree, apart from `role="list"`
  on a `ul` or `ol`, which Safari otherwise drops once Bulma's reset hides the markers.
- **Order:** it's always a column in the children's own order, so what's seen, the reading order
  and the Tab order agree.
- **Landmarks:** with `as="nav"`, `"aside"`, `"section"` or `"main"`, the Stack is the landmark. A
  `section` is a region only once it has a name, from `aria-label` or `aria-labelledby`.
- **Lists:** `as="ul"` or `as="ol"` with `li` children is announced as a list with its count.
- **Hidden:** the `hidden` attribute hides a Stack, as it does any element, so one can be a
  closed panel or an inactive tab's content.

---

## Related Components

- [`Group`](./group.md): A row of children, which wraps and can stack on a phone.
- [`Flex`](./flex.md): A flex container with CSS's own defaults and every flex property as a prop.
- [`Center`](./center.md): Centers its content on both axes.
- [`Grid`](../grid/grid.md): Children in a grid of cells rather than one column.
- [`Divider`](../elements/divider.md): A line between two children.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: Stack Stories](https://bestax.io/storybook/?path=/story/layout-stack--default)
- [The Flex guide](../../guides/helpers/flex.md): The flex helper props, and gap.
- [Bulma: Gap helpers](https://bulma.io/documentation/helpers/flexbox-helpers/)

---

## Props

<!-- bestax:generated props -->

| Prop             | Type                                                                    | Default     | Description                                                                                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `as`             | `LayoutElement`                                                         | `'div'`     | The element to render. With `ul` or `ol`, give it `li` children: it restates `role="list"`, which Bulma's list reset takes away in Safari.                                                           |
| `gap`            | `BulmaGapStep`                                                          | —           | Space between children, a step of Bulma's gap scale (`'2'` is 1rem). Unset, it's `--bulma-stack-gap`, Bulma's block spacing.                                                                         |
| `alignItems`     | `(typeof validAlignItems)[number]`                                      | `'stretch'` | How each child sits across the column. `'stretch'` makes each as wide as the Stack.                                                                                                                  |
| `justifyContent` | `(typeof validJustifyContents)[number]`                                 | —           | Where the children sit down the column, when it's taller than they are.                                                                                                                              |
| `className`      | `string`                                                                | —           | Additional CSS classes.                                                                                                                                                                              |
| `children`       | `React.ReactNode`                                                       | —           | What it lays out. The margins Bulma gives them are zeroed, the bottom one in a Stack and the top and bottom in the others, so `gap` is the only space between them. A `Columns` child keeps its own. |
| `textColor`      | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —           | Text color helper.                                                                                                                                                                                   |
| `bgColor`        | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —           | Background color helper.                                                                                                                                                                             |
| `ref`            | `PolymorphicRef<LayoutElement>`                                         | —           | Ref forwarded to the element `as` renders.                                                                                                                                                           |
| `...`            | Remaining props of the element selected by `as` and Bulma helper props  | —           | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                    |

**Types:**

- `BulmaGapStep`: `'0'` | `'0.5'` | `'1'` | `'1.5'` | `'2'` | `'2.5'` | `'3'` | `'3.5'` | `'4'` | `'4.5'` | `'5'` | `'5.5'` | `'6'` | `'6.5'` | `'7'` | `'7.5'` | `'8'` | `0` | `0.5` | `1` | `1.5` | `2` | `2.5` | `3` | `3.5` | `4` | `4.5` | `5` | `5.5` | `6` | `6.5` | `7` | `7.5` | `8` — A gap step as `gap`, `columnGap` and `rowGap` take it: a value from `validGaps`, or the same step written as a number (`gap={2}`, `gap={1.5}`). `Grid` took its gaps as numbers before the gap helpers were shared, so every gap prop still does.
- `LayoutElement`: `'div'` | `'main'` | `'section'` | `'article'` | `'aside'` | `'header'` | `'footer'` | `'nav'` | `'ul'` | `'ol'` | `'form'` | `'fieldset'` — The elements Stack, Group, Center and Flex can render as: Container's landmarks and sections, a list, a form or a fieldset.

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Stack` registers these variables on its own `.stack` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                   | Sass Variable           | Default                                  |
| ------------------------------ | ----------------------- | ---------------------------------------- |
| `--bulma-stack-gap`            | `$stack-gap`            | `var(--bulma-block-spacing)`             |
| `--bulma-stack-horizontal-gap` | `$stack-horizontal-gap` | `calc(var(--bulma-block-spacing) * 0.5)` |

<!-- /bestax:generated cssvars -->
