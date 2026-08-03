---
slug: enhanced-addons-round-two
title: 'Enhanced Add-Ons, Round Two'
authors: [asmith]
tags: [components, bulma, release]
---

Round two. Since January's [batch of extra components](/blog/extra-components), four more Enhanced Add-Ons have landed: original components that go past what the Bulma spec covers while keeping Bulma's helper props, CSS variables, and theming. Meet Avatar (and its stacking sibling Avatars), Badge, Reveal, and LinkButton.

<!-- truncate -->

## New since January

Same housekeeping as the [v3 forms recap](/blog/v3-forms-release): this is a recap, not breaking news. Reveal landed in 5.3.0 on July 8, Avatar, Avatars, and Badge followed in 5.4.0 two days later, and the library sits at 5.8.0 today. And a confession about LinkButton: it isn't new at all. It shipped in the very same commit as the components the [January post](/blog/extra-components) announced, and that post just never mentioned it. If a component ships in a release and no blog post names it, did it even ship? Consider this its overdue introduction. We won't re-explain the first eight here; the January post has them covered.

### Avatar & Avatars

`Avatar` shows a person as a photo, initials, or an icon, whichever is available. `Avatars` stacks them with an overlap and a surplus bubble.

- Automatic fallback chain: [photo](/docs/api/components/avatar#photo-with-automatic-fallback), then [initials](/docs/api/components/avatar#initials), then [icon](/docs/api/components/avatar#icon-fallback), plus [shapes](/docs/api/components/avatar#shapes) and [sizes](/docs/api/components/avatar#sizes) from 16 to 128 pixels (or any number you want)
- [Clickable avatars](/docs/api/components/avatar#clickable-avatar) render a real link or button, and [`imageProps`](/docs/api/components/avatar#forwarding-props-to-the-image) reaches the underlying `img`
- `Avatars` clamps a long list behind a [surplus bubble](/docs/api/components/avatars#clamped-with-a-surplus-bubble), takes a [localized surplus label](/docs/api/components/avatars#localized-surplus-label), and has a [spaced, non-overlapping mode](/docs/api/components/avatars#non-overlapping-spaced)

All three fallback stages, side by side. The first loads a real photo, the second points at a domain that's guaranteed to fail (so it falls back to initials), and the third has no photo or name at all:

```tsx live
<Avatars spaced>
  <Avatar src="https://github.com/allxsmith.png" name="Al Smith" size="64x64" />
  <Avatar
    src="https://example.invalid/missing.jpg"
    name="Grace Hopper"
    size="64x64"
  />
  <Avatar icon={<Icon name="user" />} color="info" size="64x64" />
</Avatars>
```

There's a fourth stage too: with no photo, name, or icon, a built-in generic silhouette renders. And the initials background isn't random. It's hashed deterministically from the name, so Grace gets the same color on every page load.

### Badge

`Badge` overlays a count or status dot on the corner of anything, or stands alone as a pill.

- [Counts with a max](/docs/api/components/badge#unread-count) (past it the pill shows a plus), [dots](/docs/api/components/badge#status-dot-on-an-avatar), and [custom node content](/docs/api/components/badge#custom-node-content)
- Four [positions](/docs/api/components/badge#positions) and an [overlap mode](/docs/api/components/badge#overlap-circle-vs-square) that hugs round targets correctly
- [Pulse](/docs/api/components/badge#pulse) for in-progress states (it goes still under reduced motion), [visibility toggling](/docs/api/components/badge#toggling-visibility), and [zero handling](/docs/api/components/badge#hidden-at-zero-unless-showzero) with `showZero`
- [Standalone mode](/docs/api/components/badge#standalone) when there's nothing to overlay

A cart button that counts, with a max:

```tsx live
function CartDemo() {
  const [items, setItems] = React.useState(2);
  return (
    <Block display="flex" alignItems="center">
      <Badge content={items} max={9} color="danger" overlap="square" mr="5">
        <Button color="primary">
          <Icon name="shopping-cart" ariaLabel="Cart" />
          <span>Cart</span>
        </Button>
      </Badge>
      <Button onClick={() => setItems(count => count + 1)}>Add item</Button>
    </Block>
  );
}
```

Click past nine and the pill reads 9+. The count lives in a polite live region, which matters more than it sounds (more on that below).

### Reveal

`Reveal` animates content into view as it scrolls into the viewport, with `IntersectionObserver` doing the watching and zero animation libraries in your bundle.

- Seven [animation styles](/docs/api/components/reveal#animation-styles) with `delay`, `duration`, and `threshold` knobs
- [Cascade](/docs/api/components/reveal#staggered-cascade-children) staggers children, and [`once={false}`](/docs/api/components/reveal#re-animating-on-every-entry) re-animates on every entry
- [Polymorphic `as`](/docs/api/components/reveal#rendering-as-a-different-element) renders the observed element as any tag

Three boxes, one `Reveal`, staggered 120 milliseconds apart:

```tsx live
<Reveal
  animation="fade-up"
  cascade
  cascadeInterval={120}
  display="flex"
  flexWrap="wrap"
>
  <Box m="2" flexGrow="1">
    <Title size="5">First</Title>
    <Content>Each direct child gets its own delay.</Content>
  </Box>
  <Box m="2" flexGrow="1">
    <Title size="5">Second</Title>
    <Content>120 milliseconds behind the one before it.</Content>
  </Box>
  <Box m="2" flexGrow="1">
    <Title size="5">Third</Title>
    <Content>No animation runtime in your bundle.</Content>
  </Box>
</Reveal>
```

Two things worth knowing. First, `cascade` staggers only the direct children of `Reveal`, so hand it the items themselves, not a wrapper component. Second, and this one matters: Reveal respects `prefers-reduced-motion`. When the reader's OS asks for less motion, the animation is skipped entirely and content simply appears. It also renders everything visible during SSR, so crawlers and no-JS visitors never get a blank page. The full [accessibility story](/docs/api/components/reveal#accessibility) is on the API page.

### LinkButton

The component the January post forgot. `LinkButton` is a real `<button>` dressed as text or a link, and it exists to kill the `<div onClick>` pattern: you keep native keyboard focus, Enter and Space handling, and screen reader semantics while looking like prose.

- Three variants, [text](/docs/api/elements/linkbutton#default-text-variant), [ghost](/docs/api/elements/linkbutton#ghost-variant), and underline, in [any Bulma color](/docs/api/elements/linkbutton#all-colors) and [size](/docs/api/elements/linkbutton#all-sizes)
- [Polymorphic `as`](/docs/api/elements/linkbutton#polymorphic-as-router-links) for router links
- Everything `Button` offers passes through, minus the three props that make no sense on a link look (`isOutlined`, `isInverted`, `isLight`)

```tsx live
<Buttons>
  <LinkButton>Text variant</LinkButton>
  <LinkButton variant="ghost">Ghost variant</LinkButton>
  <LinkButton variant="underline" color="primary">
    Underline variant
  </LinkButton>
</Buttons>
```

## Built for Accessibility

Some honesty about the rollout: Avatar and Badge shipped in 5.4.0 on a Friday, and by the following Tuesday we'd landed 5.4.1, 5.4.2, and a dedicated 5.5.0 accessibility batch. Shipping fast and patching fast are the same muscle, and the result is a set of defaults we're happy to stand behind:

- An avatar with an explicit `alt=""` is treated as decorative and skipped by screen readers entirely, but never when it's a link or a button
- Link and button avatars always get an accessible name, even when you forget to provide one
- Badge's `role="status"` live region stays mounted even when a zero hides the pill, so a change from 0 to 1 is announced reliably instead of inserting a region nobody hears
- Keyboard focus on a stacked avatar lifts it above its overlapping neighbors, so the focus ring is never buried
- The surplus label in `Avatars` is localizable, and `as="button"` avatars default to `type="button"` so a click can't accidentally submit a form

Reveal didn't need the patch batch. Its accessibility story shipped on day one: content never leaves the accessibility tree, the animation touches only opacity and transform, and reduced motion turns it off.

## Themeable like Stock Bulma

Every Enhanced Add-On follows the same SCSS contract as the stock components: its variables derive from Bulma tokens (never hardcoded hex) and register as `--bulma-*` CSS variables on the component root. That's why the `Theme` component and plain CSS overrides work on the extras exactly like they work on a `Button`.

Take the badge's ring, the thin outline separating the pill from whatever sits behind it. It defaults to `var(--bulma-scheme-main)`, the page's scheme color, so it's already correct in dark mode without a dark-mode rule anywhere. Want it branded? One variable:

```css
.badge {
  --bulma-badge-ring-color: var(--bulma-primary);
}
```

The same goes for the rest: avatar size, background, and radius; Reveal's duration and easing riding Bulma's own motion tokens. Initials avatars even pick their background from Bulma's palette (primary, link, info, success, warning, danger), so a retheme recolors your avatars with everything else. Each API page lists its variables at the bottom: [Avatar](/docs/api/components/avatar#css--sass-variables), [Badge](/docs/api/components/badge#css--sass-variables), [Reveal](/docs/api/components/reveal#css--sass-variables). For the bigger picture, see the [Theme helper](/docs/api/helpers/theme) and the [CSS variables guide](/docs/guides/features/css-variables).

## All 12 Enhanced Add-Ons

The full set, straight from the homepage grid, four of them new since January:

| Component                                       | What it does                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| [**LinkButton**](/docs/api/elements/linkbutton) | A button that dresses like a link: semantics of a button, look of an anchor.          |
| [**Avatar**](/docs/api/components/avatar)       | User images with automatic initials and icon fallbacks, in any size or shape.         |
| [**Badge**](/docs/api/components/badge)         | Corner status dots and counts overlaid on any element.                                |
| [**Carousel**](/docs/api/components/carousel)   | Slide any content with autoplay, drag, arrows, and indicators.                        |
| [**Collapse**](/docs/api/components/collapse)   | Smoothly expanding panels for accordions and FAQs.                                    |
| [**Dialog**](/docs/api/components/dialog)       | Confirmation and alert dialogs with customizable actions.                             |
| [**Loading**](/docs/api/components/loading)     | Spinner overlays for full pages or single containers.                                 |
| [**Reveal**](/docs/api/components/reveal)       | Scroll-triggered entrance animations, solo or cascading, that respect reduced motion. |
| [**Sidebar**](/docs/api/components/sidebar)     | Slide-out navigation panels from either edge.                                         |
| [**Steps**](/docs/api/components/steps)         | Multi-step progress for wizards and checkouts.                                        |
| [**Toast**](/docs/api/components/toast)         | Brief stacking notifications with a programmatic API.                                 |
| [**Tooltip**](/docs/api/components/tooltip)     | Hover hints in any direction and color.                                               |

## Documentation

- API references: [Avatar](/docs/api/components/avatar), [Avatars](/docs/api/components/avatars), [Badge](/docs/api/components/badge), [Reveal](/docs/api/components/reveal), and [LinkButton](/docs/api/elements/linkbutton)
- Theming: the [Theme helper](/docs/api/helpers/theme) and the [CSS variables guide](/docs/guides/features/css-variables)
- Round one: [Introducing Extra Components](/blog/extra-components), the first eight
