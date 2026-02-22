---
title: Dialog
sidebar_label: Dialog
---

# Dialog

## Overview

The `Dialog` component provides confirmation and alert dialogs with customizable actions. Dialogs are modal and require user interaction before they can be dismissed.

:::info
The Dialog component requires importing the extras CSS. See the [Extras Setup Guide](../../guides/getting-started/using-extras.md) for installation instructions.
:::

---

## Import

```tsx
import { Dialog, DialogContainer, dialog } from '@allxsmith/bestax-bulma';

// Also import the extras CSS
import '@allxsmith/bestax-bulma/dist/extras.css';
```

---

## Props

| Prop          | Type                                                                | Default     | Description                                          |
| ------------- | ------------------------------------------------------------------- | ----------- | ---------------------------------------------------- |
| `isOpen`      | `boolean`                                                           | —           | Whether the dialog is open (required).               |
| `title`       | `string`                                                            | —           | Dialog title.                                        |
| `message`     | `string` \| `React.ReactNode`                                       | —           | Dialog message/content (required).                   |
| `type`        | `'default'` \| `'success'` \| `'danger'` \| `'warning'` \| `'info'` | `'default'` | Type/color of the dialog.                            |
| `confirmText` | `string`                                                            | `'OK'`      | Text for confirm button.                             |
| `cancelText`  | `string`                                                            | `'Cancel'`  | Text for cancel button.                              |
| `onConfirm`   | `() => void`                                                        | —           | Callback when confirm button is clicked.             |
| `onCancel`    | `() => void`                                                        | —           | Callback when cancel button is clicked or dismissed. |
| `showCancel`  | `boolean`                                                           | `true`      | Whether to show cancel button.                       |
| `canCancel`   | `boolean`                                                           | `true`      | Whether the dialog can be dismissed.                 |
| `focusCancel` | `boolean`                                                           | `false`     | Focus cancel button instead of confirm.              |
| `icon`        | `React.ReactNode`                                                   | —           | Custom icon to display.                              |
| `className`   | `string`                                                            | —           | Additional CSS classes.                              |
| `ref`         | `React.Ref<HTMLElement>`                                            | —           | Ref forwarded to the dialog element.                 |
| ...           | All standard HTML and Bulma helper props                            |             | (See [Helper Props](../helpers/usebulmaclasses))     |

---

## Usage

### Alert Dialog

A simple alert dialog with only a confirm button.

```tsx live
function example() {
  const [showDialog, setShowDialog] = useState(false);
  return (
    <div>
      <Button color="info" onClick={() => setShowDialog(true)}>
        Show Alert
      </Button>
      <Dialog
        isOpen={showDialog}
        title="Information"
        message="Your changes have been saved successfully."
        type="success"
        showCancel={false}
        onConfirm={() => setShowDialog(false)}
      />
    </div>
  );
}
```

---

### Confirm Dialog

A confirmation dialog with both confirm and cancel options.

```tsx live
function example() {
  const [showDialog, setShowDialog] = useState(false);
  const [result, setResult] = useState('');

  return (
    <div>
      <Button color="danger" onClick={() => setShowDialog(true)}>
        Delete Item
      </Button>
      <p className="mt-2">Result: {result}</p>
      <Dialog
        isOpen={showDialog}
        title="Delete Item?"
        message="This action cannot be undone. Are you sure you want to delete this item?"
        type="danger"
        confirmText="Delete"
        onConfirm={() => {
          setResult('Deleted');
          setShowDialog(false);
        }}
        onCancel={() => {
          setResult('Cancelled');
          setShowDialog(false);
        }}
      />
    </div>
  );
}
```

---

### Dialog Types

Different dialog types with matching icons.

```tsx live
function example() {
  const [dialogType, setDialogType] = useState(null);
  return (
    <div>
      <div className="buttons">
        <Button color="success" onClick={() => setDialogType('success')}>
          Success
        </Button>
        <Button color="danger" onClick={() => setDialogType('danger')}>
          Danger
        </Button>
        <Button color="warning" onClick={() => setDialogType('warning')}>
          Warning
        </Button>
        <Button color="info" onClick={() => setDialogType('info')}>
          Info
        </Button>
      </div>
      {dialogType && (
        <Dialog
          isOpen
          title={`${dialogType.charAt(0).toUpperCase() + dialogType.slice(1)} Dialog`}
          message={`This is a ${dialogType} dialog with an automatic icon.`}
          type={dialogType}
          onConfirm={() => setDialogType(null)}
          onCancel={() => setDialogType(null)}
        />
      )}
    </div>
  );
}
```

---

### With Rich Content

Dialog with custom React content.

```tsx live
function example() {
  const [showDialog, setShowDialog] = useState(false);
  return (
    <div>
      <Button onClick={() => setShowDialog(true)}>Show Terms</Button>
      <Dialog
        isOpen={showDialog}
        title="Terms of Service"
        message={
          <div>
            <p className="mb-2">By clicking "Accept", you agree to:</p>
            <ul>
              <li>Our terms of service</li>
              <li>Our privacy policy</li>
              <li>Receive email notifications</li>
            </ul>
          </div>
        }
        confirmText="Accept"
        cancelText="Decline"
        onConfirm={() => setShowDialog(false)}
        onCancel={() => setShowDialog(false)}
      />
    </div>
  );
}
```

---

### Non-cancelable Dialog

A dialog that must be confirmed (cannot be dismissed by clicking outside or pressing Escape).

```tsx live
function example() {
  const [showDialog, setShowDialog] = useState(false);
  return (
    <div>
      <Button color="warning" onClick={() => setShowDialog(true)}>
        Show Required Action
      </Button>
      <Dialog
        isOpen={showDialog}
        title="Required Action"
        message="You must complete this action to continue."
        type="warning"
        canCancel={false}
        showCancel={false}
        confirmText="I Understand"
        onConfirm={() => setShowDialog(false)}
      />
    </div>
  );
}
```

---

## Programmatic API

For showing dialogs from anywhere in your app, use the programmatic API.

### Setup

Add the `DialogContainer` once at your app root:

```tsx title="src/App.tsx"
import { DialogContainer } from '@allxsmith/bestax-bulma';

function App() {
  return (
    <>
      <YourRoutes />
      <DialogContainer />
    </>
  );
}
```

### API Methods

```tsx
import { dialog } from '@allxsmith/bestax-bulma';

// Show alert (returns Promise<void>)
await dialog.alert('Something happened!');
await dialog.alert({
  title: 'Success',
  message: 'Operation completed!',
  type: 'success',
});

// Show confirm (returns Promise<boolean>)
const confirmed = await dialog.confirm('Are you sure?');
const confirmed = await dialog.confirm({
  title: 'Delete Item?',
  message: 'This action cannot be undone.',
  type: 'danger',
  confirmText: 'Delete',
});

if (confirmed) {
  // User clicked confirm
  deleteItem();
}
```

### Async/Await Usage

```tsx
async function handleDelete() {
  const confirmed = await dialog.confirm({
    title: 'Delete Item?',
    message: 'This action cannot be undone.',
    type: 'danger',
    confirmText: 'Delete',
  });

  if (confirmed) {
    await deleteItem();
    await dialog.alert({
      title: 'Deleted',
      message: 'Item was deleted successfully.',
      type: 'success',
    });
  }
}
```

---

## Accessibility

- Uses `role="alertdialog"` for proper screen reader announcement
- Has `aria-modal="true"` to indicate modal behavior
- Focus is trapped within the dialog when open
- Escape key closes the dialog (when `canCancel` is true)
- Body scroll is prevented when dialog is open
- Confirm/cancel buttons are keyboard accessible

---

## Related Components

- [Toast](./toast.md) - For non-blocking notifications
- [Snackbar](./snackbar.md) - For bottom notifications with actions
- [Modal](./modal.md) - For custom modal dialogs

---

## Additional Resources

- [Storybook: Dialog Stories](https://bestax.io/storybook/?path=/story/components-dialog)

:::tip Pro Tip
Use the programmatic `dialog.confirm()` with async/await to create clean, sequential flows without managing dialog state manually.
:::
