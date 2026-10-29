import { useState } from 'react';
import { Outlet } from '@tanstack/react-router';
import { Navbar } from '@allxsmith/bestax-bulma';
import NavbarLink from './NavbarLink.tsx';

// Every page shares this navbar. TanStack marks any link to the current page
// with aria-current, so the logo isn't a link: Home is the one way home, and
// the one item marked current there.
function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <Navbar>
        <Navbar.Brand>
          <Navbar.Item as="span">
            <img src="/bestax.svg" alt="Bestax logo" width="28" height="28" />
          </Navbar.Item>
          <Navbar.Burger
            active={menuOpen}
            onClick={() => setMenuOpen(open => !open)}
          />
        </Navbar.Brand>
        <Navbar.Menu active={menuOpen}>
          <Navbar.Start>
            <NavbarLink
              to="/"
              activeOptions={{ exact: true }}
              activeProps={{ active: true }}
              onClick={closeMenu}
            >
              Home
            </NavbarLink>
            <NavbarLink
              to="/about"
              activeProps={{ active: true }}
              onClick={closeMenu}
            >
              About
            </NavbarLink>
          </Navbar.Start>
        </Navbar.Menu>
      </Navbar>
      <Outlet />
    </>
  );
}

export default Layout;
