---
title: ContextMenu
sidebar_label: ContextMenu
description: The `ContextMenu` component opens a menu of actions where you right-click an element, such as a table row or a card, or long press it on a touch screen.
---

# ContextMenu

## Overview

<!-- bestax:generated overview -->

The `ContextMenu` component opens a menu of actions where you right-click an element, such as a table row or a card, or long press it on a touch screen.

<!-- /bestax:generated overview -->

Reach for it when an element has actions people will look for under a right-click: Rename and
Delete on a row in a file list, Copy link and Download on an image, Move and Archive on a card in a
board. A context menu is a shortcut, though. Nothing tells a screen reader user it's there, and on
macOS nothing but VoiceOver opens it from the keyboard, so every action in it has to be reachable
from something visible too, such as a `Dropdown` on the same row. For a menu opened from a button
use `Dropdown`, and for a panel of content such as a form use `Popover`.

:::note Its actions need a visible way in

Pair a `ContextMenu` with a visible control that holds the same actions, the way
[On Table Rows](#on-table-rows) does with a `Dropdown`. The same items work in both.

:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { ContextMenu } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic ContextMenu

Pass the element the menu opens from as `trigger` and the items as children, and name the menu with
`aria-label`. Right-click the box below, or long press it on a touch screen. The menu opens at the
point, focus moves to its first item, and an item, <kbd>Escape</kbd> or a click outside closes it.

```tsx live
<ContextMenu
  aria-label="Actions for report.pdf"
  trigger={
    <Box tabIndex={0} p="6" textAlign="centered">
      report.pdf: right-click here, or long press on a touch screen
    </Box>
  }
>
  <ContextMenu.Item as="button">Rename</ContextMenu.Item>
  <ContextMenu.Item as="button">Duplicate</ContextMenu.Item>
  <ContextMenu.Divider />
  <ContextMenu.Item as="button" color="danger">
    Delete
  </ContextMenu.Item>
</ContextMenu>
```

### On Table Rows

The trigger is cloned rather than wrapped, so a table row stays a row. `onOpenChange` reports the
menu opening and closing, which is enough to highlight the row whose menu is open. Each row also
gets a `Dropdown` holding the same items, which is the visible way in, and its button is what
keyboard users focus to press <kbd>Shift</kbd>+<kbd>F10</kbd> on the row.

```tsx live
function example() {
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [last, setLast] = useState('nothing yet');
  const files = ['report.pdf', 'budget.xlsx', 'notes.txt'];

  return (
    <>
      <Paragraph mb="3">Last action: {last}</Paragraph>
      <Table isFullwidth>
        <Table.Tbody>
          {files.map(name => {
            const actions = (
              <>
                <ContextMenu.Item
                  as="button"
                  onClick={() => setLast(`Rename ${name}`)}
                >
                  Rename
                </ContextMenu.Item>
                <ContextMenu.Item
                  as="button"
                  onClick={() => setLast(`Duplicate ${name}`)}
                >
                  Duplicate
                </ContextMenu.Item>
                <ContextMenu.Divider />
                <ContextMenu.Item
                  as="button"
                  color="danger"
                  onClick={() => setLast(`Delete ${name}`)}
                >
                  Delete
                </ContextMenu.Item>
              </>
            );
            return (
              <ContextMenu
                key={name}
                aria-label={`Actions for ${name}`}
                onOpenChange={open =>
                  setOpenFor(current =>
                    open ? name : current === name ? null : current
                  )
                }
                trigger={
                  <Table.Tr isSelected={openFor === name}>
                    <Table.Td>{name}</Table.Td>
                    <Table.Td>
                      <Dropdown label="Actions" right>
                        {actions}
                      </Dropdown>
                    </Table.Td>
                  </Table.Tr>
                }
              >
                {actions}
              </ContextMenu>
            );
          })}
        </Table.Tbody>
      </Table>
    </>
  );
}
```

### From the Keyboard

On Windows and Linux, <kbd>Shift</kbd>+<kbd>F10</kbd> and the context menu key fire the browser's
`contextmenu` event at whatever has focus, and that opens the menu of the region it's in. It opens at
the event's point when that's on the focused element, and at the element's bottom-left corner when
it isn't, which is where the browser puts its own menu for the key. On macOS, VoiceOver's
<kbd>VO</kbd>+<kbd>Shift</kbd>+<kbd>M</kbd> fires the event, and nothing else does.

`ContextMenu` gives the trigger no tab stop, since it can't know what the element is. Keyboard users
reach it through something focusable inside it, like the row's `Dropdown` button above, or a
`tabIndex={0}` you give it, like the box in the first example.

### On Touch Screens

A touch or a pen held still on the trigger opens the menu at that point, which is the only way in on
an iPhone, since iOS never fires `contextmenu`. Moving the finger, lifting it early, a second finger
anywhere on the page, or the page starting to scroll cancels it, so two fingers on two rows open
neither menu. Lifting the finger after the menu opens doesn't click what's under it. The trigger turns off iOS's own callout for links and images, so it doesn't cover
the menu.

A long press on text still selects it, the way it does anywhere. Where that gets in the way, give
the trigger `interaction="unselectable"`.

```tsx live
<ContextMenu
  aria-label="Actions for IMG_0042.jpg"
  trigger={
    <Box tabIndex={0} interaction="unselectable" p="6" textAlign="centered">
      IMG_0042.jpg: long press, and no text gets selected
    </Box>
  }
>
  <ContextMenu.Item as="button">Copy link</ContextMenu.Item>
  <ContextMenu.Item as="button">Download</ContextMenu.Item>
</ContextMenu>
```

### Keeping It Open

An item closes the menu by default. With `closeOnClick={false}` it stays open, which suits items
that toggle in place. Give those `role="menuitemcheckbox"` and `aria-checked`, and screen readers
announce them as checkboxes.

```tsx live
function example() {
  const [hidden, setHidden] = useState(false);
  const [extensions, setExtensions] = useState(true);

  return (
    <ContextMenu
      aria-label="View options"
      closeOnClick={false}
      trigger={
        <Box tabIndex={0} p="6" textAlign="centered">
          Hidden files are {hidden ? 'shown' : 'hidden'}, extensions are{' '}
          {extensions ? 'shown' : 'hidden'}
        </Box>
      }
    >
      <ContextMenu.Item
        as="button"
        role="menuitemcheckbox"
        aria-checked={hidden}
        onClick={() => setHidden(value => !value)}
      >
        Show hidden files
      </ContextMenu.Item>
      <ContextMenu.Item
        as="button"
        role="menuitemcheckbox"
        aria-checked={extensions}
        onClick={() => setExtensions(value => !value)}
      >
        Show extensions
      </ContextMenu.Item>
    </ContextMenu>
  );
}
```

### Disabled Items

A disabled item stays in the menu, and the arrow keys and typing skip it, as they do in a
`Dropdown`. Use `disabled` on a `button` item, or `aria-disabled="true"` on a link.

```tsx live
<ContextMenu
  aria-label="Clipboard"
  trigger={
    <Box tabIndex={0} p="6" textAlign="centered">
      Right-click for the clipboard
    </Box>
  }
>
  <ContextMenu.Item as="button" disabled>
    Cut
  </ContextMenu.Item>
  <ContextMenu.Item as="button" disabled>
    Copy
  </ContextMenu.Item>
  <ContextMenu.Item as="button">Paste</ContextMenu.Item>
</ContextMenu>
```

### Nested Regions

A `ContextMenu` inside another one's trigger opens instead of it, so a card in a board gets the
card's menu and the space between cards gets the board's.

```tsx live
<ContextMenu
  aria-label="Board"
  trigger={
    <Box p="5">
      <Paragraph mb="4">Right-click between the cards for the board</Paragraph>
      <ContextMenu
        aria-label="Actions for Write the docs"
        trigger={
          <Card tabIndex={0}>
            <Card.Content>Write the docs</Card.Content>
          </Card>
        }
      >
        <ContextMenu.Item as="button">Move to Done</ContextMenu.Item>
        <ContextMenu.Item as="button">Archive</ContextMenu.Item>
      </ContextMenu>
    </Box>
  }
>
  <ContextMenu.Item as="button">New card</ContextMenu.Item>
  <ContextMenu.Item as="button">Rename board</ContextMenu.Item>
</ContextMenu>
```

A trigger's own `onContextMenu` runs first, and one that calls `preventDefault()` keeps the menu
closed, whether the event came from a right-click, a key or a long press.

### Turning It Off

`disabled` gives the trigger back to the browser: a right-click shows the browser's own menu, a long
press does what it does anywhere, and a menu that's open closes.

```tsx live
function example() {
  const [disabled, setDisabled] = useState(false);

  return (
    <>
      <Switch
        mb="3"
        checked={disabled}
        onChange={event => setDisabled(event.target.checked)}
      >
        Use the browser's menu
      </Switch>
      <ContextMenu
        aria-label="Actions for notes.txt"
        disabled={disabled}
        trigger={
          <Box tabIndex={0} p="6" textAlign="centered">
            notes.txt
          </Box>
        }
      >
        <ContextMenu.Item as="button">Rename</ContextMenu.Item>
        <ContextMenu.Item as="button">Delete</ContextMenu.Item>
      </ContextMenu>
    </>
  );
}
```

### Where the Menu Goes

The menu renders through [`Portal`](../helpers/portal.md), into the
[`portalContainer`](../helpers/config.md#where-portaled-content-goes) a `ConfigProvider` sets, or at
the end of the trigger's own document's `<body>`, which is an iframe's when the trigger is in one. It
opens below and to the right of the point, flips above or to the left of it where there's no room,
and moves in until it's inside the viewport where it fits on neither side. A menu taller than the
viewport scrolls inside. It doesn't follow the trigger: scrolling, resizing the window and the window
losing focus close it.

Inside a `Modal` or a shadow root, point `portalContainer` at an element inside it. A `Modal` hides
the rest of the page from screen readers that honor `aria-modal`, which would include a menu at the
end of `<body>`, and a shadow root's styles don't reach outside it.

```tsx
function RenameDialog({ active, onClose }) {
  const [overlays, setOverlays] = useState<HTMLElement | null>(null);

  return (
    <Modal active={active} onClose={onClose}>
      <ConfigProvider portalContainer={overlays ?? undefined}>
        <ContextMenu
          aria-label="Actions for report.pdf"
          trigger={<Box tabIndex={0}>report.pdf</Box>}
        >
          <ContextMenu.Item as="button">Rename</ContextMenu.Item>
        </ContextMenu>
      </ConfigProvider>
      <div ref={setOverlays} />
    </Modal>
  );
}
```

### Theming the Menu

The menu is Bulma's dropdown markup, in a box that's a `.dropdown` too, so it looks like a
`Dropdown`'s menu and the `--bulma-dropdown-*` variables theme it. Bulma declares those on
`.dropdown`, so to change context menus and leave `Dropdown` alone, set them on the box with a
selector that has both of its classes. Its own variables, listed under
[CSS & Sass Variables](#css--sass-variables), cap the menu's height and set the box's stacking order.

```css
.dropdown.context-menu-content {
  --bulma-dropdown-content-radius: var(--bulma-radius-large);
}
```

### Compound (dot-notation) usage

`ContextMenu.Item` and `ContextMenu.Divider` are `Dropdown.Item` and `Dropdown.Divider`, the same
components, so items written for a `Dropdown` work in a `ContextMenu` unchanged and the whole menu
comes from the one import.

```tsx live
<ContextMenu
  aria-label="Actions for notes.txt"
  trigger={
    <Box tabIndex={0} p="6" textAlign="centered">
      notes.txt
    </Box>
  }
>
  <ContextMenu.Item as="button">Open</ContextMenu.Item>
  <ContextMenu.Item as="button">Rename</ContextMenu.Item>
  <ContextMenu.Divider />
  <ContextMenu.Item as="button">Delete</ContextMenu.Item>
</ContextMenu>
```

---

## Accessibility

`ContextMenu` follows the [WAI-ARIA menu pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/),
without a menubar or submenus:

- **Opening:** APG names "a command, such as Shift + F10 in Windows, that opens a context specific
  menu". That's the browser's `contextmenu` event, which <kbd>Shift</kbd>+<kbd>F10</kbd> and the
  context menu key fire on Windows and Linux, and VoiceOver's <kbd>VO</kbd>+<kbd>Shift</kbd>+<kbd>M</kbd>
  fires on macOS. `ContextMenu` adds no key handler of its own, so the menu never opens twice for
  one key.
- **Focus on open** goes to the first enabled item, or to the menu itself when there's none.
- <kbd>ArrowDown</kbd> and <kbd>ArrowUp</kbd> move to the next and previous item, wrapping, and
  <kbd>Home</kbd> and <kbd>End</kbd> go to the first and last.
- **Typing** a letter moves to the next item whose text starts with what's been typed. Letters typed
  in quick succession add up to one search, and the same letter again cycles through the items that
  start with it. Each opening starts a new search.
- <kbd>Enter</kbd> and <kbd>Space</kbd> activate the focused item the way a click does, so its
  `onClick` runs, and a key held down activates it once.
- <kbd>Escape</kbd> closes the menu and returns focus to what had it before the menu opened. It
  stops there, so a `Popover` or a `Modal` around the menu stays open.
- <kbd>Tab</kbd> and <kbd>Shift</kbd>+<kbd>Tab</kbd> close it and return focus too. The menu sits at
  the end of the page, so letting Tab go on from it would skip the rest of the page.
- An item that runs closes the menu and returns focus, unless it moved focus somewhere else, such as
  into a `Modal` it opened or a rename field.

Roles and names:

- The menu is `role="menu"`, named by the `aria-label` or `aria-labelledby` you pass. There's no
  button to borrow a name from, and a development build warns when a menu opens without one.
- Items are `menuitem` by default, and `menuitemcheckbox` or `menuitemradio` with `aria-checked`
  through the item's `role`. A divider is an `<hr>`, which is a separator.
- Disabled items, a `button` with `disabled` or an item with `aria-disabled="true"`, are skipped by
  the arrow keys and by typing, as in `Dropdown`.
- The trigger gets no ARIA, no role and no tab stop. `aria-haspopup` describes a popup that opens
  when an element is activated, and a right-click on a row isn't that. So nothing tells a screen
  reader user the menu is there, and on macOS only VoiceOver opens it from the keyboard: every action
  in it has to be reachable from a visible control as well, which
  [WCAG 2.1.1](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html) asks for.

And around it:

- The menu isn't modal. A press outside it closes it and does whatever it does, the rest of the page
  stays reachable, and nothing locks scrolling.
- Nothing listens on the page while the menu is closed and no finger is held on its trigger, so a
  table with a menu on every row adds no listeners until one is used.
- The menu doesn't animate.

---

## Related Components

- [`Dropdown`](./dropdown.md): A menu opened from its own button, and the visible way in to the same
  actions.
- [`Popover`](./popover.md): A panel opened with a click, for content people work with, such as a
  form.
- [`HoverCard`](./hovercard.md): A preview that opens on hover or keyboard focus.
- [`Portal`](../helpers/portal.md): What the menu renders through.
- [`ConfigProvider`](../helpers/config.md): Its `portalContainer` decides where the menu goes.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [WAI-ARIA APG: Menu and Menubar Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/)
- [WCAG Understanding: Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html)
- [Storybook: ContextMenu Stories](https://bestax.io/storybook/?path=/story/components-contextmenu--default)

---

## Props

<!-- bestax:generated props -->

| Prop           | Type                                                   | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------- | ------------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `trigger`      | `React.ReactElement`                                   | —       | The element a right-click, Shift+F10, the context menu key or a long press opens the menu from: a table row, a card, an image. It's cloned, not wrapped, so a row stays a row, which means it has to be a single element that passes `className` and the `onContextMenu`, `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel` and `onTouchEnd` handlers to its DOM node. Its own handlers for those run first, and one that calls `preventDefault()` on `contextmenu` keeps the menu closed. A `ContextMenu` inside it opens instead of this one. It gets no ARIA and no tab stop, since it can be any element and a right-click isn't an activation. Keyboard users reach it through something focusable inside it, such as the row's own `Dropdown` button, or a `tabIndex={0}` you give it, and press Shift+F10 or the context menu key there. It gets `-webkit-touch-callout: none`, so iOS doesn't put its own callout for a link or an image over the menu. A long press still selects text the way it does anywhere, so give a region where it shouldn't `interaction="unselectable"`. |
| `children`     | `React.ReactNode`                                      | —       | The menu's items: `ContextMenu.Item` and `ContextMenu.Divider`, the same components as `Dropdown.Item` and `Dropdown.Divider`. Every action in it needs a visible way in as well, such as a `Dropdown` on the same row: nothing tells a screen reader user the menu is there, and on macOS only VoiceOver opens it from the keyboard.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `onOpenChange` | `(open: boolean) => void`                              | —       | Called with `true` when the menu opens and `false` when it closes, whatever closed it, such as for highlighting the row whose menu is open. Nothing fires after ContextMenu unmounts. There's no `open` prop to go with it: a menu opened from code has no point to open at.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `closeOnClick` | `boolean`                                              | `true`  | Close the menu when an item is clicked, or activated with Enter or Space. A click on a divider or between items leaves it open either way.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `disabled`     | `boolean`                                              | `false` | Leave the trigger to the browser: a right-click shows the browser's own menu, a long press does what it does anywhere, and an open menu closes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `aria-label`   | `string`                                               | —       | The menu's accessible name, such as "Actions for report.pdf". There's no button to borrow a name from, so pass this or `aria-labelledby`, and a development build warns when the menu opens with neither.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `className`    | `string`                                               | —       | Additional classes for the menu (`role="menu"`). The trigger keeps its own.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `...`          | All standard `<div>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

**Subcomponents:**

- `ContextMenu.Item`: Bulma Dropdown item.
- `ContextMenu.Divider`: Bulma Dropdown divider.

### ContextMenu.Item

| Prop        | Type                                                                   | Default | Description                                                                                                                                                                      |
| ----------- | ---------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `as`        | `'a'` \| `'div'` \| `'button'`                                         | `'a'`   | The element type to render. `'button'` renders `type="button"` unless you pass `type="submit"` or `type="reset"`, so an item inside a form does not submit it.                   |
| `active`    | `boolean`                                                              | `false` | Whether the item is active.                                                                                                                                                      |
| `className` | `string`                                                               | —       | Additional CSS classes.                                                                                                                                                          |
| `disabled`  | `boolean`                                                              | `false` | Marks the item as disabled; disabled items are skipped during keyboard navigation. Use with `as="button"` for a native disabled control, or pair with `aria-disabled` on a link. |
| `children`  | `React.ReactNode`                                                      | —       | Item content.                                                                                                                                                                    |
| `...`       | Remaining props of the element selected by `as` and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`ContextMenu` registers these variables on its constituent elements, where the themed declarations live. A value set via `className`, the `style` prop, or any ancestor is only inherited and loses to the element's own declaration — override by targeting the declaring element in your CSS. See [Theme](../helpers/theme.md).

| CSS Variable                      | Sass Variable              | Default                   |
| --------------------------------- | -------------------------- | ------------------------- |
| `--bulma-context-menu-z-index`    | `$context-menu-z-index`    | `$extras-z-index-tooltip` |
| `--bulma-context-menu-max-height` | `$context-menu-max-height` | `calc(100dvh - 1rem)`     |

<!-- /bestax:generated cssvars -->
