---
title: ToggleButton
sidebar_label: ToggleButton
description: The `ToggleButton` component renders a button that stays pressed until it's pressed again, and says whether it's on through `aria-pressed`.
---

# ToggleButton

## Overview

<!-- bestax:generated overview -->

The `ToggleButton` component renders a button that stays pressed until it's pressed again, and says whether it's on through `aria-pressed`.

<!-- /bestax:generated overview -->

Reach for it when pressing a button turns something on and it stays on: Bold, Italic and Underline in
an editor toolbar, Mute in a player, Show archived above a list, Pin on a card. The change happens
right away, and a screen reader announces something like "Mute, toggle button, pressed". Pressed, it
fills with its color. Not pressed, it's a plain button.

It isn't a form field. A setting that's saved with a form is a [`Switch`](../form/switch.md) or a
[`Checkbox`](../form/checkbox.md).

:::tip Only one can be on?

A row where pressing one option turns the others off (left, center or right; list or grid) looks
like a set of toggles, but it behaves like radio buttons. Use [`Radios`](../form/radios.md) for
it, as [Picking One of Several](#picking-one-of-several) shows.

:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { ToggleButton } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Default ToggleButton

It holds its own state. Click it, or Tab to it and press <kbd>Enter</kbd> or <kbd>Space</kbd>.

```tsx live
<ToggleButton>Mute</ToggleButton>
```

### Starting Pressed

`defaultPressed` sets where it starts when it holds its own state.

```tsx live
<ToggleButton defaultPressed>Show archived</ToggleButton>
```

### Controlled

Pass `pressed` to hold the state yourself. A click calls `onPressedChange` with the new value and
changes nothing until you pass that value back, the way a controlled `Collapse` works.
`onPressedChange` fires without `pressed` too, so it's also how you hear about a toggle that holds
its own state. Pick `pressed` or `defaultPressed` for the button's lifetime.

```tsx live
function example() {
  const [muted, setMuted] = useState(false);

  return (
    <>
      <ToggleButton pressed={muted} onPressedChange={setMuted}>
        Mute
      </ToggleButton>
      <Paragraph mt="3">The player is {muted ? 'muted' : 'playing'}.</Paragraph>
    </>
  );
}
```

### Colors

`color` is the fill while it's pressed. It's `link` by default, the color Bulma fills its own
selected tabs and current page with. Not pressed, it's a plain button whatever the color, so the
fill is the difference people see. Of the colors on offer, a pale one such as `warning` changes
less than the default.

`white`, `light`, `dark` and `black` aren't offered. Bulma's color modifier fills the button and
drops its border, and in one theme or the other each of those four fills about as light or dark
as a plain button already is, so pressed would look like off without its border. `black` in a dark
theme even reads as pushed in rather than on.

```tsx live
<Buttons>
  <ToggleButton defaultPressed>Link</ToggleButton>
  <ToggleButton color="primary" defaultPressed>
    Primary
  </ToggleButton>
  <ToggleButton color="info" defaultPressed>
    Info
  </ToggleButton>
  <ToggleButton color="success" defaultPressed>
    Success
  </ToggleButton>
  <ToggleButton color="danger" defaultPressed>
    Danger
  </ToggleButton>
</Buttons>
```

There's no light, outlined or inverted pressed look, and no `textColor` or `bgColor`: each would
color the button in both states or turn "on" into a faint tint. To style your own pressed look,
target `[aria-pressed='true']` or `.is-selected`, which are both there while it's pressed.
`is-selected` takes the class prefix a `ConfigProvider` sets, which a hand-written class can't.

### Sizes and Shapes

`size`, `isRounded` and `isFullwidth` work in both states, the same as on `Button`, and so do the
helper props.

```tsx live
<Buttons>
  <ToggleButton size="small">Small</ToggleButton>
  <ToggleButton defaultPressed>Normal</ToggleButton>
  <ToggleButton size="medium" isRounded>
    Medium
  </ToggleButton>
  <ToggleButton size="large" isRounded defaultPressed>
    Large
  </ToggleButton>
</Buttons>
```

### Icon-Only

An icon on its own needs an `aria-label`. Keep it the same in both states, since the screen reader
already says whether it's pressed. The icon can change, as the heart fills in here, but the label
doesn't.

```tsx live
function example() {
  const [favorite, setFavorite] = useState(false);

  return (
    <ToggleButton
      aria-label="Favorite"
      color="danger"
      pressed={favorite}
      onPressedChange={setFavorite}
    >
      <Icon name="heart" variant={favorite ? 'solid' : 'regular'} />
    </ToggleButton>
  );
}
```

### A Set of Toggles

Toggles that each turn on and off on their own, like Bold, Italic and Underline, go in
`Buttons hasAddons`. Give the `Buttons` `role="group"` and an `aria-label`, so a screen reader
names the set. Each toggle keeps its own state and its own tab stop. Pressed, a toggle takes
Bulma's `is-selected`, which lifts it above its neighbours so their borders don't cut into its
fill. `ToggleButton` is also `Buttons.ToggleButton`, so the set can come from the one `Buttons`
import.

```tsx live
<Buttons hasAddons role="group" aria-label="Text style">
  <ToggleButton aria-label="Bold" defaultPressed>
    <Icon name="bold" />
  </ToggleButton>
  <ToggleButton aria-label="Italic">
    <Icon name="italic" />
  </ToggleButton>
  <ToggleButton aria-label="Underline">
    <Icon name="underline" />
  </ToggleButton>
</Buttons>
```

### Picking One of Several

A row where only one option can be on, such as text alignment or a list or grid view, isn't a set
of toggles. Pressing one turns the others off, so it behaves like radio buttons, and the
[APG toolbar example](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/examples/toolbar/) gives
its alignment buttons radio semantics for that reason. Use `Radios` for it.

```tsx live
<Radios label="View" name="view" defaultValue="list">
  <Radio value="list"> List </Radio>
  <Radio value="grid"> Grid </Radio>
</Radios>
```

### Inside a Form

It's always `type="button"`, so pressing it never submits the form around it, and it carries no
value, so the form never sees it. That suits something that changes the page and not the data,
like the help below. A setting the form should send is a `Checkbox` or a `Switch`.

```tsx live
function example() {
  const [help, setHelp] = useState(false);
  const [posted, setPosted] = useState(false);

  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        setPosted(true);
      }}
    >
      <Field label="Comment">
        <TextArea name="comment" />
      </Field>
      {help && (
        <Paragraph textSize="7" mb="3">
          Wrap a word in asterisks to make it bold.
        </Paragraph>
      )}
      <Buttons>
        <ToggleButton pressed={help} onPressedChange={setHelp}>
          Formatting help
        </ToggleButton>
        <Button type="submit" color="primary">
          Post
        </Button>
      </Buttons>
      <Paragraph>{posted ? 'Posted.' : 'Not posted yet.'}</Paragraph>
    </form>
  );
}
```

### Stopping a Toggle

Your `onClick` runs before the toggle. Call `event.preventDefault()` in it and nothing flips, and
`onPressedChange` doesn't fire, which is how you'd ask before turning something on.

```tsx live
<ToggleButton
  onClick={event => {
    const turningOn =
      event.currentTarget.getAttribute('aria-pressed') === 'false';
    if (turningOn && !window.confirm('Anyone with the link will see it.')) {
      event.preventDefault();
    }
  }}
>
  Public
</ToggleButton>
```

### Loading

`isLoading` shows Bulma's spinner in place of the label and holds the toggle where it is until you
clear it. A click, <kbd>Enter</kbd> or <kbd>Space</kbd> does nothing meanwhile, and neither
`onClick` nor `onPressedChange` fires. Set it while a change is saving, so nobody flips it again
before the last change has landed. It isn't disabled, so it keeps focus, and it carries
`aria-busy="true"` until you clear it.

```tsx live
function example() {
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  // Stands in for the request that saves the change.
  useEffect(() => {
    if (!saving) return undefined;
    const timer = setTimeout(() => setSaving(false), 1500);
    return () => clearTimeout(timer);
  }, [saving]);

  return (
    <ToggleButton
      pressed={pinned}
      isLoading={saving}
      onPressedChange={next => {
        setPinned(next);
        setSaving(true);
      }}
    >
      Pin
    </ToggleButton>
  );
}
```

### Disabled

`isDisabled` (or `disabled`) makes it a disabled button: clicks and keys don't toggle it, and
`onPressedChange` doesn't fire. A pressed one keeps its fill under Bulma's disabled look.

```tsx live
<Buttons>
  <ToggleButton isDisabled>Show archived</ToggleButton>
  <ToggleButton isDisabled defaultPressed>
    Show archived
  </ToggleButton>
</Buttons>
```

---

## Accessibility

`ToggleButton` follows the toggle button in the
[APG button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/):

- **Role and state:** it's a native `<button>` with `aria-pressed` set to `"true"` or `"false"`
  from the first render, server markup included, so it's announced as a toggle button, pressed or
  not pressed. It's never `"mixed"`.
- **Keyboard:** <kbd>Enter</kbd> and <kbd>Space</kbd> toggle it, as on any button, and focus stays
  on it.
- **Loading:** while `isLoading` is set, it carries `aria-busy="true"`, and keys hold it still the
  same as the pointer does. It keeps focus, since it isn't disabled.
- **The label stays put:** APG says "it is critical the label on a toggle does not change when its
  state changes." Mute stays "Mute". An icon can change, but the `aria-label` doesn't. A label that
  changes, "Play" and then "Pause", belongs on a plain `Button` with no `aria-pressed`. Nothing can
  check this at runtime, so it's yours to keep.
- **Icon-only toggles** need an `aria-label`, as on `Button`.
- **On is easy to see:** the default `link` fill turns a light button solid blue, and a dark one
  bright in dark mode, so it's a change in lightness and not only in hue. `color` leaves out the
  fills that wouldn't be: `white`, `light`, `dark` and `black` each match a plain button's
  lightness in one theme or the other. That's also why the pressed look isn't
  `Button`'s `isActive` shade:
  [WCAG's own example](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) of a
  button marked only by a darker shade of its color "would not pass Use of color".
- **A set has a name:** give the `Buttons` around a set of toggles `role="group"` and an
  `aria-label`.
- **One choice from several** is a radio group, not a set of toggles, so it's `Radios`.

---

## Related Components

- [`Button`](./button.md): A plain button. Its `isActive` is a visual state only, with no
  `aria-pressed`.
- [`Buttons`](./buttons.md): Groups toggles, and `hasAddons` joins them into one row.
- [`Switch`](../form/switch.md): An on or off setting that's saved with a form.
- [`Checkbox`](../form/checkbox.md): A form value that's checked or not.
- [`Radios`](../form/radios.md): One choice from several.
- [`Icon`](./icon.md): The icon in an icon-only toggle.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, display, etc.

---

## Additional Resources

- [WAI-ARIA APG: Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
- [WAI-ARIA APG: Toolbar Example](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/examples/toolbar/)
- [MDN: aria-pressed](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-pressed)
- [Bulma Button Documentation](https://bulma.io/documentation/elements/button/)
- [Storybook: ToggleButton Stories](https://bestax.io/storybook/?path=/story/elements-togglebutton--default)

---

## Props

<!-- bestax:generated props -->

| Prop              | Type                                                                            | Default  | Description                                                                                                                                                                                                                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pressed`         | `boolean`                                                                       | —        | Whether it's pressed, when you hold the state. Setting it makes the toggle controlled: a click only calls `onPressedChange`, and nothing changes until you pass the new value. Pick this or `defaultPressed` for the button's lifetime.                                                                                                       |
| `defaultPressed`  | `boolean`                                                                       | `false`  | Whether it starts pressed, when it holds its own state.                                                                                                                                                                                                                                                                                       |
| `onPressedChange` | `(pressed: boolean) => void`                                                    | —        | Called with the new state each time it's toggled, by a click, Enter or Space, whether or not `pressed` is set. An `onClick` that calls `preventDefault()` stops the toggle, and this doesn't fire.                                                                                                                                            |
| `color`           | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | `'link'` | The fill while it's pressed. Not pressed, it's a plain button, so the fill is the difference people see. `white`, `light`, `dark` and `black` aren't offered, since in one theme or the other each fills about as light or dark as a plain button already is. Of the rest, a pale one such as `warning` changes less than the default `link`. |
| `children`        | `React.ReactNode`                                                               | —        | The label, which stays the same in both states: a screen reader announces whether it's pressed, so "Mute" stays "Mute". An icon can swap, but an icon-only toggle needs an `aria-label` that doesn't. A label that changes ("Play", then "Pause") belongs on a plain `Button`.                                                                |
| `size`            | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                              | —        | Size of the button.                                                                                                                                                                                                                                                                                                                           |
| `isRounded`       | `boolean`                                                                       | `false`  | Makes the button rounded.                                                                                                                                                                                                                                                                                                                     |
| `isLoading`       | `boolean`                                                                       | `false`  | Displays a loading spinner. Under `prefers-reduced-motion: reduce` the spinner stops and stays drawn (with bestax's CSS loaded).                                                                                                                                                                                                              |
| `isFullwidth`     | `boolean`                                                                       | `false`  | Makes the button full-width.                                                                                                                                                                                                                                                                                                                  |
| `isFullWidth`     | `boolean`                                                                       | `false`  | **Deprecated.** Use `isFullwidth` instead — `isFullwidth` wins if both are set. Makes the button full-width.                                                                                                                                                                                                                                  |
| `isFocused`       | `boolean`                                                                       | `false`  | Applies focused styling (visual only).                                                                                                                                                                                                                                                                                                        |
| `isHovered`       | `boolean`                                                                       | `false`  | Applies hovered styling (visual only).                                                                                                                                                                                                                                                                                                        |
| `isDisabled`      | `boolean`                                                                       | `false`  | Applies disabled styling.                                                                                                                                                                                                                                                                                                                     |
| `className`       | `string`                                                                        | —        | Custom class name.                                                                                                                                                                                                                                                                                                                            |
| `ref`             | `React.Ref<HTMLButtonElement>`                                                  | —        | Ref forwarded to the `<button>`.                                                                                                                                                                                                                                                                                                              |
| `...`             | All standard `<button>` attributes and Bulma helper props                       | —        | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                             |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`ToggleButton` registers these variables on its own `.button` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                 | Sass Variable                         | Default                                                                               |
| -------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------- |
| `--bulma-button-family`                      | `$button-family`                      | `false`                                                                               |
| `--bulma-button-weight`                      | `$button-weight`                      | `var(--bulma-weight-medium)`                                                          |
| `--bulma-button-border-color`                | `$button-border-color`                | `var(--bulma-border)`                                                                 |
| `--bulma-button-border-style`                | `$button-border-style`                | `solid`                                                                               |
| `--bulma-button-border-width`                | `$button-border-width`                | `var(--bulma-control-border-width)`                                                   |
| `--bulma-button-padding-vertical`            | `$button-padding-vertical`            | `0.5em`                                                                               |
| `--bulma-button-padding-horizontal`          | `$button-padding-horizontal`          | `1em`                                                                                 |
| `--bulma-button-focus-border-color`          | `$button-focus-border-color`          | `var(--bulma-link-focus-border)`                                                      |
| `--bulma-button-focus-box-shadow-size`       | `$button-focus-box-shadow-size`       | `0 0 0 0.125em`                                                                       |
| `--bulma-button-focus-box-shadow-color`      | `$button-focus-box-shadow-color`      | `hsla(var(--bulma-link-h), var(--bulma-link-s), var(--bulma-link-on-scheme-l), 0.25)` |
| `--bulma-button-active-color`                | `$button-active-color`                | `var(--bulma-link-active)`                                                            |
| `--bulma-button-active-border-color`         | `$button-active-border-color`         | `var(--bulma-link-active-border)`                                                     |
| `--bulma-button-text-color`                  | `$button-text-color`                  | `var(--bulma-text)`                                                                   |
| `--bulma-button-text-decoration`             | `$button-text-decoration`             | `underline`                                                                           |
| `--bulma-button-text-hover-background-color` | `$button-text-hover-background-color` | `var(--bulma-background)`                                                             |
| `--bulma-button-text-hover-color`            | `$button-text-hover-color`            | `var(--bulma-text-strong)`                                                            |
| `--bulma-button-ghost-background`            | `$button-ghost-background`            | `none`                                                                                |
| `--bulma-button-ghost-border-color`          | `$button-ghost-border-color`          | `transparent`                                                                         |
| `--bulma-button-ghost-color`                 | `$button-ghost-color`                 | `var(--bulma-link-text)`                                                              |
| `--bulma-button-ghost-decoration`            | `$button-ghost-decoration`            | `none`                                                                                |
| `--bulma-button-ghost-hover-color`           | `$button-ghost-hover-color`           | `var(--bulma-link)`                                                                   |
| `--bulma-button-ghost-hover-decoration`      | `$button-ghost-hover-decoration`      | `underline`                                                                           |
| `--bulma-button-disabled-background-color`   | `$button-disabled-background-color`   | `var(--bulma-scheme-main)`                                                            |
| `--bulma-button-disabled-border-color`       | `$button-disabled-border-color`       | `var(--bulma-border)`                                                                 |
| `--bulma-button-disabled-shadow`             | `$button-disabled-shadow`             | `none`                                                                                |
| `--bulma-button-disabled-opacity`            | `$button-disabled-opacity`            | `0.5`                                                                                 |
| `--bulma-button-static-color`                | `$button-static-color`                | `var(--bulma-text-weak)`                                                              |
| `--bulma-button-static-background-color`     | `$button-static-background-color`     | `var(--bulma-scheme-main-ter)`                                                        |
| `--bulma-button-static-border-color`         | `$button-static-border-color`         | `var(--bulma-border)`                                                                 |
| `--bulma-button-h`                           | `$button-h`                           | `var(--bulma-scheme-h)`                                                               |
| `--bulma-button-s`                           | `$button-s`                           | `var(--bulma-scheme-s)`                                                               |
| `--bulma-button-l`                           | `$button-l`                           | `var(--bulma-scheme-main-l)`                                                          |
| `--bulma-button-background-l`                | `$button-background-l`                | `var(--bulma-scheme-main-l)`                                                          |
| `--bulma-button-background-l-delta`          | `$button-background-l-delta`          | `0%`                                                                                  |
| `--bulma-button-hover-background-l-delta`    | `$button-hover-background-l-delta`    | `var(--bulma-hover-background-l-delta)`                                               |
| `--bulma-button-active-background-l-delta`   | `$button-active-background-l-delta`   | `var(--bulma-active-background-l-delta)`                                              |
| `--bulma-button-color-l`                     | `$button-color-l`                     | `var(--bulma-text-strong-l)`                                                          |
| `--bulma-button-border-l`                    | `$button-border-l`                    | `var(--bulma-border-l)`                                                               |
| `--bulma-button-border-l-delta`              | `$button-border-l-delta`              | `0%`                                                                                  |
| `--bulma-button-hover-border-l-delta`        | `$button-hover-border-l-delta`        | `var(--bulma-hover-border-l-delta)`                                                   |
| `--bulma-button-active-border-l-delta`       | `$button-active-border-l-delta`       | `var(--bulma-active-border-l-delta)`                                                  |
| `--bulma-button-focus-border-l-delta`        | `$button-focus-border-l-delta`        | `var(--bulma-focus-border-l-delta)`                                                   |
| `--bulma-button-outer-shadow-h`              | `$button-outer-shadow-h`              | `0`                                                                                   |
| `--bulma-button-outer-shadow-s`              | `$button-outer-shadow-s`              | `0%`                                                                                  |
| `--bulma-button-outer-shadow-l`              | `$button-outer-shadow-l`              | `20%`                                                                                 |
| `--bulma-button-outer-shadow-a`              | `$button-outer-shadow-a`              | `0.05`                                                                                |
| `--bulma-loading-color`                      | —                                     | `hsl(var(--bulma-button-h), var(--bulma-button-s), var(--bulma-button-color-l))`      |

<!-- /bestax:generated cssvars -->
