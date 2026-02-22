---
title: Snackbar
sidebar_label: Snackbar
---

# Snackbar

## Overview

The `Snackbar` component provides bottom-aligned notification messages with an optional action button. Snackbars are ideal for user feedback after actions and typically include an undo option.

:::info
The Snackbar component requires importing the extras CSS. See the [Extras Setup Guide](../../guides/getting-started/using-extras.md) for installation instructions.
:::

---

## Import

```tsx
import { Snackbar, SnackbarContainer, snackbar } from '@allxsmith/bestax-bulma';

// Also import the extras CSS
import '@allxsmith/bestax-bulma/dist/extras.css';
```

---

## Props

| Prop         | Type                                                                | Default     | Description                                          |
| ------------ | ------------------------------------------------------------------- | ----------- | ---------------------------------------------------- |
| `message`    | `string`                                                            | —           | The message to display (required).                   |
| `type`       | `'default'` \| `'success'` \| `'danger'` \| `'warning'` \| `'info'` | `'default'` | Color variant of the snackbar.                       |
| `position`   | `'left'` \| `'center'` \| `'right'`                                 | `'center'`  | Horizontal position.                                 |
| `duration`   | `number`                                                            | `4000`      | Duration in ms before auto-close. 0 = no auto-close. |
| `onClose`    | `() => void`                                                        | —           | Callback when snackbar closes.                       |
| `actionText` | `string`                                                            | —           | Text for the action button.                          |
| `onAction`   | `() => void`                                                        | —           | Callback when action button is clicked.              |
| `cancelable` | `boolean`                                                           | `true`      | Whether the snackbar can be dismissed.               |
| `className`  | `string`                                                            | —           | Additional CSS classes.                              |
| `ref`        | `React.Ref<HTMLElement>`                                            | —           | Ref forwarded to the snackbar element.               |
| ...          | All standard HTML and Bulma helper props                            |             | (See [Helper Props](../helpers/usebulmaclasses))     |

---

## Usage

### Basic Snackbar

A simple snackbar notification.

```tsx live
function example() {
  const [showSnackbar, setShowSnackbar] = useState(false);
  return (
    <div>
      <Button onClick={() => setShowSnackbar(true)}>Show Snackbar</Button>
      {showSnackbar && (
        <Snackbar
          message="Changes saved successfully"
          onClose={() => setShowSnackbar(false)}
        />
      )}
    </div>
  );
}
```

---

### With Action Button

Snackbar with an undo action.

```tsx live
function example() {
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [message, setMessage] = useState('');

  const handleDelete = () => {
    setMessage('Item deleted');
    setShowSnackbar(true);
  };

  const handleUndo = () => {
    setMessage('Item restored');
    setShowSnackbar(true);
  };

  return (
    <div>
      <Button color="danger" onClick={handleDelete}>
        Delete Item
      </Button>
      {showSnackbar && (
        <Snackbar
          message={message}
          actionText="Undo"
          onAction={handleUndo}
          onClose={() => setShowSnackbar(false)}
        />
      )}
    </div>
  );
}
```

---

### Snackbar Types

Different snackbar types for various contexts.

```tsx live
function example() {
  const [snackbarType, setSnackbarType] = useState(null);
  return (
    <div>
      <div className="buttons">
        <Button color="success" onClick={() => setSnackbarType('success')}>
          Success
        </Button>
        <Button color="danger" onClick={() => setSnackbarType('danger')}>
          Danger
        </Button>
        <Button color="warning" onClick={() => setSnackbarType('warning')}>
          Warning
        </Button>
        <Button color="info" onClick={() => setSnackbarType('info')}>
          Info
        </Button>
      </div>
      {snackbarType && (
        <Snackbar
          message={`This is a ${snackbarType} message!`}
          type={snackbarType}
          onClose={() => setSnackbarType(null)}
        />
      )}
    </div>
  );
}
```

---

### Position Variants

Snackbar can be positioned left, center, or right.

```tsx live
function example() {
  const [position, setPosition] = useState(null);
  return (
    <div>
      <div className="buttons">
        <Button onClick={() => setPosition('left')}>Left</Button>
        <Button onClick={() => setPosition('center')}>Center</Button>
        <Button onClick={() => setPosition('right')}>Right</Button>
      </div>
      {position && (
        <Snackbar
          message={`Position: ${position}`}
          position={position}
          type="info"
          onClose={() => setPosition(null)}
        />
      )}
    </div>
  );
}
```

---

## Programmatic API

For showing snackbars from anywhere in your app, use the programmatic API.

### Setup

Add the `SnackbarContainer` once at your app root:

```tsx title="src/App.tsx"
import { SnackbarContainer } from '@allxsmith/bestax-bulma';

function App() {
  return (
    <>
      <YourRoutes />
      <SnackbarContainer />
    </>
  );
}
```

### API Methods

```tsx
import { snackbar } from '@allxsmith/bestax-bulma';

// Show different snackbar types
snackbar.success('Saved successfully!');
snackbar.danger('Failed to save');
snackbar.warning('Connection unstable');
snackbar.info('New version available');

// Show with action
snackbar.show({
  message: 'Email archived',
  actionText: 'Undo',
  onAction: () => restoreEmail(),
});

// Close current snackbar
snackbar.close();

// Clear all queued snackbars
snackbar.clear();
```

### Queued Behavior

Unlike toasts, snackbars queue up and display one at a time:

```tsx
// These will show sequentially, not simultaneously
snackbar.success('First message');
snackbar.info('Second message'); // Shows after first closes
snackbar.warning('Third message'); // Shows after second closes
```

---

## Accessibility

- Uses `role="status"` for screen reader announcement
- Has `aria-live="polite"` for non-intrusive notifications
- Action button is keyboard accessible
- Escape key closes the snackbar

---

## Related Components

- [Toast](./toast.md) - For multiple simultaneous notifications
- [Dialog](./dialog.md) - For confirmation dialogs

---

## Additional Resources

- [Storybook: Snackbar Stories](https://bestax.io/storybook/?path=/story/components-snackbar)

:::tip Pro Tip
Snackbars are queued automatically, so you can call `snackbar.show()` multiple times without worrying about overlapping messages.
:::
