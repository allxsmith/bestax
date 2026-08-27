---
title: Modal
sidebar_label: Modal
description: The `Modal` component provides an empty, accessible overlay for arbitrary content — for a ready-made confirm or alert, reach for `Dialog` instead.
---

# Modal

## Overview

<!-- bestax:generated overview -->

The `Modal` component provides an empty, accessible overlay for arbitrary content — for a ready-made confirm or alert, reach for `Dialog` instead.

<!-- /bestax:generated overview -->

It supports both Bulma's modal-card and modal-content variants, with options for title, footer, custom content, color helpers, and close callbacks. Easily control visibility via the `active` or `isActive` prop and handle closing with `onClose`.

The Modal component supports two APIs:

- **Legacy Props API**: Use `modalCardTitle` and `modalCardFoot` props for simple modals
- **Compound Components API**: Use `Modal.Background`, `Modal.Card`, `Modal.Content`, and `Modal.Close` for full control and better readability

:::info
Use `Modal` for forms or custom popover content — an empty overlay you build the contents of. For a ready-made confirm or alert, use [`Dialog`](./dialog.md) instead. `Modal` supports card-style layouts (header/body/footer) or arbitrary content modals.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Modal } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Modal Card (with title and footer)

To display a modal dialog with a header and footer, use the `Modal` component with the `active` prop to control visibility, and provide `modalCardTitle` and `modalCardFoot` for the card layout. The `onClose` prop handles closing the modal, and you can use Bulma color helpers for further customization. This pattern is ideal for forms or any content that requires user attention in a focused overlay.

```tsx live
function example() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button color="success" onClick={() => setOpen(true)}>
        Show Modal
      </Button>
      <Modal
        active={open}
        onClose={() => setOpen(false)}
        modalCardTitle="Modal Card Title"
        modalCardFoot={
          <Buttons>
            <Button color="success">Save</Button>
            <Button>Cancel</Button>
          </Buttons>
        }
      >
        Modal card body content goes here...
      </Modal>
    </>
  );
}
```

---

### Modal Card (title only)

Provide only the `modalCardTitle` prop to display a modal card with a header and body, but no footer. This is useful for simple dialogs or information popups that do not require actions in the footer area.

```tsx live
function example() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button color="success" onClick={() => setOpen(true)}>
        Show Modal
      </Button>
      <Modal
        active={open}
        onClose={() => setOpen(false)}
        modalCardTitle="Modal Card Title Only"
      >
        Modal body content...
      </Modal>
    </>
  );
}
```

---

### Modal Card (footer only)

Provide only the `modalCardFoot` prop to display a modal card with a footer and body, but no header. This is useful for footer-driven actions that do not require a title.

```tsx live
function example() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button color="success" onClick={() => setOpen(true)}>
        Show Modal
      </Button>
      <Modal
        active={open}
        onClose={() => setOpen(false)}
        modalCardFoot={<Button color="success">Save</Button>}
      >
        Modal body content...
      </Modal>
    </>
  );
}
```

---

### Modal Content (no card title or footer)

Omit both `modalCardTitle` and `modalCardFoot` to render a modal with only custom content. This is ideal for popovers, custom layouts, or when you want full control over the modal's appearance.

```tsx live
function example() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button color="success" onClick={() => setOpen(true)}>
        Show Modal
      </Button>
      <Modal active={open} onClose={() => setOpen(false)}>
        <Box>
          <Title size="4">Custom Content</Title>
          <Paragraph>Put any content here!</Paragraph>
        </Box>
      </Modal>
    </>
  );
}
```

---

### Explicit Modal Types

#### Force content style

Set the `type` prop to `content` to force the modal to use the content style, regardless of whether a title or footer is provided. This is useful for custom layouts or when you want to avoid the card structure.

```tsx live
function example() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button color="success" onClick={() => setOpen(true)}>
        Show Modal
      </Button>
      <Modal active={open} onClose={() => setOpen(false)} type="content">
        <div>Custom content modal (forced type="content")</div>
      </Modal>
    </>
  );
}
```

#### Force card style

Set the `type` prop to `card` to force the modal to use the card style, even if no title or footer is provided. This is helpful for consistent styling across your app.

```tsx live
function example() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button color="success" onClick={() => setOpen(true)}>
        Show Modal
      </Button>
      <Modal active={open} onClose={() => setOpen(false)} type="card">
        Modal card body (forced type="card")
      </Modal>
    </>
  );
}
```

---

### Compound (dot-notation) usage

#### Modal.Card with compound components

The compound components API provides more flexibility and better readability for complex modals. Use `Modal.Background`, `Modal.Card`, and related sub-components for full control over the modal structure.

```tsx live
function example() {
  const [open, setOpen] = useState(false);
  const closeModal = () => setOpen(false);

  return (
    <>
      <Button color="success" onClick={() => setOpen(true)}>
        Show Modal
      </Button>
      <Modal isActive={open}>
        <Modal.Background onClick={closeModal} />
        <Modal.Card>
          <Modal.Card.Head>
            <Modal.Card.Title>Compound Component Modal</Modal.Card.Title>
            <Modal.Close onClick={closeModal} />
          </Modal.Card.Head>
          <Modal.Card.Body>
            This modal uses the compound components API for better control and
            readability.
          </Modal.Card.Body>
          <Modal.Card.Foot>
            <Buttons>
              <Button color="success" onClick={closeModal}>
                Save
              </Button>
              <Button onClick={closeModal}>Cancel</Button>
            </Buttons>
          </Modal.Card.Foot>
        </Modal.Card>
      </Modal>
    </>
  );
}
```

#### Modal.Content with compound components

For custom content modals, use `Modal.Content` with `Modal.Close` (use `variant="floating"` for the overlay close button):

```tsx live
function example() {
  const [open, setOpen] = useState(false);
  const closeModal = () => setOpen(false);

  return (
    <>
      <Button color="success" onClick={() => setOpen(true)}>
        Show Modal
      </Button>
      <Modal isActive={open}>
        <Modal.Background onClick={closeModal} />
        <Modal.Content>
          <Box>
            <Title size="4">Custom Content</Title>
            <Paragraph>Using compound components for full control!</Paragraph>
          </Box>
        </Modal.Content>
        <Modal.Close variant="floating" onClick={closeModal} />
      </Modal>
    </>
  );
}
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

- [`Dialog`](./dialog.md): Confirm/alert — use this unless you need arbitrary modal content.
- [`Button`](../elements/button.md): Use for actions in modal footers.
- [`Field`](../form/field.md), [`Input`](../form/input.md): For forms inside modals.
- [Helper Props](../helpers/usebulmaclasses.md): All Bulma utility helpers can be used.

---

## Additional Resources

- [Bulma Modal Documentation](https://bulma.io/documentation/components/modal/)
- [Storybook: Modal Stories](https://bestax.io/storybook/?path=/story/components-modal--modal-card)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Modal />` for powerful utility-based styling.
:::

---

## Props

### Main Modal Props

<!-- bestax:generated props -->

| Prop             | Type                                                                    | Default | Description                                                                            |
| ---------------- | ----------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------- |
| `active`         | `boolean`                                                               | `false` | Whether the modal is open/visible.                                                     |
| `isActive`       | `boolean`                                                               | `false` | Alias for `active`. Whether the modal is open/visible.                                 |
| `onClose`        | `() => void`                                                            | —       | Callback invoked to request modal close (background or close button).                  |
| `className`      | `string`                                                                | —       | Additional CSS classes for the modal.                                                  |
| `textColor`      | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color for modal content.                                                          |
| `bgColor`        | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color for modal content.                                                    |
| `modalCardTitle` | `React.ReactNode`                                                       | —       | Title/header for modal-card variant. (Legacy API only)                                 |
| `modalCardFoot`  | `React.ReactNode`                                                       | —       | Footer for modal-card variant. (Legacy API only)                                       |
| `type`           | `'card'` \| `'content'`                                                 | `auto`  | Modal style: `'card'` for modal-card, `'content'` for modal-content. (Legacy API only) |
| `children`       | `React.ReactNode`                                                       | —       | Modal body/content or compound components.                                             |
| `...`            | All standard `<div>` attributes and Bulma helper props                  | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                      |

**Subcomponents:**

- `Modal.Background`: Modal.Background - Renders the modal background overlay.
- `Modal.Content`: Modal.Content - Renders modal content wrapper for custom content.
- `Modal.Card`: Modal.Card - Renders modal card wrapper with compound components. Use with Modal.Card.Head, Modal.Card.Title, Modal.Card.Body, and Modal.Card.Foot.
- `Modal.Card.Head`: Modal.Card.Head - Renders modal card header section.
- `Modal.Card.Title`: Modal.Card.Title - Renders modal card title.
- `Modal.Card.Body`: Modal.Card.Body - Renders modal card body section.
- `Modal.Card.Foot`: Modal.Card.Foot - Renders modal card footer section.
- `Modal.Close`: Modal.Close - Renders modal close button with two variant styles.

### Modal.Background

| Prop        | Type                            | Default | Description             |
| ----------- | ------------------------------- | ------- | ----------------------- |
| `className` | `string`                        | —       | Additional CSS classes. |
| `...`       | All standard `<div>` attributes | —       |                         |

### Modal.Content

| Prop        | Type                            | Default | Description             |
| ----------- | ------------------------------- | ------- | ----------------------- |
| `className` | `string`                        | —       | Additional CSS classes. |
| `...`       | All standard `<div>` attributes | —       |                         |

### Modal.Card

| Prop        | Type                            | Default | Description             |
| ----------- | ------------------------------- | ------- | ----------------------- |
| `className` | `string`                        | —       | Additional CSS classes. |
| `...`       | All standard `<div>` attributes | —       |                         |

### Modal.Card.Head

| Prop        | Type                         | Default | Description             |
| ----------- | ---------------------------- | ------- | ----------------------- |
| `className` | `string`                     | —       | Additional CSS classes. |
| `...`       | All standard HTML attributes | —       |                         |

### Modal.Card.Title

| Prop        | Type                          | Default | Description             |
| ----------- | ----------------------------- | ------- | ----------------------- |
| `className` | `string`                      | —       | Additional CSS classes. |
| `...`       | All standard `<p>` attributes | —       |                         |

### Modal.Card.Body

| Prop        | Type                         | Default | Description             |
| ----------- | ---------------------------- | ------- | ----------------------- |
| `className` | `string`                     | —       | Additional CSS classes. |
| `...`       | All standard HTML attributes | —       |                         |

### Modal.Card.Foot

| Prop        | Type                         | Default | Description             |
| ----------- | ---------------------------- | ------- | ----------------------- |
| `className` | `string`                     | —       | Additional CSS classes. |
| `...`       | All standard HTML attributes | —       |                         |

### Modal.Close

| Prop        | Type                                 | Default    | Description                                                                                     |
| ----------- | ------------------------------------ | ---------- | ----------------------------------------------------------------------------------------------- |
| `className` | `string`                             | —          | Additional CSS classes.                                                                         |
| `size`      | `'small'` \| `'medium'` \| `'large'` | `'large'`  | Size of the close button (only applies to 'floating' variant).                                  |
| `variant`   | `'delete'` \| `'floating'`           | `'delete'` | Button variant. 'delete' (default) for modal card headers, 'floating' for overlay close button. |
| `...`       | All standard `<button>` attributes   | —          |                                                                                                 |

<!-- /bestax:generated props -->

### Compound component props

| Component          | Description                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Modal.Background` | Modal background overlay (supports onClick)                                                                                                                  |
| `Modal.Content`    | Modal content wrapper                                                                                                                                        |
| `Modal.Card`       | Modal card wrapper                                                                                                                                           |
| `Modal.Card.Head`  | Modal card header                                                                                                                                            |
| `Modal.Card.Title` | Modal card title                                                                                                                                             |
| `Modal.Card.Body`  | Modal card body                                                                                                                                              |
| `Modal.Card.Foot`  | Modal card footer                                                                                                                                            |
| `Modal.Close`      | Modal close button. Props: `variant` ('delete' [default] for card headers, 'floating' for overlay), `size` ('small', 'medium', 'large') for floating variant |

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Modal` registers these variables on its own `.modal` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                | Sass Variable                        | Default                                                                                  |
| ------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------- |
| `--bulma-modal-z`                           | `$modal-z`                           | `40`                                                                                     |
| `--bulma-modal-background-background-color` | `$modal-background-background-color` | `hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-invert-l), 0.86)` |
| `--bulma-modal-content-width`               | `$modal-content-width`               | `40rem`                                                                                  |
| `--bulma-modal-content-margin-mobile`       | `$modal-content-margin-mobile`       | `1.25rem`                                                                                |
| `--bulma-modal-content-spacing-mobile`      | `$modal-content-spacing-mobile`      | `10rem`                                                                                  |
| `--bulma-modal-content-spacing-tablet`      | `$modal-content-spacing-tablet`      | `2.5rem`                                                                                 |
| `--bulma-modal-close-dimensions`            | `$modal-close-dimensions`            | `2.5rem`                                                                                 |
| `--bulma-modal-close-right`                 | `$modal-close-right`                 | `1.25rem`                                                                                |
| `--bulma-modal-close-top`                   | `$modal-close-top`                   | `1.25rem`                                                                                |
| `--bulma-modal-card-spacing`                | `$modal-card-spacing`                | `2.5rem`                                                                                 |
| `--bulma-modal-card-head-background-color`  | `$modal-card-head-background-color`  | `var(--bulma-scheme-main)`                                                               |
| `--bulma-modal-card-head-padding`           | `$modal-card-head-padding`           | `2rem`                                                                                   |
| `--bulma-modal-card-head-radius`            | `$modal-card-head-radius`            | `var(--bulma-radius-large)`                                                              |
| `--bulma-modal-card-title-color`            | `$modal-card-title-color`            | `var(--bulma-text-strong)`                                                               |
| `--bulma-modal-card-title-line-height`      | `$modal-card-title-line-height`      | `1`                                                                                      |
| `--bulma-modal-card-title-size`             | `$modal-card-title-size`             | `var(--bulma-size-4)`                                                                    |
| `--bulma-modal-card-foot-background-color`  | `$modal-card-foot-background-color`  | `var(--bulma-scheme-main-bis)`                                                           |
| `--bulma-modal-card-foot-radius`            | `$modal-card-foot-radius`            | `var(--bulma-radius-large)`                                                              |
| `--bulma-modal-card-body-background-color`  | `$modal-card-body-background-color`  | `var(--bulma-scheme-main)`                                                               |
| `--bulma-modal-card-body-padding`           | `$modal-card-body-padding`           | `2rem`                                                                                   |

<!-- /bestax:generated cssvars -->
