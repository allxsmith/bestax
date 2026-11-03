---
title: FloatButton
sidebar_label: FloatButton
description: The `FloatButton` component renders a round icon button that floats in a corner of the screen, with its name as a tooltip.
keywords:
  - FAB
  - floating action button
  - speed dial
  - back to top
  - BackTop
  - SpeedDial
  - Fab
---

# FloatButton

## Overview

<!-- bestax:generated overview -->

The `FloatButton` component renders a round icon button that floats in a corner of the screen, with its name as a tooltip.

<!-- /bestax:generated overview -->

Reach for it for the screen's main action, such as "New message" or "Add task" on a list or a phone
layout, for a speed dial that opens a few related actions, and for back to top on a long page.
Material UI calls these `Fab` and `SpeedDial`, and Ant Design calls them `FloatButton`,
`FloatButton.Group` and `FloatButton.BackTop`.

It's an [`IconButton`](../elements/iconbutton.md) with `isRounded`, which is a circle at every size,
inside an [`Affix`](./affix.md) in its corner, so it takes everything those two take. Its name,
`aria-label` or `aria-labelledby`, is required, and the `aria-label` shows as a tooltip that a screen
reader doesn't read a second time. Several in one corner go in [`FloatButtons`](./floatbuttons.md).

:::info
Bulma has buttons but nothing that floats, so `FloatButton` brings its own styles, in `bestax.css`
and its variants, or in `extras.css` next to your own Bulma: the shadow, the stack, the speed dial's
layout, and back to top's fade. The corner is Affix's and the circle is IconButton's.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { FloatButton } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Give it a name and an icon. It's fixed to the browser window, not to this example, so show it and
look at the bottom-left corner of the page. Its own default is the bottom right; these examples use
the left, since this site's back-to-top button sits in the bottom right. Hover it, or Tab to it, to
see its name.

```tsx live
function example() {
  const [shown, setShown] = useState(false);
  return (
    <>
      <Button onClick={() => setShown(!shown)}>
        {shown ? 'Hide the button' : 'Show the button'}
      </Button>
      {shown && (
        <FloatButton
          aria-label="New message"
          icon="pen"
          color="primary"
          position="bottom-left"
        />
      )}
    </>
  );
}
```

### Naming It

`aria-label` is required, or `aria-labelledby` in its place, since an icon gives a screen reader
nothing to announce. Name the action, "New message", not the picture, "Pen". The `aria-label` is
also the tooltip's text, and the tooltip is marked as a repeat of the name, so a screen reader
hears it once. A button named by `aria-labelledby` gets no tooltip, since its name is on the page
already.

```tsx
<FloatButton aria-label="New message" icon="pen" />

<h2 id="inbox-title">Inbox</h2>
<FloatButton aria-labelledby="inbox-title" icon="inbox" />
```

### Colors and Sizes

`color` takes Bulma's colors, and unset it's Bulma's default button. `size` takes `'small'` (30px),
`'medium'` (50px) or `'large'` (60px), and unset it's 40px across.

```tsx live
function example() {
  const [shown, setShown] = useState(false);
  return (
    <>
      <Button onClick={() => setShown(!shown)}>
        {shown ? 'Hide the buttons' : 'Show the buttons'}
      </Button>
      {shown && (
        <FloatButtons position="bottom-left">
          <FloatButton aria-label="Small" icon="pen" size="small" />
          <FloatButton aria-label="Normal" icon="pen" color="info" />
          <FloatButton
            aria-label="Medium"
            icon="pen"
            size="medium"
            color="success"
          />
          <FloatButton
            aria-label="Large"
            icon="pen"
            size="large"
            color="primary"
          />
        </FloatButtons>
      )}
    </>
  );
}
```

### Showing the Label

A tooltip shows on hover and keyboard focus, which a touch screen has neither of. `showLabel` prints
the `aria-label` beside the icon as the button's text, a pill, in place of the tooltip. It's Material
UI's extended FAB.

```tsx live
function example() {
  const [shown, setShown] = useState(false);
  return (
    <>
      <Button onClick={() => setShown(!shown)}>
        {shown ? 'Hide the button' : 'Show the button'}
      </Button>
      {shown && (
        <FloatButton
          aria-label="Compose"
          icon="pen"
          color="primary"
          position="bottom-left"
          showLabel
        />
      )}
    </>
  );
}
```

With `aria-labelledby` there's no text to print, so the button stays an icon, and a development
build warns.

### Several in One Corner

Two float buttons in the same corner sit on top of each other. Put them in
[`FloatButtons`](./floatbuttons.md), which stacks them top to bottom in the order you write them. A
`Badge` around one puts a count on it.

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
          <Badge content={3} overlap="circle" color="danger">
            <FloatButton aria-label="Inbox, 3 unread" icon="inbox" />
          </Badge>
          <FloatButton aria-label="New message" icon="pen" color="primary" />
        </FloatButtons>
      )}
    </>
  );
}
```

### Speed Dial

`FloatButton.SpeedDial` is a trigger that opens a few related actions, which are `FloatButton`s,
nearest the trigger first. It's a menu button: a click, Enter or Space opens it, an action runs
and closes it, and Escape or a press outside closes it too. Closed, the actions aren't rendered.

```tsx live
function example() {
  const [shown, setShown] = useState(false);
  const [last, setLast] = useState('nothing yet');
  return (
    <>
      <Button onClick={() => setShown(!shown)}>
        {shown ? 'Hide the speed dial' : 'Show the speed dial'}
      </Button>
      <Paragraph mt="2">Created: {last}</Paragraph>
      {shown && (
        <FloatButton.SpeedDial
          aria-label="Create"
          icon="plus"
          color="primary"
          position="bottom-left"
        >
          <FloatButton
            aria-label="Note"
            icon="note-sticky"
            onClick={() => setLast('a note')}
          />
          <FloatButton
            aria-label="Task"
            icon="check"
            onClick={() => setLast('a task')}
          />
          <FloatButton
            aria-label="Event"
            icon="calendar"
            onClick={() => setLast('an event')}
          />
        </FloatButton.SpeedDial>
      )}
    </>
  );
}
```

The trigger's name names the menu too. Its `icon`, `color` and `size` are the trigger's, and each
action takes its own. The trigger's tooltip opens toward the page, as a lone button's does, and
hides while the dial is open, since the actions can take its side then.

### Speed Dial Directions

`direction` is the way the actions run from the trigger on the screen: `'up'`, `'down'`, `'left'` or
`'right'`. Unset, it's up from a bottom corner and down from a top one. The arrow key that points
that way moves away from the trigger, in right-to-left text too.

```tsx live
function example() {
  const [shown, setShown] = useState(false);
  return (
    <>
      <Button onClick={() => setShown(!shown)}>
        {shown ? 'Hide the speed dial' : 'Show the speed dial'}
      </Button>
      {shown && (
        <FloatButton.SpeedDial
          aria-label="Share"
          icon="share-nodes"
          position="bottom-left"
          direction="right"
          defaultOpen
        >
          <FloatButton aria-label="Copy link" icon="link" />
          <FloatButton aria-label="Email" icon="envelope" />
          <FloatButton aria-label="Print" icon="print" />
        </FloatButton.SpeedDial>
      )}
    </>
  );
}
```

### Labels on Touch Screens

`showLabels` prints every action's name beside it, as each one's `showLabel` would, so the actions
make sense on a touch screen, where a tooltip never shows.

```tsx live
function example() {
  const [shown, setShown] = useState(false);
  return (
    <>
      <Button onClick={() => setShown(!shown)}>
        {shown ? 'Hide the speed dial' : 'Show the speed dial'}
      </Button>
      {shown && (
        <FloatButton.SpeedDial
          aria-label="Create"
          icon="plus"
          color="primary"
          position="bottom-left"
          showLabels
          defaultOpen
        >
          <FloatButton aria-label="Note" icon="note-sticky" />
          <FloatButton aria-label="Task" icon="check" />
        </FloatButton.SpeedDial>
      )}
    </>
  );
}
```

### Opening on Hover

`openOnHover` also opens the dial when the pointer rests on it, and closes it once the pointer and
focus have left. It's for the pointer only: keyboard focus on the trigger never opens it, and a
touch screen doesn't either, so a keyboard user still opens it with Enter or Space. A click still
toggles it, so a click on a dial the pointer opened closes it.

```tsx
<FloatButton.SpeedDial aria-label="Share" icon="share-nodes" openOnHover>
  <FloatButton aria-label="Copy link" icon="link" />
  <FloatButton aria-label="Email" icon="envelope" />
</FloatButton.SpeedDial>
```

### Controlled

`open`, `defaultOpen` and `onOpenChange` work as they do on `Popover`. With `open` in your state,
you can swap the trigger's icon and name while it's open.

```tsx live
function example() {
  const [shown, setShown] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setShown(!shown)}>
        {shown ? 'Hide the speed dial' : 'Show the speed dial'}
      </Button>
      <Paragraph mt="2">The dial is {open ? 'open' : 'closed'}.</Paragraph>
      {shown && (
        <FloatButton.SpeedDial
          aria-label={open ? 'Close the menu' : 'Create'}
          icon={open ? 'xmark' : 'plus'}
          color="primary"
          position="bottom-left"
          open={open}
          onOpenChange={setOpen}
        >
          <FloatButton aria-label="Note" icon="note-sticky" />
          <FloatButton aria-label="Task" icon="check" />
        </FloatButton.SpeedDial>
      )}
    </>
  );
}
```

### Back to Top

`FloatButton.BackToTop` shows once the page has scrolled past `visibilityHeight`, 400px by default,
and takes it back to the top. It scrolls smoothly, or at once for someone who prefers reduced
motion. Then it moves focus to the page's `<main>`, so the next Tab starts at the top of the
content. Without that, the next Shift+Tab from the button lands on the last link on the page and
scrolls it straight back down. Its name is "Back to top" unless you give it another, such as a
translation.

```tsx live
function example() {
  const [shown, setShown] = useState(false);
  return (
    <>
      <Button onClick={() => setShown(!shown)}>
        {shown ? 'Hide back to top' : 'Show back to top'}
      </Button>
      {shown && (
        <FloatButton.BackToTop position="bottom-left" visibilityHeight={200} />
      )}
    </>
  );
}
```

This page is already scrolled well past 200px here, so it appears as soon as you show it, and
hides again near the top. It renders nothing on the server, since only the browser knows how far
the page has scrolled, and hidden it's out of the Tab order and the accessibility tree.

`moveFocus` takes a ref to focus something else, such as the page's heading. Without a `<main>`
it focuses `<body>`, so the next Tab starts at the top of the page. An element that can't take
focus, such as `<main>`, a heading or `<body>`, can for as long as it has focus, with no focus ring
round it, so the next Tab goes on from there. A `tabindex` the page gave it is left as it is. `moveFocus={false}` moves none: the button hides with focus on it once the
scroll is done, focus drops to the document, and the next Tab starts wherever the browser decides.

### Back to Top in a Scroller

`scrollContainer` points it at an element that scrolls on its own, such as a
[`ScrollArea`](./scrollarea.md): an element, a ref, or a selector. It watches that element, scrolls
it, and with `moveFocus` left on, focuses it.

```tsx live
function example() {
  const feedRef = React.useRef<HTMLDivElement>(null);
  return (
    <>
      <ScrollArea ref={feedRef} maxHeight="12rem" aria-label="Feed">
        <Title as="h3" size="5">
          Feed
        </Title>
        {Array.from({ length: 12 }, (_, i) => (
          <Paragraph key={i} mb="3">
            Update {i + 1}. Search now matches tags as well as titles.
          </Paragraph>
        ))}
      </ScrollArea>
      <FloatButton.BackToTop
        scrollContainer={feedRef}
        position="bottom-left"
        visibilityHeight={100}
      />
    </>
  );
}
```

Scroll the feed to see the button. The scroller is found when the button mounts, so a ref whose
element changes later isn't followed.

### Toasts and Other Corners

Toasts default to the top right, so they miss a float button in its default corner. A
bottom-right toast stack covers one, since toasts stack above everything in a corner: put the float
button in another corner, or move it up with a larger offset, as in
[Affix's offsets](./affix.md#offsets-and-the-safe-area).

### Compound (dot-notation) usage

`FloatButton.SpeedDial` and `FloatButton.BackToTop` are also exported by name, as
`FloatButtonSpeedDial` and `FloatButtonBackToTop`.

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

---

## Keyboard

On the speed dial's trigger:

| Key                                  | Action                                       |
| ------------------------------------ | -------------------------------------------- |
| <kbd>Enter</kbd>, <kbd>Space</kbd>   | Opens it on the nearest action, or closes it |
| The arrow pointing along `direction` | Opens it on the nearest action               |
| The arrow pointing back              | Opens it on the farthest action              |
| <kbd>Escape</kbd>                    | Closes it                                    |

In its menu:

| Key                                  | Action                                             |
| ------------------------------------ | -------------------------------------------------- |
| The arrow pointing along `direction` | The next action, away from the trigger, wrapping   |
| The arrow pointing back              | The previous action, toward the trigger, wrapping  |
| <kbd>Home</kbd>, <kbd>End</kbd>      | The nearest and the farthest action                |
| A letter                             | The next action whose visible text starts with it  |
| <kbd>Enter</kbd>, <kbd>Space</kbd>   | Runs the action, closes it and focuses the trigger |
| <kbd>Escape</kbd>                    | Closes it and focuses the trigger                  |
| <kbd>Tab</kbd>                       | Closes it, and focus moves on                      |

Typing matches what an action shows, so it finds actions with `showLabels` and passes over icons.

---

## Accessibility

- **A name for every button:** the types require `aria-label` or `aria-labelledby` on a
  `FloatButton` and a speed dial's trigger, and an empty one warns in development. Back to top's
  defaults to "Back to top". With `showLabel` or `showLabels`, the name is the text on the button,
  so what a voice control user reads is what they say
  ([WCAG 2.5.3](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name)).
- **The tooltip doesn't repeat the name:** it shows the name to sighted users on hover and keyboard
  focus, and it's hidden from assistive technology, with no `aria-describedby` on the button, so a
  screen reader hears the name once. It stays while the pointer moves onto it, and Escape hides it,
  as every [`Tooltip`](./tooltip.md) does.
- **The speed dial is a menu button**
  ([APG](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)): the trigger has
  `aria-haspopup="menu"` and `aria-expanded`, and `aria-controls` while the menu is open. The menu
  is named by the trigger and holds `menuitem`s. Only activation opens it, never focus, so a
  keyboard user who Tabs past it isn't shown a menu, and `openOnHover` answers the pointer alone.
  Closed actions aren't rendered, so they aren't in the accessibility tree.
- **Back to top moves focus:** after it scrolls, focus goes to the top of the content, so the next
  Tab starts there and the next Shift+Tab doesn't scroll back to the bottom
  ([WCAG 2.4.3](https://www.w3.org/WAI/WCAG22/Understanding/focus-order)). Focus moves without
  scrolling, so it doesn't cut the scroll short. Hidden, the button is out of the Tab order and the
  accessibility tree.
- **Reduced motion:** back to top's scroll is instant, and its fade and the speed dial's are off,
  for someone who prefers reduced motion
  ([WCAG 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions)). The
  browser's smooth scroll doesn't stop on its own for that preference, so the component checks it.
- **Focus not obscured:** a float button can cover a focused link near its corner. Give `html` a
  `scroll-padding-bottom` for a bottom-corner button, as
  [Affix's accessibility notes](./affix.md#accessibility) show
  ([WCAG 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum)).
- **Reading and Tab order are DOM order,** whatever corner it shows in, so write it after the
  page's main content. In a speed dial, the trigger comes first and then the actions, nearest
  first, so the reading order and the arrows agree.
- **Forced colors:** the shadow drops out, and every float button keeps an outline inside its edge
  there, colored ones too, so it stays on the page. Keyboard focus, and `isFocused`, widen it in the
  system's highlight color. The default icons draw in `currentColor`.
- **Right-to-left:** the corner and `direction` are physical, so a dial that runs left still runs
  left, and its arrows still follow the screen. The dial reads the writing direction the browser
  computes, so a `dir` attribute and a CSS `direction` both count.

---

## Related Components

- [`FloatButtons`](./floatbuttons.md): Several float buttons stacked in one corner.
- [`IconButton`](../elements/iconbutton.md): What each float button renders, for an icon button
  that doesn't float.
- [`Affix`](./affix.md): The corner, its offsets, the safe area and `portal`, for anything else that
  floats.
- [`Tooltip`](./tooltip.md): The tooltip that shows each button's name.
- [`Badge`](./badge.md): A count on a float button, with `overlap="circle"`.
- [`Dropdown`](./dropdown.md): The menu button the speed dial is modeled on, for a menu with a
  labelled trigger.
- [`Toast`](./toast.md): Short-lived messages in a corner of their own, which stack over a float
  button.

---

## Additional Resources

- [Storybook: FloatButton Stories](https://bestax.io/storybook/?path=/story/components-floatbutton--default)
- [WAI-ARIA APG: Menu Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)
- [WCAG 2.2: Understanding Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order)
- [WCAG 2.2 Technique C39: Using the CSS reduce-motion query](https://www.w3.org/WAI/WCAG22/Techniques/css/C39)

---

## Props

<!-- bestax:generated props -->

| Prop              | Type                                                                                                                                                        | Default          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `as`              | `React.ElementType`                                                                                                                                         | `'button'`       | Render as a `<button>`, an `<a>`, or a custom component such as a router `Link`, as on `IconButton`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `showLabel`       | `boolean`                                                                                                                                                   | `false`          | Prints the `aria-label` beside the icon as the button's text, a pill (MUI's extended FAB), in place of the tooltip, for touch screens, where a tooltip never shows. It renders through `Button` then, with no `aria-label` attribute, since the text names it. A development build warns when there's no `aria-label` to print, as with `aria-labelledby`, and the button stays an icon.                                                                                                                                                                                                                                 |
| `color`           | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'white'` \| `'light'` \| `'dark'` \| `'black'` \| `'text'` \| `'ghost'` | —                | Bulma color, as `Button`'s. Unset, it's Bulma's default button.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `size`            | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                                                                                                          | —                | `'small'` (30px), `'normal'` (40px, the same as unset), `'medium'` (50px) or `'large'` (60px), as `Button`'s.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `position`        | `'top-right'` \| `'top-left'` \| `'bottom-right'` \| `'bottom-left'`                                                                                        | `'bottom-right'` | The corner it's fixed to, as `Affix`'s. Inside `FloatButtons` or a `FloatButton.SpeedDial`, which place it, it's ignored.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `portal`          | `boolean` \| `string` \| `HTMLElement`                                                                                                                      | `false`          | Renders it into another container, as `Affix`'s `portal` does. Inside `FloatButtons` or a `FloatButton.SpeedDial` it's ignored.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `icon`            | `React.ReactNode`                                                                                                                                           | —                | The glyph. A string is an `Icon` name, drawn from the icon library `ConfigProvider` sets. An `<Icon>` renders as given, so it can carry its own `variant` or `library`. Any other node, such as an SVG or a component from an icon package, goes inside an `Icon`, which gives it the `.icon` wrapper Bulma keeps square. It's decorative: the button's name says what it does. Give the glyph here or as `children`, not both: with both, it draws `icon` and warns in development. With neither, such as an empty string from `cond ? 'trash' : ''`, the button is an empty square, and that warns in development too. |
| `children`        | `React.ReactNode`                                                                                                                                           | —                | The glyph as children, the way Mantine, MUI and Chakra take it: an `<Icon>` renders as given, and any other node, such as an SVG, goes inside an `Icon`, as with `icon`. Left out when `icon` is given, which warns in development. Text warns too, since `aria-label` replaces it as the name: a button with text is a `Button`.                                                                                                                                                                                                                                                                                        |
| `aria-labelledby` | `string`                                                                                                                                                    | —                | The id of the element whose text names the button, in place of `aria-label`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `aria-label`      | `string`                                                                                                                                                    | —                | The button's name: what a screen reader announces and what a voice control user says to press it. Required, or `aria-labelledby` in its place, since an icon has no text to name it by. Name the action ("Delete"), not the picture ("Trash"). An empty or blank one warns in development.                                                                                                                                                                                                                                                                                                                               |
| `isLight`         | `boolean`                                                                                                                                                   | `false`          | Applies a lighter color variant.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `isLoading`       | `boolean`                                                                                                                                                   | `false`          | Displays a loading spinner, with everything inside the button hidden behind it, in forced colors (Windows' contrast themes) too. Under `prefers-reduced-motion: reduce` the spinner stops and stays drawn. Bulma alone hides only the label, so the rest needs bestax's CSS loaded.                                                                                                                                                                                                                                                                                                                                      |
| `isStatic`        | `boolean`                                                                                                                                                   | `false`          | Makes the button non-interactive.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `isOutlined`      | `boolean`                                                                                                                                                   | `false`          | Applies outlined styling (requires color).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `isInverted`      | `boolean`                                                                                                                                                   | `false`          | Applies inverted styling (requires color).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `isFocused`       | `boolean`                                                                                                                                                   | `false`          | Applies focused styling (visual only).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `isActive`        | `boolean`                                                                                                                                                   | `false`          | Applies active styling (visual only), with no `aria-pressed`. For a button that stays pressed, use `ToggleButton`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `isHovered`       | `boolean`                                                                                                                                                   | `false`          | Applies hovered styling (visual only).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `isDisabled`      | `boolean`                                                                                                                                                   | `false`          | Applies disabled styling.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `className`       | `string`                                                                                                                                                    | —                | Custom class name.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `textColor`       | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                                                     | —                | Text color helper.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `bgColor`         | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                                                     | —                | Background color helper.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `type`            | `string`                                                                                                                                                    | `'button'`       | On a `<button>`, `'button'`, `'submit'` or `'reset'`, and `'button'` unless you pass one of the other two, as on `IconButton`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `ref`             | `PolymorphicRef<React.ElementType>`                                                                                                                         | —                | Ref forwarded to the element `as` renders, typed from `as`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `...`             | Remaining props of the element or component selected by `as` (default `<button>`) and Bulma helper props                                                    | —                | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

**Subcomponents:**

- `FloatButton.SpeedDial`: The `FloatButton.SpeedDial` component is a float button that opens a menu of related actions, which are FloatButtons. It's an APG menu button, on Dropdown's model. Activation opens it: Enter and Space toggle it and open it on the nearest action, the arrow that points along the dial opens it on the nearest action, and the opposite arrow on the farthest. In the menu, the arrow pointing away from the trigger moves away from it and the other moves back, Home and End go to the nearest and farthest actions, and typing a letter moves to the next action whose visible text starts with it, which an icon alone has none of, so it finds actions with `showLabels`. Escape closes it and focuses the trigger, Tab closes it and lets focus move on, and a press outside closes it. Activating an action runs its `onClick`, closes the dial and hands focus back to the trigger, unless `closeOnClick` is false. Closed, the actions aren't rendered.
- `FloatButton.BackToTop`: The `FloatButton.BackToTop` component is a float button that shows once the page has scrolled down, and takes it back to the top. It renders nothing on the server, and after hydration a scroll listener shows it past `visibilityHeight` and hides it above. Hidden, it keeps its place in a `FloatButtons` stack, out of the Tab order and the accessibility tree. Activated, it scrolls the page, or `scrollContainer`, to the top, smoothly or at once when the user prefers reduced motion, and moves focus to the top of the content (`moveFocus`), so the next Tab starts there rather than back where the page was.

### FloatButton.SpeedDial

| Prop              | Type                                                                                                                                                        | Default          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `icon`            | `React.ReactNode`                                                                                                                                           | —                | The trigger's icon, as IconButton's `icon`: an Icon name or a node. Decorative, since the name says what it does. To swap it while the dial is open, pass a different one from a controlled `open`.                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `color`           | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'white'` \| `'light'` \| `'dark'` \| `'black'` \| `'text'` \| `'ghost'` | —                | The trigger's Bulma color, as `Button`'s.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `size`            | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                                                                                                          | —                | The trigger's size; the actions take their own.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `children`        | `React.ReactNode`                                                                                                                                           | —                | `FloatButton`s, the actions, nearest the trigger first.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `open`            | `boolean`                                                                                                                                                   | —                | Whether the actions are shown. Controlled; pair it with `onOpenChange`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `defaultOpen`     | `boolean`                                                                                                                                                   | `false`          | Whether the actions are shown at first, uncontrolled.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `onOpenChange`    | `(open: boolean) => void`                                                                                                                                   | —                | Called with the new state when it opens or closes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `openOnHover`     | `boolean`                                                                                                                                                   | `false`          | Also opens when the pointer rests on it, after a short delay, through the hook under HoverCard and Tooltip, and closes once the pointer and focus have left the trigger and the actions. The pointer only: keyboard focus on the trigger never opens it, and a touch pointer doesn't either. Activation still toggles it, which is how the keyboard opens it, so a click on a dial the pointer opened closes it. It isn't Dropdown's `hoverable`, which opens on hover in place of a click, through CSS alone: this opens on hover as well as a click, and the open state, `aria-expanded` and `onOpenChange` follow it. |
| `closeOnClick`    | `boolean`                                                                                                                                                   | `true`           | Closes the dial when an action is clicked, or activated with Enter or Space, and hands focus back to the trigger, as Dropdown's does. Off, the dial stays open and focus stays on the action.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `direction`       | `'up'` \| `'down'` \| `'left'` \| `'right'`                                                                                                                 | —                | The way the actions run from the trigger, on the screen, in right-to-left text too. The arrow key that points that way moves away from the trigger. Unset, it's `'up'` from a bottom corner and `'down'` from a top one.                                                                                                                                                                                                                                                                                                                                                                                                 |
| `showLabels`      | `boolean`                                                                                                                                                   | `false`          | Prints every action's `aria-label` beside it, as each one's `showLabel` does, for touch screens, where a tooltip never shows. Unset inside `FloatButtons`, it's the stack's `showLabels`.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `position`        | `'top-right'` \| `'top-left'` \| `'bottom-right'` \| `'bottom-left'`                                                                                        | `'bottom-right'` | The corner, as `Affix`'s. Inside `FloatButtons`, which places it, it's ignored.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `portal`          | `boolean` \| `string` \| `HTMLElement`                                                                                                                      | `false`          | As `Affix`'s `portal`. Inside `FloatButtons` it's ignored.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `aria-labelledby` | `string`                                                                                                                                                    | —                | The id of the element whose text names the button, in place of `aria-label`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `aria-label`      | `string`                                                                                                                                                    | —                | The button's name: what a screen reader announces and what a voice control user says to press it. Required, or `aria-labelledby` in its place, since an icon has no text to name it by. Name the action ("Delete"), not the picture ("Trash"). An empty or blank one warns in development.                                                                                                                                                                                                                                                                                                                               |
| `className`       | `string`                                                                                                                                                    | —                | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `ref`             | `React.Ref<HTMLDivElement>`                                                                                                                                 | —                | Ref forwarded to the root `<div>`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `...`             | All standard `<div>` attributes and Bulma helper props                                                                                                      | —                | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

### FloatButton.BackToTop

| Prop               | Type                                                                                                                                                        | Default          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aria-label`       | `string`                                                                                                                                                    | `'Back to top'`  | The button's name, and its tooltip's text. Pass your own to translate it. An empty one keeps the default rather than leaving the button unnamed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `aria-labelledby`  | `string`                                                                                                                                                    | —                | The id of an element whose text names it, in place of `aria-label`. No tooltip then.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `icon`             | `React.ReactNode`                                                                                                                                           | —                | The icon. Unset, an up arrow drawn in `currentColor`, as Carousel's arrows are.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `visibilityHeight` | `number`                                                                                                                                                    | `400`            | How far the page, or `scrollContainer`, has to scroll before the button shows, in pixels.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `scrollContainer`  | `string` \| `HTMLElement` \| `React.RefObject<HTMLElement \| null>`                                                                                         | —                | The element that scrolls, when it isn't the window: an element, a ref, or a `document.querySelector` selector. The button watches it and scrolls it. It's found when the button mounts and when this prop changes, so a ref whose element changes later isn't followed, and one that finds nothing leaves the button on the window.                                                                                                                                                                                                                                                                                                     |
| `moveFocus`        | `boolean` \| `React.RefObject<HTMLElement \| null>`                                                                                                         | `true`           | Where focus goes after it scrolls, shaped like `useFocusTrap`'s `restoreFocus`. `true` focuses the page's `<main>`, or the `scrollContainer` when there is one, or else `<body>`; a ref focuses that element; `false` moves none, so the button hides with focus on it once the scroll is done, focus drops to the document, and the next Tab starts wherever the browser decides. Focus moves with `preventScroll`, at once, so it doesn't cut the scroll short. An element that can't take focus gets `tabindex="-1"`, and no focus ring, until it loses it, so the next Tab goes on from there. A tabindex of its own is left alone. |
| `showLabel`        | `boolean`                                                                                                                                                   | `false`          | Prints the `aria-label` beside the icon as the button's text, a pill (MUI's extended FAB), in place of the tooltip, for touch screens, where a tooltip never shows. It renders through `Button` then, with no `aria-label` attribute, since the text names it. A development build warns when there's no `aria-label` to print, as with `aria-labelledby`, and the button stays an icon.                                                                                                                                                                                                                                                |
| `color`            | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'white'` \| `'light'` \| `'dark'` \| `'black'` \| `'text'` \| `'ghost'` | —                | Bulma color, as `Button`'s. Unset, it's Bulma's default button.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `size`             | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                                                                                                          | —                | `'small'` (30px), `'normal'` (40px, the same as unset), `'medium'` (50px) or `'large'` (60px), as `Button`'s.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `position`         | `'top-right'` \| `'top-left'` \| `'bottom-right'` \| `'bottom-left'`                                                                                        | `'bottom-right'` | The corner it's fixed to, as `Affix`'s. Inside `FloatButtons` or a `FloatButton.SpeedDial`, which place it, it's ignored.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `portal`           | `boolean` \| `string` \| `HTMLElement`                                                                                                                      | `false`          | Renders it into another container, as `Affix`'s `portal` does. Inside `FloatButtons` or a `FloatButton.SpeedDial` it's ignored.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `isLight`          | `boolean`                                                                                                                                                   | `false`          | Applies a lighter color variant.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `isLoading`        | `boolean`                                                                                                                                                   | `false`          | Displays a loading spinner, with everything inside the button hidden behind it, in forced colors (Windows' contrast themes) too. Under `prefers-reduced-motion: reduce` the spinner stops and stays drawn. Bulma alone hides only the label, so the rest needs bestax's CSS loaded.                                                                                                                                                                                                                                                                                                                                                     |
| `isStatic`         | `boolean`                                                                                                                                                   | `false`          | Makes the button non-interactive.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `isOutlined`       | `boolean`                                                                                                                                                   | `false`          | Applies outlined styling (requires color).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `isInverted`       | `boolean`                                                                                                                                                   | `false`          | Applies inverted styling (requires color).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `isFocused`        | `boolean`                                                                                                                                                   | `false`          | Applies focused styling (visual only).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `isActive`         | `boolean`                                                                                                                                                   | `false`          | Applies active styling (visual only), with no `aria-pressed`. For a button that stays pressed, use `ToggleButton`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `isHovered`        | `boolean`                                                                                                                                                   | `false`          | Applies hovered styling (visual only).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `isDisabled`       | `boolean`                                                                                                                                                   | `false`          | Applies disabled styling.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `className`        | `string`                                                                                                                                                    | —                | Custom class name.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `textColor`        | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                                                     | —                | Text color helper.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `bgColor`          | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                                                     | —                | Background color helper.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `ref`              | `React.Ref<HTMLButtonElement>`                                                                                                                              | —                | Ref forwarded to the `<button>`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `...`              | All standard `<button>` attributes and Bulma helper props                                                                                                   | —                | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`FloatButton` registers these variables on its constituent elements, where the themed declarations live. A value set via `className`, the `style` prop, or any ancestor is only inherited and loses to the element's own declaration — override by targeting the declaring element in your CSS. See [Theme](../helpers/theme.md).

| CSS Variable                                 | Sass Variable                       | Default                 |
| -------------------------------------------- | ----------------------------------- | ----------------------- |
| `--bulma-float-button-shadow` †              | `$float-button-shadow`              | `var(--bulma-shadow)`   |
| `--bulma-float-button-transition-duration` † | `$float-button-transition-duration` | `var(--bulma-duration)` |
| `--bulma-float-button-actions-gap`           | `$float-button-actions-gap`         | `0.5rem`                |

† declared on a compound selector (higher specificity than a single class): a lone `className` class loses — override with inline `style` or a selector exceeding that specificity (matching it wins only when loaded after the library styles).

<!-- /bestax:generated cssvars -->
