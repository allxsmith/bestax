---
title: Center
sidebar_label: Center
description: The `Center` component centers its content on both axes.
---

# Center

## Overview

<!-- bestax:generated overview -->

The `Center` component centers its content on both axes.

<!-- /bestax:generated overview -->

Reach for it for a loader, an icon or an empty state in the middle of a box, a card or a section.
It centers across its whole width, and down its height when it has one: give it one with a helper
such as `aspectRatio`, or put it in something that sets one. Several children sit side by side in
the middle, with no gap unless you set one, and their own block margins are zeroed.

:::info
Bulma has no center component, so `Center` brings its own styles, in `bestax.css` and its variants,
or in `extras.css` next to your own Bulma. It's centered in `bestax-no-helpers.css` too, where props
like `gap` and `display` have no helper class to add.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Center } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

A loader in the middle of a panel with a height of its own, from `aspectRatio`.

```tsx live
<Center aspectRatio="16by9" bgColor="light">
  <Loader textSize="3" ariaLabel="Loading the report" />
</Center>
```

### In a Card

With padding and no height, it centers across the card.

```tsx live
<Card>
  <Card.Content>
    <Center p="6">
      <Loader textSize="3" ariaLabel="Loading invoices" />
    </Center>
  </Card.Content>
</Card>
```

### Several Children

Several children sit side by side in the middle. Set a `gap` to space them.

```tsx live
<Center gap="2" p="5" bgColor="light">
  <Span>Nothing here yet.</Span>
  <Button color="primary">Add one</Button>
</Center>
```

For a column of children in the middle, use a [`Stack`](./stack.md) with
`alignItems="center"`, or an [`EmptyState`](../components/emptystate.md) for an empty list.

### Inline

`display="inline-flex"` sizes it to its content, to center something in a line of text. It renders
a block element, so put the line in a `Block` or a `div` rather than a `Paragraph`, which can't hold
one.

```tsx live
<Block>
  Sync is{' '}
  <Center
    display="inline-flex"
    bgColor="success"
    textColor="white"
    radius="rounded"
    p="1"
  >
    <Icon name="check" ariaLabel="on" />
  </Center>{' '}
  for every device.
</Block>
```

---

## Accessibility

- **No role of its own:** a Center adds nothing to the accessibility tree, apart from `role="list"`
  on a `ul` or `ol`, which Safari otherwise drops once Bulma's reset hides the markers.
- **Order:** several children stay in their own order, so what's seen, the reading order and the
  Tab order agree.
- **What it centers names itself:** a loader or an icon in a Center needs its own accessible name,
  as `Loader`'s `ariaLabel` and `Icon`'s `ariaLabel` give it.

---

## Related Components

- [`Stack`](./stack.md): A column of children, which `alignItems="center"` centers across.
- [`Flex`](./flex.md): A flex container with CSS's own defaults and every flex property as a prop.
- [`EmptyState`](../components/emptystate.md): A centered message for an empty list or page.
- [`Loader`](../elements/loader.md): The spinner a Center usually holds.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: Center Stories](https://bestax.io/storybook/?path=/story/layout-center--default)
- [The Flex guide](../../guides/helpers/flex.md): The flex helper props, and gap.

---

## Props

<!-- bestax:generated props -->

| Prop        | Type                                                                    | Default | Description                                                                                                                                                                                                                                                                                                                                                                       |
| ----------- | ----------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `as`        | `LayoutElement`                                                         | `'div'` | The element to render. With `ul` or `ol`, give it `li` children: it restates `role="list"`, which Bulma's list reset takes away in Safari.                                                                                                                                                                                                                                        |
| `gap`       | `BulmaGapStep`                                                          | —       | Space between children, when there are several. None by default.                                                                                                                                                                                                                                                                                                                  |
| `display`   | `(typeof validDisplays)[number]` \| `'none'`                            | —       | `'inline-flex'` sizes it to its content, to center something inside a line of text. Needs Bulma's helper classes, as every `display` does.                                                                                                                                                                                                                                        |
| `className` | `string`                                                                | —       | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                                           |
| `children`  | `React.ReactNode`                                                       | —       | What it lays out. The margins Bulma gives them are zeroed, the bottom one in a Stack and the top and bottom in the others, so `gap` is the only space between them. A `Columns` child keeps its own top and side margins, and takes at the bottom the one Bulma gives the last Columns in a container, the column gap pulled back in (none when gapless), so its columns line up. |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper.                                                                                                                                                                                                                                                                                                                                                                |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                                                                                                                                                                                                                                                                                                                                                          |
| `ref`       | `PolymorphicRef<LayoutElement>`                                         | —       | Ref forwarded to the element `as` renders.                                                                                                                                                                                                                                                                                                                                        |
| `...`       | Remaining props of the element selected by `as` and Bulma helper props  | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                 |

**Types:**

- `BulmaGapStep`: `'0'` | `'0.5'` | `'1'` | `'1.5'` | `'2'` | `'2.5'` | `'3'` | `'3.5'` | `'4'` | `'4.5'` | `'5'` | `'5.5'` | `'6'` | `'6.5'` | `'7'` | `'7.5'` | `'8'` | `0` | `0.5` | `1` | `1.5` | `2` | `2.5` | `3` | `3.5` | `4` | `4.5` | `5` | `5.5` | `6` | `6.5` | `7` | `7.5` | `8` — A gap step as `gap`, `columnGap` and `rowGap` take it: a value from `validGaps`, or the same step written as a number (`gap={2}`, `gap={1.5}`). `Grid` took its gaps as numbers before the gap helpers were shared, so every gap prop still does.
- `LayoutElement`: `'div'` | `'main'` | `'section'` | `'article'` | `'aside'` | `'header'` | `'footer'` | `'nav'` | `'ul'` | `'ol'` | `'form'` | `'fieldset'` — The elements Stack, Group, Center and Flex can render as: Container's landmarks and sections, a list, a form or a fieldset.

<!-- /bestax:generated props -->
