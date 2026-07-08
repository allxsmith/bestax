---
title: Reveal
sidebar_label: Reveal
---

# Reveal

## Overview

The `Reveal` component animates its content into view as it scrolls into the viewport, backed by `IntersectionObserver`. It's a lightweight, CSS-driven wrapper for "fade/slide/zoom in on scroll" effects on landing pages — no animation runtime dependency required.

Accessibility and progressive enhancement are built in, not opt-in:

- Automatically **skips the animation** (renders the final, visible state immediately) when the
  user's OS requests `prefers-reduced-motion: reduce`.
- Renders the final, visible state during **server-side rendering** and on the very first client
  render, so content is never hidden from crawlers or users if JavaScript never runs.
- Falls back to the visible state immediately in environments without `IntersectionObserver`.

---

## Import

```tsx
import { Reveal } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop              | Type                                                                                                  | Default     | Description                                                                                                                                |
| ----------------- | ----------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `animation`       | `'fade'` \| `'fade-up'` \| `'fade-down'` \| `'slide-left'` \| `'slide-right'` \| `'zoom'` \| `'flip'` | `'fade-up'` | Animation style applied when the element enters the viewport.                                                                              |
| `delay`           | `number`                                                                                              | `0`         | Delay in milliseconds before the animation starts.                                                                                         |
| `duration`        | `number`                                                                                              | `600`       | Animation duration in milliseconds.                                                                                                        |
| `threshold`       | `number`                                                                                              | `0.15`      | Fraction (0-1) of the element that must be visible to trigger the reveal. Clamped to the 0-1 range; non-finite values fall back to `0.15`. |
| `once`            | `boolean`                                                                                             | `true`      | Animate only the first time the element enters the viewport. If `false`, it re-animates on every entry/exit.                               |
| `as`              | `React.ElementType`                                                                                   | `'div'`     | Element or component to render as.                                                                                                         |
| `cascade`         | `boolean`                                                                                             | `false`     | Stagger direct children with an incrementing delay instead of animating this element as a single block.                                    |
| `cascadeInterval` | `number`                                                                                              | `80`        | Milliseconds added to each successive child's delay when `cascade` is set.                                                                 |
| `children`        | `React.ReactNode`                                                                                     | —           | Content to reveal.                                                                                                                         |
| `className`       | `string`                                                                                              | —           | Additional CSS classes.                                                                                                                    |
| ...               | All standard HTML and Bulma helper props                                                              |             | (See [Helper Props](../helpers/usebulmaclasses))                                                                                           |

---

## Usage

### Basic Reveal

Fades a block up into view as it scrolls into the viewport.

```tsx live
function example() {
  return (
    <Reveal animation="fade-up">
      <Box>
        <Title size="4">Why bestax</Title>
        <Content>This box fades up into view once it's on screen.</Content>
      </Box>
    </Reveal>
  );
}
```

### Rendering as a different element

Use `as` to render the wrapper as a different tag or component, e.g. `Section`.

```tsx live
function example() {
  return (
    <Reveal animation="fade-up" as={Section}>
      <Title size="3">Why Grass Doctor</Title>
      <Content>Rendered as a `Section` instead of the default `div`.</Content>
    </Reveal>
  );
}
```

:::note Where your props land with a component `as`

When `as` is a plain intrinsic tag (e.g. `as="section"`), your `className`, `style`, Bulma
helper classes, and everything else (`id`, `aria-*`, `data-*`, event handlers) all land on that
single rendered element.

When `as` is a **component** (e.g. `as={Section}`), scroll detection needs a real DOM node it
can attach a ref to, which library components like `Section`/`Card` don't forward. `Reveal`
therefore wraps the component in an observed `div`: your `className`, `style`, and helper
classes go on that wrapper `div`, while the remaining props (`id`, `aria-*`, `data-*`, event
handlers) are forwarded to the inner component. A combined selector like `#hero.highlight` that
assumes both `id` and `className` sit on the same element won't match in that case.

For the same reason, avoid Bulma layout primitives that must be a **direct child** of their
container — `Column` (inside `Columns`) or `Cell` (inside `Grid`) — as the `as` component: the
observed wrapper `div` sits between the container and the primitive and breaks the layout. Reveal
the surrounding container instead, or use `cascade` to animate the primitives as children.

:::

### Animation styles

`animation` accepts `'fade'`, `'fade-up'`, `'fade-down'`, `'slide-left'`, `'slide-right'`,
`'zoom'`, and `'flip'`.

```tsx live
function example() {
  return (
    <Columns isMultiline>
      <Column size="one-third">
        <Reveal animation="zoom">
          <Box>
            <Title size="5">zoom</Title>
          </Box>
        </Reveal>
      </Column>
      <Column size="one-third">
        <Reveal animation="flip">
          <Box>
            <Title size="5">flip</Title>
          </Box>
        </Reveal>
      </Column>
      <Column size="one-third">
        <Reveal animation="slide-left">
          <Box>
            <Title size="5">slide-left</Title>
          </Box>
        </Reveal>
      </Column>
    </Columns>
  );
}
```

### Staggered (cascade) children

Set `cascade` to stagger **direct children** of `Reveal` with an incrementing
`transitionDelay` (`cascadeInterval` milliseconds apart), rather than animating the wrapper as a
single block. Pass the individual items to stagger (e.g. `Card`s) directly as children, rather
than a single nested layout component. Use Bulma helper props like `display="flex"` for layout
instead of inline `style`.

```tsx live
function example() {
  return (
    <Reveal
      animation="fade-up"
      cascade
      cascadeInterval={100}
      display="flex"
      flexWrap="wrap"
    >
      {['Fast', 'Accessible', 'Themeable'].map(feature => (
        <Card key={feature} flexGrow="1" flexShrink="1" m="2">
          <Card.Content>
            <Title size="5">{feature}</Title>
          </Card.Content>
        </Card>
      ))}
    </Reveal>
  );
}
```

### Re-animating on every entry

By default, `Reveal` only animates the first time it enters the viewport (`once`). Set
`once={false}` to have it re-animate every time it scrolls in and out of view.

```tsx live
function example() {
  return (
    <Reveal animation="fade" once={false}>
      <Notification color="info">
        Scroll me out of view and back in to see this animate again.
      </Notification>
    </Reveal>
  );
}
```

---

## Accessibility

- `Reveal` never removes content from the accessibility tree — it only animates `opacity` and
  `transform`, so screen reader users always have access to the content regardless of scroll
  position.
- When the user's OS is set to reduce motion (`prefers-reduced-motion: reduce`), `Reveal` skips
  the animation entirely and renders the final, visible state immediately.
- During server-side rendering and the first client render (before hydration effects run),
  `Reveal` renders the final, visible state — content is never hidden if JavaScript fails to
  load, ensuring crawlers and no-JS visitors always see the full page.
