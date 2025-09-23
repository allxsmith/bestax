---
title: Components
sidebar_label: Components
sidebar_position: 3
---

# Components

The **Components** section provides higher-level, composable UI building blocks for your Bulma React applications. These components combine Bulma's styles and patterns with React flexibility, offering navigation, layout, feedback, and interactive controls. Each component supports Bulma's utility props for color, spacing, and accessibility, making it easy to build robust, consistent interfaces.

:::info
Components are designed to be used directly in your app or as the foundation for more complex UI patterns. They often compose multiple elements and support advanced features.
:::

---

## Component Summaries

Below is a summary of each component, including a brief description, a usage example, and a link to the full documentation for more details.

---

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

### Message

A Bulma-styled message box for feedback, alerts, or notifications. [View full documentation.](../../api/components/message.md)

```tsx live
<Message color="primary" title="Primary">
  This is a primary message.
</Message>
```

---

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
            <Button color="primary" className="button is-success">Save</Button>
            <Button color="warning" className="button">Cancel</Button>
          </>
        }
      >
        Modal card body content goes here...
      </Modal>
    </>
  );
}
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

:::tip
All components support Bulma helper props for color, spacing, and accessibility. See the full documentation for each component for more advanced usage and customization.
:::

:::caution
Components are higher-level building blocks. For lower-level primitives, see the Elements section.
:::
