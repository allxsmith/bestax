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

```tsx
<Delete />
```

### Small, Medium, Large

```tsx
<Delete size="small" />
<Delete size="medium" />
<Delete size="large" />
```

### Disabled

```tsx
<Delete disabled />
```

### With Custom Class

```tsx
<Delete className="custom-delete" />
```

### With Text Color

```tsx
<Delete textColor="primary" />
```

### With Background Color

```tsx
<Delete bgColor="info" />
```

### With Margin

```tsx
<Delete m="2" />
```

### In a Tag

```tsx
<span className="tag is-info is-medium">
  Example Tag
  <Delete size="small" textColor="danger" ariaLabel="Remove tag" />
</span>
```

### In a Notification

```tsx
<div className="notification is-primary">
  <Delete bgColor="warning" ariaLabel="Close notification" />
  <p>This is a primary notification with a delete button.</p>
</div>
```

### In a Message Header

```tsx
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
- [Storybook: Delete Stories](https://bestax.cc/storybook/?path=/story/elements-delete--default)
