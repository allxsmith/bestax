---
title: Toast
sidebar_label: Toast
---

# Toast

## Overview

The `Toast` component provides brief notification messages that appear and disappear automatically. Toasts are non-blocking and ideal for success messages, warnings, or general feedback.

:::info
See the [Extras Setup Guide](../../guides/getting-started/using-extras.md) for installation instructions.
:::

---

## Import

```tsx
import { Toast, ToastContainer, toast } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop           | Type                                                                                                        | Default       | Description                                          |
| -------------- | ----------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------- |
| `message`      | `string`                                                                                                    | —             | The message to display (required).                   |
| `type`         | `'default'` \| `'success'` \| `'danger'` \| `'warning'` \| `'info'` \| `'primary'` \| `'link'`              | `'default'`   | Color variant of the toast.                          |
| `position`     | `'top-right'` \| `'top-left'` \| `'top-center'` \| `'bottom-right'` \| `'bottom-left'` \| `'bottom-center'` | `'top-right'` | Position on the screen.                              |
| `duration`     | `number`                                                                                                    | `2000`        | Duration in ms before auto-close. 0 = no auto-close. |
| `dismissible`  | `boolean`                                                                                                   | `true`        | Whether the toast can be dismissed.                  |
| `onClose`      | `() => void`                                                                                                | —             | Callback when toast closes.                          |
| `pauseOnHover` | `boolean`                                                                                                   | `false`       | Pause auto-close timer on hover.                     |
| `className`    | `string`                                                                                                    | —             | Additional CSS classes.                              |
| `ref`          | `React.Ref<HTMLElement>`                                                                                    | —             | Ref forwarded to the toast element.                  |
| `indefinite`   | `boolean`                                                                                                   | `false`       | Keeps the toast visible indefinitely.                |
| `cancelable`   | `boolean`                                                                                                   | `true`        | Allows dismissing by clicking outside.               |
| `container`    | `string \| HTMLElement`                                                                                     | —             | CSS selector or DOM node to mount the toast into.    |
| `inline`       | `boolean`                                                                                                   | `false`       | Renders inline instead of using a portal.            |
| `rounded`      | `boolean`                                                                                                   | `false`       | Applies rounded corners.                             |
| ...            | All standard HTML and Bulma helper props                                                                    |               | (See [Helper Props](../helpers/usebulmaclasses))     |

---

## Usage

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
          message="This is a notification message!"
          onClose={() => setShowToast(false)}
        />
      )}
    </Block>
  );
}
```

---

### Toast Types

Different toast types for various contexts.

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
          message={`This is a ${toastType} message!`}
          type={toastType}
          onClose={() => setToastType(null)}
        />
      )}
    </Block>
  );
}
```

---

### Toast Positions

Toast can appear in different positions on the screen.

```tsx live
function example() {
  const [position, setPosition] = useState(null);
  return (
    <Block>
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
      {position && (
        <Toast
          message={`Position: ${position}`}
          position={position}
          type="info"
          onClose={() => setPosition(null)}
        />
      )}
    </Block>
  );
}
```

---

### With Custom Duration

Toast with extended display time.

```tsx live
function example() {
  const [showToast, setShowToast] = useState(false);
  return (
    <Block>
      <Button onClick={() => setShowToast(true)}>
        Show Long Toast (10 seconds)
      </Button>
      {showToast && (
        <Toast
          message="This toast will stay for 10 seconds"
          duration={10000}
          type="warning"
          onClose={() => setShowToast(false)}
        />
      )}
    </Block>
  );
}
```

---

### Dismissible Toast

Toast that can be dismissed by clicking on it.

```tsx live
function example() {
  const [showToast, setShowToast] = useState(false);
  return (
    <Block>
      <Button onClick={() => setShowToast(true)}>Show Dismissible Toast</Button>
      {showToast && (
        <Toast
          message="Click to dismiss"
          type="warning"
          dismissible
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

// Close specific toast
const id = toast.success('Hello');
toast.close(id);

// Close all toasts
toast.closeAll();
```

---

## Accessibility

- Uses `role="alert"` for screen reader announcement
- Has `aria-live="polite"` for non-intrusive notifications
- Close button has `aria-label="Close"`
- Pause on hover allows users time to read

---

## Related Components

- [Snackbar](./snackbar.md) - For bottom notifications with actions
- [Dialog](./dialog.md) - For confirmation dialogs

---

## Additional Resources

- [Storybook: Toast Stories](https://bestax.io/storybook/?path=/story/components-toast)

:::tip Pro Tip
Use the programmatic `toast` API for showing notifications from event handlers or async operations without managing state.
:::
