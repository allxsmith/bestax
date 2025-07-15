---
title: Notification
sidebar_label: Notification
---

# Notification

## Overview

The `Notification` component is a Bulma-styled alert/message area for providing feedback, warnings, or information to users. It supports color themes, light variants, an optional close (delete) button, custom content, and all Bulma helper props for spacing, etc.

:::info
Notifications are perfect for status updates, alerts, and dismissible feedback in your UI.
:::

---

## Import

```tsx
import { Notification } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                             | Default | Description                                        |
| ----------- | ------------------------------------------------ | ------- | -------------------------------------------------- |
| `className` | `string`                                         | —       | Additional CSS classes.                            |
| `color`     | `Bulma color` (e.g. `'primary'`, `'info'`, etc.) | —       | Bulma color modifier for the notification.         |
| `isLight`   | `boolean`                                        | —       | Use the light color variant.                       |
| `hasDelete` | `boolean`                                        | —       | Shows a close (delete) button in the notification. |
| `onDelete`  | `() => void`                                     | —       | Callback fired when the delete button is clicked.  |
| `children`  | `React.ReactNode`                                | —       | Content inside the notification.                   |
| ...         | All standard `<div>` and Bulma helper props      |         | (See [Helper Props](../helpers/usebulmaclasses))   |

---

## Usage

### Default Notification

```tsx live
<Notification>This is a default notification.</Notification>
```

### Primary Notification

```tsx live
<Notification color="primary">This is a primary notification.</Notification>
```

### Light Variant

```tsx live
<Notification color="primary" isLight>
  This is a light primary notification.
</Notification>
```

### Success, Warning, Danger, Info, and Link

```tsx live
<>
  <Notification color="success">This is a success notification.</Notification>
  <Notification color="warning">This is a warning notification.</Notification>
  <Notification color="danger">This is a danger notification.</Notification>
  <Notification color="info">This is an info notification.</Notification>
  <Notification color="link">This is a link notification.</Notification>
</>
```

### With Dismiss Button

```tsx live
function example() {
  const [visible, setVisible] = React.useState(true);

  return (
    <>
      {visible && (
        <Notification hasDelete onDelete={() => setVisible(false)}>
          Click the delete button to dismiss this notification.
        </Notification>
      )}
    </>
  );
}
```

### With Margin

```tsx live
<Notification m="4">This notification has a margin.</Notification>
```

### Custom Content

```tsx live
<Notification color="warning">
  <strong>Warning!</strong> This notification contains{' '}
  <a href="#">custom content</a>.
</Notification>
```

---

## Accessibility

- **Delete button:** Includes `aria-label="Close notification"` for screen readers.
- **Keyboard:** The delete button is focusable and can be activated by keyboard.
- **Content:** Use semantic HTML within the notification for best accessibility.

:::tip
Always provide clear, actionable text inside notifications.
:::

---

## Related Components

- [`Delete`](./delete.md): The close button used in notifications.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Bulma Notification Documentation](https://bulma.io/documentation/elements/notification/)
- [Storybook: Notification Stories](https://bestax.cc/storybook/?path=/story/elements-notification--default)
