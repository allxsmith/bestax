---
title: Navbar
sidebar_label: Navbar
description: The `Navbar` component implements Bulma's powerful, responsive navigation bar for your Bulma React UI.
---

# Navbar

## Overview

<!-- bestax:generated overview -->

The `Navbar` component implements Bulma's powerful, responsive navigation bar for your Bulma React UI.

<!-- /bestax:generated overview -->

It supports color, transparency, fixed positioning, dropdowns, and granular composition with subcomponents for brand, menu, items, burger (mobile toggle), start/end, and rich dropdowns. Use it for main navigation, site branding, and complex menu layouts.

:::info
Compose your navigation using `Navbar`, `Navbar.Brand`, `Navbar.Burger`, `Navbar.Menu`, `Navbar.Start`, `Navbar.End`, `Navbar.Item`, `Navbar.Dropdown`, and more for full Bulma flexibility.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Navbar } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

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
          <img src="/img/logo.svg" alt="Logo" width="28" height="28" />
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
      <img src="/img/logo.svg" alt="Logo" width="28" height="28" />
    </Navbar.Item>
  </Navbar.Brand>
</Navbar>
```

---

### Burger Only

Demonstrates the `Navbar.Burger` component, which is the mobile menu toggle. It doesn't have an associated menu in this snippet, but in practice, it would control the visibility of the `Navbar.Menu`.

:::note
The burger is only shown on touch/mobile viewports by default. The example below forces `display: flex` so you can see it on desktop.
:::

```tsx live
<Navbar>
  <Navbar.Burger
    aria-label="menu"
    aria-expanded={false}
    style={{ display: 'flex' }}
  />
</Navbar>
```

---

### Burger Active

Shows the `Navbar.Burger` in its active state, indicating that the menu it controls is open. The `active` prop is used to toggle this state.

```tsx live
<Navbar>
  <Navbar.Burger
    active
    aria-label="menu"
    aria-expanded
    style={{ display: 'flex' }}
  />
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
      <img src="/img/logo.svg" alt="Logo" width="28" height="28" />
    </Navbar.Item>
  </Navbar.Brand>
  <Navbar.Menu active>
    <Navbar.Start>
      <Navbar.Item href="#">Home</Navbar.Item>
      <Navbar.Item href="#">Docs</Navbar.Item>
      <Navbar.Dropdown hoverable>
        <Navbar.Link>More</Navbar.Link>
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

### Custom Link Component

Use the `as` prop on `Navbar.Item` to render a custom link component, such as a router link. Extra props like `to` are forwarded to the link component and type-check without casts, so client-side routing libraries integrate directly. See the [Routing guide](../../guides/features/routing.md) for the full patterns.

```tsx live
// import { Link } from 'react-router-dom';
function example() {
  const Link = props => <a>{props.children}</a>;
  return (
    <Navbar>
      <Navbar.Menu active>
        <Navbar.Start>
          <Navbar.Item as={Link} to="/">
            Home
          </Navbar.Item>
          <Navbar.Item as={Link} to="/pricing">
            Pricing
          </Navbar.Item>
        </Navbar.Start>
      </Navbar.Menu>
    </Navbar>
  );
}
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
        <Navbar.Link>Right Dropdown</Navbar.Link>
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

This example shows a dropdown menu that opens upwards, which can be useful in certain layout situations to prevent covering content. A `Hero` is placed above the navbar to give the dropup room to expand.

```tsx live
<>
  <Hero color="primary" size="small">
    <Hero.Body>
      <Title>Hero above Navbar</Title>
      <SubTitle>Hover "Dropup" below to see the menu open upward</SubTitle>
    </Hero.Body>
  </Hero>
  <Navbar>
    <Navbar.Menu active>
      <Navbar.Start>
        <Navbar.Dropdown hoverable up>
          <Navbar.Link>Dropup</Navbar.Link>
          <Navbar.DropdownMenu up>
            <Navbar.Item href="#">Up1</Navbar.Item>
            <Navbar.Item href="#">Up2</Navbar.Item>
          </Navbar.DropdownMenu>
        </Navbar.Dropdown>
      </Navbar.Start>
    </Navbar.Menu>
  </Navbar>
</>
```

---

### Dropdown without Arrow

Demonstrates a dropdown menu styled without the default arrow indicator. Set `arrowless` on `Navbar.Link` to remove the arrow indicator.

```tsx live
<Navbar>
  <Navbar.Menu active>
    <Navbar.Start>
      <Navbar.Dropdown hoverable>
        <Navbar.Link arrowless>No Arrow</Navbar.Link>
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
        <Navbar.Link>Active Dropdown</Navbar.Link>
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
        <Navbar.Link>With Divider</Navbar.Link>
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
function example() {
  const colors = [
    'primary',
    'link',
    'info',
    'success',
    'warning',
    'danger',
    'black',
    'dark',
    'light',
    'white',
  ];
  return (
    <>
      {colors.map(color => (
        <Navbar key={color} color={color} mb="2">
          <Navbar.Brand>
            <Navbar.Item href="#">
              <img src="/img/logo.svg" alt="Logo" width="28" height="28" />
            </Navbar.Item>
          </Navbar.Brand>
          <Navbar.Menu active>
            <Navbar.Start>
              <Navbar.Item href="#">Home</Navbar.Item>
              <Navbar.Item href="#">Docs</Navbar.Item>
              <Navbar.Item href="#">Components</Navbar.Item>
            </Navbar.Start>
          </Navbar.Menu>
        </Navbar>
      ))}
    </>
  );
}
```

---

### Compound (dot-notation) usage

`NavbarBrand`, `NavbarMenu`, `NavbarItem`, and the other subcomponents are also available as `Navbar.Brand`, `Navbar.Menu`, `Navbar.Item`, and so on, so a complete navbar can be composed from the single `Navbar` import.

```tsx live
<Navbar>
  <Navbar.Brand>
    <Navbar.Item href="#">
      <img src="/img/logo.svg" alt="Logo" width="28" height="28" />
    </Navbar.Item>
    <Navbar.Burger aria-label="menu" />
  </Navbar.Brand>
  <Navbar.Menu active>
    <Navbar.Start>
      <Navbar.Item href="#">Home</Navbar.Item>
      <Navbar.Item href="#">Docs</Navbar.Item>
    </Navbar.Start>
    <Navbar.End>
      <Navbar.Item href="#">Log in</Navbar.Item>
    </Navbar.End>
  </Navbar.Menu>
</Navbar>
```

---

## Accessibility

- The root `Navbar` renders as `<nav role="navigation" aria-label="main navigation">`.
- Use semantic links (`<a>`) and buttons, and provide clear `aria-label` and `aria-expanded` for the burger toggle.
- `Navbar.Link` inside a `Navbar.Dropdown` automatically gets `aria-haspopup="true"` and
  `aria-expanded` synced to the dropdown's open state — no manual wiring required.
  <kbd>Enter</kbd>/<kbd>Space</kbd> toggle the dropdown open/closed, and <kbd>Escape</kbd>
  closes it and keeps focus on the link. When the link has no `href` and isn't rendered with
  `as="button"`, it also gets `role="button"` and `tabIndex={0}` so it's reachable and
  operable by keyboard.
- `hoverable` dropdowns keep working with a mouse (hover-to-open); the keyboard path above
  opens and closes them independently of hover.

:::note
There's no arrow-key roving between navbar items and no outside-click handling for
`Navbar.Dropdown` — Bulma navbar dropdowns are hover/click surfaces, so this is intentionally
kept simple.
:::

---

## Related Components

- [`Button`](../elements/button.md): For actions in Navbar.
- [`Icon`](../elements/icon.md): For icons inside Navbar items.
- [Helper Props](../helpers/usebulmaclasses.md): All Bulma utility helpers can be used.

---

## Additional Resources

- [Bulma Navbar Documentation](https://bulma.io/documentation/components/navbar/)
- [Storybook: Navbar Stories](https://bestax.io/storybook/?path=/story/components-navbar--default)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Navbar />` and its subcomponents for powerful utility-based styling.
:::

---

## Props

<!-- bestax:generated props -->

| Prop          | Type                                                                                                                               | Default | Description                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------ |
| `className`   | `string`                                                                                                                           | —       | Additional CSS classes for the navbar.                 |
| `textColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                            | —       | Text color for the navbar.                             |
| `color`       | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'dark'` \| `'light'` \| `'white'` | —       | Bulma color modifier for the navbar.                   |
| `bgColor`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                            | —       | Background color for the navbar.                       |
| `transparent` | `boolean`                                                                                                                          | `false` | Renders the navbar with a transparent background.      |
| `fixed`       | `'top'` \| `'bottom'`                                                                                                              | —       | Fixes the navbar to the top or bottom of the viewport. |
| `children`    | `React.ReactNode`                                                                                                                  | —       | Navbar content (compose with subcomponents).           |
| `...`         | All standard HTML attributes and Bulma helper props                                                                                | —       | See [Helper Props](../helpers/usebulmaclasses.md)      |

**Subcomponents:**

- `Navbar.Brand`: For logo and branding (left side)
- `Navbar.Item`: Navigation links, buttons, or custom content
- `Navbar.Link`: Dropdown trigger with arrow indicator (use as first child of `Navbar.Dropdown`)
- `Navbar.Burger`: Responsive menu toggle (mobile)
- `Navbar.Menu`: Collapsible content (contains `Navbar.Start` and `Navbar.End`)
- `Navbar.Start`: Left-aligned menu area
- `Navbar.End`: Right-aligned menu area
- `Navbar.Dropdown`: Dropdown parent (with options for hover, up, right, active)
- `Navbar.DropdownMenu`: Dropdown menu container
- `Navbar.Divider`: Divider in dropdown menus.

### Navbar.Brand

| Prop        | Type                                                                            | Default | Description                                       |
| ----------- | ------------------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `className` | `string`                                                                        | —       | Additional CSS classes.                           |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Text color for the brand.                         |
| `color`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Bulma color modifier for the brand.               |
| `children`  | `React.ReactNode`                                                               | —       | Brand content.                                    |
| `...`       | All standard `<div>` attributes and Bulma helper props                          | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### Navbar.Item

| Prop        | Type                                                                    | Default | Description                                         |
| ----------- | ----------------------------------------------------------------------- | ------- | --------------------------------------------------- |
| `className` | `string`                                                                | —       | Additional CSS classes.                             |
| `as`        | `React.ElementType`                                                     | `'a'`   | Render as a custom component (e.g., a router link). |
| `active`    | `boolean`                                                               | `false` | Whether the item is active.                         |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color for the item.                            |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color for the item.                      |
| `children`  | `React.ReactNode`                                                       | —       | Navbar item content.                                |
| `...`       | All standard `<a>` attributes and Bulma helper props                    | —       | See [Helper Props](../helpers/usebulmaclasses.md)   |

### Navbar.Link

| Prop        | Type                                                                    | Default | Description                                       |
| ----------- | ----------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `className` | `string`                                                                | —       | Additional CSS classes.                           |
| `as`        | `React.ElementType`                                                     | `'a'`   | Render as a custom component (default: 'a').      |
| `arrowless` | `boolean`                                                               | `false` | Remove the dropdown arrow indicator.              |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color.                                       |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color.                                 |
| `children`  | `React.ReactNode`                                                       | —       | Link content.                                     |
| `...`       | All standard `<a>` attributes and Bulma helper props                    | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### Navbar.Burger

| Prop            | Type                                                                            | Default | Description                                       |
| --------------- | ------------------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `className`     | `string`                                                                        | —       | Additional CSS classes.                           |
| `textColor`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Text color for the burger.                        |
| `color`         | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Bulma color modifier for the burger.              |
| `active`        | `boolean`                                                                       | `false` | Whether the burger is active.                     |
| `children`      | `React.ReactNode`                                                               | —       | Custom content inside the burger.                 |
| `aria-label`    | `string`                                                                        | —       | Aria label for accessibility.                     |
| `aria-expanded` | `boolean`                                                                       | `false` | Aria expanded state.                              |
| `onClick`       | `React.MouseEventHandler<HTMLButtonElement>`                                    | —       | Click handler.                                    |
| `...`           | All standard `<button>` attributes and Bulma helper props                       | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### Navbar.Menu

| Prop        | Type                                                                            | Default | Description                                       |
| ----------- | ------------------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `className` | `string`                                                                        | —       | Additional CSS classes.                           |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Text color for the menu.                          |
| `color`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Bulma color modifier for the menu.                |
| `active`    | `boolean`                                                                       | `false` | Whether the menu is active.                       |
| `children`  | `React.ReactNode`                                                               | —       | Menu content.                                     |
| `...`       | All standard `<div>` attributes and Bulma helper props                          | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### Navbar.Start

| Prop        | Type                                                                            | Default | Description                                       |
| ----------- | ------------------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `className` | `string`                                                                        | —       | Additional CSS classes.                           |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Text color.                                       |
| `color`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Bulma color modifier.                             |
| `children`  | `React.ReactNode`                                                               | —       | Content.                                          |
| `...`       | All standard `<div>` attributes and Bulma helper props                          | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### Navbar.End

| Prop        | Type                                                                            | Default | Description                                       |
| ----------- | ------------------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `className` | `string`                                                                        | —       | Additional CSS classes.                           |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Text color.                                       |
| `color`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Bulma color modifier.                             |
| `children`  | `React.ReactNode`                                                               | —       | Content.                                          |
| `...`       | All standard `<div>` attributes and Bulma helper props                          | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### Navbar.Dropdown

| Prop             | Type                            | Default | Description                                  |
| ---------------- | ------------------------------- | ------- | -------------------------------------------- |
| `className`      | `string`                        | —       | Additional CSS classes.                      |
| `right`          | `boolean`                       | `false` | Dropdown aligned right.                      |
| `up`             | `boolean`                       | `false` | Dropdown opens upwards.                      |
| `hoverable`      | `boolean`                       | `false` | Dropdown opens on hover.                     |
| `active`         | `boolean`                       | `false` | Dropdown is open.                            |
| `onActiveChange` | `(active: boolean) => void`     | —       | Callback when dropdown active state changes. |
| `children`       | `React.ReactNode`               | —       | Dropdown content.                            |
| `...`            | All standard `<div>` attributes | —       |                                              |

### Navbar.DropdownMenu

| Prop        | Type                            | Default | Description             |
| ----------- | ------------------------------- | ------- | ----------------------- |
| `className` | `string`                        | —       | Additional CSS classes. |
| `right`     | `boolean`                       | `false` | Dropdown aligned right. |
| `up`        | `boolean`                       | `false` | Dropdown opens upwards. |
| `children`  | `React.ReactNode`               | —       | Dropdown menu content.  |
| `...`       | All standard `<div>` attributes | —       |                         |

<!-- /bestax:generated props -->

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Navbar` registers these variables on its own `.navbar` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                    | Sass Variable                            | Default                                                                                                                                                                                                |
| ----------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--bulma-navbar-height`                         | `$navbar-height`                         | `3.25rem`                                                                                                                                                                                              |
| `--bulma-navbar-h`                              | `$navbar-h`                              | `var(--bulma-scheme-h)`                                                                                                                                                                                |
| `--bulma-navbar-s`                              | `$navbar-s`                              | `var(--bulma-scheme-s)`                                                                                                                                                                                |
| `--bulma-navbar-l`                              | `$navbar-l`                              | `var(--bulma-scheme-main-l)`                                                                                                                                                                           |
| `--bulma-navbar-background-color`               | `$navbar-background-color`               | `var(--bulma-scheme-main)`                                                                                                                                                                             |
| `--bulma-navbar-box-shadow-size`                | `$navbar-box-shadow-size`                | `0 0.125em 0 0`                                                                                                                                                                                        |
| `--bulma-navbar-box-shadow-color`               | `$navbar-box-shadow-color`               | `var(--bulma-background)`                                                                                                                                                                              |
| `--bulma-navbar-padding-vertical`               | `$navbar-padding-vertical`               | `1rem`                                                                                                                                                                                                 |
| `--bulma-navbar-padding-horizontal`             | `$navbar-padding-horizontal`             | `2rem`                                                                                                                                                                                                 |
| `--bulma-navbar-z`                              | `$navbar-z`                              | `30`                                                                                                                                                                                                   |
| `--bulma-navbar-fixed-z`                        | `$navbar-fixed-z`                        | `30`                                                                                                                                                                                                   |
| `--bulma-navbar-item-background-a`              | `$navbar-item-background-a`              | `0`                                                                                                                                                                                                    |
| `--bulma-navbar-item-background-l`              | `$navbar-item-background-l`              | `var(--bulma-scheme-main-l)`                                                                                                                                                                           |
| `--bulma-navbar-item-background-l-delta`        | `$navbar-item-background-l-delta`        | `0%`                                                                                                                                                                                                   |
| `--bulma-navbar-item-hover-background-l-delta`  | `$navbar-item-hover-background-l-delta`  | `var(--bulma-hover-background-l-delta)`                                                                                                                                                                |
| `--bulma-navbar-item-active-background-l-delta` | `$navbar-item-active-background-l-delta` | `var(--bulma-active-background-l-delta)`                                                                                                                                                               |
| `--bulma-navbar-item-color-l`                   | `$navbar-item-color-l`                   | `var(--bulma-text-l)`                                                                                                                                                                                  |
| `--bulma-navbar-item-color`                     | `$navbar-item-color`                     | `hsl(var(--bulma-navbar-h), var(--bulma-navbar-s), var(--bulma-navbar-item-color-l))`                                                                                                                  |
| `--bulma-navbar-item-selected-h`                | `$navbar-item-selected-h`                | `var(--bulma-link-h)`                                                                                                                                                                                  |
| `--bulma-navbar-item-selected-s`                | `$navbar-item-selected-s`                | `var(--bulma-link-s)`                                                                                                                                                                                  |
| `--bulma-navbar-item-selected-l`                | `$navbar-item-selected-l`                | `var(--bulma-link-l)`                                                                                                                                                                                  |
| `--bulma-navbar-item-selected-background-l`     | `$navbar-item-selected-background-l`     | `var(--bulma-link-l)`                                                                                                                                                                                  |
| `--bulma-navbar-item-selected-color-l`          | `$navbar-item-selected-color-l`          | `var(--bulma-link-invert-l)`                                                                                                                                                                           |
| `--bulma-navbar-item-img-max-height`            | `$navbar-item-img-max-height`            | `1.75rem`                                                                                                                                                                                              |
| `--bulma-navbar-burger-color`                   | `$navbar-burger-color`                   | `var(--bulma-link)`                                                                                                                                                                                    |
| `--bulma-navbar-tab-hover-background-color`     | `$navbar-tab-hover-background-color`     | `transparent`                                                                                                                                                                                          |
| `--bulma-navbar-tab-hover-border-bottom-color`  | `$navbar-tab-hover-border-bottom-color`  | `var(--bulma-link)`                                                                                                                                                                                    |
| `--bulma-navbar-tab-active-color`               | `$navbar-tab-active-color`               | `var(--bulma-link)`                                                                                                                                                                                    |
| `--bulma-navbar-tab-active-background-color`    | `$navbar-tab-active-background-color`    | `transparent`                                                                                                                                                                                          |
| `--bulma-navbar-tab-active-border-bottom-color` | `$navbar-tab-active-border-bottom-color` | `var(--bulma-link)`                                                                                                                                                                                    |
| `--bulma-navbar-tab-active-border-bottom-style` | `$navbar-tab-active-border-bottom-style` | `solid`                                                                                                                                                                                                |
| `--bulma-navbar-tab-active-border-bottom-width` | `$navbar-tab-active-border-bottom-width` | `0.1875em`                                                                                                                                                                                             |
| `--bulma-navbar-dropdown-background-color`      | `$navbar-dropdown-background-color`      | `var(--bulma-scheme-main)`                                                                                                                                                                             |
| `--bulma-navbar-dropdown-border-l`              | `$navbar-dropdown-border-l`              | `var(--bulma-border-l)`                                                                                                                                                                                |
| `--bulma-navbar-dropdown-border-color`          | `$navbar-dropdown-border-color`          | `hsl(var(--bulma-navbar-h), var(--bulma-navbar-s), var(--bulma-navbar-dropdown-border-l))`                                                                                                             |
| `--bulma-navbar-dropdown-border-style`          | `$navbar-dropdown-border-style`          | `solid`                                                                                                                                                                                                |
| `--bulma-navbar-dropdown-border-width`          | `$navbar-dropdown-border-width`          | `0.125em`                                                                                                                                                                                              |
| `--bulma-navbar-dropdown-offset`                | `$navbar-dropdown-offset`                | `-0.25em`                                                                                                                                                                                              |
| `--bulma-navbar-dropdown-arrow`                 | `$navbar-dropdown-arrow`                 | `var(--bulma-link)`                                                                                                                                                                                    |
| `--bulma-navbar-dropdown-radius`                | `$navbar-dropdown-radius`                | `var(--bulma-radius-large)`                                                                                                                                                                            |
| `--bulma-navbar-dropdown-z`                     | `$navbar-dropdown-z`                     | `20`                                                                                                                                                                                                   |
| `--bulma-navbar-dropdown-boxed-radius`          | `$navbar-dropdown-boxed-radius`          | `var(--bulma-radius-large)`                                                                                                                                                                            |
| `--bulma-navbar-dropdown-boxed-shadow`          | `$navbar-dropdown-boxed-shadow`          | `0 0.5em 0.5em hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-invert-l), 0.1), 0 0 0 1px hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-invert-l), 0.1)` |
| `--bulma-navbar-dropdown-item-h`                | `$navbar-dropdown-item-h`                | `var(--bulma-scheme-h)`                                                                                                                                                                                |
| `--bulma-navbar-dropdown-item-s`                | `$navbar-dropdown-item-s`                | `var(--bulma-scheme-s)`                                                                                                                                                                                |
| `--bulma-navbar-dropdown-item-l`                | `$navbar-dropdown-item-l`                | `var(--bulma-scheme-main-l)`                                                                                                                                                                           |
| `--bulma-navbar-dropdown-item-background-l`     | `$navbar-dropdown-item-background-l`     | `var(--bulma-scheme-main-l)`                                                                                                                                                                           |
| `--bulma-navbar-dropdown-item-color-l`          | `$navbar-dropdown-item-color-l`          | `var(--bulma-text-l)`                                                                                                                                                                                  |
| `--bulma-navbar-divider-background-l`           | `$navbar-divider-background-l`           | `var(--bulma-background-l)`                                                                                                                                                                            |
| `--bulma-navbar-divider-height`                 | `$navbar-divider-height`                 | `0.125em`                                                                                                                                                                                              |
| `--bulma-navbar-bottom-box-shadow-size`         | `$navbar-bottom-box-shadow-size`         | `0 -0.125em 0 0`                                                                                                                                                                                       |

<!-- /bestax:generated cssvars -->
