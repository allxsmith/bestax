---
title: Message
sidebar_label: Message
---

# Message

## Overview

The `Message` component provides Bulma's flexible notice/message box for your Bulma React UI. It supports color, optional headers, close buttons, custom content, and Bulma helper classes for text/background. Use it for inline feedback, status messages, alerts, or general notifications.

:::info
Supports Bulma color modifiers, sizes, and both header/body sections. The close button is optional and triggers your `onClose` callback.
:::

---

## Import

```tsx
import { Message } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                                                                                                                                                                                                                                                                     | Default | Description                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------ |
| `color`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`                                                                                                                                                                                                          | —       | Bulma color modifier for the message.            |
| `title`     | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | Title string/node (renders header section).      |
| `onClose`   | `() => void`                                                                                                                                                                                                                                                                             | —       | Callback for the close ("X") button.             |
| `textColor` | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Text color for the message (Bulma helper).       |
| `bgColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Background color for the message (Bulma helper). |
| `className` | `string`                                                                                                                                                                                                                                                                                 | —       | Additional CSS classes.                          |
| `children`  | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | Body content for the message.                    |
| ...         | All standard HTML and Bulma helper props (see [Helper Props](../helpers/usebulmaclasses))                                                                                                                                                                                                |         | Utility and accessibility props.                 |

---

## Usage

### Message with Header (per color)

```tsx live
<>
  <Message color="primary" title="Primary">
    This is a primary message.
  </Message>
  <Message color="link" title="Link">
    This is a link message.
  </Message>
  <Message color="info" title="Info">
    This is an info message.
  </Message>
  <Message color="success" title="Success">
    This is a success message.
  </Message>
  <Message color="warning" title="Warning">
    This is a warning message.
  </Message>
  <Message color="danger" title="Danger">
    This is a danger message.
  </Message>
</>
```

---

### Message Body Only (no header)

```tsx live
<>
  <Message color="primary">This is a primary message with no header.</Message>
  <Message color="danger">This is a danger message with no header.</Message>
</>
```

---

### Dismissible Message

```tsx live
function example() {
  const [open, setOpen] = useState(true);

  return (
    <>
      {open && (
        <Message color="info" title="Dismiss Me" onClose={() => setOpen(false)}>
          You can close this message by clicking the X button.
        </Message>
      )}
    </>
  );
}
```

---

### Sizes

```tsx live
<>
  <Message title="Default Size">This is the default size message.</Message>
  <Message title="Small">This is a small message.</Message>
  <Message title="Medium">This is a medium message.</Message>
  <Message title="Large">This is a large message.</Message>
</>
```

---

## Accessibility

- The message is rendered as `<article class="message">`.
- If `onClose` is provided, a close button with `aria-label="delete"` is rendered.
- For optimal accessibility, use clear and descriptive titles/content.

:::note
Always provide a visible or accessible way to dismiss important, interruptive messages.
:::

---

## Related Components

- [`Notification`](../elements/notification.md): For simpler, single-box notifications.
- [Helper Props](../helpers/usebulmaclasses.md): All Bulma utility helpers can be used.

---

## Additional Resources

- [Bulma Message Documentation](https://bulma.io/documentation/components/message/)
- [Storybook: Message Stories](https://bestax.cc/storybook/?path=/story/components-message--primary)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Message />` for powerful utility-based styling.
:::
