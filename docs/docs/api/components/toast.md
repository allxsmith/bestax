---
title: Toast
sidebar_label: Toast
---

# Toast

## Overview

The `Toast` component provides brief notification messages with optional action and cancel buttons. Toasts are non-blocking and ideal for success messages, warnings, undo prompts, or general feedback.

---

## Import

```tsx
import { Toast, ToastContainer, toast } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop           | Type                                                                                                        | Default       | Description                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------ |
| `message`      | `string`                                                                                                    | —             | The message to display (required).                           |
| `type`         | `'default'` \| `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`              | `'default'`   | Color variant — colors the toast **background**.             |
| `actionType`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`                             | —             | Color variant — colors the **action button** text.           |
| `position`     | `'top-right'` \| `'top-left'` \| `'top-center'` \| `'bottom-right'` \| `'bottom-left'` \| `'bottom-center'` | `'top-right'` | Position on the screen.                                      |
| `duration`     | `number`                                                                                                    | `2000`        | Duration in ms before auto-close. `0` disables auto-close.   |
| `indefinite`   | `boolean`                                                                                                   | `false`       | Keeps the toast visible until dismissed.                     |
| `dismissible`  | `boolean`                                                                                                   | `true`        | Whether clicking the toast (or outside it) dismisses it.     |
| `closable`     | `boolean`                                                                                                   | `false`       | Show an explicit close (X) button.                           |
| `pauseOnHover` | `boolean`                                                                                                   | `false`       | Pause auto-close timer on hover.                             |
| `cancelable`   | `boolean`                                                                                                   | `true`        | Whether the toast can be dismissed with Escape.              |
| `actionText`   | `string`                                                                                                    | —             | Text for an action button (e.g. "Undo").                     |
| `cancelText`   | `string`                                                                                                    | —             | Text for a cancel button.                                    |
| `onAction`     | `() => void`                                                                                                | —             | Callback when the action button is clicked.                  |
| `onClose`      | `() => void`                                                                                                | —             | Callback when toast closes.                                  |
| `rounded`      | `boolean`                                                                                                   | `false`       | Pill-shaped (rounded corners).                               |
| `container`    | `string \| HTMLElement`                                                                                     | —             | CSS selector or DOM node to mount the toast into.            |
| `inline`       | `boolean`                                                                                                   | `false`       | Renders inline instead of using a portal.                    |
| `className`    | `string`                                                                                                    | —             | Additional CSS classes.                                      |
| `ref`          | `React.Ref<HTMLDivElement>`                                                                                 | —             | Ref forwarded to the toast element.                          |
| ...            | All standard HTML and Bulma helper props                                                                    |               | (See [Helper Props](../helpers/usebulmaclasses))             |

---

## Usage

:::tip Live Preview Only
The `inline` prop in the examples below is only there to render the toast inside the docs preview's shadow DOM. **Do not copy `inline`** — in your app, omit it and `Toast` will portal to `document.body` and float over the page automatically.
:::

### Basic Toast

A simple toast notification.

```tsx live
function example() {
  const [showToast, setShowToast] = useState(false);
  return (
    <Block>
      <Button color="primary" onClick={() => setShowToast(true)}>
        Show Toast
      </Button>
      {showToast && (
        <Toast
          inline
          message="This is a notification message!"
          duration={0}
          onClose={() => setShowToast(false)}
        />
      )}
    </Block>
  );
}
```

---

### Toast Types

`type` colors the toast background.

```tsx live
function example() {
  const [toastType, setToastType] = useState(null);
  return (
    <Block>
      <Buttons>
        <Button color="success" onClick={() => setToastType('success')}>
          Success
        </Button>
        <Button color="danger" onClick={() => setToastType('danger')}>
          Danger
        </Button>
        <Button color="warning" onClick={() => setToastType('warning')}>
          Warning
        </Button>
        <Button color="info" onClick={() => setToastType('info')}>
          Info
        </Button>
      </Buttons>
      {toastType && (
        <Toast
          inline
          message={`This is a ${toastType} message!`}
          type={toastType}
          duration={0}
          onClose={() => setToastType(null)}
        />
      )}
    </Block>
  );
}
```

---

### Toast Positions

Toast can appear in any of six positions. (The `transform` on the wrapper is a docs-only trick that scopes the toast's `position: fixed` to the example box; in your app, omit the wrapper.)

```tsx live
function example() {
  const [position, setPosition] = useState(null);
  const [box, setBox] = useState(null);
  return (
    <div
      ref={setBox}
      style={{
        position: 'relative',
        height: '300px',
        transform: 'translateZ(0)',
        border: '1px dashed var(--ifm-color-emphasis-300)',
        padding: '1rem',
      }}
    >
      <Buttons>
        <Button onClick={() => setPosition('top-left')}>Top Left</Button>
        <Button onClick={() => setPosition('top-center')}>Top Center</Button>
        <Button onClick={() => setPosition('top-right')}>Top Right</Button>
      </Buttons>
      <Buttons>
        <Button onClick={() => setPosition('bottom-left')}>Bottom Left</Button>
        <Button onClick={() => setPosition('bottom-center')}>
          Bottom Center
        </Button>
        <Button onClick={() => setPosition('bottom-right')}>
          Bottom Right
        </Button>
      </Buttons>
      {position && box && (
        <Toast
          container={box}
          message={`Position: ${position}`}
          position={position}
          type="info"
          duration={0}
          onClose={() => setPosition(null)}
        />
      )}
    </div>
  );
}
```

---

### Action Button

Add an action button (e.g. "Undo"). `actionType` colors the action button text.

```tsx live
function example() {
  const [showToast, setShowToast] = useState(false);
  return (
    <Block>
      <Button color="primary" onClick={() => setShowToast(true)}>
        Show Toast with Action
      </Button>
      {showToast && (
        <Toast
          inline
          message="Item deleted"
          actionText="Undo"
          actionType="info"
          onAction={() => alert('Undone!')}
          duration={0}
          onClose={() => setShowToast(false)}
        />
      )}
    </Block>
  );
}
```

---

### Cancel + Action Buttons

Combine cancel and action buttons for a confirm-style toast.

```tsx live
function example() {
  const [showToast, setShowToast] = useState(false);
  return (
    <Block>
      <Button color="primary" onClick={() => setShowToast(true)}>
        Show Confirm Toast
      </Button>
      {showToast && (
        <Toast
          inline
          message="Are you sure you want to proceed?"
          cancelText="Cancel"
          actionText="Confirm"
          actionType="danger"
          duration={0}
          onAction={() => alert('Confirmed!')}
          onClose={() => setShowToast(false)}
        />
      )}
    </Block>
  );
}
```

---

### Closable

Show an explicit close (X) button alongside the message.

```tsx live
function example() {
  const [showToast, setShowToast] = useState(false);
  return (
    <Block>
      <Button color="primary" onClick={() => setShowToast(true)}>
        Show Closable Toast
      </Button>
      {showToast && (
        <Toast
          inline
          message="This toast has a close button"
          closable
          duration={0}
          onClose={() => setShowToast(false)}
        />
      )}
    </Block>
  );
}
```

---

### Indefinite

Stay open until the user dismisses it.

```tsx live
function example() {
  const [showToast, setShowToast] = useState(false);
  return (
    <Block>
      <Button onClick={() => setShowToast(true)}>Show Indefinite Toast</Button>
      {showToast && (
        <Toast
          inline
          message="This won't auto-dismiss"
          indefinite
          onClose={() => setShowToast(false)}
        />
      )}
    </Block>
  );
}
```

---

## Programmatic API

For showing toasts from anywhere in your app, use the programmatic API.

### Setup

Add the `ToastContainer` once at your app root:

```tsx title="src/App.tsx"
import { ToastContainer } from '@allxsmith/bestax-bulma';

function App() {
  return (
    <>
      <YourRoutes />
      <ToastContainer position="top-right" />
    </>
  );
}
```

### API Methods

```tsx
import { toast } from '@allxsmith/bestax-bulma';

// Show different toast types
toast.success('Operation successful!');
toast.danger('Something went wrong');
toast.warning('Please review your changes');
toast.info('New message received');

// Show with options
toast.show({
  message: 'Custom toast',
  type: 'primary',
  duration: 5000,
  position: 'bottom-center',
});

// Show with action
toast.show({
  message: 'File moved to trash',
  actionText: 'Undo',
  actionType: 'info',
  onAction: () => restoreFile(),
});

// Queued toasts display one at a time (FIFO)
toast.show({ message: 'Step 1', queue: true });
toast.show({ message: 'Step 2', queue: true });

// Close specific toast
const id = toast.success('Hello');
toast.close(id);

// Close all toasts
toast.closeAll();
```

---

## Accessibility

- Uses `role="alert"` for screen reader announcement.
- Has `aria-live="polite"` for non-intrusive notifications.
- The closable button has `aria-label="Close"`.
- `pauseOnHover` lets users keep the toast visible while reading.
- `cancelable` (default `true`) supports Escape-key dismiss.

---

## Related Components

- [Dialog](./dialog.md) - For confirmation dialogs.

---

## Additional Resources

- [Storybook: Toast Stories](https://bestax.io/storybook/?path=/story/components-toast)

:::tip Pro Tip
Use the programmatic `toast` API for showing notifications from event handlers or async operations without managing state.
:::
