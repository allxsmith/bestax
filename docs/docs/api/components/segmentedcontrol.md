---
title: SegmentedControl
sidebar_label: SegmentedControl
description: The `SegmentedControl` component renders a row of buttons where only one can be on, and tells a screen reader it's a radio group.
---

# SegmentedControl

## Overview

<!-- bestax:generated overview -->

The `SegmentedControl` component renders a row of buttons where only one can be on, and tells a screen reader it's a radio group.

<!-- /bestax:generated overview -->

Reach for it when the page needs one choice out of a few, shown all at once and applied right away:
left, center or right alignment in an editor, a list or a grid above a gallery, day, week or month
on a calendar, monthly or yearly on a pricing table. Pressing a segment checks it and unchecks the
one before it.

It looks like a row of [`ToggleButton`](../elements/togglebutton.md)s in `Buttons hasAddons`, and
it's drawn the same way, with Bulma's own `.buttons.has-addons` row and a fill on the chosen
button. But it isn't a set of toggles, since turning one on turns another off, so a screen reader
hears it as a radio group: "Text alignment, radio group, Center, radio button, checked".

:::tip Sending the choice with a form?

`SegmentedControl` carries no form value. A choice that's submitted with a form is a
[`Radios`](../form/radios.md) group, which gives the form its `name` and value, takes part in
reset and validation, and has the browser's own keyboard.

:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { SegmentedControl } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Default SegmentedControl

Each `SegmentedControl.Segment` takes a `value`, and `defaultValue` says which one starts checked
when the group holds its own state. Give the group an `aria-label` (or `aria-labelledby`), so a
screen reader can say what the choice is.

```tsx live
<SegmentedControl aria-label="Text alignment" defaultValue="left">
  <SegmentedControl.Segment value="left">Left</SegmentedControl.Segment>
  <SegmentedControl.Segment value="center">Center</SegmentedControl.Segment>
  <SegmentedControl.Segment value="right">Right</SegmentedControl.Segment>
</SegmentedControl>
```

### Nothing Checked Yet

Leave `defaultValue` out and nothing is checked until someone picks. Tab lands on the first segment
without checking it, and Space, Enter or an arrow key picks one. After that it can't go back to
nothing: pressing the checked segment again keeps it checked, as a radio group does.

That first segment becomes the tab stop once the row has rendered in the browser, since the row
learns which segments it has from there. In server-rendered markup a row with nothing checked
can't be reached with Tab until then. If yours has to be reachable before the page hydrates, give
it a `defaultValue`: the checked segment is the tab stop in the server markup too.

```tsx live
<SegmentedControl aria-label="Plan">
  <SegmentedControl.Segment value="starter">Starter</SegmentedControl.Segment>
  <SegmentedControl.Segment value="team">Team</SegmentedControl.Segment>
  <SegmentedControl.Segment value="business">Business</SegmentedControl.Segment>
</SegmentedControl>
```

### Controlled

Pass `value` to hold the state yourself. Picking a segment calls `onChange` with its `value` and
changes nothing until you pass that value back, the way a controlled `Tabs` or `Collapses` works.
`onChange` fires without `value` too, so it's also how you hear about a group that holds its own
state. It fires once per change, and never for the segment that's already checked. Pass
`value={null}` to check nothing while you hold the state.

```tsx live
function example() {
  const [range, setRange] = useState('week');

  return (
    <>
      <SegmentedControl
        aria-label="Calendar range"
        value={range}
        onChange={setRange}
      >
        <SegmentedControl.Segment value="day">Day</SegmentedControl.Segment>
        <SegmentedControl.Segment value="week">Week</SegmentedControl.Segment>
        <SegmentedControl.Segment value="month">Month</SegmentedControl.Segment>
      </SegmentedControl>
      <Paragraph mt="3">Showing one {range} at a time.</Paragraph>
    </>
  );
}
```

### The Check Follows Focus

The arrow keys don't just move focus, they check the segment they land on, and `onChange` fires
for each one. That's the APG rule for a radio group, and it's how native radio buttons behave. It
suits a choice that's cheap to apply, like the views here. If picking a segment starts something
slow, such as a request, wait for the user to settle before you start it.

```tsx live
function example() {
  const [view, setView] = useState('list');

  return (
    <>
      <SegmentedControl aria-label="View" value={view} onChange={setView}>
        <SegmentedControl.Segment value="list">List</SegmentedControl.Segment>
        <SegmentedControl.Segment value="grid">Grid</SegmentedControl.Segment>
        <SegmentedControl.Segment value="board">Board</SegmentedControl.Segment>
      </SegmentedControl>
      <Paragraph mt="3">
        Tab to the row and press the arrow keys: the {view} view follows.
      </Paragraph>
    </>
  );
}
```

### Colors

`color` is the checked segment's fill. It's `link` by default, as on `ToggleButton`, and it takes
the same colors: `white`, `light`, `dark` and `black` aren't offered, since in one theme or the
other each fills about as light or dark as an unchecked segment already is.

```tsx live
<>
  <SegmentedControl aria-label="Billing" defaultValue="yearly">
    <SegmentedControl.Segment value="monthly">Monthly</SegmentedControl.Segment>
    <SegmentedControl.Segment value="yearly">Yearly</SegmentedControl.Segment>
  </SegmentedControl>
  <SegmentedControl aria-label="Billing" color="primary" defaultValue="yearly">
    <SegmentedControl.Segment value="monthly">Monthly</SegmentedControl.Segment>
    <SegmentedControl.Segment value="yearly">Yearly</SegmentedControl.Segment>
  </SegmentedControl>
  <SegmentedControl aria-label="Billing" color="success" defaultValue="yearly">
    <SegmentedControl.Segment value="monthly">Monthly</SegmentedControl.Segment>
    <SegmentedControl.Segment value="yearly">Yearly</SegmentedControl.Segment>
  </SegmentedControl>
</>
```

To style your own checked look, target `[aria-checked='true']` or `.is-selected`, which are both
there on the checked segment. `is-selected` takes the class prefix a `ConfigProvider` sets, which a
hand-written class can't.

### Sizes and Placement

`size` sizes every segment at once, through Bulma's `are-small`, `are-medium` and `are-large` on
the row. `isCentered` and `isRight` place the row, the same as on `Buttons`.

```tsx live
<>
  <SegmentedControl aria-label="View" size="small" defaultValue="list">
    <SegmentedControl.Segment value="list">List</SegmentedControl.Segment>
    <SegmentedControl.Segment value="grid">Grid</SegmentedControl.Segment>
  </SegmentedControl>
  <SegmentedControl
    aria-label="View"
    size="medium"
    isCentered
    defaultValue="grid"
  >
    <SegmentedControl.Segment value="list">List</SegmentedControl.Segment>
    <SegmentedControl.Segment value="grid">Grid</SegmentedControl.Segment>
  </SegmentedControl>
  <SegmentedControl aria-label="View" size="large" isRight defaultValue="list">
    <SegmentedControl.Segment value="list">List</SegmentedControl.Segment>
    <SegmentedControl.Segment value="grid">Grid</SegmentedControl.Segment>
  </SegmentedControl>
</>
```

### Separate Buttons

The segments are joined by default. `hasAddons={false}` sets them apart with Bulma's usual gap.
Nothing else changes: it's still one tab stop, and the arrow keys still move the check.

```tsx live
<SegmentedControl aria-label="Shirt size" hasAddons={false} defaultValue="m">
  <SegmentedControl.Segment value="s">S</SegmentedControl.Segment>
  <SegmentedControl.Segment value="m">M</SegmentedControl.Segment>
  <SegmentedControl.Segment value="l">L</SegmentedControl.Segment>
  <SegmentedControl.Segment value="xl">XL</SegmentedControl.Segment>
</SegmentedControl>
```

### Icon-Only Segments

An icon on its own needs an `aria-label` on its segment, so a screen reader has something to say.

```tsx live
<SegmentedControl aria-label="Text alignment" defaultValue="left">
  <SegmentedControl.Segment value="left" aria-label="Align left">
    <Icon name="align-left" />
  </SegmentedControl.Segment>
  <SegmentedControl.Segment value="center" aria-label="Align center">
    <Icon name="align-center" />
  </SegmentedControl.Segment>
  <SegmentedControl.Segment value="right" aria-label="Align right">
    <Icon name="align-right" />
  </SegmentedControl.Segment>
  <SegmentedControl.Segment value="justify" aria-label="Justify">
    <Icon name="align-justify" />
  </SegmentedControl.Segment>
</SegmentedControl>
```

### Disabled Segments

`isDisabled` (or `disabled`) on a segment makes it a disabled button. It can't be clicked, the arrow
keys, Home and End skip it, and it never holds the tab stop. A checked one keeps its fill under
Bulma's disabled look, and Tab goes to the first enabled segment instead.

```tsx live
<SegmentedControl aria-label="Shipping speed" defaultValue="standard">
  <SegmentedControl.Segment value="standard">Standard</SegmentedControl.Segment>
  <SegmentedControl.Segment value="express" isDisabled>
    Express
  </SegmentedControl.Segment>
  <SegmentedControl.Segment value="overnight">
    Overnight
  </SegmentedControl.Segment>
</SegmentedControl>
```

### Stopping a Change

A segment's `onClick` runs before it's checked, for a click and for the arrow keys alike, since
the keys check a segment by clicking it. Call `event.preventDefault()` in it and nothing changes,
and `onChange` doesn't fire.

```tsx live
<SegmentedControl aria-label="Visibility" defaultValue="private">
  <SegmentedControl.Segment value="private">Private</SegmentedControl.Segment>
  <SegmentedControl.Segment
    value="public"
    onClick={event => {
      if (!window.confirm('Anyone with the link will see it.')) {
        event.preventDefault();
      }
    }}
  >
    Public
  </SegmentedControl.Segment>
</SegmentedControl>
```

### Compound (dot-notation) usage

`SegmentedControl.Segment` is the only way to write a segment, so every example here is already
dot notation. The row can come from data like any other list.

```tsx live
function example() {
  const views = [
    { value: 'list', label: 'List' },
    { value: 'grid', label: 'Grid' },
    { value: 'board', label: 'Board' },
  ];

  return (
    <SegmentedControl aria-label="View" defaultValue="grid">
      {views.map(view => (
        <SegmentedControl.Segment key={view.value} value={view.value}>
          {view.label}
        </SegmentedControl.Segment>
      ))}
    </SegmentedControl>
  );
}
```

---

## Keyboard

The keys follow the [APG radio group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/), the one
outside a toolbar:

| Key                                              | What it does                                                                                                         |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Moves into the row at the checked segment, or the first enabled one while none is checked, and out again in one step |
| <kbd>Right Arrow</kbd> / <kbd>Down Arrow</kbd>   | Moves to the next enabled segment and checks it, wrapping from the last to the first                                 |
| <kbd>Left Arrow</kbd> / <kbd>Up Arrow</kbd>      | Moves to the previous enabled segment and checks it, wrapping from the first to the last                             |
| <kbd>Home</kbd> / <kbd>End</kbd>                 | Moves to the first or last enabled segment and checks it                                                             |
| <kbd>Space</kbd>                                 | Checks the focused segment, when it isn't already                                                                    |
| <kbd>Enter</kbd>                                 | Does what it does on any button: clicks the focused segment, which checks it                                         |

Disabled segments are skipped by all of these. A segment's `onKeyDown` runs first, and a
`preventDefault()` there keeps the row from handling that key. A key the row takes stops there, so
a handler above it, such as a carousel's arrows, doesn't act on it too. Keys the row leaves alone
carry on up.

---

## Accessibility

`SegmentedControl` follows the
[APG radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/), which is what the
[APG toolbar example](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/examples/toolbar/) uses for
its alignment buttons: "since pressing one toggles off another so that only one button in the group
is in the pressed state, the toggles behave like radio buttons."

- **Roles and state:** the row is `role="radiogroup"`, and each segment is a native
  `<button type="button">` with `role="radio"` and `aria-checked` set to `"true"` or `"false"` from
  the first render, server markup included. There's no `aria-pressed`: a segment is checked or not,
  not pressed.
- **A name for the group:** a radio group needs one, so pass `aria-label` or `aria-labelledby`. A
  development build warns when it has neither.
- **One tab stop:** the checked segment holds it, or the first enabled segment while none is
  checked. While focus is in the row the stop goes with it, so Tab always leaves from where you
  are. The first-segment fallback needs the browser: server markup with nothing checked has no
  tab stop until the row has rendered on the client, as
  [Nothing Checked Yet](#nothing-checked-yet) says.
- **The check follows focus:** the arrow keys, Home and End check the segment they move to, as
  native radio buttons do. A screen reader announces the new segment as checked straight away.
- **It can't be cleared:** once a segment is checked, one always is. Pressing the checked segment
  again keeps it checked and doesn't call `onChange`.
- **Icon-only segments** need an `aria-label`, as on `Button`.
- **Checked is easy to see:** the default `link` fill turns a light segment solid blue, and a dark
  one bright in dark mode, so it's a change in lightness and not only in hue. `color` leaves out the
  fills that wouldn't be, the same way `ToggleButton` does.
- **Not a form field:** it's always `type="button"`, so it never submits a form, and it carries no
  value. A choice the form should send is `Radios`.

---

## Related Components

- [`Radios`](../form/radios.md): One choice from several, sent with a form.
- [`ToggleButton`](../elements/togglebutton.md): A button that stays pressed, for toggles that each
  turn on and off on their own.
- [`Buttons`](../elements/buttons.md): The row of buttons this is drawn with.
- [`Tabs`](./tabs.md): A choice of panel, with `Tabs.Content` showing the one picked.
- [`Icon`](../elements/icon.md): The icon in an icon-only segment.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, display, etc.

---

## Additional Resources

- [WAI-ARIA APG: Radio Group Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)
- [WAI-ARIA APG: Toolbar Example](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/examples/toolbar/)
- [Bulma Button Documentation: List of buttons](https://bulma.io/documentation/elements/button/#list-of-buttons)
- [Storybook: SegmentedControl Stories](https://bestax.io/storybook/?path=/story/components-segmentedcontrol--default)

---

## Props

<!-- bestax:generated props -->

| Prop              | Type                                                                            | Default  | Description                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `value`           | `string` \| `null`                                                              | —        | The checked segment's `value`, when you hold the state. Setting it makes the group controlled: picking a segment only calls `onChange`, and nothing changes until you pass the new value. `null` checks nothing, with the tab stop `defaultValue` describes for that. Pick this or `defaultValue` for the group's lifetime.                                                                |
| `defaultValue`    | `string`                                                                        | —        | The segment checked to begin with, when the group holds its own state. Leave it out and nothing is checked until someone picks one, and Tab lands on the first enabled segment meanwhile. That fallback takes hold once the row has rendered in the browser: server markup with nothing checked has no tab stop until then, while a checked segment is the stop from the server markup on. |
| `onChange`        | `(value: string) => void`                                                       | —        | Called with the newly checked segment's `value`, whether or not `value` is set. The arrow keys, Home and End check the segment they move to, so each of those calls it too: the check follows focus, as in a native radio group. Pressing the checked segment again doesn't call it, since a segmented control can't be cleared: one stays checked once one is.                            |
| `color`           | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | `'link'` | The checked segment's fill. The others are plain buttons, so the fill is the difference people see. Takes the same colors as `ToggleButton`, for the same reason: `white`, `light`, `dark` and `black` fill about as light or dark as a plain button already is in one theme or the other.                                                                                                 |
| `size`            | `'small'` \| `'medium'` \| `'large'`                                            | —        | Size of every segment, through Bulma's `are-<size>` on the row.                                                                                                                                                                                                                                                                                                                            |
| `hasAddons`       | `boolean`                                                                       | `true`   | Joins the segments into one row with no gap between them, Bulma's `has-addons`. Set it to `false` for separate buttons.                                                                                                                                                                                                                                                                    |
| `isCentered`      | `boolean`                                                                       | `false`  | Centers the row.                                                                                                                                                                                                                                                                                                                                                                           |
| `isRight`         | `boolean`                                                                       | `false`  | Aligns the row to the right.                                                                                                                                                                                                                                                                                                                                                               |
| `className`       | `string`                                                                        | —        | Additional CSS classes to apply.                                                                                                                                                                                                                                                                                                                                                           |
| `children`        | `React.ReactNode`                                                               | —        | The `SegmentedControl.Segment`s, each with a `value` of its own.                                                                                                                                                                                                                                                                                                                           |
| `aria-label`      | `string`                                                                        | —        | Names the group for a screen reader, such as "Text alignment". A radio group needs a name, so pass this or `aria-labelledby`, and a development build warns when it has neither.                                                                                                                                                                                                           |
| `aria-labelledby` | `string`                                                                        | —        | The id of a visible heading or label that names the group, in place of `aria-label`.                                                                                                                                                                                                                                                                                                       |
| `ref`             | `React.Ref<HTMLDivElement>`                                                     | —        | Ref forwarded to the row's `<div>`.                                                                                                                                                                                                                                                                                                                                                        |
| `...`             | All standard `<div>` attributes and Bulma helper props                          | —        | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                          |

**Subcomponents:**

- `SegmentedControl.Segment`: One option in the row: a `<button role="radio">` that's checked while the group's value is its `value`, filled with the group's `color` and marked `is-selected`.

### SegmentedControl.Segment

| Prop         | Type                                                      | Default | Description                                                                                                                                                                                               |
| ------------ | --------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`      | `string`                                                  | —       | **Required.** What `onChange` reports when this segment is checked, and what the group's `value` and `defaultValue` name it by. Unique within the group.                                                  |
| `children`   | `React.ReactNode`                                         | —       | The label. An icon on its own needs an `aria-label`, so a screen reader has something to say.                                                                                                             |
| `isDisabled` | `boolean`                                                 | `false` | Disables the segment, the same as `disabled`: it can't be clicked, the arrow keys, Home and End skip it, and it never holds the row's tab stop. A checked one keeps its fill under Bulma's disabled look. |
| `isFocused`  | `boolean`                                                 | `false` | Applies focused styling (visual only).                                                                                                                                                                    |
| `isHovered`  | `boolean`                                                 | `false` | Applies hovered styling (visual only).                                                                                                                                                                    |
| `className`  | `string`                                                  | —       | Custom class name.                                                                                                                                                                                        |
| `ref`        | `React.Ref<HTMLButtonElement>`                            | —       | Ref forwarded to the `<button>`.                                                                                                                                                                          |
| `...`        | All standard `<button>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                         |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

`SegmentedControl` has no variables of its own. Each segment is a `Button`, so
[Button's variables](../elements/button.md#css--sass-variables) style it, set the same way: on the
segment itself, through its `className`. A value set on the row is only inherited, and loses to
the one Bulma declares on each `.button`, so target the segments, as in
`.my-row > .button { … }`. The `--bulma-button-text-*`, `--bulma-button-ghost-*` and
`--bulma-button-static-*` rows there don't apply, since a segment is never `is-text`, `is-ghost`
or `is-static`.
