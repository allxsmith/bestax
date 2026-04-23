---
title: Snackbar
sidebar_label: Snackbar
---

# Snackbar

## Overview

The `Snackbar` component provides bottom-aligned notification messages with an optional action button. Snackbars are ideal for user feedback after actions and typically include an undo option.

---

## Import

```tsx
import { Snackbar, SnackbarContainer, snackbar } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop         | Type                                                                | Default     | Description                                          |
| ------------ | ------------------------------------------------------------------- | ----------- | ---------------------------------------------------- |
| `message`    | `string`                                                            | —           | The message to display (required).                   |
| `type`       | `'default'` \| `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | `'default'` | Color type for the action button.                    |
| `position`   | `'top-left'` \| `'top'` \| `'top-right'` \| `'bottom-left'` \| `'bottom'` \| `'bottom-right'` | `'bottom-right'` | Position on the screen.                          |
| `duration`   | `number`                                                            | `4000`      | Duration in ms before auto-close. 0 = no auto-close. |
| `onClose`    | `() => void`                                                        | —           | Callback when snackbar closes.                       |
| `actionText` | `string`                                                            | —           | Text for the action button.                          |
| `onAction`   | `() => void`                                                        | —           | Callback when action button is clicked.              |
| `cancelable` | `boolean`                                                           | `true`      | Whether the snackbar can be dismissed.               |
| `className`  | `string`                                                            | —           | Additional CSS classes.                              |
| `ref`        | `React.Ref<HTMLElement>`                                            | —           | Ref forwarded to the snackbar element.               |
| `color`      | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` | — | Background color of the snackbar. |
| `indefinite` | `boolean`                                                           | `false`     | Keeps the snackbar visible indefinitely (ignores `duration`). |
| `pauseOnHover` | `boolean`                                                         | `true`      | Pauses the auto-dismiss timer while hovering.        |
| `cancelText` | `string`                                                            | —           | Text for the cancel/close button.                    |
| `container`  | `string \| HTMLElement`                                             | —           | CSS selector or DOM node to mount the snackbar into. |
| `dismissible` | `boolean`                                                          | `false`     | Allows dismissing with a click anywhere on the snackbar. |
| `rounded`    | `boolean`                                                           | `false`     | Applies rounded corners.                             |
| `inline`     | `boolean`                                                           | `false`     | Renders inline instead of using a portal.            |
| ...          | All standard HTML and Bulma helper props                            |             | (See [Helper Props](../helpers/usebulmaclasses))     |

---

## Usage

### Basic Snackbar

A simple snackbar notification.

```tsx live
function example() {
  const [showSnackbar, setShowSnackbar] = useState(false);
  return (
    <Block>
      <Button onClick={() => setShowSnackbar(true)}>Show Snackbar</Button>
      {showSnackbar && (
        <Snackbar
          message="Changes saved successfully"
          onClose={() => setShowSnackbar(false)}
        />
      )}
    </Block>
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
    <Block>
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
    </Block>
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
    <Block>
      <Buttons>
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
      </Buttons>
      {snackbarType && (
        <Snackbar
          message={`This is a ${snackbarType} message!`}
          type={snackbarType}
          onClose={() => setSnackbarType(null)}
        />
      )}
    </Block>
  );
}
```

---

### Position Variants

Snackbar can be positioned in six locations on the screen.

```tsx live
function example() {
  const [position, setPosition] = useState(null);
  return (
    <Block>
      <Buttons>
        <Button onClick={() => setPosition('top-left')}>Top Left</Button>
        <Button onClick={() => setPosition('top')}>Top</Button>
        <Button onClick={() => setPosition('top-right')}>Top Right</Button>
      </Buttons>
      <Buttons>
        <Button onClick={() => setPosition('bottom-left')}>Bottom Left</Button>
        <Button onClick={() => setPosition('bottom')}>Bottom</Button>
        <Button onClick={() => setPosition('bottom-right')}>Bottom Right</Button>
      </Buttons>
      {position && (
        <Snackbar
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
