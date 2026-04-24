---
title: Components
sidebar_label: Components
sidebar_position: 3
---

# Components

The **Components** section provides higher-level, composable UI building blocks for your Bulma React applications. These components combine Bulma's styles and patterns with React flexibility, offering navigation, layout, feedback, and interactive controls. Each component supports Bulma's utility props for color, spacing, and accessibility, making it easy to build robust, consistent interfaces.

---

## Navigation

### Breadcrumb

A Bulma-styled breadcrumb navigation for showing the user's location in the app. [View full documentation.](../../api/components/breadcrumb.md)

```tsx live
<Breadcrumb>
  <li>
    <a href="#">
      <Icon name="fas fa-home" ariaLabel="home icon" /> Home
    </a>
  </li>
  <li>
    <a href="#">
      <Icon name="fas fa-folder" ariaLabel="category icon" /> Category
    </a>
  </li>
  <li className="is-active">
    <a href="#">
      <Icon name="fas fa-file" ariaLabel="item icon" /> Item
    </a>
  </li>
</Breadcrumb>
```

---

### Navbar

A responsive navigation bar with support for branding, menus, dropdowns, and more. [View full documentation.](../../api/components/navbar.md)

```tsx live
<Navbar>
  <Navbar.Brand>
    <Navbar.Item href="#">
      <img src="/img/logo.svg" alt="Logo" />
    </Navbar.Item>
    <Navbar.Burger active={false} onClick={() => {}} />
  </Navbar.Brand>
  <Navbar.Menu active={false}>
    <Navbar.Start>
      <Navbar.Item href="#">Home</Navbar.Item>
      <Navbar.Item href="#">Docs</Navbar.Item>
      <Navbar.Item href="#">About</Navbar.Item>
    </Navbar.Start>
    <Navbar.End>
      <Navbar.Item href="#">Login</Navbar.Item>
    </Navbar.End>
  </Navbar.Menu>
</Navbar>
```

---

### Tabs

A flexible tab navigation system for switching between views or filtering content. [View full documentation.](../../api/components/tabs.md)

```tsx live
<Tabs align="centered">
  <Tabs.List>
    <Tabs.Item active>
      <a>Home</a>
    </Tabs.Item>
    <Tabs.Item>
      <a>Profile</a>
    </Tabs.Item>
    <Tabs.Item>
      <a>Settings</a>
    </Tabs.Item>
  </Tabs.List>
</Tabs>
```

---

### Steps

Multi-step progress indicator for wizard flows. Supports horizontal and vertical layouts with customizable markers. [View full documentation.](../../api/components/steps.md)

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

### Pagination

A flexible, composable pagination navigation for lists or multi-page content. [View full documentation.](../../api/components/pagination.md)

```tsx live
<Pagination>
  <Pagination.List>
    <Pagination.Link>&laquo;</Pagination.Link>
    <Pagination.Link active>1</Pagination.Link>
    <Pagination.Link>2</Pagination.Link>
    <Pagination.Link>3</Pagination.Link>
    <Pagination.Ellipsis />
    <Pagination.Link>10</Pagination.Link>
    <Pagination.Link>&raquo;</Pagination.Link>
  </Pagination.List>
</Pagination>
```

---

## Content

### Card

A Bulma-styled card with optional header, image, content, and footer. [View full documentation.](../../api/components/card.md)

```tsx live
<Card
  header="Card Header"
  image="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"
  imageAlt="Beautiful forest"
  footer={[
    <span key="save" className="card-footer-item">
      Save
    </span>,
    <span key="cancel" className="card-footer-item">
      Cancel
    </span>,
  ]}
>
  Card content goes here.
</Card>
```

---

### Panel

A vertical panel block for lists, filters, or grouped actions. [View full documentation.](../../api/components/panel.md)

```tsx live
<Panel>
  <Panel.Heading>Revolutionary Figures</Panel.Heading>
  <Panel.InputBlock placeholder="Search" />
  <Panel.Tabs>
    <a className="is-active">All</a>
    <a>Patriots</a>
    <a>Loyalists</a>
    <a>Battles</a>
    <a>Documents</a>
  </Panel.Tabs>
  <Panel.Block active>
    <Panel.Icon>
      <i className="fas fa-user" aria-hidden="true"></i>
    </Panel.Icon>
    George Washington
  </Panel.Block>
  <Panel.Block>
    <Panel.Icon>
      <i className="fas fa-user" aria-hidden="true"></i>
    </Panel.Icon>
    Alexander Hamilton
  </Panel.Block>
  <Panel.Block>
    <Panel.Icon>
      <i className="fas fa-user" aria-hidden="true"></i>
    </Panel.Icon>
    Benedict Arnold
  </Panel.Block>
</Panel>
```

---

### Carousel

Image/content slider with navigation arrows and indicators. Supports auto-play, drag navigation, and customizable styles. [View full documentation.](../../api/components/carousel.md)

```tsx live
<Carousel indicatorStyle="lines" arrowHover>
  <CarouselItem>
    <div style={{ position: 'relative' }}>
      <img
        src="/img/carousel/carousel-banner-1.jpg"
        alt="Vibrant galaxy with purple and gold tones"
        style={{
          width: '100%',
          height: '320px',
          objectFit: 'cover',
          display: 'block',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '2rem',
        }}
      >
        <Title subtitle textColor="white">
          Galaxy Horizon
        </Title>
      </div>
    </div>
  </CarouselItem>
  <CarouselItem>
    <div style={{ position: 'relative' }}>
      <img
        src="/img/carousel/carousel-banner-2.jpg"
        alt="Milky Way over silhouetted mountains"
        style={{
          width: '100%',
          height: '320px',
          objectFit: 'cover',
          display: 'block',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '2rem',
        }}
      >
        <Title subtitle textColor="white">
          Night Sky Vista
        </Title>
      </div>
    </div>
  </CarouselItem>
  <CarouselItem>
    <div style={{ position: 'relative' }}>
      <img
        src="/img/carousel/carousel-banner-3.jpg"
        alt="Starry night sky over mountain silhouettes"
        style={{
          width: '100%',
          height: '320px',
          objectFit: 'cover',
          display: 'block',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '2rem',
        }}
      >
        <Title subtitle textColor="white">
          Starry Night
        </Title>
      </div>
    </div>
  </CarouselItem>
</Carousel>
```

---

### Collapse

Expandable/collapsible content panels with smooth animation. Works in controlled or uncontrolled mode. [View full documentation.](../../api/components/collapse.md)

```tsx live
<Collapse trigger={<Button>Click to expand</Button>}>
  <Box mt="3">
    <p>This content is revealed when the collapse is opened.</p>
    <p>Click the button again to hide it.</p>
  </Box>
</Collapse>
```

---

## Overlays

### Modal

A flexible, accessible modal dialog for dialogs, confirmations, or custom content. [View full documentation.](../../api/components/modal.md)

```tsx live
function example() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button color="success" onClick={() => setOpen(true)}>
        Show Modal
      </Button>
      <Modal
        active={open}
        onClose={() => setOpen(false)}
        modalCardTitle="Modal Card Title"
        modalCardFoot={
          <Buttons>
            <Button color="primary">Save</Button>
            <Button color="warning">Cancel</Button>
          </Buttons>
        }
      >
        Modal card body content goes here...
      </Modal>
    </>
  );
}
```

---

### Dialog

Confirmation and alert dialogs with customizable actions. Supports different types with matching icons. [View full documentation.](../../api/components/dialog.md)

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

### Sidebar

Slide-out navigation panel from left or right. Supports overlay, custom width, and keyboard navigation. [View full documentation.](../../api/components/sidebar.md)

:::tip Live Preview Only
The `inline` prop and wrapper `<div>` with positioning styles are only needed to display this component within the docs preview. **Do not copy them** — in your app, `Sidebar` renders via a portal automatically.
:::

```tsx live
function SidebarExample() {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div style={{ position: 'relative', height: 280, overflow: 'hidden' }}>
      <Button color="primary" onClick={() => setIsOpen(true)}>
        Open Sidebar
      </Button>
      <Sidebar
        inline
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        style={{ position: 'absolute' }}
      >
        <Sidebar.Header>
          <Sidebar.Title>Navigation</Sidebar.Title>
          <Sidebar.Close onClick={() => setIsOpen(false)} />
        </Sidebar.Header>
        <Sidebar.Body>
          <Menu>
            <Menu.Label>Pages</Menu.Label>
            <Menu.List>
              <Menu.Item active>Home</Menu.Item>
              <Menu.Item>Products</Menu.Item>
              <Menu.Item>Services</Menu.Item>
              <Menu.Item>Contact</Menu.Item>
            </Menu.List>
          </Menu>
        </Sidebar.Body>
        <Sidebar.Footer>
          <Paragraph textSize="7" textColor="grey">
            © 2026 Company Name
          </Paragraph>
        </Sidebar.Footer>
      </Sidebar>
    </div>
  );
}
```

---

### Loading

Full-page or container loading overlay with spinner. Supports cancel functionality and custom messages. [View full documentation.](../../api/components/loading.md)

:::tip Live Preview Only
The wrapper `<div>` with positioning styles is only needed to display this component within the docs preview. **Do not copy it** — in your app, `Loading` renders as a full-page overlay automatically.
:::

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

## Menus

### Menu

A vertical navigation menu for sidebars, dashboards, or grouped navigation. [View full documentation.](../../api/components/menu.md)

```tsx live
<Menu style={{ maxWidth: 300 }}>
  <Menu.Label>General</Menu.Label>
  <Menu.List>
    <Menu.Item>Dashboard</Menu.Item>
    <Menu.Item>Customers</Menu.Item>
  </Menu.List>
  <Menu.Label>Administration</Menu.Label>
  <Menu.List>
    <Menu.Item>Team Settings</Menu.Item>
    <Menu.Item active>Manage Your Team</Menu.Item>
  </Menu.List>
</Menu>
```

---

### Dropdown

A versatile dropdown menu for navigation, actions, or pop-up lists. [View full documentation.](../../api/components/dropdown.md)

```tsx live
<Dropdown label="Dropdown Menu">
  <Dropdown.Item>First Item</Dropdown.Item>
  <Dropdown.Item>Second Item</Dropdown.Item>
  <Dropdown.Divider />
  <Dropdown.Item>Third Item</Dropdown.Item>
  <Dropdown.Item>Fourth Item</Dropdown.Item>
  <Dropdown.Item>Fifth Item</Dropdown.Item>
</Dropdown>
```

---

## Feedback

### Message

A Bulma-styled message box for feedback, alerts, or notifications. [View full documentation.](../../api/components/message.md)

```tsx live
<Message color="primary" title="Primary">
  This is a primary message.
</Message>
```

---

### Toast

Brief notification messages that appear and disappear automatically. Supports multiple positions, colors, and programmatic API. [View full documentation.](../../api/components/toast.md)

:::note
Toast, Snackbar, and Dialog provide programmatic APIs for showing notifications from anywhere in your app. Add the container component once at your app root, then call `toast.success()`, `snackbar.show()`, or `dialog.confirm()` from any component.
:::

:::tip Live Preview Only
The `inline` prop is only needed to display this component within the docs preview. **Do not copy it** — in your app, `Toast` renders via a portal automatically.
:::

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
          inline
          position="bottom-center"
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

Bottom-aligned notifications with optional action buttons. Ideal for user feedback after actions. [View full documentation.](../../api/components/snackbar.md)

:::tip Live Preview Only
The `inline` prop is only needed to display this component within the docs preview. **Do not copy it** — in your app, `Snackbar` renders via a portal automatically.
:::

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
          inline
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

### Tooltip

Hover tooltips for displaying helpful information. Supports multiple positions and colors. [View full documentation.](../../api/components/tooltip.md)

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

:::tip
All components support Bulma helper props for color, spacing, and accessibility. See the full documentation for each component for more advanced usage and customization.
:::

:::info
Components are higher-level building blocks. For lower-level primitives, see the Elements section.
:::
