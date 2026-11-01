---
title: Group
sidebar_label: Group
description: The `Group` component lays its children out in a row that wraps, centered on each other, with half of Bulma's block spacing between them.
---

# Group

## Overview

<!-- bestax:generated overview -->

The `Group` component lays its children out in a row that wraps, centered on each other, with half of Bulma's block spacing between them.

<!-- /bestax:generated overview -->

Reach for it for a row of buttons, tags or avatars beside some text, or a toolbar with its two ends
pushed apart. The row wraps when it runs out of room, so it doesn't scroll sideways on a narrow
screen, and the children are centered on each other, so a large button and a line of text line up.
Their own block margins are zeroed, so a `Title` or a `Field` in the row sits on the same line as a
button. The default gap is half of Bulma's block spacing, the space Bulma's `Level` puts between its
items.

For a column, use [`Stack`](./stack.md). For buttons joined into one control, with no gap and
shared borders, use `hasAddons` on [`Buttons`](../elements/buttons.md) or
[`Field`](../form/field.md) instead: that's what Chakra UI and Ant Design call a group.

:::info
Bulma has no group, so `Group` brings its own styles, in `bestax.css` and its variants, or in
`extras.css` next to your own Bulma. The layout is in those styles, so it holds in
`bestax-no-helpers.css` too, where the `gap`, `alignItems`, `justifyContent` and `flexWrap` props
have no helper class to add and the defaults stay.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Group } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Buttons and a line of text in a row, centered on each other.

```tsx live
<Group>
  <Button color="primary">Save</Button>
  <Button>Cancel</Button>
  <Span textColor="grey">Last saved a minute ago</Span>
</Group>
```

### Toolbar

`justifyContent="space-between"` pushes the two ends apart, with a Group of actions at one end.

```tsx live
<Group justifyContent="space-between">
  <Title as="h2" size="4">
    Invoices
  </Title>
  <Group gap="1">
    <Button>Export</Button>
    <Button color="primary">New invoice</Button>
  </Group>
</Group>
```

### Wrapping

The row wraps by default. Set `flexWrap="nowrap"` to keep it on one line. A `gap` step replaces the
default spacing, which is `--bulma-stack-horizontal-gap`, half of Bulma's `--bulma-block-spacing`.
Of the two variables below, that's the Group's; the other is Stack's.

```tsx live
<Group gap="1">
  {['React', 'TypeScript', 'Bulma', 'Sass', 'Vite', 'Storybook', 'Vitest'].map(
    name => (
      <Tag key={name} color="link">
        {name}
      </Tag>
    )
  )}
</Group>
```

### Full Width

`isFullwidth` gives every child an equal share of the row, as Bulma's `is-fullwidth` does for tabs.

```tsx live
<Group isFullwidth>
  <Button>Cancel</Button>
  <Button color="primary">Save</Button>
</Group>
```

### Stacking on a Phone

`breakpoint` stacks the children below that Bulma breakpoint and sets them in a row from it up:
`tablet`, `desktop` or `widescreen`, the breakpoints `Container` takes. With `isFullwidth` as well,
each child takes the column's full width while stacked. Make the window narrower to see it.

```tsx live
<Group breakpoint="tablet" isFullwidth>
  <Button>Cancel</Button>
  <Button color="primary">Save</Button>
</Group>
```

The order never changes: stacked, the first child is on top, so the reading order is the same at
every width.

### As a List

A row of tags is often a list. With `as="ul"`, give it `li` children, and it restates
`role="list"`, which Safari drops once Bulma's reset hides the markers.

```tsx live
<Group as="ul" gap="1" aria-label="Topics">
  <li>
    <Tag>React</Tag>
  </li>
  <li>
    <Tag>Bulma</Tag>
  </li>
</Group>
```

---

## Accessibility

- **No role of its own:** a Group adds nothing to the accessibility tree, apart from `role="list"`
  on a `ul` or `ol`, which Safari otherwise drops once Bulma's reset hides the markers.
- **Order:** it's a row in the children's own order, or a column below its `breakpoint` in the same
  order, so what's seen, the reading order and the Tab order agree at every width. Right to left,
  the row runs right to left.
- **Reflow:** it wraps by default, so a row of controls doesn't make the page scroll sideways at a
  width of 320 CSS pixels (WCAG 1.4.10).
- **Grouping controls:** a Group of buttons isn't announced as a group. When the buttons belong
  together and need a name, give it `role="group"` and an `aria-label`, or render it
  `as="fieldset"` with one.

---

## Related Components

- [`Stack`](./stack.md): A column of children.
- [`Buttons`](../elements/buttons.md): Bulma's row of buttons, and with `hasAddons`, buttons joined
  into one control.
- [`Level`](./level.md): Bulma's bar with items pushed to its two ends, stacked on a phone.
- [`Flex`](./flex.md): A flex container with CSS's own defaults and every flex property as a prop.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: Group Stories](https://bestax.io/storybook/?path=/story/layout-group--default)
- [The Flex guide](../../guides/helpers/flex.md): The flex helper props, and gap.
- [WCAG 2.2: Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)

---

## Props

<!-- bestax:generated props -->

| Prop             | Type                                                                    | Default    | Description                                                                                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `as`             | `LayoutElement`                                                         | `'div'`    | The element to render. With `ul` or `ol`, give it `li` children: it restates `role="list"`, which Bulma's list reset takes away in Safari.                                                           |
| `gap`            | `BulmaGapStep`                                                          | —          | Space between children, a step of Bulma's gap scale. Unset, it's `--bulma-stack-horizontal-gap`, half of Bulma's block spacing.                                                                      |
| `alignItems`     | `(typeof validAlignItems)[number]`                                      | `'center'` | How each child sits across the row. While `breakpoint` stacks them, it's where each sits across the column.                                                                                          |
| `justifyContent` | `(typeof validJustifyContents)[number]`                                 | —          | Where the children sit along the row: `'space-between'` pushes the ends apart.                                                                                                                       |
| `flexWrap`       | `(typeof validFlexWraps)[number]`                                       | `'wrap'`   | Whether children move to a new row when they don't fit.                                                                                                                                              |
| `isFullwidth`    | `boolean`                                                               | `false`    | The children share the row equally, and fill the column while `breakpoint` stacks them (Bulma's `is-fullwidth`).                                                                                     |
| `breakpoint`     | `'tablet'` \| `'desktop'` \| `'widescreen'`                             | —          | Stacks the children below this Bulma breakpoint and sets them in a row from it up, the breakpoints Container's `breakpoint` takes. Unset, a row at every width.                                      |
| `className`      | `string`                                                                | —          | Additional CSS classes.                                                                                                                                                                              |
| `children`       | `React.ReactNode`                                                       | —          | What it lays out. The margins Bulma gives them are zeroed, the bottom one in a Stack and the top and bottom in the others, so `gap` is the only space between them. A `Columns` child keeps its own. |
| `textColor`      | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —          | Text color helper.                                                                                                                                                                                   |
| `bgColor`        | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —          | Background color helper.                                                                                                                                                                             |
| `ref`            | `PolymorphicRef<LayoutElement>`                                         | —          | Ref forwarded to the element `as` renders.                                                                                                                                                           |
| `...`            | Remaining props of the element selected by `as` and Bulma helper props  | —          | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                    |

**Types:**

- `BulmaGapStep`: `'0'` | `'0.5'` | `'1'` | `'1.5'` | `'2'` | `'2.5'` | `'3'` | `'3.5'` | `'4'` | `'4.5'` | `'5'` | `'5.5'` | `'6'` | `'6.5'` | `'7'` | `'7.5'` | `'8'` | `0` | `0.5` | `1` | `1.5` | `2` | `2.5` | `3` | `3.5` | `4` | `4.5` | `5` | `5.5` | `6` | `6.5` | `7` | `7.5` | `8` — A gap step as `gap`, `columnGap` and `rowGap` take it: a value from `validGaps`, or the same step written as a number (`gap={2}`, `gap={1.5}`). `Grid` took its gaps as numbers before the gap helpers were shared, so every gap prop still does.
- `LayoutElement`: `'div'` | `'main'` | `'section'` | `'article'` | `'aside'` | `'header'` | `'footer'` | `'nav'` | `'ul'` | `'ol'` | `'form'` | `'fieldset'` — The elements Stack, Group, Center and Flex can render as: Container's landmarks and sections, a list, a form or a fieldset.

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Group` registers these variables on its own `.stack` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                   | Sass Variable           | Default                                  |
| ------------------------------ | ----------------------- | ---------------------------------------- |
| `--bulma-stack-gap`            | `$stack-gap`            | `var(--bulma-block-spacing)`             |
| `--bulma-stack-horizontal-gap` | `$stack-horizontal-gap` | `calc(var(--bulma-block-spacing) * 0.5)` |

<!-- /bestax:generated cssvars -->
