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

The default usage of the `Notification` component displays a simple alert box for status messages, feedback, or information. Use this for general notifications that don't require color coding.

```tsx live
<Notification>This is a default notification.</Notification>
```

### Primary Notification

To emphasize important messages, set the `color` prop to `primary`. This applies the Bulma primary color styling, making the notification stand out for high-priority information. Use `color` with values like `primary`, `info`, `success`, `warning`, or `danger` to match the context of your message.

```tsx live
<Notification color="primary">This is a primary notification.</Notification>
```

### Light Variant

For a softer, less prominent notification, add the `isLight` prop. This creates a pastel version of the chosen `color`, ideal for subtle alerts or background information that should not dominate the interface but still be color-coded.

```tsx live
<Notification color="primary" isLight>
  This is a light primary notification.
</Notification>
```

### Success, Warning, Danger, Info, and Link

You can use the `color` prop with values like `success`, `warning`, `danger`, `info`, or `link` to visually differentiate notifications based on their purpose. This helps users quickly recognize the type of message being displayed.

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

To make notifications dismissible, set the `hasDelete` prop to show a close button. Combine with the `onDelete` callback to control visibility, such as hiding the notification when the button is clicked. This pattern is useful for temporary alerts or feedback that users can clear from the interface.

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

You can apply Bulma helper props such as `m` (margin) directly to the `Notification` component. For example, `m="4"` adds a margin of 4 units, allowing you to control spacing around notifications for better layout and visual separation.

```tsx live
<Notification m="4">This notification has a margin.</Notification>
```

### Custom Content

The `Notification` component supports any custom content as its children. You can include elements like `<strong>`, links, or other inline components to create rich, informative messages tailored to your application's needs.

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
- [Storybook: Notification Stories](https://bestax.io/storybook/?path=/story/elements-notification--default)
