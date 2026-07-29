---
title: Dialog
sidebar_label: Dialog
description: The `Dialog` component provides confirmation and alert dialogs with customizable actions.
---

# Dialog

## Overview

<!-- bestax:generated overview -->

The `Dialog` component provides confirmation and alert dialogs with customizable actions.

<!-- /bestax:generated overview -->

Dialogs are modal and require user interaction before they can be dismissed.

---

## Import

<!-- bestax:generated import -->

```tsx
import { Dialog, DialogContainer, dialog } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Alert Dialog

A simple alert dialog with only a confirm button.

```tsx live
function example() {
  const [showDialog, setShowDialog] = useState(false);
  return (
    <Block>
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
    </Block>
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
    <Block>
      <Button color="danger" onClick={() => setShowDialog(true)}>
        Delete Item
      </Button>
      <Paragraph mt="2">Result: {result}</Paragraph>
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
    </Block>
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
    <Block>
      <Buttons>
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
      </Buttons>
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
    </Block>
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
    <Block>
      <Button onClick={() => setShowDialog(true)}>Show Terms</Button>
      <Dialog
        isOpen={showDialog}
        title="Terms of Service"
        message={
          <Block>
            <Paragraph mb="2">By clicking "Accept", you agree to:</Paragraph>
            <ul>
              <li>Our terms of service</li>
              <li>Our privacy policy</li>
              <li>Receive email notifications</li>
            </ul>
          </Block>
        }
        confirmText="Accept"
        cancelText="Decline"
        onConfirm={() => setShowDialog(false)}
        onCancel={() => setShowDialog(false)}
      />
    </Block>
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
    <Block>
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
    </Block>
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

### Programmatic Alert

```tsx live
function example() {
  return (
    <Block>
      <DialogContainer />
      <Buttons>
        <Button
          color="info"
          onClick={() => dialog.alert('Something happened!')}
        >
          Simple Alert
        </Button>
        <Button
          color="success"
          onClick={() =>
            dialog.alert({
              title: 'Success',
              message: 'Operation completed!',
              type: 'success',
            })
          }
        >
          Success Alert
        </Button>
      </Buttons>
    </Block>
  );
}
```

### Programmatic Confirm

```tsx live
function example() {
  const [result, setResult] = useState('');

  return (
    <Block>
      <DialogContainer />
      <Button
        color="danger"
        onClick={async () => {
          const confirmed = await dialog.confirm({
            title: 'Delete Item?',
            message: 'This action cannot be undone.',
            type: 'danger',
            confirmText: 'Delete',
          });
          setResult(confirmed ? 'Item deleted!' : 'Cancelled.');
        }}
      >
        Delete Item
      </Button>
      {result && <Paragraph mt="3">{result}</Paragraph>}
    </Block>
  );
}
```

### Chained Dialogs

```tsx live
function example() {
  return (
    <Block>
      <DialogContainer />
      <Button
        color="warning"
        onClick={async () => {
          const confirmed = await dialog.confirm({
            title: 'Delete Item?',
            message: 'This action cannot be undone.',
            type: 'danger',
            confirmText: 'Delete',
          });
          if (confirmed) {
            await dialog.alert({
              title: 'Deleted',
              message: 'Item was deleted successfully.',
              type: 'success',
            });
          }
        }}
      >
        Delete with Confirmation
      </Button>
    </Block>
  );
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

- [Toast](./toast.md) - For non-blocking notifications with optional action buttons
- [Modal](./modal.md) - For custom modal dialogs

---

## Additional Resources

- [Storybook: Dialog Stories](https://bestax.io/storybook/?path=/story/components-dialog)

:::tip Pro Tip
Use the programmatic `dialog.confirm()` with async/await to create clean, sequential flows without managing dialog state manually.
:::

---

## Props

<!-- bestax:generated props -->

| Prop          | Type                                                                | Default     | Description                                                       |
| ------------- | ------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------- |
| `isOpen`      | `boolean`                                                           | —           | Whether the dialog is open (required).                            |
| `title`       | `string`                                                            | —           | Dialog title.                                                     |
| `message`     | `string` \| `React.ReactNode`                                       | —           | Dialog message/content (required).                                |
| `type`        | `'default'` \| `'success'` \| `'danger'` \| `'warning'` \| `'info'` | `'default'` | The type/color of the dialog. Default: 'default'.                 |
| `confirmText` | `string`                                                            | `'OK'`      | Text for confirm button. Default: 'OK'.                           |
| `cancelText`  | `string`                                                            | `'Cancel'`  | Text for cancel button. Default: 'Cancel'.                        |
| `onConfirm`   | `() => void`                                                        | —           | Callback when confirm button is clicked.                          |
| `onCancel`    | `() => void`                                                        | —           | Callback when cancel button is clicked or dismissed.              |
| `showCancel`  | `boolean`                                                           | `true`      | Whether to show cancel button. Default: true for confirm dialogs. |
| `canCancel`   | `boolean`                                                           | `true`      | Whether the dialog can be dismissed. Default: true.               |
| `focusCancel` | `boolean`                                                           | `false`     | Focus cancel button instead of confirm. Default: false.           |
| `icon`        | `React.ReactNode`                                                   | —           | Custom icon to display.                                           |
| `children`    | `React.ReactNode`                                                   | —           | Content rendered inside the component.                            |
| `className`   | `string`                                                            | —           | Additional CSS classes.                                           |
| `ref`         | `React.Ref<HTMLElement>`                                            | —           | Ref forwarded to the dialog element.                              |
| `...`         | All standard `<div>` attributes and Bulma helper props              | —           | See [Helper Props](../helpers/usebulmaclasses.md)                 |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Dialog` registers these variables on its own `.dialog` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                        | Sass Variable                | Default                           |
| ----------------------------------- | ---------------------------- | --------------------------------- |
| `--bulma-dialog-width`              | `$dialog-width`              | `420px`                           |
| `--bulma-dialog-max-width`          | `$dialog-max-width`          | `90%`                             |
| `--bulma-dialog-radius`             | `$dialog-radius`             | `var(--bulma-radius)`             |
| `--bulma-dialog-background`         | `$dialog-background`         | `var(--bulma-scheme-main)`        |
| `--bulma-dialog-shadow`             | `$dialog-shadow`             | `0 8px 24px hsla(0, 0%, 0%, 0.2)` |
| `--bulma-dialog-header-padding`     | `$dialog-header-padding`     | `1rem 1.25rem`                    |
| `--bulma-dialog-body-padding`       | `$dialog-body-padding`       | `1.25rem`                         |
| `--bulma-dialog-body-color`         | `$dialog-body-color`         | `var(--bulma-text)`               |
| `--bulma-dialog-body-line-height`   | `$dialog-body-line-height`   | `1.5`                             |
| `--bulma-dialog-footer-padding`     | `$dialog-footer-padding`     | `1rem 1.25rem`                    |
| `--bulma-dialog-footer-gap`         | `$dialog-footer-gap`         | `0.75rem`                         |
| `--bulma-dialog-border-color`       | `$dialog-border-color`       | `var(--bulma-border)`             |
| `--bulma-dialog-title-size`         | `$dialog-title-size`         | `var(--bulma-size-5)`             |
| `--bulma-dialog-title-weight`       | `$dialog-title-weight`       | `var(--bulma-weight-semibold)`    |
| `--bulma-dialog-title-color`        | `$dialog-title-color`        | `var(--bulma-text-strong)`        |
| `--bulma-dialog-icon-size`          | `$dialog-icon-size`          | `1.5rem`                          |
| `--bulma-dialog-icon-margin`        | `$dialog-icon-margin`        | `0.75rem`                         |
| `--bulma-dialog-animation-duration` | `$dialog-animation-duration` | `0.2s`                            |

<!-- /bestax:generated cssvars -->
