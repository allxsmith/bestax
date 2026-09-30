---
title: Portal
sidebar_label: Portal
---

# Portal

## Overview

`Portal` renders its children into another part of the page, `document.body` unless `container` says otherwise, so floating content escapes an ancestor's `overflow`, `transform` or stacking context.

It is the building block for your own overlays: a command palette, a floating panel, a custom popover. `Modal`, `Dialog` and `Toast` already portal through their own props, so reach for `Portal` when you are building something they don't cover.

A portal has nothing to render on the server, so `Portal` renders nothing there and during hydration, and mounts its children in the commit that follows. The first client render matches the server markup, and there is no hydration warning to chase. In an app without server rendering it portals on the first render.

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

### Rendering in place

`disabled` renders the children where the `Portal` is, on the server as well as the client. A component that portals only sometimes (behind an `appendToBody` option, say) can keep one code path.

```tsx live
<Portal disabled>
  <Notification>Rendered in place, as if there were no portal.</Notification>
</Portal>
```

### A floating panel

`Portal` pairs with [`useFocusTrap`](./usefocustrap.md) for a panel opened from a button. The trap waits for hydration the same way `Portal` does, so it finds the portaled panel whenever it appears.

```tsx
function FilterPanel() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, { active: open, restoreFocus: buttonRef });

  return (
    <>
      <Button
        ref={buttonRef}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="filter-panel"
        onClick={() => setOpen(o => !o)}
      >
        Filters
      </Button>
      {open && (
        <Portal>
          <div
            ref={panelRef}
            id="filter-panel"
            role="dialog"
            aria-label="Filters"
            tabIndex={-1}
            onKeyDown={e => e.key === 'Escape' && setOpen(false)}
          >
            <Box>
              <Input label="Name contains" />
              <Button onClick={() => setOpen(false)}>Done</Button>
            </Box>
          </div>
        </Portal>
      )}
    </>
  );
}
```

Positioning the panel next to its button is up to you; `Portal` only decides where it sits in the DOM.

### Context and styles

React context reaches portaled children, so a `ConfigProvider` class prefix still applies, and their React events bubble up the React tree to the components around the `Portal`. CSS inheritance follows the DOM instead. A scoped `Theme` (one without `isRoot`) sets its CSS variables on a wrapper element that portaled content has left, so that content sees the page-level theme. Point `container` at an element inside the themed area to keep it themed.

---

## Accessibility

- The DOM decides reading and Tab order, not the React tree. Content portaled to the end of `document.body` comes last in both, so a keyboard user can't reach it from the button that opened it by pressing Tab. Move focus into interactive floating content when it opens and back when it closes; [`useFocusTrap`](./usefocustrap.md) does both.
- Give floating content a role and an accessible name (`role="dialog"` with `aria-label` or `aria-labelledby`), and give its trigger `aria-expanded` and `aria-controls`. Ids work across the portal, since they are shared by the whole document.
- Content that only appears after hydration is missing from the server HTML. Keep anything a reader or a crawler needs on first load out of a portal.

---

## Related Components

- [`useFocusTrap`](./usefocustrap.md): Keeps focus inside the portaled content while it is open.
- [`ClientOnly`](./clientonly.md): The same hydration rule for content that isn't portaled.
- [`Modal`](../components/modal.md): Has its own `portal` prop, taking the same `true`, selector or element.
- [`Toast`](../components/toast.md): Portals to `document.body` by default.
- [`Theme`](./theme.md): Scoped themes stay behind when content is portaled; see above.

---

## Additional Resources

- [Storybook: Portal Stories](https://bestax.io/storybook/?path=/story/helpers-portal--default)
- [React: `createPortal`](https://react.dev/reference/react-dom/createPortal)

---

## Props

| Prop        | Type                      | Default         | Description                                                                                                                                    |
| ----------- | ------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`  | `ReactNode`               | —               | Content to render into the container.                                                                                                          |
| `container` | `string` \| `HTMLElement` | `document.body` | An element, or a `document.querySelector` selector looked up on each render. Empty, or a selector that matches nothing, means `document.body`. |
| `disabled`  | `boolean`                 | `false`         | Render the children in place instead, on the server as well as the client.                                                                     |
