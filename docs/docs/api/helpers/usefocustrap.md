---
title: useFocusTrap
sidebar_label: useFocusTrap
---

# useFocusTrap

## Overview

`useFocusTrap` keeps keyboard focus inside a container while it is active: focus moves in when the trap turns on, Tab and Shift+Tab wrap between the first and last tab stops, and focus goes back where it came from when the trap turns off.

Use it for your own floating or modal content, such as a filter panel, a command palette or a custom popover. `Modal`, `Dialog` and the date and time pickers already manage focus themselves.

---

## Import

```tsx
import { useFocusTrap } from '@allxsmith/bestax-bulma';
```

---

## Usage

### A panel opened from a button

Pass a ref to the container and turn the trap on with the panel. Give the container `tabIndex={-1}` so it can hold focus itself when nothing inside can. Open the panel below, then Tab past Cancel or Shift+Tab past the input: focus wraps, skipping the disabled button.

```tsx live
function example() {
  const [open, setOpen] = useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, { active: open, restoreFocus: buttonRef });

  return (
    <>
      <Button
        ref={buttonRef}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="filters-panel"
        onClick={() => setOpen(o => !o)}
      >
        Filters
      </Button>
      {open && (
        <div
          ref={panelRef}
          id="filters-panel"
          role="dialog"
          aria-label="Filters"
          tabIndex={-1}
          onKeyDown={e => e.key === 'Escape' && setOpen(false)}
        >
          <Box mt="3">
            <Input label="Name contains" />
            <Buttons>
              <Button color="primary" onClick={() => setOpen(false)}>
                Apply
              </Button>
              <Button disabled>Export</Button>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
            </Buttons>
          </Box>
        </div>
      )}
    </>
  );
}
```

The trap doesn't close anything. Escape, a click outside and the buttons that dismiss the panel are the component's to handle, as the `onKeyDown` above does.

### Where focus starts

On its own the trap focuses the first tab stop inside the container, or the container when there is none. `initialFocusRef` picks a specific element instead, such as the search box of a command palette.

```tsx
const searchRef = useRef<HTMLInputElement>(null);
useFocusTrap(paletteRef, { active: open, initialFocusRef: searchRef });
```

### Where focus goes back to

`restoreFocus` decides where focus lands when the trap turns off, whether because `active` went `false` or because the component unmounted.

- `true` (the default) returns it to the element that had focus when the trap turned on.
- A ref sends it to that element instead. Prefer this for a panel opened from a button: some browsers don't focus a button when it is clicked, and content that focuses itself as it mounts (an `autoFocus` input) takes focus before the trap can see where it came from.
- `false` leaves focus alone.

Focus only moves back while the trap still holds it. If a click has already put focus on something else outside the container, it stays there.

### With `Portal`

A trapped panel is often rendered through [`Portal`](./portal.md). Portaled content only exists from the commit after hydration, and the trap waits for hydration the same way, so it attaches when the panel appears. See [A floating panel](./portal.md#a-floating-panel) for the whole pattern.

### Which elements are tab stops

Tab stops are taken in document order. Elements the browser's Tab skips are skipped here too, so none of them can become an end of the trap and let Tab walk out of the container:

- a negative `tabIndex`, such as the unfocused items of a roving-tabindex grid
- disabled controls, including those inside a disabled `<fieldset>`
- anything not rendered: `hidden`, `display: none` on the element or an ancestor, `visibility: hidden`
- anything inside an `inert` subtree

A positive `tabIndex` is not reordered; the trap wraps at the first and last stops in document order.

### Nested traps

The trap listens for Tab on its container, so a trap inside another one handles Tab first and the outer trap stands aside. A panel that opens a second panel inside it keeps focus in the inner one.

---

## API

```ts
function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  options?: UseFocusTrapOptions
): void;

interface UseFocusTrapOptions {
  active?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  restoreFocus?: boolean | RefObject<HTMLElement | null>;
}
```

### Parameters

| Parameter                 | Type                                          | Default | Description                                                                                                                                       |
| ------------------------- | --------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `containerRef`            | `RefObject<HTMLElement \| null>`              | —       | The element focus stays inside. It has to be in the DOM when the trap turns on.                                                                   |
| `options.active`          | `boolean`                                     | `true`  | Whether the trap is on. Turning it on moves focus in; turning it off (or unmounting) releases Tab and restores focus.                             |
| `options.initialFocusRef` | `RefObject<HTMLElement \| null>`              | —       | The element to focus when the trap turns on. Without it, or while it points at nothing, the first tab stop, then the container.                   |
| `options.restoreFocus`    | `boolean` \| `RefObject<HTMLElement \| null>` | `true`  | Where focus goes when the trap turns off: `true` for the element focused when it turned on, a ref for that element, `false` to leave focus alone. |

It returns nothing. On the server it does nothing, and the container renders as written.

---

## Accessibility

- Trap focus in content that asks for the reader's attention until it is dismissed: a dialog, a command palette, a panel with its own controls. Content a reader should be able to Tab past, such as a tooltip or a disclosure, shouldn't be trapped.
- Pair the trap with a way out. The trap handles Tab only, so wire Escape (and any close button) to turn it off.
- Give the container a role and an accessible name (`role="dialog"` with `aria-label` or `aria-labelledby`), and give the button that opens it `aria-haspopup`, `aria-expanded` and `aria-controls`.
- Return focus to the element that opened the content when it closes. The default does, and a ref to the trigger makes it reliable.
- The trap is for the keyboard. It doesn't hide the rest of the page from screen readers or pointers; for fully modal content, use [`Modal`](../components/modal.md), which sets `aria-modal`.

---

## Related Components

- [`Portal`](./portal.md): Renders the trapped panel at the end of `document.body` or into a container.
- [`ClientOnly`](./clientonly.md): The hydration rule the trap follows, as a wrapper.
- [`Modal`](../components/modal.md): A modal overlay with its own focus management.
- [`Dialog`](../components/dialog.md): Ready-made confirm and alert dialogs.

---

## Additional Resources

- [Storybook: useFocusTrap Stories](https://bestax.io/storybook/?path=/story/helpers-usefocustrap--default)
- [WAI-ARIA Authoring Practices: Dialog (Modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
