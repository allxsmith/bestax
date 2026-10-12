---
title: Tooltip
sidebar_label: Tooltip
description: The `Tooltip` component displays helpful information when users hover over or focus on an element.
---

# Tooltip

## Overview

<!-- bestax:generated overview -->

The `Tooltip` component displays helpful information when users hover over or focus on an element.

<!-- /bestax:generated overview -->

It supports multiple positions, colors, and styles. Perfect for providing additional context, abbreviation expansions, or action descriptions.

:::note On phones and tablets

By default a touch screen never shows a `Tooltip`: there's no hover, and a tap belongs to the
trigger. Anything a touch user needs to know can't live only in a tooltip. For a trigger with no
tap action of its own, `openOnTap` shows the tooltip with a tap, as
[On Touch Screens](#on-touch-screens) shows.

:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Tooltip } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Tooltip

A simple tooltip on a button.

```tsx live
function example() {
  return (
    <Tooltip label="This is helpful information">
      <Button>Hover me</Button>
    </Tooltip>
  );
}
```

---

### Positions

Tooltip in different positions around the trigger.

```tsx live
function example() {
  return (
    <Buttons>
      <Tooltip label="Top tooltip" position="top">
        <Button>Top</Button>
      </Tooltip>
      <Tooltip label="Bottom tooltip" position="bottom">
        <Button>Bottom</Button>
      </Tooltip>
      <Tooltip label="Left tooltip" position="left">
        <Button>Left</Button>
      </Tooltip>
      <Tooltip label="Right tooltip" position="right">
        <Button>Right</Button>
      </Tooltip>
    </Buttons>
  );
}
```

---

### Colors

Tooltip with different color variants.

```tsx live
function example() {
  return (
    <Buttons>
      <Tooltip label="Primary" color="primary">
        <Button color="primary">Primary</Button>
      </Tooltip>
      <Tooltip label="Link" color="link">
        <Button color="link">Link</Button>
      </Tooltip>
      <Tooltip label="Info" color="info">
        <Button color="info">Info</Button>
      </Tooltip>
      <Tooltip label="Success" color="success">
        <Button color="success">Success</Button>
      </Tooltip>
      <Tooltip label="Warning" color="warning">
        <Button color="warning">Warning</Button>
      </Tooltip>
      <Tooltip label="Danger" color="danger">
        <Button color="danger">Danger</Button>
      </Tooltip>
    </Buttons>
  );
}
```

---

### Multiline

Tooltip that wraps to multiple lines for longer content.

```tsx live
function example() {
  return (
    <Block p="5">
      <Tooltip
        label="This is a longer tooltip that wraps to multiple lines. It's useful for displaying more detailed information."
        multiline
      >
        <Button>Hover for more info</Button>
      </Tooltip>
    </Block>
  );
}
```

---

### Always Visible

Tooltip that's always visible, regardless of hover state.

```tsx live
function example() {
  return (
    <Block p="5">
      <Tooltip label="I'm always visible!" active color="info">
        <Button>Always visible tooltip</Button>
      </Tooltip>
    </Block>
  );
}
```

---

### Dashed Underline

Tooltip on text with a dashed underline to indicate more info is available. The `abbr` takes
`tabIndex={0}`, so keyboard users can reach it too, and a screen reader reads the full name as its
description.

```tsx live
function example() {
  return (
    <Paragraph>
      The term{' '}
      <Tooltip label="Application Programming Interface" dashed>
        <abbr tabIndex={0}>API</abbr>
      </Tooltip>{' '}
      is commonly used in software development.
    </Paragraph>
  );
}
```

---

### With Delay

Tooltip that appears after a delay.

```tsx live
function example() {
  return (
    <Buttons>
      <Tooltip label="No delay" delay={0}>
        <Button>No delay</Button>
      </Tooltip>
      <Tooltip label="500ms delay" delay={500}>
        <Button>500ms delay</Button>
      </Tooltip>
      <Tooltip label="1 second delay" delay={1000}>
        <Button>1s delay</Button>
      </Tooltip>
    </Buttons>
  );
}
```

---

### On Touch Screens

A touch screen has no hover, so a phone or tablet never shows the tooltip unless you pass
`openOnTap`. With it, a tap on the trigger shows the tooltip at once, and it stays until another tap
on the trigger or the tooltip, a tap anywhere else, or <kbd>Escape</kbd>. The tap still does
whatever the trigger does, so turn it on only for a trigger with no tap action of its own, like the
`Button` below, which has no `onClick`. Mouse and pen work the same either way.

```tsx live
<Tooltip label="Orders over $50 ship free" openOnTap>
  <Button>Shipping</Button>
</Tooltip>
```

---

### On Icons

Tooltips on icon-only buttons. A tooltip describes its trigger rather than naming it, so each button
gets a name of its own with `aria-label`, and a screen reader reads the name and then the tooltip.

```tsx live
function example() {
  return (
    <Buttons p="6">
      <Tooltip label="Moves it to the trash" color="danger" position="bottom">
        <Button aria-label="Delete">
          <Icon name="fas fa-trash" />
        </Button>
      </Tooltip>
      <Tooltip label="Opens it for editing" color="info" position="bottom">
        <Button aria-label="Edit">
          <Icon name="fas fa-edit" />
        </Button>
      </Tooltip>
      <Tooltip label="Saves a copy as a PDF" color="success" position="bottom">
        <Button aria-label="Download">
          <Icon name="fas fa-download" />
        </Button>
      </Tooltip>
    </Buttons>
  );
}
```

---

### Form Field Help

Using tooltips to provide help for form fields. The help is a button beside the label rather than
inside it, since a label can't hold a control other than the one it names.

```tsx live
function example() {
  const id = React.useId();
  return (
    <Field>
      <Block display="flex" alignItems="center" mb="2">
        <label className="label mb-0" htmlFor={id}>
          Password
        </label>
        <Tooltip
          label="Must be at least 8 characters with one number and one special character"
          multiline
          color="info"
        >
          <Button size="small" color="ghost" aria-label="Password rules">
            <Icon name="fas fa-question-circle" />
          </Button>
        </Tooltip>
      </Block>
      <Control>
        <Input id={id} type="password" placeholder="Enter password" />
      </Control>
    </Field>
  );
}
```

---

### Abbreviations

Using tooltips to explain abbreviations in text. Each `abbr` takes `tabIndex={0}` so Tab reaches it,
as the [Dashed Underline](#dashed-underline) example does.

```tsx live
function example() {
  return (
    <Paragraph style={{ lineHeight: 1.8 }}>
      Hover over{' '}
      <Tooltip label="Cascading Style Sheets" color="info" dashed>
        <abbr tabIndex={0}>CSS</abbr>
      </Tooltip>{' '}
      or{' '}
      <Tooltip label="HyperText Markup Language" color="info" dashed>
        <abbr tabIndex={0}>HTML</abbr>
      </Tooltip>{' '}
      to see their full names.
    </Paragraph>
  );
}
```

---

## Accessibility

`Tooltip` is built to
[WCAG's Content on Hover or Focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)
criterion:

- **Dismissible:** <kbd>Escape</kbd> hides a shown tooltip wherever focus is, without you moving the
  pointer or focus, and it stays hidden until the pointer or focus leaves the trigger and comes
  back, or, with `openOnTap`, until the next tap on the trigger. The key goes on as well, to
  whatever has focus, so a control in the trigger, such as a `Dropdown`, still gets its own Escape.
  Inside a `Popover` or `Modal`, one Escape hides the tooltip and closes that too, since a tooltip
  only adds to what's there.
- **Hoverable:** the pointer can move from the trigger onto a shown tooltip, straight across the gap
  between them, and it stays. A hidden tooltip, or one only `active` shows, lets the pointer through
  to whatever is under it.
- **Persistent:** no timer hides a tooltip that's hovered or focused.

And around it:

- Keyboard focus on the trigger shows the tooltip, as hover does. Focus that a click or a tap brings
  doesn't, and neither does a touch pointer, so tapping the trigger just does what the trigger does.
  `openOnTap` shows it with a tap, for a trigger with no tap action of its own.
- An `active` tooltip is always shown, whatever the pointer, focus and Escape do.
- Tooltip content has `role="tooltip"`, and `aria-hidden` while it's hidden.
- The tooltip describes its trigger. The trigger's `aria-describedby` points at it, after any ids it
  already had, so a screen reader reads the tooltip when the trigger takes focus. A hidden tooltip
  still counts as a description, so that's before any `delay` runs out. `content` is read as plain
  text.
- That takes a single element as `children`, which passes `aria-describedby` on to its DOM node, as
  native elements and bestax components do, and takes focus itself: a button, a link, or a `Span`
  with `tabIndex={0}`. Text, a fragment or several elements get no link, and a development build
  warns.
- A tooltip describes and doesn't name, so give an icon-only trigger a name of its own, such as an
  `aria-label`, as [On Icons](#on-icons) does.
- The `dashed` style provides a visual cue that more information is available.

---

## Related Components

- [Icon](../elements/icon.md) - Icon component
- [Button](../elements/button.md) - Button component
- [Popover](./popover.md) - A click-to-open panel for content people interact with
- [HoverCard](./hovercard.md) - A card that opens on hover or keyboard focus, for previews that hold links

---

## Props

<!-- bestax:generated props -->

| Prop               | Type                                                                                                     | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`            | `string`                                                                                                 | —       | The tooltip text content.                                                                                                                                                                                                                                                                                                                                                                                                  |
| `content`          | `React.ReactNode`                                                                                        | —       | Rich tooltip content (alternative to `label`), to read rather than use. Nothing in it should take focus or a click: it isn't in the Tab order while hidden, focus there isn't counted as being in the tooltip, and Escape hiding it would drop that focus. For links or buttons, use `HoverCard` or `Popover`.                                                                                                             |
| `position`         | `'top'` \| `'bottom'` \| `'left'` \| `'right'` \| `'auto'`                                               | `'top'` | Position of the tooltip. Default: 'top'.                                                                                                                                                                                                                                                                                                                                                                                   |
| `color`            | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'dark'` \| `'light'` | —       | Color variant for the tooltip.                                                                                                                                                                                                                                                                                                                                                                                             |
| `size`             | `'small'` \| `'medium'` \| `'large'`                                                                     | —       | Size of the tooltip.                                                                                                                                                                                                                                                                                                                                                                                                       |
| `active`           | `boolean`                                                                                                | `false` | Force tooltip to be always visible. Hover, focus and Escape leave it shown, so Escape goes on to whatever has focus, or to a `Modal` or `Popover` around it.                                                                                                                                                                                                                                                               |
| `multiline`        | `boolean`                                                                                                | `false` | Allow tooltip to wrap to multiple lines.                                                                                                                                                                                                                                                                                                                                                                                   |
| `animated`         | `boolean`                                                                                                | `true`  | Enable fade animation. Default: true.                                                                                                                                                                                                                                                                                                                                                                                      |
| `square`           | `boolean`                                                                                                | `false` | Use square corners instead of rounded.                                                                                                                                                                                                                                                                                                                                                                                     |
| `dashed`           | `boolean`                                                                                                | `false` | Show dashed underline on trigger.                                                                                                                                                                                                                                                                                                                                                                                          |
| `delay`            | `number`                                                                                                 | `0`     | How long the pointer or keyboard focus waits on the trigger before the tooltip shows, in milliseconds.                                                                                                                                                                                                                                                                                                                     |
| `closeDelay`       | `number`                                                                                                 | `0`     | How long the tooltip stays after the pointer and focus have left the trigger and the tooltip, in milliseconds. The pointer can move from the trigger onto a shown tooltip without one, across the default gap. A theme that raises `--bulma-tooltip-arrow-size` or `--bulma-tooltip-arrow-margin` widens the gap past what the pointer can cross on its own, so give it a `closeDelay` long enough to cross the rest.      |
| `openOnTap`        | `boolean`                                                                                                | `false` | Show the tooltip with a tap on a touch screen. Touch has no hover, so without this a phone or tablet never shows it. With it, a tap on the trigger shows it at once, and it stays until another tap on the trigger or the tooltip, a tap anywhere else, or Escape. The tap still does whatever the trigger does, so turn this on only for a trigger with no tap action of its own. Mouse and pen work the same either way. |
| `tooltipClassName` | `string`                                                                                                 | —       | Additional classes for the tooltip element.                                                                                                                                                                                                                                                                                                                                                                                |
| `children`         | `React.ReactNode`                                                                                        | —       | The element that triggers the tooltip.                                                                                                                                                                                                                                                                                                                                                                                     |
| `className`        | `string`                                                                                                 | —       | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                                                                                    |
| `...`              | All standard `<span>` attributes and Bulma helper props                                                  | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                          |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Tooltip` registers these variables on its own `.tooltip` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                        | Sass Variable              | Default                            |
| ----------------------------------- | -------------------------- | ---------------------------------- |
| `--bulma-tooltip-background` ‡      | `$tooltip-background`      | `hsl(0, 0%, 21%)`                  |
| `--bulma-tooltip-color` ‡           | `$tooltip-color`           | `white`                            |
| `--bulma-tooltip-radius` ‡          | `$tooltip-radius`          | `var(--bulma-radius)`              |
| `--bulma-tooltip-padding` ‡         | `$tooltip-padding`         | `0.35rem 0.75rem`                  |
| `--bulma-tooltip-max-width` ‡       | `$tooltip-max-width`       | `15rem`                            |
| `--bulma-tooltip-multiline-width` ‡ | `$tooltip-multiline-width` | `15rem`                            |
| `--bulma-tooltip-arrow-size` ‡      | `$tooltip-arrow-size`      | `5px`                              |
| `--bulma-tooltip-arrow-margin` ‡    | `$tooltip-arrow-margin`    | `4px`                              |
| `--bulma-tooltip-z-index` ‡         | `$tooltip-z-index`         | `$extras-z-index-tooltip`          |
| `--bulma-tooltip-font-size` ‡       | `$tooltip-font-size`       | `calc($extras-size-normal * 0.85)` |
| `--bulma-tooltip-font-weight` ‡     | `$tooltip-font-weight`     | `$extras-weight-normal`            |
| `--bulma-tooltip-line-height` ‡     | `$tooltip-line-height`     | `1.25`                             |
| `--bulma-tooltip-dashed-color`      | `$tooltip-dashed-color`    | `hsl(0, 0%, 60%)`                  |

‡ declared on a constituent element: values set via `className`, the `style` prop, or an ancestor are only inherited and lose — target the declaring element in your CSS.

<!-- /bestax:generated cssvars -->

`--bulma-tooltip-arrow-size` and `--bulma-tooltip-arrow-margin` together set the gap between the
trigger and the tooltip. The bridge that carries the pointer across that gap is sized from their
Sass defaults, so it covers the default gap only. If you raise either variable, give the tooltip a
`closeDelay` long enough for the pointer to cross the wider gap, or it hides before the pointer
reaches it.
