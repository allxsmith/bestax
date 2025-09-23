---
title: Delete
sidebar_label: Delete
---

# Delete

## Overview

The `Delete` component provides a Bulma-styled close/delete button for dismissing modals, notifications, tags, messages, and more. It supports all Bulma size and color helpers, and includes accessibility best practices.

:::info
This component is ideal for adding a visually consistent, accessible close button to any Bulma-styled element.
:::

---

## Import

```tsx
import { Delete } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                                                                                                                                                                                                                                                                     | Default   | Description                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------ |
| `className` | `string`                                                                                                                                                                                                                                                                                 | —         | Additional CSS classes.                          |
| `textColor` | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —         | Text color helper.                               |
| `color`     | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger'`                                                                                                                                                                                                                    | —         | Bulma color modifier for the button.             |
| `bgColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —         | Background color helper.                         |
| `size`      | `'small' \| 'medium' \| 'large'`                                                                                                                                                                                                                                                         | —         | Size modifier for the delete button.             |
| `onClick`   | `(event: React.MouseEvent<HTMLButtonElement>) => void`                                                                                                                                                                                                                                   | —         | Click handler for the button.                    |
| `ariaLabel` | `string`                                                                                                                                                                                                                                                                                 | `'Close'` | ARIA label for accessibility.                    |
| `disabled`  | `boolean`                                                                                                                                                                                                                                                                                | `false`   | Whether the button is disabled.                  |
| ...         | All standard `<button>` and Bulma helper props                                                                                                                                                                                                                                           |           | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Default Delete

The default usage of the `Delete` component renders a Bulma-styled close button. Use this for dismissing modals, notifications, tags, or any element that needs a consistent close/delete action.

```tsx live
<Delete />
```

### Small, Medium, Large

The `size` prop allows you to adjust the button size. Use `size="small"`, `size="medium"`, or `size="large"` to match the context of your UI.

```tsx live
<>
  <Delete size="small" />
  <Delete size="medium" />
  <Delete size="large" />
</>
```

### Disabled

The `disabled` prop disables the button, making it non-interactive and visually muted. Use this when the close action should be temporarily unavailable.

```tsx live
<Delete disabled />
```

### With Custom Class

Add your own CSS classes with the `className` prop to further customize the delete button's appearance or behavior.

```tsx live
<Delete className="custom-delete" />
```

### With Text Color

Set the text color using the `textColor` prop. For example, `textColor="primary"` applies Bulma's primary color to the button.

```tsx live
<Delete textColor="primary" />
```

### With Background Color

Apply a background color using the `bgColor` prop. Here, `bgColor="info"` gives the button a colored background.

```tsx live
<Delete bgColor="info" />
```

### With Margin

You can use Bulma spacing helpers like `m` to add margin around the button for better layout control.

```tsx live
<Delete m="2" />
```

### In a Tag

The `Delete` component is often used inside a `Tag` for removable labels. This example shows a small, colored delete button inside a tag.

```tsx live
<span className="tag is-info is-medium">
  Example Tag
  <Delete size="small" textColor="danger" ariaLabel="Remove tag" />
</span>
```

### In a Notification

Use the `Delete` component inside a `Notification` to provide a dismiss action for alerts or messages.

```tsx live
<div className="notification is-primary">
  <Delete bgColor="warning" ariaLabel="Close notification" />
  <p>This is a primary notification with a delete button.</p>
</div>
```

### In a Message Header

The `Delete` component can be placed in a message header for dismissible messages. Combine with spacing and color props for best results.

```tsx live
<article className="message is-success">
  <div className="message-header">
    <p>Success Message</p>
    <Delete m="1" textColor="dark" ariaLabel="Close message" />
  </div>
  <div className="message-body">
    This is a success message with a delete button in the header.
  </div>
</article>
```

---

## Accessibility

- **ARIA label:** Always set a meaningful `ariaLabel` for screen readers (default is `'Close'`).
- **Keyboard:** The button is focusable and supports keyboard activation.
- **Disabled:** Uses both `disabled` and Bulma’s `is-disabled` for proper styling and accessibility.

:::tip
For custom close actions, use the `onClick` prop.
:::

---

## Related Components

- [`Notification`](../elements/notification.md): For dismissible alerts.
- [`Tag`](../elements/tag.md): For removable tag UI.
- [`Message`](../components/message.md): For dismissible messages.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Bulma Delete Documentation](https://bulma.io/documentation/elements/delete/)
- [Storybook: Delete Stories](https://bestax.io/storybook/?path=/story/elements-delete--default)
