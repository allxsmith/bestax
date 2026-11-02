---
title: Affix
sidebar_label: Affix
description: The `Affix` component keeps its content fixed to a corner of the viewport while the page scrolls under it.
---

# Affix

## Overview

<!-- bestax:generated overview -->

The `Affix` component keeps its content fixed to a corner of the viewport while the page scrolls under it.

<!-- /bestax:generated overview -->

Reach for it for anything that stays in a corner of the screen: a floating action button, a chat or
help launcher, a "Feedback" tab, or a consent notice pinned to the bottom of the page. It's a `<div>`
with `position: fixed`, a short distance in from its corner's edges, and it keeps clear of a phone's
home indicator and rounded corners on a page that asks for the whole screen.

It's the Affix Mantine has, fixed to a corner. Ant Design's Affix is the other meaning, an element
that pins itself once the page scrolls past it, and `position: sticky` does that on its own: see
[Pinned on Scroll](#pinned-on-scroll).

:::info
Bulma has no fixed corner, so `Affix` brings its own styles, in `bestax.css` and its variants, or in
`extras.css` next to your own Bulma.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Affix } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Put what should stay in the corner inside it. It's fixed to the browser window, not to this
example, so show it and look at the bottom-right corner of the page.

```tsx live
function example() {
  const [shown, setShown] = useState(false);
  return (
    <>
      <Button onClick={() => setShown(!shown)}>
        {shown ? 'Hide the Help button' : 'Show the Help button'}
      </Button>
      {shown && (
        <Affix>
          <Button color="primary">Help</Button>
        </Affix>
      )}
    </>
  );
}
```

### Corners

`position` picks the corner, with the same four values as Badge's: `'bottom-right'` (the default),
`'bottom-left'`, `'top-right'` and `'top-left'`. The top corners here also take `mt="6"` to clear
this site's header, as they would a fixed navbar of yours.

```tsx live
import type { AffixPosition } from '@allxsmith/bestax-bulma';

function example() {
  const [position, setPosition] = useState<AffixPosition | null>(null);
  const corners: AffixPosition[] = [
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
  ];
  return (
    <>
      <Buttons>
        {corners.map(corner => (
          <Button key={corner} onClick={() => setPosition(corner)}>
            {corner}
          </Button>
        ))}
        <Button disabled={!position} onClick={() => setPosition(null)}>
          Hide
        </Button>
      </Buttons>
      {position && (
        <Affix
          position={position}
          mt={position.startsWith('top') ? '6' : undefined}
        >
          <Button color="primary">Feedback</Button>
        </Affix>
      )}
    </>
  );
}
```

### Nudging One Affix

The spacing helper props move a single Affix further from its corner, since a margin pushes a fixed
box off its edge. `mb="6"` lifts a bottom corner above a bar along the bottom of the page.

```tsx live
function example() {
  const [shown, setShown] = useState(false);
  return (
    <>
      <Button onClick={() => setShown(!shown)}>
        {shown ? 'Hide the chat button' : 'Show the chat button'}
      </Button>
      {shown && (
        <Affix mb="6">
          <Button color="link" radius="rounded" aria-label="Open chat">
            <Icon name="comments" />
          </Button>
        </Affix>
      )}
    </>
  );
}
```

### Offsets and the Safe Area

Every Affix sits `--bulma-affix-offset-vertical` from its top or bottom edge and
`--bulma-affix-offset-horizontal` from its side, both Bulma's block spacing to start with, so a theme
that changes the spacing moves them too. Set the variables on the `.affix` class (`.bestax-affix`
under a class prefix) to move every Affix, since each one declares its own values:

```css
.affix {
  --bulma-affix-offset-vertical: 2rem;
  --bulma-affix-offset-horizontal: 2rem;
}
```

To move one Affix, set them in its `style`, or give it a class of your own:

```tsx
<Affix className="above-the-tab-bar">
  <Button color="primary">Help</Button>
</Affix>
```

```css
.affix.above-the-tab-bar {
  --bulma-affix-offset-vertical: 5rem;
}
```

Each edge also adds the device's safe-area inset for that edge, so on a phone it stays clear of the
home indicator and the rounded corners. The insets are 0 unless the page asks for the whole screen
with `viewport-fit=cover`, so they change nothing elsewhere:

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, viewport-fit=cover"
/>
```

### Out of a Transformed Ancestor

A `position: fixed` box is fixed to the viewport unless an ancestor has a `transform`, `filter`,
`backdrop-filter`, `perspective`, `will-change: transform`, or a `contain` that includes `paint` or
`layout`. Then it's fixed to that ancestor instead, and scrolls away with it. `portal` takes it out,
as Modal's prop of the same name does: `true` renders it at the end of `document.body`, or in the
`portalContainer` a `ConfigProvider` sets, and a selector or an element puts it there instead.

```tsx live
function example() {
  const [shown, setShown] = useState(false);
  return (
    <>
      <Button onClick={() => setShown(!shown)}>
        {shown ? 'Hide the portaled button' : 'Show the portaled button'}
      </Button>
      {shown && (
        <Affix portal position="bottom-left">
          <Button color="primary">Feedback</Button>
        </Affix>
      )}
    </>
  );
}
```

With `portal` it renders in place on the server and while hydrating, and moves into the portal once
the client takes over, so the server markup matches. Moving remounts what's inside it.

### Several Things in One Corner

Two Affixes in the same corner sit on top of each other, since each is fixed to the same spot. Put
the things that share a corner in one Affix and lay them out with the helper props.

```tsx live
function example() {
  const [shown, setShown] = useState(false);
  return (
    <>
      <Button onClick={() => setShown(!shown)}>
        {shown ? 'Hide the buttons' : 'Show the buttons'}
      </Button>
      {shown && (
        <Affix display="flex" flexDirection="column" gap="2">
          <Button color="link" aria-label="Open chat">
            <Icon name="comments" />
          </Button>
          <Button color="primary" aria-label="Help">
            <Icon name="question" />
          </Button>
        </Affix>
      )}
    </>
  );
}
```

### A Consent Notice

Content that needs a landmark brings its own role and name, since the Affix is only a positioning
wrapper. It's never wider than the viewport less its offsets, so a long notice wraps on a phone.

```tsx live
function example() {
  const [shown, setShown] = useState(false);
  return (
    <>
      <Button onClick={() => setShown(true)}>Show the notice</Button>
      {shown && (
        <Affix position="bottom-left">
          <Box role="region" aria-label="Cookie consent" mb="0">
            <Paragraph mb="3">
              We use one cookie to remember your theme. Nothing else is stored,
              and nothing is shared.
            </Paragraph>
            <Buttons>
              <Button color="primary" onClick={() => setShown(false)}>
                Accept
              </Button>
              <Button onClick={() => setShown(false)}>Decline</Button>
            </Buttons>
          </Box>
        </Affix>
      )}
    </>
  );
}
```

### Right-to-Left

The corners are physical, as Badge's and Toast's are, so `'bottom-right'` stays on the right in
right-to-left text. On a right-to-left page, pass `position="bottom-left"` to keep it at the end of
the line.

```tsx live
function example() {
  const [shown, setShown] = useState(false);
  return (
    <div dir="rtl" lang="ar">
      <Button onClick={() => setShown(!shown)}>
        {shown ? 'إخفاء' : 'إظهار'}
      </Button>
      {shown && (
        <Affix position="bottom-left">
          <Button color="primary">ملاحظات</Button>
        </Affix>
      )}
    </div>
  );
}
```

### Where It Stacks

It stacks at `--bulma-affix-z-index`: over the page, level with Popover and Bulma's fixed navbar,
and under the Sidebar and its overlay, Bulma's modal, a full-page Loading, Tooltip and Toast. A
toast stack in the same corner sits over it, so put toasts in another corner (they start at the top
right) or move the Affix with a larger offset.

### Pinned on Scroll

Affix doesn't pin an element once the page scrolls past it. `position: sticky` does that natively:
give the element `pos="sticky"` and a `top`, as in the
[sticky example in the helpers guide](../../guides/helpers/other.md#position).

---

## Accessibility

- **No role:** it's a positioning wrapper, and what's inside keeps its own role. Content that needs
  a landmark, such as a consent notice, brings its own `role="region"` and name, as in
  [A Consent Notice](#a-consent-notice).
- **Reading and Tab order are DOM order:** the corner it shows in says nothing about when a screen
  reader or the Tab key reaches it. In place, that's where you write it, so put it where it belongs
  in the reading order, usually after the page's main content. With `portal` it's at the end of its
  container, so it's reached last.
- **Focus not obscured:** a fixed box can cover a focused link near its corner, which fails
  [WCAG 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum) when it
  hides it entirely. On a page with a bottom-corner Affix, give `html` a `scroll-padding-bottom` at
  least its height plus its offset
  ([technique C43](https://www.w3.org/WAI/WCAG22/Techniques/css/C43)), so a link that Tab scrolls
  into view stops above it, and leave as much room at the end of the page, so the last link can
  scroll clear too:

  ```css
  html {
    scroll-padding-bottom: 5rem;
  }

  main {
    padding-bottom: 5rem;
  }
  ```

  A top-corner Affix takes `scroll-padding-top` the same way. Not every browser scrolls to a
  focused link that's already on screen, so the padding lowers the odds rather than ruling it out,
  and a small Affix leaves less of the page under it.

- **Reflow:** it's never wider than the viewport less its offsets, at 320px too. At high zoom a
  fixed box takes a bigger share of the screen, so keep what's in it small.
- **Forced colors:** it draws nothing of its own, so what's inside keeps its own forced colors.
- **Motion:** it has no motion of its own. What's inside keeps its own transitions.
- **Right-to-left:** the corner stays where `position` puts it. See
  [Right-to-Left](#right-to-left).

---

## Related Components

- [`Button`](../elements/button.md): The usual content, a floating button or a launcher.
- [`Box`](../elements/box.md): A surface with a shadow for a notice pinned to a corner, so it stands
  out from the page under it.
- [`Toast`](./toast.md): Short-lived messages in a corner of their own, which stack over an Affix.
- [`Badge`](./badge.md): A count on the button in the corner, with the same four corner values.
- [`Modal`](./modal.md): The same `portal` prop, taking the same values.
- [`Portal`](../helpers/portal.md): Where portaled content goes, and the `portalContainer` default.
- [Helper Props](../helpers/usebulmaclasses.md): The spacing helpers that nudge an Affix, and
  `pos="sticky"` for an element pinned on scroll.

---

## Additional Resources

- [Storybook: Affix Stories](https://bestax.io/storybook/?path=/story/components-affix--default)
- [WCAG 2.2: Understanding Focus Not Obscured (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum)
- [WCAG 2.2 Technique C43: Using CSS scroll-padding to un-obscure content](https://www.w3.org/WAI/WCAG22/Techniques/css/C43)
- [MDN: env()](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
- [MDN: position: fixed and its containing block](https://developer.mozilla.org/en-US/docs/Web/CSS/position#fixed_positioning)

---

## Props

<!-- bestax:generated props -->

| Prop        | Type                                                                 | Default          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------- | -------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className` | `string`                                                             | —                | Additional CSS classes to apply.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `children`  | `React.ReactNode`                                                    | —                | What stays in the corner.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `position`  | `'top-right'` \| `'top-left'` \| `'bottom-right'` \| `'bottom-left'` | `'bottom-right'` | The corner of the viewport it's fixed to. Physical, as Badge's and Toast's are: `'bottom-right'` stays on the right in right-to-left text. Its distance from the edges is `--bulma-affix-offset-vertical` and `--bulma-affix-offset-horizontal` plus the device's safe-area inset; a margin from the spacing helpers (`mb`, `mr`, …) adds to it.                                                                                                                                                                              |
| `portal`    | `boolean` \| `string` \| `HTMLElement`                               | `false`          | Renders it into another container, for a page where an ancestor's `transform`, `filter` or `contain` would capture `position: fixed`. `true` portals to the `portalContainer` a `ConfigProvider` sets, `document.body` by default; a string is used as a `document.querySelector` selector; an element is used directly. Renders in place on the server and while hydrating, moving into the portal once the client takes over, so hydration matches. Portaled, it comes last in the reading and Tab order of that container. |
| `ref`       | `React.Ref<HTMLDivElement>`                                          | —                | Ref forwarded to the `<div>`, wherever it renders.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `...`       | All standard `<div>` attributes and Bulma helper props               | —                | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Affix` registers these variables on its own `.affix` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                      | Sass Variable              | Default                      |
| --------------------------------- | -------------------------- | ---------------------------- |
| `--bulma-affix-offset-vertical`   | `$affix-offset-vertical`   | `var(--bulma-block-spacing)` |
| `--bulma-affix-offset-horizontal` | `$affix-offset-horizontal` | `var(--bulma-block-spacing)` |
| `--bulma-affix-z-index`           | `$affix-z-index`           | `$extras-z-index-sticky`     |

<!-- /bestax:generated cssvars -->
