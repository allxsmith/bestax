---
title: Portal
sidebar_label: Portal
---

# Portal

## Overview

`Portal` renders its children into another part of the page, `document.body` unless `container` says otherwise, so floating content escapes an ancestor's `overflow`, `transform` or stacking context.

It is the building block for your own overlays: a command palette, a floating panel. `Modal`, `Dialog`, `Toast` and `Popover` already portal through their own props, so reach for `Portal` when you are building something they don't cover.

React's server renderer can't render a portal, so `Portal` renders nothing on the server and during hydration, and mounts its children in the commit that follows. The first client render matches the server markup, and there is no hydration warning to chase. In an app without server rendering it portals on the first render.

---

## Import

```tsx
import { Portal } from '@allxsmith/bestax-bulma';
```

---

## Usage

### Into `document.body`

With no `container`, the children go to the end of `document.body`, whatever clips or transforms the component that renders them.

```tsx
function Banner() {
  return (
    <Box overflow="clipped">
      <p>This box clips its overflow.</p>
      <Portal>
        <Notification color="info">
          Rendered at the end of document.body, outside the box.
        </Notification>
      </Portal>
    </Box>
  );
}
```

### Into a container

`container` takes an element or a `document.querySelector` selector. A selector suits an overlay root in your page shell (`<div id="overlays" />`); an element suits a target your own component renders. Hold that element in state from a ref callback, so the portal renders once the target exists.

```tsx live
function example() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  return (
    <>
      <Box overflow="clipped">
        <p>The notification is declared inside this box.</p>
        {target && (
          <Portal container={target}>
            <Notification color="success">
              It renders into the element after the box instead.
            </Notification>
          </Portal>
        )}
      </Box>
      <div ref={setTarget} />
    </>
  );
}
```

An empty selector, or one that matches nothing, falls back to `document.body` rather than throwing.

A selector is looked up again on each render, so the content follows the target when the target changes. Moving to another target remounts the children, which resets their state. That includes a selector that only starts matching after the content has already shown in `document.body`, so render the target first (an overlay root in the page shell is), or pass the element once you have it, as above.

### Rendering in place

`disabled` renders the children where the `Portal` is, on the server as well as the client. A component that portals only sometimes (behind an `appendToBody` option, say) can keep one code path.

```tsx live
<Portal disabled>
  <Notification>Rendered in place, as if there were no portal.</Notification>
</Portal>
```

### Floating content and focus

Positioning floating content next to its trigger is up to you; `Portal` only decides where it sits in the DOM.

Focus follows the DOM too. Content portaled to the end of `document.body` is last in the Tab order, so interactive floating content should take focus when it opens and hand it back to its trigger when it closes. A focus trap doesn't cover what a `Portal` inside it renders, because that content is no longer inside the trapped element: render a nested overlay inside the trapped element, or trap it separately. To trap portaled content, put the trap on the element inside the `Portal`, as the [useFocusTrap portal example](./usefocustrap.md#with-portals) does.

### Context and styles

React context reaches portaled children, so a `ConfigProvider` class prefix still applies, and their React events bubble up the React tree to the components around the `Portal`. CSS inheritance follows the DOM instead. A scoped `Theme` (one without `isRoot`) sets its CSS variables on a wrapper element that portaled content has left, so that content sees the page-level theme. Point `container` at an element inside the themed area to keep it themed.

---

## Accessibility

- The DOM decides reading and Tab order, not the React tree. Content portaled to the end of `document.body` comes last in both, so a keyboard user can't reach it from the button that opened it by pressing Tab. Move focus into interactive floating content when it opens, and back to what opened it when it closes.
- Give floating content a role and an accessible name (`role="dialog"` with `aria-label` or `aria-labelledby`), and give its trigger `aria-expanded` and `aria-controls`. Ids work across the portal, since they are shared by the whole document.
- Content that only appears after hydration is missing from the server HTML. Keep anything a reader or a crawler needs on first load out of a portal.

---

## Related Components

- [`Modal`](../components/modal.md): Has its own `portal` prop, taking the same `true`, selector or element.
- [`Toast`](../components/toast.md): Portals to `document.body` by default.
- [`Theme`](./theme.md): Scoped themes stay behind when content is portaled; see above.

---

## Additional Resources

- [Storybook: Portal Stories](https://bestax.io/storybook/?path=/story/helpers-portal--default)
- [React: `createPortal`](https://react.dev/reference/react-dom/createPortal)

---

## Props

| Prop        | Type                      | Default         | Description                                                                                                                                                                                    |
| ----------- | ------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`  | `ReactNode`               | —               | Content to render into the container.                                                                                                                                                          |
| `container` | `string` \| `HTMLElement` | `document.body` | An element, or a `document.querySelector` selector looked up on each render. Empty, or a selector that matches nothing, means `document.body`. Moving to another target remounts the children. |
| `disabled`  | `boolean`                 | `false`         | Render the children in place instead, on the server as well as the client.                                                                                                                     |
