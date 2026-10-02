---
title: Popover
sidebar_label: Popover
description: The `Popover` component opens a panel of interactive content, such as a filter form or a set of share options, anchored to the element that toggles it.
---

# Popover

## Overview

<!-- bestax:generated overview -->

The `Popover` component opens a panel of interactive content, such as a filter form or a set of share options, anchored to the element that toggles it.

<!-- /bestax:generated overview -->

Reach for it when the content needs to be used, not just read: a form, a list of links, an inline
edit. `Tooltip` is for hover hints and can't hold anything interactive, and `Dropdown` is a menu of
actions with menu roles. A `Popover` is a non-modal dialog: focus moves into it when it opens and
back to its trigger when it closes, and the rest of the page stays usable.

---

## Import

<!-- bestax:generated import -->

```tsx
import { Popover } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Popover

Pass the element that opens it as `trigger` and the panel as children. `Popover.Header` names the
panel, `Popover.Body` holds the content, and `Popover.Close` closes it.

```tsx live
function example() {
  const [statuses, setStatuses] = useState(['open']);

  return (
    <Popover trigger={<Button>Filters</Button>}>
      <Popover.Header>Filter rows</Popover.Header>
      <Popover.Body>
        <Checkboxes value={statuses} onChange={setStatuses}>
          <Checkbox value="open">Open</Checkbox>
          <Checkbox value="closed">Closed</Checkbox>
        </Checkboxes>
      </Popover.Body>
      <Popover.Footer>
        <Popover.Close color="primary">Done</Popover.Close>
      </Popover.Footer>
    </Popover>
  );
}
```

### Placement

`position` picks the corner the panel opens from: below or above the trigger, lined up with its
left or right edge. `auto` picks the one that keeps the panel in the viewport, preferring below and
on the left.

```tsx live
<Buttons>
  <Popover
    position="bottom-left"
    ariaLabel="Bottom left"
    trigger={<Button>bottom-left</Button>}
  >
    <Popover.Body>Opens below, on the left edge.</Popover.Body>
  </Popover>
  <Popover
    position="bottom-right"
    ariaLabel="Bottom right"
    trigger={<Button>bottom-right</Button>}
  >
    <Popover.Body>Opens below, on the right edge.</Popover.Body>
  </Popover>
  <Popover
    position="auto"
    ariaLabel="Auto"
    trigger={<Button color="info">auto</Button>}
  >
    <Popover.Body>Opens wherever it fits.</Popover.Body>
  </Popover>
</Buttons>
```

### Rendering into the Body

An ancestor with `overflow: hidden`, like the box below, clips a panel that renders in place.
`appendToBody` renders it at the end of the page through [`Portal`](../helpers/portal.md), fixed to
the viewport next to the trigger. With server rendering, it shows from the first render after
hydration.

```tsx live
<Box overflow="hidden">
  <Popover
    appendToBody
    ariaLabel="Portaled"
    trigger={<Button color="primary">appendToBody</Button>}
  >
    <Popover.Body>This panel escapes the box.</Popover.Body>
  </Popover>
</Box>
```

### Controlled

Pass `open` to hold the state yourself. `onOpenChange` reports every request to change it, from
the trigger, `Popover.Close`, Escape or a press outside, so wiring it to your setter lets all of
them work.

```tsx live
function example() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Paragraph mb="3">The popover is {open ? 'open' : 'closed'}.</Paragraph>
      <Popover
        open={open}
        onOpenChange={setOpen}
        ariaLabel="Account"
        trigger={<Button>Account</Button>}
      >
        <Popover.Body>Signed in as ada@example.com</Popover.Body>
        <Popover.Footer>
          <Popover.Close>Sign out</Popover.Close>
        </Popover.Footer>
      </Popover>
    </>
  );
}
```

### Without a Header

A panel with no `Popover.Header` needs a name of its own: pass `ariaLabel`.

```tsx live
<Popover ariaLabel="Share" trigger={<Button>Share</Button>}>
  <Popover.Body>
    <UnorderedList>
      <ListItem>
        <Link href="#email">Email</Link>
      </ListItem>
      <ListItem>
        <Link href="#copy">Copy link</Link>
      </ListItem>
    </UnorderedList>
  </Popover.Body>
</Popover>
```

### Letting Tab Leave

By default Tab and Shift+Tab stay inside the open panel, and Escape or a close button is the way
out. Pass `trapFocus={false}` to let Tab carry on past the panel; the popover stays open until it
is dismissed. Focus still moves in on open and back to the trigger on close.

```tsx live
<Popover
  trapFocus={false}
  ariaLabel="Quick note"
  trigger={<Button>Add note</Button>}
>
  <Popover.Body>
    <Input aria-label="Note" placeholder="Type, then Tab onward" />
  </Popover.Body>
</Popover>
```

### Triggers That Aren't Buttons

Enter and Space open a trigger the browser wouldn't click on its own. An intrinsic element such as
a `<span>` also gets `role="button"` and a tab stop. A component such as `Tag` renders its own
element, so pass those two yourself.

```tsx live
<Popover
  ariaLabel="Label help"
  trigger={
    <Tag color="info" role="button" tabIndex={0}>
      What is this?
    </Tag>
  }
>
  <Popover.Body>Labels group rows. Click one to filter by it.</Popover.Body>
</Popover>
```

### Compound (dot-notation) usage

`PopoverHeader`, `PopoverBody`, `PopoverFooter` and `PopoverClose` are also available as
`Popover.Header`, `Popover.Body`, `Popover.Footer` and `Popover.Close`, so the whole panel can be
composed from the single `Popover` import.

```tsx live
<Popover trigger={<Button>Rename</Button>}>
  <Popover.Header>Rename file</Popover.Header>
  <Popover.Body>
    <Input aria-label="File name" defaultValue="report.pdf" />
  </Popover.Body>
  <Popover.Footer>
    <Popover.Close>Cancel</Popover.Close>
    <Popover.Close color="primary">Save</Popover.Close>
  </Popover.Footer>
</Popover>
```

---

## Accessibility

`Popover` follows the [WAI-ARIA dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
for a non-modal dialog:

- The panel is a `role="dialog"` without `aria-modal`. It is named by its `Popover.Header` through
  `aria-labelledby`, or by `ariaLabel`, which takes precedence. A development build warns when an
  open panel has neither.
- The trigger gets `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls` pointing at the
  panel while it is open.
- Opening moves focus to the first control in the panel, or to the panel itself when it has none.
  Closing hands focus back to the trigger, as long as focus is still in the panel then, so a click
  that put it somewhere else keeps it there.
- Tab and Shift+Tab wrap inside the open panel, which the pattern asks of non-modal dialogs too.
  Pointer focus, the screen reader's reading cursor and the rest of the page stay free: nothing
  outside is hidden or made inert, and the page still scrolls. `trapFocus={false}` lets Tab leave.
- <kbd>Escape</kbd> closes the popover while focus is in the panel or on the trigger. A dialog
  nested inside the panel, such as a date picker's calendar or another popover, takes its own
  Escape first.
- <kbd>Enter</kbd> and <kbd>Space</kbd> toggle a trigger the browser doesn't click on its own.
- The open animation is turned off under `prefers-reduced-motion: reduce`.

---

## Related Components

- [`Tooltip`](./tooltip.md): A hover and focus hint for content nobody needs to interact with.
- [`Dropdown`](./dropdown.md): A menu of actions, with menu roles and arrow-key navigation.
- [`Modal`](./modal.md): A modal overlay that blocks the page behind it.
- [`Portal`](../helpers/portal.md): What `appendToBody` renders through.
- [`useFocusTrap`](../helpers/usefocustrap.md): The focus trap the panel uses.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [WAI-ARIA Authoring Practices: Dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [Storybook: Popover Stories](https://bestax.io/storybook/?path=/story/components-popover--default)

---

## Props

<!-- bestax:generated props -->

| Prop                  | Type                                                                             | Default         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------- | -------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `trigger`             | `React.ReactElement`                                                             | —               | The element that opens and closes the popover, such as a `Button`. Popover gives it `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls` while the panel is open, and click and key handlers that run after its own (call `preventDefault()` in yours to keep the popover from toggling). It has to be a single element that passes `onClick` and `onKeyDown` to its DOM node. Enter and Space toggle a trigger the browser doesn't click on its own, and an intrinsic element that isn't already a control (a `<span>`) also gets `role="button"` and `tabIndex={0}` unless it sets them; a component that renders one has to take those itself. |
| `children`            | `React.ReactNode`                                                                | —               | The panel's content, usually `Popover.Header`, `Popover.Body` and `Popover.Footer`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `open`                | `boolean`                                                                        | —               | Controlled open state. When set, the trigger and every dismissal only report through `onOpenChange`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `defaultOpen`         | `boolean`                                                                        | `false`         | Initial open state when uncontrolled. Opening moves focus into the panel, so a popover that starts open takes focus once the page loads.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `onOpenChange`        | `(open: boolean) => void`                                                        | —               | Called with the state asked for: `true` from the trigger opening it, `false` from the trigger, `Popover.Close`, Escape or an outside `pointerdown`. Fires in both controlled and uncontrolled use.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `position`            | `'bottom-left'` \| `'bottom-right'` \| `'top-left'` \| `'top-right'` \| `'auto'` | `'bottom-left'` | Where the panel opens against the trigger.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `appendToBody`        | `boolean`                                                                        | `false`         | Render the panel at the end of `document.body` through `Portal`, fixed to the viewport, so an ancestor's `overflow`, `transform` or stacking context can't clip it. The panel then shows from the commit after hydration, never in server markup. It is measured against the trigger when it opens and on resize and scroll, so it doesn't follow content that changes size while it is open. Theming variables set on an ancestor of the trigger don't reach it there.                                                                                                                                                                                 |
| `trapFocus`           | `boolean`                                                                        | `true`          | Keep Tab and Shift+Tab inside the panel while it is open, as the ARIA dialog pattern does for a non-modal dialog. Pointer focus leaves freely and the page stays usable. With `false`, Tab moves past the panel and the popover stays open. Focus moves into the panel on open and back to the trigger on close either way.                                                                                                                                                                                                                                                                                                                             |
| `closeOnClickOutside` | `boolean`                                                                        | `true`          | Close on a `pointerdown` outside the trigger and the panel. Content the panel renders through a portal (a nested `Popover`, a portaled picker) still counts as inside.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `closeOnEscape`       | `boolean`                                                                        | `true`          | Close on Escape while focus is in the panel or on the trigger. A dialog nested in the panel, such as a date picker's calendar, takes its own Escape first, and so does content that calls `preventDefault()` on it.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `ariaLabel`           | `string`                                                                         | —               | The panel's accessible name. Without it the panel is named by its `Popover.Header`, and a development build warns when it has neither.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `contentClassName`    | `string`                                                                         | —               | Additional classes for the panel (`.popover-content`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `className`           | `string`                                                                         | —               | Additional classes for the wrapper around the trigger. The panel takes `contentClassName`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `...`                 | All standard `<div>` attributes and Bulma helper props                           | —               | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

**Subcomponents:**

- `Popover.Header`: The popover's title, which names the panel for assistive technology.
- `Popover.Body`: The popover's main content area.
- `Popover.Footer`: A row of actions along the bottom of the popover, aligned to the end.
- `Popover.Close`: A `Button` that closes the popover, handing focus back to the trigger.

### Popover.Header

| Prop        | Type                                                   | Default | Description                                       |
| ----------- | ------------------------------------------------------ | ------- | ------------------------------------------------- |
| `className` | `string`                                               | —       | Additional CSS classes.                           |
| `...`       | All standard `<div>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### Popover.Body

| Prop        | Type                                                   | Default | Description                                       |
| ----------- | ------------------------------------------------------ | ------- | ------------------------------------------------- |
| `className` | `string`                                               | —       | Additional CSS classes.                           |
| `...`       | All standard `<div>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### Popover.Footer

| Prop        | Type                                                   | Default | Description                                       |
| ----------- | ------------------------------------------------------ | ------- | ------------------------------------------------- |
| `className` | `string`                                               | —       | Additional CSS classes.                           |
| `...`       | All standard `<div>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### Popover.Close

| Prop          | Type                                                                                                                                                        | Default    | Description                                                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `color`       | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'white'` \| `'light'` \| `'dark'` \| `'black'` \| `'text'` \| `'ghost'` | —          | Bulma color variant for the button. `ghost` renders a link-like button; `text` renders a minimal text-only button.               |
| `size`        | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                                                                                                          | —          | Size of the button.                                                                                                              |
| `isLight`     | `boolean`                                                                                                                                                   | `false`    | Applies a lighter color variant.                                                                                                 |
| `isRounded`   | `boolean`                                                                                                                                                   | `false`    | Makes the button rounded.                                                                                                        |
| `isLoading`   | `boolean`                                                                                                                                                   | `false`    | Displays a loading spinner. Under `prefers-reduced-motion: reduce` the spinner stops and stays drawn (with bestax's CSS loaded). |
| `isStatic`    | `boolean`                                                                                                                                                   | `false`    | Makes the button non-interactive.                                                                                                |
| `isFullwidth` | `boolean`                                                                                                                                                   | `false`    | Makes the button full-width.                                                                                                     |
| `isFullWidth` | `boolean`                                                                                                                                                   | `false`    | **Deprecated.** Use `isFullwidth` instead — `isFullwidth` wins if both are set. Makes the button full-width.                     |
| `isOutlined`  | `boolean`                                                                                                                                                   | `false`    | Applies outlined styling (requires color).                                                                                       |
| `isInverted`  | `boolean`                                                                                                                                                   | `false`    | Applies inverted styling (requires color).                                                                                       |
| `isFocused`   | `boolean`                                                                                                                                                   | `false`    | Applies focused styling (visual only).                                                                                           |
| `isActive`    | `boolean`                                                                                                                                                   | `false`    | Applies active styling (visual only).                                                                                            |
| `isHovered`   | `boolean`                                                                                                                                                   | `false`    | Applies hovered styling (visual only).                                                                                           |
| `isDisabled`  | `boolean`                                                                                                                                                   | `false`    | Applies disabled styling.                                                                                                        |
| `className`   | `string`                                                                                                                                                    | —          | Custom class name.                                                                                                               |
| `textColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                                                     | —          | Text color helper.                                                                                                               |
| `bgColor`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                                                     | —          | Background color helper.                                                                                                         |
| `children`    | `React.ReactNode`                                                                                                                                           | —          | Button content.                                                                                                                  |
| `type`        | `'button'` \| `'submit'` \| `'reset'`                                                                                                                       | `'button'` | Button type. Defaults to `'button'`, so a close button inside a form doesn't submit it; pass `'submit'` to submit and close.     |
| `onClick`     | `React.MouseEventHandler<HTMLButtonElement>`                                                                                                                | —          | Runs before the popover closes. Call `preventDefault()` to keep it open.                                                         |
| `...`         | All standard `<button>` attributes and Bulma helper props                                                                                                   | —          | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Popover` registers these variables on its constituent elements, where the themed declarations live. A value set via `className`, the `style` prop, or any ancestor is only inherited and loses to the element's own declaration — override by targeting the declaring element in your CSS. See [Theme](../helpers/theme.md).

| CSS Variable                         | Sass Variable                 | Default                          |
| ------------------------------------ | ----------------------------- | -------------------------------- |
| `--bulma-popover-z-index`            | `$popover-z-index`            | `30`                             |
| `--bulma-popover-background`         | `$popover-background`         | `var(--bulma-scheme-main)`       |
| `--bulma-popover-color`              | `$popover-color`              | `var(--bulma-text)`              |
| `--bulma-popover-border-color`       | `$popover-border-color`       | `var(--bulma-border-weak)`       |
| `--bulma-popover-radius`             | `$popover-radius`             | `var(--bulma-radius-large)`      |
| `--bulma-popover-shadow`             | `$popover-shadow`             | `var(--bulma-shadow)`            |
| `--bulma-popover-min-width`          | `$popover-min-width`          | `12rem`                          |
| `--bulma-popover-max-width`          | `$popover-max-width`          | `min(24rem, calc(100vw - 2rem))` |
| `--bulma-popover-offset`             | `$popover-offset`             | `0.25rem`                        |
| `--bulma-popover-header-padding`     | `$popover-header-padding`     | `0.75rem 1rem`                   |
| `--bulma-popover-header-color`       | `$popover-header-color`       | `var(--bulma-text-strong)`       |
| `--bulma-popover-header-weight`      | `$popover-header-weight`      | `var(--bulma-weight-semibold)`   |
| `--bulma-popover-body-padding`       | `$popover-body-padding`       | `1rem`                           |
| `--bulma-popover-footer-padding`     | `$popover-footer-padding`     | `0.75rem 1rem`                   |
| `--bulma-popover-footer-gap`         | `$popover-footer-gap`         | `0.5rem`                         |
| `--bulma-popover-animation-duration` | `$popover-animation-duration` | `0.15s`                          |

<!-- /bestax:generated cssvars -->
