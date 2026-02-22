---
title: Extra Components
sidebar_label: Extras
sidebar_position: 2
---

# Extra Components

The **Extra Components** section provides additional UI components that extend the core [Components](../components.md). These components add advanced functionality like notifications, tooltips, dialogs, and more.

:::info
Extra Components require additional CSS. Import `@allxsmith/bestax-bulma/dist/extras.css` in your application. See the [Using Extras guide](/docs/guides/getting-started/using-extras) for setup instructions.
:::

---

## Notification Components

### Toast

Brief notification messages that appear and disappear automatically. Supports multiple positions, colors, and programmatic API. [View full documentation.](../../../api/components/toast.md)

```tsx live
function ToastExample() {
  const [showToast, setShowToast] = React.useState(false);
  return (
    <div>
      <Button color="success" onClick={() => setShowToast(true)}>
        Show Toast
      </Button>
      {showToast && (
        <Toast
          message="Operation completed successfully!"
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
```

---

### Snackbar

Bottom-aligned notifications with optional action buttons. Ideal for user feedback after actions. [View full documentation.](../../../api/components/snackbar.md)

```tsx live
function SnackbarExample() {
  const [showSnackbar, setShowSnackbar] = React.useState(false);
  return (
    <div>
      <Button color="info" onClick={() => setShowSnackbar(true)}>
        Show Snackbar
      </Button>
      {showSnackbar && (
        <Snackbar
          message="Item deleted"
          actionText="Undo"
          onAction={() => console.log('Undo clicked')}
          onClose={() => setShowSnackbar(false)}
        />
      )}
    </div>
  );
}
```

---

### Dialog

Confirmation and alert dialogs with customizable actions. Supports different types with matching icons. [View full documentation.](../../../api/components/dialog.md)

```tsx live
function DialogExample() {
  const [showDialog, setShowDialog] = React.useState(false);
  return (
    <div>
      <Button color="danger" onClick={() => setShowDialog(true)}>
        Delete Item
      </Button>
      <Dialog
        isOpen={showDialog}
        title="Delete Item?"
        message="This action cannot be undone."
        type="danger"
        confirmText="Delete"
        onConfirm={() => setShowDialog(false)}
        onCancel={() => setShowDialog(false)}
      />
    </div>
  );
}
```

---

## Overlay Components

### Loading

Full-page or container loading overlay with spinner. Supports cancel functionality and custom messages. [View full documentation.](../../../api/components/loading.md)

```tsx live
function LoadingExample() {
  const [isLoading, setIsLoading] = React.useState(false);
  return (
    <div
      style={{
        position: 'relative',
        height: '150px',
        border: '1px dashed #ccc',
      }}
    >
      <Button onClick={() => setIsLoading(!isLoading)}>Toggle Loading</Button>
      <Loading
        active={isLoading}
        canCancel
        onCancel={() => setIsLoading(false)}
      >
        Loading data...
      </Loading>
    </div>
  );
}
```

---

### Sidebar

Slide-out navigation panel from left or right. Supports overlay, custom width, and keyboard navigation. [View full documentation.](../../../api/components/sidebar.md)

```tsx live
function SidebarExample() {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Sidebar</Button>
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <Menu>
          <Menu.List title="Navigation">
            <Menu.Item>Dashboard</Menu.Item>
            <Menu.Item>Settings</Menu.Item>
            <Menu.Item>Profile</Menu.Item>
          </Menu.List>
        </Menu>
      </Sidebar>
    </div>
  );
}
```

---

## Content Components

### Collapse

Expandable/collapsible content panels with smooth animation. Works in controlled or uncontrolled mode. [View full documentation.](../../../api/components/collapse.md)

```tsx live
<Collapse trigger={<Button>Click to expand</Button>}>
  <Box mt="3">
    <p>This content is revealed when the collapse is opened.</p>
    <p>Click the button again to hide it.</p>
  </Box>
</Collapse>
```

---

### Tooltip

Hover tooltips for displaying helpful information. Supports multiple positions and colors. [View full documentation.](../../../api/components/tooltip.md)

```tsx live
<div className="buttons">
  <Tooltip label="This is helpful information" position="top">
    <Button>Hover me (top)</Button>
  </Tooltip>
  <Tooltip label="Positioned on the right" position="right" color="info">
    <Button color="info">Hover me (right)</Button>
  </Tooltip>
</div>
```

---

### Steps

Multi-step progress indicator for wizard flows. Supports horizontal and vertical layouts with customizable markers. [View full documentation.](../../../api/components/steps.md)

```tsx live
function StepsExample() {
  const [step, setStep] = React.useState(1);
  return (
    <div>
      <Steps
        value={step}
        items={[
          { label: 'Account', clickable: true },
          { label: 'Profile', clickable: true },
          { label: 'Confirm', clickable: true },
        ]}
        onStepClick={setStep}
        color="primary"
      />
      <div className="buttons mt-4">
        <Button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
        >
          Previous
        </Button>
        <Button
          onClick={() => setStep(Math.min(2, step + 1))}
          disabled={step === 2}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
```

---

### Carousel

Image/content slider with navigation arrows and indicators. Supports auto-play, drag navigation, and customizable styles. [View full documentation.](../../../api/components/carousel.md)

```tsx live
<Carousel indicatorStyle="dots">
  <CarouselItem>
    <div
      style={{
        background: '#485fc7',
        color: '#fff',
        padding: '3rem',
        textAlign: 'center',
      }}
    >
      <Title subtitle textColor="white">
        Slide 1
      </Title>
    </div>
  </CarouselItem>
  <CarouselItem>
    <div
      style={{
        background: '#48c78e',
        color: '#fff',
        padding: '3rem',
        textAlign: 'center',
      }}
    >
      <Title subtitle textColor="white">
        Slide 2
      </Title>
    </div>
  </CarouselItem>
  <CarouselItem>
    <div
      style={{
        background: '#f14668',
        color: '#fff',
        padding: '3rem',
        textAlign: 'center',
      }}
    >
      <Title subtitle textColor="white">
        Slide 3
      </Title>
    </div>
  </CarouselItem>
</Carousel>
```

---

:::tip Programmatic APIs
Toast, Snackbar, and Dialog provide programmatic APIs for showing notifications from anywhere in your app. Add the container component once at your app root, then call `toast.success()`, `snackbar.show()`, or `dialog.confirm()` from any component.
:::

:::note
For the core component library including Modal, Navbar, and Tabs, see the [Components](../components.md) guide.
:::
