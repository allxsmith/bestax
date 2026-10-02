---
title: ClientOnly
sidebar_label: ClientOnly
---

# ClientOnly

## Overview

`ClientOnly` renders its children only in the browser, after hydration, and a `fallback` until then, so content that depends on browser-only state doesn't cause a hydration mismatch.

The server render and the hydrating client render both show `fallback`, which keeps them identical; the children replace it in the commit that follows. Reach for it when the markup itself would differ between server and browser: the reader's time zone or locale, a value from `localStorage`, the viewport size, a widget that needs `window` to render at all. In an app without server rendering the children show on the first render, so wrapping something in `ClientOnly` costs nothing there.

The hook underneath, `useIsHydrated`, is exported too, for components that need the answer rather than a wrapper.

---

## Import

```tsx
import { ClientOnly, useIsHydrated } from '@allxsmith/bestax-bulma';
```

---

## Hooks

### useIsHydrated

Returns `false` during server rendering and during the hydrating client render, then `true` from the commit that follows. A component that mounts after hydration (after a route change, or in an app with no server rendering) gets `true` on its first render, so it pays for no extra render.

```tsx
function Greeting() {
  const hydrated = useIsHydrated();
  // localStorage only exists in the browser, so the server render and the
  // hydrating render both show the generic greeting.
  const name = hydrated ? localStorage.getItem('name') : null;
  return <Title size="4">{name ? `Welcome back, ${name}` : 'Welcome'}</Title>;
}
```

---

## Usage

### Browser-only content

Pass the content as a function and it is called only after hydration, so an expression that reads `window`, `document` or `Intl` state never runs on the server. Plain children work too, but JSX children are evaluated by the component that renders `ClientOnly`, on the server included; a function is what keeps a browser-only expression off the server.

```tsx live
<ClientOnly fallback={<Skeleton variant="lines" lines={1} />}>
  {() => (
    <Notification color="info">
      Times are shown in{' '}
      <strong>{Intl.DateTimeFormat().resolvedOptions().timeZone}</strong>.
    </Notification>
  )}
</ClientOnly>
```

### A component that needs the browser

A component's own render is deferred along with it, so a component child works without the function form.

```tsx
<ClientOnly fallback={<Skeleton variant="block" />}>
  <MapWidget center={office} />
</ClientOnly>
```

### A fallback that holds the layout

Without a `fallback` nothing renders until hydration, and the content pushes the page down when it arrives. A placeholder of the same size, such as a [`Skeleton`](../elements/skeleton.md), avoids the jump.

```tsx
<ClientOnly fallback={<Skeleton variant="lines" lines={3} />}>
  {() => <RecentlyViewed items={readHistory(localStorage)} />}
</ClientOnly>
```

---

## Accessibility

- Content that arrives after hydration is not announced by screen readers on its own. Keep what a reader needs on first load out of `ClientOnly`, and use it for enhancements.
- Match the fallback's size to the content, so the page doesn't shift under someone who has started reading or scrolling.
- Assistive technology meets the fallback until it is replaced. An empty [`Skeleton`](../elements/skeleton.md) gives it nothing to read; a text fallback such as "Loading…" is read out.

---

## Related Components

- [`Modal`](../components/modal.md): Its `portal` prop follows the same rule, rendering inline until the page has hydrated.
- [`Skeleton`](../elements/skeleton.md): A placeholder to pass as `fallback`.
- [`Reveal`](../components/reveal.md): Renders its final state on the server and animates only in the browser.

---

## Additional Resources

- [Storybook: ClientOnly Stories](https://bestax.io/storybook/?path=/story/helpers-clientonly--default)
- [React: hydration mismatches](https://react.dev/reference/react-dom/client/hydrateRoot#handling-different-client-and-server-content)

---

## Props

| Prop       | Type                             | Default | Description                                                                                              |
| ---------- | -------------------------------- | ------- | -------------------------------------------------------------------------------------------------------- |
| `children` | `ReactNode` \| `() => ReactNode` | —       | Content to render once hydrated. A function is called only then, never on the server.                    |
| `fallback` | `ReactNode`                      | `null`  | Rendered on the server and during hydration instead, such as a placeholder the same size as the content. |
