---
title: Notification
sidebar_label: Notification
description: The `Notification` component is a Bulma-styled alert/message area for providing feedback, warnings, or information to users.
---

# Notification

## Overview

<!-- bestax:generated overview -->

The `Notification` component is a Bulma-styled alert/message area for providing feedback, warnings, or information to users.

<!-- /bestax:generated overview -->

It supports color themes, light variants, an optional close (delete) button, custom content, and all Bulma helper props for spacing, etc.

:::info
Notifications are perfect for status updates, alerts, and dismissible feedback in your UI.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import {
  Notification,
  NotificationContainer,
  notification,
} from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

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

Bulma puts the close button in the notification's top end corner, further in than its padding reaches, so on a narrow column the first line could run under it. With `hasDelete`, the notification pads its end by `--bulma-notification-delete-padding-inline-end` instead, room for the button and a gap, so the text wraps before it. A [`Delete`](./delete.md) you pass as a direct child gets the same room in browsers that support `:has()`, widened or narrowed to fit when you give it a `size`.

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
  <Strong>Warning!</Strong> This notification contains{' '}
  <Link href="#">custom content</Link>.
</Notification>
```

---

## Programmatic API

To show a notification from anywhere in your app, not just where you render one, use the `notification` API. It stacks the same Bulma notification over the page and dismisses it on its own. For the toast look instead, use [`toast`](../components/toast.md#programmatic-api).

### Setup

Render `NotificationContainer` once, near your app root:

```tsx title="src/App.tsx"
import { NotificationContainer } from '@allxsmith/bestax-bulma';

function App() {
  return (
    <>
      <YourRoutes />
      <NotificationContainer position="top-right" />
    </>
  );
}
```

The container's `position` (`top-left`, `top`, `top-right`, `bottom-left`, `bottom`, or `bottom-right`) places every notification shown without one. Pass `position` to `notification.show()` to put a notification somewhere else, and the container keeps a separate stack at each position in use. Queued notifications share one queue whatever their position, so a queued notification waits for the one on screen even when it's headed somewhere else.

### API Methods

```tsx
import { notification } from '@allxsmith/bestax-bulma';

// Show a colored notification
notification.success('Changes saved');
notification.danger('Something went wrong');
notification.warning('Please review your changes');
notification.info('A new version is available');

// Show with options
notification.show({
  message: 'Custom notification',
  color: 'primary',
  isLight: true,
  duration: 5000,
});

// Show one away from the container's position
notification.show({ message: 'Upload finished', position: 'bottom-left' });

// Queued notifications display one at a time (FIFO)
notification.show({ message: 'Step 1', queue: true });
notification.show({ message: 'Step 2', queue: true });

// Keep one open until you close it
const id = notification.show({ message: 'Uploading…', indefinite: true });
notification.close(id);

// Close all notifications
notification.closeAll();
```

Each helper takes the message first and any other options second.

---

## Accessibility

- **Delete button:** Includes `aria-label="Close notification"` for screen readers.
- **Keyboard:** The delete button is focusable and can be activated by keyboard.
- **Content:** Use semantic HTML within the notification for best accessibility.
- **Announcements:** A notification shown through `notification` announces its message. `danger` and `warning` announce themselves: the message carries `role="alert"` with `aria-live="assertive"`, which screen readers reliably announce even though it arrives with its text. The rest are announced politely through a visually hidden `role="status"` region that `NotificationContainer` keeps in the page from the moment it mounts, even with nothing showing, because a polite region that arrives already holding its text often isn't announced. A moment after one of those notifications appears, its message is written into the region, then cleared again shortly after.
- **Testing:** A polite notification's message doesn't carry `role="status"`, so `getByRole('status')` finds the container's region rather than the notification. Query the message text or `.notification` instead. A count or text [`Badge`](../components/badge.md) is a `role="status"` node too, so with both on the page `getByRole('status')` matches more than one: find the badge by its accessible name, or use `getAllByRole`. While a message is in the region, the page also holds a second copy of its text, so a test that advances the clock past the announcement and then looks the message up by text can find both, and can still find the region's copy for a moment after the notification closes. Scope that query to the notification, for example with `within`.

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

---

## Props

<!-- bestax:generated props -->

| Prop        | Type                                                                    | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------- | ----------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `className` | `string`                                                                | —       | Additional CSS classes to apply.                                                                                                                                                                                                                                                                                                                                                                                                     |
| `color`     | [Bulma color](../helpers/valid-values.md)                               | —       | Bulma color modifier for the notification (renders `is-<color>`). Only `primary`, `link`, `info`, `success`, `warning`, `danger`, `black`, `white`, `light`, and `dark` have shipped CSS for `.notification`. Every other value the union accepts emits a class no CSS rule matches, so the notification renders unstyled; those log a console warning in development and will be removed from this union in the next major version. |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `isLight`   | `boolean`                                                               | `false` | Use the light color variant.                                                                                                                                                                                                                                                                                                                                                                                                         |
| `hasDelete` | `boolean`                                                               | `false` | Shows a close (delete) button in the notification. It renders `type="button"`, so it does not submit a form around it. The notification also takes `has-delete`, which pads its end by `--bulma-notification-delete-padding-inline-end` so the text clears the button. That rule ships in bestax's stylesheets, not Bulma's, so an app styled by Bulma's CSS alone keeps Bulma's padding.                                            |
| `onDelete`  | `() => void`                                                            | —       | Callback fired when the delete button is clicked.                                                                                                                                                                                                                                                                                                                                                                                    |
| `children`  | `React.ReactNode`                                                       | —       | Content inside the notification.                                                                                                                                                                                                                                                                                                                                                                                                     |
| `...`       | All standard `<div>` attributes and Bulma helper props                  | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                    |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Notification` registers these variables on its own `.notification` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                     | Sass Variable                             | Default                          |
| ------------------------------------------------ | ----------------------------------------- | -------------------------------- |
| `--bulma-notification-delete-padding-inline-end` | `$notification-delete-padding-inline-end` | `calc(1rem + 1.25rem + 0.75rem)` |
| `--bulma-notification-h`                         | —                                         | `var(--bulma-scheme-h)`          |
| `--bulma-notification-s`                         | —                                         | `var(--bulma-scheme-s)`          |
| `--bulma-notification-background-l`              | —                                         | `var(--bulma-background-l)`      |
| `--bulma-notification-color-l`                   | —                                         | `var(--bulma-text-strong-l)`     |
| `--bulma-notification-code-background-color`     | `$notification-code-background-color`     | `var(--bulma-scheme-main)`       |
| `--bulma-notification-radius`                    | `$notification-radius`                    | `var(--bulma-radius)`            |
| `--bulma-notification-padding`                   | `$notification-padding`                   | `1.375em 1.5em`                  |

<!-- /bestax:generated cssvars -->
