---
title: FloatButtons
sidebar_label: FloatButtons
description: The `FloatButtons` component stacks several float buttons in one corner of the screen, so none covers another.
keywords:
  - FAB group
  - floating action buttons
  - FloatButton.Group
---

# FloatButtons

## Overview

<!-- bestax:generated overview -->

The `FloatButtons` component stacks several float buttons in one corner of the screen, so none covers another.

<!-- /bestax:generated overview -->

Two [`FloatButton`](./floatbutton.md)s in the same corner sit on top of each other, since each is
fixed to the same spot. `FloatButtons` is one [`Affix`](./affix.md) laid out as a column, so they
stack instead. It follows the library's plural container convention, as [`Buttons`](../elements/buttons)
and [`Avatars`](./avatars.md) do. Ant Design calls it `FloatButton.Group`.

---

## Import

<!-- bestax:generated import -->

```tsx
import { FloatButtons, FloatButton } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Default

The buttons stack top to bottom in the order you write them, `--bulma-float-buttons-gap` apart,
lined up on the corner's side. The buttons inside take no corner of their own, and their tooltips
open away from that side. These examples use the bottom-left corner, since this site's back-to-top
button sits in the bottom right.

```tsx live
function example() {
  const [shown, setShown] = useState(false);
  return (
    <>
      <Button onClick={() => setShown(!shown)}>
        {shown ? 'Hide the stack' : 'Show the stack'}
      </Button>
      {shown && (
        <FloatButtons position="bottom-left">
          <FloatButton aria-label="Help" icon="question" />
          <FloatButton aria-label="New message" icon="pen" color="primary" />
        </FloatButtons>
      )}
    </>
  );
}
```

### A Count, a Speed Dial and Back to Top

A `Badge` with `overlap="circle"` puts a count on a button. A `FloatButton.SpeedDial` and a
`FloatButton.BackToTop` take their place in the stack too. Back to top keeps its place while it's
hidden, so the buttons beside it don't move under the pointer, and the page under that place still
takes a click.

```tsx live
function example() {
  const [shown, setShown] = useState(false);
  return (
    <>
      <Button onClick={() => setShown(!shown)}>
        {shown ? 'Hide the stack' : 'Show the stack'}
      </Button>
      {shown && (
        <FloatButtons position="bottom-left">
          <FloatButton.BackToTop />
          <Badge content={3} overlap="circle" color="danger">
            <FloatButton aria-label="Inbox, 3 unread" icon="inbox" />
          </Badge>
          <FloatButton.SpeedDial
            aria-label="Create"
            icon="plus"
            color="primary"
            direction="right"
          >
            <FloatButton aria-label="Note" icon="note-sticky" />
            <FloatButton aria-label="Task" icon="check" />
          </FloatButton.SpeedDial>
        </FloatButtons>
      )}
    </>
  );
}
```

A speed dial that opens up or down in a stack pushes the buttons on that side along as it opens,
so nothing overlaps. One that opens sideways leaves them where they are.

### The Gap

`--bulma-float-buttons-gap` sets the space between buttons, 0.75rem by default. Set it on the stack
itself, as [Affix's offsets](./affix.md#offsets-and-the-safe-area) show.

```css
.float-buttons.roomy {
  --bulma-float-buttons-gap: 1.25rem;
}
```

```tsx
<FloatButtons className="roomy">
  <FloatButton aria-label="Help" icon="question" />
  <FloatButton aria-label="New message" icon="pen" />
</FloatButtons>
```

---

## Accessibility

- **Reading and Tab order are DOM order:** the stack runs top to bottom in the order you write it,
  which is also the order a screen reader and the Tab key reach the buttons in. Write it after the
  page's main content.
- **No role:** it's a positioning wrapper, and each button keeps its own name and role.
- **The page stays usable:** only the buttons take the pointer, so the gaps between them, and the
  place a hidden back to top keeps, let a click through to the page under them.
- **Focus not obscured:** a stack covers more of its corner than one button, so give `html` a
  `scroll-padding-bottom` at least its height plus its offset, as
  [Affix's accessibility notes](./affix.md#accessibility) show.

---

## Related Components

- [`FloatButton`](./floatbutton.md): One float button, a speed dial, or back to top.
- [`Affix`](./affix.md): The corner, its offsets, the safe area and `portal`.
- [`Badge`](./badge.md): A count on a button in the stack.
- [`Buttons`](../elements/buttons.md): A group of buttons in the page's flow.

---

## Additional Resources

- [Storybook: FloatButtons Stories](https://bestax.io/storybook/?path=/story/components-floatbuttons--default)

---

## Props

<!-- bestax:generated props -->

| Prop         | Type                                                                 | Default          | Description                                                                                                                                                                                                           |
| ------------ | -------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className`  | `string`                                                             | —                | Additional CSS classes to apply.                                                                                                                                                                                      |
| `children`   | `React.ReactNode`                                                    | —                | `FloatButton`s, a `FloatButton.SpeedDial`, a `FloatButton.BackToTop`, or any of them inside a `Badge`, top to bottom.                                                                                                 |
| `position`   | `'top-right'` \| `'top-left'` \| `'bottom-right'` \| `'bottom-left'` | `'bottom-right'` | The corner, as `Affix`'s. The buttons line up on its side.                                                                                                                                                            |
| `portal`     | `boolean` \| `string` \| `HTMLElement`                               | `false`          | As `Affix`'s `portal`.                                                                                                                                                                                                |
| `showLabels` | `boolean`                                                            | `false`          | Prints every button's `aria-label` beside its icon, as each one's `showLabel` does, for touch screens, where a tooltip never shows. A speed dial in the stack passes it on to its actions; its trigger stays an icon. |
| `ref`        | `React.Ref<HTMLDivElement>`                                          | —                | Ref forwarded to the `<div>`, wherever it renders.                                                                                                                                                                    |
| `...`        | All standard `<div>` attributes and Bulma helper props               | —                | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                     |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`FloatButtons` registers these variables on its own `.float-buttons` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                               | Sass Variable                       | Default                 |
| ------------------------------------------ | ----------------------------------- | ----------------------- |
| `--bulma-float-buttons-gap`                | `$float-buttons-gap`                | `0.75rem`               |
| `--bulma-float-button-transition-duration` | `$float-button-transition-duration` | `var(--bulma-duration)` |

<!-- /bestax:generated cssvars -->
