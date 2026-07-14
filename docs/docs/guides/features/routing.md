---
title: Routing Integration
sidebar_label: Routing
sidebar_position: 6
---

# Routing Integration

How to wire bestax-bulma components to a client-side router — React Router, Next.js, TanStack
Router, or any library whose navigation primitive is a component you render `as`. This page
covers the three first-hour questions: making `Navbar.Item`/`Menu.Item` navigate, making a
`Button` navigate, and styling the active route.

All examples use React Router v6/v7 (`react-router-dom`); the Next.js differences are at the
end.

## Menu items as router links

`Menu.Item` supports routers out of the box — pass the router's link component via `as`, and
`to` (or any other router prop) is forwarded to it. Its prop type accepts extra keys, so this
compiles without errors or casts (though the extra props aren't validated against the router's
own types):

```tsx
import { Link } from 'react-router-dom';
import { Menu } from '@allxsmith/bestax-bulma';

<Menu>
  <Menu.Label>General</Menu.Label>
  <Menu.List>
    <Menu.Item as={Link} to="/dashboard" active>
      Dashboard
    </Menu.Item>
    <Menu.Item as={Link} to="/customers">
      Customers
    </Menu.Item>
  </Menu.List>
</Menu>;
```

## Navbar items as router links

`Navbar.Item` accepts `as={Link}` the same way, and at runtime every extra prop (including
`to`) is forwarded to your link component. In **TypeScript**, however, `to` isn't part of
`Navbar.Item`'s prop type (it extends anchor attributes), so `<Navbar.Item as={Link} to="…">`
is a type error today. The recommended pattern is a one-line typed alias, declared once:

```tsx
import { Link, LinkProps } from 'react-router-dom';
import { Navbar } from '@allxsmith/bestax-bulma';

// One cast, reused everywhere — runtime behavior is unchanged.
const NavbarLink = Navbar.Item as React.FC<
  React.ComponentProps<typeof Navbar.Item> & LinkProps
>;

<Navbar color="dark">
  <Navbar.Menu active={open}>
    <Navbar.Start>
      <NavbarLink as={Link} to="/">
        Home
      </NavbarLink>
      <NavbarLink as={Link} to="/pricing">
        Pricing
      </NavbarLink>
    </Navbar.Start>
  </Navbar.Menu>
</Navbar>;
```

(Plain-JavaScript apps can skip the alias — `<Navbar.Item as={Link} to="/pricing">` just
works.)

## Buttons that navigate

`Button`'s `as` prop is polymorphic (any `React.ElementType`), so the same two options apply:

```tsx
import { Link, LinkProps, useNavigate } from 'react-router-dom';
import { Button, ButtonProps } from '@allxsmith/bestax-bulma';

// Option 1 — render the Button AS the router link (typed alias, once):
const ButtonLink = Button as React.FC<ButtonProps & LinkProps>;

<ButtonLink as={Link} to="/signup" color="primary" size="large">
  Get started
</ButtonLink>;

// Option 2 — keep a real <button> and navigate imperatively:
function DemoButton() {
  const navigate = useNavigate();
  return (
    <Button color="primary" onClick={() => navigate('/demo')}>
      Live demo
    </Button>
  );
}
```

Prefer Option 1 for real navigation (it renders an anchor — right-click, middle-click, and
crawlers work); use Option 2 when navigation is a side effect of app logic (after a form
submit, a confirmation). For plain external URLs, no router is needed:
`<Button as="a" href="https://example.com">Docs</Button>`.

## Active-route styling

`Navbar.Item` and `Menu.Item` both take an `active` boolean — drive it from the router:

```tsx
import { Link, useLocation } from 'react-router-dom';

function SideNav() {
  const { pathname } = useLocation();
  return (
    <Menu>
      <Menu.List>
        <Menu.Item as={Link} to="/dashboard" active={pathname === '/dashboard'}>
          Dashboard
        </Menu.Item>
        <Menu.Item
          as={Link}
          to="/customers"
          active={
            pathname === '/customers' || pathname.startsWith('/customers/')
          }
        >
          Customers
        </Menu.Item>
      </Menu.List>
    </Menu>
  );
}
```

React Router's `NavLink` also works via `as` — but its function-style `className`/`children`
props bypass the components' own class handling, so the explicit `active` prop with
`useLocation` is the pattern that keeps Bulma's `is-active` styling.

## Next.js

Modern Next.js `<Link>` (13+) renders the anchor itself and uses **`href`** — which is already
in `Navbar.Item`'s prop type, so no alias is needed:

```tsx
import NextLink from 'next/link';

<Navbar.Item as={NextLink} href="/pricing">
  Pricing
</Navbar.Item>;
```

Version notes: Next.js 13–15 also still accepted the deprecated `legacyBehavior`/`passHref`
props; **Next.js 16 removes them**, so the `as={NextLink}` pattern above is the way forward.
On Next.js **before 13**, `<Link>` required an `<a>` child by default — wrap instead:

```tsx
<NextLink href="/pricing" passHref>
  <Navbar.Item as="a">Pricing</Navbar.Item>
</NextLink>
```

## Related

- [Navbar](../../api/components/navbar.md) · [Menu](../../api/components/menu.md) ·
  [Button](../../api/elements/button.md)
- `Button`/`Link` polymorphism landed in [#238](https://github.com/allxsmith/bestax/pull/238);
  first-class `to` typing on `Navbar.Item` (dropping the cast alias above) is tracked in
  [#306](https://github.com/allxsmith/bestax/issues/306).
