---
title: HoverCard
sidebar_label: HoverCard
description: The `HoverCard` component shows a card previewing what's behind a link or a button while the pointer rests on it or keyboard focus is on it.
---

# HoverCard

## Overview

<!-- bestax:generated overview -->

The `HoverCard` component shows a card previewing what's behind a link or a button while the pointer rests on it or keyboard focus is on it.

<!-- /bestax:generated overview -->

Reach for it when a link or a button has something worth previewing: a person's avatar and team on
a username, a summary on a link to a repository, a definition on a glossary term. It's a preview,
not a destination, so everything in it should also be one click away wherever the trigger goes.
`Tooltip` is for a short text hint with nothing to click, and `Popover` is for content people open
on purpose and work with, such as a form.

:::note On phones and tablets

By default a touch screen never opens a `HoverCard`: there's no hover, and a tap belongs to the
trigger. Whatever the card shows has to be reachable from the trigger as well. For a trigger with
no tap action of its own, `openOnTap` opens the card with a tap, as
[On Touch Screens](#on-touch-screens) shows.

:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { HoverCard } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic HoverCard

Pass the link or button the card previews as `trigger` and the card's content as children. Hover
the trigger, or Tab to it, and the card opens after a short delay. The pointer can move onto the
card to use its links, and <kbd>Escape</kbd> closes it.

```tsx live
<HoverCard trigger={<Link href="#ada">Ada Lovelace</Link>}>
  <Media>
    <Media.Left>
      <Avatar name="Ada Lovelace" size="48x48" />
    </Media.Left>
    <Media.Content>
      <Title as="p" size="6">
        Ada Lovelace
      </Title>
      <SubTitle as="p" size="6">
        Analytical Engine team
      </SubTitle>
      <Link href="#profile">View profile</Link>
    </Media.Content>
  </Media>
</HoverCard>
```

### In Running Text

A trigger in a sentence takes `appendToBody`. The card's content is block-level and a `<p>` can't
hold it, so the card renders at the end of the page through [`Portal`](../helpers/portal.md)
instead, fixed to the viewport next to the trigger. That also keeps an ancestor's `overflow` from
clipping it. With server rendering, it shows from the first render after hydration.

```tsx
<Paragraph>
  Reviewed by{' '}
  <HoverCard appendToBody trigger={<Link href="#ada">Ada Lovelace</Link>}>
    <Title as="p" size="6">
      Ada Lovelace
    </Title>
    <SubTitle as="p" size="6">
      Analytical Engine team
    </SubTitle>
    <Link href="#profile">View profile</Link>
  </HoverCard>{' '}
  and merged the same day.
</Paragraph>
```

### Placement

`position` picks the corner the card opens from: below or above the trigger, lined up with its left
or right edge. `auto` picks the one that keeps the card in the viewport, preferring below and on
the left.

```tsx live
<Buttons>
  <HoverCard
    openOnTap
    position="bottom-left"
    trigger={<Button>bottom-left</Button>}
  >
    <Paragraph>Opens below, on the left edge.</Paragraph>
  </HoverCard>
  <HoverCard
    openOnTap
    position="bottom-right"
    trigger={<Button>bottom-right</Button>}
  >
    <Paragraph>Opens below, on the right edge.</Paragraph>
  </HoverCard>
  <HoverCard
    openOnTap
    position="auto"
    trigger={<Button color="info">auto</Button>}
  >
    <Paragraph>Opens wherever it fits.</Paragraph>
  </HoverCard>
</Buttons>
```

### Delays

`openDelay` is how long the pointer or keyboard focus rests on the trigger before the card opens,
so a pointer passing over it on the way somewhere else opens nothing. `closeDelay` is how long the
card stays once the pointer and focus have both left, and it's also the time the pointer has to
cross the gap onto the card. At `0` the card closes as the pointer leaves the trigger, before the
pointer can reach it.

```tsx live
<Buttons>
  <HoverCard openOnTap openDelay={0} trigger={<Button>Opens at once</Button>}>
    <Paragraph>No wait before this one.</Paragraph>
  </HoverCard>
  <HoverCard
    openOnTap
    openDelay={1000}
    closeDelay={600}
    trigger={<Button>Takes its time</Button>}
  >
    <Paragraph>A slower card, with longer to reach it.</Paragraph>
  </HoverCard>
</Buttons>
```

### On Touch Screens

A touch screen has no hover, so a phone or tablet never opens the card unless you pass `openOnTap`.
With it, a tap on the trigger opens the card at once, and the card stays until another tap on the
trigger, a tap outside it, or <kbd>Escape</kbd>. The tap still does whatever the trigger does, so
turn it on only for a trigger with no tap action of its own, like the `Button` below, which has no
`onClick`. On a link, the first tap would follow the link rather than show the card. Mouse and pen
work the same either way.

The examples on this page with a `Button` trigger turn it on, so they open on a phone too. The ones
with a link leave it off: a tap on a link should take you where it goes, and that page is where
the preview's content lives anyway.

```tsx live
<HoverCard openOnTap trigger={<Button>Engine team</Button>}>
  <Title as="p" size="6">
    Analytical Engine team
  </Title>
  <Paragraph mb="2">Ada Lovelace and Charles Babbage</Paragraph>
  <Link href="#team">View the team</Link>
</HoverCard>
```

### Controlled

Pass `open` to hold the state yourself. `onOpenChange` reports when a delay runs out and when
<kbd>Escape</kbd> is pressed, so wiring it to your setter keeps hover, focus and Escape working,
and an action inside the card can close it. When the card closes with focus inside it, focus goes
back to the trigger. While the card is open, <kbd>Escape</kbd> is reported, and when focus is in
the card, on its trigger or nowhere, the key stops at the card even if you keep it open, so a
`Modal` around it doesn't close from the keyboard until the card does.

```tsx live
function example() {
  const [open, setOpen] = useState(false);
  const [following, setFollowing] = useState(false);

  return (
    <>
      <Paragraph mb="3">
        The card is {open ? 'open' : 'closed'}
        {following ? ', and you follow Ada' : ''}.
      </Paragraph>
      <HoverCard
        open={open}
        onOpenChange={setOpen}
        trigger={<Link href="#ada">Ada Lovelace</Link>}
      >
        <Paragraph mb="3">Analytical Engine team</Paragraph>
        <Button
          size="small"
          color="primary"
          onClick={() => {
            setFollowing(true);
            setOpen(false);
          }}
        >
          Follow
        </Button>
      </HoverCard>
    </>
  );
}
```

---

## Accessibility

`HoverCard` is built to
[WCAG's Content on Hover or Focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)
criterion, condition by condition:

- **Dismissible:** <kbd>Escape</kbd> closes the card wherever focus is, without you moving the
  pointer or focus. In controlled use it asks to close through `onOpenChange`, so the card closes
  when you set `open` to `false`. The keypress belongs to whatever has focus. When that's the card,
  its trigger or nothing, the card takes it, so a `Popover` or `Modal` around it stays open. When
  it's something else, such as a field elsewhere on the page or a `Modal` opened from the card, the
  card still closes and the key goes on to it. With one card inside another, the inner one closes
  first. Focus that was in the card goes back to the trigger, and the card stays closed until the
  pointer or focus leaves and comes back, or, with `openOnTap`, until the next tap on the trigger.
- **Hoverable:** the pointer can move from the trigger onto the card. `closeDelay` covers the gap
  between them, and the card takes pointer events.
- **Persistent:** no timer closes a card that's hovered or focused. Focus inside the card holds it
  however it got there. Whether a click focuses what it lands on is up to the browser, though:
  Safari and Firefox on macOS don't focus a button on click, so there a clicked button doesn't keep
  the card open once the pointer moves away.

And around it:

- Keyboard focus on the trigger opens the card, as hover does. Focus that a press brings doesn't,
  and neither does a touch pointer, so tapping the trigger on a phone just does what the trigger
  does. Clicking the trigger never toggles the card.
- By default, then, a phone or tablet never opens the card, so whatever it shows has to be
  reachable from the trigger as well. `openOnTap` opens it with a tap, for a trigger with no tap
  action of its own. While a tap holds it open, a tap outside the trigger and the card closes it.
- The trigger gets `aria-expanded` and `aria-controls`, which say it's expanded and name the card
  only while the card is on the page. It gets no role, no tab stop and no `aria-haspopup`, so the trigger element itself has to
  take focus, such as a link or a button. A link inside a `<span>` doesn't do, since focus comes
  back to the trigger and its ARIA is on it. A development build warns when the trigger can't take
  focus.
- The card is a plain element with an `id` and no role. It isn't a dialog, since focus doesn't move
  into it, and it isn't a tooltip, since it can hold links. In place, a screen reader meets it
  right after the trigger, Tab goes from the trigger into its links and buttons, and tabbing past
  them closes it.
- With `appendToBody` the card renders at the end of `<body>`, so it sits last in the Tab order.
  Tab reaches it only after the rest of the page, and focus leaving the trigger on the way closes
  it. Keyboard users can open it, read it and close it, so whatever it links to should be
  reachable from the page as well.
- Opening the card moves no focus, and nothing traps it. Links and buttons belong in a card; a form
  belongs in a `Popover`, which opens on purpose and holds focus.
- The fade-in is turned off under `prefers-reduced-motion: reduce`.

---

## Related Components

- [`Popover`](./popover.md): A panel opened with a click, for content people work with, such as a
  form.
- [`Tooltip`](./tooltip.md): A short text hint on hover and focus, with nothing to click in it.
- [`Media`](../layout/media.md): An avatar next to text, as in the profile preview above.
- [`Portal`](../helpers/portal.md): What `appendToBody` renders through.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [WCAG Understanding: Content on Hover or Focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)
- [Storybook: HoverCard Stories](https://bestax.io/storybook/?path=/story/components-hovercard--default)

---

## Props

<!-- bestax:generated props -->

| Prop               | Type                                                                             | Default         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `trigger`          | `React.ReactElement`                                                             | —               | The element the card previews, such as a link or a `Button`. The element itself has to take focus, so keyboard users can open the card too: a link inside a `<span>` doesn't do, since focus comes back to the trigger and its ARIA is on it. HoverCard gives it no role and no tab stop, since it can't know what the element is, and a development build warns when it can't take focus: use a link or a button, or give the element `tabIndex={0}`. A disabled button can't take focus either. HoverCard adds `aria-expanded` and `aria-controls`, both naming the card only while it is on the page, so it has to be a single element that passes those to its DOM node. Its own click and keys stay its own, and the card doesn't toggle on them, except Escape while the card is open, which closes the card before the trigger sees it.                             |
| `children`         | `React.ReactNode`                                                                | —               | The card's content: a preview whose links and buttons are fine, but not a form, which belongs in a `Popover`. The card pads itself, so content goes straight in.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `open`             | `boolean`                                                                        | —               | Controlled open state. When set, hover, focus and Escape only report through `onOpenChange`, so an action inside the card can close it. While the card is open, Escape is reported, and when focus is in the card, on its trigger or nowhere, the key stops there even if you keep the card open, so a `Modal` around it doesn't close from the keyboard until the card does.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `defaultOpen`      | `boolean`                                                                        | `false`         | Initial open state when uncontrolled. A card that starts open stays open until the pointer or focus has been and gone, or Escape closes it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `onOpenChange`     | `(open: boolean) => void`                                                        | —               | Called with the state asked for: when `openDelay` or `closeDelay` runs out, and right away on Escape. Fires in both controlled and uncontrolled use. An Escape it reports stops at the card when focus is in the card, on its trigger or nowhere, so nothing around it sees that key. With focus anywhere else, the card still closes and the key goes on to whatever has focus.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `openDelay`        | `number`                                                                         | `600`           | How long the pointer or keyboard focus waits on the trigger before the card opens, in milliseconds.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `closeDelay`       | `number`                                                                         | `300`           | How long the card stays after the pointer and focus have left the trigger and the card, in milliseconds. It is the time the pointer has to cross the gap between the trigger and the card: with `0` the card closes as the pointer leaves the trigger, before the pointer can reach it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `position`         | `'bottom-left'` \| `'bottom-right'` \| `'top-left'` \| `'top-right'` \| `'auto'` | `'bottom-left'` | Where the card opens against the trigger.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `appendToBody`     | `boolean`                                                                        | `false`         | Render the card at the end of `document.body` through `Portal`, fixed to the viewport, so an ancestor's `overflow`, `transform` or stacking context can't clip it. A trigger in running text needs it too, since the card's block content can't sit inside a `<p>`. The card then shows from the commit after hydration, never in server markup, and it sits last in the Tab order, at the end of `<body>`. Tab reaches it only after the rest of the page, and focus leaving the trigger on the way closes it, so keyboard users can open it, read it and close it with Escape, and whatever it links to has to be reachable from the page as well. It is measured against the trigger when it opens and on resize and scroll, so it doesn't follow content that changes size while it is open. Theming variables set on an ancestor of the trigger don't reach it there. |
| `openOnTap`        | `boolean`                                                                        | `false`         | Open the card with a tap on a touch screen. Touch has no hover, so without this a phone or tablet never opens the card. With it, a tap on the trigger opens the card at once, and it stays until a second tap on the trigger, a tap outside the trigger and the card, or Escape. The tap still does whatever the trigger does, so turn this on only for a trigger with no tap action of its own, such as a `Button` with no `onClick`: on a link, the first tap would follow the link rather than show the card. Mouse and pen work the same either way.                                                                                                                                                                                                                                                                                                                   |
| `contentClassName` | `string`                                                                         | —               | Additional classes for the card (`.hover-card-content`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `className`        | `string`                                                                         | —               | Additional classes for the `span` around the trigger. The card takes `contentClassName`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `...`              | All standard `<span>` attributes and Bulma helper props                          | —               | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`HoverCard` registers these variables on its constituent elements, where the themed declarations live. A value set via `className`, the `style` prop, or any ancestor is only inherited and loses to the element's own declaration — override by targeting the declaring element in your CSS. See [Theme](../helpers/theme.md).

| CSS Variable                            | Sass Variable                    | Default                          |
| --------------------------------------- | -------------------------------- | -------------------------------- |
| `--bulma-hover-card-z-index`            | `$hover-card-z-index`            | `$extras-z-index-tooltip`        |
| `--bulma-hover-card-background`         | `$hover-card-background`         | `var(--bulma-scheme-main)`       |
| `--bulma-hover-card-color`              | `$hover-card-color`              | `var(--bulma-text)`              |
| `--bulma-hover-card-border-color`       | `$hover-card-border-color`       | `var(--bulma-border-weak)`       |
| `--bulma-hover-card-radius`             | `$hover-card-radius`             | `var(--bulma-radius-large)`      |
| `--bulma-hover-card-shadow`             | `$hover-card-shadow`             | `var(--bulma-shadow)`            |
| `--bulma-hover-card-padding`            | `$hover-card-padding`            | `1rem`                           |
| `--bulma-hover-card-min-width`          | `$hover-card-min-width`          | `12rem`                          |
| `--bulma-hover-card-max-width`          | `$hover-card-max-width`          | `min(20rem, calc(100vw - 2rem))` |
| `--bulma-hover-card-offset`             | `$hover-card-offset`             | `0.25rem`                        |
| `--bulma-hover-card-animation-duration` | `$hover-card-animation-duration` | `0.15s`                          |

<!-- /bestax:generated cssvars -->
