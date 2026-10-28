import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { Navbar } from '@allxsmith/bestax-bulma';

// Every page shares this navbar. Each item renders the router's Link through
// `as`, and `active` and `aria-current` follow the location, as the routing
// guide shows: https://bestax.io/docs/guides/features/routing
const PAGES = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
];

function Layout() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <Navbar>
        <Navbar.Brand>
          <Navbar.Item as={Link} to="/" onClick={closeMenu}>
            <img src="/bestax.svg" alt="Bestax home" width="28" height="28" />
          </Navbar.Item>
          <Navbar.Burger
            active={menuOpen}
            onClick={() => setMenuOpen(open => !open)}
          />
        </Navbar.Brand>
        <Navbar.Menu active={menuOpen}>
          <Navbar.Start>
            {PAGES.map(({ to, label }) => (
              <Navbar.Item
                key={to}
                as={Link}
                to={to}
                active={pathname === to}
                aria-current={pathname === to ? 'page' : undefined}
                onClick={closeMenu}
              >
                {label}
              </Navbar.Item>
            ))}
          </Navbar.Start>
        </Navbar.Menu>
      </Navbar>
      <Outlet />
    </>
  );
}

export default Layout;
