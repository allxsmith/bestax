---
title: Modal
sidebar_label: Modal
---

# Modal

## Overview

The `Modal` component provides a flexible, accessible modal dialog for your Bulma React UI. It supports both Bulma's modal-card and modal-content variants, with options for title, footer, custom content, color helpers, and close callbacks. Easily control visibility via the `active` prop and handle closing with `onClose`.

:::info
Use `Modal` for dialogs, confirmations, forms, or custom popover content. Supports card-style layouts (header/body/footer) or arbitrary content modals.
:::

---

## Import

```tsx
import { Modal } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop             | Type                                                                                                                                                                                                                                                                                     | Default | Description                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `active`         | `boolean`                                                                                                                                                                                                                                                                                | `false` | Whether the modal is open/visible.                                                            |
| `onClose`        | `() => void`                                                                                                                                                                                                                                                                             | —       | Callback invoked to request modal close (background or close button).                         |
| `type`           | `'card'` \| `'content'`                                                                                                                                                                                                                                                                  | auto    | Modal style: `'card'` for modal-card, `'content'` for modal-content. Auto if title/foot used. |
| `modalCardTitle` | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | Title/header for modal-card variant.                                                          |
| `modalCardFoot`  | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | Footer for modal-card variant.                                                                |
| `textColor`      | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Text color for modal content.                                                                 |
| `bgColor`        | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Background color for modal content.                                                           |
| `className`      | `string`                                                                                                                                                                                                                                                                                 | —       | Additional CSS classes for the modal.                                                         |
| `children`       | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | Modal body/content.                                                                           |
| ...              | All standard HTML and Bulma helper props                                                                                                                                                                                                                                                 |         | (See [Helper Props](../helpers/usebulmaclasses))                                              |

---

## Usage

### Modal Card (with title and footer)

```tsx
const [open, setOpen] = useState(false);

<>
  <button onClick={() => setOpen(true)}>Show Modal</button>
  <Modal
    active={open}
    onClose={() => setOpen(false)}
    modalCardTitle="Modal Card Title"
    modalCardFoot={
      <>
        <button className="button is-success">Save</button>
        <button className="button">Cancel</button>
      </>
    }
  >
    Modal card body content goes here...
  </Modal>
</>;
```

---

### Modal Card (title only)

```tsx
<Modal
  active={open}
  onClose={() => setOpen(false)}
  modalCardTitle="Modal Card Title Only"
>
  Modal body content...
</Modal>
```

---

### Modal Card (footer only)

```tsx
<Modal
  active={open}
  onClose={() => setOpen(false)}
  modalCardFoot={<button className="button is-success">Save</button>}
>
  Modal body content...
</Modal>
```

---

### Modal Content (no card title or footer)

```tsx
<Modal active={open} onClose={() => setOpen(false)}>
  <div style={{ background: '#fff', padding: 24, borderRadius: 4 }}>
    <h3 className="title is-4">Custom Content</h3>
    <p>Put any content here!</p>
  </div>
</Modal>
```

---

### Explicit Modal Types

#### Force content style

```tsx
<Modal active={open} onClose={() => setOpen(false)} type="content">
  <div>Custom content modal (forced type="content")</div>
</Modal>
```

#### Force card style

```tsx
<Modal active={open} onClose={() => setOpen(false)} type="card">
  Modal card body (forced type="card")
</Modal>
```

---

## Accessibility

- The modal root uses Bulma’s structure and ARIA roles for accessibility.
- The modal background closes the modal on click (`onClose` required).
- Close buttons are provided for both modal-card and modal-content variants.
- Keyboard/screen reader accessibility is supported, but for focus trap or escape key handling, implement those patterns in your app as needed.

:::note
Always provide an `onClose` handler for accessibility and to allow users to dismiss the modal.
:::

---

## Related Components

- [`Button`](../elements/button.md): Use for actions in modal footers.
- [`Field`](../form/field.md), [`Input`](../form/input.md): For forms inside modals.
- [Helper Props](../helpers/usebulmaclasses.md): All Bulma utility helpers can be used.

---

## Additional Resources

- [Bulma Modal Documentation](https://bulma.io/documentation/components/modal/)
- [Storybook: Modal Stories](https://storybook.bestax.cc/?path=/story/components-modal--modal-card)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Modal />` for powerful utility-based styling.
:::
