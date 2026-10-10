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
  <HoverCard position="bottom-left" trigger={<Button>bottom-left</Button>}>
    <Paragraph>Opens below, on the left edge.</Paragraph>
  </HoverCard>
  <HoverCard position="bottom-right" trigger={<Button>bottom-right</Button>}>
    <Paragraph>Opens below, on the right edge.</Paragraph>
  </HoverCard>
  <HoverCard position="auto" trigger={<Button color="info">auto</Button>}>
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
  <HoverCard openDelay={0} trigger={<Button>Opens at once</Button>}>
    <Paragraph>No wait before this one.</Paragraph>
  </HoverCard>
  <HoverCard
    openDelay={1000}
    closeDelay={600}
    trigger={<Button>Takes its time</Button>}
  >
    <Paragraph>A slower card, with longer to reach it.</Paragraph>
  </HoverCard>
</Buttons>
```

### Controlled

Pass `open` to hold the state yourself. `onOpenChange` reports when a delay runs out and when
<kbd>Escape</kbd> is pressed, so wiring it to your setter keeps hover, focus and Escape working,
and an action inside the card can close it. When the card closes with focus inside it, focus goes
back to the trigger.

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

- **Dismissible:** <kbd>Escape</kbd> closes the card wherever focus is, without moving the pointer
  or focus. A `Popover` or `Modal` around it stays open, because the card takes that keypress.
  Focus that was in the card goes back to the trigger, and the card stays closed until the pointer
  or focus leaves and comes back.
- **Hoverable:** the pointer can move from the trigger onto the card. `closeDelay` covers the gap
  between them, and the card takes pointer events, unlike a tooltip.
- **Persistent:** no timer closes a card that's hovered or focused. Focus inside the card holds it
  however it got there, so a button clicked in the card stays put when the pointer moves away.

And around it:

- Keyboard focus on the trigger opens the card, as hover does. Focus that a press brings doesn't,
  and neither does a touch pointer, so tapping the trigger on a phone just does what the trigger
  does. Clicking the trigger never toggles the card.
- The trigger gets `aria-expanded`, and `aria-controls` naming the card while the card is on the
  page. It gets no role, no tab stop and no `aria-haspopup`, so use a trigger that takes focus on
  its own, such as a link or a button. A development build warns when Tab can't reach the trigger.
- The card is a plain element with an `id` and no role. It isn't a dialog, since focus doesn't move
  into it, and it isn't a tooltip, since it can hold links. In place, a screen reader meets it
  right after the trigger, Tab goes from the trigger into its links and buttons, and tabbing past
  them closes it.
- With `appendToBody` the card renders at the end of the page, outside the Tab order. Keyboard
  users can open it, read it and close it, but they can't Tab into it, so whatever it links to
  should be reachable from the page as well.
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

| Prop               | Type                                                                             | Default         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `trigger`          | `React.ReactElement`                                                             | —               | The element the card previews, such as a link or a `Button`. Tab has to reach it, so keyboard users can open the card too. HoverCard gives it no role and no tab stop, since it can't know what the element is, and a development build warns when Tab can't reach it or anything inside it: use a link or a button, or give the element `tabIndex={0}`. A disabled button can't take focus either. HoverCard adds `aria-expanded`, and `aria-controls` naming the card while the card is on the page, so it has to be a single element that passes those to its DOM node. Its own click and keys stay its own; the card doesn't toggle on them.                                                                                                               |
| `children`         | `React.ReactNode`                                                                | —               | The card's content: a preview whose links and buttons are fine, but not a form, which belongs in a `Popover`. The card pads itself, so content goes straight in.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `open`             | `boolean`                                                                        | —               | Controlled open state. When set, hover, focus and Escape only report through `onOpenChange`, so an action inside the card can close it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `defaultOpen`      | `boolean`                                                                        | `false`         | Initial open state when uncontrolled. A card that starts open stays open until the pointer or focus has been and gone, or Escape closes it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `onOpenChange`     | `(open: boolean) => void`                                                        | —               | Called with the state asked for: when `openDelay` or `closeDelay` runs out, and right away on Escape. Fires in both controlled and uncontrolled use.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `openDelay`        | `number`                                                                         | `600`           | How long the pointer or keyboard focus waits on the trigger before the card opens, in milliseconds.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `closeDelay`       | `number`                                                                         | `300`           | How long the card stays after the pointer and focus have left the trigger and the card, in milliseconds. It is the time the pointer has to cross the gap between the trigger and the card: with `0` the card closes as the pointer leaves the trigger, before the pointer can reach it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `position`         | `'bottom-left'` \| `'bottom-right'` \| `'top-left'` \| `'top-right'` \| `'auto'` | `'bottom-left'` | Where the card opens against the trigger.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `appendToBody`     | `boolean`                                                                        | `false`         | Render the card at the end of `document.body` through `Portal`, fixed to the viewport, so an ancestor's `overflow`, `transform` or stacking context can't clip it. A trigger in running text needs it too, since the card's block content can't sit inside a `<p>`. The card then shows from the commit after hydration, never in server markup, and it is out of the Tab order: keyboard users can open it, read it and close it with Escape, but can't Tab into it, so whatever it links to has to be reachable from the page as well. It is measured against the trigger when it opens and on resize and scroll, so it doesn't follow content that changes size while it is open. Theming variables set on an ancestor of the trigger don't reach it there. |
| `contentClassName` | `string`                                                                         | —               | Additional classes for the card (`.hover-card-content`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `className`        | `string`                                                                         | —               | Additional classes for the `span` around the trigger. The card takes `contentClassName`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `...`              | All standard `<span>` attributes and Bulma helper props                          | —               | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

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
