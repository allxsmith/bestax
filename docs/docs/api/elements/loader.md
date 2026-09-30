---
title: Loader
sidebar_label: Loader
description: The `Loader` component renders Bulma's `.loader`, a small spinning ring for inline loading states.
---

# Loader

## Overview

<!-- bestax:generated overview -->

The `Loader` component renders Bulma's `.loader`, a small spinning ring for inline loading states.

<!-- /bestax:generated overview -->

Reach for it where an overlay would be too much: inside a table cell while a row saves, next to a
label, or in a card that is still fetching. It renders one empty element with no state, and the
ring is `1em` square, so the `textSize` helper scales it.

:::info
`Loader` has no color prop. Bulma draws the ring in the theme's border color
(`--bulma-border`), so the text color helpers don't reach it. For a colored spinner that covers a
region, use [`Loading`](../components/loading.md) with its `color` prop.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Loader } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Default Loader

```tsx live
<Loader />
```

### Sizes

The ring follows the font size. Set it with `textSize` (`1` is the largest, `7` the smallest), or
place the loader in text that is already sized.

```tsx live
<Block display="flex" alignItems="center">
  <Loader textSize="7" mr="5" />
  <Loader textSize="5" mr="5" />
  <Loader textSize="3" mr="5" />
  <Loader textSize="1" />
</Block>
```

### Next to a Label

Bulma's `.loader` is a block element, so put it in a flex row to sit it beside text. Point
`aria-labelledby` at that text and it names the loader, rather than a second label repeating it.

```tsx live
<Block display="flex" alignItems="center">
  <Loader aria-labelledby="loader-save-status" mr="2" />
  <Span id="loader-save-status">Saving changes</Span>
</Block>
```

### In a Table Cell

When more than one loader can be on screen, name what each one is loading with `ariaLabel`.

```tsx live
<Table>
  <Thead>
    <Tr>
      <Th>Name</Th>
      <Th>Status</Th>
    </Tr>
  </Thead>
  <Tbody>
    <Tr>
      <Td>Ada Lovelace</Td>
      <Td>
        <Loader ariaLabel="Saving Ada Lovelace" />
      </Td>
    </Tr>
    <Tr>
      <Td>Grace Hopper</Td>
      <Td>Saved</Td>
    </Tr>
  </Tbody>
</Table>
```

### Centered in a Container

The ring has a fixed width, so `mx="auto"` centers it. Mark the region that is loading with
`aria-busy` until its content arrives.

```tsx live
<Box aria-busy="true">
  <Loader textSize="3" mx="auto" ariaLabel="Loading account details" />
</Box>
```

---

## Accessibility

- **Role:** `Loader` renders `role="progressbar"` with no `aria-valuenow`, which is how ARIA marks
  progress of unknown length.
- **Name:** the accessible name comes from `ariaLabel` (default `'Loading'`). Name what is loading
  when it helps (`"Saving Ada Lovelace"`), or point `aria-labelledby` at visible text beside it.
- **Announcements:** a progressbar is not a live region, so a loader appearing is not announced
  on its own. Screen reader users find it by reading the page. To announce that loading started or
  finished, change the text of a live region that is already on the page.
- **Busy regions:** set `aria-busy="true"` on the region the loader stands in for, and remove it
  when the content arrives.
- **Reduced motion:** under `prefers-reduced-motion: reduce` the ring stops spinning and stays
  drawn, so the loading state is still visible. That rule ships in bestax's stylesheets:
  `bestax.css`, or `extras.css` next to your own Bulma.

---

## Related Components

- [`Loading`](../components/loading.md): A spinner on an overlay that covers its container or the
  page, with color and size props.
- [`Skeleton`](./skeleton.md): Placeholder shapes that hold the layout while content loads.
- [`Progress`](./progress.md): A full-width progress bar, determinate or indeterminate.
- [`Button`](./button.md): `isLoading` puts a spinner inside a button.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for size, spacing, display, etc.

---

## Additional Resources

- [Storybook: Loader Stories](https://bestax.io/storybook/?path=/story/elements-loader--default)
- [WAI-ARIA: the progressbar role](https://www.w3.org/TR/wai-aria-1.2/#progressbar)

---

## Props

<!-- bestax:generated props -->

| Prop        | Type                                                    | Default     | Description                                                                                                                          |
| ----------- | ------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `className` | `string`                                                | —           | Additional CSS classes to apply.                                                                                                     |
| `ariaLabel` | `string`                                                | `'Loading'` | Accessible name of the progress indicator. Name what is loading (`"Saving row"`) when more than one loader can be on screen at once. |
| `ref`       | `React.Ref<HTMLSpanElement>`                            | —           | Ref forwarded to the loader element.                                                                                                 |
| `...`       | All standard `<span>` attributes and Bulma helper props | —           | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                    |

<!-- /bestax:generated props -->
