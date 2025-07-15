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

```tsx live
<Navbar>
  <Navbar.Burger aria-label="menu" aria-expanded={false} />
</Navbar>
```

---

### Burger Active

```tsx live
<Navbar>
  <Navbar.Burger active aria-label="menu" aria-expanded />
</Navbar>
```

---

### Menu with Start and End

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

```tsx live
<Navbar transparent>{/* ...brand and menu... */}</Navbar>
```

---

### Fixed Navbar

```tsx live
<Navbar fixed="top">{/* ...brand and menu... */}</Navbar>
```

---

### Dropdown Right

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
