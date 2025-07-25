---
title: Navbar
sidebar_label: Navbar
---

# Navbar

## Overview

The `Navbar` component implements Bulma's powerful, responsive navigation bar for your Bulma React UI. It supports color, transparency, fixed positioning, dropdowns, and granular composition with subcomponents for brand, menu, items, burger (mobile toggle), start/end, and rich dropdowns. Use it for main navigation, site branding, and complex menu layouts.

:::info
Compose your navigation using `Navbar`, `Navbar.Brand`, `Navbar.Burger`, `Navbar.Menu`, `Navbar.Start`, `Navbar.End`, `Navbar.Item`, `Navbar.Dropdown`, and more for full Bulma flexibility.
:::

---

## Import

```tsx
import { Navbar } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop          | Type                                                                                                                                                                                                                                                                                     | Default | Description                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------ |
| `color`       | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'dark'` \| `'light'` \| `'white'`                                                                                                                                                       | —       | Bulma color modifier for the navbar.                   |
| `bgColor`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Background color for the navbar.                       |
| `textColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Text color for the navbar.                             |
| `transparent` | `boolean`                                                                                                                                                                                                                                                                                | false   | Renders the navbar with a transparent background.      |
| `fixed`       | `'top'` \| `'bottom'`                                                                                                                                                                                                                                                                    | —       | Fixes the navbar to the top or bottom of the viewport. |
| `className`   | `string`                                                                                                                                                                                                                                                                                 | —       | Additional CSS classes.                                |
| `children`    | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | Navbar content (compose with subcomponents).           |
| ...           | All standard HTML and Bulma helper props                                                                                                                                                                                                                                                 |         | (See [Helper Props](../helpers/usebulmaclasses))       |

**Key Subcomponents:**

- `Navbar.Brand`: For logo and branding (left side)
- `Navbar.Burger`: Responsive menu toggle (mobile)
- `Navbar.Menu`: Collapsible content (contains `Navbar.Start` and `Navbar.End`)
- `Navbar.Start`: Left-aligned menu area
- `Navbar.End`: Right-aligned menu area
- `Navbar.Item`: Navigation links, buttons, or custom content
- `Navbar.Dropdown`: Dropdown parent (with options for hover, up, right, active)
- `Navbar.DropdownMenu`: Dropdown menu container
- `Navbar.Divider`: Divider in dropdown menus

---

## Usage

### Complete Navbar with Burger and Menu

This example demonstrates a fully responsive navigation bar using `Navbar` and its subcomponents. The `Navbar.Burger` toggles the mobile menu, while `Navbar.Brand` displays branding or a logo. Use the `active` prop on `Navbar.Burger` and `Navbar.Menu` to control the open state. Compose navigation links and dropdowns within `Navbar.Start` and `Navbar.End` for flexible layouts. Customize with `color`, `bgColor`, `fixed`, and `transparent` props as needed.

```tsx live
function example() {
  const [active, setActive] = useState(false);

  return (
    <Navbar>
      <Navbar.Brand>
        <Navbar.Item href="#">
          <img src="logo.svg" alt="Logo" width="112" height="28" />
        </Navbar.Item>
        <Navbar.Burger
          active={active}
          onClick={() => setActive(a => !a)}
          aria-label="menu"
          aria-expanded={active}
        />
      </Navbar.Brand>
      <Navbar.Menu active={active}>
        <Navbar.Start>
          <Navbar.Item href="#">Home</Navbar.Item>
          <Navbar.Item href="#">Docs</Navbar.Item>
          <Navbar.Item href="#">About</Navbar.Item>
          <Navbar.Item href="#">Contact</Navbar.Item>
        </Navbar.Start>
        <Navbar.End>
          <Navbar.Item href="#">Login</Navbar.Item>
        </Navbar.End>
      </Navbar.Menu>
    </Navbar>
  );
}
```

---

### Brand Only

This example shows a simple navbar with just the brand logo. The `Navbar.Brand` component is used to contain the logo image, which links to the homepage or main section of the site.

```tsx live
<Navbar>
  <Navbar.Brand>
    <Navbar.Item href="#">
      <img src="logo.svg" alt="Logo" width="112" height="28" />
    </Navbar.Item>
  </Navbar.Brand>
</Navbar>
```

---

### Burger Only

Demonstrates the `Navbar.Burger` component, which is the mobile menu toggle. It doesn't have an associated menu in this snippet, but in practice, it would control the visibility of the `Navbar.Menu`.

```tsx live
<Navbar>
  <Navbar.Burger aria-label="menu" aria-expanded={false} />
</Navbar>
```

---

### Burger Active

Shows the `Navbar.Burger` in its active state, indicating that the menu it controls is open. The `active` prop is used to toggle this state.

```tsx live
<Navbar>
  <Navbar.Burger active aria-label="menu" aria-expanded />
</Navbar>
```

---

### Menu with Start and End

This example illustrates a `Navbar.Menu` with `Navbar.Start` and `Navbar.End` sections. The start section could contain primary navigation links, while the end section might hold user account links like login or profile.

```tsx live
<Navbar>
  <Navbar.Menu active>
    <Navbar.Start>
      <Navbar.Item href="#">Home</Navbar.Item>
    </Navbar.Start>
    <Navbar.End>
      <Navbar.Item href="#">Login</Navbar.Item>
    </Navbar.End>
  </Navbar.Menu>
</Navbar>
```

---

### Navigation Links and Dropdowns

A more complex example with navigation links and a dropdown menu. The dropdown is used for additional links or actions related to the main navigation items.

```tsx live
<Navbar>
  <Navbar.Brand>
    <Navbar.Item>
      <img src="logo.svg" alt="Logo" width="112" height="28" />
    </Navbar.Item>
  </Navbar.Brand>
  <Navbar.Menu active>
    <Navbar.Start>
      <Navbar.Item href="#">Home</Navbar.Item>
      <Navbar.Item href="#">Docs</Navbar.Item>
      <Navbar.Dropdown hoverable>
        <Navbar.Item as="a">More</Navbar.Item>
        <Navbar.DropdownMenu>
          <Navbar.Item href="#">About</Navbar.Item>
          <Navbar.Item href="#">Jobs</Navbar.Item>
          <Navbar.Item href="#">Contact</Navbar.Item>
          <Navbar.Divider />
          <Navbar.Item href="#">Report an issue</Navbar.Item>
        </Navbar.DropdownMenu>
      </Navbar.Dropdown>
    </Navbar.Start>
  </Navbar.Menu>
</Navbar>
```

---

### Transparent Navbar

Example of a navbar with a transparent background. This is often used for navbars that overlay content, like images or videos, giving a more integrated look.

```tsx live
<Navbar transparent>{/* ...brand and menu... */}</Navbar>
```

---

### Fixed Navbar

Shows the navbar fixed to the top of the viewport. This is useful for keeping the navigation accessible at all times as the user scrolls.

```tsx live
<Navbar fixed="top">{/* ...brand and menu... */}</Navbar>
```

---

### Dropdown Right

Demonstrates a dropdown menu aligned to the right. This can be useful for user account menus, notifications, or other contextual actions.

```tsx live
<Navbar>
  <Navbar.Menu active>
    <Navbar.End>
      <Navbar.Dropdown hoverable right>
        <Navbar.Item as="a">Right Dropdown</Navbar.Item>
        <Navbar.DropdownMenu right>
          <Navbar.Item href="#">Profile</Navbar.Item>
          <Navbar.Item href="#">Settings</Navbar.Item>
        </Navbar.DropdownMenu>
      </Navbar.Dropdown>
    </Navbar.End>
  </Navbar.Menu>
</Navbar>
```

---

### Dropup

This example shows a dropdown menu that opens upwards, which can be useful in certain layout situations to prevent covering content.

```tsx live
<Navbar>
  <Navbar.Menu active>
    <Navbar.Start>
      <Navbar.Dropdown hoverable up>
        <Navbar.Item as="a">Dropup</Navbar.Item>
        <Navbar.DropdownMenu up>
          <Navbar.Item href="#">Up1</Navbar.Item>
          <Navbar.Item href="#">Up2</Navbar.Item>
        </Navbar.DropdownMenu>
      </Navbar.Dropdown>
    </Navbar.Start>
  </Navbar.Menu>
</Navbar>
```

---

### Dropdown without Arrow

Demonstrates a dropdown menu styled without the default arrow indicator. This might be used to achieve a specific design aesthetic.

```tsx live
<Navbar>
  <Navbar.Menu active>
    <Navbar.Start>
      <Navbar.Dropdown hoverable className="no-arrow">
        <Navbar.Item as="a">No Arrow</Navbar.Item>
        <Navbar.DropdownMenu>
          <Navbar.Item href="#">A</Navbar.Item>
          <Navbar.Item href="#">B</Navbar.Item>
        </Navbar.DropdownMenu>
      </Navbar.Dropdown>
    </Navbar.Start>
  </Navbar.Menu>
</Navbar>
```

---

### Active Dropdown Item

Shows a dropdown menu with an active item. The active state is typically used to indicate the currently selected or active page/section.

```tsx live
<Navbar>
  <Navbar.Menu active>
    <Navbar.Start>
      <Navbar.Dropdown active>
        <Navbar.Item as="a">Active Dropdown</Navbar.Item>
        <Navbar.DropdownMenu>
          <Navbar.Item href="#">A1</Navbar.Item>
          <Navbar.Item href="#">A2</Navbar.Item>
        </Navbar.DropdownMenu>
      </Navbar.Dropdown>
    </Navbar.Start>
  </Navbar.Menu>
</Navbar>
```

---

### Dropdown with Divider

This example shows a dropdown menu that includes a divider, which is used to separate groups of items within the menu for better organization and readability.

```tsx live
<Navbar>
  <Navbar.Menu active>
    <Navbar.Start>
      <Navbar.Dropdown hoverable>
        <Navbar.Item as="a">With Divider</Navbar.Item>
        <Navbar.DropdownMenu>
          <Navbar.Item href="#">One</Navbar.Item>
          <Navbar.Item href="#">Two</Navbar.Item>
          <Navbar.Divider />
          <Navbar.Item href="#">Three</Navbar.Item>
        </Navbar.DropdownMenu>
      </Navbar.Dropdown>
    </Navbar.Start>
  </Navbar.Menu>
</Navbar>
```

---

### Color Modifiers

Demonstrates the use of different color modifiers for the navbar. Each `Navbar` component has a different color prop to showcase the available options.

```tsx live
<>
  <Navbar color="primary">{/* ... */}</Navbar>
  <Navbar color="link">{/* ... */}</Navbar>
  <Navbar color="info">{/* ... */}</Navbar>
  <Navbar color="success">{/* ... */}</Navbar>
  <Navbar color="warning">{/* ... */}</Navbar>
  <Navbar color="danger">{/* ... */}</Navbar>
  <Navbar color="black">{/* ... */}</Navbar>
  <Navbar color="dark">{/* ... */}</Navbar>
  <Navbar color="light">{/* ... */}</Navbar>
  <Navbar color="white">{/* ... */}</Navbar>
</>
```

---

## Accessibility

- The root `Navbar` renders as `<nav role="navigation" aria-label="main navigation">`.
- Use semantic links (`<a>`) and buttons, and provide clear `aria-label` and `aria-expanded` for the burger toggle.
- Dropdowns and menus follow Bulma's structure for keyboard and screen reader accessibility.

:::note
For full accessibility in dropdowns, ensure that focus, keyboard navigation, and ARIA attributes are managed where needed.
:::

---

## Related Components

- [`Button`](../elements/button.md): For actions in Navbar.
- [`Icon`](../elements/icon.md): For icons inside Navbar items.
- [Helper Props](../helpers/usebulmaclasses.md): All Bulma utility helpers can be used.

---

## Additional Resources

- [Bulma Navbar Documentation](https://bulma.io/documentation/components/navbar/)
- [Storybook: Navbar Stories](https://bestax.cc/storybook/?path=/story/components-navbar--default)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Navbar />` and its subcomponents for powerful utility-based styling.
:::
